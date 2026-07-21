import { existsSync, readFileSync } from "node:fs";

const workflowPath = ".github/workflows/verify.yml";
const issues = [];

if (!existsSync(workflowPath)) {
  issues.push(`Missing GitHub Actions workflow: ${workflowPath}`);
} else {
  const workflow = readFileSync(workflowPath, "utf8");

  for (const requiredText of [
    "pull_request:",
    "push:",
    "branches:",
    "main",
    "actions/checkout@v6",
    "actions/setup-node@v6",
    "node-version: 24",
    "cache: npm",
    "npm ci",
    "npm run verify",
  ]) {
    if (!workflow.includes(requiredText)) {
      issues.push(`Verify workflow is missing required text: ${requiredText}`);
    }
  }
}

if (issues.length > 0) {
  console.log("CI config check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("CI config checks passed.");
