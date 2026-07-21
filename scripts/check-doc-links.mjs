import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const markdownFiles = ["README.md", ...collectMarkdownFiles("docs")];
const issues = [];
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

for (const markdownFile of markdownFiles) {
  const source = readFileSync(markdownFile, "utf8");

  for (const match of source.matchAll(markdownLinkPattern)) {
    const href = match[1].trim();

    if (shouldSkipHref(href)) {
      continue;
    }

    const targetPath = href.split("#")[0];

    if (!targetPath) {
      continue;
    }

    const resolvedPath = normalize(join(dirname(markdownFile), targetPath));

    if (!existsSync(resolvedPath)) {
      issues.push(`${markdownFile} links to missing file: ${href}`);
    }
  }
}

if (issues.length > 0) {
  console.log("Documentation link check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Documentation link checks passed.");

function collectMarkdownFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (path.endsWith(".md")) {
      files.push(path);
    }
  }

  return files;
}

function shouldSkipHref(href) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("#")
  );
}
