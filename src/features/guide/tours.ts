import type { DriveStep, Driver } from 'driver.js'

export type GuideTourTopic = 'produto' | 'arvore' | 'lista' | 'json'
export type ScreenGuideTopic = 'catalogo-tabela' | 'detalhe-produto' | 'edicao-produto'
export type TourTopic = GuideTourTopic | ScreenGuideTopic

export const guideTourSteps: Record<TourTopic, DriveStep[]> = {
  produto: [
    { element: '[data-guide="tour-product-why"]', popover: { title: '1. Dê um nome e um código', description: 'Tudo começa pela identidade. O nome é como você chama o item no dia a dia, e o código é a sua "impressão digital" única no sistema.', side: 'bottom' } },
    { element: '[data-guide="tour-product-fields"]', popover: { title: '2. Defina os detalhes básicos', description: 'Ele é uma matéria-prima ou um produto final? É medido em Quilos ou Unidades? Preencha os obrigatórios e deixe os opcionais para quando precisar.', side: 'bottom' } },
    { element: '[data-guide="tour-product-recipe"]', popover: { title: '3. Adicione a Receita (Os ingredientes)', description: 'Se este produto for feito a partir de outros, é aqui que você os conecta. Escolha itens já cadastrados e diga a quantidade exata de cada um.', side: 'top' } },
    { element: '[data-guide="tour-product-action"]', popover: { title: '4. Guarde no seu aparelho', description: 'Pronto! Ao salvar, este produto passa a fazer parte do seu catálogo, ficando gravado com segurança na memória deste navegador.', side: 'top' } },
  ],
  arvore: [
    { element: '[data-guide="tour-tree-meaning"]', popover: { title: '1. O topo da árvore', description: 'A raiz fica no topo e representa o produto principal. A partir dela, a mágica da receita se desdobra de cima para baixo.', side: 'bottom' } },
    { element: '[data-guide="tour-tree-example"]', popover: { title: '2. Explore os ramos e folhas', description: 'Clique para expandir. Os ramos são os produtos intermediários, e as folhas nas pontas representam seus blocos básicos (matérias-primas).', side: 'top' } },
    { element: '[data-guide="tour-tree-list"]', popover: { title: '3. A matemática por trás', description: 'O sistema faz o trabalho duro. Se você pedir dez pacotes, ele calcula a árvore inteira e soma tudo para te dar os totais exatos.', side: 'top' } },
  ],
  lista: [
    { element: '[data-guide="tour-list-why"]', popover: { title: '1. Qual é o seu objetivo?', description: 'Uma Lista é como uma encomenda ou um planejamento. Dê um nome a ela, como "Produção de Sexta" ou "Pedido da Mesa 5".', side: 'bottom' } },
    { element: '[data-guide="tour-list-fields"]', popover: { title: '2. O que vamos fabricar?', description: 'Adicione os produtos finais que você deseja produzir e a quantidade exata que precisa de cada um.', side: 'bottom' } },
    { element: '[data-guide="tour-list-action"]', popover: { title: '3. O resultado mágico', description: 'Ao salvar, o aplicativo lê todas as receitas e gera uma lista de compras resumida só com os blocos básicos que você vai precisar separar.', side: 'top' } },
  ],
  json: [
    { element: '[data-guide="tour-json-export"]', popover: { title: '1. Exporte para proteger', description: 'Seus dados vivem apenas neste navegador. Baixe um arquivo JSON (sua cópia de segurança) e guarde em um lugar seguro no seu computador.', side: 'bottom' } },
    { element: '[data-guide="tour-json-import"]', popover: { title: '2. Importe com cuidado', description: 'Ao carregar um backup antigo, ele substituirá todo o seu catálogo atual. Use isso para recuperar dados ou para trocar de aparelho.', side: 'bottom' } },
  ],
  'catalogo-tabela': [
    { element: '[data-guide="catalog-table-header"]', popover: { title: 'O coração do sistema', description: 'Aqui ficam todos os blocos básicos, itens intermediários e produtos finais que você já criou. É o seu Catálogo Base.', side: 'bottom' } },
    { element: '[data-guide="catalog-table-toolbar"]', popover: { title: 'Escolha seu visual', description: 'Você pode acompanhar a quantidade de itens criados e alternar entre a visão de Tabela ou Cartões visuais a qualquer momento.', side: 'bottom' } },
    { element: '[data-guide="catalog-table-filters"]', popover: { title: 'Filtre e pesquise', description: 'Com muitos itens, a busca será sua melhor amiga. Encontre produtos rapidamente digitando o nome ou filtrando por categoria.', side: 'bottom' } },
    { element: '[data-guide="catalog-table"]', popover: { title: 'Visão geral rápida', description: 'Bata o olho para saber a unidade de medida e se o item tem uma receita. Clique no nome para explorar todos os detalhes!', side: 'top' } },
  ],
  'detalhe-produto': [
    { element: '[data-guide="product-detail-header"]', popover: { title: 'O Cartão de Visitas', description: 'O cabeçalho resume as informações principais para você se localizar: o que é este produto e como ele é medido.', side: 'bottom' } },
    { element: '[data-guide="product-detail-info"]', popover: { title: 'A Ficha Completa', description: 'É aqui que você consulta os detalhes mais específicos, como o código, valores, pesos e anotações especiais de preparo.', side: 'bottom' } },
    { element: '[data-guide="product-detail-actions"]', popover: { title: 'Controle total', description: 'Precisa corrigir algo? Vá em Editar. Para proteger seus dados, o sistema só deixa excluir um produto se ele não estiver preso em nenhuma receita.', side: 'top' } },
    { element: '[data-guide="product-detail-recipe"]', popover: { title: 'A anatomia do produto', description: 'Se for um item composto, esta seção mostra a receita e abre a árvore estrutural para você ver de onde vem cada ingrediente.', side: 'top' } },
  ],
  'edicao-produto': [
    { element: '[data-guide="product-edit-header"]', popover: { title: 'Modo de Edição', description: 'Aqui você pode ajustar as informações da ficha. Fique tranquilo, nada será modificado até você apertar o botão final.', side: 'bottom' } },
    { element: '[data-guide="product-code"]', popover: { title: 'O Código é imutável', description: 'Você pode mudar o nome e outros detalhes, mas o código é a identidade fixa do produto e permanece sempre o mesmo.', side: 'bottom' } },
    { element: '[data-guide="product-fields"]', popover: { title: 'Ajuste os detalhes', description: 'Atualize custos, preços ou modo de preparo conforme a realidade atual do seu estoque. Deixe em branco o que não usar.', side: 'top' } },
    { element: '[data-guide="product-recipe"]', popover: { title: 'Atualize a Receita', description: 'A receita mudou? Troque ingredientes ou ajuste as quantidades necessárias para produzir este item corretamente.', side: 'top' } },
    { element: '[data-guide="product-save"]', popover: { title: 'Confirme as mudanças', description: 'Clique em Salvar. O aplicativo vai checar se as matemáticas estão corretas e atualizar o seu catálogo na mesma hora.', side: 'top' } },
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
