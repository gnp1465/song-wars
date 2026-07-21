export interface DiagnosticContext {
  area: string;
  detail?: string;
  metadata?: DiagnosticMetadata;
}

export type DiagnosticMetadata = Record<string, boolean | number | string | null | undefined>;

export type DiagnosticRecord =
  | {
      area: string;
      detail?: string;
      kind: "event";
      metadata?: Record<string, boolean | number | string | null>;
      name: AppEventName;
    }
  | {
      area: string;
      detail?: string;
      kind: "error";
      message: string;
      metadata?: Record<string, boolean | number | string | null>;
    };

export type AppEventName =
  | "app_started"
  | "audio_mode_configured"
  | "online_room_resume_available"
  | "online_room_resume_failed";

export interface DiagnosticSink {
  record: (diagnosticRecord: DiagnosticRecord) => void;
}

const REDACTED_DIAGNOSTIC_VALUE = "[redacted]";
const MAX_DIAGNOSTIC_TEXT_LENGTH = 240;
const SENSITIVE_DIAGNOSTIC_KEY_PATTERN =
  /^(access_token|apikey|api_key|anon_key|password|refresh_token|secret|service_role|token)$/i;

let diagnosticSink: DiagnosticSink = {
  record(diagnosticRecord) {
    if (diagnosticRecord.kind === "error") {
      console.warn(`[SongWars:${diagnosticRecord.area}] ${diagnosticRecord.message}`, {
        detail: diagnosticRecord.detail,
        metadata: diagnosticRecord.metadata,
      });
      return;
    }

    console.info(`[SongWars:${diagnosticRecord.area}] event:${diagnosticRecord.name}`, {
      detail: diagnosticRecord.detail,
      metadata: diagnosticRecord.metadata,
    });
  },
};

export function setDiagnosticSink(nextSink: DiagnosticSink): () => void {
  const previousSink = diagnosticSink;
  diagnosticSink = nextSink;

  return () => {
    diagnosticSink = previousSink;
  };
}

export function redactDiagnosticText(value: string): string {
  const redactedValue = value
    .replace(/\bBearer\s+[A-Za-z0-9._-]+/gi, `Bearer ${REDACTED_DIAGNOSTIC_VALUE}`)
    .replace(
      /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      REDACTED_DIAGNOSTIC_VALUE,
    )
    .replace(
      /\b(access_token|apikey|api_key|anon_key|password|refresh_token|secret|service_role|token)=([^&\s]+)/gi,
      `$1=${REDACTED_DIAGNOSTIC_VALUE}`,
    )
    .replace(
      /https:\/\/[a-z0-9-]+\.supabase\.co/gi,
      "https://[supabase-project].supabase.co",
    );

  return redactedValue.length > MAX_DIAGNOSTIC_TEXT_LENGTH
    ? `${redactedValue.slice(0, MAX_DIAGNOSTIC_TEXT_LENGTH)}...`
    : redactedValue;
}

export function reportAppEvent(name: AppEventName, context: DiagnosticContext): void {
  diagnosticSink.record({
    area: redactDiagnosticText(context.area),
    detail: context.detail ? redactDiagnosticText(context.detail) : undefined,
    kind: "event",
    metadata: normalizeDiagnosticMetadata(context.metadata),
    name,
  });
}

export function reportAppError(error: unknown, context: DiagnosticContext): void {
  const normalizedError = redactDiagnosticText(
    error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  );

  diagnosticSink.record({
    area: redactDiagnosticText(context.area),
    detail: context.detail ? redactDiagnosticText(context.detail) : undefined,
    kind: "error",
    message: normalizedError,
    metadata: normalizeDiagnosticMetadata(context.metadata),
  });
}

function normalizeDiagnosticMetadata(
  metadata?: DiagnosticMetadata,
): Record<string, boolean | number | string | null> | undefined {
  if (!metadata) {
    return undefined;
  }

  const normalizedMetadata: Record<string, boolean | number | string | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) {
      continue;
    }

    const normalizedKey = redactDiagnosticText(key);
    normalizedMetadata[normalizedKey] =
      SENSITIVE_DIAGNOSTIC_KEY_PATTERN.test(key) && typeof value === "string"
        ? REDACTED_DIAGNOSTIC_VALUE
        : typeof value === "string"
          ? redactDiagnosticText(value)
          : value;
  }

  return Object.keys(normalizedMetadata).length > 0 ? normalizedMetadata : undefined;
}
