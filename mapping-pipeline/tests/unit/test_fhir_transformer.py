"""Unit tests for src.fhir_transformer -- FHIR R4 resource transformation."""
import pytest

from src.models import SourceRecord, MappingResult
from src.fhir_transformer import FHIRTransformer


@pytest.fixture
def transformer():
    """Create a FHIRTransformer instance."""
    return FHIRTransformer()


def _make_mapped_result(
    entity_type,
    source_code,
    source_display,
    target_code,
    target_display,
    target_system="http://snomed.info/sct",
    confidence=0.95,
):
    """Helper to create a mapped MappingResult."""
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
        mapping_tier=1,
        confidence=confidence,
        status="mapped",
    )


class TestTransformCondition:
    """Tests for Condition resource transformation."""

    def test_transform_condition(self, transformer):
        """A mapped condition produces a valid FHIR Condition resource."""
        result = _make_mapped_result(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
        )

        resource = transformer.transform(result)

        assert resource is not None
        assert resource["resourceType"] == "Condition"
        assert "id" in resource
        assert "code" in resource
        assert "subject" in resource

    def test_transform_condition_has_clinical_status(self, transformer):
        """Condition resource includes clinicalStatus coding."""
        result = _make_mapped_result(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
        )

        resource = transformer.transform(result)

        assert "clinicalStatus" in resource
        assert resource["clinicalStatus"]["coding"][0]["code"] == "active"


class TestTransformProcedure:
    """Tests for Procedure resource transformation."""

    def test_transform_procedure(self, transformer):
        """A mapped procedure produces a valid FHIR Procedure resource."""
        result = _make_mapped_result(
            entity_type="Procedures",
            source_code="100",
            source_display="Appendectomy",
            target_code="80146002",
            target_display="Appendectomy",
        )

        resource = transformer.transform(result)

        assert resource is not None
        assert resource["resourceType"] == "Procedure"
        assert resource["status"] == "completed"
        assert "code" in resource


class TestTransformAllergy:
    """Tests for AllergyIntolerance resource transformation."""

    def test_transform_allergy(self, transformer):
        """A mapped allergy produces a valid FHIR AllergyIntolerance resource."""
        result = _make_mapped_result(
            entity_type="AllergyIntolerance",
            source_code="1",
            source_display="Eggs",
            target_code="102263004",
            target_display="Eggs",
        )

        resource = transformer.transform(result)

        assert resource is not None
        assert resource["resourceType"] == "AllergyIntolerance"
        assert "code" in resource
        assert "patient" in resource


class TestTransformMedication:
    """Tests for Medication resource transformation."""

    def test_transform_medication(self, transformer):
        """A mapped medication produces a valid FHIR Medication resource."""
        result = _make_mapped_result(
            entity_type="Medication",
            source_code="5895",
            source_display="Polytar",
            target_code="71451000036109",
            target_display="Polytar",
            target_system="http://snomed.info/sct",
        )

        resource = transformer.transform(result)

        assert resource is not None
        assert resource["resourceType"] == "Medication"
        assert "code" in resource


class TestTransformUnmapped:
    """Tests for unmapped results."""

    def test_transform_unmapped_returns_none(self, transformer):
        """An unmapped result returns None (no FHIR resource generated)."""
        source = SourceRecord(
            entity_type="Conditions",
            source_code="999",
            source_display="Unknown",
        )
        result = MappingResult(source=source, status="unmapped")

        resource = transformer.transform(result)

        assert resource is None

    def test_transform_review_required_returns_none(self, transformer):
        """A review_required result also returns None (not yet approved)."""
        source = SourceRecord(
            entity_type="Conditions",
            source_code="888",
            source_display="Pending",
        )
        result = MappingResult(
            source=source,
            target_code="12345",
            target_display="Pending",
            target_system="http://snomed.info/sct",
            mapping_tier=2,
            confidence=0.6,
            status="review_required",
        )

        resource = transformer.transform(result)

        assert resource is None


class TestTransformResourceType:
    """Tests for correct FHIR resource type mapping."""

    @pytest.mark.parametrize(
        "entity_type,expected_resource_type",
        [
            ("Conditions", "Condition"),
            ("Procedures", "Procedure"),
            ("AllergyIntolerance", "AllergyIntolerance"),
            ("Medication", "Medication"),
        ],
    )
    def test_transform_has_correct_resource_type(
        self, transformer, entity_type, expected_resource_type
    ):
        """Each entity type maps to the correct FHIR resource type."""
        result = _make_mapped_result(
            entity_type=entity_type,
            source_code="1",
            source_display="Test",
            target_code="12345",
            target_display="Test Display",
        )

        resource = transformer.transform(result)

        assert resource is not None
        assert resource["resourceType"] == expected_resource_type


class TestTransformCoding:
    """Tests for coding structure in transformed resources."""

    def test_transform_has_coding(self, transformer):
        """Transformed resource has code.coding with system, code, display."""
        result = _make_mapped_result(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
            target_system="http://snomed.info/sct",
        )

        resource = transformer.transform(result)

        assert "code" in resource
        code_element = resource["code"]
        assert "coding" in code_element
        assert len(code_element["coding"]) > 0

        coding = code_element["coding"][0]
        assert coding["system"] == "http://snomed.info/sct"
        assert coding["code"] == "233985008"
        assert coding["display"] == "Abdominal aortic aneurysm"

    def test_transform_preserves_source_text(self, transformer):
        """The code.text field should preserve the original source_display."""
        result = _make_mapped_result(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
        )

        resource = transformer.transform(result)

        assert resource["code"]["text"] == "AAA"


class TestTransformBatch:
    """Tests for batch transformation."""

    def test_transform_batch(self, transformer):
        """transform_batch produces resources for mapped results, skipping unmapped."""
        mapped_1 = _make_mapped_result(
            entity_type="Conditions",
            source_code="1",
            source_display="Condition A",
            target_code="11111",
            target_display="Condition A Display",
        )
        mapped_2 = _make_mapped_result(
            entity_type="Procedures",
            source_code="2",
            source_display="Procedure B",
            target_code="22222",
            target_display="Procedure B Display",
        )
        unmapped = MappingResult(
            source=SourceRecord(
                entity_type="Conditions",
                source_code="3",
                source_display="Unknown",
            ),
            status="unmapped",
        )

        resources = transformer.transform_batch([mapped_1, unmapped, mapped_2])

        assert len(resources) == 2
        resource_types = {r["resourceType"] for r in resources}
        assert "Condition" in resource_types
        assert "Procedure" in resource_types

    def test_transform_batch_empty_list(self, transformer):
        """transform_batch with an empty list returns an empty list."""
        resources = transformer.transform_batch([])
        assert resources == []

    def test_transform_batch_all_unmapped(self, transformer):
        """transform_batch with all unmapped results returns an empty list."""
        unmapped = MappingResult(
            source=SourceRecord(
                entity_type="Conditions",
                source_code="1",
                source_display="Unknown",
            ),
            status="unmapped",
        )

        resources = transformer.transform_batch([unmapped, unmapped])
        assert resources == []
