import { cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabaseForTest } from '../db/database'
import { guideProducts, guideTrees } from '../features/guide/guideData'
import { GuidePage } from './GuidePage'

function renderGuidePage() {
  const rootRoute = createRootRoute({ component: Outlet })
  const guideRoute = createRoute({ getParentRoute: () => rootRoute, path: '/como-usar', component: GuidePage })
  const productRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/novo', component: () => null })
  const listRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas/nova', component: () => null })
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/configuracoes', component: () => null })
  const router = createRouter({ routeTree: rootRoute.addChildren([guideRoute, productRoute, listRoute, settingsRoute]), history: createMemoryHistory({ initialEntries: ['/como-usar'] }) })
  return render(<RouterProvider router={router} />)
}

describe('guia Como usar', () => {
  beforeEach(async () => {
    await resetDatabaseForTest()
  })

  afterEach(() => cleanup())

  it('mostra o caminho pedagógico na ordem por quê, o quê e como', async () => {
    renderGuidePage()

    expect(await screen.findByRole('heading', { name: 'Como usar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '1. Tudo é um Produto' })).toHaveAttribute('href', '#entenda')
    expect(screen.getByRole('link', { name: '2. Nível 1: Matéria-prima' })).toHaveAttribute('href', '#cadastre')
    expect(screen.getByRole('link', { name: '3. Nível 2: Semiacabado' })).toHaveAttribute('href', '#massa')
    expect(screen.getByRole('link', { name: '4. Nível 3: Produto Unitário' })).toHaveAttribute('href', '#pizza')
    expect(screen.getByRole('link', { name: '5. Nível 4: Produto Final' })).toHaveAttribute('href', '#pacote')
    expect(screen.getByRole('link', { name: '6. Árvore de materiais' })).toHaveAttribute('href', '#monte-lista')
    expect(screen.getByRole('link', { name: '7. Proteja seus dados' })).toHaveAttribute('href', '#copias')

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings.indexOf('Tudo é um Produto: a jornada dos blocos de montar')).toBeLessThan(headings.indexOf('Matéria-prima: as peças soltas'))
    expect(headings.indexOf('Matéria-prima: as peças soltas')).toBeLessThan(headings.indexOf('Semiacabado: transforme os blocos básicos'))
    expect(headings.indexOf('Semiacabado: transforme os blocos básicos')).toBeLessThan(headings.indexOf('Produto Unitário: a Pizza de muçarela'))
    expect(headings.indexOf('Produto Unitário: a Pizza de muçarela')).toBeLessThan(headings.indexOf('Produto Final: junte unidades e embalagem'))
    expect(headings.indexOf('Produto Final: junte unidades e embalagem')).toBeLessThan(headings.indexOf('Desça a árvore até os blocos básicos'))
    expect(screen.getByText(/Para o sistema, tudo é um Produto: da farinha ao pacote completo/)).toBeInTheDocument()
    expect(screen.getByText(/A sacada é que uma Receita pode conter outras Receitas dentro dela/)).toBeInTheDocument()
    const fields = screen.getByRole('heading', { name: 'Como cadastrar cada bloco básico' }).closest<HTMLElement>('.guide-fields')!
    expect(within(fields).getByText('pizza-de-mucarela')).toBeInTheDocument()
    expect(within(fields).getByText('Produto Unitário')).toBeInTheDocument()
    expect(within(fields).getByText('R$ 4,80')).toBeInTheDocument()
    expect(within(fields).getByText('R$ 35,00')).toBeInTheDocument()
    expect(screen.getByAltText(/blocos básicos/)).toBeInTheDocument()
    expect(screen.getByAltText(/massa de pizza sorridente/)).toBeInTheDocument()
    expect(screen.getByAltText(/estrela do show/)).toBeInTheDocument()
    expect(screen.getByAltText(/pacote completo/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Criar uma Lista' })[0]).toHaveAttribute('href', '/listas/nova')
  })

  it('renderiza as árvores e os materiais do cálculo oficial sem usar o banco', async () => {
    renderGuidePage()

    expect(await screen.findByRole('heading', { name: 'Massa de pizza' })).toBeInTheDocument()
    expect(screen.getAllByText(/Farinha: 0,6 KG/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Água: 0,4 L/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Pizza de muçarela: 1 UN/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Caixa: 1 BX/)).not.toHaveLength(0)
    expect(screen.getByText(/Pacote com 3 pizzas: 10 PC/)).toBeInTheDocument()
    expect(screen.getAllByText('Muçarela')).not.toHaveLength(0)
    expect(screen.getAllByText('Caixa')).not.toHaveLength(0)
    expect(screen.getByText(`${guideTrees.lista.materials.length} materiais`)).toBeInTheDocument()
    expect(guideProducts).toHaveLength(7)
    expect(guideTrees.lista.materials.length).toBeGreaterThan(0)
    expect(await db.products.count()).toBe(0)
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
  })

  it('oferece as quatro ações de tour e não cria dados ao abrir o guia', async () => {
    renderGuidePage()

    const tourNames = [
      'Iniciar tour de cadastro de Produto',
      'Iniciar tour de leitura da árvore',
      'Iniciar tour de criação de Lista',
      'Iniciar tour de exportação e importação JSON',
    ]
    for (const name of tourNames) expect(await screen.findByRole('button', { name: name })).toBeInTheDocument()
    expect(await db.products.count()).toBe(0)
  })
})
