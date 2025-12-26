import { env } from '../../lib/env'

export function SetupPage() {
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Configuração do Supabase</h2>
        <p className="muted" style={{ marginTop: -6 }}>
          O app está rodando, mas faltam variáveis de ambiente do Supabase. Sem isso ele fica “em branco” porque não
          consegue inicializar Auth/DB.
        </p>

        <div className="card" style={{ marginTop: 12 }}>
          <strong>Faltando</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {env.missing.length ? env.missing.join(', ') : '—'}
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <strong>Como resolver</strong>
          <ol className="muted" style={{ marginTop: 8 }}>
            <li>
              Copie <code>web/env.example</code> para <code>web/.env.local</code>
            </li>
            <li>
              Preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
            </li>
            <li>Recarregue a página.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


