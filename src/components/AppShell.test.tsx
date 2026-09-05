import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

function renderAppShell() {
  const rootRoute = createRootRoute({ component: AppShell })
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <h1>Produtos</h1>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('shell do aplicativo', () => {
  afterEach(cleanup)

  it('mantém créditos e links externos no rodapé global', async () => {
    renderAppShell()

    const portfolio = await screen.findByRole('link', { name: 'Feito por Julio Saito' })
    const repository = screen.getByRole('link', { name: 'Código no GitHub' })

    expect(portfolio).toHaveAttribute('href', 'https://julio-saito.vercel.app/')
    expect(portfolio).toHaveAttribute('target', '_blank')
    expect(repository).toHaveAttribute('href', 'https://github.com/saitodisse/lista-de-materiais')
    expect(repository).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/politica-de-privacidade')
    expect(screen.getByRole('link', { name: 'Termos de Serviço' })).toHaveAttribute('href', '/termos-de-servico')
  })

  it('mantém Configurações e Plano de produção como acessos secundários no rodapé da barra lateral', async () => {
    renderAppShell()

    const productLinks = await screen.findAllByRole('link', { name: 'Produtos' })
    const settingsLinks = await screen.findAllByRole('link', { name: 'Configurações' })
    const planLinks = await screen.findAllByRole('link', { name: 'Plano de produção' })

    expect(productLinks[0]).toHaveAttribute('href', '/')
    expect(settingsLinks).toHaveLength(2)
    expect(settingsLinks[0]).toHaveAttribute('href', '/configuracoes')
    expect(settingsLinks[0].closest('.rail-footer')).not.toBeNull()
    expect(planLinks).toHaveLength(2)
    expect(planLinks[0]).toHaveAttribute('href', '/listas')
    expect(planLinks[0].closest('.rail-footer')).not.toBeNull()
    expect(screen.queryByRole('link', { name: 'Listas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Visão geral' })).not.toBeInTheDocument()
  })

  it('mantém Como usar no rodapé da barra lateral e na navegação móvel', async () => {
    renderAppShell()

    const guideLinks = await screen.findAllByRole('link', { name: 'Como usar' })
    expect(guideLinks).toHaveLength(2)
    expect(guideLinks[0]).toHaveAttribute('href', '/como-usar')
    expect(guideLinks[0]).toHaveClass('device-note')
    expect(guideLinks[0].closest('.rail-footer')).not.toBeNull()
    expect(guideLinks[1]).toHaveClass('mobile-link')
  })
})
