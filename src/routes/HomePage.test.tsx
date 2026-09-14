import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getOrCreateDemoProfile, listProducts, resetDatabaseForTest } from '../db/database'
import { HomePage } from './HomePage'
import { DEMO_LIST_ID, DEMO_PRODUCT_CODES } from '../features/demo/demoData'
import type { ProductRecord } from '../domain/catalog'

function rawMaterial(): ProductRecord {
  const now = '2026-01-01T00:00:00.000Z'
  return { id: 'local-global', productCode: 'local-global', name: 'Local', category: 'm', unit: 'KG', weight: null, purchaseQuoteValue: null, saleValue: null, notes: null, preparation: null, recipe: null, imageUrl: null, createdAt: now, updatedAt: now }
}

function renderSettingsPage() {
  const rootRoute = createRootRoute({ component: Outlet })
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/perfis/$profileId/configuracoes', component: HomePage })
  const router = createRouter({ routeTree: rootRoute.addChildren([settingsRoute]), history: createMemoryHistory({ initialEntries: ['/perfis/principal/configuracoes'] }) })
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

    expect(confirm).toHaveBeenCalledWith('Importar substituirá todos os Produtos, Receitas, Listas e entradas do Perfil “principal”. Deseja continuar?')
    expect(await db.products.count()).toBe(0)
  })

  it('exige confirmação para abrir a demonstração num Perfil separado sem tocar o atual', async () => {
    const user = userEvent.setup()
    await db.products.add(rawMaterial())
    renderSettingsPage()

    const trigger = await screen.findByRole('button', { name: 'Abrir Perfil Demonstração' })
    expect(await db.products.count()).toBe(1)
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Carregar o exemplo no Perfil “Demonstração”?' })
    const replaceButton = within(dialog).getByRole('button', { name: 'Abrir Perfil Demonstração' })
    expect(replaceButton).toBeDisabled()
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(replaceButton)

    await waitFor(async () => expect(await db.products.count()).toBe(1))
    // O Perfil atual (Principal) permanece intacto: a demo foi isolada.
    expect(await db.products.get('local-global')).toBeDefined()
    expect(await db.products.get(DEMO_LIST_ID)).toBeUndefined()
    const demoProfile = await getOrCreateDemoProfile()
    expect(await listProducts(demoProfile.id)).toHaveLength(DEMO_PRODUCT_CODES.length)
  })

  it('permite limpar o catálogo do Perfil atual após confirmação', async () => {
    const user = userEvent.setup()
    await db.products.add(rawMaterial())
    await db.meta.put({ key: 'demo-state', value: 'inserted' })
    renderSettingsPage()

    await user.click(await screen.findByRole('button', { name: 'Limpar este Perfil' }))

    const clearDialog = screen.getByRole('dialog', { name: 'Limpar todos os dados deste Perfil?' })
    const clearButton = within(clearDialog).getByRole('button', { name: 'Limpar todos os dados' })
    expect(clearButton).toBeDisabled()
    await user.click(within(clearDialog).getByRole('checkbox'))
    await user.click(clearButton)
    await waitFor(async () => expect(await db.products.count()).toBe(0))
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
    expect(await db.meta.get('demo-state')).toMatchObject({ value: 'cleared' })
    expect(await screen.findByRole('button', { name: 'Abrir Perfil Demonstração' })).toBeEnabled()
  })
})
