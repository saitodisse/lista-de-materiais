# Listas de Materiais

## Modelo e edição

- Uma Lista contém nome e pares `productCode`/quantidade positiva. Não adicione data, status, lote, estoque ou planejamento.
- A identidade local da Lista é um UUID. A identidade de uma entrada é `[listId, productCode]`; não permita Produtos repetidos na mesma Lista.
- Todo seletor de Produto deve mostrar nome, categoria e código e usar `sortProductsForSelection`: Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem e Outros; depois, ordem alfabética `pt-BR`.
- Salve Lista e entradas na mesma transação e confirme antes de excluir uma Lista.

## Resultado BOM

- Construa um `MaterialsTreeBuilder` por entrada e consolide apenas a visualização dos resultados retornados pela biblioteca.
- Materiais terminais iguais são somados por código, preservando unidade. A árvore apresentada continua separada por Produto pedido para permitir inspeção de cada ramo.
- Custos de compra terminais conhecidos entram no total; itens sem custo são ignorados, sem impedir a soma dos demais. Só mostre a métrica se existir algum custo conhecido.
- Valores de venda conhecidos dos Produtos diretamente pedidos são multiplicados pelas quantidades da Lista e somados. Só mostre a métrica se houver valor conhecido.
- Peso é exibido por material quando conhecido. Não apresente um peso total.
