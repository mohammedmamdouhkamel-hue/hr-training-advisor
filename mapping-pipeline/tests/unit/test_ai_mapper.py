"""Unit tests for src.ai_mapper -- Tier 2 AI-assisted mapping via Ollama."""
import json

import pytest
from unittest.mock import patch, MagicMock, Mock

from src.models import SourceRecord, MappingResult
from src.ai_mapper import AIMapper


OLLAMA_URL = "http://localhost:11434"


@pytest.fixture
def ai_mapper():
    """Create an AIMapper instance with default model."""
    return AIMapper(OLLAMA_URL)


class TestAIMapperInit:
    """Tests for AIMapper initialisation."""

    def test_ai_mapper_init(self):
        """AIMapper stores the Ollama URL (trailing slash stripped) and model name."""
        m = AIMapper("http://localhost:11434/", model="llama3")
        assert m.ollama_url == "http://localhost:11434"
        assert m.model == "llama3"

    def test_ai_mapper_init_default_model(self):
        """AIMapper defaults to llama3 model when not specified."""
        m = AIMapper("http://localhost:11434")
        assert m.model == "llama3"


class TestBuildPrompt:
    """Tests for the _build_prompt method."""

    def test_build_prompt_includes_entity_type(self, ai_mapper):
        """The generated prompt should mention the entity type."""
        record = SourceRecord(
            entity_type="Conditions",
            source_code="214",
            source_display="AAA",
        )

        prompt = ai_mapper._build_prompt(record)

        assert "Conditions" in prompt

    def test_build_prompt_includes_term(self, ai_mapper):
        """The generated prompt should include the clinical term (source_display)."""
        record = SourceRecord(
            entity_type="Procedures",
            source_code="100",
            source_display="Appendectomy",
        )

        prompt = ai_mapper._build_prompt(record)

        assert "Appendectomy" in prompt

    def test_build_prompt_includes_source_code(self, ai_mapper):
        """The generated prompt should include the source code."""
        record = SourceRecord(
            entity_type="Conditions",
            source_code="42",
            source_display="Diabetes mellitus",
        )

        prompt = ai_mapper._build_prompt(record)

        assert "42" in prompt

    def test_build_prompt_requests_json_format(self, ai_mapper):
        """The prompt should ask for a JSON response format."""
        record = SourceRecord(
            entity_type="Conditions",
            source_code="1",
            source_display="Test",
        )

        prompt = ai_mapper._build_prompt(record)

        assert "JSON" in prompt or "json" in prompt


class TestParseResponse:
    """Tests for the _parse_response method."""

    def test_parse_response_valid_json(self, ai_mapper):
        """A valid JSON response with code, display, system is parsed correctly."""
        response_text = json.dumps({
            "code": "73211009",
            "display": "Diabetes mellitus",
            "system": "http://snomed.info/sct",
            "confidence": 0.9,
        })

        parsed = ai_mapper._parse_response(response_text)

        assert parsed is not None
        assert parsed["code"] == "73211009"
        assert parsed["display"] == "Diabetes mellitus"
        assert parsed["system"] == "http://snomed.info/sct"

    def test_parse_response_json_in_code_fence(self, ai_mapper):
        """JSON wrapped in markdown code fences is parsed correctly."""
        response_text = '```json\n{"code": "73211009", "display": "Diabetes mellitus", "system": "http://snomed.info/sct", "confidence": 0.85}\n```'

        parsed = ai_mapper._parse_response(response_text)

        assert parsed is not None
        assert parsed["code"] == "73211009"

    def test_parse_response_invalid_json(self, ai_mapper):
        """Completely invalid/unstructured text returns None gracefully."""
        response_text = "I don't know how to map this clinical term."

        parsed = ai_mapper._parse_response(response_text)

        # Should return None since there is no code-like pattern either
        assert parsed is None

    def test_parse_response_null_code(self, ai_mapper):
        """A JSON response with null code returns None (LLM could not map)."""
        response_text = json.dumps({
            "code": None,
            "display": None,
            "system": None,
            "confidence": 0.0,
        })

        parsed = ai_mapper._parse_response(response_text)

        assert parsed is None

    def test_parse_response_extracts_snomed_code_via_regex(self, ai_mapper):
        """Fallback regex extraction can find SNOMED-like numeric codes."""
        response_text = "The SNOMED code for this is 233985008 which means AAA."

        parsed = ai_mapper._parse_response(response_text)

        assert parsed is not None
        assert parsed["code"] == "233985008"
        assert parsed["system"] == "http://snomed.info/sct"


class TestMapRecordOllamaUnavailable:
    """Tests for graceful handling when Ollama is unavailable."""

    @patch("src.ai_mapper.requests.post")
    def test_map_record_when_ollama_unavailable(self, mock_post, ai_mapper):
        """When Ollama is unreachable, map_record returns unmapped without crashing."""
        import requests as req_lib

        mock_post.side_effect = req_lib.ConnectionError("Connection refused")

        record = SourceRecord(
            entity_type="Conditions",
            source_code="999",
            source_display="Unknown Condition",
        )

        result = ai_mapper.map_record(record)

        assert isinstance(result, MappingResult)
        assert result.status == "unmapped"
        assert result.target_code is None
        assert result.confidence == 0.0


class TestMapRecordsBatch:
    """Tests for batch mapping via AI."""

    @patch("src.ai_mapper.requests.post")
    def test_map_records_processes_all(self, mock_post, ai_mapper):
        """map_records processes every record and returns results for all."""
        import requests as req_lib

        mock_post.side_effect = req_lib.ConnectionError("Connection refused")

        records = [
            SourceRecord(
                entity_type="Conditions",
                source_code=str(i),
                source_display=f"Term {i}",
            )
            for i in range(3)
        ]

        results = ai_mapper.map_records(records)

        assert isinstance(results, list)
        assert len(results) == 3
        for r in results:
            assert isinstance(r, MappingResult)

    @patch("src.ai_mapper.requests.post")
    def test_map_record_successful_mapping(self, mock_post, ai_mapper):
        """A successful Ollama response produces a mapped or review_required result."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            "response": json.dumps({
                "code": "73211009",
                "display": "Diabetes mellitus",
                "system": "http://snomed.info/sct",
                "confidence": 0.9,
            })
        }
        mock_post.return_value = mock_response

        record = SourceRecord(
            entity_type="Conditions",
            source_code="42",
            source_display="Diabetes",
        )

        result = ai_mapper.map_record(record)

        assert result.target_code == "73211009"
        assert result.target_display == "Diabetes mellitus"
        assert result.mapping_tier == 2
        assert result.status in ("mapped", "review_required")
        assert result.confidence > 0
