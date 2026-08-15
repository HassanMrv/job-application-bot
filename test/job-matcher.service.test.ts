import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Job } from "../src/domain/job.js";
import { JobMatcherService } from "../src/services/job-matcher.service.js";

const matcher = new JobMatcherService({
  keywords: ["front", "react", "next"],
  excludedKeywords: ["junior"],
  onsiteCities: ["tehran"],
  allowRemoteEverywhere: true,
  minMatchScore: 0,
});

function job(overrides: Partial<Job> = {}): Job {
  return {
    platform: "jobvision",
    externalId: "1",
    title: "Senior React Developer",
    company: "Example",
    city: "Tehran",
    workArrangement: "onsite",
    alreadyApplied: false,
    description: "Build a frontend with Next.js",
    url: null,
    isExpired: false,
    isExternalApplication: false,
    seniority: "Senior",
    matchingScore: 90,
    raw: null,
    ...overrides,
  };
}

describe("JobMatcherService", () => {
  it("accepts matching onsite jobs in Tehran", () => {
    assert.equal(matcher.evaluate(job()).shouldApply, true);
  });

  it("accepts remote jobs regardless of city", () => {
    assert.equal(
      matcher.evaluate(job({ workArrangement: "remote", city: "Berlin" })).shouldApply,
      true,
    );
  });

  it("rejects junior and non-Tehran onsite jobs", () => {
    const decision = matcher.evaluate(job({ title: "Junior React Developer", city: "Shiraz" }));
    assert.equal(decision.shouldApply, false);
    assert.equal(decision.reasons.length, 2);
  });
});
