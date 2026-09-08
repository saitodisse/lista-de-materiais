# Lista de Materiais

PWA mobile-first para montar um catálogo de Produtos, suas Receitas e Listas de Materiais (BOM) sem sair do aparelho. Os dados são armazenados no IndexedDB do navegador; a sincronização opcional é manual e usa um arquivo autorizado do Google Drive.

Aplicativo publicado: [lista-de-materiais.com.br](https://lista-de-materiais.com.br).

Página pública para apresentar o aplicativo e configurar o OAuth: [Sobre o aplicativo](https://lista-de-materiais.com.br/sobre-o-aplicativo).

Documentos públicos: [Política de Privacidade](https://lista-de-materiais.com.br/politica-de-privacidade) · [Termos de Serviço](https://lista-de-materiais.com.br/termos-de-servico).

As rotas profundas usam o fallback SPA configurado em `vercel.json`, para que esses documentos e as demais telas continuem acessíveis diretamente no deployment.

## O que já entrega

- Cadastro, edição, consulta e exclusão protegida de Produtos.
- Código de Produto único, normalizado como slug e imutável depois de criado.
- Categorias consistentes: Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros, cada uma com uma cor e sigla.
- Receita com componentes existentes, distintos e positivos, bloqueando autorreferência e ciclos.
- Observações e modo de preparo por Produto, preservando as quebras de linha informadas.
- Catálogo em cartões ou tabela, com pesquisa por nome/código e filtros combináveis de categoria.
- Estado de pesquisa, filtros e visualização na URL; a preferência entre cartões e tabela também é preservada no armazenamento local.
- Listas de Materiais com seleção ordenada por categoria e nome em `pt-BR`.
- BOM aninhada, materiais terminais consolidados, árvore expansível, custos de compra e valores de venda quando houver dados suficientes.
- Demonstração opcional de um pacote com três pizzas de muçarela e um único controle confirmado para adicioná-la ou limpar todos os dados locais.
- Exportação e importação JSON local, com validação e confirmação antes de substituir o catálogo.
- Sincronização manual opcional com Google Drive: criar, vincular, enviar, receber e desvincular uma cópia JSON autorizada.
- Guia **Como usar** com cadeia didática de pizzas, árvores calculadas e tours interativos manuais.
- Uso offline após a primeira abertura online e ativação do service worker, inclusive ao atualizar uma rota com F5.
- Rodapé discreto em todas as rotas, com crédito para Julio Saito, portfólio e acesso ao repositório público.

## Limites intencionais

Este corte não inclui backend próprio, sincronização automática, mesclagem de registros, colaboração em tempo real, imagens, importação de planilhas, preço tabelado, ordem de produção, data, lote ou status. O Google Drive é uma cópia manual sujeita às permissões do arquivo.

## Executar localmente

Use uma versão recente do Node.js com Corepack e pnpm.

```sh
pnpm install
pnpm dev
```

O servidor de desenvolvimento usa `0.0.0.0:5177`, acessível em `http://localhost:5177`. A origem é propositalmente diferente do preview PWA: assim, um service worker do build não intercepta módulos do Vite.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

O preview de produção abre em `http://localhost:4173`.

## Usar o aplicativo

O guia completo fica em [Como usar](https://lista-de-materiais.com.br/como-usar) dentro do aplicativo. Ele não cria dados: os exemplos são calculados somente em memória e os cadastros são feitos manualmente nas telas reais.

1. Cadastre matérias-primas, embalagens ou Produtos sem Receita.
2. Cadastre semiacabados e Produtos finais, selecionando os componentes já existentes e suas quantidades.
3. Crie uma Lista de Materiais com os Produtos desejados.
4. Abra a Lista para consultar materiais terminais consolidados, custos, valor de venda e a árvore BOM.

Nos seletores, os Produtos aparecem na ordem: Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros. Em cada grupo, a ordenação usa português do Brasil para manter, por exemplo, “Água” perto de “Amaciante”.

Na ficha de Produto, a Receita é uma tabela com Tipo, Produto, Código e Quantidade. Em telas estreitas, ela rola horizontalmente para preservar o alinhamento das colunas.

## Dados locais e JSON

Na tela inicial:

- **Exportar JSON** baixa uma cópia de Produtos, Receitas, Listas e entradas.
- **Importar JSON** lê uma cópia desse formato, valida códigos, Receitas e referências e pede confirmação antes de substituir todos os dados locais em uma única transação.
- **Adicionar demonstração** inclui a receita de pizzas de muçarela. Quando a demonstração está presente, o botão passa a **Limpar tudo** e remove Produtos, Listas e entradas após confirmação.

### Compartilhar pelo Google Drive

Em Configurações, conecte a conta Google para criar um arquivo `lista-de-materiais.json`, encontrar um arquivo seu com esse nome ou colar o link/ID de um arquivo compartilhado. Links do Google Drive, IDs simples e links completos do aplicativo são aceitos. Vincular apenas consulta e valida a cópia remota. **Enviar dados** e **Receber dados** são ações separadas e pedem confirmação quando substituem conteúdo.

O proprietário configura no próprio Google Drive se o arquivo será compartilhado com pessoas específicas ou com qualquer pessoa que tenha o link. Quem tiver permissão de edição poderá substituir a cópia completa. O endereço do PWA identifica o arquivo, mas não concede acesso nem funciona como senha.

A integração usa `drive`, `openid` e `email`, Google Identity Services e a API do Google Drive. O escopo amplo permite consultar um arquivo compartilhado por link ou ID e localizar os arquivos próprios com o nome padrão; o proprietário ainda controla o compartilhamento no Drive. O token fica somente em memória e é solicitado com `include_granted_scopes: false`, sem incorporar permissões concedidas por autorizações anteriores. Depois de uma autorização explícita, o aplicativo guarda apenas uma preferência local e tenta renovar a sessão silenciosamente após F5; se a sessão não tiver o escopo necessário, uma nova autorização será solicitada. Para ativar a integração no build, configure somente `VITE_GOOGLE_CLIENT_ID` no ambiente Vite, habilite a Drive API no Google Cloud e registre a origem autorizada.

Uma conta que autorizou a versão anterior com `drive.file` precisará conceder o escopo `drive` quando a sessão for renovada. Alterar o Console não revoga autorizações antigas. Se você recebeu um link de outra pessoa, conecte a conta que tem acesso ao arquivo, cole o link completo (incluindo `resourcekey` quando existir) e vincule-o; o vínculo preserva a referência de sincronização. O aplicativo não solicita `userinfo.profile`, pois usa somente o e-mail para identificar a conta conectada.

O escopo `drive` é classificado pelo Google como restrito. A publicação desta alteração não equivale à aprovação do aplicativo: mantenha a declaração no Google Cloud, a Política de Privacidade e o processo de verificação alinhados antes de disponibilizar a integração amplamente. Consulte a [documentação de autorização da Drive API](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) para os requisitos atuais.

Para o consentimento OAuth, use `https://lista-de-materiais.com.br/sobre-o-aplicativo` como página inicial e `https://lista-de-materiais.com.br/politica-de-privacidade` como Política de Privacidade. A página identifica o aplicativo, explica Produtos, Receitas, Listas e a finalidade da autorização Google Drive sem exigir login. Verifique `lista-de-materiais.com.br` no Search Console com uma conta que seja Owner/Editor do projeto Google Cloud e cadastre o mesmo domínio no consentimento. O alias `listademateriais.vercel.app` permanece disponível para compatibilidade, mas não é a propriedade usada na verificação OAuth.

Depois de configurar o compartilhamento no Google Drive, clique em **Verificar alterações** e copie o link do aplicativo novamente. Se o Drive exigir uma chave de recurso, o link precisa carregar `resourcekey`; o aplicativo preserva essa chave quando ela é fornecida pelo Drive ou pelo link colado.

Quando duas cópias divergem, o aplicativo oferece receber do Drive, substituir o Drive ou cancelar. A atualização envia `If-Match` quando o Drive retorna uma ETag; uma resposta `412` exige nova consulta. Sem uma precondição aceita pelo serviço, dois envios simultâneos ainda podem se sobrescrever.

Mantenha uma exportação antes de usar importação, limpeza ou recebimento do Drive. Exportar, importar e limpar permanecem locais; o envio ao Drive só ocorre quando você escolhe explicitamente essa ação.

## Offline não é conectividade

Na primeira abertura do build publicado, é necessária conexão para baixar o aplicativo e ativar o service worker. Depois disso, o shell do PWA, as rotas, os dados do IndexedDB e os cálculos locais continuam disponíveis mesmo sem internet, inclusive após F5.

Isso não cria conexão real nem sincronização. O aviso “Dados neste aparelho” descreve onde o catálogo está salvo, e o indicador de conexão usa o estado real comunicado pelo navegador.

### Verificação manual do offline

1. Rode `pnpm build && pnpm preview`.
2. Abra `http://localhost:4173`, crie ou adicione a demonstração e entre em uma Lista de Materiais.
3. No DevTools, confirme que há um service worker controlador.
4. Pare o preview, atualize a mesma rota com F5 e confirme que a tela, os dados e o resultado BOM continuam visíveis.

## Estrutura e documentação

- [CONTEXT.md](./CONTEXT.md) contém o vocabulário canônico do domínio.
- [AGENTS.md](./AGENTS.md) descreve limites do produto, persistência, PWA e regras de desenvolvimento.
- `src/domain` mantém contratos e validações; `src/db` mantém Dexie e transações; `src/features` contém as telas de Produtos, Listas e resultado BOM.
- `src/service-worker.ts` define a estratégia Workbox usada pelo build PWA.

## Validação automatizada

Os testes cobrem slug e unicidade, Receitas inválidas e cíclicas, exclusão com dependências, persistência Dexie, demonstração, importação/exportação, filtros e visualização do catálogo, formulário de Lista, consolidação de BOM, árvore e telas de erro/vazio.
