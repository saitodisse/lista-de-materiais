import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, resetDatabaseForTest } from '../../db/database'
import type { ProductRecord } from '../../domain/catalog'
import { ProductDetailPage, ProductEditorPage, ProductsPage } from './ProductPages'
import { ProductPrintPage } from './ProductPrintPage'

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
  const editProductRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/$productCode/editar', component: ProductEditorPage })
  const printRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/$productCode/imprimir', component: ProductPrintPage })
  const listsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas', component: () => null })
  const listRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas/$listId', component: () => null })
  const router = createRouter({
    routeTree: rootRoute.addChildren([productsRoute, productRoute, editProductRoute, printRoute, listsRoute, listRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('consulta de Produtos', () => {
  beforeEach(async () => {
    await resetDatabaseForTest()
    window.localStorage.clear()
    window.localStorage.setItem('lista-de-materiais:guide-seen:catalogo-tabela', 'seen')
    window.localStorage.setItem('lista-de-materiais:guide-seen:detalhe-produto', 'seen')
    window.localStorage.setItem('lista-de-materiais:guide-seen:edicao-produto', 'seen')
    await db.products.add(massa)
  })

  afterEach(() => cleanup())

  it('abre em tabela e alterna entre tabela e cartões sem alterar o catálogo', async () => {
    const user = userEvent.setup()
    renderProductsRoute('/produtos')

    expect(await screen.findByRole('heading', { name: 'Produtos' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Produtos cadastrados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar para planilha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir catálogo' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Tabela|Cartões/ }).map((button) => button.textContent)).toEqual(['Tabela', 'Cartões'])
    expect(screen.getByRole('button', { name: 'Tabela' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Abrir ajuda desta tela' })).toBeInTheDocument()
    expect(document.querySelector('[data-guide="catalog-table-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="catalog-table-toolbar"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="catalog-table-filters"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="catalog-table"]')).toBeInTheDocument()
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

  it('mostra na tabela o custo calculado de Produtos compostos', async () => {
    await db.products.add({
      ...massa,
      id: 'pizza-integral',
      productCode: 'pizza-integral',
      name: 'Pizza integral',
      category: 'u',
      unit: 'UN',
      purchaseQuoteValue: null,
      recipe: [{ id: massa.productCode, quantity: 2 }],
    })
    renderProductsRoute('/produtos?view=table')

    const row = (await screen.findByRole('link', { name: 'Pizza integral' })).closest('tr')!
    expect(row.querySelector('[data-column="purchase-cost"]')).toHaveTextContent(/R\$\s*9,00/)
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

  it('copia a tabela visível para uma planilha e oferece impressão do catálogo', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderProductsRoute('/produtos?view=table')

    await screen.findByRole('table', { name: 'Produtos cadastrados' })
    await user.click(screen.getByRole('button', { name: 'Copiar para planilha' }))

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Produto\tCódigo\tCategoria\tUnidade\tReceita\tCusto de compra\tValor de venda'))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Massa integral\tmassa-integral\tSemi-acabado\tKG\tMaterial terminal\tR$'))
    expect(await screen.findByRole('status')).toHaveTextContent('Produtos copiados para colar na planilha.')

    await user.click(screen.getByRole('button', { name: 'Imprimir catálogo' }))
    expect(print).toHaveBeenCalledTimes(1)
    print.mockRestore()
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
    expect(screen.getByRole('button', { name: 'Abrir ajuda desta tela' })).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-detail-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-detail-info"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-detail-actions"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-detail-recipe"]')).toBeInTheDocument()
    const warning = screen.getByRole('heading', { name: 'Remover Produto' }).closest('section')

    expect(warning).not.toBeNull()
    expect(within(warning!).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(within(warning!).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' }).closest('.danger-zone')).toBeNull()
    expect(screen.getByRole('button', { name: 'Excluir' }).closest('.danger-zone')).toBeNull()
  })

  it('formata o peso da ficha no padrão brasileiro', async () => {
    await db.products.put({ ...massa, weight: 1000.5 })
    renderProductsRoute('/produtos/massa-integral')

    expect(await screen.findByText('1.000,5 kg por unidade')).toBeInTheDocument()
  })

  it('apresenta o tour e os alvos na edição de um Produto', async () => {
    renderProductsRoute('/produtos/massa-integral/editar')

    expect(await screen.findByRole('heading', { name: 'Editar Massa integral' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir ajuda desta tela' })).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-edit-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-code"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-fields"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-recipe"]')).toBeInTheDocument()
    expect(document.querySelector('[data-guide="product-save"]')).toBeInTheDocument()
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
    ])
    expect(within(table).getByRole('link', { name: 'Farinha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exibir custo' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'KG' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Árvore completa' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Exibir custo' }))
    expect(within(table).getByRole('columnheader', { name: 'Custo' })).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*4,00/)).toHaveLength(3)

    const massQuantityInKg = screen.getByRole('spinbutton', { name: 'Quantidade simulada de Massa integral' })
    await user.click(screen.getByRole('button', { name: 'G' }))
    expect(massQuantityInKg).toHaveValue('2.000,0')
    await user.click(screen.getByRole('button', { name: 'KG' }))
    expect(massQuantityInKg).toHaveValue('2')

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

    expect(massQuantity).toHaveValue('3.123456')
    await user.click(screen.getByRole('button', { name: 'Árvore completa' }))
    await waitFor(() => expect(massQuantity).toHaveValue('3,12346'))
    expect(screen.getByRole('spinbutton', { name: 'Quantidade simulada de Pizza de muçarela' })).toHaveValue('1,56173')
    expect(screen.getAllByText(/R\$\s*6,25/)).toHaveLength(3)
    await waitFor(() => {
      const printLink = screen.getByRole('link', { name: 'Imprimir receita' }) as HTMLAnchorElement
      const search = new URL(printLink.href).searchParams
      expect(search.get('multiplier')).toBe('1.56173')
      expect(search.get('cost')).toBe('true')
      expect(search.get('unit')).toBe('kg')
      expect(search.get('tree')).toBe('full')
    })
    expect((await db.products.get('pizza-de-mucarela'))?.recipe).toEqual([{ id: massa.productCode, quantity: 2 }])
  })

  it('arredonda para uma casa decimal o input de uma árvore exibida em gramas', async () => {
    const user = userEvent.setup()
    await db.products.bulkAdd([
      { ...massa, id: 'massa-de-pizza', productCode: 'massa-de-pizza', name: 'Massa de pizza' },
      {
        ...massa,
        id: 'pizza-de-mucarela',
        productCode: 'pizza-de-mucarela',
        name: 'Pizza de muçarela',
        category: 'u',
        unit: 'UN',
        recipe: [{ id: 'massa-de-pizza', quantity: 0.508 }],
      },
    ])
    renderProductsRoute('/produtos/pizza-de-mucarela?multiplier=3.93701&unit=g')

    await screen.findByRole('table', { name: 'Árvore calculada da Receita' })
    const massInput = document.querySelector<HTMLInputElement>('#tree-quantity-pizza-de-mucarela-massa-de-pizza')
    if (!massInput) throw new Error('Input da massa não foi renderizado')
    expect(massInput).toHaveValue('2.000,0')
    expect(massInput).toHaveAttribute('aria-valuetext', '2.000,0 G')
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-pressed', 'true')

    await user.clear(massInput)
    await user.type(massInput, '2000,00108')
    expect(massInput).toHaveValue('2000,00108')
    await user.click(screen.getByRole('button', { name: 'Árvore completa' }))
    await waitFor(() => expect(massInput).toHaveValue('2.000,0'))
  })

  it('copia a árvore completa com cabeçalho tabular e confirma o resultado', async () => {
    const user = userEvent.setup()
    await db.products.put({ ...massa, recipe: [{ id: 'farinha', quantity: 0.5 }], purchaseQuoteValue: null })
    await db.products.add({ ...massa, id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', purchaseQuoteValue: 4 })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderProductsRoute('/produtos/massa-integral')

    await screen.findByRole('table', { name: 'Árvore calculada da Receita' })
    await user.click(screen.getByRole('button', { name: 'Copiar para planilha' }))

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Produto\tCódigo\tQuantidade\tUnidade'))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Farinha\tfarinha\t0,5\tKG'))
    expect(await screen.findByRole('status')).toHaveTextContent('Receita copiada para colar na planilha.')
  })

  it('prepara a rota de impressão com o multiplicador recebido pela URL', async () => {
    await db.products.put({ ...massa, recipe: [{ id: 'farinha', quantity: 0.5 }], purchaseQuoteValue: null })
    await db.products.add({ ...massa, id: 'farinha', productCode: 'farinha', name: 'Farinha', category: 'm', unit: 'KG', purchaseQuoteValue: 4 })
    renderProductsRoute('/produtos/massa-integral/imprimir?multiplier=2')

    const table = await screen.findByRole('table', { name: 'Receita de Massa integral' })
    expect(screen.getByRole('heading', { name: 'Massa integral' })).toBeInTheDocument()
    expect(screen.queryByText('massa-integral')).not.toBeInTheDocument()
    expect(screen.queryByText('farinha')).not.toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: /Farinha/ })).toHaveTextContent('Farinha')
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toContain('1')
    expect(screen.getByText(/multiplicador 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exibir custo' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'KG' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Árvore completa' })).toHaveAttribute('aria-pressed', 'true')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Exibir custo' }))
    expect(within(table).getByRole('columnheader', { name: 'Custo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'G' }))
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByRole('cell', { name: '1.000,0' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Uma camada' }))
    expect(screen.getByRole('button', { name: 'Uma camada' })).toHaveAttribute('aria-pressed', 'true')
  })
})
