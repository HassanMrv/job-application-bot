export interface JobVisionApiResponse<T> {
  traceId?: string | null;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface JobSearchRequest {
  keyword: string;
  requestedPage?: number;
  pageSize?: number;
  sortBy?: number;
  searchId?: string | null;
}

export interface ApplyRequest {
  jobPostId: number;
  userJobPostMatchScore: number;
  referHireCode?: string;
  campaignSource?: string | null;
}

export interface JobVisionApplyData {
  applicationCount: number;
  applicationCountInLastWeek: number;
}

export interface JobVisionCvProgress {
  cvProgressPercentage: number;
  cvEnProgressPercentage: number;
  isBasicInfoComplete: boolean;
  isWorkExperienceComplete: boolean;
  isEducationComplete: boolean;
  isLanguageComplete: boolean;
  isSoftwareComplete: boolean;
}

export type JobVisionApplyResponse = JobVisionApiResponse<JobVisionApplyData>;
export type JobVisionCvProgressResponse = JobVisionApiResponse<JobVisionCvProgress>;
