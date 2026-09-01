# PRD: Guia “Como usar” com tours interativos

**Status:** implementado e registrado localmente
**Data do registro:** 2026-08-27
**Escopo:** documentação integrada ao PWA Lista de Materiais

## Problem Statement

Quem chega ao Lista de Materiais precisa entender a diferença entre Produto,
Receita, materiais terminais e Lista de Materiais antes de conseguir montar
uma BOM. Os nomes dos campos e das categorias não explicam, sozinhos, como a
composição de um item se transforma em materiais necessários.

Também é necessário deixar explícito o limite do produto: esta é uma base
local-first, não uma ordem de produção nem um serviço com conta e
sincronização. A pessoa deve aprender a ler a árvore calculada pela
infraestrutura oficial e proteger seus dados com a cópia JSON. O guia não
cria dados automaticamente: oferece uma ação explícita e protegida para
substituir a base local pela demonstração completa.

## Solution

Adicionar uma rota pública e offline `/como-usar`, disponível na navegação
desktop e móvel, com uma página progressiva em português simples e a ordem
“por quê → o quê → como”. A página apresenta uma cadeia didática curta de
pizzas, alinhada à demonstração persistida, para explicar:

1. Produto e material terminal;
2. as nove matérias-primas e a embalagem como cadastros de base;
3. “Massa de pizza” como Semi-acabado com Receita;
4. “Pizza de muçarela” como Produto Unitário, representando uma unidade
   produzida, pesada, vendida ou consumida pela Receita seguinte;
5. “Pacote com 3 pizzas de muçarela” como Produto Final, formado por três
   unidades e uma embalagem;
6. uma Lista de Materiais para um pacote.

Entre as etapas, a página mostra as árvores calculadas oficialmente:

- massa → farinha, água morna, fermento, açúcar, sal e azeite;
- molho → tomate, azeite, sal e orégano;
- pizza unitária → massa, molho, muçarela, tomate e orégano;
- pacote final → três pizzas + caixa;
- um pacote → árvore completa e materiais terminais consolidados.

Os dados didáticos usam a mesma fonte de dados da demonstração persistida.
Um botão no primeiro bloco abre um modal posterior com alerta e checkbox; só
após a confirmação a transação limpa Produtos, Listas, entradas e metadados e
carrega os 14 Produtos e o plano de exemplo. A visualização de árvore é
reutilizável e recebe os resultados de `MaterialsTreeBuilder`; o algoritmo de
BOM não é duplicado em JSX.

A página inclui explicações campo a campo, os 14 registros do exemplo com
links para suas fichas reais e quatro tours manuais curtos: Produto, árvore,
Lista e JSON. Os tours usam Driver.js carregado sob demanda, seletores
estáveis, textos em português, progresso, teclado, saída explícita e respeito
a `prefers-reduced-motion`. Nenhum tour abre sozinho ou registra conclusão.

O conteúdo de JSON ensina a exportar em **Configurações → Exportar JSON**,
guardar o arquivo como cópia de segurança, importar pelo botão **Importar
JSON**, confirmar que a operação substitui Produtos, Receitas, Listas e
entradas do aparelho, e exportar antes de importar quando houver dados
importantes. O guia explica que o IndexedDB pertence a este navegador e que
limpar os dados ou perder o aparelho pode apagar a única cópia; após o
primeiro carregamento conectado, o PWA pode ser instalado e aberto offline
quando o service worker estiver ativo.

## User Stories

1. Como visitante, quero abrir `/como-usar` diretamente sem autenticação para
   aprender o fluxo sem precisar criar dados.
2. Como pessoa que usa o desktop, quero encontrar “Como usar” na navegação
   principal para voltar ao guia a qualquer momento.
3. Como pessoa que usa o celular, quero encontrar o mesmo acesso no menu
   móvel para que a documentação permaneça acessível em telas pequenas.
4. Como iniciante, quero começar entendendo por que Produto, Receita e Lista
   são conceitos diferentes antes de preencher formulários.
5. Como iniciante, quero ver uma sequência numerada que explique primeiro o
   conceito, depois o exemplo e por fim a ação correspondente na aplicação.
6. Como pessoa cadastrando um Produto, quero saber que seu código permanente é
   um slug em minúsculas com hífens e não muda após a criação.
7. Como pessoa cadastrando um Produto, quero entender nome, categoria e
   unidade com exemplos em português simples.
8. Como pessoa cadastrando um Produto, quero saber quais campos são opcionais,
   incluindo peso, custo de compra, valor de venda, observações e preparo.
9. Como pessoa cadastrando materiais básicos, quero usar farinha, água,
   muçarela e caixa como exemplos de Matéria-prima ou Embalagem.
10. Como pessoa criando uma Receita, quero entender que seus componentes são
    Produtos existentes, distintos e com quantidades positivas.
11. Como pessoa modelando uma massa, quero cadastrar “Massa de pizza” como
    Semi-acabado com farinha e água na Receita.
12. Como leitora do guia, quero ver a árvore da massa calculada como farinha e
    água, reconhecendo esses itens como materiais terminais.
13. Como pessoa modelando uma unidade produzida, quero entender por que
    “Pizza de muçarela” é um Produto Unitário, mesmo que depois seja consumido
    por outro Produto.
14. Como leitora do guia, quero ver a árvore da pizza unitária com massa e
    muçarela, incluindo a expansão da Receita da massa.
15. Como pessoa modelando uma venda agrupada, quero cadastrar “Pacote com 3
    pizzas” como Produto Final com três pizzas unitárias e uma caixa.
16. Como leitora do guia, quero ver a árvore do pacote final com três pizzas,
    caixa e os materiais terminais derivados das receitas aninhadas.
17. Como pessoa montando uma demanda, quero abrir o plano de exemplo para um
    pacote e entender como a quantidade desejada multiplica a árvore.
18. Como leitora do guia, quero ver os materiais terminais consolidados do
    plano de exemplo, preservando Produto e unidade.
19. Como pessoa usuária, quero saber que uma Lista de Materiais não possui
    agenda, lote, status, estoque ou controle de produção.
20. Como pessoa usuária, quero abrir os links do guia e chegar às fichas dos
    Produtos e ao plano reais carregados pela demonstração.
21. Como pessoa iniciante, quero carregar a demonstração completa com uma ação
    explícita, sem que abrir o guia escreva dados automaticamente.
22. Como pessoa responsável pelos dados, quero que a substituição exija um
    modal posterior com checkbox antes de apagar a base local.
23. Como pessoa usuária, quero iniciar manualmente um tour de cadastro de
    Produto para localizar os campos principais sem alterar o formulário.
24. Como pessoa usuária, quero iniciar manualmente um tour de leitura da
    árvore para entender o resultado BOM exibido na tela correspondente.
25. Como pessoa usuária, quero iniciar manualmente um tour de criação de Lista
    para localizar entradas, quantidades e o cálculo consolidado.
26. Como pessoa usuária, quero iniciar manualmente um tour de exportação e
    importação JSON para encontrar os controles corretos em Configurações.
27. Como participante de um tour, quero ver o passo atual e o total de passos,
    com botões Próximo, Anterior e concluir em português.
28. Como participante de um tour, quero navegar pelo teclado, fechar ou sair a
    qualquer momento e não ficar preso em uma sobreposição.
29. Como pessoa sensível a animações, quero que o tour respeite
    `prefers-reduced-motion`.
30. Como pessoa que muda de rota ou desmonta a página durante um tour, quero
    que a instância do tour seja encerrada e que um carregamento tardio não
    reabra o tour.
31. Como pessoa que exporta dados, quero saber que o arquivo JSON é uma cópia
    local para backup ou transporte manual, não uma sincronização.
32. Como pessoa que importa dados, quero ser avisada de que a importação
    substituirá Produtos, Receitas, Listas e entradas deste aparelho após
    validação e confirmação explícita.
33. Como pessoa com dados importantes, quero ser orientada a exportar uma cópia
    antes de importar outro arquivo.
34. Como pessoa sem conta, quero entender que não há servidor, login ou
    sincronização entre aparelhos.
35. Como pessoa instalando o PWA, quero saber que o primeiro acesso publicado
    precisa de conexão para ativar o service worker e que, depois disso, o
    shell, o IndexedDB e os cálculos locais podem abrir offline.
36. Como pessoa responsável pelos dados, quero ser alertada de que limpar os
    dados do navegador ou perder o aparelho pode apagar a única cópia local.
37. Como pessoa em uma tela pequena, quero percorrer as árvores com rolagem e
    ler textos longos sem colunas comprimidas ou palavras cortadas.
38. Como pessoa usando o guia com tecnologias assistivas, quero encontrar
    títulos, etapas, botões e regiões de navegação com estrutura semântica e
    rótulos compreensíveis.

## Implementation Decisions

- A documentação é uma rota pública do mesmo PWA e reutiliza a navegação
  existente em desktop e móvel.
- A página não escreve ao ser aberta. Seus Produtos e árvores usam a mesma
  fonte pura da demonstração; a ação explícita delega ao repositório Dexie uma
  substituição transacional.
- Os resultados BOM são calculados pela infraestrutura oficial baseada em
  `MaterialsTreeBuilder` e apresentados por uma visualização de árvore
  reutilizável. Componentes de interface não reimplementam a expansão de
  receitas.
- Os links de ação apontam para as fichas reais dos 14 códigos da demonstração
  e para o id real da Lista; antes de carregar a base, a pessoa pode ver os
  links, mas eles passam a funcionar como exemplo após a confirmação.
- Driver.js é uma dependência MIT carregada dinamicamente somente quando uma
  pessoa inicia um tour. A API interna aceita assuntos tipados para Produto,
  árvore, Lista e JSON, configura cópia e progresso em português, e destrói a
  instância ao concluir, sair, desmontar ou mudar de rota.
- Os tours são opt-in e não possuem abertura automática, armazenamento de
  conclusão, telemetria ou estado durável.
- Seletores `data-guide` são estáveis e ficam nas regiões necessárias das telas
  reais; texto, botões e foco permanecem em português.
- A implementação não altera schema Dexie, contratos de Produto ou Lista,
  regras de Receita, cálculo BOM ou formato JSON existente.
- As regras atuais de importação continuam responsáveis por validar o arquivo
  antes da transação e pedir confirmação antes de substituir os dados.
- A aparência acompanha o shell do PWA, é responsiva e mantém a leitura das
  árvores em rolagem horizontal quando necessário.

## Testing Decisions

- Testes de rota e navegação confirmam que `/como-usar` renderiza e que o item
  aparece nos menus desktop e móvel.
- Testes de conteúdo confirmam a ordem pedagógica, as seis etapas da cadeia de
  pizzas, a explicação de campos, os links reais e os avisos de local-first e
  JSON.
- Testes de domínio da página confirmam que as árvores da massa, pizza,
  pacote e Lista usam o cálculo oficial e consolidam os materiais terminais
  esperados.
- Testes de isolamento verificam que abrir a rota e iniciar ou encerrar tours
  não cria escritas no IndexedDB; um teste separado verifica checkbox,
  substituição dos 14 Produtos e exclusão de dados anteriores.
- Testes dos tours verificam os quatro assuntos, os seletores existentes, a
  configuração de progresso e textos, a inicialização sob demanda, o
  encerramento e a invalidação após desmontagem.
- Os testes existentes de importação continuam cobrindo validação, confirmação
  e substituição transacional do JSON; o guia deve apenas explicar esse fluxo.
- A validação visual cobre desktop e celular, rolagem das árvores, foco e
  teclado, fechamento com Escape e ausência de sobreposição após sair.
- A verificação offline usa o build de preview: depois de o service worker
  estar controlando a página, recarregar `/como-usar` sem rede deve continuar
  renderizando a rota.

## Out of Scope

- Tours automáticos no primeiro acesso, onboarding obrigatório, telemetria ou
  registro de conclusão.
- Criação automática da demonstração de pizzas quando a pessoa abre o guia ou
  inicia um tour; a substituição só ocorre pela ação explícita com checkbox.
- Conta, API, servidor, sincronização, colaboração ou armazenamento remoto.
- Agenda, ordem de produção, lote, status, estoque, planejamento de fábrica ou
  qualquer métrica que não faça parte da Lista de Materiais existente.
- Alterações no schema Dexie, nos contratos de Produto/Lista, no formato de
  exportação/importação JSON ou nas regras de integridade de Receitas.
- Substituição do cálculo oficial por um algoritmo copiado na camada React.
- Adoção de React Joyride, Intro.js ou Shepherd para os tours.
- Publicação em produção, criação de issue externa, alteração de versão ou
  commit como parte deste registro local.

## Further Notes

Este PRD registra localmente as especificações do guia após a implementação
correspondente. O repositório não possui configuração de issue tracker, então
nenhuma issue externa foi criada; o arquivo é a fonte local consultável para
intenção, limites, decisões e critérios de teste.

O cenário de pizzas é deliberadamente simples para ensino. A pessoa pode
carregar a base oficial do exemplo ou continuar com seus próprios dados; a
ação de carregamento deixa claro que a base atual será substituída e a tela
inicial mantém o mesmo controle para limpar a demonstração depois.
