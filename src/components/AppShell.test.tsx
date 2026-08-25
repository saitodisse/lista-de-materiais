import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

function renderAppShell() {
  const rootRoute = createRootRoute({ component: AppShell })
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <h1>Visão geral</h1>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('shell do aplicativo', () => {
  it('mantém créditos e links externos no rodapé global', async () => {
    renderAppShell()

    const portfolio = await screen.findByRole('link', { name: 'Feito por Julio Saito' })
    const repository = screen.getByRole('link', { name: 'Código no GitHub' })

    expect(portfolio).toHaveAttribute('href', 'https://julio-saito.vercel.app/')
    expect(portfolio).toHaveAttribute('target', '_blank')
    expect(repository).toHaveAttribute('href', 'https://github.com/saitodisse/lista-de-materiais')
    expect(repository).toHaveAttribute('target', '_blank')
  })
})
