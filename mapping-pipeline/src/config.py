"""Configuration for the mapping pipeline."""
import os

FHIR_SERVER_URL = os.getenv("FHIR_SERVER_URL", "http://localhost:8080/fhir")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
SOURCE_FILE = os.getenv("SOURCE_FILE", "/Users/doddos/Downloads/Reference Data_extract analysis_V1.xlsx")
DATABASE_PATH = os.getenv("DATABASE_PATH", "mappings.db")

# Mapping confidence thresholds
CONFIDENCE_HIGH = 0.85
CONFIDENCE_MEDIUM = 0.60

# Entity types
ENTITY_TYPES = [
    "AllergyIntolerance", "Medication", "Immunization", "Procedures",
    "Conditions", "Patient", "Person", "PractitionerRole", "Slot",
    "DocumentReference", "Encounter", "Observation-PathologyResult",
    "Observation", "ImagingStudy", "Medication Request", "ServiceRequest"
]

# Terminology systems
SNOMED_SYSTEM = "http://snomed.info/sct"
ICD10AM_SYSTEM = "http://hl7.org/fhir/sid/icd-10-am"
AMT_SYSTEM = "http://snomed.info/sct"  # AMT codes are SNOMED CT AU codes
LOINC_SYSTEM = "http://loinc.org"
AIR_SYSTEM = "urn:oid:1.2.36.1.2001.1005.17"
DICOM_SYSTEM = "http://dicom.nema.org/resources/ontology/DCM"
