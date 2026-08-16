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
    private readonly runId: number,
  ) {
    this.applications = new ApplicationService(platform, repository, options.mode, runId);
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
    this.repository.setDiscoveredCount(this.runId, jobs.length);
    console.log(`Discovered ${jobs.length} unique jobs`);

    for (const summary of jobs) {
      if (summary.alreadyApplied || this.repository.hasFinalRecord(summary.platform, summary.externalId)) {
        this.repository.save({
          runId: this.runId,
          platform: summary.platform,
          externalId: summary.externalId,
          title: summary.title,
          company: summary.company,
          status: "skipped",
          reasons: [summary.alreadyApplied ? "already applied on platform" : "already applied in local history"],
          ourScore: null,
          jobVisionScore: null,
          occurredAt: new Date().toISOString(),
        });
        console.log(`SKIP ${summary.externalId} ${summary.title} — already handled`);
        continue;
      }

      try {
        const job = await this.platform.getJob(summary);
        const decision = this.matcher.evaluate(job);
        if (!decision.shouldApply) {
          this.applications.log(job, "skipped", decision.reasons, decision.score, decision.evidence);
          console.log(`SKIP ${job.externalId} ${job.title} — ${decision.reasons.join(", ")}`);
        } else {
          const result = await this.applications.apply(job, decision.score, decision.evidence);
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
          runId: this.runId,
          platform: summary.platform,
          externalId: summary.externalId,
          title: summary.title,
          company: summary.company,
          status: "failed",
          reasons: [message],
          ourScore: null,
          jobVisionScore: null,
          occurredAt: new Date().toISOString(),
        });
      }

      if (this.options.requestDelayMs > 0) await delay(this.options.requestDelayMs);
    }

    console.log("Run totals:", this.repository.countByStatus(this.runId));
  }
}
