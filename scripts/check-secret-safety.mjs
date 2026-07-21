import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const allowedEnvExamples = new Set([".env.example", ".env.production.example"]);
const issues = [];

for (const file of trackedFiles) {
  if (file.startsWith(".env") && !allowedEnvExamples.has(file)) {
    issues.push(`Tracked environment file should not be committed: ${file}`);
  }
}

for (const examplePath of allowedEnvExamples) {
  const source = readFileSync(examplePath, "utf8");

  for (const line of source.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const [, value = ""] = trimmedLine.split("=");

    if (value.trim()) {
      issues.push(`${examplePath} should not contain real environment values.`);
    }
  }
}

for (const file of trackedFiles) {
  const source = readTextFile(file);

  if (!source) {
    continue;
  }

  for (const token of source.matchAll(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)) {
    const payload = parseJwtPayload(token[0]);

    if (!payload) {
      continue;
    }

    if (payload.role === "service_role") {
      issues.push(`Committed Supabase service-role key found in ${file}.`);
    } else if (payload.iss === "supabase" || typeof payload.ref === "string") {
      issues.push(`Committed Supabase JWT-like key found in ${file}; keep real keys in local env files.`);
    }
  }
}

if (issues.length > 0) {
  console.log("Secret safety check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Secret safety checks passed.");

function readTextFile(path) {
  try {
    const source = readFileSync(path, "utf8");

    if (source.includes("\u0000")) {
      return undefined;
    }

    return source;
  } catch {
    return undefined;
  }
}

function parseJwtPayload(token) {
  const [, payload] = token.split(".");

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
}
