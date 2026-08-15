import type { Job } from "../domain/job.js";

export interface MatchDecision {
  shouldApply: boolean;
  score: number | null;
  reasons: string[];
}

export interface JobMatcherOptions {
  keywords: string[];
  excludedKeywords: string[];
  onsiteCities: string[];
  allowRemoteEverywhere: boolean;
  minMatchScore: number;
}

function includesAny(value: string, candidates: string[]): boolean {
  const normalized = value.toLocaleLowerCase();
  return candidates.some((candidate) => normalized.includes(candidate.toLocaleLowerCase()));
}

export class JobMatcherService {
  constructor(private readonly options: JobMatcherOptions) {}

  evaluate(job: Job): MatchDecision {
    const reasons: string[] = [];
    const searchableText = `${job.title} ${job.description} ${job.seniority ?? ""}`;

    if (!includesAny(searchableText, this.options.keywords)) {
      reasons.push(`does not contain one of: ${this.options.keywords.join(", ")}`);
    }
    if (includesAny(searchableText, this.options.excludedKeywords)) {
      reasons.push(`contains excluded keyword: ${this.options.excludedKeywords.join(", ")}`);
    }
    if (job.isExpired) reasons.push("job is expired");
    if (job.alreadyApplied) reasons.push("already applied on platform");
    if (job.isExternalApplication) reasons.push("external application flow is unsupported");

    if (job.workArrangement === "remote") {
      if (!this.options.allowRemoteEverywhere) reasons.push("remote jobs are disabled");
    } else if (
      job.workArrangement !== "onsite" ||
      job.city == null ||
      !includesAny(job.city, this.options.onsiteCities)
    ) {
      reasons.push(`onsite job is outside: ${this.options.onsiteCities.join(", ")}`);
    }

    if (job.matchingScore != null && job.matchingScore < this.options.minMatchScore) {
      reasons.push(`match score ${job.matchingScore} is below ${this.options.minMatchScore}`);
    }

    return {
      shouldApply: reasons.length === 0,
      score: job.matchingScore,
      reasons,
    };
  }
}
