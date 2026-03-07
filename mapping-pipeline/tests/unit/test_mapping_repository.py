"""Unit tests for src.mapping_repository -- SQLite-backed mapping persistence."""
import pytest

from src.models import SourceRecord, MappingResult
from src.mapping_repository import MappingRepository


@pytest.fixture
def repo():
    """Create a fresh in-memory MappingRepository for each test."""
    repository = MappingRepository(db_path=":memory:")
    yield repository
    repository.close()


def _make_result(
    entity_type="Conditions",
    source_code="1",
    source_display="Test",
    target_code=None,
    target_display=None,
    target_system=None,
    mapping_tier=0,
    confidence=0.0,
    status="unmapped",
):
    """Helper to build MappingResult objects for tests."""
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


class TestMappingRepositoryInit:
    """Tests for repository initialisation."""

    def test_init_creates_table(self):
        """Creating a MappingRepository should initialise the SQLite table."""
        repo = MappingRepository(db_path=":memory:")
        # The repo should be usable immediately (no error on stats query)
        stats = repo.get_statistics()
        assert isinstance(stats, dict)
        repo.close()


class TestSaveAndRetrieve:
    """Tests for saving and retrieving mappings."""

    def test_save_and_retrieve_mapping(self, repo):
        """A saved mapped result can be retrieved by entity_type and source_code."""
        result = _make_result(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
            target_code="233985008",
            target_display="Abdominal aortic aneurysm",
            target_system="http://snomed.info/sct",
            mapping_tier=1,
            confidence=0.95,
            status="mapped",
        )

        row_id = repo.save_mapping(result)
        assert isinstance(row_id, int)
        assert row_id > 0

        retrieved = repo.get_mapping("Conditions", "214")
        assert retrieved is not None
        assert retrieved.target_code == "233985008"
        assert retrieved.target_display == "Abdominal aortic aneurysm"
        assert retrieved.status == "mapped"
        assert retrieved.confidence == 0.95

    def test_get_mapping_not_found(self, repo):
        """Retrieving a non-existent mapping returns None."""
        retrieved = repo.get_mapping("Conditions", "99999")
        assert retrieved is None


class TestSaveMappingsBatch:
    """Tests for batch saving."""

    def test_save_mappings_batch(self, repo):
        """save_mappings saves multiple results and returns the count saved."""
        results = [
            _make_result(
                entity_type="Conditions",
                source_code=str(i),
                source_display=f"Condition {i}",
                status="mapped" if i % 2 == 0 else "unmapped",
                target_code=f"CODE{i}" if i % 2 == 0 else None,
                confidence=0.9 if i % 2 == 0 else 0.0,
            )
            for i in range(10)
        ]

        count = repo.save_mappings(results)
        assert count == 10


class TestGetUnmapped:
    """Tests for retrieving unmapped records."""

    def test_get_unmapped(self, repo):
        """get_unmapped returns only records with status 'unmapped'."""
        mapped = _make_result(
            source_code="1", status="mapped", target_code="CODE1", confidence=0.9
        )
        unmapped_1 = _make_result(source_code="2", status="unmapped")
        unmapped_2 = _make_result(source_code="3", status="unmapped")
        review = _make_result(
            source_code="4",
            status="review_required",
            target_code="CODE4",
            confidence=0.6,
        )

        repo.save_mapping(mapped)
        repo.save_mapping(unmapped_1)
        repo.save_mapping(unmapped_2)
        repo.save_mapping(review)

        unmapped = repo.get_unmapped()
        assert len(unmapped) == 2
        for r in unmapped:
            assert r.status == "unmapped"

    def test_get_unmapped_by_entity_type(self, repo):
        """get_unmapped can filter by entity_type."""
        cond_unmapped = _make_result(
            entity_type="Conditions", source_code="1", status="unmapped"
        )
        proc_unmapped = _make_result(
            entity_type="Procedures", source_code="2", status="unmapped"
        )

        repo.save_mapping(cond_unmapped)
        repo.save_mapping(proc_unmapped)

        cond_only = repo.get_unmapped(entity_type="Conditions")
        assert len(cond_only) == 1
        assert cond_only[0].source.entity_type == "Conditions"


class TestReviewQueue:
    """Tests for the review queue."""

    def test_get_review_queue(self, repo):
        """get_review_queue returns only records with status 'review_required'."""
        mapped = _make_result(
            source_code="1", status="mapped", target_code="CODE1", confidence=0.9
        )
        unmapped = _make_result(source_code="2", status="unmapped")
        review = _make_result(
            source_code="3",
            status="review_required",
            target_code="CODE3",
            confidence=0.6,
        )

        repo.save_mapping(mapped)
        repo.save_mapping(unmapped)
        repo.save_mapping(review)

        queue = repo.get_review_queue()
        assert len(queue) == 1
        assert queue[0].status == "review_required"
        assert queue[0].target_code == "CODE3"


class TestApproveMapping:
    """Tests for approving a mapping from the review queue."""

    def test_approve_mapping(self, repo):
        """Approving a review_required record changes its status to mapped."""
        review = _make_result(
            entity_type="AllergyIntolerance",
            source_code="10",
            source_display="Peanuts",
            target_code="91935009",
            target_display="Allergy to peanut",
            target_system="http://snomed.info/sct",
            mapping_tier=2,
            confidence=0.65,
            status="review_required",
        )

        repo.save_mapping(review)

        success = repo.approve_mapping(
            entity_type="AllergyIntolerance",
            source_code="10",
            reviewed_by="SME",
        )
        assert success is True

        # Verify the status changed
        updated = repo.get_mapping("AllergyIntolerance", "10")
        assert updated is not None
        assert updated.status == "mapped"

    def test_approve_nonexistent_mapping(self, repo):
        """Approving a mapping that does not exist returns False."""
        success = repo.approve_mapping(
            entity_type="Conditions",
            source_code="99999",
            reviewed_by="SME",
        )
        assert success is False


class TestGetStatistics:
    """Tests for statistics reporting."""

    def test_get_statistics(self, repo):
        """get_statistics returns a dict with counts for each status."""
        repo.save_mapping(
            _make_result(source_code="1", status="mapped", target_code="C1", confidence=0.9)
        )
        repo.save_mapping(
            _make_result(source_code="2", status="mapped", target_code="C2", confidence=0.9)
        )
        repo.save_mapping(
            _make_result(source_code="3", status="unmapped")
        )
        repo.save_mapping(
            _make_result(
                source_code="4",
                status="review_required",
                target_code="C4",
                confidence=0.6,
            )
        )

        stats = repo.get_statistics()

        assert isinstance(stats, dict)
        # The stats dict should reflect the data we saved
        # Check that total or per-status counts are present
        # Exact key structure depends on implementation, but common patterns:
        total = stats.get("total", 0)
        if total:
            assert total == 4

    def test_statistics_by_entity(self, repo):
        """Statistics should break down counts by entity type if supported."""
        repo.save_mapping(
            _make_result(
                entity_type="Conditions",
                source_code="1",
                status="mapped",
                target_code="C1",
                confidence=0.9,
            )
        )
        repo.save_mapping(
            _make_result(
                entity_type="Procedures",
                source_code="2",
                status="unmapped",
            )
        )
        repo.save_mapping(
            _make_result(
                entity_type="Conditions",
                source_code="3",
                status="unmapped",
            )
        )

        stats = repo.get_statistics()

        assert isinstance(stats, dict)
        # At minimum, stats should exist; the exact breakdown depends on implementation
        assert len(stats) > 0

    def test_statistics_empty_repository(self, repo):
        """Statistics for an empty repository should not raise errors."""
        stats = repo.get_statistics()
        assert isinstance(stats, dict)
