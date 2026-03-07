"""Unit tests for src.fhir_loader -- FHIR server resource loading."""
import pytest
from unittest.mock import patch, MagicMock, Mock

from src.fhir_loader import FHIRLoader


FHIR_SERVER_URL = "http://localhost:8080/fhir"


@pytest.fixture
def loader():
    """Create a FHIRLoader instance."""
    return FHIRLoader(FHIR_SERVER_URL)


def _sample_condition_resource():
    """Create a sample FHIR Condition resource dict."""
    return {
        "resourceType": "Condition",
        "id": "condition-abc123",
        "clinicalStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                }
            ]
        },
        "code": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": "233985008",
                    "display": "Abdominal aortic aneurysm",
                }
            ],
            "text": "AAA",
        },
        "subject": {"reference": "Patient/example"},
    }


def _sample_procedure_resource():
    """Create a sample FHIR Procedure resource dict."""
    return {
        "resourceType": "Procedure",
        "id": "procedure-def456",
        "status": "completed",
        "code": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": "80146002",
                    "display": "Appendectomy",
                }
            ],
            "text": "Appendectomy",
        },
        "subject": {"reference": "Patient/example"},
    }


class TestFHIRLoaderInit:
    """Tests for FHIRLoader initialisation."""

    def test_loader_init(self):
        """FHIRLoader stores the FHIR server URL with trailing slash stripped."""
        ldr = FHIRLoader("http://example.com/fhir/")
        assert ldr.fhir_server_url == "http://example.com/fhir"


class TestLoadResource:
    """Tests for loading individual resources."""

    @patch("src.fhir_loader.requests.put")
    def test_load_resource_success(self, mock_put, loader):
        """A successful PUT returns a success status dict."""
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_put.return_value = mock_response

        resource = _sample_condition_resource()
        result = loader.load_resource(resource)

        assert result["status"] == "success"
        assert result["resource_type"] == "Condition"
        assert result["id"] == "condition-abc123"
        assert result["status_code"] == 201

        # Verify the PUT was called with the correct URL
        mock_put.assert_called_once()
        call_args = mock_put.call_args
        assert "Condition/condition-abc123" in call_args[0][0]

    @patch("src.fhir_loader.requests.put")
    def test_load_resource_connection_error(self, mock_put, loader):
        """A connection error returns an error status without crashing."""
        import requests as req_lib

        mock_put.side_effect = req_lib.ConnectionError("Connection refused")

        resource = _sample_condition_resource()
        result = loader.load_resource(resource)

        assert result["status"] == "error"
        assert result["resource_type"] == "Condition"
        assert "error" in result
        assert "Connection error" in result["error"]

    @patch("src.fhir_loader.requests.put")
    def test_load_resource_server_error(self, mock_put, loader):
        """A 500 server error returns an error status dict."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json.return_value = {
            "issue": [
                {"diagnostics": "Internal server error"}
            ]
        }
        mock_response.text = "Internal Server Error"
        mock_put.return_value = mock_response

        resource = _sample_condition_resource()
        result = loader.load_resource(resource)

        assert result["status"] == "error"
        assert result["status_code"] == 500

    def test_load_resource_missing_resource_type(self, loader):
        """A resource without resourceType returns an error."""
        resource = {"id": "test-1"}
        result = loader.load_resource(resource)

        assert result["status"] == "error"
        assert "resourceType" in result.get("error", "")


class TestLoadBatch:
    """Tests for batch loading."""

    @patch("src.fhir_loader.requests.put")
    def test_load_batch_counts(self, mock_put, loader):
        """Batch loading tracks success and failure counts."""
        # First call succeeds, second fails
        mock_success = MagicMock()
        mock_success.status_code = 201

        mock_failure = MagicMock()
        mock_failure.status_code = 422
        mock_failure.json.return_value = {
            "issue": [{"diagnostics": "Validation failed"}]
        }
        mock_failure.text = "Unprocessable Entity"

        mock_put.side_effect = [mock_success, mock_failure]

        resources = [_sample_condition_resource(), _sample_procedure_resource()]
        result = loader.load_batch(resources)

        assert result["total"] == 2
        assert result["success"] == 1
        assert result["failed"] == 1
        assert len(result["errors"]) == 1

    @patch("src.fhir_loader.requests.put")
    def test_load_batch_all_success(self, mock_put, loader):
        """Batch loading with all successes."""
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_put.return_value = mock_response

        resources = [_sample_condition_resource(), _sample_procedure_resource()]
        result = loader.load_batch(resources)

        assert result["total"] == 2
        assert result["success"] == 2
        assert result["failed"] == 0
        assert result["errors"] == []

    @patch("src.fhir_loader.requests.put")
    def test_load_batch_empty(self, mock_put, loader):
        """Batch loading with an empty list."""
        result = loader.load_batch([])

        assert result["total"] == 0
        assert result["success"] == 0
        assert result["failed"] == 0


class TestLoadBundle:
    """Tests for FHIR transaction Bundle loading."""

    @patch("src.fhir_loader.requests.post")
    def test_load_bundle_creates_transaction(self, mock_post, loader):
        """load_bundle creates a valid FHIR transaction Bundle structure."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        resources = [_sample_condition_resource(), _sample_procedure_resource()]
        result = loader.load_bundle(resources)

        assert result["status"] == "success"
        assert result["total"] == 2

        # Verify the Bundle structure was POSTed
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        bundle = call_kwargs[1]["json"] if "json" in call_kwargs[1] else call_kwargs.kwargs["json"]

        assert bundle["resourceType"] == "Bundle"
        assert bundle["type"] == "transaction"
        assert len(bundle["entry"]) == 2

        # Verify each entry has the correct request method
        for entry in bundle["entry"]:
            assert entry["request"]["method"] == "PUT"
            assert "resource" in entry

    @patch("src.fhir_loader.requests.post")
    def test_load_bundle_connection_error(self, mock_post, loader):
        """Bundle loading handles connection errors gracefully."""
        import requests as req_lib

        mock_post.side_effect = req_lib.ConnectionError("Connection refused")

        resources = [_sample_condition_resource()]
        result = loader.load_bundle(resources)

        assert result["status"] == "error"
        assert "Connection error" in result["error"]


class TestVerifyResource:
    """Tests for resource verification."""

    @patch("src.fhir_loader.requests.get")
    def test_verify_resource_exists(self, mock_get, loader):
        """Verifying an existing resource returns its dict."""
        expected_resource = _sample_condition_resource()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_resource
        mock_get.return_value = mock_response

        result = loader.verify_resource("Condition", "condition-abc123")

        assert result is not None
        assert result["resourceType"] == "Condition"

    @patch("src.fhir_loader.requests.get")
    def test_verify_resource_not_found(self, mock_get, loader):
        """Verifying a non-existent resource returns None."""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        result = loader.verify_resource("Condition", "nonexistent")

        assert result is None

    @patch("src.fhir_loader.requests.get")
    def test_verify_resource_connection_error(self, mock_get, loader):
        """Verifying a resource when the server is down returns None."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        result = loader.verify_resource("Condition", "test-123")

        assert result is None


class TestGetResourceCount:
    """Tests for getting resource counts from the server."""

    @patch("src.fhir_loader.requests.get")
    def test_get_resource_count(self, mock_get, loader):
        """get_resource_count returns the total from a FHIR search response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"total": 42}
        mock_get.return_value = mock_response

        count = loader.get_resource_count("Condition")

        assert count == 42

        # Verify _summary=count was passed
        call_args = mock_get.call_args
        params = call_args[1].get("params", call_args.kwargs.get("params", {}))
        assert params.get("_summary") == "count"

    @patch("src.fhir_loader.requests.get")
    def test_get_resource_count_error(self, mock_get, loader):
        """get_resource_count returns 0 on connection error."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        count = loader.get_resource_count("Condition")

        assert count == 0
