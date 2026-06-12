import { readFileSync } from "node:fs";

const logPath = "docs/DEVICE_PASS_LOG.md";
const log = readFileSync(logPath, "utf8");
const issues = [];

const requiredSetupFields = [
  "Date",
  "Tester",
  "Device or simulator",
  "iOS version",
  "Expo command used",
  "App build",
];

for (const field of requiredSetupFields) {
  const value = getListValue(field);

  if (!value) {
    issues.push(`Missing test setup value: ${field}`);
  }
}

const criteriaRows = getCriteriaRows();

if (criteriaRows.length === 0) {
  issues.push("No required pass criteria rows were found.");
}

for (const row of criteriaRows) {
  if (!row.result) {
    issues.push(`Missing result for: ${row.area}`);
    continue;
  }

  if (!["Pass", "Fail", "Needs follow-up"].includes(row.result)) {
    issues.push(`Invalid result "${row.result}" for: ${row.area}`);
    continue;
  }

  if (row.result !== "Pass") {
    issues.push(`Device pass is not complete for "${row.area}": ${row.result}`);
  }
}

const finalStatus = getListValue("Prototype device pass status");
const remainingFixes = getListValue("Remaining fixes before frontend prototype complete");

if (!finalStatus) {
  issues.push("Missing final device pass status.");
} else if (!["Pass", "Complete"].includes(finalStatus)) {
  issues.push("Final device pass status must be `Pass` or `Complete`.");
}

if (!remainingFixes) {
  issues.push("Missing remaining fixes decision.");
} else if (remainingFixes !== "None") {
  issues.push("Remaining fixes must be `None` before the prototype is complete.");
}

if (issues.length > 0) {
  console.log("Device pass log is not complete yet.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Device pass log is complete.");

function getListValue(label) {
  const prefix = `- ${label}:`;
  const line = log.split("\n").find((currentLine) => currentLine.startsWith(prefix));

  return line?.slice(prefix.length).trim();
}

function getCriteriaRows() {
  const rows = [];

  for (const line of log.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith("|") || trimmedLine.includes("---")) {
      continue;
    }

    const cells = trimmedLine
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length !== 3 || cells[0] === "Area") {
      continue;
    }

    rows.push({
      area: cells[0],
      result: cells[1],
      notes: cells[2],
    });
  }

  return rows;
}
