import type {
  ApplicationReceipt,
  CandidateProfileStatus,
  Job,
  JobSearchQuery,
  JobSummary,
  SearchResult,
  WorkArrangement,
} from "../../domain/job.js";
import type { JobPlatform } from "../../domain/platform.js";
import { JobService } from "../../services/job.service.js";
import type { JobVisionJob, JobVisionJobDetails } from "../../types/jobvision.types.js";
import { JobVisionClient } from "../../clients/jobvision.client.js";

function workArrangement(isRemote: boolean): WorkArrangement {
  return isRemote ? "remote" : "onsite";
}

function normalizeSummary(job: JobVisionJob): JobSummary {
  return {
    platform: "jobvision",
    externalId: String(job.id),
    title: job.title,
    company: job.company.nameFa || job.company.nameEn,
    city: job.location.city.titleEn || job.location.city.titleFa || job.location.city.title,
    workArrangement: workArrangement(job.properties.isRemote),
    alreadyApplied: job.userJobPostInfo.isApplied,
  };
}

function normalizeJob(details: JobVisionJobDetails): Job {
  return {
    platform: "jobvision",
    externalId: String(details.id),
    title: details.title,
    company: details.company.name.titleFa || details.company.name.titleEn,
    city: details.location.city.titleEn || details.location.city.titleFa || details.location.city.title,
    workArrangement: workArrangement(details.isRemote),
    alreadyApplied: details.userJobPostInfo.isApplied,
    description: details.description,
    url: `https://jobvision.ir/jobs/${details.id}`,
    isExpired: details.isExpired,
    isExternalApplication: Boolean(details.linkOutAddress),
    seniority: details.seniorityLevel.titleEn || details.seniorityLevel.titleFa,
    requiredExperienceYears: details.requiredRelatedExperienceYears,
    categories: details.jobCategories.flatMap((category) =>
      [category.title, category.titleFa, category.titleEn].filter((value): value is string => Boolean(value)),
    ),
    technologies: details.softwareRequirements.flatMap((requirement) =>
      [requirement.software.title, requirement.software.titleFa, requirement.software.titleEn]
        .filter((value): value is string => Boolean(value)),
    ),
    platformScore: details.userJobPostInfo.matchingScore,
    raw: details,
  };
}

export class JobVisionPlatform implements JobPlatform {
  readonly id = "jobvision" as const;
  readonly displayName = "JobVision";
  private readonly jobs: JobService;

  constructor(private readonly client: JobVisionClient) {
    this.jobs = new JobService(client);
  }

  async search(query: JobSearchQuery): Promise<SearchResult> {
    const uniqueJobs = new Map<number, JobVisionJob>();
    for (const keyword of query.keywords) {
      const jobs = await this.jobs.findJobs({
        keyword,
        pageSize: query.pageSize,
        maxPages: query.maxPages,
      });
      for (const job of jobs) uniqueJobs.set(job.id, job);
    }
    return { jobs: [...uniqueJobs.values()].map(normalizeSummary) };
  }

  async getJob(summary: JobSummary): Promise<Job> {
    return normalizeJob(await this.jobs.getDetails(Number(summary.externalId)));
  }

  async getCandidateProfileStatus(): Promise<CandidateProfileStatus> {
    const response = await this.client.getCvProgressStage();
    if (!response.isSuccess) {
      throw new Error(`JobVision CV progress failed: ${response.message}`);
    }
    return {
      percentage: response.data.cvProgressPercentage,
      complete: response.data.cvProgressPercentage >= 100,
    };
  }

  async apply(job: Job): Promise<ApplicationReceipt> {
    const response = await this.client.apply({
      jobPostId: Number(job.externalId),
      userJobPostMatchScore: job.platformScore ?? 0,
    });
    return { platform: this.id, externalId: job.externalId, message: response.message };
  }
}
