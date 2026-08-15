import type {
  ApplicationLogEntry,
  ApplicationStatus,
  BotRun,
  StartBotRun,
} from "../domain/application.js";
import type { PlatformId } from "../domain/job.js";

export interface ApplicationRepository {
  hasFinalRecord(platform: PlatformId, externalId: string): boolean;
  save(entry: ApplicationLogEntry): void;
  startRun(run: StartBotRun): number;
  finishRun(runId: number, status: "completed" | "failed", fatalError?: string): void;
  setDiscoveredCount(runId: number, count: number): void;
  countByStatus(runId?: number): Partial<Record<ApplicationStatus, number>>;
  getRun(runId: number): BotRun | null;
  listRuns(): BotRun[];
  listEntries(runId?: number): ApplicationLogEntry[];
  close(): void;
}
