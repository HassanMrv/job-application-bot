import { resolve } from "node:path";

import dotenv from "dotenv";

import type { ExecutionMode } from "../domain/application.js";
import type { PlatformId } from "../domain/job.js";

dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not defined in .env`);
  return value;
}

function stringEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function listEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name]?.trim();
  return raw ? raw.split(",").map((value) => value.trim()).filter(Boolean) : fallback;
}

function enumEnv<T extends string>(name: string, values: readonly T[], fallback: T): T {
  const value = stringEnv(name, fallback);
  if (!values.includes(value as T)) {
    throw new Error(`${name} must be one of: ${values.join(", ")}`);
  }
  return value as T;
}

const platform = enumEnv<PlatformId>(
  "JOB_PLATFORM",
  ["jobvision", "jobinja", "irantalent", "glassdoor"],
  "jobvision",
);

export const config = {
  bot: {
    platform,
    mode: enumEnv<ExecutionMode>(
      "APPLICATION_MODE",
      ["dry-run", "review", "automatic"],
      "dry-run",
    ),
    keywords: listEnv("JOB_KEYWORDS", ["front", "react", "next"]),
    excludedKeywords: listEnv("JOB_EXCLUDED_KEYWORDS", ["junior"]),
    onsiteCities: listEnv("JOB_ONSITE_CITIES", ["tehran"]),
    allowRemoteEverywhere: stringEnv("JOB_ALLOW_REMOTE_EVERYWHERE", "true") === "true",
    pageSize: numberEnv("JOB_PAGE_SIZE", 30),
    maxPages: numberEnv("JOB_MAX_PAGES", 1),
    minMatchScore: numberEnv("JOB_MIN_MATCH_SCORE", 0),
    minimumProfileCompletion: numberEnv("MINIMUM_PROFILE_COMPLETION", 80),
    requestDelayMs: numberEnv("REQUEST_DELAY_MS", 500),
    databasePath: resolve(stringEnv("DATABASE_PATH", "data/applications.sqlite")),
    reportDirectory: resolve(stringEnv("REPORT_DIRECTORY", "reports")),
    reportTimezone: stringEnv("REPORT_TIMEZONE", "Asia/Tehran"),
  },
  jobvision:
    platform === "jobvision"
      ? {
          baseURL: stringEnv("JOBVISION_BASE_URL", "https://candidateapi.jobvision.ir"),
          accessToken: requiredEnv("JOBVISION_ACCESS_TOKEN").replace(/^Bearer\s+/i, ""),
          clientId: requiredEnv("JOBVISION_CLIENT_ID"),
          webAppVersion: stringEnv("JOBVISION_WEB_APP_VERSION", "19.0.153"),
          jobCategoryUrlTitle: stringEnv("jobCategoryUrlTitle", ""),
        }
      : null,
} as const;
