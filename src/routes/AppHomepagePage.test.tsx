import { cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppHomepagePage } from './AppHomepagePage'

function renderAppHomepage() {
  const rootRoute = createRootRoute({ component: Outlet })
  const homepageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sobre-o-aplicativo', component: AppHomepagePage })
  const placeholderRoutes = ['/','/como-usar','/politica-de-privacidade','/termos-de-servico'].map((path) => createRoute({ getParentRoute: () => rootRoute, path, component: () => null }))
  const router = createRouter({ routeTree: rootRoute.addChildren([homepageRoute, ...placeholderRoutes]), history: createMemoryHistory({ initialEntries: ['/sobre-o-aplicativo'] }) })
  return render(<RouterProvider router={router} />)
}

describe('página pública do aplicativo', () => {
  afterEach(cleanup)

  it('identifica o produto e explica o uso opcional do Google Drive sem exigir login', async () => {
    renderAppHomepage()

    expect(await screen.findByRole('heading', { name: 'Organize Produtos, Receitas e Listas de Materiais.' })).toBeInTheDocument()
    expect(screen.getByText(/O catálogo fica no IndexedDB deste navegador/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Como o Google Drive entra na experiência' })).toBeInTheDocument()
    expect(screen.getByText(/Não há servidor próprio, sincronização automática/)).toBeInTheDocument()

    const legalNavigation = screen.getByRole('navigation', { name: 'Documentos públicos do aplicativo' })
    expect(within(legalNavigation).getByRole('link', { name: /Política de Privacidade/ })).toHaveAttribute('href', '/politica-de-privacidade')
    expect(within(legalNavigation).getByRole('link', { name: /Termos de Serviço/ })).toHaveAttribute('href', '/termos-de-servico')
  })
})
