# Código em `src`

## Fronteiras

- `domain/catalog.ts` contém contratos, normalização, ordenação e validações puras. Não coloque regras de Receita, unicidade ou integridade diretamente em JSX.
- `db/database.ts` é a fronteira Dexie: concentra schema, migrações, transações, demonstração, importação/exportação e operações de escrita. Componentes usam essas funções e `useLiveQuery`; não acessam IndexedDB diretamente.
- `features/bom/calculator.ts` adapta o catálogo para `MaterialsTreeBuilder` e transforma seu resultado em uma visualização consolidada. Não crie um segundo algoritmo de expansão de Receita.
- Componentes devem apresentar estados de carregamento, vazio e erro para consultas locais assíncronas.

## Dados locais

- Preserve os contratos `ProductRecord`, `MaterialList` e `MaterialListEntry` de `domain/catalog.ts`.
- Escritas que afetam registros relacionados devem ser transacionais. Importar só pode limpar e substituir dados depois de `parseLocalDataExport` e `validateLocalDataExport` terem passado.
- A demonstração é opt-in. Limpar tudo remove Produtos, Listas e entradas em transação e mantém o estado vazio após F5.
- Não introduza chamadas de rede para dados do domínio. Este aplicativo deve continuar útil sem rede depois de instalado.

## Roteamento, busca e PWA

- Rotas são declaradas em `router.tsx`; mantenha rotas profundas renderizáveis pelo shell PWA.
- Busca, categorias e modo de lista de Produtos usam nuqs. O modo também é espelhado em `localStorage` como preferência local; não duplique esse estado em outra fonte.
- O service worker usa `injectManifest`. Navegações tentam a rede primeiro e caem para o shell precacheado; preserve essa distinção para não quebrar desenvolvimento no Vite nem F5 offline no build.
- Créditos e links externos ficam no rodapé único de `AppShell`, abaixo do `Outlet`; não repita esse conteúdo em cada rota.

## Interface e testes

- Reutilize a linguagem visual e os componentes existentes. Em telas pequenas, prefira rolagem horizontal para tabelas a desmontar colunas essenciais.
- Tabelas devem ter `table`, `thead`, `tbody`, cabeçalhos com `scope` e nome acessível quando apropriado.
- Atualize os testes de domínio, Dexie ou React que representem a mudança e rode os comandos definidos no `package.json` antes de concluir.
