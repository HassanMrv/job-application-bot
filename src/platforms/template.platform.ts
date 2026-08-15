import type { Job, JobSearchQuery, JobSummary, PlatformId } from "../domain/job.js";
import type { JobPlatform } from "../domain/platform.js";

export abstract class TemplatePlatform implements JobPlatform {
  abstract readonly id: PlatformId;
  abstract readonly displayName: string;

  protected unavailable(): never {
    throw new Error(`${this.displayName} adapter is not implemented yet`);
  }

  async search(_query: JobSearchQuery): Promise<{ jobs: JobSummary[] }> {
    return this.unavailable();
  }

  async getJob(_summary: JobSummary): Promise<Job> {
    return this.unavailable();
  }

  async getCandidateProfileStatus(): Promise<{ percentage: null; complete: null }> {
    return { percentage: null, complete: null };
  }

  async apply(_job: Job): Promise<never> {
    return this.unavailable();
  }
}
