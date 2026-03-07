"""Quality Reporting.

Generates quality and coverage reports for the clinical code mapping pipeline.
Provides per-entity coverage breakdowns, tier distribution analysis, and
review queue summaries for SME workflows.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class QualityReporter:
    """Generates quality and coverage reports for the mapping pipeline.

    Reads mapping results from the repository and computes coverage
    percentages, tier distributions, and review queue summaries.

    Args:
        repository: The mapping results repository with get_statistics()
            and query methods.
    """

    def __init__(self, repository: Any):
        self.repository = repository

    def generate_report(self) -> dict:
        """Generate a comprehensive quality report.

        Combines coverage-by-entity, tier distribution, and review queue
        data into a single structured report.

        Returns:
            A dict containing overall_summary, coverage_by_entity,
            tier_distribution, and review_queue sections.
        """
        stats = self._get_statistics()
        coverage = self.coverage_by_entity()
        tiers = self.tier_distribution()
        review = self.review_queue_summary()

        total = stats.get("total", 0)
        mapped = stats.get("mapped", 0)
        unmapped = stats.get("unmapped", 0)
        review_required = stats.get("review_required", 0)
        overall_coverage = (mapped / total * 100) if total > 0 else 0.0

        return {
            "overall_summary": {
                "total_records": total,
                "mapped": mapped,
                "unmapped": unmapped,
                "review_required": review_required,
                "coverage_percent": round(overall_coverage, 2),
            },
            "coverage_by_entity": coverage,
            "tier_distribution": tiers,
            "review_queue": review,
        }

    def coverage_by_entity(self) -> dict:
        """Return mapping coverage percentage for each entity type.

        Returns:
            A dict mapping entity_type to a dict with total, mapped, and
            coverage_percent keys.
        """
        stats = self._get_statistics()
        entity_stats = stats.get("by_entity", {})

        coverage = {}
        for entity_type, entity_data in entity_stats.items():
            total = entity_data.get("total", 0)
            mapped = entity_data.get("mapped", 0)
            pct = (mapped / total * 100) if total > 0 else 0.0
            coverage[entity_type] = {
                "total": total,
                "mapped": mapped,
                "coverage_percent": round(pct, 2),
            }

        return coverage

    def tier_distribution(self) -> dict:
        """Return distribution of mappings across tiers.

        Returns:
            A dict mapping tier number (as string) to count and percentage.
        """
        stats = self._get_statistics()
        tier_data = stats.get("by_tier", {})
        total_mapped = sum(tier_data.values()) if tier_data else 0

        distribution = {}
        for tier, count in sorted(tier_data.items(), key=lambda x: x[0]):
            pct = (count / total_mapped * 100) if total_mapped > 0 else 0.0
            distribution[str(tier)] = {
                "count": count,
                "percent": round(pct, 2),
            }

        return distribution

    def review_queue_summary(self) -> dict:
        """Summary of records awaiting SME review.

        Returns:
            A dict with total_pending, by_entity breakdown, and a sample
            of records needing review.
        """
        stats = self._get_statistics()
        review_required = stats.get("review_required", 0)
        entity_stats = stats.get("by_entity", {})

        by_entity = {}
        for entity_type, entity_data in entity_stats.items():
            review_count = entity_data.get("review_required", 0)
            if review_count > 0:
                by_entity[entity_type] = review_count

        return {
            "total_pending": review_required,
            "by_entity": by_entity,
        }

    def format_report(self, report: dict) -> str:
        """Format report as readable text.

        Produces a human-readable text report with overall summary,
        per-entity coverage table, tier distribution, and review queue.

        Args:
            report: A report dict as returned by generate_report().

        Returns:
            A formatted multi-line string suitable for console output.
        """
        lines = []
        separator = "=" * 70

        # Title
        lines.append(separator)
        lines.append("  CLINICAL CODE MAPPING - QUALITY REPORT")
        lines.append(separator)
        lines.append("")

        # Overall Summary
        summary = report.get("overall_summary", {})
        lines.append("OVERALL SUMMARY")
        lines.append("-" * 40)
        lines.append(f"  Total Records:      {summary.get('total_records', 0):>8}")
        lines.append(f"  Mapped:             {summary.get('mapped', 0):>8}")
        lines.append(f"  Unmapped:           {summary.get('unmapped', 0):>8}")
        lines.append(f"  Review Required:    {summary.get('review_required', 0):>8}")
        lines.append(f"  Coverage:           {summary.get('coverage_percent', 0):>7.1f}%")
        lines.append("")

        # Coverage by Entity
        coverage = report.get("coverage_by_entity", {})
        if coverage:
            lines.append("COVERAGE BY ENTITY TYPE")
            lines.append("-" * 60)
            lines.append(
                f"  {'Entity Type':<30} {'Total':>8} {'Mapped':>8} {'Coverage':>10}"
            )
            lines.append(f"  {'-' * 56}")

            for entity_type, data in sorted(coverage.items()):
                lines.append(
                    f"  {entity_type:<30} {data['total']:>8} "
                    f"{data['mapped']:>8} {data['coverage_percent']:>9.1f}%"
                )
            lines.append("")

        # Tier Distribution
        tiers = report.get("tier_distribution", {})
        if tiers:
            lines.append("MAPPING TIER DISTRIBUTION")
            lines.append("-" * 40)
            tier_labels = {
                "1": "Tier 1 (Terminology Server)",
                "2": "Tier 2 (AI Mapping)",
                "3": "Tier 3 (SME Review)",
            }
            for tier, data in sorted(tiers.items()):
                label = tier_labels.get(tier, f"Tier {tier}")
                lines.append(
                    f"  {label:<30} {data['count']:>6} ({data['percent']:>5.1f}%)"
                )
            lines.append("")

        # Review Queue
        review = report.get("review_queue", {})
        total_pending = review.get("total_pending", 0)
        lines.append("REVIEW QUEUE")
        lines.append("-" * 40)
        lines.append(f"  Total Pending Review:  {total_pending}")

        by_entity = review.get("by_entity", {})
        if by_entity:
            lines.append("")
            lines.append(f"  {'Entity Type':<30} {'Pending':>8}")
            lines.append(f"  {'-' * 38}")
            for entity_type, count in sorted(by_entity.items()):
                lines.append(f"  {entity_type:<30} {count:>8}")

        lines.append("")
        lines.append(separator)

        return "\n".join(lines)

    def _get_statistics(self) -> dict:
        """Retrieve statistics from the repository.

        Wraps the repository call with error handling to return a safe
        default dict on failure.

        Returns:
            A statistics dict from the repository, or a default empty dict.
        """
        try:
            return self.repository.get_statistics()
        except Exception as exc:
            logger.error("Failed to retrieve statistics from repository: %s", exc)
            return {
                "total": 0,
                "mapped": 0,
                "unmapped": 0,
                "review_required": 0,
                "by_entity": {},
                "by_tier": {},
            }
