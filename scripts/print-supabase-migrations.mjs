import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationDir = "supabase/migrations";
const migrationPaths = readdirSync(migrationDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => join(migrationDir, fileName));

for (const migrationPath of migrationPaths) {
  console.log(`\n-- BEGIN ${migrationPath}`);
  console.log(readFileSync(migrationPath, "utf8").trim());
  console.log(`-- END ${migrationPath}\n`);
}
