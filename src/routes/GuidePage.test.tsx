import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabaseForTest } from '../db/database'
import { guideProducts, guideTrees } from '../features/guide/guideData'
import { DEMO_LIST_ID, DEMO_PRODUCT_CODES } from '../features/demo/demoData'
import { GuidePage } from './GuidePage'

function renderGuidePage() {
  const rootRoute = createRootRoute({ component: Outlet })
  const guideRoute = createRoute({ getParentRoute: () => rootRoute, path: '/como-usar', component: GuidePage })
  const productRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/novo', component: () => null })
  const productDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/produtos/$productCode', component: () => null })
  const listRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas/nova', component: () => null })
  const listDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/listas/$listId', component: () => null })
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/configuracoes', component: () => null })
  const router = createRouter({ routeTree: rootRoute.addChildren([guideRoute, productRoute, productDetailRoute, listRoute, listDetailRoute, settingsRoute]), history: createMemoryHistory({ initialEntries: ['/como-usar'] }) })
  return render(<RouterProvider router={router} />)
}

describe('guia Como usar', () => {
  beforeEach(async () => {
    window.history.replaceState(null, '', '/como-usar')
    await resetDatabaseForTest()
  })

  afterEach(() => cleanup())

  it('mostra o caminho pedagógico na ordem por quê, o quê e como', async () => {
    const user = userEvent.setup()
    renderGuidePage()

    expect(await screen.findByRole('heading', { name: 'Como usar' })).toBeInTheDocument()
    const index = screen.getByRole('navigation', { name: 'Índice do guia' })
    expect(within(index).getByText('Mapa do tutorial')).toBeInTheDocument()
    const expectedIndexItems = [
      ['#entenda', 'Carregue o exemplo', '14 Produtos + 1 plano'],
      ['#cadastre', 'Nível 1: Matéria-prima', 'Farinha de trigo'],
      ['#massa', 'Nível 2: Semiacabado', 'Massa e molho de tomate'],
      ['#pizza', 'Nível 3: Produto Unitário', 'Pizza de muçarela'],
      ['#pacote', 'Nível 4: Produto Final', 'Pacote com 3 pizzas'],
      ['#monte-lista', 'Árvore de materiais', 'Plano de 1 pacote'],
      ['#copias', 'Proteja seus dados', 'Exportar e importar JSON'],
    ]
    const indexLinks = within(index).getAllByRole('link')
    expect(indexLinks).toHaveLength(expectedIndexItems.length)
    for (const [href, title, example] of expectedIndexItems) {
      const link = indexLinks.find((candidate) => candidate.getAttribute('href') === href)!
      expect(link).toHaveTextContent(title)
      expect(link).toHaveTextContent(example)
      expect(link).not.toHaveAttribute('target')
    }
    expect(indexLinks[0]).toHaveAttribute('aria-current', 'location')
    const massaIndexLink = indexLinks.find((link) => link.getAttribute('href') === '#massa')!
    await user.click(massaIndexLink)
    expect(massaIndexLink).toHaveAttribute('aria-current', 'location')
    expect(indexLinks[0]).not.toHaveAttribute('aria-current')

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings.indexOf('Comece com a pizzaria pronta')).toBeLessThan(headings.indexOf('Matéria-prima: o ponto de partida'))
    expect(headings.indexOf('Matéria-prima: o ponto de partida')).toBeLessThan(headings.indexOf('Semiacabado: massa e molho'))
    expect(headings.indexOf('Semiacabado: massa e molho')).toBeLessThan(headings.indexOf('Produto Unitário: pizza de muçarela'))
    expect(headings.indexOf('Produto Unitário: pizza de muçarela')).toBeLessThan(headings.indexOf('Produto Final: três pizzas e uma caixa'))
    expect(headings.indexOf('Produto Final: três pizzas e uma caixa')).toBeLessThan(headings.indexOf('A Lista mostra o que separar'))
    expect(screen.getByText(/A farinha é um Produto\. A massa também\./)).toBeInTheDocument()
    expect(screen.getByText(/Como possui Receita, ela também pode entrar no pacote final/)).toBeInTheDocument()
    const demoHero = document.querySelector<HTMLElement>('#entenda')!
    expect(demoHero).toHaveClass('guide-demo-hero')
    expect(within(demoHero).getByText(/14 Produtos e um plano completo/)).toBeInTheDocument()
    expect(within(demoHero).getAllByRole('button')).toHaveLength(1)
    expect(within(demoHero).queryByRole('complementary')).not.toBeInTheDocument()
    expect(within(demoHero).getByText('Comece por aqui')).toBeInTheDocument()
    expect(within(demoHero).getByText(/Nada será substituído sem sua confirmação/)).toBeInTheDocument()
    expect(within(demoHero).getByRole('button', { name: 'Limpar e carregar o exemplo de pizzas' })).toHaveClass('guide-demo-hero-button')
    const materialSection = document.querySelector<HTMLElement>('#cadastre')!
    expect(within(materialSection).getByRole('heading', { name: 'Três terminam aqui' })).toBeInTheDocument()
    expect(within(materialSection).getByRole('heading', { name: 'Dois podem ser decompostos' })).toBeInTheDocument()
    expect(within(materialSection).getByText(/A farinha de trigo é matéria-prima porque não possui Receita: ela não pode ser decomposta/)).toBeInTheDocument()
    expect(within(materialSection).getByText(/A muçarela também entra pronta na montagem e não contém outro Produto cadastrado dentro dela/)).toBeInTheDocument()
    expect(within(materialSection).getByText(/O tomate é usado diretamente e sua composição não precisa ser calculada/)).toBeInTheDocument()
    expect(within(materialSection).getByText(/Já a massa de pizza não é matéria-prima: é um semiacabado formado por seis ingredientes/)).toBeInTheDocument()
    expect(within(materialSection).getByText(/O molho de tomate também é semiacabado: sua Receita o decompõe em quatro ingredientes/)).toBeInTheDocument()
    expect(within(materialSection).getByRole('heading', { name: 'Outras seis matérias-primas' })).toBeInTheDocument()
    const fields = screen.getByRole('heading', { name: 'O que você encontrará nos registros' }).closest<HTMLElement>('.guide-fields')!
    const propertyNames = ['Código', 'Nome', 'Categoria', 'Unidade', 'Peso por unidade', 'Custo de compra', 'Valor de venda', 'Observações', 'Modo de preparo', 'Receita']
    for (const propertyName of propertyNames) {
      expect(within(fields).getByRole('heading', { level: 4, name: propertyName })).toBeInTheDocument()
    }
    const codeExample = within(fields).getByText(/Para uma Pizza de muçarela, o código seria “pizza-de-mucarela”/)
    expect(codeExample).toHaveTextContent('não contém espaços, acentos ou letras maiúsculas')
    expect(within(fields).getByText('Produto Unitário')).toBeInTheDocument()
    expect(within(fields).getByText('1,035 kg')).toBeInTheDocument()
    expect(within(fields).getByText('R$ 28,00')).toBeInTheDocument()
    expect(screen.getByText(/quando o cálculo chega neles, sabe que encontrou algo para comprar ou separar/)).toBeInTheDocument()
    expect(screen.getByText(/podem ser usados por uma ou muitas pizzas/)).toBeInTheDocument()
    expect(screen.getByText(/pode ser vendida sozinha ou virar componente de outro Produto/)).toBeInTheDocument()
    expect(screen.getByText(/sua Receita revela todos os níveis anteriores/)).toBeInTheDocument()
    expect(screen.getByAltText(/blocos básicos/)).toBeInTheDocument()
    expect(screen.getByAltText(/massa de pizza sorridente/)).toBeInTheDocument()
    expect(screen.getByAltText(/estrela do show/)).toBeInTheDocument()
    expect(screen.getByAltText(/pacote completo/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar e carregar o exemplo de pizzas' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar tour de cadastro de Produto' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Abrir o plano de exemplo/ })[0]).toHaveAttribute('href', `/listas/${DEMO_LIST_ID}`)

    const linksOutsideGuide = screen.getAllByRole('link').filter((link) => /^\/(produtos|listas|configuracoes)/.test(link.getAttribute('href') ?? ''))
    expect(linksOutsideGuide.length).toBeGreaterThan(0)
    for (const link of linksOutsideGuide) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAccessibleName(/abre em nova aba/)
    }
  })

  it('renderiza as árvores e os materiais do cálculo oficial sem usar o banco', async () => {
    renderGuidePage()

    expect(await screen.findByRole('heading', { level: 3, name: 'Massa de pizza' })).toBeInTheDocument()
    expect(screen.getAllByText(/Farinha de trigo: 0,472 KG/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Água morna: 0,393 L/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Pizza de muçarela: 3 UN/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Caixa para 3 pizzas: 1 BX/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Pacote com 3 pizzas de muçarela: 1 PC/)).not.toHaveLength(0)
    expect(screen.getAllByText('Muçarela')).not.toHaveLength(0)
    expect(screen.getAllByText('Caixa para 3 pizzas')).not.toHaveLength(0)
    expect(screen.getByText(`${guideTrees.lista.materials.length} materiais`)).toBeInTheDocument()
    expect(guideProducts).toHaveLength(14)
    expect(guideTrees.lista.materials.length).toBeGreaterThan(0)
    expect(await db.products.count()).toBe(0)
    expect(await db.materialLists.count()).toBe(0)
    expect(await db.materialListEntries.count()).toBe(0)
  })

  it('oferece as quatro ações de tour e não cria dados ao abrir o guia', async () => {
    renderGuidePage()

    const tourNames = [
      'Iniciar tour de leitura da árvore',
      'Iniciar tour de criação de Lista',
      'Iniciar tour de exportação e importação JSON',
    ]
    for (const name of tourNames) expect(await screen.findByRole('button', { name: name })).toBeInTheDocument()
    expect(await db.products.count()).toBe(0)
  })

  it('exige o checkbox antes de substituir a base e carrega os 14 Produtos ligados pelo guia', async () => {
    const user = userEvent.setup()
    await db.products.add({ ...guideProducts[0]!, id: 'produto-local', productCode: 'produto-local', name: 'Produto local' })
    renderGuidePage()

    await user.click(await screen.findByRole('button', { name: 'Limpar e carregar o exemplo de pizzas' }))

    const dialog = screen.getByRole('dialog', { name: 'Substituir todos os dados deste aparelho?' })
    const replaceButton = within(dialog).getByRole('button', { name: 'Limpar e carregar demonstração' })
    expect(replaceButton).toBeDisabled()
    await user.click(within(dialog).getByRole('checkbox', { name: /Entendo que meus dados atuais serão apagados/ }))
    expect(replaceButton).toBeEnabled()
    await user.click(replaceButton)

    await waitFor(async () => expect(await db.products.count()).toBe(DEMO_PRODUCT_CODES.length))
    expect(await db.products.get('produto-local')).toBeUndefined()
    expect(await db.materialLists.get(DEMO_LIST_ID)).toBeDefined()
    for (const productCode of DEMO_PRODUCT_CODES) {
      expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === `/produtos/${productCode}`)).toBe(true)
    }
    expect(await screen.findByText(/Demonstração carregada/)).toBeInTheDocument()
  })
})
