import { existsSync, readFileSync } from "node:fs";

const appConfig = JSON.parse(readFileSync("app.json", "utf8")).expo;
const checks = [
  {
    height: 1024,
    label: "Expo app icon",
    path: appConfig.icon,
    width: 1024,
  },
  {
    height: 1024,
    label: "iOS app icon",
    path: appConfig.ios?.icon,
    width: 1024,
  },
  {
    height: 2436,
    label: "Splash image",
    path: appConfig.splash?.image,
    width: 1242,
  },
];
const issues = [];

for (const check of checks) {
  if (!check.path) {
    issues.push(`${check.label} is not configured.`);
    continue;
  }

  if (!existsSync(check.path)) {
    issues.push(`${check.label} file is missing: ${check.path}`);
    continue;
  }

  const dimensions = readPngDimensions(check.path);

  if (!dimensions) {
    issues.push(`${check.label} is not a readable PNG: ${check.path}`);
    continue;
  }

  if (dimensions.width !== check.width || dimensions.height !== check.height) {
    issues.push(
      `${check.label} should be ${check.width}x${check.height}, got ${dimensions.width}x${dimensions.height}.`,
    );
  }
}

if (issues.length > 0) {
  console.log("App asset check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("App asset checks passed.");

function readPngDimensions(path) {
  const bytes = readFileSync(path);
  const pngSignature = "89504e470d0a1a0a";

  if (bytes.subarray(0, 8).toString("hex") !== pngSignature) {
    return undefined;
  }

  return {
    height: bytes.readUInt32BE(20),
    width: bytes.readUInt32BE(16),
  };
}
