import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Job } from "../src/domain/job.js";
import { JobMatcherService, type JobMatcherOptions } from "../src/services/job-matcher.service.js";

const options: JobMatcherOptions = {
  technologies: ["react", "next.js", "typescript", "vue"],
  acceptedSeniorities: ["mid", "senior"],
  allowNative: false,
  allowFullStack: true,
  backendTechnologies: ["node.js", "python", "django", ".net", "java"],
  maxFullStackBackendTechnologies: 1,
  onsiteCities: ["tehran", "تهران"],
  allowRemoteEverywhere: true,
};
const matcher = new JobMatcherService(options);

function job(overrides: Partial<Job> = {}): Job {
  return {
    platform: "jobvision",
    externalId: "1",
    title: "Senior Front-End Developer",
    company: "Example",
    city: "Tehran",
    workArrangement: "onsite",
    alreadyApplied: false,
    description: "Build web products with React and Next.js",
    url: null,
    isExpired: false,
    isExternalApplication: false,
    seniority: "Senior Specialist",
    requiredExperienceYears: 3,
    categories: ["IT - Software Development"],
    technologies: ["React", "TypeScript"],
    platformScore: 67,
    raw: null,
    ...overrides,
  };
}

describe("JobMatcherService", () => {
  it("accepts Persian frontend titles and technology aliases", () => {
    const decision = matcher.evaluate(job({
      title: "توسعه‌دهنده ارشد فرانت‌اند",
      description: "توسعه محصول با Vue.js و TS",
      technologies: ["Vue.js", "TypeScript"],
    }));
    assert.equal(decision.shouldApply, true);
    assert.ok(decision.evidence.some((item) => item.includes("matched technologies")));
  });

  it("does not treat junior text in a senior job description as job seniority", () => {
    const decision = matcher.evaluate(job({ description: "Mentor junior backend and database developers. React is required." }));
    assert.equal(decision.shouldApply, true);
  });

  it("rejects native roles when native is disabled", () => {
    const decision = matcher.evaluate(job({ title: "Senior React Native Developer" }));
    assert.equal(decision.shouldApply, false);
    assert.ok(decision.reasons.includes("native/mobile roles are disabled"));
  });

  it("rejects a generic software title even when structured requirements include React", () => {
    const decision = matcher.evaluate(job({ title: "Senior Software Engineer", technologies: ["React"] }));
    assert.equal(decision.shouldApply, false);
    assert.ok(decision.reasons.includes("title is not a frontend or selected-technology role"));
  });

  it("accepts light-backend full-stack roles and rejects backend-heavy ones", () => {
    assert.equal(matcher.evaluate(job({ title: "Senior Full-Stack Developer", technologies: ["React", "Node.js"] })).shouldApply, true);
    const heavy = matcher.evaluate(job({
      title: "Senior Full-Stack Developer",
      technologies: ["React", "Python", "Django", "Node.js"],
      description: "Strong Python, Django and Node.js backend background required; React frontend.",
    }));
    assert.equal(heavy.shouldApply, false);
    assert.ok(heavy.reasons.some((reason) => reason.includes("too much backend")));
  });

  it("keeps our score separate from JobVision score", () => {
    const decision = matcher.evaluate(job({ platformScore: 12 }));
    assert.notEqual(decision.score, 12);
    assert.ok(decision.evidence.includes("JobVision score: 12"));
  });
});
