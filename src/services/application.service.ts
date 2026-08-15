import type { ApplicationLogEntry, ApplicationStatus, ExecutionMode } from "../domain/application.js";
import type { Job } from "../domain/job.js";
import type { JobPlatform } from "../domain/platform.js";
import type { ApplicationRepository } from "../repositories/application.repository.js";

export interface ApplicationResult {
  status: Extract<ApplicationStatus, "applied" | "dry-run" | "review">;
}

export class ApplicationService {
  constructor(
    private readonly platform: JobPlatform,
    private readonly repository: ApplicationRepository,
    private readonly mode: ExecutionMode,
  ) {}

  async apply(job: Job): Promise<ApplicationResult> {
    let status: ApplicationResult["status"];
    if (this.mode === "automatic") {
      await this.platform.apply(job);
      status = "applied";
    } else {
      status = this.mode;
    }
    this.log(job, status, []);
    return { status };
  }

  log(job: Job, status: ApplicationStatus, reasons: string[]): void {
    const entry: ApplicationLogEntry = {
      platform: job.platform,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      status,
      reasons,
      matchingScore: job.matchingScore,
      occurredAt: new Date().toISOString(),
    };
    this.repository.save(entry);
  }
}
