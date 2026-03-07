"""Tier 2 AI Mapper: Maps clinical records using a local LLM via Ollama.

This module provides AI-assisted code mapping for records that could not
be resolved by the Tier 1 terminology server. It sends structured prompts
to a local Ollama instance and parses the LLM response for SNOMED CT,
ICD-10-AM, AMT, or LOINC codes.
"""

import json
import logging
import re
from typing import Optional

import requests

from src.models import (
    SourceRecord,
    MappingResult,
    SNOMED_SYSTEM,
    ICD10AM_SYSTEM,
    AMT_SYSTEM,
    LOINC_SYSTEM,
    CONFIDENCE_HIGH,
    ENTITY_CONDITIONS,
    ENTITY_PROCEDURES,
    ENTITY_ALLERGIES,
    ENTITY_MEDICATIONS,
    ENTITY_PATHOLOGY,
    ENTITY_RADIOLOGY,
    ENTITY_IMMUNISATIONS,
    ENTITY_TARGET_SYSTEMS,
)

logger = logging.getLogger(__name__)

# Timeout for Ollama HTTP requests (seconds) -- LLM inference can be slow
OLLAMA_TIMEOUT = 120

# Default AI confidence (below CONFIDENCE_HIGH, so requires review)
DEFAULT_AI_CONFIDENCE = 0.7

# Hedging phrases that reduce confidence
HEDGING_PHRASES = [
    "i'm not sure",
    "i am not sure",
    "uncertain",
    "possibly",
    "might be",
    "could be",
    "not confident",
    "approximate",
    "best guess",
    "unable to determine",
    "no exact match",
    "not certain",
]

# SNOMED-like code pattern (numeric, 6-18 digits)
SNOMED_CODE_PATTERN = re.compile(r"\b(\d{6,18})\b")

# ICD-10 code pattern (letter + digits, optional dot + digits)
ICD10_CODE_PATTERN = re.compile(r"\b([A-Z]\d{2}(?:\.\d{1,4})?)\b")

# LOINC code pattern (digits + hyphen + check digit)
LOINC_CODE_PATTERN = re.compile(r"\b(\d{3,7}-\d)\b")


class AIMapper:
    """Tier 2: Maps records using local LLM via Ollama.

    Sends structured prompts to a locally running Ollama model and
    parses the responses to extract clinical code mappings.
    """

    def __init__(self, ollama_url: str, model: str = "llama3"):
        """Initialise with the Ollama API URL and model name.

        Args:
            ollama_url: Base URL of the Ollama server (e.g. 'http://localhost:11434').
            model: The Ollama model to use for inference.
        """
        self.ollama_url = ollama_url.rstrip("/")
        self.model = model

    def map_record(self, record: SourceRecord) -> MappingResult:
        """Use LLM to suggest a SNOMED/ICD-10 mapping for a clinical term.

        Args:
            record: The source clinical record to map.

        Returns:
            A MappingResult populated with the AI-suggested mapping.
        """
        prompt = self._build_prompt(record)
        response_text = self._call_ollama(prompt)

        if response_text is None:
            logger.warning(
                "Ollama unavailable for AI mapping: %s", record.source_display
            )
            return MappingResult(source=record, status="unmapped")

        parsed = self._parse_response(response_text)

        if parsed is None:
            logger.info(
                "AI could not parse a mapping for: %s", record.source_display
            )
            return MappingResult(source=record, status="unmapped")

        # Determine confidence
        confidence = self._assess_confidence(response_text, parsed)

        # Determine status based on confidence
        if confidence >= CONFIDENCE_HIGH:
            status = "mapped"
        else:
            status = "review_required"

        return MappingResult(
            source=record,
            target_code=parsed.get("code"),
            target_display=parsed.get("display"),
            target_system=parsed.get("system"),
            mapping_tier=2,
            confidence=confidence,
            status=status,
        )

    def map_records(self, records: list[SourceRecord]) -> list[MappingResult]:
        """Map a batch of records through AI. Only processes unmapped records.

        Records that already have a status other than 'unmapped' are
        passed through unchanged (wrapped in a MappingResult).

        Args:
            records: List of source records to map.

        Returns:
            List of MappingResult for every input record.
        """
        results = []
        for record in records:
            result = self.map_record(record)
            results.append(result)
            if result.status != "unmapped":
                logger.info(
                    "Tier 2 AI mapped: %s -> %s (%s) [confidence=%.2f]",
                    record.source_display,
                    result.target_code,
                    result.target_display,
                    result.confidence,
                )
            else:
                logger.debug(
                    "Tier 2 AI unmapped: %s (%s)",
                    record.source_display,
                    record.entity_type,
                )
        return results

    # ------------------------------------------------------------------ #
    # Private helpers
    # ------------------------------------------------------------------ #

    def _build_prompt(self, record: SourceRecord) -> str:
        """Build the LLM prompt for mapping a clinical term.

        The prompt instructs the model to return a structured JSON object
        with the mapped code, its display text, and the target code system.

        Args:
            record: The source record to build a prompt for.

        Returns:
            The formatted prompt string.
        """
        # Determine the target terminology based on entity type
        target_terminology, target_system_uri = self._get_target_info(record.entity_type)

        prompt = f"""You are a clinical terminology expert specialising in Australian healthcare coding standards.

Your task is to map the following clinical term to the most appropriate {target_terminology} code.

Clinical term: "{record.source_display}"
Entity type: {record.entity_type}
Source code: {record.source_code}

Please respond with ONLY a JSON object in the following format (no additional text):
{{
    "code": "<the {target_terminology} code>",
    "display": "<the official display text for this code>",
    "system": "{target_system_uri}",
    "confidence": <a number between 0.0 and 1.0 indicating your confidence>
}}

Important rules:
- Use only valid, real {target_terminology} codes. Do not invent codes.
- If you are not confident in the mapping, set confidence below 0.7.
- If you cannot find an appropriate code, respond with:
  {{"code": null, "display": null, "system": null, "confidence": 0.0}}
- For Australian clinical contexts, prefer Australian extensions where available.
"""
        return prompt

    def _get_target_info(self, entity_type: str) -> tuple[str, str]:
        """Get the target terminology name and URI for an entity type.

        Args:
            entity_type: The clinical entity type.

        Returns:
            Tuple of (terminology_name, system_uri).
        """
        mapping = {
            ENTITY_CONDITIONS: ("SNOMED CT AU", SNOMED_SYSTEM),
            ENTITY_PROCEDURES: ("SNOMED CT AU", SNOMED_SYSTEM),
            ENTITY_ALLERGIES: ("SNOMED CT AU", SNOMED_SYSTEM),
            ENTITY_MEDICATIONS: ("AMT (Australian Medicines Terminology)", AMT_SYSTEM),
            ENTITY_PATHOLOGY: ("LOINC", LOINC_SYSTEM),
            ENTITY_RADIOLOGY: ("SNOMED CT AU", SNOMED_SYSTEM),
            ENTITY_IMMUNISATIONS: ("SNOMED CT AU", SNOMED_SYSTEM),
        }
        return mapping.get(entity_type, ("SNOMED CT AU", SNOMED_SYSTEM))

    def _call_ollama(self, prompt: str) -> Optional[str]:
        """Call Ollama API and return the response text.

        Args:
            prompt: The prompt to send to the LLM.

        Returns:
            The response text from the LLM, or None if the call failed.
        """
        url = f"{self.ollama_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 150,
                "temperature": 0,
            },
        }

        try:
            resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")

        except requests.ConnectionError:
            logger.warning("Ollama server unreachable at %s", self.ollama_url)
        except requests.Timeout:
            logger.warning("Ollama request timed out")
        except requests.HTTPError as exc:
            logger.warning("Ollama HTTP error: %s", exc)
        except (ValueError, KeyError) as exc:
            logger.warning("Failed to parse Ollama response: %s", exc)

        return None

    def _parse_response(self, response_text: str) -> Optional[dict]:
        """Parse LLM response to extract code, display, system.

        Attempts JSON parsing first, then falls back to regex extraction
        of code-like patterns from the text.

        Args:
            response_text: The raw text response from the LLM.

        Returns:
            A dict with 'code', 'display', and 'system' keys, or None.
        """
        # Strategy 1: Try to parse a JSON object from the response
        parsed = self._try_parse_json(response_text)
        if parsed is not None:
            return parsed

        # Strategy 2: Regex fallback -- look for code patterns in the text
        return self._try_regex_extraction(response_text)

    def _try_parse_json(self, text: str) -> Optional[dict]:
        """Attempt to extract and parse a JSON object from the response.

        Handles cases where the LLM wraps JSON in markdown code fences
        or includes extra text around the JSON.

        Args:
            text: The raw response text.

        Returns:
            A dict with code/display/system keys, or None.
        """
        # Try to find JSON within code fences
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if json_match:
            text_to_parse = json_match.group(1)
        else:
            # Try to find a bare JSON object
            json_match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
            if json_match:
                text_to_parse = json_match.group(0)
            else:
                return None

        try:
            data = json.loads(text_to_parse)
        except json.JSONDecodeError:
            return None

        code = data.get("code")
        display = data.get("display")
        system = data.get("system")

        # A null/None code means the LLM couldn't map it
        if code is None or code == "null":
            return None

        return {
            "code": str(code),
            "display": str(display) if display else None,
            "system": str(system) if system else SNOMED_SYSTEM,
            "llm_confidence": data.get("confidence"),
        }

    def _try_regex_extraction(self, text: str) -> Optional[dict]:
        """Fallback: extract code patterns using regex.

        Looks for SNOMED-like numeric codes, ICD-10 codes, or LOINC codes
        in the response text.

        Args:
            text: The raw response text.

        Returns:
            A dict with code/display/system keys, or None.
        """
        # Try LOINC pattern first (most specific)
        match = LOINC_CODE_PATTERN.search(text)
        if match:
            return {
                "code": match.group(1),
                "display": None,
                "system": LOINC_SYSTEM,
                "llm_confidence": None,
            }

        # Try ICD-10 pattern
        match = ICD10_CODE_PATTERN.search(text)
        if match:
            return {
                "code": match.group(1),
                "display": None,
                "system": ICD10AM_SYSTEM,
                "llm_confidence": None,
            }

        # Try SNOMED pattern (numeric, 6-18 digits)
        match = SNOMED_CODE_PATTERN.search(text)
        if match:
            return {
                "code": match.group(1),
                "display": None,
                "system": SNOMED_SYSTEM,
                "llm_confidence": None,
            }

        return None

    def _assess_confidence(self, response_text: str, parsed: dict) -> float:
        """Assess the confidence of an AI mapping.

        Considers the LLM's self-reported confidence and the presence
        of hedging language in the response.

        Args:
            response_text: The raw LLM response text.
            parsed: The parsed mapping data.

        Returns:
            A confidence score between 0.0 and 1.0.
        """
        confidence = DEFAULT_AI_CONFIDENCE

        # Use the LLM's own confidence if provided and reasonable
        llm_confidence = parsed.get("llm_confidence")
        if llm_confidence is not None:
            try:
                llm_conf = float(llm_confidence)
                if 0.0 <= llm_conf <= 1.0:
                    # Blend LLM confidence with our default (don't fully trust it)
                    confidence = min(llm_conf, DEFAULT_AI_CONFIDENCE + 0.1)
            except (ValueError, TypeError):
                pass

        # Reduce confidence if hedging language is present
        response_lower = response_text.lower()
        for phrase in HEDGING_PHRASES:
            if phrase in response_lower:
                confidence = min(confidence, 0.5)
                break

        # Reduce confidence if display text is missing
        if parsed.get("display") is None:
            confidence = max(confidence - 0.1, 0.1)

        return round(confidence, 2)
