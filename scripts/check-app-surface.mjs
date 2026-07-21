import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const expectedAppRoutes = new Set([
  "app/_layout.tsx",
  "app/index.tsx",
  "app/local.tsx",
  "app/online/create.tsx",
  "app/online/join.tsx",
  "app/online/room/[roomId].tsx",
  "app/online/round/[roomId].tsx",
]);
const appFiles = collectFiles("app").filter((path) => path.endsWith(".tsx"));
const issues = [];

for (const route of expectedAppRoutes) {
  if (!appFiles.includes(route)) {
    issues.push(`Missing expected app route: ${route}`);
  }
}

for (const appFile of appFiles) {
  if (!expectedAppRoutes.has(appFile)) {
    issues.push(`Unexpected routed app surface file: ${appFile}`);
  }
}

for (const appFile of appFiles) {
  const source = readFileSync(appFile, "utf8");

  if (source.includes("PreviewPlaybackScreen") || source.includes("Audio Lab")) {
    issues.push(`Dev-only audio lab is exposed through routed app file: ${appFile}`);
  }
}

const homeSource = readFileSync("app/index.tsx", "utf8");

for (const requiredHomeAction of ["Create Online Room", "Join Online Room", "Local Game"]) {
  if (!homeSource.includes(requiredHomeAction)) {
    issues.push(`Home screen is missing required action: ${requiredHomeAction}`);
  }
}

if (homeSource.includes("Audio Lab")) {
  issues.push("Home screen should not expose the dev-only Audio Lab.");
}

if (issues.length > 0) {
  console.log("App surface check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("App surface checks passed.");

function collectFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }

  return files;
}
