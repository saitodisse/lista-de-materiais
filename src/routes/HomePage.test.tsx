import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

  it('exige confirmação por checkbox para substituir pela demonstração e ainda permite limpar tudo', async () => {
    const user = userEvent.setup()
    renderSettingsPage()

    await user.click(await screen.findByRole('button', { name: 'Limpar e carregar demonstração' }))
    const dialog = screen.getByRole('dialog', { name: 'Substituir todos os dados deste aparelho?' })
    const replaceButton = within(dialog).getByRole('button', { name: 'Limpar e carregar demonstração' })
    expect(replaceButton).toBeDisabled()
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(replaceButton)

    await waitFor(async () => expect(await db.products.get('pacote-3-pizzas-mucarela')).toBeDefined())
    await user.click(await screen.findByRole('button', { name: 'Limpar tudo' }))

    const clearDialog = screen.getByRole('dialog', { name: 'Limpar todos os dados deste aparelho?' })
    const clearButton = within(clearDialog).getByRole('button', { name: 'Limpar todos os dados' })
    expect(clearButton).toBeDisabled()
    await user.click(within(clearDialog).getByRole('checkbox'))
    await user.click(clearButton)
    await waitFor(async () => expect(await db.products.count()).toBe(0))
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'cleared' })
    expect(await screen.findByRole('button', { name: 'Limpar e carregar demonstração' })).toBeEnabled()
  })
})
