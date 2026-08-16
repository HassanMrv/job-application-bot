import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import ExcelJS from "exceljs";

import type { ApplicationLogEntry, BotRun } from "../domain/application.js";
import type { ApplicationRepository } from "../repositories/application.repository.js";

export class ReportService {
  constructor(
    private readonly repository: ApplicationRepository,
    private readonly timeZone: string,
  ) {
    // Fail early with a useful error when REPORT_TIMEZONE is invalid.
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  }

  async exportRun(runId: number, outputPath: string): Promise<void> {
    const run = this.repository.getRun(runId);
    if (run == null) throw new Error(`Run ${runId} does not exist`);
    await this.writeWorkbook(outputPath, [run], this.repository.listEntries(runId), `Run ${runId}`);
  }

  async exportAll(outputPath: string): Promise<void> {
    await this.writeWorkbook(
      outputPath,
      this.repository.listRuns(),
      this.repository.listEntries(),
      "Complete history",
    );
  }

  async exportDay(date: string, outputPath: string): Promise<void> {
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || Number.isNaN(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new Error("Date must use YYYY-MM-DD format");
    }
    const runs = this.repository.listRuns().filter((run) => this.localDate(run.startedAt) === date);
    const entries = this.repository.listEntries().filter((entry) => this.localDate(entry.occurredAt) === date);
    await this.writeWorkbook(outputPath, runs, entries, `${date} (${this.timeZone})`);
  }

  private localDate(isoTimestamp: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(isoTimestamp));
    const value = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${value("year")}-${value("month")}-${value("day")}`;
  }

  private formatTimestamp(isoTimestamp: string | null): string {
    if (isoTimestamp == null) return "";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: this.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(new Date(isoTimestamp));
  }

  private async writeWorkbook(
    outputPath: string,
    runs: BotRun[],
    entries: ApplicationLogEntry[],
    scope: string,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Job Application Bot";
    workbook.created = new Date();

    const summary = workbook.addWorksheet("Summary", { views: [{ state: "frozen", ySplit: 1 }] });
    summary.columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 55 },
    ];
    const count = (status: ApplicationLogEntry["status"]): number =>
      entries.filter((entry) => entry.status === status).length;
    const uniqueJobs = new Set(entries.map((entry) => `${entry.platform}:${entry.externalId}`)).size;
    summary.addRows([
      { metric: "Report scope", value: scope },
      { metric: "Timezone", value: this.timeZone },
      { metric: "Generated at", value: this.formatTimestamp(new Date().toISOString()) },
      { metric: "Runs", value: runs.length },
      { metric: "Recorded events", value: entries.length },
      { metric: "Unique jobs", value: uniqueJobs },
      { metric: "Applied", value: count("applied") },
      { metric: "Dry run", value: count("dry-run") },
      { metric: "Review", value: count("review") },
      { metric: "Skipped", value: count("skipped") },
      { metric: "Failed", value: count("failed") },
      { metric: "Legacy events (no run)", value: entries.filter((entry) => entry.runId == null).length },
    ]);

    const runsSheet = workbook.addWorksheet("Runs", { views: [{ state: "frozen", ySplit: 1 }] });
    runsSheet.columns = [
      { header: "Run ID", key: "id", width: 10 },
      { header: "Started", key: "started", width: 22 },
      { header: "Finished", key: "finished", width: 22 },
      { header: "Status", key: "status", width: 13 },
      { header: "Platform", key: "platform", width: 14 },
      { header: "Mode", key: "mode", width: 13 },
      { header: "Discovered", key: "discovered", width: 12 },
      { header: "Processed", key: "processed", width: 12 },
      { header: "Applied", key: "applied", width: 10 },
      { header: "Dry run", key: "dryRun", width: 10 },
      { header: "Review", key: "review", width: 10 },
      { header: "Skipped", key: "skipped", width: 10 },
      { header: "Failed", key: "failed", width: 10 },
      { header: "Fatal error", key: "fatalError", width: 50 },
      { header: "Configuration", key: "configuration", width: 70 },
    ];
    runsSheet.addRows(runs.map((run) => ({
      id: run.id,
      started: this.formatTimestamp(run.startedAt),
      finished: this.formatTimestamp(run.finishedAt),
      status: run.status,
      platform: run.platform,
      mode: run.executionMode,
      discovered: run.discoveredCount,
      processed: run.processedCount,
      applied: run.appliedCount,
      dryRun: run.dryRunCount,
      review: run.reviewCount,
      skipped: run.skippedCount,
      failed: run.failedCount,
      fatalError: run.fatalError ?? "",
      configuration: JSON.stringify(run.configuration),
    })));

    const jobs = workbook.addWorksheet("Jobs", { views: [{ state: "frozen", ySplit: 1 }] });
    jobs.columns = [
      { header: "Run ID", key: "runId", width: 10 },
      { header: "Occurred", key: "occurred", width: 22 },
      { header: "Platform", key: "platform", width: 14 },
      { header: "Job ID", key: "externalId", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Title", key: "title", width: 45 },
      { header: "Company", key: "company", width: 35 },
      { header: "Our score", key: "ourScore", width: 12 },
      { header: "JobVision score", key: "jobVisionScore", width: 16 },
      { header: "Reasons / error", key: "reasons", width: 70 },
    ];
    jobs.addRows(entries.map((entry) => ({
      runId: entry.runId ?? "legacy",
      occurred: this.formatTimestamp(entry.occurredAt),
      platform: entry.platform,
      externalId: entry.externalId,
      status: entry.status,
      title: entry.title,
      company: entry.company,
      ourScore: entry.ourScore,
      jobVisionScore: entry.jobVisionScore,
      reasons: entry.reasons.join("; "),
    })));

    for (const sheet of [summary, runsSheet, jobs]) {
      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
      header.alignment = { vertical: "middle" };
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await workbook.xlsx.writeFile(outputPath);
  }
}
