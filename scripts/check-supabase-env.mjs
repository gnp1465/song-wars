import { existsSync, readFileSync } from "node:fs";

const env = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
  ...process.env,
};

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const issues = [];

if (!supabaseUrl && !supabaseAnonKey) {
  console.log("Supabase env check skipped; no local Supabase env vars found.");
  process.exit(0);
}

if (!supabaseUrl) {
  issues.push("Missing EXPO_PUBLIC_SUPABASE_URL.");
} else if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  issues.push("EXPO_PUBLIC_SUPABASE_URL should look like https://your-project.supabase.co.");
}

if (!supabaseAnonKey) {
  issues.push("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY.");
} else {
  const keyPayload = decodeJwtPayload(supabaseAnonKey);

  if (keyPayload?.role === "service_role") {
    issues.push("EXPO_PUBLIC_SUPABASE_ANON_KEY is a service-role key. Never put that key in the app.");
  } else if (keyPayload?.role && keyPayload.role !== "anon") {
    issues.push(`EXPO_PUBLIC_SUPABASE_ANON_KEY has unexpected role "${keyPayload.role}". Use the public anon key.`);
  }
}

if (issues.length > 0) {
  console.log("Supabase env check failed.");

  for (const issue of issues) {
    console.log(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Supabase env check passed.");

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    values[key] = value;
  }

  return values;
}

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");

  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(toBase64(payload), "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

function toBase64(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);

  return `${base64}${padding}`;
}
