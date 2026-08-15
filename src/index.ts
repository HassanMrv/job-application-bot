import { config } from "./config/config.js";
import { createPlatform } from "./platforms/platform.factory.js";
import { SqliteApplicationRepository } from "./repositories/sqlite-application.repository.js";
import { BotService } from "./services/bot.service.js";
import { JobMatcherService } from "./services/job-matcher.service.js";

async function main(): Promise<void> {
  const repository = new SqliteApplicationRepository(config.bot.databasePath);
  try {
    const platform = createPlatform();
    const matcher = new JobMatcherService({
      keywords: config.bot.keywords,
      excludedKeywords: config.bot.excludedKeywords,
      onsiteCities: config.bot.onsiteCities,
      allowRemoteEverywhere: config.bot.allowRemoteEverywhere,
      minMatchScore: config.bot.minMatchScore,
    });
    const bot = new BotService(platform, matcher, repository, {
      mode: config.bot.mode,
      keywords: config.bot.keywords,
      pageSize: config.bot.pageSize,
      maxPages: config.bot.maxPages,
      minimumProfileCompletion: config.bot.minimumProfileCompletion,
      requestDelayMs: config.bot.requestDelayMs,
    });
    await bot.run();
  } finally {
    repository.close();
  }
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
