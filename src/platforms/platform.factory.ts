import { JobVisionClient } from "../clients/jobvision.client.js";
import { config } from "../config/config.js";
import type { JobPlatform } from "../domain/platform.js";
import { GlassdoorPlatform } from "./glassdoor/glassdoor.platform.js";
import { IranTalentPlatform } from "./irantalent/irantalent.platform.js";
import { JobinjaPlatform } from "./jobinja/jobinja.platform.js";
import { JobVisionPlatform } from "./jobvision/jobvision.platform.js";

export function createPlatform(): JobPlatform {
  switch (config.bot.platform) {
    case "jobvision": {
      if (config.jobvision == null) throw new Error("JobVision configuration is unavailable");
      return new JobVisionPlatform(new JobVisionClient(config.jobvision));
    }
    case "jobinja":
      return new JobinjaPlatform();
    case "irantalent":
      return new IranTalentPlatform();
    case "glassdoor":
      return new GlassdoorPlatform();
  }
}
