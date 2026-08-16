export type PlatformId = "jobvision" | "jobinja" | "irantalent" | "glassdoor";

export type WorkArrangement = "remote" | "onsite" | "hybrid" | "unknown";

export interface JobSummary {
  platform: PlatformId;
  externalId: string;
  title: string;
  company: string;
  city: string | null;
  workArrangement: WorkArrangement;
  alreadyApplied: boolean;
}

export interface Job extends JobSummary {
  description: string;
  url: string | null;
  isExpired: boolean;
  isExternalApplication: boolean;
  seniority: string | null;
  matchingScore: number | null;
  raw: unknown;
}

export interface jobCategoryUrlTitleJobSearchQuery {
  keywords: string[];
  pageSize: number;
  maxPages: number;
}

export interface SearchResult {
  jobs: JobSummary[];
}

export interface ApplicationReceipt {
  externalId: string;
  platform: PlatformId;
  message: string;
}

export interface CandidateProfileStatus {
  percentage: number | null;
  complete: boolean | null;
}
