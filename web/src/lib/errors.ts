export function errorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (err instanceof Error) return err.message || fallback
  if (typeof err === 'string') return err || fallback
  return fallback
}


