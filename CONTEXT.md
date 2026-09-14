# Vocabulário canônico

## Conceitos principais

**Produto** é um item do Catálogo do Perfil. Tem código estável, nome, categoria, unidade, peso opcional, custo de compra opcional, valor de venda opcional, observações, modo de preparo e Receita opcional.

**Perfil local** é um espaço de trabalho nomeado dentro deste aparelho. Ele agrupa um catálogo, suas Listas, metadados da demonstração e seu vínculo de cópia do Google Drive; não é uma conta, login ou permissão.

**Perfil ativo** é o Perfil identificado pela rota de dados atualmente aberta. Trocar o Perfil muda o catálogo consultado sem mover ou misturar registros entre Perfis.

**Catálogo do Perfil** é o conjunto de Produtos, Receitas, Listas e entradas pertencente a um único Perfil. Códigos de Produto e IDs de Lista são únicos dentro dele e podem reaparecer em outro Perfil.

**Código do Produto** (`productCode`) é o identificador permanente do Produto. É um slug em minúsculas com hífens, como `pizza-de-mucarela`. Ele é usado por Receitas, Listas e árvores BOM e não muda depois da criação.

**Categoria** classifica um Produto como Produto Final, Produto Unitário, Semi-acabado, Matéria-prima, Embalagem ou Outros. A sigla exibida ao lado do Produto representa essa categoria.

**Receita** é a composição de um Produto. Relaciona Componentes e as quantidades necessárias para uma unidade daquele Produto.

**Componente** é um Produto existente usado dentro de uma Receita. Um Componente não pode repetir, apontar para si próprio nem criar um ciclo de Receita.

**Produto terminal** é um Produto sem Receita dentro do ramo calculado. É ele que aparece no resultado consolidado de materiais.

**Lista de Materiais** é um conjunto local, pertencente ao Catálogo do Perfil, de Produtos desejados e suas quantidades. Não é ordem de produção: não tem data, status, lote ou planejamento.

**Entrada da Lista** é o par formado por um Produto e uma quantidade positiva dentro de uma Lista de Materiais. Um Produto aparece apenas uma vez por Lista.

**BOM** (*Bill of Materials*) é a árvore de composição de uma entrada da Lista, calculada pela biblioteca de BOM a partir de suas Receitas aninhadas.

**Material Consolidado** é um Produto terminal somado entre todos os ramos de uma Lista, preservando sua unidade.

## Valores e persistência

**Custo de compra** é o valor de aquisição informado em um Produto. No resultado BOM, os custos terminais conhecidos são somados; a ausência de custo em outro ramo não invalida a soma disponível.

**Valor de venda** é o valor comercial informado no Produto diretamente pedido em uma Lista. O total multiplica cada valor conhecido pela quantidade desejada.

**Dados neste aparelho** significa que os Perfis e seus catálogos estão no IndexedDB deste navegador. Não significa que existe internet, conta, cópia remota ou sincronização.

**Cópia JSON** é o arquivo local que reúne Produtos, Receitas, Listas e entradas de um Perfil. Sua importação substitui somente o catálogo destinatário depois de validação e confirmação; o vínculo Drive do Perfil é preservado.

**Demonstração de pizzas** é um Perfil local opcional com matérias-primas, massa e molho semiacabados, pizza de muçarela unitária, embalagem, pacote com três pizzas e uma Lista de Materiais correspondente. Ela não substitui outro Perfil.

**Sessão Google** é a autorização temporária em memória usada pelo aplicativo para operações manuais do Drive. Ela pode autorizar vários Perfis na mesma aba, mas não é a identidade de nenhum Perfil.

**Compartilhamento Google Drive** é uma cópia manual autorizada do `LocalDataExport` versão 1 de um Perfil. O arquivo remoto não substitui o IndexedDB: somente as ações explícitas de receber ou enviar alteram uma das cópias.

**Vínculo do Drive** identifica um arquivo ligado a um Perfil, a chave de recurso opcional, datas apresentadas e a referência normalizada da última sincronização neste aparelho. Um mesmo arquivo não pode ser ligado a dois Perfis locais; o vínculo fica separado dos dados do catálogo e sobrevive à importação, demonstração e limpeza daquele Perfil.

**Permissão do arquivo** é o acesso definido no Google Drive. Leitores podem receber o catálogo quando o download é permitido; editores também podem enviar a cópia local. Editar Produtos neste aparelho não altera o arquivo remoto até um envio explícito.

**Link do aplicativo** abre Configurações com a referência do arquivo para vincular. Ele não concede acesso, não seleciona um papel de Leitor ou Editor e não importa dados automaticamente. Links diferentes para o mesmo arquivo continuam sujeitos às mesmas permissões do Drive.

**Conflito de sincronização** ocorre quando o arquivo remoto mudou desde a última referência conhecida, ou quando ainda não existe referência local. O usuário deve escolher receber, substituir o remoto ou cancelar.
