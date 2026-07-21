export interface DiagnosticContext {
  area: string;
  detail?: string;
}

export function reportAppError(error: unknown, context: DiagnosticContext): void {
  const normalizedError =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  console.warn(`[SongWars:${context.area}] ${normalizedError}`, {
    detail: context.detail,
  });
}
