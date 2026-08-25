# Vocabulário canônico

## Conceitos principais

**Produto** é um item do catálogo deste aparelho. Tem código estável, nome, categoria, unidade, peso opcional, custo de compra opcional, valor de venda opcional, observações, modo de preparo e Receita opcional.

**Código do Produto** (`productCode`) é o identificador permanente do Produto. É um slug em minúsculas com hífens, como `pizza-de-mucarela`. Ele é usado por Receitas, Listas e árvores BOM e não muda depois da criação.

**Categoria** classifica um Produto como Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem ou Outros. A sigla exibida ao lado do Produto representa essa categoria.

**Receita** é a composição de um Produto. Relaciona Componentes e as quantidades necessárias para uma unidade daquele Produto.

**Componente** é um Produto existente usado dentro de uma Receita. Um Componente não pode repetir, apontar para si próprio nem criar um ciclo de Receita.

**Produto terminal** é um Produto sem Receita dentro do ramo calculado. É ele que aparece no resultado consolidado de materiais.

**Lista de Materiais** é um conjunto local de Produtos desejados e suas quantidades. Não é ordem de produção: não tem data, status, lote ou planejamento.

**Entrada da Lista** é o par formado por um Produto e uma quantidade positiva dentro de uma Lista de Materiais. Um Produto aparece apenas uma vez por Lista.

**BOM** (*Bill of Materials*) é a árvore de composição de uma entrada da Lista, calculada pela biblioteca de BOM a partir de suas Receitas aninhadas.

**Material Consolidado** é um Produto terminal somado entre todos os ramos de uma Lista, preservando sua unidade.

## Valores e persistência

**Custo de compra** é o valor de aquisição informado em um Produto. No resultado BOM, os custos terminais conhecidos são somados; a ausência de custo em outro ramo não invalida a soma disponível.

**Valor de venda** é o valor comercial informado no Produto diretamente pedido em uma Lista. O total multiplica cada valor conhecido pela quantidade desejada.

**Dados neste aparelho** significa que o catálogo está no IndexedDB deste navegador. Não significa que existe internet, conta, cópia remota ou sincronização.

**Cópia JSON** é o arquivo local que reúne Produtos, Receitas, Listas e entradas. Sua importação substitui todo o catálogo local depois de validação e confirmação.

**Demonstração de pizzas** é um conjunto opcional de dados locais: matérias-primas, massa e molho semiacabados, pizza de muçarela unitária, embalagem, pacote com três pizzas e uma Lista de Materiais correspondente.
