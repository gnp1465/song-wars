import { spawnSync } from "node:child_process";

const checks = [
  {
    command: "xcode-select",
    args: ["-p"],
    failMessage: "Xcode command line tools are not selected.",
    fix: "Install/open Xcode, then run `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer` if needed.",
  },
  {
    command: "xcrun",
    args: ["simctl", "list", "devices"],
    failMessage: "iOS simulator tooling is not available.",
    fix: "Open Xcode once so it can finish installing simulator components. If it still fails, run `sudo xcodebuild -runFirstLaunch`, then retry this command.",
  },
];

let hasFailure = false;

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    encoding: "utf8",
  });

  if (result.status === 0) {
    console.log(`PASS ${check.command} ${check.args.join(" ")}`);
    continue;
  }

  hasFailure = true;
  console.log(`FAIL ${check.command} ${check.args.join(" ")}`);
  console.log(check.failMessage);

  const output = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();

  if (output) {
    console.log(output);
  }

  console.log(`Fix: ${check.fix}`);
}

if (hasFailure) {
  console.log("\nDevice pass is not ready on this Mac yet.");
  process.exit(1);
}

console.log("\nDevice pass tooling is ready. Next run `npm run ios`.");
