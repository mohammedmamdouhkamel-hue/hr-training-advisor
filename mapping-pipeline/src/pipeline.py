"""Pipeline Orchestrator.

Orchestrates the full clinical code mapping pipeline:
Extract -> Map (Tier 1 terminology + Tier 2 AI) -> Transform -> Load.
Coordinates the extractor, mappers, repository, transformer, and loader
components to process Best Practice clinical codes into FHIR R4 resources.
"""

import logging
from typing import Any

from src.models import MappingResult, SourceRecord
from src.config import CONFIDENCE_MEDIUM

logger = logging.getLogger(__name__)

# Column name patterns used to identify source_code and source_display fields
# when converting raw extracted dicts into SourceRecord objects.
CODE_COLUMN_PATTERNS = ["id", "code", "identifier", "key", "number"]
DISPLAY_COLUMN_PATTERNS = ["name", "display", "description", "text", "title", "label"]


class MappingPipeline:
    """Orchestrates the full mapping pipeline: Extract -> Map -> Transform -> Load.

    Args:
        extractor: Source data extractor with an extract_all() method.
        terminology_mapper: Tier 1 mapper using terminology server lookups.
        ai_mapper: Tier 2 mapper using AI-based mapping.
        repository: Persistence layer for storing mapping results.
        transformer: FHIR resource transformer.
        loader: FHIR server loader.
    """

    def __init__(
        self,
        extractor: Any,
        terminology_mapper: Any,
        ai_mapper: Any,
        repository: Any,
        transformer: Any,
        loader: Any,
    ):
        self.extractor = extractor
        self.terminology_mapper = terminology_mapper
        self.ai_mapper = ai_mapper
        self.repository = repository
        self.transformer = transformer
        self.loader = loader

    def run(
        self, entity_types: list[str] = None, load_to_fhir: bool = False
    ) -> dict:
        """Run the full pipeline. Returns a summary report dict.

        Steps:
            1. Extract source data for specified (or all) entity types.
            2. Map records through Tier 1 (terminology) and Tier 2 (AI).
            3. Optionally transform mapped records to FHIR and load to server.
            4. Generate and return a quality report.

        Args:
            entity_types: Optional list of entity types to process. If None,
                all available entity types are processed.
            load_to_fhir: If True, transform and load mapped results to the
                FHIR server after mapping.

        Returns:
            A summary report dict with extraction, mapping, and loading stats.
        """
        report = {
            "extraction": {},
            "mapping": {},
            "loading": None,
            "summary": {},
        }

        # Step 1: Extract
        logger.info("Step 1: Extracting source data...")
        extracted_data = self.run_extraction(entity_types)
        total_extracted = sum(len(records) for records in extracted_data.values())
        report["extraction"] = {
            "entity_types": list(extracted_data.keys()),
            "total_records": total_extracted,
            "per_entity": {
                entity: len(records) for entity, records in extracted_data.items()
            },
        }
        logger.info("Extracted %d records across %d entity types",
                     total_extracted, len(extracted_data))

        # Step 2: Map
        logger.info("Step 2: Running mapping pipeline...")
        all_results = self.run_mapping(extracted_data)

        mapped_count = sum(1 for r in all_results if r.status == "mapped")
        unmapped_count = sum(1 for r in all_results if r.status == "unmapped")
        review_count = sum(1 for r in all_results if r.status == "review_required")
        tier_counts = {}
        for r in all_results:
            if r.status == "mapped":
                tier_counts[r.mapping_tier] = tier_counts.get(r.mapping_tier, 0) + 1

        report["mapping"] = {
            "total_processed": len(all_results),
            "mapped": mapped_count,
            "unmapped": unmapped_count,
            "review_required": review_count,
            "tier_distribution": tier_counts,
        }
        logger.info(
            "Mapping complete: %d mapped, %d unmapped, %d review_required",
            mapped_count, unmapped_count, review_count,
        )

        # Step 3: Transform and Load
        if load_to_fhir:
            logger.info("Step 3: Transforming and loading to FHIR server...")
            load_result = self.run_transform_and_load(all_results)
            report["loading"] = load_result

        # Step 4: Summary
        coverage = (mapped_count / len(all_results) * 100) if all_results else 0.0
        report["summary"] = {
            "total_records": len(all_results),
            "mapped": mapped_count,
            "unmapped": unmapped_count,
            "review_required": review_count,
            "coverage_percent": round(coverage, 2),
        }

        return report

    def run_extraction(self, entity_types: list[str] = None) -> dict[str, list]:
        """Step 1: Extract data from source.

        Calls the extractor to pull raw data. If entity_types is specified,
        filters the extraction to only those types.

        Args:
            entity_types: Optional list of entity types to extract.

        Returns:
            A dict mapping entity_type strings to lists of raw record dicts.
        """
        all_data = self.extractor.extract_all()

        if entity_types:
            filtered = {
                entity: records
                for entity, records in all_data.items()
                if entity in entity_types
            }
            return filtered

        return all_data

    def run_mapping(self, extracted_data: dict[str, list]) -> list[MappingResult]:
        """Steps 2a-2e: Run the multi-tier mapping pipeline.

        For each entity type:
            a. Convert raw dicts to SourceRecord objects.
            b. Run through Tier 1 (terminology_mapper).
            c. Collect unmapped results from Tier 1.
            d. Run unmapped through Tier 2 (ai_mapper).
            e. Mark remaining unmapped with confidence >= CONFIDENCE_MEDIUM
               as 'review_required'.
            f. Save all results to the repository.

        Args:
            extracted_data: Dict mapping entity types to lists of raw dicts.

        Returns:
            A list of all MappingResult objects from all entities.
        """
        all_results = []

        for entity_type, raw_records in extracted_data.items():
            logger.info(
                "Processing entity type '%s' (%d records)",
                entity_type, len(raw_records),
            )

            # Step 2a: Convert to SourceRecord objects
            source_records = self._convert_to_source_records(entity_type, raw_records)

            if not source_records:
                logger.warning("No source records produced for '%s'", entity_type)
                continue

            # Step 2b: Tier 1 - Terminology server mapping
            logger.info("  Tier 1: Terminology mapping for '%s'...", entity_type)
            tier1_results = self.terminology_mapper.map_records(source_records)

            # Step 2c: Collect unmapped results from Tier 1
            mapped_results = [r for r in tier1_results if r.status == "mapped"]
            unmapped_records = [
                r.source for r in tier1_results if r.status != "mapped"
            ]

            logger.info(
                "  Tier 1 results: %d mapped, %d unmapped",
                len(mapped_results), len(unmapped_records),
            )

            # Step 2d: Tier 2 - AI mapping for unmapped records
            tier2_results = []
            if unmapped_records:
                logger.info(
                    "  Tier 2: AI mapping for %d unmapped records...",
                    len(unmapped_records),
                )
                tier2_results = self.ai_mapper.map_records(unmapped_records)

            # Step 2e: Mark remaining unmapped with sufficient confidence for review
            final_results = list(mapped_results)
            for result in tier2_results:
                if result.status == "unmapped" and result.confidence >= CONFIDENCE_MEDIUM:
                    result.status = "review_required"
                final_results.append(result)

            # Save all results to repository
            for result in final_results:
                try:
                    self.repository.save_mapping(result)
                except Exception as exc:
                    logger.error(
                        "Failed to save result for %s/%s: %s",
                        entity_type, result.source.source_code, exc,
                    )

            all_results.extend(final_results)

        return all_results

    def run_transform_and_load(self, results: list[MappingResult]) -> dict:
        """Steps 3a-3c: Transform mapped results and load to FHIR server.

        Args:
            results: A list of MappingResult objects to transform and load.

        Returns:
            A dict with transform and load statistics.
        """
        # Step 3a: Transform to FHIR resources
        fhir_resources = self.transformer.transform_batch(results)
        logger.info("Transformed %d FHIR resources", len(fhir_resources))

        # Step 3b/3c: Load to FHIR server
        if fhir_resources:
            load_result = self.loader.load_batch(fhir_resources)
            return {
                "resources_transformed": len(fhir_resources),
                "load_result": load_result,
            }

        return {
            "resources_transformed": 0,
            "load_result": {"total": 0, "success": 0, "failed": 0, "errors": []},
        }

    @staticmethod
    def _convert_to_source_records(
        entity_type: str, raw_records: list[dict]
    ) -> list[SourceRecord]:
        """Convert raw extracted dicts into SourceRecord objects.

        Inspects column names in each dict to find the best candidates for
        source_code (ID-like columns) and source_display (name/display columns).

        Args:
            entity_type: The clinical entity type for these records.
            raw_records: A list of raw dicts from the extractor.

        Returns:
            A list of SourceRecord objects.
        """
        source_records = []

        for raw in raw_records:
            if not isinstance(raw, dict) or not raw:
                continue

            source_code = _find_column_value(raw, CODE_COLUMN_PATTERNS)
            source_display = _find_column_value(raw, DISPLAY_COLUMN_PATTERNS)

            # Fallback: use the first column value if no pattern matched
            keys = list(raw.keys())
            if source_code is None and keys:
                source_code = str(raw[keys[0]])
            if source_display is None and len(keys) > 1:
                source_display = str(raw[keys[1]])
            elif source_display is None:
                source_display = str(source_code)

            if source_code is not None:
                source_records.append(
                    SourceRecord(
                        entity_type=entity_type,
                        source_code=str(source_code),
                        source_display=str(source_display),
                        raw_data=raw,
                    )
                )

        return source_records


def _find_column_value(record: dict, patterns: list[str]) -> any:
    """Find the first column value whose key matches any of the given patterns.

    Performs case-insensitive substring matching against the column names.

    Args:
        record: A dict representing a single raw record.
        patterns: A list of substrings to match against column names.

    Returns:
        The value of the first matching column, or None if no match.
    """
    for key in record:
        key_lower = key.lower()
        for pattern in patterns:
            if pattern in key_lower:
                value = record[key]
                if value is not None and str(value).strip():
                    return value
    return None
