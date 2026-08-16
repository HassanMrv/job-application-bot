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
    private readonly runId: number,
  ) {}

  async apply(job: Job, score: number, evidence: string[]): Promise<ApplicationResult> {
    let status: ApplicationResult["status"];
    if (this.mode === "automatic") {
      await this.platform.apply(job);
      status = "applied";
    } else {
      status = this.mode;
    }
    this.log(job, status, [], score, evidence);
    return { status };
  }

  log(job: Job, status: ApplicationStatus, reasons: string[], ourScore: number, evidence: string[]): void {
    const entry: ApplicationLogEntry = {
      runId: this.runId,
      platform: job.platform,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      status,
      reasons: [...reasons, ...evidence.map((item) => `evidence: ${item}`)],
      ourScore,
      jobVisionScore: job.platform === "jobvision" ? job.platformScore : null,
      occurredAt: new Date().toISOString(),
    };
    this.repository.save(entry);
  }
}
