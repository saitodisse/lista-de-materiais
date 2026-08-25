import { useEffect, useState } from 'react'
import { Archive, Boxes, CloudOff, LayoutList, Wifi } from 'lucide-react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

export function AppShell() {
  const online = useOnlineStatus()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const nav = [
    { to: '/', label: 'Visão geral', icon: Boxes },
    { to: '/produtos', label: 'Produtos', icon: Archive },
    { to: '/listas', label: 'Listas', icon: LayoutList },
  ] as const

  return (
    <NuqsAdapter>
      <div className="app-frame">
        <aside className="rail">
          <Link to="/" className="brand" aria-label="Lista de Materiais, início">
            <span className="brand-mark"><span /><span /><span /></span>
            <span>lista<br />de materiais</span>
          </Link>
          <nav aria-label="Navegação principal">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nav-link" activeProps={{ className: 'nav-link active' }}>
                <Icon size={19} strokeWidth={1.8} /> {label}
              </Link>
            ))}
          </nav>
          <div className="rail-footer">
            <span className="device-note"><CloudOff size={16} /> Dados neste aparelho</span>
            <span className={`connection ${online ? 'online' : 'offline'}`}>
              {online ? <Wifi size={15} /> : <CloudOff size={15} />}
              {online ? 'Conectado' : 'Sem conexão'}
            </span>
          </div>
        </aside>
        <main className="main-content" data-route={pathname}>
          <Outlet />
          <footer className="app-footer" aria-label="Créditos e código-fonte">
            <a href="https://julio-saito.vercel.app/" target="_blank" rel="noopener noreferrer">Feito por Julio Saito</a>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/saitodisse/lista-de-materiais" target="_blank" rel="noopener noreferrer">Código no GitHub</a>
          </footer>
        </main>
        <nav className="mobile-nav" aria-label="Navegação principal">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="mobile-link" activeProps={{ className: 'mobile-link active' }}>
              <Icon size={19} /> <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </NuqsAdapter>
  )
}
