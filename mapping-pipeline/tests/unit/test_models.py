"""Unit tests for src.models -- SourceRecord and MappingResult dataclasses."""
import pytest

from src.models import SourceRecord, MappingResult


class TestSourceRecord:
    """Tests for the SourceRecord dataclass."""

    def test_source_record_creation(self):
        """SourceRecord can be created with all required fields."""
        record = SourceRecord(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            raw_data={"TERMID": "214", "TERMNAME": "AAA"},
        )

        assert record.entity_type == "Conditions"
        assert record.source_code == "214"
        assert record.source_display == "AAA"
        assert record.raw_data == {"TERMID": "214", "TERMNAME": "AAA"}

    def test_source_record_defaults(self):
        """SourceRecord.raw_data defaults to an empty dict when not provided."""
        record = SourceRecord(
            entity_type="Procedures",
            source_code="100",
            source_display="Some Procedure",
        )

        assert record.raw_data == {}
        assert isinstance(record.raw_data, dict)

    def test_source_record_default_dict_is_independent(self):
        """Each SourceRecord gets its own independent default dict instance."""
        record_a = SourceRecord(
            entity_type="Conditions",
            source_code="1",
            source_display="A",
        )
        record_b = SourceRecord(
            entity_type="Conditions",
            source_code="2",
            source_display="B",
        )

        record_a.raw_data["key"] = "value"
        assert "key" not in record_b.raw_data


class TestMappingResult:
    """Tests for the MappingResult dataclass."""

    def test_mapping_result_creation(self):
        """MappingResult can be created with all fields explicitly set."""
        source = SourceRecord(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
        )
        result = MappingResult(
            source=source,
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
            target_system="http://snomed.info/sct",
            mapping_tier=1,
            confidence=0.95,
            status="mapped",
        )

        assert result.source is source
        assert result.target_code == "233985008"
        assert result.target_display == "Abdominal aortic aneurysm"
        assert result.target_system == "http://snomed.info/sct"
        assert result.mapping_tier == 1
        assert result.confidence == 0.95
        assert result.status == "mapped"

    def test_mapping_result_defaults(self):
        """MappingResult defaults represent an unmapped record."""
        source = SourceRecord(
            entity_type="Procedures",
            source_code="100",
            source_display="Some Procedure",
        )
        result = MappingResult(source=source)

        assert result.target_code is None
        assert result.target_display is None
        assert result.target_system is None
        assert result.mapping_tier == 0
        assert result.confidence == 0.0
        assert result.status == "unmapped"

    def test_mapping_result_review_required_status(self):
        """MappingResult can hold a review_required status."""
        source = SourceRecord(
            entity_type="AllergyIntolerance",
            source_code="1",
            source_display="Eggs",
        )
        result = MappingResult(
            source=source,
            target_code="102263004",
            target_display="Eggs",
            target_system="http://snomed.info/sct",
            mapping_tier=2,
            confidence=0.7,
            status="review_required",
        )

        assert result.status == "review_required"
        assert result.mapping_tier == 2
        assert result.confidence == 0.7
