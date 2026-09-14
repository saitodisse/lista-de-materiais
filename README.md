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

Na tela de Configurações de cada Perfil:

- **Exportar JSON** baixa uma cópia de Produtos, Receitas, Listas e entradas **daquele Perfil**.
- **Importar JSON** lê uma cópia desse formato, valida códigos, Receitas e referências e pede confirmação antes de substituir apenas o catálogo do Perfil de destino, em uma única transação. Os outros Perfis e o vínculo do Drive permanecem intactos.
- **Abrir Perfil “Demonstração”** abre um Perfil local separado chamado `Demonstração` com a receita de pizzas de muçarela. Ele nunca muda o catálogo do Perfil atual. Se esse Perfil já existe, a ação apenas o abre. Dentro dele, **Limpar todos os dados** remove Produtos, Listas e entradas após confirmação.

O banco local pode conter vários **Perfis** isolados. Cada Perfil tem o seu próprio catálogo, suas Listas, o estado de demonstração e o seu vínculo do Google Drive. Códigos de Produto e IDs de Lista se podem repetir em Perfis diferentes. Trocar de Perfil na barra do aplicativo abre a coleção de Produtos daquele Perfil.

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
- [Planejamento de Perfis locais](./docs/planejamento-perfis-locais.md) registra o modelo aprovado, a migração e os critérios de aceitação para múltiplos Perfis.
- [ADR 0001](./docs/adr/0001-perfis-locais-e-sincronizacao.md) registra a decisão arquitetural de isolamento por Perfil e sincronização separada.
- [AGENTS.md](./AGENTS.md) descreve limites do produto, persistência, PWA e regras de desenvolvimento.
- `src/domain` mantém contratos e validações; `src/db` mantém Dexie e transações; `src/features` contém as telas de Produtos, Listas e resultado BOM.
- `src/service-worker.ts` define a estratégia Workbox usada pelo build PWA.

## Validação automatizada

Os testes cobrem slug e unicidade, Receitas inválidas e cíclicas, exclusão com dependências, persistência Dexie, demonstração, importação/exportação, filtros e visualização do catálogo, formulário de Lista, consolidação de BOM, árvore e telas de erro/vazio.
