import { ArrowRight, Cloud, Database, FileJson, ListTree, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '../components/Page'

const appFeatures = [
  {
    icon: Database,
    eyebrow: 'catálogo local',
    title: 'Produtos e Receitas',
    description: 'Cadastre Produtos, categorias, unidades, custos, pesos, observações e as Receitas que formam cada item.',
  },
  {
    icon: ListTree,
    eyebrow: 'cálculo de materiais',
    title: 'Listas e BOM',
    description: 'Monte Listas de Materiais e consulte a árvore que percorre Produtos finais, semiacabados e matérias-primas.',
  },
  {
    icon: FileJson,
    eyebrow: 'cópias manuais',
    title: 'JSON e Google Drive',
    description: 'Exporte uma cópia local ou autorize uma cópia JSON no Google Drive para enviar e receber dados manualmente.',
  },
] as const

export function AppHomepagePage() {
  return (
    <div className="page public-homepage">
      <PageHeader
        eyebrow="aplicativo público · lista de materiais"
        title="Organize Produtos, Receitas e Listas de Materiais."
        description="Um PWA local-first para montar catálogos e calcular materiais no próprio navegador, sem exigir uma conta para usar o aplicativo."
      />

      <section className="public-homepage-hero" aria-labelledby="public-homepage-hero-title">
        <div className="public-homepage-hero-copy">
          <span className="public-homepage-mark" aria-hidden="true"><span /><span /><span /></span>
          <p className="eyebrow">feito para trabalhar com clareza</p>
          <h2 id="public-homepage-hero-title">Seus dados começam neste aparelho.</h2>
          <p>O catálogo fica no IndexedDB deste navegador e continua disponível offline depois da primeira abertura. Produtos, Receitas, Listas e cálculos BOM não são enviados para um servidor próprio.</p>
          <div className="public-homepage-actions">
            <Link to="/" className="button primary">Abrir o aplicativo <ArrowRight size={17} /></Link>
            <Link to="/como-usar" className="button secondary">Ver como usar</Link>
          </div>
        </div>
        <aside className="public-homepage-hero-note" aria-label="Resumo de privacidade">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <strong>Local por padrão</strong>
            <p>A integração com o Google Drive é opcional e só começa depois de uma ação explícita sua.</p>
          </div>
        </aside>
      </section>

      <section className="public-homepage-section" aria-labelledby="public-homepage-features-title">
        <div className="public-homepage-section-heading">
          <p className="eyebrow">o que o aplicativo faz</p>
          <h2 id="public-homepage-features-title">Do cadastro ao material que precisa ser separado.</h2>
        </div>
        <div className="public-homepage-feature-grid">
          {appFeatures.map(({ icon: Icon, eyebrow, title, description }) => (
            <article className="public-homepage-feature" key={title}>
              <Icon size={23} aria-hidden="true" />
              <p className="eyebrow">{eyebrow}</p>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-homepage-drive" aria-labelledby="public-homepage-drive-title">
        <div>
          <p className="eyebrow">autorização opcional</p>
          <h2 id="public-homepage-drive-title">Como o Google Drive entra na experiência</h2>
          <p>Quando você escolhe conectar o Google, o aplicativo usa o Google Identity Services e a API do Drive para criar, consultar ou atualizar o arquivo JSON que você selecionar. A permissão é a do próprio arquivo e continua sob o controle do Google Drive.</p>
        </div>
        <ol className="public-homepage-drive-steps">
          <li><strong>Você autoriza a conta</strong><span>A conexão é iniciada por um botão em Configurações.</span></li>
          <li><strong>Você escolhe o arquivo ou cria uma cópia</strong><span>O conteúdo completo só é enviado ou recebido quando você confirma a ação.</span></li>
          <li><strong>O aplicativo não sincroniza sozinho</strong><span>Não há servidor próprio, sincronização automática ou acesso ao Drive sem uma ação sua.</span></li>
        </ol>
        <p className="public-homepage-drive-footnote"><Cloud size={17} aria-hidden="true" /> O token temporário fica somente na memória da sessão; o aplicativo não grava credenciais, segredos ou tokens no link, no JSON ou em um servidor próprio.</p>
      </section>

      <section className="public-homepage-legal" aria-labelledby="public-homepage-legal-title">
        <div>
          <p className="eyebrow">informações públicas</p>
          <h2 id="public-homepage-legal-title">Leia antes de autorizar</h2>
          <p>As páginas abaixo explicam os dados locais, a integração opcional com o Google Drive e as responsabilidades de quem compartilha um arquivo.</p>
        </div>
        <nav aria-label="Documentos públicos do aplicativo">
          <Link to="/politica-de-privacidade">Política de Privacidade <ArrowRight size={15} /></Link>
          <Link to="/termos-de-servico">Termos de Serviço <ArrowRight size={15} /></Link>
        </nav>
      </section>
    </div>
  )
}
