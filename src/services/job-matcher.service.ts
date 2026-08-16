import type { Job } from "../domain/job.js";

export type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "lead" | "unknown";
export interface MatchDecision { shouldApply: boolean; score: number; reasons: string[]; evidence: string[]; }
export interface JobMatcherOptions {
  technologies: string[];
  acceptedSeniorities: SeniorityLevel[];
  allowNative: boolean;
  allowFullStack: boolean;
  backendTechnologies: string[];
  maxFullStackBackendTechnologies: number;
  onsiteCities: string[];
  allowRemoteEverywhere: boolean;
}

const technologyAliases: Record<string, string[]> = {
  react: ["react", "reactjs", "react.js"],
  next: ["next.js", "nextjs"],
  "next.js": ["next.js", "nextjs"],
  nextjs: ["next.js", "nextjs"],
  javascript: ["javascript", "java script", "js", "ecmascript"],
  js: ["javascript", "java script", "js", "ecmascript"],
  typescript: ["typescript", "type script", "ts"],
  ts: ["typescript", "type script", "ts"],
  vue: ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs", "angular.js"],
};
const frontendRoleTerms = [
  "frontend", "front end", "front-end", "ui developer", "web ui",
  "فرانت اند", "فرانت‌اند", "رابط کاربری", "توسعه دهنده وب", "توسعه‌دهنده وب",
];
const fullStackTerms = ["fullstack", "full stack", "full-stack", "فول استک", "فول‌استک"];
const nativeTerms = ["react native", "mobile developer", "flutter", "android", "ios developer", "موبایل", "اندروید"];
const developerTerms = [
  "developer", "engineer", "programmer", "توسعه دهنده", "توسعه‌دهنده", "برنامه نویس", "برنامه‌نویس",
];
const strongBackendTerms = [
  "strong backend", "strong back end", "backend expert", "back end expert",
  "advanced backend", "advanced back end", "تسلط به بک اند", "مسلط به بک اند",
  "تسلط به بک‌اند", "مسلط به بک‌اند",
];

function normalize(value: string): string {
  return value.toLocaleLowerCase("en").replace(/<[^>]*>/g, " ").replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک").replace(/[\u200c\u200d]/g, " ")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ").replace(/\s+/g, " ").trim();
}
function containsTerm(value: string, term: string): boolean {
  const haystack = ` ${normalize(value).replaceAll(".", " ")} `;
  const needle = ` ${normalize(term).replaceAll(".", " ")} `;
  return haystack.includes(needle);
}
function findTerms(value: string, terms: string[]): string[] {
  return terms.filter((term) => containsTerm(value, term));
}
function aliasesFor(technology: string): string[] {
  return technologyAliases[normalize(technology)] ?? [technology];
}
function findTechnologies(value: string, requested: string[]): string[] {
  return requested.filter((technology) => aliasesFor(technology).some((alias) => containsTerm(value, alias)));
}
function classifySeniority(job: Job): SeniorityLevel {
  const value = `${job.title} ${job.seniority ?? ""}`;
  if (findTerms(value, ["intern", "internship", "trainee", "کارآموز"]).length > 0) return "intern";
  if (findTerms(value, ["junior", "entry level", "تازه کار", "تازه‌کار"]).length > 0) return "junior";
  if (findTerms(value, ["lead", "principal", "staff", "manager", "سرپرست", "مدیر"]).length > 0) return "lead";
  if (findTerms(value, ["senior", "senior specialist", "ارشد", "کارشناس ارشد"]).length > 0) return "senior";
  if (findTerms(value, ["mid", "middle", "mid level", "specialist", "employee", "کارشناس", "کارمند"]).length > 0) return "mid";
  return "unknown";
}

export class JobMatcherService {
  constructor(private readonly options: JobMatcherOptions) {}

  evaluate(job: Job): MatchDecision {
    const reasons: string[] = [];
    const evidence: string[] = [];
    let score = 0;
    const details = `${job.description} ${job.technologies.join(" ")} ${job.categories.join(" ")}`;
    const titleTechnologies = findTechnologies(job.title, this.options.technologies);
    const matchedTechnologies = [...new Set([...titleTechnologies, ...findTechnologies(details, this.options.technologies)])];
    const isNative = findTerms(job.title, nativeTerms).length > 0;
    const isFullStack = findTerms(job.title, fullStackTerms).length > 0;
    const isFrontend = findTerms(job.title, frontendRoleTerms).length > 0;
    const isTechnologyRole = titleTechnologies.length > 0 && findTerms(job.title, developerTerms).length > 0;

    if (isNative) {
      evidence.push("role detected as native/mobile from title");
      if (!this.options.allowNative) reasons.push("native/mobile roles are disabled"); else score += 25;
    } else if (isFullStack) {
      evidence.push("role detected as full-stack from title");
      if (!this.options.allowFullStack) reasons.push("full-stack roles are disabled");
      else {
        const structuredBackend = findTechnologies(job.technologies.join(" "), this.options.backendTechnologies);
        const unambiguousBackend = this.options.backendTechnologies.filter((technology) => normalize(technology) !== "go");
        const textualBackend = findTechnologies(`${job.title} ${job.description}`, unambiguousBackend);
        const backendMatches = [...new Set([...structuredBackend, ...textualBackend])];
        const explicitlyStrongBackend = findTerms(job.description, strongBackendTerms).length > 0;
        evidence.push(`backend technologies found: ${backendMatches.join(", ") || "none"}`);
        if (explicitlyStrongBackend) {
          reasons.push("full-stack role explicitly requires a strong backend background");
        } else if (backendMatches.length > this.options.maxFullStackBackendTechnologies) {
          reasons.push(`full-stack role requires too much backend (${backendMatches.length} backend technologies; maximum ${this.options.maxFullStackBackendTechnologies})`);
        } else score += 20;
      }
    } else if (isFrontend || isTechnologyRole) {
      evidence.push(isFrontend ? "frontend role detected from title" : "technology developer role detected from title");
      score += 30;
    } else reasons.push("title is not a frontend or selected-technology role");

    if (matchedTechnologies.length === 0) reasons.push(`none of the selected technologies were found: ${this.options.technologies.join(", ")}`);
    else {
      evidence.push(`matched technologies: ${matchedTechnologies.join(", ")}`);
      score += Math.min(30, 15 + matchedTechnologies.length * 5);
    }

    const seniority = classifySeniority(job);
    evidence.push(`seniority classified as ${seniority} from title/platform seniority`);
    if (!this.options.acceptedSeniorities.includes(seniority)) reasons.push(`seniority ${seniority} is not accepted`);
    else score += 20;

    if (job.isExpired) reasons.push("job is expired");
    if (job.alreadyApplied) reasons.push("already applied on platform");
    if (job.isExternalApplication) reasons.push("external application flow is unsupported");
    if (job.workArrangement === "remote") {
      if (!this.options.allowRemoteEverywhere) reasons.push("remote jobs are disabled");
      else { evidence.push("remote job accepted regardless of city"); score += 20; }
    } else if (job.city != null && this.options.onsiteCities.some((city) => containsTerm(job.city ?? "", city))) {
      evidence.push(`${job.workArrangement} job accepted in ${job.city}`);
      score += 20;
    } else reasons.push(`${job.workArrangement} job is outside: ${this.options.onsiteCities.join(", ")}`);

    if (job.requiredExperienceYears != null) evidence.push(`platform requires ${job.requiredExperienceYears} years of related experience`);
    if (job.platformScore != null) evidence.push(`JobVision score: ${job.platformScore}`);
    return { shouldApply: reasons.length === 0, score: Math.min(score, 100), reasons, evidence };
  }
}
