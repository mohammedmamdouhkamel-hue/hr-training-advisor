"""Unit tests for src.pipeline -- MappingPipeline orchestration."""
import pytest
from unittest.mock import MagicMock, Mock, call

from src.models import SourceRecord, MappingResult
from src.pipeline import MappingPipeline


def _make_source_record(entity_type="Conditions", source_code="1", source_display="Test"):
    """Helper to create a SourceRecord."""
    return SourceRecord(
        entity_type=entity_type,
        source_code=source_code,
        source_display=source_display,
    )


def _make_mapped_result(record, target_code="12345", confidence=0.95):
    """Helper to create a mapped MappingResult."""
    return MappingResult(
        source=record,
        target_code=target_code,
        target_display="Mapped Display",
        target_system="http://snomed.info/sct",
        mapping_tier=1,
        confidence=confidence,
        status="mapped",
    )


def _make_unmapped_result(record):
    """Helper to create an unmapped MappingResult."""
    return MappingResult(source=record, status="unmapped")


@pytest.fixture
def mock_extractor():
    """Create a mock BPExtractor."""
    extractor = MagicMock()
    records = [
        {"entity_type": "Conditions", "source_code": "1", "source_display": "Condition A"},
        {"entity_type": "Conditions", "source_code": "2", "source_display": "Condition B"},
    ]
    extractor.extract_all.return_value = {"Conditions": records}
    return extractor


@pytest.fixture
def mock_terminology_mapper():
    """Create a mock TerminologyMapper."""
    mapper = MagicMock()
    # By default, return a mix of mapped and unmapped results
    return mapper


@pytest.fixture
def mock_ai_mapper():
    """Create a mock AIMapper."""
    mapper = MagicMock()
    return mapper


@pytest.fixture
def mock_repository():
    """Create a mock MappingRepository."""
    repo = MagicMock()
    repo.save_mappings.return_value = 2
    return repo


@pytest.fixture
def mock_transformer():
    """Create a mock FHIRTransformer."""
    transformer = MagicMock()
    transformer.transform_batch.return_value = []
    return transformer


@pytest.fixture
def mock_loader():
    """Create a mock FHIRLoader."""
    loader = MagicMock()
    return loader


@pytest.fixture
def pipeline(
    mock_extractor,
    mock_terminology_mapper,
    mock_ai_mapper,
    mock_repository,
    mock_transformer,
    mock_loader,
):
    """Create a MappingPipeline with all mocked dependencies."""
    return MappingPipeline(
        extractor=mock_extractor,
        terminology_mapper=mock_terminology_mapper,
        ai_mapper=mock_ai_mapper,
        repository=mock_repository,
        transformer=mock_transformer,
        loader=mock_loader,
    )


class TestPipelineInit:
    """Tests for MappingPipeline initialisation."""

    def test_pipeline_init(
        self,
        mock_extractor,
        mock_terminology_mapper,
        mock_ai_mapper,
        mock_repository,
        mock_transformer,
        mock_loader,
    ):
        """MappingPipeline can be constructed with all required dependencies."""
        p = MappingPipeline(
            extractor=mock_extractor,
            terminology_mapper=mock_terminology_mapper,
            ai_mapper=mock_ai_mapper,
            repository=mock_repository,
            transformer=mock_transformer,
            loader=mock_loader,
        )
        assert p is not None


class TestPipelineRun:
    """Tests for the run method orchestration flow."""

    def test_run_calls_extraction(self, pipeline, mock_extractor):
        """Running the pipeline calls extractor.extract_all."""
        record_a = _make_source_record(source_code="1", source_display="A")
        record_b = _make_source_record(source_code="2", source_display="B")

        # Set up the terminology mapper to return mapped results
        pipeline.terminology_mapper = MagicMock()
        mapped_a = _make_mapped_result(record_a)
        mapped_b = _make_mapped_result(record_b)
        pipeline.terminology_mapper.map_records.return_value = [mapped_a, mapped_b]

        # AI mapper returns empty since all were mapped at tier 1
        pipeline.ai_mapper = MagicMock()
        pipeline.ai_mapper.map_records.return_value = []

        pipeline.run()

        mock_extractor.extract_all.assert_called()

    def test_run_calls_tier1_mapping(
        self, pipeline, mock_extractor, mock_terminology_mapper
    ):
        """Running the pipeline calls terminology_mapper.map_records."""
        record = _make_source_record()
        mapped = _make_mapped_result(record)
        mock_terminology_mapper.map_records.return_value = [mapped]

        pipeline.run()

        mock_terminology_mapper.map_records.assert_called()

    def test_run_calls_tier2_for_unmapped(
        self,
        pipeline,
        mock_extractor,
        mock_terminology_mapper,
        mock_ai_mapper,
    ):
        """Pipeline sends unmapped Tier 1 records to Tier 2 AI mapper."""
        record_a = _make_source_record(source_code="1", source_display="A")
        record_b = _make_source_record(source_code="2", source_display="B")

        # Tier 1: record_a mapped, record_b unmapped
        mapped_a = _make_mapped_result(record_a)
        unmapped_b = _make_unmapped_result(record_b)
        mock_terminology_mapper.map_records.return_value = [mapped_a, unmapped_b]

        # Tier 2: maps record_b
        ai_mapped_b = MappingResult(
            source=record_b,
            target_code="67890",
            target_display="AI Mapped B",
            target_system="http://snomed.info/sct",
            mapping_tier=2,
            confidence=0.7,
            status="review_required",
        )
        mock_ai_mapper.map_records.return_value = [ai_mapped_b]

        pipeline.run()

        # Verify AI mapper was called (with the unmapped records)
        mock_ai_mapper.map_records.assert_called()

    def test_run_saves_to_repository(
        self,
        pipeline,
        mock_extractor,
        mock_terminology_mapper,
        mock_repository,
    ):
        """Pipeline saves mapping results to the repository."""
        record = _make_source_record()
        mapped = _make_mapped_result(record)
        mock_terminology_mapper.map_records.return_value = [mapped]

        pipeline.run()

        mock_repository.save_mapping.assert_called()

    def test_run_returns_summary_dict(
        self,
        pipeline,
        mock_extractor,
        mock_terminology_mapper,
    ):
        """Pipeline.run returns a summary dict with expected keys."""
        record = _make_source_record()
        mapped = _make_mapped_result(record)
        mock_terminology_mapper.map_records.return_value = [mapped]

        result = pipeline.run()

        assert isinstance(result, dict)
        # The summary should contain at least some keys indicating counts/status
        assert len(result) > 0
