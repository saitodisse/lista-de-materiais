# Produtos

## Identidade e campos

- O código de Produto é minúsculo, com hífens, único e imutável depois da criação. Normalize a entrada com `slugify` e valide duplicidade antes do primeiro salvamento e novamente na persistência.
- A ficha contém categoria e unidade da biblioteca, peso opcional, custo de compra opcional, valor de venda opcional, observações, modo de preparo e Receita opcional. Observações e modo de preparo são texto multilinha: renderize-os em `pre` com `white-space: pre-wrap`, sem trocar a tipografia do aplicativo.
- Categorias de limpeza não existem na interface atual. Migrações e importações normalizam o código legado `l` para `c`, apresentado como Outros.

## Receita

- Receitas aceitam somente componentes existentes, distintos e com quantidade positiva.
- Bloqueie autorreferência e ciclos antes de persistir; o formulário deve mostrar um motivo acionável.
- Os seletores de componentes mostram nome, categoria e código. Use `sortProductsForSelection` para manter a ordem Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros, seguida de ordem alfabética `pt-BR`.
- A ficha renderiza componentes em uma tabela semântica: Tipo, Produto, Código e Quantidade. O Tipo é a primeira coluna e inclui a sigla/cor da categoria. Em celular, mantenha as colunas em um contêiner rolável.

## Consulta e exclusão

- O catálogo tem cartões e tabela. O modo é controlado por `view` no nuqs e persistido em `lista-de-materiais:products-view` no `localStorage`.
- Busca por nome/código e categorias ativas são controladas por nuqs (`search` e `categories`) para que a URL seja compartilhável e sobreviva à navegação.
- Exclusão nunca pode deixar Receitas ou Listas apontando para um código inexistente. Mostre as dependências numa seção separada das ações e mantenha a confirmação antes da remoção.
