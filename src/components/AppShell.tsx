import { useEffect, useState } from 'react'
import { Archive, BookOpen, CloudOff, LayoutList, Settings, Wifi } from 'lucide-react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { getProfiles } from '../db/database'

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
  const profiles = useLiveQuery(() => getProfiles(), [])
  const profileId = pathname.match(/^\/perfis\/([^/]+)/)?.[1]
  const profilePath = (suffix: string) => profileId ? `/perfis/${profileId}${suffix}` : suffix

  const primaryNav = [
    { to: profileId ? profilePath('/produtos') : '/', label: 'Produtos', icon: Archive },
  ] as const
  const guideNav = { to: '/como-usar', label: 'Como usar', icon: BookOpen } as const
  const productionPlanNav = { to: profilePath('/listas'), label: 'Plano de produção', icon: LayoutList } as const
  const settingsNav = { to: profilePath('/configuracoes'), label: 'Configurações', icon: Settings } as const

  const isPrintRoute = pathname.endsWith('/imprimir')

  return (
    <NuqsAdapter>
      {isPrintRoute ? <main className="print-shell"><Outlet /></main> : <div className="app-frame">
        <aside className="rail">
          <Link to="/" className="brand" aria-label="Lista de Materiais, início">
            <span className="brand-mark"><span /><span /><span /></span>
            <span>lista<br />de materiais</span>
          </Link>
          {profileId && profiles && <label className="profile-switcher">Perfil<select aria-label="Perfil local atual" value={profileId} onChange={(event) => window.location.assign(`/perfis/${event.target.value}/produtos`)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>}
          <nav aria-label="Navegação principal">
            {primaryNav.map(({ to, label, icon: Icon }) => (
              <a key={to} href={to} className={`nav-link${pathname === to ? ' active' : ''}`}>
                <Icon size={19} strokeWidth={1.8} /> {label}
              </a>
            ))}
          </nav>
          <div className="rail-footer">
            <nav aria-label="Acesso secundário">
              <a href={settingsNav.to} className={`device-note${pathname === settingsNav.to ? ' active' : ''}`}>
                <Settings size={15} /> {settingsNav.label}
              </a>
              <a href={productionPlanNav.to} className={`device-note${pathname === productionPlanNav.to ? ' active' : ''}`}>
                <LayoutList size={15} /> {productionPlanNav.label}
              </a>
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
          <footer className="app-footer" aria-label="Página pública, créditos, documentos legais e código-fonte">
            <a href="/sobre-o-aplicativo">Sobre o aplicativo</a>
            <span aria-hidden="true">·</span>
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
            <a key={to} href={to} className={`mobile-link${pathname === to ? ' active' : ''}`}>
              <Icon size={19} /> <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>}
    </NuqsAdapter>
  )
}
