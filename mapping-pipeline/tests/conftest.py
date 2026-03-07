"""Shared test fixtures for the clinical code mapping pipeline."""
import pytest
import sys
import os

# Add project root to path so src modules are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.models import SourceRecord, MappingResult


@pytest.fixture
def sample_condition_record():
    return SourceRecord(
        entity_type="Conditions",
        source_code="214",
        source_display="AAA",
        raw_data={"TERMNAMEID": "12", "TERMID": "214", "TERMNAME": "AAA"},
    )


@pytest.fixture
def sample_procedure_record():
    return SourceRecord(
        entity_type="Procedures",
        source_code="4395",
        source_display="4 Hydroxy 3 Methoxyphenylacetate",
        raw_data={
            "TERMNAMEID": "6",
            "TERMID": "4395",
            "TERMNAME": "4 Hydroxy 3 Methoxyphenylacetate",
        },
    )


@pytest.fixture
def sample_allergy_record():
    return SourceRecord(
        entity_type="AllergyIntolerance",
        source_code="1",
        source_display="Eggs",
        raw_data={"AGENTID": "1", "AGENTNAME": "Eggs"},
    )


@pytest.fixture
def sample_medication_record():
    return SourceRecord(
        entity_type="Medication",
        source_code="5895",
        source_display="Polytar",
        raw_data={
            "productID": "5895",
            "GENERICNAME": "Refined Coal Tar Liquid",
            "PRODUCTNAME": "Polytar",
            "AMTcode": "71451000036109",
        },
    )


@pytest.fixture
def sample_mapped_result(sample_condition_record):
    return MappingResult(
        source=sample_condition_record,
        target_code="233985008",
        target_display="Abdominal aortic aneurysm",
        target_system="http://snomed.info/sct",
        mapping_tier=1,
        confidence=0.95,
        status="mapped",
    )


@pytest.fixture
def sample_unmapped_result(sample_procedure_record):
    return MappingResult(
        source=sample_procedure_record,
        target_code=None,
        target_display=None,
        target_system=None,
        mapping_tier=0,
        confidence=0.0,
        status="unmapped",
    )


@pytest.fixture
def sample_review_result(sample_allergy_record):
    return MappingResult(
        source=sample_allergy_record,
        target_code="102263004",
        target_display="Eggs",
        target_system="http://snomed.info/sct",
        mapping_tier=2,
        confidence=0.7,
        status="review_required",
    )


@pytest.fixture
def mapping_repository():
    from src.mapping_repository import MappingRepository

    repo = MappingRepository(db_path=":memory:")
    yield repo
    repo.close()


@pytest.fixture
def fhir_transformer():
    from src.fhir_transformer import FHIRTransformer

    return FHIRTransformer()
