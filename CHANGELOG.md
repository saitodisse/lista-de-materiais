# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

## 0.6.1 — 2026-09-05

### Fixed

- A sessão Google pode ser restaurada silenciosamente após F5 usando somente uma preferência local, sem persistir o token.
- O vínculo por ID passou a solicitar o escopo Drive necessário para arquivos compartilhados com outra conta; links com `resourcekey` são preservados ao copiar o compartilhamento.

## 0.6.0 — 2026-09-05

### Added

- Sincronização manual opcional com Google Drive usando OAuth `drive.file`, Google Picker e o mesmo `LocalDataExport` versão 1.
- Vínculo persistente do arquivo, consulta de permissões, datas de cópia remota e confirmação explícita para receber ou substituir dados.
- Detecção de divergência com referência normalizada, precondição `If-Match` quando disponível e tratamento de falhas sem repetir escritas incertas.
- Páginas públicas de Política de Privacidade e Termos de Serviço para a configuração do consentimento OAuth.

## 0.5.0 — 2026-09-01

### Added

- A demonstração de pizzas pode substituir toda a base local ou ser removida pela tela inicial e pelo guia, sempre após confirmação explícita com checkbox.
- O guia **Como usar** abre diretamente os Produtos e a Lista carregados pela demonstração, com índice de navegação, exemplos por nível e explicações detalhadas dos campos.
- O catálogo em tabela permite copiar os dados visíveis para uma planilha e imprimir uma versão compacta em preto e branco com todas as colunas.

### Changed

- Quantidades da árvore preservam a digitação até o blur, usam formatação pt-BR e arredondam valores exibidos em gramas para uma casa decimal.
- O acesso **Como usar** foi movido para a navegação secundária no rodapé da barra lateral.

## 0.4.1 — 2026-08-27

### Changed

- Os textos dos tours foram reescritos com uma narrativa conversacional e progressiva, explicando o propósito de cada etapa e reforçando o armazenamento local.
- A numeração foi mantida nos fluxos de criação, enquanto as telas de consulta receberam títulos mais naturais e diretos.
- A explicação da árvore passou a usar as ideias de raiz, ramos, folhas e blocos básicos, com o resultado da BOM apresentado em linguagem simples.

## 0.4.0 — 2026-08-27

### Added

- Guia **Como usar** com narrativa progressiva de matérias-primas, semiacabados, Produtos Unitários e Produtos Finais, exemplos reais de campos e ilustrações cartunescas.
- Árvores BOM calculadas na própria página do guia, sem gravar os exemplos no catálogo local.
- Tours interativos para catálogo, detalhe e edição de Produto, iniciados automaticamente na primeira visita e reabertos pelo botão de ajuda no cabeçalho.

### Changed

- A página do catálogo e o guia aproveitam toda a largura disponível no desktop, com tipografia e espaçamentos ampliados.
- O acesso secundário da navegação recebeu separação visual mais clara.

## 0.3.0 — 2026-08-25

### Added

- A tabela de Produtos calcula e exibe o custo unitário de Produtos compostos pela árvore BOM.
- A ficha de Produto permite imprimir a receita, copiar a árvore para uma planilha e simular quantidades, unidades e profundidade.
- A impressão abre em uma rota própria, sem códigos, com controles para custo, KG/G e uma camada ou a árvore completa.

### Changed

- O multiplicador, custo, unidade e expansão da árvore são controlados por `nuqs` e preservados ao abrir a impressão.
- A rota de impressão usa um layout isolado, otimizado para papel.

## 0.2.0 — 2026-08-25

### Added

- A ficha de Produto exibe a árvore completa da Receita com expansão por uma camada ou por toda a árvore, quantidades simuladas e custos recalculados em tempo real sem salvar alterações.
- O campo de quantidade da árvore seleciona todo o conteúdo ao receber clique, facilitando a substituição direta do valor.
- O bloco de exclusão lista as Receitas e Listas de Materiais que impedem a remoção, com links diretos para cada dependência.

### Changed

- O servidor de desenvolvimento usa `0.0.0.0:5177`, com a documentação local apontando para `http://localhost:5177`.

## 0.1.4 — 2026-08-25

### Changed

- O catálogo agora abre em tabela, com o seletor Tabela antes de Cartões e o Produto como página inicial em `/`.
- As categorias são o primeiro campo das tabelas de Produtos e de Receita: o marcador compacto exibe o nome completo apenas no tooltip; no catálogo, os cabeçalhos compactos usam `CAT` e `UN`.
- As tabelas adaptam suas colunas à largura disponível e, no celular, preservam somente os dados essenciais de cada Produto ou componente da Receita.
- Configurações e Plano de produção ficam como acessos secundários no rodapé da barra lateral; a página de configurações reúne os controles de cópia JSON e demonstração.

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
- O servidor Vite usa `0.0.0.0:5177`; o preview PWA usa `0.0.0.0:4173` para separar desenvolvimento e service worker de produção.

### Fixed

- Navegações servem o shell precacheado apenas quando a rede não responde, evitando que um `index.html` antigo no cache deixe o Vite em branco durante o desenvolvimento.
