import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { ApplicationLogEntry, ApplicationStatus } from "../domain/application.js";
import type { PlatformId } from "../domain/job.js";
import type { ApplicationRepository } from "./application.repository.js";

export class SqliteApplicationRepository implements ApplicationRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS application_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL,
        reasons TEXT NOT NULL,
        matching_score REAL,
        occurred_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_application_job
      ON application_log(platform, external_id);
    `);
  }

  hasFinalRecord(platform: PlatformId, externalId: string): boolean {
    const row = this.database
      .prepare(`
        SELECT 1 AS found FROM application_log
        WHERE platform = ? AND external_id = ?
          AND status = 'applied'
        LIMIT 1
      `)
      .get(platform, externalId) as { found: number } | undefined;
    return row != null;
  }

  save(entry: ApplicationLogEntry): void {
    this.database
      .prepare(`
        INSERT INTO application_log
          (platform, external_id, title, company, status, reasons, matching_score, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        entry.platform,
        entry.externalId,
        entry.title,
        entry.company,
        entry.status,
        JSON.stringify(entry.reasons),
        entry.matchingScore,
        entry.occurredAt,
      );
  }

  countByStatus(): Partial<Record<ApplicationStatus, number>> {
    const rows = this.database
      .prepare("SELECT status, COUNT(*) AS count FROM application_log GROUP BY status")
      .all() as Array<{ status: ApplicationStatus; count: number }>;
    return Object.fromEntries(rows.map((row) => [row.status, row.count]));
  }

  close(): void {
    this.database.close();
  }
}
