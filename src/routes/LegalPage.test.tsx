import { cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'
import { TermsOfServicePage } from './TermsOfServicePage'

function renderLegalPage(path: '/politica-de-privacidade' | '/termos-de-servico') {
  const rootRoute = createRootRoute({ component: Outlet })
  const privacyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/politica-de-privacidade', component: PrivacyPolicyPage })
  const termsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/termos-de-servico', component: TermsOfServicePage })
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/configuracoes', component: () => null })
  const router = createRouter({ routeTree: rootRoute.addChildren([privacyRoute, termsRoute, settingsRoute]), history: createMemoryHistory({ initialEntries: [path] }) })
  return render(<RouterProvider router={router} />)
}

describe('documentos legais públicos', () => {
  afterEach(cleanup)

  it('publica a Política de Privacidade com o endereço e os cuidados do Google Drive', async () => {
    renderLegalPage('/politica-de-privacidade')

    expect(await screen.findByRole('heading', { name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(screen.getByText(/Produtos, Receitas, Listas e suas entradas ficam no IndexedDB/)).toBeInTheDocument()
    expect(screen.getByText(/O token temporário recebido do Google fica somente na memória/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'repositório público do projeto' })).toHaveAttribute('href', 'https://github.com/saitodisse/lista-de-materiais')

    const navigation = screen.getByRole('navigation', { name: 'Documentos legais' })
    expect(within(navigation).getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/politica-de-privacidade')
    expect(within(navigation).getByRole('link', { name: 'Termos de Serviço' })).toHaveAttribute('href', '/termos-de-servico')
  })

  it('publica os Termos de Serviço e deixa claras as condições da sincronização manual', async () => {
    renderLegalPage('/termos-de-servico')

    expect(await screen.findByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByText(/A integração não sincroniza automaticamente/)).toBeInTheDocument()
    expect(screen.getByText(/Quem tiver permissão de edição no arquivo pode substituir/)).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', { name: 'Documentos legais' })
    expect(within(navigation).getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/politica-de-privacidade')
  })
})
