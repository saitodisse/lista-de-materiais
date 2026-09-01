import { useEffect, useState } from 'react'
import { ArrowDown, BookOpen, CheckCircle2, ExternalLink, PlayCircle, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '../components/Page'
import { formatQuantity } from '../components/format'
import level1Image from '../assets/guide-level-1-materia-prima.png'
import level2Image from '../assets/guide-level-2-semiacabado.png'
import level3Image from '../assets/guide-level-3-produto-unitario.png'
import level4Image from '../assets/guide-level-4-produto-final.png'
import { MaterialsTree } from '../features/bom/MaterialsTree'
import { DemoResetButton } from '../features/demo/DemoResetButton'
import { DEMO_LIST_ID } from '../features/demo/demoData'
import { guideTrees } from '../features/guide/guideData'
import { startGuideTour, stopGuideTour, type GuideTourTopic } from '../features/guide/tours'

const guideNewTabProps = { target: '_blank', rel: 'noopener noreferrer', title: 'Abre em nova aba' } as const
const guideIndexItems = [
  { id: 'entenda', step: '01', title: 'Carregue o exemplo', example: '14 Produtos + 1 plano' },
  { id: 'cadastre', step: '02', title: 'Nível 1: Matéria-prima', example: 'Farinha de trigo' },
  { id: 'massa', step: '03', title: 'Nível 2: Semiacabado', example: 'Massa e molho de tomate' },
  { id: 'pizza', step: '04', title: 'Nível 3: Produto Unitário', example: 'Pizza de muçarela' },
  { id: 'pacote', step: '05', title: 'Nível 4: Produto Final', example: 'Pacote com 3 pizzas' },
  { id: 'monte-lista', step: '06', title: 'Árvore de materiais', example: 'Plano de 1 pacote' },
  { id: 'copias', step: '07', title: 'Proteja seus dados', example: 'Exportar e importar JSON' },
] as const
const productPropertyItems = [
  { title: 'Código', description: 'É a identidade permanente do Produto. O aplicativo normaliza o texto em minúsculas e hífens, e o código não muda depois que o cadastro é salvo.', example: 'Para uma Pizza de muçarela, o código seria “pizza-de-mucarela”. Observe que ele não contém espaços, acentos ou letras maiúsculas.' },
  { title: 'Nome', description: 'É o nome legível que aparece no catálogo, nos seletores, nas Receitas e nas Listas.', example: 'Pizza de muçarela' },
  { title: 'Categoria', description: 'Indica o papel do Produto na estrutura: matéria-prima, semiacabado, unidade pronta, Produto Final, embalagem ou outro item.', example: 'Produto Unitário' },
  { title: 'Unidade', description: 'Define como as quantidades serão informadas e calculadas. Use a medida real do Produto, como KG, L, UN, BX ou PC.', example: 'UN' },
  { title: 'Peso por unidade', description: 'Campo opcional em quilogramas. Use quando uma unidade, caixa ou pacote tiver peso conhecido.', example: '1,035 kg' },
  { title: 'Custo de compra', description: 'Valor opcional usado nos materiais comprados. Nas construções, o aplicativo calcula o custo a partir dos itens terminais conhecidos.', example: 'R$ 5,80 por KG de farinha' },
  { title: 'Valor de venda', description: 'Valor opcional usado para calcular a soma dos Produtos diretamente incluídos em uma Lista.', example: 'R$ 28,00' },
  { title: 'Observações', description: 'Espaço livre para registrar uma informação curta que ajude quem consulta a ficha.', example: 'Pizza individual pronta para assar.' },
  { title: 'Modo de preparo', description: 'Guarda as etapas de preparo, montagem ou uso. As quebras de linha são preservadas para facilitar a leitura.', example: 'Da mistura da massa ao tempo de forno.' },
  { title: 'Receita', description: 'Lista Produtos existentes e suas quantidades. Sem Receita, o item é terminal; com Receita, vira uma construção. Repetições, autorreferência e ciclos são bloqueados.', example: 'Massa + molho + muçarela + tomate + orégano' },
] as const
const materialComparisonGroups = [
  {
    id: 'terminal',
    count: '03',
    eyebrow: 'sem Receita',
    title: 'Três terminam aqui',
    description: 'O cálculo chega a estes Produtos e para: não há outros itens cadastrados dentro deles.',
    products: [
      { name: 'Farinha de trigo', code: 'farinha-de-trigo', detail: 'Matéria-prima · KG', recipe: 'Receita: nenhuma', explanation: 'A farinha de trigo é matéria-prima porque não possui Receita: ela não pode ser decomposta em outros Produtos da base.' },
      { name: 'Muçarela', code: 'mucarela', detail: 'Matéria-prima · KG', recipe: 'Receita: nenhuma', explanation: 'A muçarela também entra pronta na montagem e não contém outro Produto cadastrado dentro dela.' },
      { name: 'Tomate', code: 'tomate', detail: 'Matéria-prima · KG', recipe: 'Receita: nenhuma', explanation: 'O tomate é usado diretamente e sua composição não precisa ser calculada.' },
    ],
  },
  {
    id: 'composed',
    count: '02',
    eyebrow: 'com Receita',
    title: 'Dois podem ser decompostos',
    description: 'O cálculo abre a Receita destes Produtos e continua até encontrar cada matéria-prima.',
    products: [
      { name: 'Massa de pizza', code: 'massa-de-pizza', detail: 'Semiacabado · KG', recipe: 'Receita: 6 ingredientes', explanation: 'Já a massa de pizza não é matéria-prima: é um semiacabado formado por seis ingredientes.' },
      { name: 'Molho de tomate', code: 'molho-de-tomate', detail: 'Semiacabado · KG', recipe: 'Receita: 4 ingredientes', explanation: 'O molho de tomate também é semiacabado: sua Receita o decompõe em quatro ingredientes.' },
    ],
  },
] as const
const otherDemoMaterials = [
  ['Água morna', 'agua-morna'],
  ['Fermento biológico seco', 'fermento-biologico-seco'],
  ['Açúcar', 'acucar'],
  ['Sal', 'sal'],
  ['Azeite', 'azeite'],
  ['Orégano', 'oregano'],
] as const

function NewTabIndicator({ size = 14 }: { size?: number }) {
  return <><ExternalLink className="guide-new-tab-icon" size={size} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></>
}

function TourButton({ topic, children }: { topic: GuideTourTopic; children: string }) {
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const start = async () => {
    setStarting(true)
    setMessage(null)
    try {
      const tour = await startGuideTour(topic)
      if (!tour) setMessage('Este tour precisa ser aberto na seção correspondente.')
    } catch {
      setMessage('Não foi possível carregar o tour agora.')
    } finally {
      setStarting(false)
    }
  }

  return <span className="guide-tour-action"><button type="button" className="button secondary" onClick={() => void start()} disabled={starting}><PlayCircle size={17} /> {starting ? 'Abrindo tour…' : children}</button>{message && <small role="status">{message}</small>}</span>
}

function GuideTree({ title, description, node, guide, label }: { title: string; description: string; node: Parameters<typeof MaterialsTree>[0]['node']; guide?: string; label: string }) {
  return <article className="guide-tree-card" data-guide={guide}>
    <div><p className="eyebrow">árvore calculada</p><h3>{title}</h3><p>{description}</p></div>
    <MaterialsTree node={node} label={label} />
  </article>
}

export function GuidePage() {
  const [demoReady, setDemoReady] = useState(false)
  const [activeGuideSection, setActiveGuideSection] = useState<string>('entenda')
  useEffect(() => () => stopGuideTour(), [])
  useEffect(() => {
    const syncSectionWithHash = () => {
      const sectionId = window.location.hash.slice(1)
      if (guideIndexItems.some((item) => item.id === sectionId)) setActiveGuideSection(sectionId)
    }
    syncSectionWithHash()
    window.addEventListener('hashchange', syncSectionWithHash)
    return () => window.removeEventListener('hashchange', syncSectionWithHash)
  }, [])

  return (
    <div className="page guide-page">
      <PageHeader eyebrow="guia prático" title="Como usar" description="Aprenda com uma pizzaria: da farinha ao plano completo." />

      <section className="guide-intro" data-guide="guide-overview">
        <div className="guide-intro-mark"><BookOpen size={28} /></div>
        <div>
          <p className="eyebrow">da matéria-prima ao plano</p>
          <h2>Da farinha ao pacote</h2>
          <p>A farinha é um Produto. A massa também. Alguns entram prontos; outros ganham uma Receita e passam a fazer parte de algo maior.</p>
        </div>
        <div className="guide-local-note"><ShieldCheck size={18} /><span>Tudo fica salvo apenas neste navegador.</span></div>
      </section>

      <nav className="guide-index" aria-label="Índice do guia">
        <div className="guide-index-heading">
          <strong>Mapa do tutorial</strong>
          <p>Escolha uma etapa para continuar nesta página.</p>
        </div>
        <ol className="guide-index-list">
          {guideIndexItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} aria-current={activeGuideSection === item.id ? 'location' : undefined} onClick={() => setActiveGuideSection(item.id)}>
                <span className="guide-index-step">{item.step}</span>
                <strong className="guide-index-title">{item.title}</strong>
                <span className="guide-index-example"><span>Exemplo</span><strong>{item.example}</strong></span>
                <ArrowDown size={17} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="entenda" className="guide-section guide-demo-hero" data-guide="tour-product-why">
        <div className="guide-demo-hero-copy">
          <span className="guide-step">01</span>
          <p className="eyebrow">comece com dados prontos</p>
          <h2>Comece com a pizzaria pronta</h2>
          <p>Carregue 14 Produtos e um plano completo para explorar cada nível do tutorial com os mesmos dados exibidos na tela.</p>
        </div>
        <div className="guide-demo-action">
          <span className="guide-demo-action-label">Comece por aqui</span>
          <DemoResetButton className="button primary guide-demo-hero-button" label="Limpar e carregar o exemplo de pizzas" onComplete={() => setDemoReady(true)} />
          <small><ShieldCheck size={17} aria-hidden="true" /><span>Nada será substituído sem sua confirmação. O próximo passo exige que você marque um checkbox.</span></small>
          {demoReady && <p className="guide-demo-success" role="status"><CheckCircle2 size={17} /> Demonstração carregada. Os links abaixo agora abrem os registros salvos.</p>}
        </div>
      </section>

      <section id="cadastre" className="guide-section" data-guide="guide-materials">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">02</span><div><p className="eyebrow">nível 1 · os blocos básicos</p><h2>Matéria-prima: o ponto de partida</h2><p>É o que entra na operação sem ser produzido por outra Receita. Farinha, muçarela e tomate encerram a árvore: quando o cálculo chega neles, sabe que encontrou algo para comprar ou separar.</p></div><img className="guide-level-image" src={level1Image} alt="Saco de farinha, gota de água, muçarela e caixa de pizza como blocos básicos" /></div>
        <div className="guide-product-comparison" aria-label="Comparação entre matérias-primas e produtos com Receita">
          <div className="guide-comparison-intro">
            <p className="eyebrow">a diferença na prática</p>
            <h3>Olhe primeiro para a Receita</h3>
            <p>Ela mostra se o Produto termina aqui ou se pode ser aberto em outros ingredientes.</p>
          </div>
          {materialComparisonGroups.map((group) => (
            <section className="guide-product-group" data-kind={group.id} aria-labelledby={`guide-product-group-${group.id}`} key={group.id}>
              <div className="guide-product-group-heading">
                <strong>{group.count}</strong>
                <div>
                  <p className="eyebrow">{group.eyebrow}</p>
                  <h3 id={`guide-product-group-${group.id}`}>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
              </div>
              <div className="guide-product-examples">
                {group.products.map((product) => (
                  <Link to="/produtos/$productCode" params={{ productCode: product.code }} {...guideNewTabProps} className="guide-product-example" key={product.code}>
                    <div className="guide-product-example-meta"><span>{product.detail}</span><code>{product.code}</code></div>
                    <h4>{product.name}</h4>
                    <p>{product.explanation}</p>
                    <div className="guide-product-example-footer"><strong>{product.recipe}</strong><span>Abrir Produto <NewTabIndicator /></span></div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          <div className="guide-other-materials">
            <div>
              <p className="eyebrow">a base completa</p>
              <h3>Outras seis matérias-primas</h3>
              <p>Elas também não possuem Receita e encerram o cálculo.</p>
            </div>
            <ul>
              {otherDemoMaterials.map(([name, code]) => (
                <li key={code}><Link to="/produtos/$productCode" params={{ productCode: code }} {...guideNewTabProps}>{name} <NewTabIndicator size={12} /></Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="guide-fields" data-guide="tour-product-fields">
          <h3>O que você encontrará nos registros</h3>
          <p className="guide-fields-intro">Cada propriedade responde a uma pergunta diferente sobre o Produto.</p>
          <div className="guide-property-list">
            {productPropertyItems.map((property, index) => (
              <article className="guide-property-card" key={property.title}>
                <span className="guide-property-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{property.title}</h4>
                  <p>{property.description}</p>
                  <span className="guide-property-example"><span>Exemplo</span><strong>{property.example}</strong></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="massa" className="guide-section" data-guide="tour-product-recipe">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">03</span><div><p className="eyebrow">nível 2 · a primeira transformação</p><h2>Semiacabado: massa e molho</h2><p>É um preparo intermediário que organiza uma transformação reaproveitável. Massa e molho têm Receitas próprias, mas ainda não representam a unidade vendida ao cliente; por isso, podem ser usados por uma ou muitas pizzas.</p></div><img className="guide-level-image" src={level2Image} alt="Tigela transformando farinha e água em uma massa de pizza sorridente" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy">
            <ol className="guide-list">
              <li>Abra <Link to="/produtos/$productCode" params={{ productCode: 'massa-de-pizza' }} {...guideNewTabProps}>Massa de pizza <NewTabIndicator size={12} /></Link>. Ela combina farinha, água, fermento, açúcar, sal e azeite.</li>
              <li>Abra o <Link to="/produtos/$productCode" params={{ productCode: 'molho-de-tomate' }} {...guideNewTabProps}>Molho de tomate <NewTabIndicator size={12} /></Link>. Ele combina tomate, azeite, sal e orégano.</li>
              <li>Os dois estão cadastrados como <strong>Semi-acabado</strong> em <strong>KG</strong>.</li>
            </ol>
          </div>
          <GuideTree title="Massa de pizza" description="Veja os ingredientes que formam a massa." node={guideTrees.massa} guide="tour-tree-example" label="Árvore didática da massa de pizza" />
        </div>
      </section>

      <section id="pizza" className="guide-section" data-guide="tour-tree-meaning">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">04</span><div><p className="eyebrow">nível 3 · a unidade pronta</p><h2>Produto Unitário: pizza de muçarela</h2><p>Representa uma unidade pronta e mensurável. A pizza reúne matérias-primas e semiacabados em uma Receita; pode ser vendida sozinha ou virar componente de outro Produto.</p></div><img className="guide-level-image" src={level3Image} alt="Pizza de muçarela sorridente usando uma coroa como a estrela do show" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>A pizza usa <strong>0,508 KG de massa</strong>, <strong>0,125 KG de molho</strong>, <strong>0,3 KG de muçarela</strong>, tomate e orégano. Como possui Receita, ela também pode entrar no pacote final.</p><Link to="/produtos/$productCode" params={{ productCode: 'pizza-de-mucarela' }} {...guideNewTabProps} className="button secondary">Abrir a Pizza de muçarela <NewTabIndicator size={17} /></Link></div>
          <GuideTree title="Pizza de muçarela" description="A pizza reúne semiacabados e matérias-primas." node={guideTrees.pizza} label="Árvore didática da pizza de muçarela" />
        </div>
      </section>

      <section id="pacote" className="guide-section" data-guide="tour-tree-list">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">05</span><div><p className="eyebrow">nível 4 · o pacote completo</p><h2>Produto Final: três pizzas e uma caixa</h2><p>Representa a entrega completa que você deseja calcular. O pacote combina unidades prontas e embalagem; quando entra na Lista, sua Receita revela todos os níveis anteriores.</p></div><img className="guide-level-image" src={level4Image} alt="Caixa de pizza sorridente carregando três pizzas como um pacote completo" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>O pacote usa <strong>3 Pizzas de muçarela</strong> e <strong>1 <Link to="/produtos/$productCode" params={{ productCode: 'caixa-para-3-pizzas' }} {...guideNewTabProps}>Caixa para 3 pizzas <NewTabIndicator size={12} /></Link></strong>. A caixa também é um Produto da base.</p><Link to="/produtos/$productCode" params={{ productCode: 'pacote-3-pizzas-mucarela' }} {...guideNewTabProps} className="button secondary">Abrir o Produto Final <NewTabIndicator size={17} /></Link></div>
          <GuideTree title="Pacote com 3 pizzas de muçarela" description="O pacote reúne as pizzas e a embalagem." node={guideTrees.pacote} label="Árvore do pacote com 3 pizzas de muçarela" />
        </div>
        <div className="guide-tour-row"><TourButton topic="arvore">Iniciar tour de leitura da árvore</TourButton><span>Use teclado, “Próximo”, “Anterior” ou Escape para sair.</span></div>
      </section>

      <section id="monte-lista" className="guide-section" data-guide="tour-list-why">
        <div className="guide-section-heading"><span className="guide-step">06</span><div><p className="eyebrow">o resultado · árvore de materiais</p><h2>A Lista mostra o que separar</h2><p>O plano de exemplo calcula 1 pacote com 3 pizzas.</p></div></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>Abra o plano <Link to="/listas/$listId" params={{ listId: DEMO_LIST_ID }} {...guideNewTabProps}>Pacote com 3 pizzas de muçarela <NewTabIndicator size={12} /></Link>. Ele já contém 1 Produto Final.</p><p>O aplicativo percorre pacote → pizzas → massa e molho → matérias-primas e consolida os itens iguais.</p><Link to="/listas/$listId" params={{ listId: DEMO_LIST_ID }} {...guideNewTabProps} className="button primary">Abrir o plano de exemplo <NewTabIndicator size={17} /></Link></div>
          <GuideTree title="Plano de 1 pacote" description="A árvore abre todas as Receitas do pacote." node={guideTrees.lista.trees[0]!.root} label="Árvore do plano de um pacote" />
        </div>
        <div className="guide-fields guide-list-result" data-guide="tour-list-fields">
          <h3>Materiais para separar</h3>
          <div className="guide-material-summary"><strong>{guideTrees.lista.materials.length} materiais</strong><span>itens terminais consolidados</span></div>
          <ul className="guide-material-list">{guideTrees.lista.materials.map((material) => <li key={material.productCode}><span>{material.name}</span><strong>{formatQuantity(material.quantity)} {material.unit}</strong></li>)}</ul>
        </div>
        <div className="guide-tour-row" data-guide="tour-list-action"><TourButton topic="lista">Iniciar tour de criação de Lista</TourButton><span>O tour explica nome, Produtos, quantidades e o resultado.</span></div>
      </section>

      <section id="copias" className="guide-section" data-guide="guide-json">
        <div className="guide-section-heading"><span className="guide-step">07</span><div><p className="eyebrow">proteja seus dados</p><h2>Guarde uma cópia em JSON</h2><p>Sem conta ou servidor, a cópia é manual.</p></div></div>
        <div className="guide-json-grid">
          <article className="guide-json-card" data-guide="tour-json-export"><span className="guide-step">01</span><h3>Exportar</h3><p>Em <Link to="/configuracoes" {...guideNewTabProps}>Configurações <NewTabIndicator size={12} /></Link>, escolha <strong>Exportar JSON</strong> e guarde o arquivo. Faça isso antes de limpar ou importar dados.</p></article>
          <article className="guide-json-card" data-guide="tour-json-import"><span className="guide-step">02</span><h3>Importar</h3><p>Escolha <strong>Importar JSON</strong>, selecione o arquivo e confirme a substituição da base local.</p></article>
        </div>
        <div className="guide-offline-note"><strong>Offline com um cuidado importante:</strong> depois do primeiro acesso conectado, o PWA pode abrir offline. Ainda assim, limpar o navegador ou perder o aparelho pode apagar a única cópia.</div>
        <div className="guide-tour-row"><TourButton topic="json">Iniciar tour de exportação e importação JSON</TourButton><span>O tour reforça cópia, confirmação e substituição local.</span></div>
      </section>

      <section className="guide-finish" data-guide="guide-finish"><h2>Agora explore o exemplo</h2><p>Abra a massa ou o plano completo. Os links mantêm este tutorial aberto.</p><div className="guide-finish-actions"><Link to="/produtos/$productCode" params={{ productCode: 'massa-de-pizza' }} {...guideNewTabProps} className="button primary">Começar pela Massa de pizza <NewTabIndicator size={17} /></Link><Link to="/listas/$listId" params={{ listId: DEMO_LIST_ID }} {...guideNewTabProps} className="button secondary">Abrir o plano de exemplo <NewTabIndicator size={17} /></Link></div></section>
    </div>
  )
}
