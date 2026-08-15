import { JobVisionClient } from "../clients/jobvision.client.js";
import type {
  JobVisionJob,
  JobVisionJobDetails,
} from "../types/jobvision.types.js";

export interface FindJobsOptions {
  keyword: string;
  pageSize?: number;
  maxPages?: number;
}

export class JobService {
  constructor(private readonly client: JobVisionClient) {}

  async findJobs(options: FindJobsOptions): Promise<JobVisionJob[]> {
    const pageSize = options.pageSize ?? 30;
    const maxPages = options.maxPages ?? 1;
    const jobs: JobVisionJob[] = [];
    let searchId: string | null = null;

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await this.client.searchOffers({
        keyword: options.keyword,
        requestedPage: page,
        pageSize,
        searchId,
      });
      if (!response.isSuccess) {
        throw new Error(`JobVision search failed: ${response.message}`);
      }

      jobs.push(...response.data.jobPosts);
      searchId = response.data.searchId || searchId;

      if (response.data.jobPosts.length < pageSize) break;
      if (jobs.length >= response.data.jobPostCount) break;
    }

    return jobs;
  }

  async getDetails(jobPostId: number): Promise<JobVisionJobDetails> {
    const response = await this.client.getJobDetails(jobPostId);

    if (!response.isSuccess) {
      throw new Error(`JobVision detail failed for ${jobPostId}: ${response.message}`);
    }

    return response.data;
  }
}
