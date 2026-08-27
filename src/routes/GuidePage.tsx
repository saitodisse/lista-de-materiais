import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, PlayCircle, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '../components/Page'
import { formatQuantity } from '../components/format'
import level1Image from '../assets/guide-level-1-materia-prima.png'
import level2Image from '../assets/guide-level-2-semiacabado.png'
import level3Image from '../assets/guide-level-3-produto-unitario.png'
import level4Image from '../assets/guide-level-4-produto-final.png'
import { MaterialsTree } from '../features/bom/MaterialsTree'
import { guideTrees } from '../features/guide/guideData'
import { startGuideTour, stopGuideTour, type GuideTourTopic } from '../features/guide/tours'

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
  useEffect(() => () => stopGuideTour(), [])

  return (
    <div className="page guide-page">
      <PageHeader eyebrow="guia prático" title="Como usar" description="Entenda como os Produtos evoluem dos blocos básicos até uma Lista de Materiais, usando uma pizzaria como exemplo." />

      <section className="guide-intro" data-guide="guide-overview">
        <div className="guide-intro-mark"><BookOpen size={28} /></div>
        <div>
          <p className="eyebrow">blocos básicos → construções → árvore de materiais</p>
          <h2>Tudo é um Produto</h2>
          <p>Para o sistema, tudo é um Produto: da farinha ao pacote completo que chega ao cliente. A diferença está em como cada um se comporta — alguns são blocos básicos, enquanto outros são construções feitas a partir deles.</p>
        </div>
        <div className="guide-local-note"><ShieldCheck size={18} /><span>A aplicação é local-first: os dados ficam no IndexedDB deste navegador.</span></div>
      </section>

      <nav className="guide-index" aria-label="Índice do guia">
        <a href="#entenda">1. Tudo é um Produto</a>
        <a href="#cadastre">2. Nível 1: Matéria-prima</a>
        <a href="#massa">3. Nível 2: Semiacabado</a>
        <a href="#pizza">4. Nível 3: Produto Unitário</a>
        <a href="#pacote">5. Nível 4: Produto Final</a>
        <a href="#monte-lista">6. Árvore de materiais</a>
        <a href="#copias">7. Proteja seus dados</a>
      </nav>

      <section id="entenda" className="guide-section" data-guide="tour-product-why">
        <div className="guide-section-heading"><span className="guide-step">01</span><div><p className="eyebrow">a ideia central</p><h2>Tudo é um Produto: a jornada dos blocos de montar</h2><p>Vamos acompanhar essa evolução passo a passo usando uma pizzaria como exemplo.</p></div></div>
        <div className="guide-two-column">
          <div className="guide-copy">
            <p>Na nossa cadeia, a <strong>massa</strong> usa farinha e água. A <strong>pizza unitária</strong> usa massa e muçarela. O <strong>pacote final</strong> usa três pizzas e uma caixa.</p>
            <p>Alguns Produtos simplesmente existem no estoque. Outros são montados a partir de uma Receita e podem conter outras Receitas dentro deles.</p>
            <p>Uma Lista não agenda produção, cria lote ou acompanha status. Ela apenas registra o que você deseja calcular naquele momento.</p>
            <Link to="/produtos/novo" className="button primary">Abrir cadastro de Produto <ArrowRight size={17} /></Link>
          </div>
          <div className="guide-concept-card"><span className="guide-concept-arrow">→</span><strong>Bloco básico</strong><span>Produto sem Receita</span><span className="guide-concept-arrow">→</span><strong>Construção</strong><span>Produto com Receita</span></div>
        </div>
      </section>

      <section id="cadastre" className="guide-section" data-guide="guide-materials">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">02</span><div><p className="eyebrow">nível 1 · os blocos básicos</p><h2>Matéria-prima: as peças soltas</h2><p>Você compra, guarda e usa esses Produtos. Eles não possuem uma Receita, pois não são fabricados no sistema.</p></div><img className="guide-level-image" src={level1Image} alt="Saco de farinha, gota de água, muçarela e caixa de pizza como blocos básicos" /></div>
        <div className="guide-example-grid">
          {[
            ['Farinha', 'Matéria-prima · KG', 'farinha'],
            ['Água', 'Matéria-prima · L', 'agua'],
            ['Muçarela', 'Matéria-prima · KG', 'mucarela'],
            ['Caixa', 'Embalagem · BX', 'caixa'],
          ].map(([name, detail, code]) => <article className="guide-example-card" key={code}><span className="guide-example-number">{code}</span><h3>{name}</h3><p>{detail}</p></article>)}
        </div>
        <div className="guide-fields" data-guide="tour-product-fields">
          <h3>Como cadastrar cada bloco básico</h3>
          <dl>
            <div><dt>Código</dt><dd>É a identidade permanente. Por exemplo, o nome “Pizza de muçarela” gera <code>pizza-de-mucarela</code>: o código fica em minúsculas, usa hífens e não muda depois de salvar.</dd></div>
            <div><dt>Nome</dt><dd>É o texto que você reconhece no catálogo e nos seletores. Um exemplo claro é <strong>Pizza de muçarela</strong>, em vez de um nome genérico como “Produto 1”.</dd></div>
            <div><dt>Categoria e unidade</dt><dd>Para a pizza pronta, escolha <strong>Produto Unitário</strong> e <strong>UN</strong>. Para um bloco básico, como farinha, use <strong>Matéria-prima</strong> e <strong>KG</strong>.</dd></div>
            <div><dt>Campos opcionais</dt><dd>Um preenchimento possível para a pizza é: peso <strong>1 kg</strong>, custo de compra <strong>R$ 4,80</strong>, valor de venda <strong>R$ 35,00</strong>, observações “Assar até a borda dourar” e preparo “Abrir a massa, espalhar o molho e adicionar a muçarela”.</dd></div>
          </dl>
        </div>
      </section>

      <section id="massa" className="guide-section" data-guide="tour-product-recipe">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">03</span><div><p className="eyebrow">nível 2 · a primeira transformação</p><h2>Semiacabado: transforme os blocos básicos</h2><p>A “Massa de pizza” é um Produto intermediário: algo novo, mas que ainda não está pronto para ir ao cliente.</p></div><img className="guide-level-image" src={level2Image} alt="Tigela transformando farinha e água em uma massa de pizza sorridente" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy">
            <ol className="guide-list">
              <li>Abra <Link to="/produtos/novo">Novo Produto</Link> e use o nome “Massa de pizza”. O código será <code>massa-de-pizza</code>.</li>
              <li>Escolha <strong>Semi-acabado</strong> e unidade <strong>KG</strong>.</li>
              <li>Em Receita, adicione <strong>0,6 KG de farinha</strong> e <strong>0,4 L de água</strong> para fazer 1 KG de massa.</li>
              <li>Salve. A massa agora é um Produto novo, e sua Receita puxa os blocos básicos sem alterar nenhum outro cadastro.</li>
            </ol>
          </div>
          <GuideTree title="Massa de pizza" description="A primeira transformação usa os blocos básicos para criar um Produto intermediário." node={guideTrees.massa} guide="tour-tree-example" label="Árvore didática da massa de pizza" />
        </div>
        <div className="guide-tour-row" data-guide="tour-product-action"><TourButton topic="produto">Iniciar tour de cadastro de Produto</TourButton><span>O tour destaca identidade, campos, Receita e salvamento.</span></div>
      </section>

      <section id="pizza" className="guide-section" data-guide="tour-tree-meaning">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">04</span><div><p className="eyebrow">nível 3 · a estrela do show</p><h2>Produto Unitário: a Pizza de muçarela</h2><p>Agora damos forma ao que realmente importa: uma unidade pronta para ser vendida ou usada em outra Receita.</p></div><img className="guide-level-image" src={level3Image} alt="Pizza de muçarela sorridente usando uma coroa como a estrela do show" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>Cadastre “Pizza de muçarela” como <strong>Produto Unitário</strong>. Ela consome <strong>1 KG de massa</strong>, que é o Produto semiacabado, e <strong>0,3 KG de muçarela</strong>, que é um bloco básico.</p><p>A sacada é que uma Receita pode conter outras Receitas dentro dela. O próximo Produto pode pedir três pizzas sem repetir seus ingredientes.</p><Link to="/produtos/novo" className="button secondary">Cadastrar a pizza unitária <ArrowRight size={17} /></Link></div>
          <GuideTree title="Pizza de muçarela" description="A pizza combina um Produto semiacabado com uma matéria-prima." node={guideTrees.pizza} label="Árvore didática da pizza de muçarela" />
        </div>
      </section>

      <section id="pacote" className="guide-section" data-guide="tour-tree-list">
        <div className="guide-section-heading guide-section-heading--level"><span className="guide-step">05</span><div><p className="eyebrow">nível 4 · o pacote completo</p><h2>Produto Final: junte unidades e embalagem</h2><p>O Produto Final reúne os Produtos Unitários e as embalagens ou complementos que chegam ao mundo real.</p></div><img className="guide-level-image" src={level4Image} alt="Caixa de pizza sorridente carregando três pizzas como um pacote completo" /></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>Cadastre “Pacote com 3 pizzas” como <strong>Produto Final</strong>. Informe <strong>3</strong> para Pizza de muçarela e <strong>1</strong> para Caixa.</p><p>O pacote é a construção completa: três Produtos Unitários e uma embalagem, prontos para serem vendidos ou escolhidos numa Lista.</p><Link to="/produtos/novo" className="button secondary">Cadastrar o Produto Final <ArrowRight size={17} /></Link></div>
          <GuideTree title="Pacote com 3 pizzas" description="A Receita final reúne unidades produzidas e a embalagem." node={guideTrees.pacote} label="Árvore didática do pacote com 3 pizzas" />
        </div>
        <div className="guide-tour-row"><TourButton topic="arvore">Iniciar tour de leitura da árvore</TourButton><span>Use teclado, “Próximo”, “Anterior” ou Escape para sair.</span></div>
      </section>

      <section id="monte-lista" className="guide-section" data-guide="tour-list-why">
        <div className="guide-section-heading"><span className="guide-step">06</span><div><p className="eyebrow">o grande final · árvore de materiais</p><h2>Desça a árvore até os blocos básicos</h2><p>Quando você pede 10 pacotes com 3 pizzas, o aplicativo lê cada Receita e descobre tudo o que precisa ser separado no estoque.</p></div></div>
        <div className="guide-two-column guide-two-column--tree">
          <div className="guide-copy"><p>Abra <Link to="/listas/nova">Nova Lista</Link>, dê um nome como “Dez pacotes de hoje”, escolha <strong>Pacote com 3 pizzas</strong> e informe <strong>10</strong>.</p><p>O aplicativo trabalha como um detetive: pacote → pizzas → massa → farinha e água, além de muçarela e caixa. Ele desce todos os degraus da árvore e consolida apenas os materiais terminais iguais.</p><p>Você fica no controle, e o aplicativo faz a matemática chata.</p><Link to="/listas/nova" className="button primary">Criar uma Lista <ArrowRight size={17} /></Link></div>
          <GuideTree title="Lista de dez pacotes" description="A cadeia é multiplicada por 10 para entregar os blocos básicos que você precisa separar." node={guideTrees.lista.trees[0]!.root} label="Árvore didática de dez pacotes" />
        </div>
        <div className="guide-fields guide-list-result" data-guide="tour-list-fields">
          <h3>O resultado: só o que separar no estoque</h3>
          <div className="guide-material-summary"><strong>{guideTrees.lista.materials.length} materiais</strong><span>terminais são consolidados pelo cálculo oficial</span></div>
          <ul className="guide-material-list">{guideTrees.lista.materials.map((material) => <li key={material.productCode}><span>{material.name}</span><strong>{formatQuantity(material.quantity)} {material.unit}</strong></li>)}</ul>
        </div>
        <div className="guide-tour-row" data-guide="tour-list-action"><TourButton topic="lista">Iniciar tour de criação de Lista</TourButton><span>O tour explica nome, Produtos, quantidades e o resultado.</span></div>
      </section>

      <section id="copias" className="guide-section" data-guide="guide-json">
        <div className="guide-section-heading"><span className="guide-step">07</span><div><p className="eyebrow">proteja seus dados</p><h2>Use o JSON como cópia de segurança</h2><p>O aplicativo não tem conta, servidor ou sincronização. A cópia é manual.</p></div></div>
        <div className="guide-json-grid">
          <article className="guide-json-card" data-guide="tour-json-export"><span className="guide-step">01</span><h3>Exportar</h3><p>Vá em <Link to="/configuracoes">Configurações</Link> → <strong>Exportar JSON</strong>. Guarde o arquivo num local seguro e faça uma exportação antes de importar ou limpar dados importantes.</p></article>
          <article className="guide-json-card" data-guide="tour-json-import"><span className="guide-step">02</span><h3>Importar</h3><p>Em Configurações, clique em <strong>Importar JSON</strong> e selecione a cópia. A confirmação avisa que a importação substituirá Produtos, Receitas, Listas e entradas deste aparelho.</p></article>
        </div>
        <div className="guide-offline-note"><strong>Offline com um cuidado importante:</strong> depois do primeiro carregamento conectado, você pode instalar o PWA e abri-lo offline quando o service worker estiver ativo. Limpar os dados do navegador ou perder o aparelho pode apagar a única cópia local.</div>
        <div className="guide-tour-row"><TourButton topic="json">Iniciar tour de exportação e importação JSON</TourButton><span>O tour reforça cópia, confirmação e substituição local.</span></div>
      </section>

      <section className="guide-finish" data-guide="guide-finish"><h2>Pronto para experimentar?</h2><p>Faça os cadastros no seu ritmo. O guia não mistura os exemplos com os dados deste aparelho.</p><div className="guide-finish-actions"><Link to="/produtos/novo" className="button primary">Cadastrar um Produto <ArrowRight size={17} /></Link><Link to="/listas/nova" className="button secondary">Criar uma Lista <ArrowRight size={17} /></Link></div></section>
    </div>
  )
}
