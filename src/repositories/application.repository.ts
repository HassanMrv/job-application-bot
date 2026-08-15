import type { ApplicationLogEntry, ApplicationStatus } from "../domain/application.js";
import type { PlatformId } from "../domain/job.js";

export interface ApplicationRepository {
  hasFinalRecord(platform: PlatformId, externalId: string): boolean;
  save(entry: ApplicationLogEntry): void;
  countByStatus(): Partial<Record<ApplicationStatus, number>>;
  close(): void;
}
