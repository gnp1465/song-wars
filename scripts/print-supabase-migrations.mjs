import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationDir = "supabase/migrations";
const migrationPaths = readdirSync(migrationDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => join(migrationDir, fileName));
const skipRealtimePresencePolicies = process.env.SUPABASE_SKIP_REALTIME_PRESENCE_POLICIES === "1";

for (const migrationPath of migrationPaths) {
  console.log(`\n-- BEGIN ${migrationPath}`);
  console.log(prepareMigrationSql(readFileSync(migrationPath, "utf8"), migrationPath).trim());
  console.log(`-- END ${migrationPath}\n`);
}

function prepareMigrationSql(sql, migrationPath) {
  if (!skipRealtimePresencePolicies) {
    return sql;
  }

  if (!migrationPath.endsWith("202607140001_online_room_lobby.sql")) {
    return sql;
  }

  return stripRealtimePresencePolicyBlock(
    stripRealtimePresencePolicyBlock(sql, "room members can read room presence"),
    "room members can track room presence",
  );
}

function stripRealtimePresencePolicyBlock(sql, policyName) {
  const pattern = new RegExp(
    `drop policy if exists "${policyName}" on realtime\\.messages;\\ncreate policy "${policyName}"[\\s\\S]*?\\n  \\);`,
    "g",
  );

  return sql.replace(
    pattern,
    [
      `-- Skipped "${policyName}" on realtime.messages.`,
      "-- Some hosted Supabase dashboards reject this with ERROR 42501: must be owner of table messages.",
      "-- Apply the core schema first, then resolve private Realtime Presence authorization before beta.",
    ].join("\n"),
  );
}
