# Planejamento: Perfis locais isolados

Status: aprovado para implementação; este documento descreve o trabalho futuro e não afirma que a migração já foi executada.

## Resumo e decisões fechadas

O IndexedDB continuará sendo um único banco local, mas passará a conter vários **Perfis**. Um Perfil é um espaço local de trabalho, não uma conta, identidade autenticada ou mecanismo de autorização. Cada Perfil terá seu próprio catálogo, Receitas, Listas de Materiais, estado da demonstração e vínculo do Google Drive.

O Perfil legado receberá o nome `Principal` e será criado automaticamente durante a atualização. Em uma instalação nova, o primeiro Perfil também será criado como `Principal`. Perfis novos começam vazios, têm nome obrigatório e único (comparação sem diferença de maiúsculas, minúsculas ou acentos), podem ser renomeados e não podem ser excluídos quando forem o último Perfil. A exclusão exige confirmação explícita com o nome e remove somente dados locais; nunca remove um arquivo remoto.

O mesmo `productCode`, `listId` ou ID de demonstração poderá existir em Perfis diferentes. A identidade permanece local ao Perfil e a regra `ProductRecord.id === productCode` não muda.

O JSON operacional continuará sendo um `LocalDataExport` versão 1 por Perfil. Não haverá, neste corte, um envelope de backup de todos os Perfis. A sincronização do Drive também será por Perfil, mantendo uma única sessão Google em memória por aba/aplicativo. Um arquivo remoto poderá estar vinculado a no máximo um Perfil no mesmo aparelho.

## Modelo de dados e fronteiras

### Raiz e escopo

- Adicionar `Profile` com `id` interno imutável, `name`, `createdAt` e `updatedAt`.
- Guardar a preferência mínima de último Perfil visitado em estado global do aparelho, apenas para redirecionar a entrada sem Perfil. O conteúdo do domínio nunca dependerá de um singleton mutável chamado “ativo”.
- Adicionar `profileId` apenas à camada de persistência de Produtos, Listas, entradas, `meta` e `driveSync`; não incluir esse campo no `ProductRecord` público nem no `LocalDataExport` v1.
- Usar chaves compostas para permitir repetição isolada: Produto `[profileId+id]`, Lista `[profileId+id]`, entrada `[profileId+listId+productCode]`, metadado `[profileId+key]` e vínculo Drive `[profileId+key]`.
- Criar índices para as consultas atuais por Perfil: nome/categoria de Produto, atualização de Lista, entradas por Lista e por Produto. Toda operação pública de leitura/escrita recebe um `profileId` explícito.

### Migração Dexie

O schema atual está na versão 7 e usa chaves primárias simples. Não alterar essas chaves diretamente: o Dexie recomenda criar outra store e migrar os registros quando uma chave primária precisa mudar. A atualização deve:

1. criar as novas stores escopadas e a store de Perfis;
2. criar o Perfil determinístico de legado `Principal`, copiar Produtos, Listas, entradas, `meta` e o vínculo `driveSync['active']` para ele;
3. registrar esse Perfil como destino inicial;
4. verificar a cópia dentro da transação de atualização e remover as stores antigas somente depois da cópia;
5. abortar integralmente se qualquer etapa falhar, sem deixar metade do catálogo migrado.

Uma instalação nova deve criar o primeiro Perfil no bootstrap, pois não se pode depender de callback de upgrade para popular uma base que nunca teve a versão 7. O teste de migração precisa abrir uma base real no schema v7, semear dados variados e reabrir com o schema novo, comparando conteúdo, relações, `demo-state` e todos os campos do vínculo Drive.

### Serviços de persistência

Concentrar em `src/db/database.ts` as operações escopadas e impedir que componentes consultem stores diretamente. Expor, no mínimo, seleção/listagem/criação/renomeação/exclusão de Perfis; consultas de Produtos, Listas e dependências; exportação/importação; demonstração/limpeza; e CRUD do vínculo Drive.

Cada transação deve capturar o `profileId` recebido no início. Importar JSON, limpar ou carregar demonstração substitui apenas o catálogo e `meta` daquele Perfil e preserva seu vínculo Drive. Nenhuma dessas ações toca Perfis vizinhos, seus vínculos ou a sessão Google.

## Rotas e experiência

As rotas de dados passam a carregar a identidade local:

- `/perfis/$profileId/produtos` e suas rotas de novo, detalhe, edição e impressão;
- `/perfis/$profileId/listas` e suas rotas de nova, detalhe e edição;
- `/perfis/$profileId/configuracoes` para contagens, JSON, Perfis, demonstração e Drive.

As rotas públicas permanecem fora desse prefixo. A entrada antiga `/` deve redirecionar ao último Perfil válido (ou a `Principal`), e aliases legados como `/produtos` devem continuar redirecionando sem inventar um Perfil na URL. O link público do Drive continua aceitando `/configuracoes#drive=<id>`; essa rota funciona como entrada neutra, consulta o arquivo e exige escolher um Perfil existente ou criar um novo antes de vincular.

O `AppShell` exibirá o Perfil atual no desktop e no celular. A troca navega para a coleção de Produtos do destino, limpa busca/filtros e desmonta estados transitórios. Durante edição com alterações não salvas, o usuário confirma o descarte antes da troca. Uma operação assíncrona captura seu Perfil de origem e nunca aplica uma resposta ao Perfil que estiver aberto quando a rede terminar.

Preferências de tabela/cartões, tours e intenção de reconexão Google continuam globais no aparelho. Filtros, diálogo, erro, conflito e estado visual temporário do Drive são reiniciados ao trocar de Perfil. A impressão identifica o Perfil porque o shell não aparece no papel.

### Gestão de Perfis

- A Configurações terá uma seção de Perfis com lista ordenada em `pt-BR`, criação vazia, renomeação e exclusão protegida.
- O Perfil de demonstração será criado em um Perfil separado chamado `Demonstração`; nunca substituirá o catálogo corrente. Se esse Perfil já existir, a ação abre-o e não o sobrescreve automaticamente.
- Excluir um Perfil apaga suas stores escopadas e seu vínculo local em uma única transação, escolhe outro Perfil e navega para ele. O arquivo do Drive permanece intacto.
- Mensagens de confirmação e estados vazios dirão o nome do Perfil afetado, substituindo frases que hoje dizem “todos os dados deste aparelho”.

## JSON e Google Drive

### Cópia JSON

- Exportar lê apenas o Perfil da rota em uma transação consistente e sugere nome `lista-de-materiais-<perfil>-YYYY-MM-DD.json`.
- Importar aceita e produz o mesmo `LocalDataExport` v1 sem nome/ID de Perfil e sem vínculo Drive; valida tudo antes da transação e pede confirmação nominal do Perfil de destino.
- Um arquivo exportado de um Perfil pode ser importado em outro. Códigos e IDs são validados dentro do Perfil destinatário.
- Backup/restauração integral do aparelho, com todos os Perfis, fica explicitamente fora deste corte e exigirá outro envelope versionado.

### Vínculo, descoberta e sincronização

- `get/save/clearDriveSync`, exportação, importação, fingerprints, ETag, capacidades, datas e conflitos recebem o `profileId` capturado no início.
- Receber substitui somente o Perfil destinatário. Falhas de rede, JSON, autorização, permissão, arquivo inexistente, limites, cancelamento, `401`, `403`, `404` e `412` preservam todos os Perfis e o vínculo anterior.
- Criar arquivo usa `Lista de Materiais - <Perfil>.json` e uma `appProperty` privada estável do aplicativo. A descoberta procura essa marca e também o nome legado exato `lista-de-materiais.json`; vários resultados continuam exigindo seleção explícita.
- O mesmo `fileId` não pode ser vinculado a dois Perfis locais. O bloqueio informa qual Perfil já possui o vínculo e não altera o arquivo remoto.
- Renomear um Perfil não renomeia o arquivo remoto automaticamente. O nome é apenas uma convenção usada na criação de novos arquivos.
- O link do aplicativo continua carregando apenas `drive` e `resourceKey`, nunca `profileId` local, token ou credencial. Ao recebê-lo, a pessoa escolhe um Perfil existente ou cria um novo; vincular consulta/valida sem importar, e receber continua sendo uma confirmação posterior.
- A sessão OAuth permanece única e efêmera. O vínculo mostra Perfil local, conta conectada agora, última conta usada e capacidades efetivas do Drive. E-mail diferente gera aviso, mas capacidades e respostas da API são a autoridade; não persistir tokens por Perfil.

## Sequência de implementação

1. Fixar contratos de domínio, stores novas, migração v7 e bootstrap; adicionar testes de isolamento A/B e upgrade real.
2. Criar o contexto/loader de Perfil e refatorar todos os acessos `useLiveQuery`, cálculos BOM, dependências, impressão e formulários para `profileId` explícito.
3. Implementar rotas com prefixo, seletor responsivo, gestão de Perfis, proteção de rascunho e redirecionamentos legados.
4. Escopar JSON, demonstração, limpeza e mensagens; criar Perfil `Demonstração` sem sobrescrever o atual.
5. Escopar o Drive, atualizar nomes/metadados e descoberta, guarda de arquivo duplicado, destino de links e limpeza de estados de conflito.
6. Atualizar README, `AGENTS.md`, instruções de `src`, glossário, guia de compartilhamento, privacidade, termos e textos de interface.
7. Validar em build publicado/preview, incluindo F5 offline e teste manual com dois Perfis e duas contas Google quando aplicável.

## Aceitação e testes

### Persistência e domínio

- Upgrade v7 preserva exatamente Produtos, Receitas, Listas, entradas, `meta` e vínculo Drive.
- Instalação nova cria `Principal`; Perfil excluído não deixa registros órfãos e o último não pode ser removido.
- Perfis A e B aceitam os mesmos códigos de Produto, IDs de Lista e dados de demonstração sem colisão.
- Consultas, validação de Receita/ciclos, dependências, BOM, custos, edição, exclusão e impressão nunca cruzam Perfis.
- Importar, exportar, limpar e carregar demonstração afetam somente o destino; uma exportação de A continua sendo v1 e não contém B nem `profileId`.

### Interface e concorrência

- Seletor funciona por teclado em desktop/celular; troca atualiza contagens, vazios, detalhes, formulários, links, impressão e painel Drive.
- Rota de detalhe com ID igual no Perfil errado não mostra dados de outro Perfil.
- Rascunho não salvo exige confirmação; modais e estados transitórios não sobrevivem à troca.
- Operação iniciada em A não grava em B mesmo se a troca ocorrer durante uma chamada assíncrona.

### Drive

- Dois Perfis mantêm arquivos, fingerprints, ETags, permissões e datas independentes.
- Criar, vincular, descobrir, enviar, receber, conflito, `If-Match`, `412`, somente leitura, desvincular e falhas preservam o isolamento.
- Duplicidade de `fileId` é bloqueada; links permitem destino existente ou novo, preservam `resourceKey` e não importam sem confirmação.
- Reconexão/troca de conta não grava token e continua compatível com a sessão global em memória.

Rodar, na ordem, os testes afetados, `pnpm typecheck`, `pnpm lint`, `pnpm build` e, na finalização, `pnpm test`. A implementação só estará pronta quando também houver prova manual de dois Perfis com códigos iguais e de dois vínculos Drive separados.

## Fora deste corte

Não serão adicionados login, backend, compartilhamento entre Perfis, mesclagem automática, sincronização automática, backup integral de múltiplos Perfis, permissões por Perfil, histórico de versões remoto ou cópia do vínculo Drive ao duplicar dados.
