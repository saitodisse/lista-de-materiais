import { LegalPage, LegalSection } from './LegalPage'

export function TermsOfServicePage() {
  return (
    <LegalPage
      title="Termos de Serviço"
      description="Regras simples para usar o Lista de Materiais e a sincronização opcional com o Google Drive."
    >
      <LegalSection title="1. Aceitação e escopo">
        <p>Ao acessar ou usar o Lista de Materiais, você concorda com estes Termos de Serviço e com a <a href="/politica-de-privacidade">Política de Privacidade</a>. Se não concordar, não use o aplicativo.</p>
        <p>O aplicativo oferece cadastro local de Produtos, Receitas e Listas de Materiais, exportação e importação JSON e uma integração manual opcional com o Google Drive.</p>
      </LegalSection>

      <LegalSection title="2. Uso dos dados e das credenciais">
        <p>Você é responsável pelos dados que cadastra, exporta, importa ou envia ao Google Drive. Confirme o conteúdo antes de substituir os dados locais ou o arquivo remoto e mantenha cópias de segurança quando necessário.</p>
        <p>Você também é responsável pela conta Google usada, pelas permissões do arquivo e por escolher com quem compartilhar o link. Não coloque informações que você não tenha autorização para armazenar ou compartilhar.</p>
      </LegalSection>

      <LegalSection title="3. Sincronização manual">
        <p>A integração não sincroniza automaticamente. Criar, enviar, receber, vincular e desconectar são ações separadas e dependem de uma autorização válida, da conexão com a internet e da disponibilidade do Google Drive.</p>
        <p>Quem tiver permissão de edição no arquivo pode substituir a cópia completa. Alterações simultâneas podem fazer com que a última gravação prevaleça; a consulta prévia reduz esse risco, mas não cria bloqueio de edição.</p>
      </LegalSection>

      <LegalSection title="4. Uso permitido">
        <p>Use o aplicativo de forma lícita, respeitando os direitos de outras pessoas, as regras da sua organização e os termos do Google. Não tente burlar permissões, explorar falhas, sobrecarregar o serviço ou usar a integração para conteúdo ilegal.</p>
      </LegalSection>

      <LegalSection title="5. Disponibilidade e responsabilidade">
        <p>O aplicativo é fornecido para organização manual de dados e pode mudar, ficar indisponível ou deixar de oferecer uma integração quando dependências externas forem alteradas. O Google Drive possui disponibilidade, limites, permissões e políticas próprios.</p>
        <p>Faça exportações antes de operações importantes. Você permanece responsável por manter cópias adequadas e por conferir o resultado de cada envio ou recebimento.</p>
      </LegalSection>

      <LegalSection title="6. Alterações e contato">
        <p>Estes termos podem ser atualizados para refletir mudanças no aplicativo. A data no início da página identifica a versão publicada. Para dúvidas sobre o projeto, use o <a href="https://github.com/saitodisse/lista-de-materiais" target="_blank" rel="noopener noreferrer">repositório público no GitHub</a>.</p>
      </LegalSection>
    </LegalPage>
  )
}
