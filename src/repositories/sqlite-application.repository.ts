import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  ApplicationLogEntry,
  ApplicationStatus,
  BotRun,
  BotRunStatus,
  ExecutionMode,
  StartBotRun,
} from "../domain/application.js";
import type { PlatformId } from "../domain/job.js";
import type { ApplicationRepository } from "./application.repository.js";

export class SqliteApplicationRepository implements ApplicationRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS bot_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        platform TEXT NOT NULL,
        execution_mode TEXT NOT NULL,
        configuration TEXT NOT NULL,
        discovered_count INTEGER NOT NULL DEFAULT 0,
        fatal_error TEXT
      );
      CREATE TABLE IF NOT EXISTS application_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL,
        reasons TEXT NOT NULL,
        matching_score REAL,
        our_score REAL,
        jobvision_score REAL,
        occurred_at TEXT NOT NULL,
        run_id INTEGER REFERENCES bot_runs(id)
      );
      CREATE INDEX IF NOT EXISTS idx_application_job
      ON application_log(platform, external_id);
    `);
    const columns = this.database.prepare("PRAGMA table_info(application_log)").all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "run_id")) {
      this.database.exec("ALTER TABLE application_log ADD COLUMN run_id INTEGER REFERENCES bot_runs(id)");
    }
    if (!columns.some((column) => column.name === "our_score")) {
      this.database.exec("ALTER TABLE application_log ADD COLUMN our_score REAL");
    }
    if (!columns.some((column) => column.name === "jobvision_score")) {
      this.database.exec("ALTER TABLE application_log ADD COLUMN jobvision_score REAL");
    }
    this.database.exec("CREATE INDEX IF NOT EXISTS idx_application_run ON application_log(run_id)");
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
          (platform, external_id, title, company, status, reasons, our_score, jobvision_score, occurred_at, run_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        entry.platform,
        entry.externalId,
        entry.title,
        entry.company,
        entry.status,
        JSON.stringify(entry.reasons),
        entry.ourScore,
        entry.jobVisionScore,
        entry.occurredAt,
        entry.runId,
      );
  }

  startRun(run: StartBotRun): number {
    const result = this.database.prepare(`
      INSERT INTO bot_runs (started_at, status, platform, execution_mode, configuration)
      VALUES (?, 'running', ?, ?, ?)
    `).run(run.startedAt, run.platform, run.executionMode, JSON.stringify(run.configuration));
    return Number(result.lastInsertRowid);
  }

  finishRun(runId: number, status: "completed" | "failed", fatalError?: string): void {
    this.database.prepare(`
      UPDATE bot_runs SET finished_at = ?, status = ?, fatal_error = ? WHERE id = ?
    `).run(new Date().toISOString(), status, fatalError ?? null, runId);
  }

  setDiscoveredCount(runId: number, count: number): void {
    this.database.prepare("UPDATE bot_runs SET discovered_count = ? WHERE id = ?").run(count, runId);
  }

  countByStatus(runId?: number): Partial<Record<ApplicationStatus, number>> {
    const sql = runId == null
      ? "SELECT status, COUNT(*) AS count FROM application_log GROUP BY status"
      : "SELECT status, COUNT(*) AS count FROM application_log WHERE run_id = ? GROUP BY status";
    const statement = this.database.prepare(sql);
    const rows = (runId == null ? statement.all() : statement.all(runId)) as Array<{
      status: ApplicationStatus;
      count: number;
    }>;
    return Object.fromEntries(rows.map((row) => [row.status, row.count]));
  }

  getRun(runId: number): BotRun | null {
    const row = this.database.prepare("SELECT * FROM bot_runs WHERE id = ?").get(runId) as RunRow | undefined;
    return row == null ? null : this.mapRun(row);
  }

  listRuns(): BotRun[] {
    const rows = this.database.prepare("SELECT * FROM bot_runs ORDER BY id DESC").all() as unknown as RunRow[];
    return rows.map((row) => this.mapRun(row));
  }

  listEntries(runId?: number): ApplicationLogEntry[] {
    const statement = this.database.prepare(
      runId == null
        ? "SELECT * FROM application_log ORDER BY occurred_at, id"
        : "SELECT * FROM application_log WHERE run_id = ? ORDER BY occurred_at, id",
    );
    const rows = (runId == null ? statement.all() : statement.all(runId)) as unknown as LogRow[];
    return rows.map((row) => ({
      runId: row.run_id,
      platform: row.platform,
      externalId: row.external_id,
      title: row.title,
      company: row.company,
      status: row.status,
      reasons: JSON.parse(row.reasons) as string[],
      ourScore: row.our_score,
      jobVisionScore: row.jobvision_score ?? row.matching_score,
      occurredAt: row.occurred_at,
    }));
  }

  private mapRun(row: RunRow): BotRun {
    const counts = this.countByStatus(row.id);
    return {
      id: row.id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      status: row.status,
      platform: row.platform,
      executionMode: row.execution_mode,
      configuration: JSON.parse(row.configuration) as Record<string, unknown>,
      discoveredCount: row.discovered_count,
      processedCount: Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0),
      appliedCount: counts.applied ?? 0,
      skippedCount: counts.skipped ?? 0,
      dryRunCount: counts["dry-run"] ?? 0,
      reviewCount: counts.review ?? 0,
      failedCount: counts.failed ?? 0,
      fatalError: row.fatal_error,
    };
  }

  close(): void {
    this.database.close();
  }
}

interface RunRow {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: BotRunStatus;
  platform: PlatformId;
  execution_mode: ExecutionMode;
  configuration: string;
  discovered_count: number;
  fatal_error: string | null;
}

interface LogRow {
  run_id: number | null;
  platform: PlatformId;
  external_id: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  reasons: string;
  matching_score: number | null;
  our_score: number | null;
  jobvision_score: number | null;
  occurred_at: string;
}
