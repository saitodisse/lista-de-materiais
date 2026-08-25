import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, resetDatabaseForTest } from '../db/database'
import { HomePage } from './HomePage'

function renderSettingsPage() {
  const rootRoute = createRootRoute({ component: Outlet })
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/configuracoes', component: HomePage })
  const router = createRouter({ routeTree: rootRoute.addChildren([settingsRoute]), history: createMemoryHistory({ initialEntries: ['/configuracoes'] }) })
  return render(<RouterProvider router={router} />)
}

describe('controle de dados locais', () => {
  beforeEach(async () => {
    await resetDatabaseForTest()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('apresenta os controles locais como Configurações', async () => {
    renderSettingsPage()

    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Conteúdo guardado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Exportar ou importar dados' })).toBeInTheDocument()
  })

  it('pede confirmação antes de importar um arquivo', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderSettingsPage()

    await screen.findByRole('button', { name: 'Importar JSON' })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()

    await user.upload(input!, new File(['{}'], 'dados.json', { type: 'application/json' }))

    expect(confirm).toHaveBeenCalledWith('Importar substituirá todos os Produtos, Receitas, Listas e entradas deste aparelho. Deseja continuar?')
    expect(await db.products.count()).toBe(0)
  })

  it('pede confirmação para adicionar a demonstração e depois limpar todos os dados locais', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderSettingsPage()

    await user.click(await screen.findByRole('button', { name: 'Adicionar demonstração' }))

    expect(confirm).toHaveBeenCalledWith('Adicionar a demonstração de pizzas a este aparelho?')
    await waitFor(async () => expect(await db.products.get('pacote-3-pizzas-mucarela')).toBeDefined())
    await user.click(await screen.findByRole('button', { name: 'Limpar tudo' }))

    expect(confirm).toHaveBeenLastCalledWith('Limpar todos os Produtos, Listas e entradas deste aparelho? Esta ação não pode ser desfeita.')
    await waitFor(async () => expect(await db.products.count()).toBe(0))
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'cleared' })
    expect(await screen.findByRole('button', { name: 'Adicionar demonstração' })).toBeEnabled()
  })
})
