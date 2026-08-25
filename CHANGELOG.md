# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

## 0.1.3 — 2026-08-24

### Changed

- A documentação passa a indicar `https://listademateriais.vercel.app` como endereço público canônico do PWA.

## 0.1.2 — 2026-08-24

### Added

- Rodapé global discreto com crédito para Julio Saito, link para o portfólio e link para o código-fonte público no GitHub.

## 0.1.1 — 2026-08-24

### Fixed

- Observações e modo de preparo na ficha de Produto agora preservam as quebras de linha salvas, com tipografia normal e quebra segura de palavras em telas estreitas.

## 0.1.0 — 2026-08-24

### Added

- PWA local-first para Produtos, Receitas, Listas de Materiais e BOMs calculadas neste aparelho.
- Catálogo com categorias coloridas, cartões, tabela, busca por nome/código e filtros combináveis de categoria.
- Estado de busca, filtros e modo de visualização na URL; preferência de cartões/tabela preservada localmente.
- Fichas de Produto com peso, custo de compra, valor de venda, observações, modo de preparo e Receita.
- Validação de slug, unicidade antecipada, componentes inexistentes, quantidades inválidas, duplicidade, autorreferência e ciclos de Receita.
- Seletores de Produto com categoria, código e ordenação em português por tipo de Produto.
- Tabela semântica de Receita com Tipo, Produto, Código e Quantidade, adaptada para rolagem horizontal em telas pequenas.
- Listas de Materiais com materiais terminais consolidados, árvore BOM expansível, custo de compra e valor de venda calculados quando disponíveis.
- Demonstração opcional de pacote com três pizzas de muçarela, incluindo matérias-primas, massa, molho, pizza unitária, embalagem e Lista de Materiais.
- Exportação e importação JSON local, validação antes da importação e substituição transacional confirmada do catálogo.
- Service worker Workbox com shell precacheado, rotas profundas offline após a primeira ativação e atualização automática.
- Testes de domínio, Dexie e interface para regras de catálogo, persistência, filtros, CRUD, Listas e resultados BOM.

### Changed

- A categoria legada de limpeza é migrada e exibida como Outros.
- O servidor Vite usa `0.0.0.0:5174`; o preview PWA usa `0.0.0.0:4173` para separar desenvolvimento e service worker de produção.

### Fixed

- Navegações servem o shell precacheado apenas quando a rede não responde, evitando que um `index.html` antigo no cache deixe o Vite em branco durante o desenvolvimento.
