"""Tier 2 AI Mapping: Run Ollama-based AI mapping on all unmapped records.

Reads unmapped records from the existing SQLite database, sends them through
the AI mapper (Ollama/llama3), and updates the database with results.
Exports an updated CSV and quality report when complete.
"""

import csv
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models import SourceRecord, MappingResult
from src.ai_mapper import AIMapper
from src.mapping_repository import MappingRepository
from src.quality import QualityReporter

# ------------------------------------------------------------------ #
# Logging
# ------------------------------------------------------------------ #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(
            PROJECT_ROOT / "tier2_run.log", mode="w", encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
# Configuration
# ------------------------------------------------------------------ #
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# Source database from Phase 1
DB_PATH = str(PROJECT_ROOT / "output" / "mappings_20260307_142213.db")

# Output paths
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = PROJECT_ROOT / "output"
CSV_OUTPUT = OUTPUT_DIR / f"mapping_results_tier2_{TIMESTAMP}.csv"
REPORT_OUTPUT = OUTPUT_DIR / f"quality_report_tier2_{TIMESTAMP}.txt"

# Progress reporting interval
PROGRESS_INTERVAL = 25


def export_to_csv(repository: MappingRepository, output_path: Path) -> int:
    """Export all mapping results from the repository to a CSV file."""
    rows = repository.conn.execute(
        """
        SELECT entity_type, source_code, source_display,
               target_code, target_display, target_system,
               mapping_tier, confidence, status,
               created_at, reviewed_by, review_notes
        FROM mappings
        ORDER BY entity_type, status, source_display
        """
    ).fetchall()

    headers = [
        "entity_type", "source_code", "source_display",
        "target_code", "target_display", "target_system",
        "mapping_tier", "confidence", "status",
        "created_at", "reviewed_by", "review_notes",
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([row[h] for h in headers])

    return len(rows)


def run_tier2():
    """Run Tier 2 AI mapping on all unmapped records."""
    logger.info("=" * 70)
    logger.info("  Tier 2: AI Mapping (Ollama/llama3)")
    logger.info("=" * 70)
    logger.info("Database:    %s", DB_PATH)
    logger.info("Ollama URL:  %s", OLLAMA_URL)
    logger.info("Model:       %s", OLLAMA_MODEL)
    logger.info("")

    # Verify Ollama is accessible
    ai_mapper = AIMapper(OLLAMA_URL, model=OLLAMA_MODEL)
    test_result = ai_mapper._call_ollama("Say OK")
    if test_result is None:
        logger.error("Ollama is not accessible at %s. Aborting.", OLLAMA_URL)
        sys.exit(1)
    logger.info("Ollama connection verified.")

    # Open the existing database
    repository = MappingRepository(DB_PATH)

    # Get all unmapped records
    unmapped = repository.get_unmapped()
    total_unmapped = len(unmapped)
    logger.info("Found %d unmapped records to process.", total_unmapped)
    logger.info("")

    # Group by entity type for progress tracking
    by_entity = {}
    for result in unmapped:
        entity = result.source.entity_type
        if entity not in by_entity:
            by_entity[entity] = []
        by_entity[entity].append(result.source)

    for entity, records in sorted(by_entity.items(), key=lambda x: -len(x[1])):
        logger.info("  %-30s %6d unmapped", entity, len(records))
    logger.info("")

    # Process all unmapped records through AI mapper
    mapped_count = 0
    review_count = 0
    still_unmapped = 0
    errors = 0
    processed = 0
    start_time = time.time()

    for entity_type, source_records in by_entity.items():
        entity_mapped = 0
        entity_review = 0
        entity_unmapped = 0

        logger.info("Processing '%s' (%d records)...", entity_type, len(source_records))

        for i, source_rec in enumerate(source_records):
            processed += 1

            try:
                result = ai_mapper.map_record(source_rec)

                if result.status == "mapped":
                    entity_mapped += 1
                    mapped_count += 1
                elif result.status == "review_required":
                    entity_review += 1
                    review_count += 1
                else:
                    entity_unmapped += 1
                    still_unmapped += 1

                # Update the record in the database
                repository.save_mapping(result)

            except Exception as exc:
                errors += 1
                logger.error(
                    "Error mapping %s/%s: %s",
                    entity_type, source_rec.source_code, exc,
                )

            # Progress reporting
            if (i + 1) % PROGRESS_INTERVAL == 0 or (i + 1) == len(source_records):
                elapsed = time.time() - start_time
                rate = processed / elapsed if elapsed > 0 else 0
                eta_seconds = (total_unmapped - processed) / rate if rate > 0 else 0
                eta_min = eta_seconds / 60

                logger.info(
                    "  [%s] %d/%d done | Overall: %d/%d (%.1f%%) | "
                    "Rate: %.1f/min | ETA: %.0f min | "
                    "Mapped: %d, Review: %d, Unmapped: %d",
                    entity_type,
                    i + 1, len(source_records),
                    processed, total_unmapped,
                    processed / total_unmapped * 100,
                    rate * 60,
                    eta_min,
                    mapped_count, review_count, still_unmapped,
                )

        logger.info(
            "  '%s' complete: mapped=%d, review=%d, unmapped=%d",
            entity_type, entity_mapped, entity_review, entity_unmapped,
        )
        logger.info("")

    elapsed_total = time.time() - start_time

    # Generate quality report
    logger.info("Generating quality report...")
    quality_reporter = QualityReporter(repository)
    quality_report = quality_reporter.generate_report()
    formatted_report = quality_reporter.format_report(quality_report)

    with open(REPORT_OUTPUT, "w", encoding="utf-8") as f:
        f.write(formatted_report)

    # Export updated CSV
    logger.info("Exporting updated CSV...")
    csv_count = export_to_csv(repository, CSV_OUTPUT)

    # Summary
    logger.info("")
    logger.info("=" * 70)
    logger.info("  TIER 2 AI MAPPING COMPLETE")
    logger.info("=" * 70)
    logger.info("")
    logger.info("Total processed:   %d", processed)
    logger.info("Newly mapped:      %d", mapped_count)
    logger.info("Review required:   %d", review_count)
    logger.info("Still unmapped:    %d", still_unmapped)
    logger.info("Errors:            %d", errors)
    logger.info("Time elapsed:      %.1f minutes", elapsed_total / 60)
    logger.info("Rate:              %.1f records/minute", processed / (elapsed_total / 60) if elapsed_total > 0 else 0)
    logger.info("")
    logger.info(formatted_report)
    logger.info("")
    logger.info("Output files:")
    logger.info("  CSV:     %s", CSV_OUTPUT)
    logger.info("  Report:  %s", REPORT_OUTPUT)
    logger.info("  Log:     %s", PROJECT_ROOT / "tier2_run.log")

    repository.close()


if __name__ == "__main__":
    try:
        run_tier2()
    except KeyboardInterrupt:
        logger.info("Interrupted by user.")
        sys.exit(0)
    except Exception as e:
        logger.exception("Tier 2 mapping failed: %s", e)
        sys.exit(1)
