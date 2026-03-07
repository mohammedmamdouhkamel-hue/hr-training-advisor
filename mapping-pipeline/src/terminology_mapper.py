"""Tier 1 Terminology Mapper: Maps clinical records using FHIR terminology server APIs.

This module provides direct terminology server lookups via FHIR operations
such as $translate, ValueSet/$expand, and CodeSystem/$validate-code. It is
the first (highest confidence) tier in the mapping pipeline.
"""

import logging
from typing import Optional

import requests

from src.models import (
    SourceRecord,
    MappingResult,
    SNOMED_SYSTEM,
    AMT_SYSTEM,
    LOINC_SYSTEM,
    ENTITY_CONDITIONS,
    ENTITY_PROCEDURES,
    ENTITY_ALLERGIES,
    ENTITY_MEDICATIONS,
    ENTITY_PATHOLOGY,
    ENTITY_TARGET_SYSTEMS,
)

logger = logging.getLogger(__name__)

# Timeout for FHIR server HTTP requests (seconds)
FHIR_TIMEOUT = 15


class TerminologyMapper:
    """Tier 1: Maps records using FHIR terminology server APIs.

    Attempts to resolve clinical terms to standard codes by querying a
    FHIR-compliant terminology server. Supports SNOMED CT AU, AMT, and
    LOINC lookups depending on the entity type of each record.
    """

    def __init__(self, fhir_server_url: str):
        """Initialise with the base URL of the FHIR terminology server.

        Args:
            fhir_server_url: Base URL of the FHIR terminology server
                             (e.g. 'https://tx.ontoserver.csiro.au/fhir').
        """
        self.fhir_server_url = fhir_server_url.rstrip("/")

    def map_record(self, record: SourceRecord) -> MappingResult:
        """Attempt to map a single record using the terminology server.

        Strategy:
        1. If the record already carries a SNOMED/LOINC/AMT code in raw_data,
           validate it and return as mapped with high confidence.
        2. Otherwise, search the appropriate terminology by display text.

        Args:
            record: The source clinical record to map.

        Returns:
            A MappingResult populated with the mapping outcome.
        """
        # Check if the record already has a code that just needs validation
        existing = self._try_validate_existing(record)
        if existing is not None:
            return existing

        # Determine the right search strategy based on entity type
        if record.entity_type in (
            ENTITY_CONDITIONS,
            ENTITY_PROCEDURES,
            ENTITY_ALLERGIES,
        ):
            result = self._search_snomed(record.source_display)
            if result is not None:
                code, display = result
                return MappingResult(
                    source=record,
                    target_code=code,
                    target_display=display,
                    target_system=SNOMED_SYSTEM,
                    mapping_tier=1,
                    confidence=1.0,
                    status="mapped",
                )

        elif record.entity_type == ENTITY_MEDICATIONS:
            result = self._search_amt(record.source_display)
            if result is not None:
                code, display = result
                return MappingResult(
                    source=record,
                    target_code=code,
                    target_display=display,
                    target_system=AMT_SYSTEM,
                    mapping_tier=1,
                    confidence=1.0,
                    status="mapped",
                )

        elif record.entity_type == ENTITY_PATHOLOGY:
            result = self._search_loinc(record.source_display)
            if result is not None:
                code, display = result
                return MappingResult(
                    source=record,
                    target_code=code,
                    target_display=display,
                    target_system=LOINC_SYSTEM,
                    mapping_tier=1,
                    confidence=1.0,
                    status="mapped",
                )

        else:
            # For other entity types, try a generic SNOMED search
            result = self._search_snomed(record.source_display)
            if result is not None:
                code, display = result
                target_system = ENTITY_TARGET_SYSTEMS.get(
                    record.entity_type, SNOMED_SYSTEM
                )
                return MappingResult(
                    source=record,
                    target_code=code,
                    target_display=display,
                    target_system=target_system,
                    mapping_tier=1,
                    confidence=1.0,
                    status="mapped",
                )

        # No mapping found at Tier 1
        return MappingResult(source=record, status="unmapped")

    def map_records(self, records: list[SourceRecord]) -> list[MappingResult]:
        """Map a batch of records. Returns results for all, mapped or not.

        Args:
            records: List of source records to map.

        Returns:
            List of MappingResult for every input record.
        """
        results = []
        for record in records:
            result = self.map_record(record)
            results.append(result)
            if result.status == "mapped":
                logger.info(
                    "Tier 1 mapped: %s -> %s (%s)",
                    record.source_display,
                    result.target_code,
                    result.target_display,
                )
            else:
                logger.debug(
                    "Tier 1 unmapped: %s (%s)",
                    record.source_display,
                    record.entity_type,
                )
        return results

    # ------------------------------------------------------------------ #
    # Private helpers
    # ------------------------------------------------------------------ #

    def _try_validate_existing(self, record: SourceRecord) -> Optional[MappingResult]:
        """If the record already has a standard code, validate it.

        Checks raw_data for keys like 'snomed_code', 'loinc_code', or
        'amt_code' and validates them against the terminology server.

        Returns:
            A MappingResult if validation succeeds, or None.
        """
        code_keys = {
            "snomed_code": SNOMED_SYSTEM,
            "loinc_code": LOINC_SYSTEM,
            "amt_code": AMT_SYSTEM,
        }

        for key, system in code_keys.items():
            code = record.raw_data.get(key)
            if code is not None:
                code = str(code).strip()
                if code and self._validate_code(system, code):
                    display = record.raw_data.get(
                        key.replace("_code", "_display"), record.source_display
                    )
                    return MappingResult(
                        source=record,
                        target_code=code,
                        target_display=display,
                        target_system=system,
                        mapping_tier=1,
                        confidence=0.9,
                        status="mapped",
                    )

        return None

    def _search_snomed(self, term: str) -> Optional[tuple[str, str]]:
        """Search SNOMED CT for a term. Returns (code, display) or None.

        Uses the FHIR ValueSet/$expand operation with the SNOMED CT
        implicit value set to find the best match.

        Args:
            term: The clinical display text to search for.

        Returns:
            A tuple of (code, display) for the best match, or None.
        """
        url = f"{self.fhir_server_url}/ValueSet/$expand"
        params = {
            "url": f"{SNOMED_SYSTEM}?fhir_vs",
            "filter": term,
            "count": 1,
        }

        try:
            resp = requests.get(url, params=params, timeout=FHIR_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            contains = (
                data.get("expansion", {}).get("contains", [])
            )
            if contains:
                entry = contains[0]
                return (entry.get("code"), entry.get("display"))

        except requests.ConnectionError:
            logger.warning("FHIR server unreachable for SNOMED search: %s", term)
        except requests.Timeout:
            logger.warning("FHIR server timed out for SNOMED search: %s", term)
        except requests.HTTPError as exc:
            logger.warning("FHIR server HTTP error for SNOMED search: %s", exc)
        except (ValueError, KeyError) as exc:
            logger.warning("Failed to parse FHIR response for SNOMED search: %s", exc)

        return None

    def _search_amt(self, term: str) -> Optional[tuple[str, str]]:
        """Search AMT (Australian Medicines Terminology) for a medication term.

        Args:
            term: The medication display text to search for.

        Returns:
            A tuple of (code, display) for the best match, or None.
        """
        url = f"{self.fhir_server_url}/ValueSet/$expand"
        params = {
            "url": f"{AMT_SYSTEM}?fhir_vs",
            "filter": term,
            "count": 1,
        }

        try:
            resp = requests.get(url, params=params, timeout=FHIR_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            contains = data.get("expansion", {}).get("contains", [])
            if contains:
                entry = contains[0]
                return (entry.get("code"), entry.get("display"))

        except requests.ConnectionError:
            logger.warning("FHIR server unreachable for AMT search: %s", term)
        except requests.Timeout:
            logger.warning("FHIR server timed out for AMT search: %s", term)
        except requests.HTTPError as exc:
            logger.warning("FHIR server HTTP error for AMT search: %s", exc)
        except (ValueError, KeyError) as exc:
            logger.warning("Failed to parse FHIR response for AMT search: %s", exc)

        return None

    def _search_loinc(self, term: str) -> Optional[tuple[str, str]]:
        """Search LOINC for a pathology/lab term.

        Args:
            term: The lab/pathology display text to search for.

        Returns:
            A tuple of (code, display) for the best match, or None.
        """
        url = f"{self.fhir_server_url}/ValueSet/$expand"
        params = {
            "url": f"{LOINC_SYSTEM}?fhir_vs",
            "filter": term,
            "count": 1,
        }

        try:
            resp = requests.get(url, params=params, timeout=FHIR_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            contains = data.get("expansion", {}).get("contains", [])
            if contains:
                entry = contains[0]
                return (entry.get("code"), entry.get("display"))

        except requests.ConnectionError:
            logger.warning("FHIR server unreachable for LOINC search: %s", term)
        except requests.Timeout:
            logger.warning("FHIR server timed out for LOINC search: %s", term)
        except requests.HTTPError as exc:
            logger.warning("FHIR server HTTP error for LOINC search: %s", exc)
        except (ValueError, KeyError) as exc:
            logger.warning("Failed to parse FHIR response for LOINC search: %s", exc)

        return None

    def _validate_code(self, system: str, code: str) -> bool:
        """Validate if a code exists in a code system.

        Uses the FHIR CodeSystem/$validate-code operation.

        Args:
            system: The code system URI (e.g. SNOMED_SYSTEM).
            code: The code to validate.

        Returns:
            True if the code is valid, False otherwise.
        """
        url = f"{self.fhir_server_url}/CodeSystem/$validate-code"
        params = {
            "url": system,
            "code": code,
        }

        try:
            resp = requests.get(url, params=params, timeout=FHIR_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()

            # FHIR $validate-code returns a Parameters resource with a
            # "result" parameter that is a boolean.
            for param in data.get("parameter", []):
                if param.get("name") == "result":
                    return param.get("valueBoolean", False)

        except requests.ConnectionError:
            logger.warning(
                "FHIR server unreachable for code validation: %s|%s", system, code
            )
        except requests.Timeout:
            logger.warning(
                "FHIR server timed out for code validation: %s|%s", system, code
            )
        except requests.HTTPError as exc:
            logger.warning("FHIR server HTTP error for code validation: %s", exc)
        except (ValueError, KeyError) as exc:
            logger.warning("Failed to parse FHIR validation response: %s", exc)

        return False
