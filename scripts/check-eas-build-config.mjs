import { existsSync, readFileSync } from "node:fs";

const issues = [];

if (!existsSync("eas.json")) {
  issues.push("Missing eas.json.");
} else {
  const easConfig = JSON.parse(readFileSync("eas.json", "utf8"));

  if (!easConfig.cli?.version) {
    issues.push("eas.json should pin a minimum EAS CLI version.");
  }

  if (easConfig.cli?.appVersionSource !== "local") {
    issues.push("eas.json should use local app version source while app.json owns version/build number.");
  }

  if (easConfig.build?.preview?.distribution !== "internal") {
    issues.push("eas.json build.preview should use internal distribution for beta testers.");
  }

  if (easConfig.build?.["preview-simulator"]?.extends !== "preview") {
    issues.push("eas.json build.preview-simulator should extend preview.");
  }

  if (easConfig.build?.["preview-simulator"]?.ios?.simulator !== true) {
    issues.push("eas.json build.preview-simulator should target the iOS simulator.");
  }

  if (!easConfig.build?.production) {
    issues.push("eas.json should include a production build profile.");
  }

  if (easConfig.build?.production?.autoIncrement !== true) {
    issues.push("eas.json build.production should auto-increment build numbers.");
  }

  if (!easConfig.submit?.production) {
    issues.push("eas.json should include a production submit profile.");
  }
}

if (issues.length > 0) {
  console.log("EAS build config check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("EAS build config checks passed.");
