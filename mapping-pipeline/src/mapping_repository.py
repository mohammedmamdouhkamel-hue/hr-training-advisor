"""Mapping Repository: SQLite-based persistence for clinical code mappings.

Provides storage, retrieval, and management of mapping results across
all tiers of the mapping pipeline. Supports querying unmapped records,
managing the SME review queue, and generating mapping statistics.
"""

import logging
import sqlite3
from typing import Optional

from src.models import SourceRecord, MappingResult

logger = logging.getLogger(__name__)


class MappingRepository:
    """SQLite-based repository for storing and managing code mappings.

    Can be used as a context manager:

        with MappingRepository("mappings.db") as repo:
            repo.save_mapping(result)

    Or used directly with explicit close():

        repo = MappingRepository("mappings.db")
        repo.save_mapping(result)
        repo.close()
    """

    def __init__(self, db_path: str = ":memory:"):
        """Initialise the repository with a database path.

        Args:
            db_path: Path to the SQLite database file.
                     Use ':memory:' for an in-memory database (default).
        """
        self.db_path = db_path
        self.conn = None
        self._init_db()

    def __enter__(self):
        """Support use as a context manager."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Close the database when exiting the context."""
        self.close()
        return False

    # ------------------------------------------------------------------ #
    # Database initialisation
    # ------------------------------------------------------------------ #

    def _init_db(self):
        """Create the mappings table if it doesn't exist."""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")

        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                source_code TEXT NOT NULL,
                source_display TEXT,
                target_code TEXT,
                target_display TEXT,
                target_system TEXT,
                mapping_tier INTEGER,
                confidence REAL,
                status TEXT DEFAULT 'unmapped',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by TEXT,
                review_notes TEXT
            )
            """
        )

        # Index for lookups by entity_type + source_code
        self.conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_mappings_lookup
            ON mappings (entity_type, source_code)
            """
        )

        # Index for status-based queries (unmapped, review queue)
        self.conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_mappings_status
            ON mappings (status)
            """
        )

        self.conn.commit()

    # ------------------------------------------------------------------ #
    # Save operations
    # ------------------------------------------------------------------ #

    def save_mapping(self, result: MappingResult) -> int:
        """Save a mapping result. Returns the row ID.

        If a mapping already exists for the same entity_type and
        source_code, it is replaced.

        Args:
            result: The MappingResult to persist.

        Returns:
            The SQLite row ID of the saved record.
        """
        cursor = self.conn.execute(
            """
            INSERT OR REPLACE INTO mappings (
                entity_type, source_code, source_display,
                target_code, target_display, target_system,
                mapping_tier, confidence, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result.source.entity_type,
                result.source.source_code,
                result.source.source_display,
                result.target_code,
                result.target_display,
                result.target_system,
                result.mapping_tier,
                result.confidence,
                result.status,
            ),
        )
        self.conn.commit()
        return cursor.lastrowid

    def save_mappings(self, results: list[MappingResult]) -> int:
        """Save multiple mapping results. Returns count saved.

        Args:
            results: List of MappingResult objects to persist.

        Returns:
            The number of records saved.
        """
        count = 0
        for result in results:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO mappings (
                    entity_type, source_code, source_display,
                    target_code, target_display, target_system,
                    mapping_tier, confidence, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    result.source.entity_type,
                    result.source.source_code,
                    result.source.source_display,
                    result.target_code,
                    result.target_display,
                    result.target_system,
                    result.mapping_tier,
                    result.confidence,
                    result.status,
                ),
            )
            count += 1
        self.conn.commit()
        return count

    # ------------------------------------------------------------------ #
    # Query operations
    # ------------------------------------------------------------------ #

    def get_mapping(
        self, entity_type: str, source_code: str
    ) -> Optional[MappingResult]:
        """Look up an existing mapping.

        Args:
            entity_type: The clinical entity type.
            source_code: The original source code.

        Returns:
            A MappingResult if found, or None.
        """
        row = self.conn.execute(
            """
            SELECT * FROM mappings
            WHERE entity_type = ? AND source_code = ?
            ORDER BY id DESC LIMIT 1
            """,
            (entity_type, source_code),
        ).fetchone()

        if row is None:
            return None

        return self._row_to_result(row)

    def get_unmapped(self, entity_type: str = None) -> list[MappingResult]:
        """Get all unmapped records, optionally filtered by entity type.

        Args:
            entity_type: If provided, filter results to this entity type only.

        Returns:
            List of unmapped MappingResult objects.
        """
        if entity_type is not None:
            rows = self.conn.execute(
                """
                SELECT * FROM mappings
                WHERE status = 'unmapped' AND entity_type = ?
                ORDER BY source_display
                """,
                (entity_type,),
            ).fetchall()
        else:
            rows = self.conn.execute(
                """
                SELECT * FROM mappings
                WHERE status = 'unmapped'
                ORDER BY entity_type, source_display
                """
            ).fetchall()

        return [self._row_to_result(row) for row in rows]

    def get_review_queue(self) -> list[MappingResult]:
        """Get records requiring SME review (status='review_required').

        Returns:
            List of MappingResult objects awaiting review.
        """
        rows = self.conn.execute(
            """
            SELECT * FROM mappings
            WHERE status = 'review_required'
            ORDER BY confidence ASC, entity_type, source_display
            """
        ).fetchall()

        return [self._row_to_result(row) for row in rows]

    # ------------------------------------------------------------------ #
    # Review operations
    # ------------------------------------------------------------------ #

    def approve_mapping(
        self,
        entity_type: str,
        source_code: str,
        reviewed_by: str = "SME",
    ) -> bool:
        """Approve a mapping (changes status from review_required to mapped).

        Args:
            entity_type: The clinical entity type.
            source_code: The original source code.
            reviewed_by: Identifier for the person who reviewed it.

        Returns:
            True if a record was updated, False if not found.
        """
        cursor = self.conn.execute(
            """
            UPDATE mappings
            SET status = 'mapped',
                mapping_tier = 3,
                reviewed_by = ?
            WHERE entity_type = ? AND source_code = ?
              AND status = 'review_required'
            """,
            (reviewed_by, entity_type, source_code),
        )
        self.conn.commit()
        return cursor.rowcount > 0

    # ------------------------------------------------------------------ #
    # Statistics
    # ------------------------------------------------------------------ #

    def get_statistics(self) -> dict:
        """Return mapping statistics (counts by status, tier, entity).

        Returns:
            A dict with structure:
            {
                "total": N,
                "mapped": N,
                "unmapped": N,
                "review_required": N,
                "by_tier": {1: N, 2: N, 3: N},
                "by_entity": {
                    "Conditions": {"mapped": N, "unmapped": N, "review_required": N, "total": N},
                    ...
                }
            }
        """
        stats = {
            "total": 0,
            "mapped": 0,
            "unmapped": 0,
            "review_required": 0,
            "by_tier": {},
            "by_entity": {},
        }

        # Overall counts by status
        rows = self.conn.execute(
            """
            SELECT status, COUNT(*) as cnt
            FROM mappings
            GROUP BY status
            """
        ).fetchall()

        for row in rows:
            status = row["status"]
            count = row["cnt"]
            stats["total"] += count
            if status in ("mapped", "unmapped", "review_required"):
                stats[status] = count

        # Counts by tier
        rows = self.conn.execute(
            """
            SELECT mapping_tier, COUNT(*) as cnt
            FROM mappings
            WHERE mapping_tier IS NOT NULL AND mapping_tier > 0
            GROUP BY mapping_tier
            """
        ).fetchall()

        for row in rows:
            tier = row["mapping_tier"]
            stats["by_tier"][tier] = row["cnt"]

        # Counts by entity type and status
        rows = self.conn.execute(
            """
            SELECT entity_type, status, COUNT(*) as cnt
            FROM mappings
            GROUP BY entity_type, status
            """
        ).fetchall()

        for row in rows:
            entity = row["entity_type"]
            status = row["status"]
            count = row["cnt"]

            if entity not in stats["by_entity"]:
                stats["by_entity"][entity] = {
                    "mapped": 0,
                    "unmapped": 0,
                    "review_required": 0,
                    "total": 0,
                }

            stats["by_entity"][entity]["total"] += count
            if status in ("mapped", "unmapped", "review_required"):
                stats["by_entity"][entity][status] = count

        return stats

    # ------------------------------------------------------------------ #
    # Lifecycle
    # ------------------------------------------------------------------ #

    def close(self):
        """Close the database connection."""
        if self.conn is not None:
            self.conn.commit()
            self.conn.close()
            self.conn = None

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #

    def _row_to_result(self, row: sqlite3.Row) -> MappingResult:
        """Convert a database row to a MappingResult.

        Args:
            row: A sqlite3.Row from the mappings table.

        Returns:
            A fully populated MappingResult.
        """
        source = SourceRecord(
            entity_type=row["entity_type"],
            source_code=row["source_code"],
            source_display=row["source_display"] or "",
        )

        return MappingResult(
            source=source,
            target_code=row["target_code"],
            target_display=row["target_display"],
            target_system=row["target_system"],
            mapping_tier=row["mapping_tier"] or 0,
            confidence=row["confidence"] or 0.0,
            status=row["status"] or "unmapped",
        )
