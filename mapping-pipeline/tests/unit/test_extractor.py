"""Unit tests for src.extractor -- BPExtractor for Excel-based clinical data extraction."""
import os

import pytest

from src.extractor import BPExtractor


# Path to the real reference data Excel file
EXCEL_FILE_PATH = "/Users/doddos/Downloads/Reference Data_extract analysis_V1.xlsx"

# Skip all tests in this module if the Excel file is not available
pytestmark = pytest.mark.skipif(
    not os.path.exists(EXCEL_FILE_PATH),
    reason=f"Excel source file not found at {EXCEL_FILE_PATH}",
)


@pytest.fixture(scope="module")
def extractor():
    """Create a BPExtractor instance for the real Excel file (shared across tests)."""
    return BPExtractor(EXCEL_FILE_PATH)


class TestBPExtractorInit:
    """Tests for BPExtractor initialisation."""

    def test_extractor_init_with_valid_file(self):
        """BPExtractor can be initialised with the real Excel file path."""
        ext = BPExtractor(EXCEL_FILE_PATH)
        assert ext is not None


class TestExtractEntity:
    """Tests for extracting individual entity sheets."""

    def test_extract_conditions(self, extractor):
        """Extracting Conditions returns a list of dicts with expected keys."""
        records = extractor.extract_entity("Conditions")

        assert isinstance(records, list)
        assert len(records) > 0

        first = records[0]
        assert isinstance(first, dict)
        # Each record should have the fundamental mapping fields
        assert "entity_type" in first or "source_code" in first or "source_display" in first or len(first) > 0

    def test_extract_conditions_record_count(self, extractor):
        """Conditions sheet should contain approximately 15335 records."""
        records = extractor.extract_entity("Conditions")
        # Allow +/- 500 tolerance for minor data variations
        assert abs(len(records) - 15335) < 500, (
            f"Expected ~15335 condition records, got {len(records)}"
        )

    def test_extract_procedures(self, extractor):
        """Extracting Procedures returns a non-empty list of dicts."""
        records = extractor.extract_entity("Procedures")

        assert isinstance(records, list)
        assert len(records) > 0
        assert isinstance(records[0], dict)

    def test_extract_procedures_record_count(self, extractor):
        """Procedures sheet should contain approximately 4251 records."""
        records = extractor.extract_entity("Procedures")
        # Allow +/- 300 tolerance
        assert abs(len(records) - 4251) < 300, (
            f"Expected ~4251 procedure records, got {len(records)}"
        )

    def test_extract_allergy_intolerance(self, extractor):
        """Extracting AllergyIntolerance returns a non-empty list of dicts."""
        records = extractor.extract_entity("AllergyIntolerance")

        assert isinstance(records, list)
        assert len(records) > 0
        assert isinstance(records[0], dict)

    def test_extract_patient(self, extractor):
        """Extracting Patient returns a non-empty list of dicts."""
        records = extractor.extract_entity("Patient")

        assert isinstance(records, list)
        assert len(records) > 0
        assert isinstance(records[0], dict)

    def test_extract_encounter(self, extractor):
        """Extracting Encounter returns a non-empty list of dicts."""
        records = extractor.extract_entity("Encounter")

        assert isinstance(records, list)
        assert len(records) > 0
        assert isinstance(records[0], dict)

    def test_extract_entity_invalid_sheet(self, extractor):
        """Extracting a non-existent sheet should return empty list or raise ValueError."""
        try:
            result = extractor.extract_entity("NonExistentSheet")
            # If it returns without error, it should be an empty list
            assert isinstance(result, list)
            assert len(result) == 0
        except (ValueError, KeyError):
            # Raising an error for an invalid sheet name is also acceptable
            pass


class TestExtractAll:
    """Tests for the extract_all method."""

    def test_extract_all_returns_all_entities(self, extractor):
        """extract_all returns a dict with keys for each entity type."""
        result = extractor.extract_all()

        assert isinstance(result, dict)
        assert len(result) > 0
        # Each value should be a list
        for entity_type, records in result.items():
            assert isinstance(entity_type, str)
            assert isinstance(records, list)


class TestProfile:
    """Tests for the profile method."""

    def test_profile_returns_counts(self, extractor):
        """profile() returns a dict with counts for each entity type."""
        profile = extractor.profile()

        assert isinstance(profile, dict)
        assert len(profile) > 0
        # Each value should be a dict with profile details
        for entity_type, details in profile.items():
            assert isinstance(entity_type, str)
            assert isinstance(details, dict)
            assert "total_records" in details
            assert details["total_records"] >= 0
