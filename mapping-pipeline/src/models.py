"""Data models for the clinical code mapping pipeline.

Defines the core dataclasses used throughout the pipeline for representing
source clinical records and their mapping results to standard terminologies
(SNOMED CT AU, ICD-10-AM, AMT, LOINC, AIR, DICOM).
"""

from dataclasses import dataclass, field
from typing import Optional


# Terminology system URIs
SNOMED_SYSTEM = "http://snomed.info/sct"
ICD10AM_SYSTEM = "http://hl7.org/fhir/sid/icd-10-am"
AMT_SYSTEM = "http://snomed.info/sct?fhir_cm=http://nehta.gov.au/amt/v2"
LOINC_SYSTEM = "http://loinc.org"
AIR_SYSTEM = "http://ns.electronichealth.net.au/id/hi/air"
DICOM_SYSTEM = "http://dicom.nema.org/resources/ontology/DCM"

# Confidence thresholds
CONFIDENCE_HIGH = 0.85
CONFIDENCE_MEDIUM = 0.6
CONFIDENCE_LOW = 0.3

# Entity type constants
ENTITY_CONDITIONS = "Conditions"
ENTITY_PROCEDURES = "Procedures"
ENTITY_MEDICATIONS = "Medications"
ENTITY_ALLERGIES = "Allergies"
ENTITY_IMMUNISATIONS = "Immunisations"
ENTITY_PATHOLOGY = "Pathology"
ENTITY_RADIOLOGY = "Radiology"

# Mapping to preferred target system by entity type
ENTITY_TARGET_SYSTEMS = {
    ENTITY_CONDITIONS: SNOMED_SYSTEM,
    ENTITY_PROCEDURES: SNOMED_SYSTEM,
    ENTITY_MEDICATIONS: AMT_SYSTEM,
    ENTITY_ALLERGIES: SNOMED_SYSTEM,
    ENTITY_IMMUNISATIONS: AIR_SYSTEM,
    ENTITY_PATHOLOGY: LOINC_SYSTEM,
    ENTITY_RADIOLOGY: DICOM_SYSTEM,
}


@dataclass
class SourceRecord:
    """Represents a single clinical record extracted from Best Practice.

    Attributes:
        entity_type: The clinical category (e.g. 'Conditions', 'Medications').
        source_code: The original code from the BP system.
        source_display: The human-readable display text for the record.
        raw_data: Additional raw fields from the source extraction.
    """
    entity_type: str
    source_code: str
    source_display: str
    raw_data: dict = field(default_factory=dict)


@dataclass
class MappingResult:
    """Represents the outcome of mapping a source record to a target terminology.

    Attributes:
        source: The original source record being mapped.
        target_code: The mapped code in the target terminology (if found).
        target_display: The display text for the target code.
        target_system: The URI of the target code system.
        mapping_tier: Which mapping tier produced this result
                      (1=terminology server, 2=AI, 3=SME).
        confidence: Confidence score between 0.0 and 1.0.
        status: Current mapping status ('mapped', 'unmapped', 'review_required').
    """
    source: SourceRecord
    target_code: Optional[str] = None
    target_display: Optional[str] = None
    target_system: Optional[str] = None
    mapping_tier: int = 0  # 1=terminology server, 2=AI, 3=SME
    confidence: float = 0.0
    status: str = "unmapped"  # mapped, unmapped, review_required
