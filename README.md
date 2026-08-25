# Lista de Materiais

PWA mobile-first para montar um catálogo de Produtos, suas Receitas e Listas de Materiais (BOM) sem sair do aparelho. Os dados são armazenados no IndexedDB do navegador; não existe backend, conta nem sincronização.

Aplicativo publicado: [listademateriais.vercel.app](https://listademateriais.vercel.app).

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
- Uso offline após a primeira abertura online e ativação do service worker, inclusive ao atualizar uma rota com F5.
- Rodapé discreto em todas as rotas, com crédito para Julio Saito, portfólio e acesso ao repositório público.

## Limites intencionais

Este corte não inclui API, conta, sincronização, colaboração, imagens, importação de planilhas, preço tabelado, ordem de produção, data, lote ou status. O JSON é uma cópia manual; ele não sincroniza aparelhos.

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

Mantenha uma exportação antes de usar importação ou limpeza. Nenhuma dessas ações envia dados a um servidor.

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
