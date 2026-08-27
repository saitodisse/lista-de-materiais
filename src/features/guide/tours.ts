import type { DriveStep, Driver } from 'driver.js'

export type GuideTourTopic = 'produto' | 'arvore' | 'lista' | 'json'
export type ScreenGuideTopic = 'catalogo-tabela' | 'detalhe-produto' | 'edicao-produto'
export type TourTopic = GuideTourTopic | ScreenGuideTopic

export const guideTourSteps: Record<TourTopic, DriveStep[]> = {
  produto: [
    { element: '[data-guide="tour-product-why"]', popover: { title: '1. Comece pela identidade', description: 'Todo Produto tem um código permanente e um nome fácil de reconhecer.', side: 'bottom' } },
    { element: '[data-guide="tour-product-fields"]', popover: { title: '2. Preencha o básico', description: 'Escolha categoria e unidade. Peso, custo, venda, observações e preparo são opcionais.', side: 'bottom' } },
    { element: '[data-guide="tour-product-recipe"]', popover: { title: '3. Monte a Receita', description: 'Selecione Produtos já cadastrados e informe uma quantidade positiva para cada componente.', side: 'top' } },
    { element: '[data-guide="tour-product-action"]', popover: { title: '4. Salve quando terminar', description: 'Salvar grava somente o que você preencheu no catálogo deste aparelho.', side: 'top' } },
  ],
  arvore: [
    { element: '[data-guide="tour-tree-meaning"]', popover: { title: 'Leia de cima para baixo', description: 'A raiz é o que você pediu. Os ramos mostram os componentes da Receita.', side: 'bottom' } },
    { element: '[data-guide="tour-tree-example"]', popover: { title: 'Abra os ramos', description: 'Materiais terminais, como farinha e água, aparecem nas folhas. Nada é salvo ao consultar.', side: 'top' } },
    { element: '[data-guide="tour-tree-list"]', popover: { title: 'A Lista consolida', description: 'Ao pedir dez pacotes, a mesma árvore é calculada e os materiais terminais são somados.', side: 'top' } },
  ],
  lista: [
    { element: '[data-guide="tour-list-why"]', popover: { title: '1. Diga o que deseja', description: 'Uma Lista representa quantidades desejadas, como dez pacotes para uma venda ou para um dia.', side: 'bottom' } },
    { element: '[data-guide="tour-list-fields"]', popover: { title: '2. Escolha Produtos', description: 'Cada Produto aparece uma vez. Informe uma quantidade maior que zero.', side: 'bottom' } },
    { element: '[data-guide="tour-list-action"]', popover: { title: '3. Calcule a BOM', description: 'Depois de salvar, a tela mostra a árvore e os materiais terminais consolidados.', side: 'top' } },
  ],
  json: [
    { element: '[data-guide="tour-json-export"]', popover: { title: 'Faça uma cópia', description: 'Em Configurações, use Exportar JSON e guarde o arquivo em um lugar seguro.', side: 'bottom' } },
    { element: '[data-guide="tour-json-import"]', popover: { title: 'Importe com cuidado', description: 'Importar valida o arquivo e pede confirmação. A substituição troca Produtos, Receitas, Listas e entradas deste aparelho.', side: 'bottom' } },
  ],
  'catalogo-tabela': [
    { element: '[data-guide="catalog-table-header"]', popover: { title: 'Seu catálogo local', description: 'Aqui você consulta os Produtos cadastrados neste aparelho e pode abrir uma nova ficha.', side: 'bottom' } },
    { element: '[data-guide="catalog-table-toolbar"]', popover: { title: 'Escolha como consultar', description: 'Veja quantos Produtos estão no catálogo e alterne entre a tabela e os cartões quando quiser.', side: 'bottom' } },
    { element: '[data-guide="catalog-table-filters"]', popover: { title: 'Encontre um Produto', description: 'Busque pelo nome ou código e refine o catálogo pelas categorias.', side: 'bottom' } },
    { element: '[data-guide="catalog-table"]', popover: { title: 'Leia a tabela', description: 'Cada linha mostra a categoria, a unidade, a Receita e os valores conhecidos. Clique no nome para abrir a ficha.', side: 'top' } },
  ],
  'detalhe-produto': [
    { element: '[data-guide="product-detail-header"]', popover: { title: 'Identidade do Produto', description: 'O cabeçalho mostra o nome, a categoria, a unidade e o caminho de volta ao catálogo.', side: 'bottom' } },
    { element: '[data-guide="product-detail-info"]', popover: { title: 'Consulte a ficha', description: 'Aqui ficam o código permanente, medidas, valores e as observações salvas.', side: 'bottom' } },
    { element: '[data-guide="product-detail-actions"]', popover: { title: 'Edite quando precisar', description: 'Use Editar para corrigir a ficha. A exclusão fica separada e respeita as dependências do Produto.', side: 'top' } },
    { element: '[data-guide="product-detail-recipe"]', popover: { title: 'Entenda a composição', description: 'A Receita mostra os Produtos consumidos e a árvore revela como os componentes se expandem.', side: 'top' } },
  ],
  'edicao-produto': [
    { element: '[data-guide="product-edit-header"]', popover: { title: 'Você está editando', description: 'Esta tela altera a ficha local do Produto. O código continua sendo a identidade permanente.', side: 'bottom' } },
    { element: '[data-guide="product-code"]', popover: { title: 'Confira a identidade', description: 'O código é normalizado em minúsculas com hífens e não pode mudar depois da criação.', side: 'bottom' } },
    { element: '[data-guide="product-fields"]', popover: { title: 'Preencha medidas e valores', description: 'Peso, custo, venda, observações e preparo são opcionais e devem refletir este Produto.', side: 'top' } },
    { element: '[data-guide="product-recipe"]', popover: { title: 'Monte a Receita', description: 'Escolha Produtos existentes e informe uma quantidade positiva para cada componente.', side: 'top' } },
    { element: '[data-guide="product-save"]', popover: { title: 'Salve a ficha', description: 'Quando terminar, Salvar Produto valida a Receita e grava as alterações neste aparelho.', side: 'top' } },
  ],
}

const screenGuideSeenKey = 'lista-de-materiais:guide-seen:'

let activeDriver: Driver | null = null
let tourRequest = 0

export function hasSeenScreenGuide(topic: ScreenGuideTopic): boolean {
  try { return window.localStorage.getItem(`${screenGuideSeenKey}${topic}`) === 'seen' }
  catch { return false }
}

export function markScreenGuideSeen(topic: ScreenGuideTopic): void {
  try { window.localStorage.setItem(`${screenGuideSeenKey}${topic}`, 'seen') }
  catch { /* localStorage pode estar indisponível no navegador. */ }
}

export async function startGuideTour(topic: TourTopic): Promise<Driver | null> {
  stopGuideTour()
  const request = ++tourRequest
  const steps = guideTourSteps[topic].filter((step) => {
    if (!step.element || typeof step.element !== 'string') return true
    return document.querySelector(step.element) !== null
  })
  if (steps.length === 0) return null

  const [{ driver }] = await Promise.all([
    import('driver.js'),
    import('driver.js/dist/driver.css'),
  ])
  if (request !== tourRequest) return null
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  activeDriver = driver({
    steps,
    animate: !reducedMotion,
    smoothScroll: !reducedMotion,
    allowClose: true,
    allowKeyboardControl: true,
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    overlayClickBehavior: 'close',
    popoverClass: 'guide-driver-popover',
    onPopoverRender: (popover) => {
      popover.closeButton.setAttribute('aria-label', 'Fechar tour')
      popover.closeButton.title = 'Fechar tour'
    },
    onDestroyed: () => { activeDriver = null },
  })
  activeDriver.drive()
  return activeDriver
}

export function stopGuideTour(): void {
  tourRequest += 1
  if (activeDriver) {
    activeDriver.destroy()
    activeDriver = null
  }
}
