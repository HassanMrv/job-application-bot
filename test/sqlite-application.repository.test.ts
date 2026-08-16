import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SqliteApplicationRepository } from "../src/repositories/sqlite-application.repository.js";

describe("SqliteApplicationRepository", () => {
  it("tracks a distinct run and its outcomes", () => {
    const repository = new SqliteApplicationRepository(":memory:");
    const runId = repository.startRun({
      platform: "jobvision",
      executionMode: "dry-run",
      configuration: { keywords: ["react"] },
      startedAt: "2026-08-15T10:00:00.000Z",
    });
    repository.setDiscoveredCount(runId, 1);
    repository.save({
      runId,
      platform: "jobvision",
      externalId: "42",
      title: "React Developer",
      company: "Example",
      status: "dry-run",
      reasons: [],
      ourScore: 90,
      jobVisionScore: 70,
      occurredAt: "2026-08-15T10:00:01.000Z",
    });
    repository.finishRun(runId, "completed");

    const run = repository.getRun(runId);
    assert.equal(run?.status, "completed");
    assert.equal(run?.discoveredCount, 1);
    assert.equal(run?.processedCount, 1);
    assert.equal(run?.dryRunCount, 1);
    assert.equal(repository.listEntries(runId)[0]?.runId, runId);
    assert.equal(repository.listEntries(runId)[0]?.ourScore, 90);
    assert.equal(repository.listEntries(runId)[0]?.jobVisionScore, 70);
    repository.close();
  });

  it("only treats successfully applied jobs as final", () => {
    const repository = new SqliteApplicationRepository(":memory:");
    repository.save({
      runId: null,
      platform: "jobvision",
      externalId: "42",
      title: "React Developer",
      company: "Example",
      status: "review",
      reasons: [],
      ourScore: 90,
      jobVisionScore: 70,
      occurredAt: new Date().toISOString(),
    });
    assert.equal(repository.hasFinalRecord("jobvision", "42"), false);
    repository.save({
      runId: null,
      platform: "jobvision",
      externalId: "42",
      title: "React Developer",
      company: "Example",
      status: "applied",
      reasons: [],
      ourScore: 90,
      jobVisionScore: 70,
      occurredAt: new Date().toISOString(),
    });
    assert.equal(repository.hasFinalRecord("jobvision", "42"), true);
    assert.equal(repository.hasFinalRecord("jobvision", "43"), false);
    assert.equal(repository.countByStatus().review, 1);
    assert.equal(repository.countByStatus().applied, 1);
    repository.close();
  });
});
