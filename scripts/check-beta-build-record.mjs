import { readFileSync } from "node:fs";

const recordPath = "docs/BETA_BUILD_RECORD.md";
const record = readFileSync(recordPath, "utf8");
const issues = [];

const requiredBuildFields = [
  "Decision date",
  "Decision owner",
  "Git commit SHA",
  "App version",
  "iOS build number",
  "EAS build profile",
  "EAS build URL",
  "Supabase project",
  "Supabase migration status",
  "Tester names",
  "Physical devices tested",
  "iOS versions tested",
  "Network scenarios tested",
  "Audio routes tested",
  "Beta build status",
  "Remaining blockers",
  "Release notes for testers",
];

for (const field of requiredBuildFields) {
  const value = getListValue(field);

  if (!value) {
    issues.push(`Missing beta build record value: ${field}`);
  }
}

const gateRows = getTableRows("Gate");

if (gateRows.length === 0) {
  issues.push("No verification evidence rows were found.");
}

for (const row of gateRows) {
  if (!row.result) {
    issues.push(`Missing result for verification gate: ${row.label}`);
    continue;
  }

  if (!["Pass", "Fail", "Needs follow-up"].includes(row.result)) {
    issues.push(`Invalid result "${row.result}" for verification gate: ${row.label}`);
    continue;
  }

  if (row.result !== "Pass") {
    issues.push(`Verification gate is not complete for "${row.label}": ${row.result}`);
  }

  if (!row.evidence) {
    issues.push(`Missing evidence for verification gate: ${row.label}`);
  }
}

const finalStatus = getListValue("Beta build status");
const remainingBlockers = getListValue("Remaining blockers");

if (finalStatus && !["Pass", "Ready", "Ready for beta"].includes(finalStatus)) {
  issues.push("Beta build status must be `Pass`, `Ready`, or `Ready for beta`.");
}

if (remainingBlockers && remainingBlockers !== "None") {
  issues.push("Remaining blockers must be `None` before beta build record is complete.");
}

if (issues.length > 0) {
  console.log("Beta build record is not complete yet.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Beta build record is complete.");

function getListValue(label) {
  const prefix = `- ${label}:`;
  const line = record.split("\n").find((currentLine) => currentLine.startsWith(prefix));

  return line?.slice(prefix.length).trim();
}

function getTableRows(firstColumnLabel) {
  const rows = [];
  const lines = record.split("\n");
  const headerIndex = lines.findIndex((line) => {
    const trimmedLine = line.trim();

    return trimmedLine.startsWith("|") && trimmedLine.split("|")[1]?.trim() === firstColumnLabel;
  });

  if (headerIndex === -1) {
    issues.push(`Missing table with first column: ${firstColumnLabel}`);
    return rows;
  }

  for (const line of lines.slice(headerIndex + 1)) {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith("|")) {
      break;
    }

    if (trimmedLine.includes("---")) {
      continue;
    }

    const cells = trimmedLine
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length !== 3 || cells[0] === firstColumnLabel) {
      continue;
    }

    rows.push({
      evidence: cells[2],
      label: cells[0],
      result: cells[1],
    });
  }

  return rows;
}
