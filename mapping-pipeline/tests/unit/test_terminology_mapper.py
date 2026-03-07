"""Unit tests for src.terminology_mapper -- Tier 1 terminology server mapping."""
import pytest
from unittest.mock import patch, MagicMock, Mock

from src.models import SourceRecord, MappingResult
from src.terminology_mapper import TerminologyMapper


FHIR_SERVER_URL = "http://localhost:8080/fhir"


@pytest.fixture
def mapper():
    """Create a TerminologyMapper instance."""
    return TerminologyMapper(FHIR_SERVER_URL)


class TestTerminologyMapperInit:
    """Tests for TerminologyMapper initialisation."""

    def test_mapper_init(self):
        """TerminologyMapper stores the FHIR server URL (trailing slash stripped)."""
        m = TerminologyMapper("http://example.com/fhir/")
        assert m.fhir_server_url == "http://example.com/fhir"

    def test_mapper_init_no_trailing_slash(self):
        """TerminologyMapper handles URLs without trailing slash."""
        m = TerminologyMapper("http://example.com/fhir")
        assert m.fhir_server_url == "http://example.com/fhir"


class TestMapRecordWithExistingCode:
    """Tests for mapping records that already carry a standard code."""

    @patch("src.terminology_mapper.requests.get")
    def test_map_record_with_existing_snomed_code(self, mock_get, mapper):
        """A record with a valid snomed_code in raw_data maps with high confidence."""
        # Mock the validate-code response as valid
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            "parameter": [
                {"name": "result", "valueBoolean": True},
                {"name": "display", "valueString": "Abdominal aortic aneurysm"},
            ]
        }
        mock_get.return_value = mock_response

        record = SourceRecord(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            raw_data={
                "TERMID": "214",
                "snomed_code": "233985008",
                "snomed_display": "Abdominal aortic aneurysm",
            },
        )

        result = mapper.map_record(record)

        assert result.status == "mapped"
        assert result.target_code == "233985008"
        assert result.mapping_tier == 1
        assert result.confidence == 0.9
        assert result.target_system == "http://snomed.info/sct"


class TestMapRecordServerUnavailable:
    """Tests for graceful handling when the terminology server is unavailable."""

    @patch("src.terminology_mapper.requests.get")
    def test_map_record_unmapped_when_server_unavailable(self, mock_get, mapper):
        """When the FHIR server is unreachable, map_record returns unmapped without crashing."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        record = SourceRecord(
            entity_type="Conditions",
            source_code="999",
            source_display="Unknown Condition",
        )

        result = mapper.map_record(record)

        assert isinstance(result, MappingResult)
        assert result.status == "unmapped"
        assert result.target_code is None


class TestMapRecordsBatch:
    """Tests for batch mapping."""

    @patch("src.terminology_mapper.requests.get")
    def test_map_records_batch(self, mock_get, mapper):
        """map_records processes all records and returns a result for each."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        records = [
            SourceRecord(
                entity_type="Conditions",
                source_code=str(i),
                source_display=f"Condition {i}",
            )
            for i in range(5)
        ]

        results = mapper.map_records(records)

        assert isinstance(results, list)
        assert len(results) == 5
        for r in results:
            assert isinstance(r, MappingResult)


class TestSearchSnomed:
    """Tests for the _search_snomed private method."""

    @patch("src.terminology_mapper.requests.get")
    def test_search_snomed_returns_none_on_connection_error(self, mock_get, mapper):
        """_search_snomed returns None when the server is unreachable."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        result = mapper._search_snomed("Diabetes")

        assert result is None

    @patch("src.terminology_mapper.requests.get")
    def test_search_snomed_returns_code_on_success(self, mock_get, mapper):
        """_search_snomed returns (code, display) tuple on a successful search."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            "expansion": {
                "contains": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "73211009",
                        "display": "Diabetes mellitus",
                    }
                ]
            }
        }
        mock_get.return_value = mock_response

        result = mapper._search_snomed("Diabetes")

        assert result is not None
        assert result == ("73211009", "Diabetes mellitus")


class TestValidateCode:
    """Tests for the _validate_code private method."""

    @patch("src.terminology_mapper.requests.get")
    def test_validate_code_returns_false_on_connection_error(self, mock_get, mapper):
        """_validate_code returns False when the server is unreachable."""
        import requests as req_lib

        mock_get.side_effect = req_lib.ConnectionError("Connection refused")

        result = mapper._validate_code("http://snomed.info/sct", "12345")

        assert result is False

    @patch("src.terminology_mapper.requests.get")
    def test_validate_code_returns_true_for_valid_code(self, mock_get, mapper):
        """_validate_code returns True when the server validates the code."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            "parameter": [{"name": "result", "valueBoolean": True}]
        }
        mock_get.return_value = mock_response

        result = mapper._validate_code("http://snomed.info/sct", "73211009")

        assert result is True
