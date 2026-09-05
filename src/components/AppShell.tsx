import { useEffect, useState } from 'react'
import { Archive, BookOpen, CloudOff, LayoutList, Settings, Wifi } from 'lucide-react'
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

  const primaryNav = [
    { to: '/', label: 'Produtos', icon: Archive },
  ] as const
  const guideNav = { to: '/como-usar', label: 'Como usar', icon: BookOpen } as const
  const productionPlanNav = { to: '/listas', label: 'Plano de produção', icon: LayoutList } as const
  const settingsNav = { to: '/configuracoes', label: 'Configurações', icon: Settings } as const

  const isPrintRoute = pathname.endsWith('/imprimir')

  return (
    <NuqsAdapter>
      {isPrintRoute ? <main className="print-shell"><Outlet /></main> : <div className="app-frame">
        <aside className="rail">
          <Link to="/" className="brand" aria-label="Lista de Materiais, início">
            <span className="brand-mark"><span /><span /><span /></span>
            <span>lista<br />de materiais</span>
          </Link>
          <nav aria-label="Navegação principal">
            {primaryNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nav-link" activeProps={{ className: 'nav-link active' }}>
                <Icon size={19} strokeWidth={1.8} /> {label}
              </Link>
            ))}
          </nav>
          <div className="rail-footer">
            <nav aria-label="Acesso secundário">
              <Link to={settingsNav.to} className="device-note" activeProps={{ className: 'device-note active' }}>
                <Settings size={15} /> {settingsNav.label}
              </Link>
              <Link to={productionPlanNav.to} className="device-note" activeProps={{ className: 'device-note active' }}>
                <LayoutList size={15} /> {productionPlanNav.label}
              </Link>
              <Link to={guideNav.to} className="device-note" activeProps={{ className: 'device-note active' }}>
                <BookOpen size={15} /> {guideNav.label}
              </Link>
            </nav>
            <span className="device-note"><CloudOff size={16} /> Dados neste aparelho</span>
            <span className={`connection ${online ? 'online' : 'offline'}`}>
              {online ? <Wifi size={15} /> : <CloudOff size={15} />}
              {online ? 'Conectado' : 'Sem conexão'}
            </span>
          </div>
        </aside>
        <main className="main-content" data-route={pathname}>
          <Outlet />
          <footer className="app-footer" aria-label="Créditos, documentos legais e código-fonte">
            <a href="https://julio-saito.vercel.app/" target="_blank" rel="noopener noreferrer">Feito por Julio Saito</a>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/saitodisse/lista-de-materiais" target="_blank" rel="noopener noreferrer">Código no GitHub</a>
            <span aria-hidden="true">·</span>
            <a href="/politica-de-privacidade">Privacidade</a>
            <span aria-hidden="true">·</span>
            <a href="/termos-de-servico">Termos de Serviço</a>
          </footer>
        </main>
        <nav className="mobile-nav" aria-label="Navegação principal">
          {[...primaryNav, guideNav, productionPlanNav, settingsNav].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="mobile-link" activeProps={{ className: 'mobile-link active' }}>
              <Icon size={19} /> <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>}
    </NuqsAdapter>
  )
}
