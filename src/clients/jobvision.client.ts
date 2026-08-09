import axios, { type AxiosInstance } from "axios";

import { config } from "../config/config.js";
import {
    JobVisionDetailResponse,
    JobVisionListResponse,
} from "../types/jobvision.types";

export class JobVisionClient {
    private readonly client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: config.jobvision.baseURL,
            headers: {
                Authorization: `${config.jobvision.accessToken}`,
                "Content-Type": "application/json",
                clientid: config.jobvision.clientId,
            },
        });
    }
    //TODO : Implement the methods for interacting with the JobVision API, such as searching for jobs, retrieving job details, getting resumes, and applying for jobs.
    async searchOffers(
        keyword: string,
        page: number = 1,
        pageSize: number = 30,
        searchId: string | null = null
    ): Promise<JobVisionListResponse> {
        const response = await this.client.post<JobVisionListResponse>(
            "/api/v1/JobPost/List",
            {
                keyword,
                requestedPage: page,
                pageSize,
                sortBy: 0,
                searchId,
            }
        );

        return response.data;
    }

    

    async getJobDetails(
        jobPostId: number
    ): Promise<JobVisionDetailResponse> {
        const response = await this.client.get<JobVisionDetailResponse>(
            "/api/v1/JobPost/Detail",
            {
                params: {
                    jobPostId,
                },
            }
        );

        return response.data;
    }



     async apply(
        jobPostId: number,
        userJobPostMatchScore: number
    ) {
        const response = await this.client.post(
            "/api/v1/Application/Apply",
            {
                jobPostId,
                referHireCode: "",
                userJobPostMatchScore,
                campaignSource: null,
            }
        );

        return response.data;
    }

    // async getResume() {
    //     // ...
    // }

    // async apply() {
    //     // ...
    // }
}