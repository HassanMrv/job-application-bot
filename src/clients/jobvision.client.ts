import axios, { type AxiosInstance } from "axios";

import type {
  ApplyRequest,
  JobSearchRequest,
  JobVisionApplyResponse,
  JobVisionCvProgressResponse,
} from "../types/jobvision.api.types.js";
import type {
  JobVisionDetailResponse,
  JobVisionListResponse, 
} from "../types/jobvision.types.js";

export class JobVisionClient {
  private readonly client: AxiosInstance;

  constructor(options: {
    baseURL: string;
    accessToken: string;
    clientId: string;
    webAppVersion: string;
    client?: AxiosInstance;
  }) {
    this.client =
      options.client ??
      axios.create({
        baseURL: options.baseURL,
        timeout: 20_000,
        headers: {
          Accept: "application/json, text/plain, */*",
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
          clientid: options.clientId,
          "ngsw-bypass": "true",
          "web-app-version": options.webAppVersion,
        },
      });
  }

  async searchOffers(request: JobSearchRequest): Promise<JobVisionListResponse> {
    const response = await this.client.post<JobVisionListResponse>(
      "/api/v1/JobPost/List",
      {
        keyword: request.keyword,
        requestedPage: request.requestedPage ?? 1,
        pageSize: request.pageSize ?? 30,
        sortBy: request.sortBy ?? 0,
        searchId: request.searchId ?? null,
      },
    );

    return response.data;
  }

  async getJobDetails(jobPostId: number): Promise<JobVisionDetailResponse> {
    const response = await this.client.get<JobVisionDetailResponse>(
      "/api/v1/JobPost/Detail",
      { params: { jobPostId } },
    );

    return response.data;
  }

  async getCvProgressStage(): Promise<JobVisionCvProgressResponse> {
    const response = await this.client.get<JobVisionCvProgressResponse>(
      "/api/v1/Cv/GetCvProgressStage",
    );

    return response.data;
  }

  async apply(request: ApplyRequest): Promise<JobVisionApplyResponse> {
    const response = await this.client.post<JobVisionApplyResponse>(
      "/api/v1/Application/Apply",
      {
        jobPostId: request.jobPostId,
        referHireCode: request.referHireCode ?? "",
        userJobPostMatchScore: request.userJobPostMatchScore,
        campaignSource: request.campaignSource ?? null,
      },
    );

    if (!response.data.isSuccess) {
      throw new Error(`JobVision apply failed: ${response.data.message}`);
    }
    return response.data;
  }
}
