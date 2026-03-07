"""FHIR R4 Resource Transformer.

Transforms mapped clinical code records into FHIR R4 compliant JSON resources.
Supports Condition, Procedure, AllergyIntolerance, Medication, Immunization,
Observation, Encounter, and generic Basic resource types.
"""

import hashlib
from typing import Optional

from src.models import MappingResult


class FHIRTransformer:
    """Transforms mapped records into FHIR R4 resources (JSON dicts).

    Each entity type is dispatched to a specific transform method that builds
    the appropriate FHIR resource structure. Only records with status 'mapped'
    are transformed; unmapped records return None.
    """

    # Maps entity_type values to their corresponding transform methods.
    ENTITY_TRANSFORM_MAP = {
        "Conditions": "_transform_condition",
        "Procedures": "_transform_procedure",
        "AllergyIntolerance": "_transform_allergy",
        "Medication": "_transform_medication",
        "Immunization": "_transform_immunization",
        "Observation": "_transform_observation",
        "Observation-PathologyResult": "_transform_observation",
        "Encounter": "_transform_encounter",
    }

    def transform(self, result: MappingResult) -> Optional[dict]:
        """Transform a single mapped result into a FHIR resource.

        Args:
            result: A MappingResult with mapping status and target codes.

        Returns:
            A FHIR resource dict if the result is mapped, otherwise None.
        """
        if result.status != "mapped":
            return None

        method_name = self.ENTITY_TRANSFORM_MAP.get(
            result.source.entity_type, "_transform_generic"
        )
        method = getattr(self, method_name)
        return method(result)

    def transform_batch(self, results: list[MappingResult]) -> list[dict]:
        """Transform a batch of mapped results into FHIR resources.

        Args:
            results: A list of MappingResult objects.

        Returns:
            A list of FHIR resource dicts (only for successfully mapped results).
        """
        resources = []
        for result in results:
            resource = self.transform(result)
            if resource is not None:
                resources.append(resource)
        return resources

    @staticmethod
    def _generate_id(entity_type: str, source_code: str) -> str:
        """Generate a deterministic resource ID from entity type and source code.

        Uses a truncated SHA-256 hash to produce a valid FHIR id string.

        Args:
            entity_type: The clinical entity category.
            source_code: The source system code.

        Returns:
            A deterministic, URL-safe identifier string.
        """
        raw = f"{entity_type}-{source_code}"
        hash_suffix = hashlib.sha256(raw.encode()).hexdigest()[:12]
        # Sanitize entity_type for use in ID (lowercase, remove spaces)
        prefix = entity_type.lower().replace(" ", "-").replace("_", "-")
        return f"{prefix}-{hash_suffix}"

    def _build_coding(self, result: MappingResult) -> dict:
        """Build a FHIR CodeableConcept with coding and text.

        Args:
            result: The mapping result containing target and source information.

        Returns:
            A CodeableConcept dict with coding array and text.
        """
        return {
            "coding": [
                {
                    "system": result.target_system,
                    "code": result.target_code,
                    "display": result.target_display,
                }
            ],
            "text": result.source.source_display,
        }

    def _transform_condition(self, result: MappingResult) -> dict:
        """Build a FHIR Condition resource.

        Args:
            result: A mapped MappingResult for a condition entity.

        Returns:
            A FHIR Condition resource dict.
        """
        return {
            "resourceType": "Condition",
            "id": self._generate_id("condition", result.source.source_code),
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                        "display": "Active",
                    }
                ]
            },
            "code": self._build_coding(result),
            "subject": {"reference": "Patient/example"},
        }

    def _transform_procedure(self, result: MappingResult) -> dict:
        """Build a FHIR Procedure resource.

        Args:
            result: A mapped MappingResult for a procedure entity.

        Returns:
            A FHIR Procedure resource dict.
        """
        return {
            "resourceType": "Procedure",
            "id": self._generate_id("procedure", result.source.source_code),
            "status": "completed",
            "code": self._build_coding(result),
            "subject": {"reference": "Patient/example"},
        }

    def _transform_allergy(self, result: MappingResult) -> dict:
        """Build a FHIR AllergyIntolerance resource.

        Args:
            result: A mapped MappingResult for an allergy entity.

        Returns:
            A FHIR AllergyIntolerance resource dict.
        """
        return {
            "resourceType": "AllergyIntolerance",
            "id": self._generate_id("allergyintolerance", result.source.source_code),
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                        "code": "active",
                        "display": "Active",
                    }
                ]
            },
            "code": self._build_coding(result),
            "patient": {"reference": "Patient/example"},
        }

    def _transform_medication(self, result: MappingResult) -> dict:
        """Build a FHIR Medication resource.

        Args:
            result: A mapped MappingResult for a medication entity.

        Returns:
            A FHIR Medication resource dict.
        """
        return {
            "resourceType": "Medication",
            "id": self._generate_id("medication", result.source.source_code),
            "code": self._build_coding(result),
        }

    def _transform_immunization(self, result: MappingResult) -> dict:
        """Build a FHIR Immunization resource.

        Args:
            result: A mapped MappingResult for an immunization entity.

        Returns:
            A FHIR Immunization resource dict.
        """
        return {
            "resourceType": "Immunization",
            "id": self._generate_id("immunization", result.source.source_code),
            "status": "completed",
            "vaccineCode": self._build_coding(result),
            "patient": {"reference": "Patient/example"},
            "occurrenceDateTime": "2024-01-01",
        }

    def _transform_observation(self, result: MappingResult) -> dict:
        """Build a FHIR Observation resource.

        Handles both general observations and pathology results.

        Args:
            result: A mapped MappingResult for an observation entity.

        Returns:
            A FHIR Observation resource dict.
        """
        return {
            "resourceType": "Observation",
            "id": self._generate_id("observation", result.source.source_code),
            "status": "final",
            "code": self._build_coding(result),
            "subject": {"reference": "Patient/example"},
        }

    def _transform_encounter(self, result: MappingResult) -> dict:
        """Build a FHIR Encounter resource.

        Args:
            result: A mapped MappingResult for an encounter entity.

        Returns:
            A FHIR Encounter resource dict.
        """
        return {
            "resourceType": "Encounter",
            "id": self._generate_id("encounter", result.source.source_code),
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory",
            },
            "type": [self._build_coding(result)],
            "subject": {"reference": "Patient/example"},
        }

    def _transform_generic(self, result: MappingResult) -> dict:
        """Generic FHIR Basic resource for entities without specific transformers.

        Used as a fallback for entity types that do not have a dedicated
        FHIR resource mapping.

        Args:
            result: A mapped MappingResult for an unrecognized entity type.

        Returns:
            A FHIR Basic resource dict.
        """
        return {
            "resourceType": "Basic",
            "id": self._generate_id("basic", result.source.source_code),
            "code": self._build_coding(result),
            "subject": {"reference": "Patient/example"},
        }
