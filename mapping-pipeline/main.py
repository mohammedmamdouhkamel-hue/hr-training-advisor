"""Main entry point for the BP-to-FHIR clinical code mapping pipeline.

Smart mapping strategy:
  Phase 1: Direct-map records that already have standard codes in raw data
  Phase 2: Terminology server lookups for unmapped clinical entities (sample)
  Phase 3: Export comprehensive CSV and quality report for clinical review
"""

import csv
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Add the project root to sys.path so src imports work
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models import SourceRecord, MappingResult, SNOMED_SYSTEM, LOINC_SYSTEM, AMT_SYSTEM
from src.config import SOURCE_FILE, OLLAMA_URL, OLLAMA_MODEL
from src.extractor import BPExtractor
from src.terminology_mapper import TerminologyMapper
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
            PROJECT_ROOT / "pipeline_run.log", mode="w", encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
# Configuration
# ------------------------------------------------------------------ #
FHIR_TX_URL = os.getenv(
    "FHIR_SERVER_URL", "https://tx.ontoserver.csiro.au/fhir"
)

# Max records to attempt terminology server lookup per entity type
# (prevents hammering public server for hours)
ONTOSERVER_LOOKUP_LIMIT = int(os.getenv("ONTOSERVER_LOOKUP_LIMIT", "50"))

# Output paths
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_DIR = PROJECT_ROOT / "output"
CSV_OUTPUT = OUTPUT_DIR / f"mapping_results_{TIMESTAMP}.csv"
REPORT_OUTPUT = OUTPUT_DIR / f"quality_report_{TIMESTAMP}.txt"
DB_OUTPUT = OUTPUT_DIR / f"mappings_{TIMESTAMP}.db"

# ------------------------------------------------------------------ #
# Code extraction rules per entity type
# Maps raw_data column names to (target_system, code_col, display_col)
# ------------------------------------------------------------------ #
DIRECT_MAP_RULES = {
    "AllergyIntolerance": [
        {"code_col": "SnomedCode", "display_col": "Display", "system": SNOMED_SYSTEM},
    ],
    "Medication": [
        {"code_col": "AMTcode", "display_col": "AMTpreferredTerm", "system": AMT_SYSTEM},
        {"code_col": "AMTMPPCODE", "display_col": "PRODUCTNAME", "system": AMT_SYSTEM},
        {"code_col": "Code", "display_col": "Display", "system": SNOMED_SYSTEM},
    ],
    "Immunization": [
        {"code_col": "FHIR_CODE", "display_col": "FHIR_Display", "system": SNOMED_SYSTEM},
        {"code_col": "AIR_CODE", "display_col": "AIR_Display", "system": "urn:oid:1.2.36.1.2001.1005.17"},
        {"code_col": "Code", "display_col": "Display", "system": SNOMED_SYSTEM},
    ],
    "Encounter": [
        {"code_col": "Code", "display_col": "Display", "system": None},
    ],
    "Patient": [
        {"code_col": "code", "display_col": "Display", "system": None},
    ],
    "Person": [
        {"code_col": "code", "display_col": "Display", "system": None},
    ],
    "PractitionerRole": [
        {"code_col": "Code", "display_col": "Display", "system": None},
    ],
    "Slot": [
        {"code_col": "Code", "display_col": "Display", "system": None},
    ],
    "DocumentReference": [
        {"code_col": "Code", "display_col": "Display", "system": None},
        {"code_col": "LOINC_Code_Type", "display_col": "Document_Type", "system": LOINC_SYSTEM},
    ],
    "Observation-PathologyResult": [
        {"code_col": "LOINC", "display_col": "ResultName", "system": LOINC_SYSTEM},
    ],
    "Observation": [
        {"code_col": "CODE", "display_col": "DISPLAY", "system": SNOMED_SYSTEM},
        {"code_col": "Code", "display_col": "Display", "system": SNOMED_SYSTEM},
    ],
    "ImagingStudy": [
        {"code_col": "FHIR_Code", "display_col": "FHIR_Display", "system": "http://dicom.nema.org/resources/ontology/DCM"},
    ],
    "Medication Request": [
        {"code_col": "code", "display_col": "Display", "system": None},
    ],
    "ServiceRequest": [
        {"code_col": "FHIR_Code", "display_col": "FHIR_Display", "system": None},
    ],
}


def direct_map_record(record: dict, entity_type: str) -> MappingResult:
    """Try to map a record using existing standard codes in its raw_data.

    Returns a MappingResult -- either mapped (if codes found) or unmapped.
    """
    raw = record.get("raw_data", {})
    source_code = str(record.get("source_code") or "")
    source_display = str(record.get("source_display") or "")

    source = SourceRecord(
        entity_type=entity_type,
        source_code=source_code,
        source_display=source_display,
        raw_data=raw,
    )

    rules = DIRECT_MAP_RULES.get(entity_type, [])
    for rule in rules:
        code_val = raw.get(rule["code_col"])
        if code_val is not None:
            code_str = str(code_val).strip()
            if code_str and code_str.lower() not in ("none", "null", ""):
                display_val = raw.get(rule["display_col"])
                system = rule["system"]
                # Try to infer system from raw_data if not specified
                if system is None:
                    system = str(raw.get("System", raw.get("system", "")))
                    if not system or system == "None":
                        system = SNOMED_SYSTEM

                return MappingResult(
                    source=source,
                    target_code=code_str,
                    target_display=str(display_val) if display_val else source_display,
                    target_system=system,
                    mapping_tier=1,
                    confidence=0.95,
                    status="mapped",
                )

    # No existing code found
    return MappingResult(source=source, status="unmapped")


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


def run_pipeline():
    """Run the smart mapping pipeline."""
    logger.info("=" * 70)
    logger.info("  BP-to-FHIR Clinical Code Mapping Pipeline")
    logger.info("=" * 70)
    logger.info("Source file:        %s", SOURCE_FILE)
    logger.info("Terminology server: %s", FHIR_TX_URL)
    logger.info("Server lookup limit: %d per entity", ONTOSERVER_LOOKUP_LIMIT)
    logger.info("Output directory:   %s", OUTPUT_DIR)
    logger.info("")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ---- Step 1: Extract ----
    logger.info("PHASE 1: Extracting source data...")
    extractor = BPExtractor(SOURCE_FILE)
    all_data = extractor.extract_all()

    total_extracted = sum(len(recs) for recs in all_data.values())
    logger.info("Extracted %d records across %d entity types", total_extracted, len(all_data))

    for entity, recs in sorted(all_data.items(), key=lambda x: -len(x[1])):
        logger.info("  %-30s %6d records", entity, len(recs))
    logger.info("")

    # ---- Step 2: Direct mapping from existing codes ----
    logger.info("PHASE 2: Direct-mapping records with existing standard codes...")
    repository = MappingRepository(str(DB_OUTPUT))

    mapped_count = 0
    unmapped_count = 0
    unmapped_clinical = {}  # entity -> list of unmapped SourceRecords

    for entity_type, records in all_data.items():
        entity_mapped = 0
        entity_unmapped = 0

        for rec in records:
            result = direct_map_record(rec, entity_type)

            if result.status == "mapped":
                entity_mapped += 1
                mapped_count += 1
            else:
                entity_unmapped += 1
                unmapped_count += 1
                # Track unmapped clinical entities for Tier 1 lookup
                if entity_type in ("Conditions", "Procedures", "AllergyIntolerance"):
                    if entity_type not in unmapped_clinical:
                        unmapped_clinical[entity_type] = []
                    unmapped_clinical[entity_type].append(result.source)

            repository.save_mapping(result)

        logger.info(
            "  %-30s mapped=%5d  unmapped=%5d",
            entity_type, entity_mapped, entity_unmapped,
        )

    logger.info("")
    logger.info(
        "Direct mapping complete: %d mapped, %d unmapped",
        mapped_count, unmapped_count,
    )
    logger.info("")

    # ---- Step 3: Terminology server lookup for unmapped clinical records ----
    logger.info("PHASE 3: Terminology server lookup for unmapped clinical terms...")
    logger.info("  Using: %s", FHIR_TX_URL)
    logger.info("  Limit: %d lookups per entity type", ONTOSERVER_LOOKUP_LIMIT)

    terminology_mapper = TerminologyMapper(FHIR_TX_URL)
    server_mapped = 0
    server_attempted = 0

    for entity_type, unmapped_sources in unmapped_clinical.items():
        subset = unmapped_sources[:ONTOSERVER_LOOKUP_LIMIT]
        logger.info(
            "  Attempting %d/%d lookups for '%s'...",
            len(subset), len(unmapped_sources), entity_type,
        )

        for source_rec in subset:
            server_attempted += 1
            result = terminology_mapper.map_record(source_rec)

            if result.status == "mapped":
                server_mapped += 1
                repository.save_mapping(result)
                logger.info(
                    "    MAPPED: %s -> %s (%s)",
                    source_rec.source_display,
                    result.target_code,
                    result.target_display,
                )

            # Small delay to be respectful to the public server
            time.sleep(0.1)

    logger.info("")
    logger.info(
        "Terminology server results: %d/%d mapped",
        server_mapped, server_attempted,
    )
    logger.info("")

    # ---- Step 4: Quality report ----
    logger.info("PHASE 4: Generating quality report...")
    quality_reporter = QualityReporter(repository)
    quality_report = quality_reporter.generate_report()
    formatted_report = quality_reporter.format_report(quality_report)

    with open(REPORT_OUTPUT, "w", encoding="utf-8") as f:
        f.write(formatted_report)

    # ---- Step 5: Export CSV ----
    logger.info("Exporting to CSV...")
    csv_count = export_to_csv(repository, CSV_OUTPUT)
    logger.info("Exported %d records", csv_count)

    # ---- Summary ----
    logger.info("")
    logger.info("=" * 70)
    logger.info("  PIPELINE RUN COMPLETE")
    logger.info("=" * 70)
    logger.info("")
    logger.info(formatted_report)
    logger.info("")
    logger.info("Output files:")
    logger.info("  CSV:     %s", CSV_OUTPUT)
    logger.info("  Report:  %s", REPORT_OUTPUT)
    logger.info("  SQLite:  %s", DB_OUTPUT)
    logger.info("  Log:     %s", PROJECT_ROOT / "pipeline_run.log")

    extractor.close()
    repository.close()

    return quality_report


if __name__ == "__main__":
    try:
        run_pipeline()
    except FileNotFoundError as e:
        logger.error("Source file not found: %s", e)
        sys.exit(1)
    except Exception as e:
        logger.exception("Pipeline failed with error: %s", e)
        sys.exit(1)
