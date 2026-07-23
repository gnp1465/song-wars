import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const migrationDir = "supabase/migrations";
const selectedMigrationFileName = getSelectedMigrationFileName();
const migrationPaths = readdirSync(migrationDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .filter((fileName) => !selectedMigrationFileName || fileName === selectedMigrationFileName)
  .sort()
  .map((fileName) => join(migrationDir, fileName));
const skipRealtimePresencePolicies = process.env.SUPABASE_SKIP_REALTIME_PRESENCE_POLICIES === "1";

if (migrationPaths.length === 0) {
  throw new Error(
    selectedMigrationFileName
      ? `Could not find migration file: ${selectedMigrationFileName}`
      : "No Supabase migration files found.",
  );
}

for (const migrationPath of migrationPaths) {
  console.log(`\n-- BEGIN ${migrationPath}`);
  console.log(prepareMigrationSql(readFileSync(migrationPath, "utf8"), migrationPath).trim());
  console.log(`-- END ${migrationPath}\n`);
}

function getSelectedMigrationFileName() {
  const fileFlagIndex = process.argv.indexOf("--file");

  if (fileFlagIndex === -1) {
    return undefined;
  }

  const selectedPath = process.argv[fileFlagIndex + 1];

  if (!selectedPath) {
    throw new Error("Expected a migration filename after --file.");
  }

  return basename(selectedPath);
}

function prepareMigrationSql(sql, migrationPath) {
  if (!skipRealtimePresencePolicies) {
    return sql;
  }

  if (!migrationPath.endsWith("202607140001_online_room_lobby.sql")) {
    return sql;
  }

  const pattern = /-- BEGIN realtime presence policies[\s\S]*?-- END realtime presence policies/g;

  return sql.replace(
    pattern,
    [
      "-- Skipped private Realtime Presence policies on realtime.messages.",
      "-- Some hosted Supabase dashboards reject this with ERROR 42501: must be owner of table messages.",
      "-- The beta app uses public Realtime room channels; keep private Presence authorization as a later hardening task.",
    ].join("\n"),
  );
}
