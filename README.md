# Lista de Materiais

PWA mobile-first para montar um catálogo de Produtos, suas Receitas e Listas de Materiais (BOM) sem sair do aparelho. Os dados são armazenados no IndexedDB do navegador; a sincronização opcional é manual e usa um arquivo autorizado do Google Drive.

Aplicativo publicado: [listademateriais.vercel.app](https://listademateriais.vercel.app).

Página pública para apresentar o aplicativo e configurar o OAuth: [Sobre o aplicativo](https://listademateriais.vercel.app/sobre-o-aplicativo).

Documentos públicos: [Política de Privacidade](https://listademateriais.vercel.app/politica-de-privacidade) · [Termos de Serviço](https://listademateriais.vercel.app/termos-de-servico).

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

O guia completo fica em [Como usar](https://listademateriais.vercel.app/como-usar) dentro do aplicativo. Ele não cria dados: os exemplos são calculados somente em memória e os cadastros são feitos manualmente nas telas reais.

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

Em Configurações, conecte a conta Google para criar um arquivo `lista-de-materiais.json` ou colar o link/ID de um arquivo compartilhado. Vincular apenas consulta e valida a cópia remota. **Enviar dados** e **Receber dados** são ações separadas e pedem confirmação quando substituem conteúdo.

O proprietário configura no próprio Google Drive se o arquivo será compartilhado com pessoas específicas ou com qualquer pessoa que tenha o link. Quem tiver permissão de edição poderá substituir a cópia completa. O endereço do PWA identifica o arquivo, mas não concede acesso nem funciona como senha.

A integração usa o escopo `drive`, Google Identity Services e Google Picker. O escopo amplo é necessário para que outra pessoa autorizada consiga vincular um arquivo compartilhado apenas pelo ID do Drive. O token fica somente em memória; depois de uma autorização explícita, o aplicativo guarda apenas uma preferência local e tenta renovar a sessão silenciosamente após F5. Para ativar a integração no build, configure `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY` e `VITE_GOOGLE_APP_ID` no ambiente Vite, habilite Drive API/Picker API no Google Cloud e registre as origens autorizadas.

Para o consentimento OAuth, use `https://listademateriais.vercel.app/sobre-o-aplicativo` como página inicial pública. Ela identifica o aplicativo, explica Produtos, Receitas, Listas e a finalidade da autorização Google Drive sem exigir login e aponta para a Política de Privacidade e os Termos de Serviço. No Google Cloud, o endereço da Política de Privacidade precisa ser exatamente `https://listademateriais.vercel.app/politica-de-privacidade`; verifique a propriedade do domínio pelo método oferecido na tela de verificação do Google antes de enviar o app para análise. A página estar publicada e responder HTTP 200 não substitui essa verificação de propriedade.

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
