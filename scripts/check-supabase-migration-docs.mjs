import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationDir = "supabase/migrations";
const setupGuidePath = "docs/ONLINE_ROOM_SETUP.md";
const setupGuide = readFileSync(setupGuidePath, "utf8");
const migrationPaths = readdirSync(migrationDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => join(migrationDir, fileName));
const issues = [];

if (migrationPaths.length === 0) {
  issues.push("No Supabase migration files found.");
}

for (const migrationPath of migrationPaths) {
  if (!setupGuide.includes(migrationPath)) {
    issues.push(`${setupGuidePath} is missing migration: ${migrationPath}`);
  }
}

const documentedMigrationPaths = Array.from(
  setupGuide.matchAll(/supabase\/migrations\/[0-9A-Za-z_-]+\.sql/g),
  (match) => match[0],
);

for (const documentedPath of documentedMigrationPaths) {
  if (!migrationPaths.includes(documentedPath)) {
    issues.push(`${setupGuidePath} references missing migration: ${documentedPath}`);
  }
}

const documentedUniquePaths = Array.from(new Set(documentedMigrationPaths));

if (documentedMigrationPaths.length !== documentedUniquePaths.length) {
  issues.push(`${setupGuidePath} should not list the same migration more than once.`);
}

const sortedDocumentedPaths = [...documentedUniquePaths].sort();

if (documentedUniquePaths.join("\n") !== sortedDocumentedPaths.join("\n")) {
  issues.push(`${setupGuidePath} should list migrations in filename order.`);
}

if (!setupGuide.includes("npm run print:supabase-migrations")) {
  issues.push(`${setupGuidePath} should mention npm run print:supabase-migrations.`);
}

if (issues.length > 0) {
  console.log("Supabase migration docs check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Supabase migration docs checks passed.");
