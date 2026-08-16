import { join } from "node:path";

import { config } from "./config/config.js";
import { createPlatform } from "./platforms/platform.factory.js";
import { SqliteApplicationRepository } from "./repositories/sqlite-application.repository.js";
import { BotService } from "./services/bot.service.js";
import { JobMatcherService } from "./services/job-matcher.service.js";
import { ReportService } from "./services/report.service.js";

async function main(): Promise<void> {
  const repository = new SqliteApplicationRepository(config.bot.databasePath);
  const runId = repository.startRun({
    platform: config.bot.platform,
    executionMode: config.bot.mode,
    startedAt: new Date().toISOString(),
    configuration: {
      technologies: config.bot.technologies,
      searchKeywords: config.bot.searchKeywords,
      acceptedSeniorities: config.bot.acceptedSeniorities,
      allowNative: config.bot.allowNative,
      allowFullStack: config.bot.allowFullStack,
      backendTechnologies: config.bot.backendTechnologies,
      maxFullStackBackendTechnologies: config.bot.maxFullStackBackendTechnologies,
      onsiteCities: config.bot.onsiteCities,
      allowRemoteEverywhere: config.bot.allowRemoteEverywhere,
      minimumProfileCompletion: config.bot.minimumProfileCompletion,
      pageSize: config.bot.pageSize,
      maxPages: config.bot.maxPages,
      requestDelayMs: config.bot.requestDelayMs,
      jobCategoryUrlTitle: config.jobvision?.jobCategoryUrlTitle ?? null,
    },
  });
  let fatalError: unknown;
  let reportError: unknown;
  try {
    const platform = createPlatform();
    const matcher = new JobMatcherService({
      technologies: config.bot.technologies,
      acceptedSeniorities: config.bot.acceptedSeniorities,
      allowNative: config.bot.allowNative,
      allowFullStack: config.bot.allowFullStack,
      backendTechnologies: config.bot.backendTechnologies,
      maxFullStackBackendTechnologies: config.bot.maxFullStackBackendTechnologies,
      onsiteCities: config.bot.onsiteCities,
      allowRemoteEverywhere: config.bot.allowRemoteEverywhere,
    });
    
    const bot = new BotService(platform, matcher, repository, {
      mode: config.bot.mode,
      keywords: config.bot.searchKeywords,
      pageSize: config.bot.pageSize,
      maxPages: config.bot.maxPages,
      minimumProfileCompletion: config.bot.minimumProfileCompletion,
      requestDelayMs: config.bot.requestDelayMs,
    }, runId);
    await bot.run();
    repository.finishRun(runId, "completed");
  } catch (error) {
    fatalError = error;
    repository.finishRun(runId, "failed", error instanceof Error ? error.message : String(error));
  } finally {
    try {
      const reportPath = join(
        config.bot.reportDirectory,
        `run-${String(runId).padStart(6, "0")}.xlsx`,
      );
      await new ReportService(repository, config.bot.reportTimezone).exportRun(runId, reportPath);
      console.log(`Excel report: ${reportPath}`);
    } catch (error) {
      reportError = error;
    } finally {
      repository.close();
    }
  }
  if (fatalError != null) throw fatalError;
  if (reportError != null) throw reportError;
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
