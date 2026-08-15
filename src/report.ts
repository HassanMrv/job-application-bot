import { resolve } from "node:path";

import dotenv from "dotenv";

import { SqliteApplicationRepository } from "./repositories/sqlite-application.repository.js";
import { ReportService } from "./services/report.service.js";

dotenv.config();

async function main(): Promise<void> {
  const [scope, value] = process.argv.slice(2);
  const databasePath = resolve(process.env.DATABASE_PATH?.trim() || "data/applications.sqlite");
  const reportDirectory = resolve(process.env.REPORT_DIRECTORY?.trim() || "reports");
  const timeZone = process.env.REPORT_TIMEZONE?.trim() || "Asia/Tehran";
  const repository = new SqliteApplicationRepository(databasePath);

  try {
    const reports = new ReportService(repository, timeZone);
    let outputPath: string;
    if (scope === "all") {
      outputPath = resolve(reportDirectory, "all-history.xlsx");
      await reports.exportAll(outputPath);
    } else if (scope === "day" && value != null) {
      outputPath = resolve(reportDirectory, `day-${value}.xlsx`);
      await reports.exportDay(value, outputPath);
    } else if (scope === "run" && value != null && /^\d+$/.test(value)) {
      outputPath = resolve(reportDirectory, `run-${value.padStart(6, "0")}.xlsx`);
      await reports.exportRun(Number(value), outputPath);
    } else {
      throw new Error("Usage: npm run report -- all | day YYYY-MM-DD | run RUN_ID");
    }
    console.log(`Excel report: ${outputPath}`);
  } finally {
    repository.close();
  }
}

main().catch((error: unknown) => {
  console.error("Report error:", error);
  process.exitCode = 1;
});
