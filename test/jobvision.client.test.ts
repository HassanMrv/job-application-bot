import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AxiosInstance } from "axios";

import { JobVisionClient } from "../src/clients/jobvision.client.js";
import type { JobVisionListResponse } from "../src/types/jobvision.types.js";

describe("JobVisionClient", () => {
  it("adds the configured jobCategoryUrlTitle to search requests", async () => {
    let requestBody: unknown;
    const response = { data: { isSuccess: true, data: { jobPosts: [] } } as JobVisionListResponse };
    const axiosClient = {
      post: async (_url: string, body: unknown) => {
        requestBody = body;
        return response;
      },
    } as unknown as AxiosInstance;
    const client = new JobVisionClient({
      baseURL: "https://example.test",
      accessToken: "token",
      clientId: "client",
      webAppVersion: "1",
      jobCategoryUrlTitle: "web-programming",
      client: axiosClient,
    });

    await client.searchOffers({ keyword: "react" });

    assert.equal(
      (requestBody as { jobCategoryUrlTitle: string }).jobCategoryUrlTitle,
      "web-programming",
    );
  });
});
