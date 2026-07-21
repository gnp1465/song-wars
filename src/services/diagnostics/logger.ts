export interface DiagnosticContext {
  area: string;
  detail?: string;
}

const REDACTED_DIAGNOSTIC_VALUE = "[redacted]";

export function redactDiagnosticText(value: string): string {
  return value
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
}

export function reportAppError(error: unknown, context: DiagnosticContext): void {
  const normalizedError = redactDiagnosticText(
    error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  );

  console.warn(`[SongWars:${context.area}] ${normalizedError}`, {
    detail: context.detail ? redactDiagnosticText(context.detail) : undefined,
  });
}
