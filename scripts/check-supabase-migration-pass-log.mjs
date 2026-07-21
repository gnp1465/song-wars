import { readFileSync } from "node:fs";

const logPath = "docs/SUPABASE_MIGRATION_PASS_LOG.md";
const log = readFileSync(logPath, "utf8");
const issues = [];

const requiredSetupFields = [
  "Date",
  "Applied by",
  "Supabase project URL",
  "Supabase project ref",
  "Environment",
  "SQL source command",
  "Schema cache wait time",
];

for (const field of requiredSetupFields) {
  const value = getListValue(field);

  if (!value) {
    issues.push(`Missing Supabase migration setup value: ${field}`);
  }
}

for (const row of getTableRows("Migration")) {
  validatePassRow(row, "migration");
}

for (const row of getTableRows("Check")) {
  validatePassRow(row, "hosted verification check");
}

const finalStatus = getListValue("Supabase migration pass status");
const remainingBlockers = getListValue("Remaining backend blockers");

if (!finalStatus) {
  issues.push("Missing Supabase migration pass status.");
} else if (!["Pass", "Complete"].includes(finalStatus)) {
  issues.push("Supabase migration pass status must be `Pass` or `Complete`.");
}

if (!remainingBlockers) {
  issues.push("Missing remaining backend blockers decision.");
} else if (remainingBlockers !== "None") {
  issues.push("Remaining backend blockers must be `None` before Supabase migration pass is complete.");
}

if (issues.length > 0) {
  console.log("Supabase migration pass log is not complete yet.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Supabase migration pass log is complete.");

function validatePassRow(row, label) {
  if (!row.result) {
    issues.push(`Missing result for ${label}: ${row.label}`);
    return;
  }

  if (!["Pass", "Fail", "Needs follow-up"].includes(row.result)) {
    issues.push(`Invalid result "${row.result}" for ${label}: ${row.label}`);
    return;
  }

  if (row.result !== "Pass") {
    issues.push(`${capitalize(label)} is not complete for "${row.label}": ${row.result}`);
  }

  if (!row.evidence) {
    issues.push(`Missing evidence for ${label}: ${row.label}`);
  }
}

function getListValue(label) {
  const prefix = `- ${label}:`;
  const line = log.split("\n").find((currentLine) => currentLine.startsWith(prefix));

  return line?.slice(prefix.length).trim();
}

function getTableRows(firstColumnLabel) {
  const rows = [];
  const lines = log.split("\n");
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

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
