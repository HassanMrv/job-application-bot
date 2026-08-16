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
  runId: number | null;
  platform: PlatformId;
  externalId: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  reasons: string[];
  ourScore: number | null;
  jobVisionScore: number | null;
  occurredAt: string;
}

export type BotRunStatus = "running" | "completed" | "failed";

export interface BotRun {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: BotRunStatus;
  platform: PlatformId;
  executionMode: ExecutionMode;
  configuration: Record<string, unknown>;
  discoveredCount: number;
  processedCount: number;
  appliedCount: number;
  skippedCount: number;
  dryRunCount: number;
  reviewCount: number;
  failedCount: number;
  fatalError: string | null;
}

export interface StartBotRun {
  platform: PlatformId;
  executionMode: ExecutionMode;
  configuration: Record<string, unknown>;
  startedAt: string;
}
