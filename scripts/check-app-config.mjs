import { readFileSync } from "node:fs";

const appConfig = JSON.parse(readFileSync("app.json", "utf8")).expo;
const issues = [];

if (appConfig.name !== "Song Wars") {
  issues.push('app.json expo.name should be "Song Wars".');
}

if (appConfig.slug !== "song-wars") {
  issues.push('app.json expo.slug should be "song-wars".');
}

if (appConfig.scheme !== "songwars") {
  issues.push('app.json expo.scheme should be "songwars".');
}

if (!/^\d+\.\d+\.\d+$/.test(appConfig.version ?? "")) {
  issues.push("app.json expo.version should use x.y.z version format.");
}

if (appConfig.orientation !== "portrait") {
  issues.push('app.json expo.orientation should stay "portrait" for the iOS beta.');
}

if (appConfig.userInterfaceStyle !== "dark") {
  issues.push('app.json expo.userInterfaceStyle should stay "dark".');
}

if (JSON.stringify(appConfig.platforms) !== JSON.stringify(["ios"])) {
  issues.push("app.json expo.platforms should stay iOS-only for the first beta.");
}

if (appConfig.ios?.bundleIdentifier !== "com.gnp1465.songwars") {
  issues.push('app.json ios.bundleIdentifier should be "com.gnp1465.songwars".');
}

if (!/^\d+$/.test(appConfig.ios?.buildNumber ?? "")) {
  issues.push("app.json ios.buildNumber should be a numeric string.");
}

if (appConfig.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== false) {
  issues.push(
    "app.json ios.infoPlist.ITSAppUsesNonExemptEncryption should be false for the HTTPS-only beta.",
  );
}

if (appConfig.ios?.supportsTablet !== false) {
  issues.push("app.json ios.supportsTablet should stay false until tablet layouts are tested.");
}

if (!appConfig.plugins?.includes("expo-router")) {
  issues.push("app.json should include the expo-router plugin.");
}

if (issues.length > 0) {
  console.log("App config check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("App config checks passed.");
