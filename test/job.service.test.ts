import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { JobVisionClient } from "../src/clients/jobvision.client.js";
import { JobService } from "../src/services/job.service.js";
import type { JobVisionJob, JobVisionListResponse } from "../src/types/jobvision.types.js";

function response(jobPosts: JobVisionJob[], overrides: Partial<JobVisionListResponse["data"]> = {}): JobVisionListResponse {
  return {
    traceId: null,
    isSuccess: true,
    statusCode: 0,
    message: "success",
    data: {
      currentPage: 1,
      pageSize: 30,
      jobPosts,
      filters: {
        keyword: "React",
        jobCategory: null,
        locationWrapper: null,
        workExperiences: null,
        salaries: null,
        workTypes: null,
        seniorityLevels: null,
        jobPostPublishTime: null,
        industries: null,
        company: null,
        benefits: null,
        remote: false,
      },
      searchId: "search-1",
      jobPostCount: jobPosts.length,
      hasSalaryHistogram: false,
      ...overrides,
    },
  };
}

describe("JobService", () => {
  it("reads jobs from JobVision's data.jobPosts field", async () => {
    const expected = { id: 1450154, title: "Front-End Developer (React.js)" } as JobVisionJob;
    const client = {
      searchOffers: async () => response([expected]),
    } as unknown as JobVisionClient;

    const jobs = await new JobService(client).findJobs({ keyword: "React" });

    assert.deepEqual(jobs, [expected]);
  });

  it("reuses searchId when requesting the next page", async () => {
    const requests: Array<{ searchId?: string | null }> = [];
    const firstPage = Array.from({ length: 2 }, (_, index) => ({ id: index + 1 } as JobVisionJob));
    const client = {
      searchOffers: async (request: { searchId?: string | null }) => {
        requests.push(request);
        return requests.length === 1
          ? response(firstPage, { pageSize: 2, jobPostCount: 3, searchId: "continued-search" })
          : response([{ id: 3 } as JobVisionJob], {
              currentPage: 2,
              pageSize: 2,
              jobPostCount: 3,
              searchId: "continued-search",
            });
      },
    } as unknown as JobVisionClient;

    const jobs = await new JobService(client).findJobs({ keyword: "React", pageSize: 2, maxPages: 2 });

    assert.equal(jobs.length, 3);
    assert.equal(requests[0]?.searchId, null);
    assert.equal(requests[1]?.searchId, "continued-search");
  });
});
