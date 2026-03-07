"""FHIR Server Loader.

Loads FHIR R4 resources into a HAPI FHIR server via REST API.
Supports individual PUT operations, batch loading, and FHIR transaction Bundles.
"""

import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)


class FHIRLoader:
    """Loads FHIR resources into a HAPI FHIR server.

    Provides methods for loading individual resources, batch loading with
    error tracking, and transactional Bundle submissions.

    Args:
        fhir_server_url: Base URL of the FHIR server (e.g. http://localhost:8080/fhir).
    """

    FHIR_HEADERS = {
        "Content-Type": "application/fhir+json",
        "Accept": "application/fhir+json",
    }
    REQUEST_TIMEOUT = 30  # seconds

    def __init__(self, fhir_server_url: str):
        self.fhir_server_url = fhir_server_url.rstrip("/")

    def load_resource(self, resource: dict) -> dict:
        """Load a single FHIR resource via PUT.

        Uses PUT to create or update the resource at its canonical URL,
        which is constructed from the resourceType and id fields.

        Args:
            resource: A FHIR resource dict with at least resourceType and id.

        Returns:
            A status dict with keys: status, resource_type, id, and optionally
            status_code and error.
        """
        resource_type = resource.get("resourceType")
        resource_id = resource.get("id")

        if not resource_type or not resource_id:
            return {
                "status": "error",
                "resource_type": resource_type,
                "id": resource_id,
                "error": "Resource must have both resourceType and id",
            }

        url = f"{self.fhir_server_url}/{resource_type}/{resource_id}"

        try:
            response = requests.put(
                url,
                json=resource,
                headers=self.FHIR_HEADERS,
                timeout=self.REQUEST_TIMEOUT,
            )

            if response.status_code in (200, 201):
                logger.info(
                    "Successfully loaded %s/%s (HTTP %d)",
                    resource_type,
                    resource_id,
                    response.status_code,
                )
                return {
                    "status": "success",
                    "resource_type": resource_type,
                    "id": resource_id,
                    "status_code": response.status_code,
                }
            else:
                error_detail = ""
                try:
                    error_body = response.json()
                    if "issue" in error_body:
                        issues = error_body["issue"]
                        error_detail = "; ".join(
                            issue.get("diagnostics", issue.get("details", {}).get("text", ""))
                            for issue in issues
                        )
                except (ValueError, KeyError):
                    error_detail = response.text[:500]

                logger.error(
                    "Failed to load %s/%s: HTTP %d - %s",
                    resource_type,
                    resource_id,
                    response.status_code,
                    error_detail,
                )
                return {
                    "status": "error",
                    "resource_type": resource_type,
                    "id": resource_id,
                    "status_code": response.status_code,
                    "error": error_detail,
                }

        except requests.ConnectionError as exc:
            logger.error(
                "Connection error loading %s/%s: %s",
                resource_type,
                resource_id,
                exc,
            )
            return {
                "status": "error",
                "resource_type": resource_type,
                "id": resource_id,
                "error": f"Connection error: {exc}",
            }
        except requests.Timeout as exc:
            logger.error(
                "Timeout loading %s/%s: %s",
                resource_type,
                resource_id,
                exc,
            )
            return {
                "status": "error",
                "resource_type": resource_type,
                "id": resource_id,
                "error": f"Request timed out: {exc}",
            }
        except requests.RequestException as exc:
            logger.error(
                "Request error loading %s/%s: %s",
                resource_type,
                resource_id,
                exc,
            )
            return {
                "status": "error",
                "resource_type": resource_type,
                "id": resource_id,
                "error": f"Request error: {exc}",
            }

    def load_batch(self, resources: list[dict]) -> dict:
        """Load multiple resources individually. Returns summary stats.

        Iterates over each resource and calls load_resource. Tracks successes
        and failures with detailed error information.

        Args:
            resources: A list of FHIR resource dicts.

        Returns:
            A summary dict with keys: total, success, failed, errors.
        """
        total = len(resources)
        success_count = 0
        failed_count = 0
        errors = []

        for i, resource in enumerate(resources):
            logger.info(
                "Loading resource %d/%d: %s/%s",
                i + 1,
                total,
                resource.get("resourceType", "Unknown"),
                resource.get("id", "Unknown"),
            )
            result = self.load_resource(resource)

            if result["status"] == "success":
                success_count += 1
            else:
                failed_count += 1
                errors.append({
                    "resource_type": result.get("resource_type"),
                    "id": result.get("id"),
                    "error": result.get("error"),
                })

        logger.info(
            "Batch load complete: %d total, %d success, %d failed",
            total,
            success_count,
            failed_count,
        )

        return {
            "total": total,
            "success": success_count,
            "failed": failed_count,
            "errors": errors,
        }

    def load_bundle(self, resources: list[dict]) -> dict:
        """Load resources as a FHIR transaction Bundle.

        Builds a FHIR Bundle of type 'transaction' with PUT entries for each
        resource, then POSTs the entire Bundle to the FHIR server root.

        Args:
            resources: A list of FHIR resource dicts.

        Returns:
            A status dict with keys: status, total, and optionally status_code
            and error.
        """
        entries = []
        for resource in resources:
            resource_type = resource.get("resourceType", "Basic")
            resource_id = resource.get("id", "unknown")
            entries.append({
                "resource": resource,
                "request": {
                    "method": "PUT",
                    "url": f"{resource_type}/{resource_id}",
                },
            })

        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": entries,
        }

        url = f"{self.fhir_server_url}/"

        try:
            response = requests.post(
                url,
                json=bundle,
                headers=self.FHIR_HEADERS,
                timeout=self.REQUEST_TIMEOUT * 2,  # Bundles may take longer
            )

            if response.status_code in (200, 201):
                logger.info(
                    "Successfully loaded transaction Bundle with %d entries",
                    len(entries),
                )
                return {
                    "status": "success",
                    "total": len(entries),
                    "status_code": response.status_code,
                }
            else:
                error_detail = ""
                try:
                    error_body = response.json()
                    if "issue" in error_body:
                        issues = error_body["issue"]
                        error_detail = "; ".join(
                            issue.get("diagnostics", issue.get("details", {}).get("text", ""))
                            for issue in issues
                        )
                except (ValueError, KeyError):
                    error_detail = response.text[:500]

                logger.error(
                    "Failed to load Bundle: HTTP %d - %s",
                    response.status_code,
                    error_detail,
                )
                return {
                    "status": "error",
                    "total": len(entries),
                    "status_code": response.status_code,
                    "error": error_detail,
                }

        except requests.ConnectionError as exc:
            logger.error("Connection error loading Bundle: %s", exc)
            return {
                "status": "error",
                "total": len(entries),
                "error": f"Connection error: {exc}",
            }
        except requests.Timeout as exc:
            logger.error("Timeout loading Bundle: %s", exc)
            return {
                "status": "error",
                "total": len(entries),
                "error": f"Request timed out: {exc}",
            }
        except requests.RequestException as exc:
            logger.error("Request error loading Bundle: %s", exc)
            return {
                "status": "error",
                "total": len(entries),
                "error": f"Request error: {exc}",
            }

    def verify_resource(self, resource_type: str, resource_id: str) -> Optional[dict]:
        """Verify a resource exists on the server by fetching it.

        Args:
            resource_type: The FHIR resource type (e.g. 'Condition').
            resource_id: The resource ID.

        Returns:
            The resource dict if found, or None if not found or on error.
        """
        url = f"{self.fhir_server_url}/{resource_type}/{resource_id}"

        try:
            response = requests.get(
                url,
                headers={"Accept": "application/fhir+json"},
                timeout=self.REQUEST_TIMEOUT,
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.debug(
                    "Resource %s/%s not found (HTTP %d)",
                    resource_type,
                    resource_id,
                    response.status_code,
                )
                return None

        except requests.RequestException as exc:
            logger.error(
                "Error verifying %s/%s: %s", resource_type, resource_id, exc
            )
            return None

    def get_resource_count(self, resource_type: str) -> int:
        """Get count of resources of a given type on the server.

        Uses the FHIR _summary=count parameter for efficient counting.

        Args:
            resource_type: The FHIR resource type (e.g. 'Condition').

        Returns:
            The total count of resources, or 0 on error.
        """
        url = f"{self.fhir_server_url}/{resource_type}"
        params = {"_summary": "count"}

        try:
            response = requests.get(
                url,
                params=params,
                headers={"Accept": "application/fhir+json"},
                timeout=self.REQUEST_TIMEOUT,
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("total", 0)
            else:
                logger.warning(
                    "Could not get count for %s (HTTP %d)",
                    resource_type,
                    response.status_code,
                )
                return 0

        except requests.RequestException as exc:
            logger.error("Error getting count for %s: %s", resource_type, exc)
            return 0
