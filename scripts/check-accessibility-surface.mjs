import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const filesToCheck = [
  ...collectTsxFiles("app"),
  ...collectTsxFiles("src/components"),
  "src/screens/LocalBattleDemoScreen.tsx",
  "src/screens/RoomFlowDemoScreen.tsx",
];
const issues = [];

for (const file of filesToCheck) {
  const source = readFileSync(file, "utf8");

  checkJsxTag(file, source, "Pressable", (attributes, lineNumber) => {
    if (!attributes.includes("accessibilityLabel=")) {
      issues.push(`${file}:${lineNumber} Pressable is missing accessibilityLabel.`);
    }

    if (!attributes.includes('accessibilityRole="button"')) {
      issues.push(`${file}:${lineNumber} Pressable is missing accessibilityRole="button".`);
    }
  });

  checkJsxTag(file, source, "TextInput", (attributes, lineNumber) => {
    if (!attributes.includes("accessibilityLabel=")) {
      issues.push(`${file}:${lineNumber} TextInput is missing accessibilityLabel.`);
    }
  });
}

if (issues.length > 0) {
  console.log("Accessibility surface check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Accessibility surface checks passed.");

function collectTsxFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectTsxFiles(path));
    } else if (path.endsWith(".tsx")) {
      files.push(path);
    }
  }

  return files;
}

function checkJsxTag(file, source, tagName, checkAttributes) {
  const lines = source.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.includes(`<${tagName}`)) {
      continue;
    }

    const startLineNumber = index + 1;
    const tagLines = [line];

    while (
      index + 1 < lines.length &&
      !lines[index].trim().endsWith(">") &&
      !lines[index].trim().endsWith("/>")
    ) {
      index += 1;
      tagLines.push(lines[index]);
    }

    checkAttributes(tagLines.join("\n"), startLineNumber);
  }
}
