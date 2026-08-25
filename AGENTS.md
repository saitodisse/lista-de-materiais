# Lista de Materiais

## Propósito e escopo

- Este é um PWA local-first para cadastrar Produtos, suas Receitas e Listas de Materiais (BOM).
- Produtos, Receitas e Listas vivem somente no IndexedDB do navegador deste aparelho. Não há API, conta, servidor, sincronização entre aparelhos, imagens, preços tabelados ou planejamento de produção.
- A cópia JSON local é uma exceção de escopo aprovada: ela serve para levar uma cópia entre aparelhos ou recuperar dados manualmente. Nunca é uma sincronização.

## Regras de domínio

- `productCode` é a identidade estável: `id === productCode`, é criado com `slugify`, fica em minúsculas com hífens e não pode mudar depois da criação.
- Categorias e unidades vêm de `@saitodisse/bom-recipe-calculator`. As categorias visíveis são Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros. Dados legados da categoria `l` são normalizados para `c` (Outros).
- Nos seletores de Produto, ordene por categoria: Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros. Dentro de cada categoria, use ordenação `pt-BR` sem separar palavras acentuadas das não acentuadas.
- Uma Receita aceita somente Produtos existentes, distintos e com quantidade positiva. Bloqueie autorreferência, referências ausentes e ciclos antes de persistir.
- Antes de excluir um Produto, consulte receitas e entradas de Lista que o referenciam. A exclusão deve permanecer bloqueada e explicar essas dependências.

## BOM e valores

- Use `MaterialsTreeBuilder` da biblioteca para construir cada árvore. Não replique o cálculo de receita em componentes React.
- Consolide somente materiais terminais retornados pela árvore, mantendo produto e unidade.
- O custo de compra é a soma de custos terminais conhecidos; valores ausentes são ignorados. O indicador aparece apenas se houver ao menos um custo conhecido.
- O valor de venda é a soma dos valores conhecidos dos Produtos diretamente incluídos na Lista, multiplicados pela quantidade desejada. Peso aparece por material quando conhecido; não há métrica de peso total.

## Persistência, demonstração e cópia JSON

- A persistência usa Dexie e transações. Componentes não devem acessar `indexedDB` diretamente.
- Importar JSON deve validar o formato e a integridade antes de iniciar a transação que substitui Produtos, Listas, entradas e metadados deste aparelho. Peça confirmação explícita antes da substituição.
- A demonstração é opcional: ela cria o pacote de três pizzas de muçarela, seus materiais, semiacabados, pizza unitária, embalagem e uma Lista. Ela só é inserida por ação explícita.
- Quando a demonstração está presente, o mesmo controle da tela inicial limpa todos os Produtos, Listas e entradas após confirmação. O catálogo permanece vazio após F5; não recrie dados automaticamente.

## PWA e interface

- O service worker é criado por `vite-plugin-pwa` com `injectManifest`. Ele usa o shell precacheado para rotas de navegação sem rede, mas prioriza o servidor quando há rede para não entregar HTML antigo ao Vite em desenvolvimento.
- O primeiro acesso ao build publicado precisa de conexão para registrar o service worker. Depois de ativo, o shell, rotas, dados IndexedDB e cálculos locais podem abrir após F5 sem internet.
- “Dados neste aparelho” é a garantia de persistência local. A indicação de conectividade deve refletir o estado real de `navigator.onLine`; cache não significa internet.
- Preserve o uso em tela pequena. Tabelas devem ter cabeçalhos semânticos e um contêiner com rolagem horizontal em vez de comprimir ou desalinhavar colunas. Textos longos de observação e preparo devem preservar as linhas salvas e quebrar palavras longas com segurança.
- O `AppShell` possui um rodapé global discreto com links externos para o portfólio de Julio Saito e o repositório público. Preserve os dois links, o rótulo acessível e `rel="noopener noreferrer"` ao abrir nova aba.

## Qualidade

- Mantenha testes de domínio, Dexie e renderização atualizados com cada mudança de comportamento.
- Antes de encerrar uma mudança, rode ao menos o teste afetado, `pnpm typecheck`, `pnpm lint` e `pnpm build`; use `pnpm test` na finalização.
