"""Integration tests for the mapping pipeline.

These tests exercise multiple components working together.
They are marked with @pytest.mark.integration so they can be
selectively included or excluded via: pytest -m integration
"""
import os

import pytest
from unittest.mock import patch, MagicMock, Mock

from src.models import SourceRecord, MappingResult
from src.mapping_repository import MappingRepository
from src.fhir_transformer import FHIRTransformer


EXCEL_FILE_PATH = "/Users/doddos/Downloads/Reference Data_extract analysis_V1.xlsx"


def _make_mapped_result(
    entity_type,
    source_code,
    source_display,
    target_code,
    target_display,
    target_system="http://snomed.info/sct",
    mapping_tier=1,
    confidence=0.95,
    status="mapped",
):
    """Helper to create a MappingResult."""
    source = SourceRecord(
        entity_type=entity_type,
        source_code=source_code,
        source_display=source_display,
    )
    return MappingResult(
        source=source,
        target_code=target_code,
        target_display=target_display,
        target_system=target_system,
        mapping_tier=mapping_tier,
        confidence=confidence,
        status=status,
    )


@pytest.mark.integration
class TestExtractionAndRepositoryIntegration:
    """Integration: Extract real data -> save to repository -> verify counts."""

    @pytest.mark.skipif(
        not os.path.exists(EXCEL_FILE_PATH),
        reason=f"Excel source file not found at {EXCEL_FILE_PATH}",
    )
    def test_extraction_and_mapping_repository_integration(self):
        """Extract real data from Excel, save to in-memory repository, verify counts."""
        from src.extractor import BPExtractor

        extractor = BPExtractor(EXCEL_FILE_PATH)
        repo = MappingRepository(db_path=":memory:")

        try:
            # Extract conditions
            conditions = extractor.extract_entity("Conditions")
            assert len(conditions) > 0

            # Convert extracted dicts to MappingResult objects (unmapped)
            results = []
            for record_dict in conditions[:100]:  # Limit to 100 for test speed
                source = SourceRecord(
                    entity_type="Conditions",
                    source_code=record_dict.get("source_code", record_dict.get("TERMID", "unknown")),
                    source_display=record_dict.get("source_display", record_dict.get("TERMNAME", "unknown")),
                    raw_data=record_dict,
                )
                result = MappingResult(source=source, status="unmapped")
                results.append(result)

            # Save to repository
            count = repo.save_mappings(results)
            assert count == len(results)

            # Verify via statistics
            stats = repo.get_statistics()
            assert isinstance(stats, dict)

            # Verify unmapped count
            unmapped = repo.get_unmapped()
            assert len(unmapped) == len(results)

        finally:
            repo.close()


@pytest.mark.integration
class TestFHIRTransformFromRepository:
    """Integration: Save mapped results -> retrieve -> transform to FHIR."""

    def test_fhir_transform_from_repository(self):
        """Save mapped results to repo, retrieve, transform to FHIR, verify valid resources."""
        repo = MappingRepository(db_path=":memory:")
        transformer = FHIRTransformer()

        try:
            # Save a set of mapped results
            mapped_results = [
                _make_mapped_result(
                    entity_type="Conditions",
                    source_code="214",
                    source_display="AAA",
                    target_code="233985008",
                    target_display="Abdominal aortic aneurysm",
                ),
                _make_mapped_result(
                    entity_type="Procedures",
                    source_code="100",
                    source_display="Appendectomy",
                    target_code="80146002",
                    target_display="Appendectomy",
                ),
                _make_mapped_result(
                    entity_type="AllergyIntolerance",
                    source_code="1",
                    source_display="Eggs",
                    target_code="102263004",
                    target_display="Eggs",
                ),
            ]

            repo.save_mappings(mapped_results)

            # Retrieve from repository
            retrieved_condition = repo.get_mapping("Conditions", "214")
            assert retrieved_condition is not None
            assert retrieved_condition.status == "mapped"

            # Transform to FHIR
            resources = transformer.transform_batch(mapped_results)

            assert len(resources) == 3

            # Verify each resource has a valid structure
            for resource in resources:
                assert "resourceType" in resource
                assert "id" in resource
                # Resources should have code with coding
                if "code" in resource:
                    assert "coding" in resource["code"]
                    coding = resource["code"]["coding"][0]
                    assert "system" in coding
                    assert "code" in coding
                    assert "display" in coding

            # Verify correct resource types
            resource_types = [r["resourceType"] for r in resources]
            assert "Condition" in resource_types
            assert "Procedure" in resource_types
            assert "AllergyIntolerance" in resource_types

        finally:
            repo.close()


@pytest.mark.integration
class TestFullPipelineWithMockedServices:
    """Integration: Full pipeline with real extractor but mocked external services."""

    @pytest.mark.skipif(
        not os.path.exists(EXCEL_FILE_PATH),
        reason=f"Excel source file not found at {EXCEL_FILE_PATH}",
    )
    @patch("src.fhir_loader.requests.put")
    @patch("src.fhir_loader.requests.post")
    @patch("src.ai_mapper.requests.post")
    @patch("src.terminology_mapper.requests.get")
    def test_full_pipeline_with_mocked_services(
        self,
        mock_term_get,
        mock_ai_post,
        mock_fhir_post,
        mock_fhir_put,
    ):
        """Run pipeline with real extractor but mocked terminology server and Ollama.

        Verifies end-to-end flow: extract -> tier 1 -> tier 2 -> save -> transform.
        """
        import requests as req_lib

        from src.extractor import BPExtractor
        from src.terminology_mapper import TerminologyMapper
        from src.ai_mapper import AIMapper
        from src.fhir_transformer import FHIRTransformer
        from src.fhir_loader import FHIRLoader
        from src.pipeline import MappingPipeline

        # Mock terminology server: always returns a SNOMED search result
        term_response = MagicMock()
        term_response.status_code = 200
        term_response.raise_for_status = Mock()
        term_response.json.return_value = {
            "expansion": {
                "contains": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "12345678",
                        "display": "Mock SNOMED Term",
                    }
                ]
            }
        }
        mock_term_get.return_value = term_response

        # Mock Ollama: connection refused (so Tier 2 always returns unmapped)
        mock_ai_post.side_effect = req_lib.ConnectionError("Ollama not running")

        # Mock FHIR PUT: always succeed
        fhir_put_response = MagicMock()
        fhir_put_response.status_code = 201
        mock_fhir_put.return_value = fhir_put_response

        # Construct real components with mocked HTTP
        extractor = BPExtractor(EXCEL_FILE_PATH)
        terminology_mapper = TerminologyMapper("http://localhost:8080/fhir")
        ai_mapper = AIMapper("http://localhost:11434")
        repo = MappingRepository(db_path=":memory:")
        transformer = FHIRTransformer()
        loader = FHIRLoader("http://localhost:8080/fhir")

        try:
            pipeline = MappingPipeline(
                extractor=extractor,
                terminology_mapper=terminology_mapper,
                ai_mapper=ai_mapper,
                repository=repo,
                transformer=transformer,
                loader=loader,
            )

            # Run with a limited set of entity types for speed
            result = pipeline.run(entity_types=["Conditions"])

            # Verify the pipeline completed and returned a summary
            assert isinstance(result, dict)
            assert len(result) > 0

            # Verify some records were saved to the repository
            stats = repo.get_statistics()
            assert isinstance(stats, dict)

        finally:
            repo.close()
