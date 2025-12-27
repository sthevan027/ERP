export function errorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  // AbortController / timeout
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Timeout ao conectar no Supabase. Verifique VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY e se sua rede/firewall/proxy permite acesso.'
  }

  if (err instanceof Error) {
    const msg = err.message || ''
    const lower = msg.toLowerCase()

    // Erros comuns de rede no browser
    if (
      lower.includes('failed to fetch') ||
      lower.includes('fetch failed') ||
      lower.includes('networkerror') ||
      lower.includes('load failed')
    ) {
      return 'Falha de rede ao acessar o Supabase. Verifique sua internet, firewall/proxy/antivírus e se a URL do Supabase está correta.'
    }

    // Erros específicos do Supabase Auth
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.'
    }
    if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada e confirme seu e-mail antes de fazer login.'
    }
    if (lower.includes('too many requests') || lower.includes('rate_limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
    }
    if (lower.includes('timeout')) {
      return 'Timeout ao conectar com Supabase. Verifique sua conexão e as variáveis de ambiente.'
    }

    return msg || fallback
  }
  if (typeof err === 'string') return err || fallback
  return fallback
}


