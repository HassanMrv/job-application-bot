import type {
  ApplicationReceipt,
  CandidateProfileStatus,
  Job,
  JobSearchQuery,
  JobSummary,
  PlatformId,
  SearchResult,
} from "./job.js";

export interface JobPlatform {
  readonly id: PlatformId;
  readonly displayName: string;
  search(query: JobSearchQuery): Promise<SearchResult>;
  getJob(summary: JobSummary): Promise<Job>;
  getCandidateProfileStatus(): Promise<CandidateProfileStatus>;
  apply(job: Job): Promise<ApplicationReceipt>;
}
