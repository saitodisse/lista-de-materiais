import { LegalPage, LegalSection } from './LegalPage'

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Como o Lista de Materiais trata os dados locais e a integração opcional com o Google Drive."
    >
      <LegalSection title="1. Sobre o aplicativo">
        <p>O Lista de Materiais é um PWA local-first para cadastrar Produtos, Receitas e Listas de Materiais. O aplicativo não mantém uma conta própria, um servidor de catálogo ou uma sincronização automática.</p>
        <p>Esta política descreve o tratamento de dados na versão publicada em <a href="https://listademateriais.vercel.app">listademateriais.vercel.app</a>.</p>
      </LegalSection>

      <LegalSection title="2. Dados guardados neste aparelho">
        <p>Produtos, Receitas, Listas e suas entradas ficam no IndexedDB do navegador deste aparelho. Esses dados permanecem sob o controle do navegador e podem ser removidos quando você limpar os dados do site ou usar os controles de Configurações.</p>
        <p>A exportação JSON é iniciada por você e gera uma cópia local para download. A importação só substitui os dados depois da validação e de uma confirmação explícita.</p>
      </LegalSection>

      <LegalSection title="3. Google Drive opcional">
        <p>Você pode autorizar a integração com o Google para criar, consultar ou atualizar um arquivo JSON escolhido no seu Google Drive. O acesso acontece somente quando você inicia uma ação na interface e segue as permissões definidas no Google Drive.</p>
        <p>Para permitir que outra pessoa autorizada vincule um arquivo compartilhado apenas pelo ID, a integração solicita o escopo de gerenciamento do Google Drive. O aplicativo usa esse acesso somente para o arquivo e para as ações de sincronização que você inicia.</p>
        <p>O token temporário recebido do Google fica somente na memória da sessão do navegador. O aplicativo não grava o token, a chave secreta do cliente ou credenciais em IndexedDB, URL, exportação, logs ou servidor próprio.</p>
        <p>Quando você envia ou recebe dados, o conteúdo completo da cópia local pode ser transmitido ao arquivo do Drive selecionado. O Google trata a autenticação, a autorização e a retenção desse arquivo segundo as próprias políticas e configurações da sua conta.</p>
      </LegalSection>

      <LegalSection title="4. Compartilhamento e terceiros">
        <p>O arquivo do Drive pode ser compartilhado pelo proprietário com pessoas específicas ou por link. Qualquer pessoa que tenha a permissão concedida pode ler ou, se tiver permissão de editor, substituir o conteúdo desse arquivo.</p>
        <p>O aplicativo não vende dados, não usa o catálogo para publicidade e não compartilha dados com terceiros além das chamadas necessárias ao Google Identity Services e à API do Google Drive solicitadas por você.</p>
      </LegalSection>

      <LegalSection title="5. Controle e exclusão">
        <p>Você pode desconectar a sessão Google no aplicativo, revogar a autorização nas configurações da sua conta Google, apagar a cópia local nas configurações do navegador e excluir o arquivo remoto diretamente no Google Drive. Desconectar não apaga o arquivo do Drive nem o catálogo local.</p>
      </LegalSection>

      <LegalSection title="6. Alterações e contato">
        <p>Podemos atualizar esta política quando o aplicativo ou a integração mudar. A data acima identifica a versão publicada. Para dúvidas ou solicitações, use o <a href="https://github.com/saitodisse/lista-de-materiais" target="_blank" rel="noopener noreferrer">repositório público do projeto</a>.</p>
      </LegalSection>
    </LegalPage>
  )
}
