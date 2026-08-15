import axios from "axios";

import type { ExecutionMode } from "../domain/application.js";
import type { JobPlatform } from "../domain/platform.js";
import type { ApplicationRepository } from "../repositories/application.repository.js";
import { delay } from "../utils/delay.js";
import { ApplicationService } from "./application.service.js";
import { JobMatcherService } from "./job-matcher.service.js";

export interface BotOptions {
  mode: ExecutionMode;
  keywords: string[];
  pageSize: number;
  maxPages: number;
  minimumProfileCompletion: number;
  requestDelayMs: number;
}

export class BotService {
  private readonly applications: ApplicationService;

  constructor(
    private readonly platform: JobPlatform,
    private readonly matcher: JobMatcherService,
    private readonly repository: ApplicationRepository,
    private readonly options: BotOptions,
  ) {
    this.applications = new ApplicationService(platform, repository, options.mode);
  }

  async run(): Promise<void> {
    const profile = await this.platform.getCandidateProfileStatus();
    if (profile.percentage != null && profile.percentage < this.options.minimumProfileCompletion) {
      throw new Error(
        `${this.platform.displayName} profile is ${profile.percentage}% complete; ` +
          `${this.options.minimumProfileCompletion}% is required`,
      );
    }

    console.log(
      `Searching ${this.platform.displayName} for ${this.options.keywords.join(", ")} ` +
        `(mode=${this.options.mode})`,
    );
    const { jobs } = await this.platform.search({
      keywords: this.options.keywords,
      pageSize: this.options.pageSize,
      maxPages: this.options.maxPages,
    });
    console.log(`Discovered ${jobs.length} unique jobs`);

    for (const summary of jobs) {
      if (summary.alreadyApplied || this.repository.hasFinalRecord(summary.platform, summary.externalId)) {
        console.log(`SKIP ${summary.externalId} ${summary.title} — already handled`);
        continue;
      }

      try {
        const job = await this.platform.getJob(summary);
        const decision = this.matcher.evaluate(job);
        if (!decision.shouldApply) {
          this.applications.log(job, "skipped", decision.reasons);
          console.log(`SKIP ${job.externalId} ${job.title} — ${decision.reasons.join(", ")}`);
        } else {
          const result = await this.applications.apply(job);
          console.log(`${result.status.toUpperCase()} ${job.externalId} ${job.title}`);
        }
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? `${error.response?.status ?? "HTTP"}: ${JSON.stringify(error.response?.data ?? error.message)}`
          : error instanceof Error
            ? error.message
            : String(error);
        console.error(`FAILED ${summary.externalId} ${summary.title} — ${message}`);
        this.repository.save({
          platform: summary.platform,
          externalId: summary.externalId,
          title: summary.title,
          company: summary.company,
          status: "failed",
          reasons: [message],
          matchingScore: null,
          occurredAt: new Date().toISOString(),
        });
      }

      if (this.options.requestDelayMs > 0) await delay(this.options.requestDelayMs);
    }

    console.log("Application history totals:", this.repository.countByStatus());
  }
}
