import { existsSync, readFileSync } from "node:fs";

const appConfig = JSON.parse(readFileSync("app.json", "utf8")).expo;
const issues = [];

for (const path of [
  ".env.production.example",
  "docs/PRIVACY_POLICY.md",
  "docs/ONLINE_ROOM_SETUP.md",
  "docs/IOS_DEVICE_PASS_GUIDE.md",
  "docs/DEVICE_PASS_LOG.md",
]) {
  if (!existsSync(path)) {
    issues.push(`Missing launch-readiness document: ${path}`);
  }
}

if (appConfig.name !== "Song Wars") {
  issues.push("app.json should expose the app name as Song Wars.");
}

if (!appConfig.slug) {
  issues.push("app.json is missing an Expo slug.");
}

if (!appConfig.scheme) {
  issues.push("app.json is missing a deep-link scheme.");
}

if (!appConfig.ios?.bundleIdentifier) {
  issues.push("app.json is missing ios.bundleIdentifier.");
}

if (!appConfig.ios?.buildNumber) {
  issues.push("app.json is missing ios.buildNumber.");
}

if (appConfig.platforms?.includes("ios") !== true) {
  issues.push("app.json should include iOS in platforms.");
}

const privacyPolicy = existsSync("docs/PRIVACY_POLICY.md")
  ? readFileSync("docs/PRIVACY_POLICY.md", "utf8")
  : "";
const gitignore = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";

if (!gitignore.split("\n").includes(".env.production")) {
  issues.push(".gitignore should ignore .env.production.");
}

for (const requiredText of [
  "Anonymous Supabase user IDs",
  "Temporary display names",
  "Song Wars does not currently sell user data",
  "Later versions may add optional accounts",
]) {
  if (!privacyPolicy.includes(requiredText)) {
    issues.push(`Privacy policy is missing required beta disclosure: ${requiredText}`);
  }
}

if (issues.length > 0) {
  console.log("Launch readiness check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Launch readiness checks passed.");
