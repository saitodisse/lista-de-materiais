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
  const listsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas', component: () => null })
  const listRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas/$listId', component: () => null })
  const router = createRouter({
    routeTree: rootRoute.addChildren([productsRoute, productRoute, listsRoute, listRoute]),
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

  it('abre em tabela e alterna entre tabela e cartões sem alterar o catálogo', async () => {
    const user = userEvent.setup()
    renderProductsRoute('/produtos')

    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Produtos cadastrados' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Tabela|Cartões/ }).map((button) => button.textContent)).toEqual(['Tabela', 'Cartões'])
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Massa integral' }).closest('td')?.firstElementChild).toHaveClass('record-card-head')
    expect(within(screen.getByRole('table', { name: 'Produtos cadastrados' })).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'CAT',
      'Produto',
      'UN',
      'Receita',
      'Custo de compra',
      'Valor de venda',
    ])
    expect(screen.getByRole('columnheader', { name: 'Receita' })).toHaveAttribute('data-column', 'recipe')
    expect(screen.getByRole('columnheader', { name: 'Custo de compra' })).toHaveAttribute('data-column', 'purchase-cost')
    expect(document.querySelector('table .category-mark')).toHaveAttribute('data-category', 's')

    await user.click(screen.getByRole('button', { name: 'Cartões' }))

    expect(screen.queryByRole('table', { name: 'Produtos cadastrados' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Massa integral' })).toBeInTheDocument()
    expect(document.querySelector('.category-mark')).toHaveAttribute('data-category', 's')

    await user.click(screen.getByRole('button', { name: 'Tabela' }))

    expect(screen.getByRole('table', { name: 'Produtos cadastrados' })).toBeInTheDocument()
  })

  it('substitui as categorias de limpeza por Outros no filtro e na tabela', async () => {
    await db.products.add({ ...massa, id: 'outro', productCode: 'outro', name: 'Outro material', category: 'c' })
    renderProductsRoute('/produtos?view=table')

    expect(await screen.findByRole('button', { name: 'Outros' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpeza' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Produtos de Limpeza' })).not.toBeInTheDocument()

    const row = screen.getByRole('link', { name: 'Outro material' }).closest('tr')
    expect(row?.querySelector('[data-column="category"]')).toHaveAttribute('aria-label', 'Outros')
    expect(row?.querySelector('[data-column="category"]')).toHaveAttribute('title', 'Outros')
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
    renderProductsRoute('/produtos?view=cards&search=agua-filtrada&categories=m', (event) => urlUpdates.push(event.searchParams))

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

  it('lista e vincula as dependências que bloqueiam a exclusão', async () => {
    await db.products.add({ ...massa, id: 'pao-integral', productCode: 'pao-integral', name: 'Pão integral', category: 'p', recipe: [{ id: massa.productCode, quantity: 1 }] })
    await db.materialLists.add({ id: 'lista-compras', name: 'Compras da semana', createdAt: massa.createdAt, updatedAt: massa.updatedAt })
    await db.materialListEntries.add({ listId: 'lista-compras', productCode: massa.productCode, quantity: 2 })
    renderProductsRoute('/produtos/massa-integral')

    const warning = await screen.findByRole('heading', { name: 'Remover Produto' })
    const dangerZone = warning.closest('section')!
    expect(within(dangerZone).getByRole('link', { name: 'Pão integral' })).toHaveAttribute('href', '/produtos/pao-integral')
    expect(within(dangerZone).getByRole('link', { name: 'Compras da semana' })).toHaveAttribute('href', '/listas/lista-compras')
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled()
  })

  it('preserva as quebras de linha de observações e modo de preparo', async () => {
    await db.products.put({
      ...massa,
      notes: 'Use farinha peneirada.\nMantenha a embalagem fechada.',
      preparation: 'Misture os ingredientes.\nAsse até dourar.',
    })
    renderProductsRoute('/produtos/massa-integral')

    const notes = await screen.findByText((_, element) => element?.tagName === 'PRE' && element.textContent === 'Use farinha peneirada.\nMantenha a embalagem fechada.')
    const preparation = screen.getByText((_, element) => element?.tagName === 'PRE' && element.textContent === 'Misture os ingredientes.\nAsse até dourar.')

    expect(notes.tagName).toBe('PRE')
    expect(preparation.tagName).toBe('PRE')
  })

  it('mostra a árvore completa da Receita e recalcula tudo pela quantidade simulada', async () => {
    const user = userEvent.setup()
    await db.products.put({ ...massa, recipe: [{ id: 'farinha', quantity: 0.5 }], purchaseQuoteValue: null })
    await db.products.add({ ...massa, id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', purchaseQuoteValue: 4 })
    await db.products.add({
      ...massa,
      id: 'pizza-de-mucarela',
      productCode: 'pizza-de-mucarela',
      name: 'Pizza de muçarela',
      category: 'u',
      unit: 'UN',
      purchaseQuoteValue: null,
      recipe: [{ id: massa.productCode, quantity: 2 }],
    })
    renderProductsRoute('/produtos/pizza-de-mucarela')

    const table = await screen.findByRole('table', { name: 'Árvore calculada da Receita' })

    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Produto',
      'Quantidade',
      'Custo',
    ])
    expect(within(table).getByRole('link', { name: 'Farinha' })).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*4,00/)).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Árvore completa' })).toHaveAttribute('aria-pressed', 'true')

    const rootQuantity = screen.getByRole('spinbutton', { name: 'Quantidade simulada de Pizza de muçarela' }) as HTMLInputElement
    await user.click(rootQuantity)
    await waitFor(() => {
      expect(rootQuantity.selectionStart).toBe(0)
      expect(rootQuantity.selectionEnd).toBe(rootQuantity.value.length)
    })

    await user.click(screen.getByRole('button', { name: 'Uma camada' }))
    expect(screen.getByRole('button', { name: 'Uma camada' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).queryByRole('link', { name: 'Farinha' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Árvore completa' }))
    expect(within(table).getByRole('link', { name: 'Farinha' })).toBeInTheDocument()

    const massQuantity = screen.getByRole('spinbutton', { name: 'Quantidade simulada de Massa integral' })
    await user.clear(massQuantity)
    await user.type(massQuantity, '3.123456')

    expect(massQuantity).toHaveValue('3.12346')
    expect(screen.getByRole('spinbutton', { name: 'Quantidade simulada de Pizza de muçarela' })).toHaveValue('1.56173')
    expect(screen.getAllByText(/R\$\s*6,25/)).toHaveLength(3)
    expect((await db.products.get('pizza-de-mucarela'))?.recipe).toEqual([{ id: massa.productCode, quantity: 2 }])
  })
})
