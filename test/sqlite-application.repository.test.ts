import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SqliteApplicationRepository } from "../src/repositories/sqlite-application.repository.js";

describe("SqliteApplicationRepository", () => {
  it("only treats successfully applied jobs as final", () => {
    const repository = new SqliteApplicationRepository(":memory:");
    repository.save({
      platform: "jobvision",
      externalId: "42",
      title: "React Developer",
      company: "Example",
      status: "review",
      reasons: [],
      matchingScore: 90,
      occurredAt: new Date().toISOString(),
    });
    assert.equal(repository.hasFinalRecord("jobvision", "42"), false);
    repository.save({
      platform: "jobvision",
      externalId: "42",
      title: "React Developer",
      company: "Example",
      status: "applied",
      reasons: [],
      matchingScore: 90,
      occurredAt: new Date().toISOString(),
    });
    assert.equal(repository.hasFinalRecord("jobvision", "42"), true);
    assert.equal(repository.hasFinalRecord("jobvision", "43"), false);
    assert.equal(repository.countByStatus().review, 1);
    assert.equal(repository.countByStatus().applied, 1);
    repository.close();
  });
});
