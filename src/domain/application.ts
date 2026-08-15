import type { PlatformId } from "./job.js";

export type ExecutionMode = "dry-run" | "review" | "automatic";
export type ApplicationStatus =
  | "discovered"
  | "skipped"
  | "dry-run"
  | "review"
  | "applied"
  | "failed";

export interface ApplicationLogEntry {
  platform: PlatformId;
  externalId: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  reasons: string[];
  matchingScore: number | null;
  occurredAt: string;
}
