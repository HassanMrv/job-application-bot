import { TemplatePlatform } from "../template.platform.js";

export class GlassdoorPlatform extends TemplatePlatform {
  readonly id = "glassdoor" as const;
  readonly displayName = "Glassdoor";
}
