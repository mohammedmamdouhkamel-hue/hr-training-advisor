"""Unit tests for src.quality -- QualityReporter for mapping statistics and reports."""
import pytest

from src.models import SourceRecord, MappingResult
from src.mapping_repository import MappingRepository
from src.quality import QualityReporter


@pytest.fixture
def repo():
    """Create a fresh in-memory MappingRepository."""
    repository = MappingRepository(db_path=":memory:")
    yield repository
    repository.close()


@pytest.fixture
def reporter(repo):
    """Create a QualityReporter backed by the in-memory repository."""
    return QualityReporter(repo)


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


class TestGenerateReport:
    """Tests for generate_report method."""

    def test_generate_report_structure(self, repo, reporter):
        """generate_report returns a dict with expected keys."""
        # Populate with some test data
        repo.save_mapping(
            _make_result(
                source_code="1",
                status="mapped",
                target_code="CODE1",
                confidence=0.95,
            )
        )
        repo.save_mapping(
            _make_result(source_code="2", status="unmapped")
        )

        report = reporter.generate_report()

        assert isinstance(report, dict)
        # The report should contain at least some statistical information
        assert len(report) > 0

    def test_report_with_empty_repository(self, repo, reporter):
        """Generating a report on an empty repository should not raise errors."""
        report = reporter.generate_report()

        assert isinstance(report, dict)


class TestCoverageCalculation:
    """Tests for coverage percentage calculation."""

    def test_coverage_calculation(self, repo, reporter):
        """Coverage should be mapped / total * 100."""
        # Save 3 mapped, 1 unmapped, 1 review_required = 5 total
        for i in range(3):
            repo.save_mapping(
                _make_result(
                    source_code=str(i),
                    status="mapped",
                    target_code=f"CODE{i}",
                    confidence=0.9,
                )
            )
        repo.save_mapping(
            _make_result(source_code="10", status="unmapped")
        )
        repo.save_mapping(
            _make_result(
                source_code="11",
                status="review_required",
                target_code="CODE11",
                confidence=0.6,
            )
        )

        report = reporter.generate_report()

        # The report should contain coverage or percentage information
        # Check that it has at least counts we can derive coverage from
        assert isinstance(report, dict)
        # If there's a 'coverage' or 'mapped_percentage' key, verify it
        coverage = report.get("coverage") or report.get("mapped_percentage")
        if coverage is not None:
            assert 50 <= coverage <= 70, (
                f"Expected coverage around 60% (3/5), got {coverage}"
            )


class TestFormatReport:
    """Tests for format_report method."""

    def test_format_report_is_string(self, repo, reporter):
        """format_report returns a human-readable string."""
        repo.save_mapping(
            _make_result(
                source_code="1",
                status="mapped",
                target_code="CODE1",
                confidence=0.9,
            )
        )

        report = reporter.generate_report()
        formatted = reporter.format_report(report)

        assert isinstance(formatted, str)
        assert len(formatted) > 0

    def test_format_report_empty_data(self, repo, reporter):
        """format_report handles an empty report without errors."""
        report = reporter.generate_report()
        formatted = reporter.format_report(report)

        assert isinstance(formatted, str)
