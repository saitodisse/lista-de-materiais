import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabaseForTest } from '../../db/database'
import type { ProductRecord } from '../../domain/catalog'
import { ProductDetailPage, ProductsPage } from './ProductPages'

const massa: ProductRecord = {
  id: 'massa-integral',
  productCode: 'massa-integral',
  name: 'Massa integral',
  category: 's',
  unit: 'KG',
  weight: null,
  purchaseQuoteValue: 4.5,
  saleValue: null,
  notes: null,
  preparation: null,
  recipe: null,
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderProductsRoute(initialEntry: string, onUrlUpdate?: OnUrlUpdateFunction) {
  const searchParams = new URL(initialEntry, 'https://lista.local').search
  const rootRoute = createRootRoute({ component: () => <NuqsTestingAdapter hasMemory searchParams={searchParams} onUrlUpdate={onUrlUpdate}><Outlet /></NuqsTestingAdapter> })
  const productsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos', component: ProductsPage })
  const productRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/$productCode', component: ProductDetailPage })
  const router = createRouter({
    routeTree: rootRoute.addChildren([productsRoute, productRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('consulta de Produtos', () => {
  beforeEach(async () => {
    await resetDatabaseForTest()
    window.localStorage.clear()
    await db.products.add(massa)
  })

  afterEach(() => cleanup())

  it('alterna entre cartões e tabela sem alterar o catálogo', async () => {
    const user = userEvent.setup()
    renderProductsRoute('/produtos')

    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Produtos cadastrados' })).not.toBeInTheDocument()
    expect(document.querySelector('.category-mark')).toHaveAttribute('data-category', 's')

    await user.click(screen.getByRole('button', { name: 'Tabela' }))

    expect(screen.getByRole('table', { name: 'Produtos cadastrados' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Massa integral' })).toBeInTheDocument()
    expect(document.querySelector('table .category-mark')).toHaveAttribute('data-category', 's')

    await user.click(screen.getByRole('button', { name: 'Cartões' }))

    expect(screen.queryByRole('table', { name: 'Produtos cadastrados' })).not.toBeInTheDocument()
  })

  it('substitui as categorias de limpeza por Outros no filtro e na tabela', async () => {
    await db.products.add({ ...massa, id: 'outro', productCode: 'outro', name: 'Outro material', category: 'c' })
    renderProductsRoute('/produtos?view=table')

    expect(await screen.findByRole('button', { name: 'Outros' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpeza' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Produtos de Limpeza' })).not.toBeInTheDocument()

    const row = screen.getByRole('link', { name: 'Outro material' }).closest('tr')
    expect(within(row!).getByText('Outros')).toBeInTheDocument()
    expect(row?.querySelector('.category-mark')).toHaveTextContent('o')
  })

  it('sincroniza a visualização entre nuqs e a preferência deste aparelho', async () => {
    const user = userEvent.setup()
    const urlUpdates: string[] = []
    window.localStorage.setItem('lista-de-materiais:products-view', 'table')
    renderProductsRoute('/produtos', (event) => urlUpdates.push(event.queryString))

    expect(await screen.findByRole('table', { name: 'Produtos cadastrados' })).toBeInTheDocument()
    expect(window.localStorage.getItem('lista-de-materiais:products-view')).toBe('table')

    await user.click(screen.getByRole('button', { name: 'Cartões' }))

    expect(screen.queryByRole('table', { name: 'Produtos cadastrados' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem('lista-de-materiais:products-view')).toBe('cards')
    await waitFor(() => expect(urlUpdates).toContain('?view=cards'))
  })

  it('restaura busca e categorias da URL e atualiza a query pelos filtros', async () => {
    const user = userEvent.setup()
    const urlUpdates: URLSearchParams[] = []
    await db.products.bulkAdd([
      { ...massa, id: 'pao-integral', productCode: 'pao-integral', name: 'Pão integral', category: 'p', unit: 'UN' },
      { ...massa, id: 'agua-filtrada', productCode: 'agua-filtrada', name: 'Água filtrada', category: 'm', unit: 'L' },
    ])
    renderProductsRoute('/produtos?search=agua-filtrada&categories=m', (event) => urlUpdates.push(event.searchParams))

    expect(await screen.findByRole('heading', { name: 'Água filtrada' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar por nome ou código' })).toHaveValue('agua-filtrada')
    expect(screen.getByRole('button', { name: 'Materia-prima' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Massa integral' })).not.toBeInTheDocument()

    const searchbox = screen.getByRole('searchbox', { name: 'Buscar por nome ou código' })
    await user.clear(searchbox)
    await user.click(screen.getByRole('button', { name: 'Produto Final' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Produto Final' })).toHaveAttribute('aria-pressed', 'true'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pão integral' })).toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Massa integral' })).not.toBeInTheDocument()

    await user.type(searchbox, 'pao-integral')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pão integral' })).toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Água filtrada' })).not.toBeInTheDocument()
    await waitFor(() => expect(urlUpdates.some((params) => params.get('search') === 'pao-integral' && params.get('categories') === 'p,m')).toBe(true))

    await user.clear(searchbox)
    await user.click(screen.getByRole('button', { name: 'Produto Final' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Produto Final' })).toHaveAttribute('aria-pressed', 'false'))
    await user.type(searchbox, 'Água filtrada')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Água filtrada' })).toBeInTheDocument())
  })

  it('mantém o aviso de exclusão fora das ações da ficha', async () => {
    renderProductsRoute('/produtos/massa-integral')

    expect(await screen.findByRole('heading', { name: 'Massa integral' })).toBeInTheDocument()
    const warning = screen.getByRole('heading', { name: 'Remover Produto' }).closest('section')

    expect(warning).not.toBeNull()
    expect(within(warning!).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(within(warning!).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' }).closest('.danger-zone')).toBeNull()
    expect(screen.getByRole('button', { name: 'Excluir' }).closest('.danger-zone')).toBeNull()
  })

  it('mostra a categoria como a primeira coluna de cada componente da Receita', async () => {
    await db.products.add({
      ...massa,
      id: 'pizza-de-mucarela',
      productCode: 'pizza-de-mucarela',
      name: 'Pizza de muçarela',
      category: 'u',
      unit: 'UN',
      recipe: [{ id: massa.productCode, quantity: 1 }],
    })
    renderProductsRoute('/produtos/pizza-de-mucarela')

    const table = await screen.findByRole('table', { name: 'Componentes da Receita' })
    const component = within(table).getByRole('link', { name: 'Massa integral' }).closest('tr')

    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Tipo',
      'Produto',
      'Código',
      'Quantidade',
    ])
    expect(within(component!).getByText('Semi-acabado')).toBeInTheDocument()
    expect(component?.querySelector('.category-mark')).toHaveAttribute('data-category', 's')
  })
})
