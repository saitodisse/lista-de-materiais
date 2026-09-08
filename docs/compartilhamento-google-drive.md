# Compartilhar um catálogo pelo Google Drive

O aplicativo mantém o catálogo neste aparelho. Para compartilhar, ele usa uma cópia JSON no Google Drive: cada pessoa vincula o mesmo arquivo e escolhe quando receber ou enviar dados. O compartilhamento do arquivo é configurado no Drive; copiar o link do aplicativo não concede acesso.

## Por que a outra conta recebeu um erro

No caso investigado nesta entrega, a consulta aos metadados de `lista-de-materiais.json` retornou `shared: false` e somente uma permissão `type: user`, `role: owner`. O arquivo estava privado, com acesso apenas do proprietário. Isso explicou a falha ao tentar vincular pela outra conta. A consulta foi de leitura e não alterou permissões. Esse registro descreve o estado observado durante o diagnóstico, não uma garantia sobre o estado atual do arquivo.

A mensagem apresentada pelo aplicativo era:

> O arquivo não está acessível à conta conectada. Confirme o compartilhamento no Google Drive e cole novamente o link completo, incluindo resourcekey quando existir.

Essa mensagem corresponde a uma resposta `404` do Drive. Em outros casos, ela também pode indicar arquivo inexistente, conta sem acesso ou ausência de uma chave de recurso exigida pelo Drive. O texto sozinho não confirma qual dessas situações ocorreu.

## Escolher quem pode receber e enviar

| Configuração do arquivo | Resultado no aplicativo |
| --- | --- |
| Restrito | Somente contas com acesso concedido conseguem vincular o arquivo. |
| Qualquer pessoa com o link — Leitor | A pessoa conecta sua conta Google, vincula e recebe o catálogo. O envio fica bloqueado quando o Drive informa que ela não pode modificar o conteúdo. |
| Qualquer pessoa com o link — Editor | A pessoa conecta sua conta Google, vincula, recebe e pode enviar alterações para a cópia compartilhada. |

O papel do Drive controla o arquivo remoto. Um leitor pode editar os Produtos recebidos no catálogo local, mas não pode enviar essas alterações ao arquivo sem permissão de edição. Receber depende de o Drive permitir o download do JSON; se o proprietário bloquear downloads para leitores, a importação no aplicativo também fica impedida.

## Liberar leitura ou edição por link

Na conta proprietária:

1. Abra [Configurações do aplicativo](https://lista-de-materiais.com.br/configuracoes), conecte o Google e localize o vínculo do arquivo desejado. **Encontrar meu arquivo** procura apenas arquivos próprios chamados `lista-de-materiais.json`; destinatários usam o link recebido.
2. Use **Abrir arquivo no Google Drive** junto ao link do arquivo vinculado.
3. No Drive, abra **Compartilhar**. Em **Acesso geral**, selecione **Qualquer pessoa com o link**.
4. Escolha **Leitor** para permitir recebimento ou **Editor** para permitir também envio. Clique em **Concluído** para salvar.
5. Volte ao aplicativo, clique em **Verificar alterações** e use **Copiar link do aplicativo**. Encaminhe esse link para as pessoas que usarão o catálogo.

Com Editor no acesso geral, qualquer pessoa que obtenha o link e conecte uma conta autorizada no aplicativo poderá enviar uma cópia completa para esse arquivo. As opções de acesso e os papéis são definidos pelo [compartilhamento do Google Drive](https://support.google.com/drive/answer/2494822?hl=pt-BR).

O formato do link é `https://lista-de-materiais.com.br/configuracoes#drive=<id>`. Quando houver chave de recurso, o link copiado também a inclui como `resourceKey`. O aplicativo aceita tanto `resourceKey` quanto `resourcekey`: preserve o link completo. A [documentação de chaves de recurso do Drive](https://developers.google.com/workspace/drive/api/guides/resource-keys) explica por que algumas contas precisam dessa informação para acessar arquivos compartilhados por link.

## Ter leitores e editores no mesmo arquivo

A permissão pertence ao arquivo e à conta que o acessa. Criar duas URLs para o mesmo ID, ou adicionar um parâmetro como `mode=read`, não produz dois níveis independentes de acesso.

Para combinar os dois níveis, mantenha o acesso geral como **Leitor** e conceda **Editor** aos colaboradores pelo e-mail. Todos podem usar o mesmo link do aplicativo; o Drive informa o acesso efetivo de cada conta. Quem já tiver acesso maior por outra concessão, inclusive pela pasta, conserva esse acesso. Se a opção de acesso geral for **Editor**, uma segunda URL não restringirá seus portadores à leitura. Consulte as [regras de permissões do Drive](https://support.google.com/drive/answer/2494822?hl=pt-BR).

## Abrir na conta destinatária

1. Abra o link completo do aplicativo recebido e conecte a conta Google que usará o arquivo.
2. Confira o campo **Link ou ID do arquivo compartilhado** e clique em **Vincular arquivo**. Essa ação consulta e valida o JSON; o catálogo local continua como estava.
3. Se precisar preservar o catálogo atual, faça uma exportação JSON local antes de receber.
4. Clique em **Receber dados**, leia o aviso, marque a confirmação e confirme o recebimento. Produtos, Receitas, Listas e entradas deste aparelho serão substituídos em uma transação pelo conteúdo validado.
5. Se for editor, altere o catálogo local e use **Enviar dados** quando quiser atualizar a cópia compartilhada. Os demais participantes precisarão escolher **Receber dados** para trazer essa versão aos seus aparelhos.

O recebimento recupera o catálogo dentro do aplicativo; ele não cria um novo download separado no computador. A sincronização é manual, sem mesclagem nem edição colaborativa em tempo real. Quando há conflito, a pessoa escolhe receber a cópia remota, substituir o Drive ou cancelar. Envios simultâneos ainda podem se sobrescrever quando não há uma precondição aceita pelo Drive.

## Se o arquivo continuar inacessível

Confira primeiro se o arquivo abre no próprio Drive com a conta destinatária. Se não abrir, revise o compartilhamento na conta proprietária e copie novamente o link completo do Drive. Cole esse link no aplicativo para preservar a chave de recurso, quando houver.

Se abrir no Drive, confira a conta exibida no aplicativo. Desconecte e conecte novamente quando a autorização tiver expirado ou ainda usar o escopo antigo `drive.file`. A integração atual usa `drive`, `openid` e `email`, com tokens somente em memória; ampliar os escopos OAuth não concede, por si só, acesso ao arquivo privado de outra pessoa. A [configuração OAuth no README](../README.md#compartilhar-pelo-google-drive) descreve a autorização do aplicativo.

Quando uma permissão mudar, use **Verificar alterações** na conta destinatária para atualizar o acesso apresentado. Se a organização impedir compartilhamento externo, a configuração deve ser revista pelo administrador do Google Workspace. Se o Drive recusar o download para leitores, o proprietário precisa permiti-lo nas configurações de compartilhamento. Essas restrições fazem parte das [opções de compartilhamento do Drive](https://support.google.com/drive/answer/2494822?hl=pt-BR).

Uma falha de rede, acesso ou validação não deve substituir o catálogo nem o vínculo anterior. Não crie outro arquivo automaticamente para contornar uma falha ao vincular.

## Como testar com duas contas

Use um catálogo de teste e perfis separados do navegador, para que as duas contas tenham também IndexedDBs separados. Faça exportações locais antes de qualquer substituição.

1. **Arquivo privado:** na conta A, crie a cópia no Drive e mantenha o acesso restrito. Na conta B, sem acesso concedido, tente vincular o link. Espere o erro de acesso e confirme que o catálogo e eventual vínculo anterior de B permanecem intactos.
2. **Leitura por link:** na conta A, altere o acesso geral para Leitor, permitindo download, e copie o link atualizado. Na conta B, vincule. Confirme que o catálogo não mudou, cancele uma tentativa de recebimento e verifique novamente. Depois, receba com a confirmação marcada; o catálogo deve corresponder à cópia remota e **Enviar dados** deve estar desabilitado.
3. **Edição por link:** na conta A, mude o acesso geral para Editor. Na conta B, use **Verificar alterações**, edite um dado de teste e envie. Na conta A, receba a cópia com confirmação e confira a alteração.
4. **Leitura geral com editor específico:** na conta A, volte o acesso geral para Leitor e conceda Editor ao e-mail de B. Após nova consulta, B deve continuar podendo enviar pelo mesmo link. Para conferir o caso de um leitor sem concessão individual, remova essa concessão de B e consulte novamente; o envio deve ficar bloqueado.
5. **Conflito:** com B novamente como editor, receba a mesma referência nas duas contas e faça alterações locais diferentes. Envie por A e tente enviar por B. Espere a escolha explícita entre as cópias; cancelar deve preservar as alterações locais de B e a cópia remota enviada por A.

Este roteiro é uma verificação manual a executar após ajustar o compartilhamento. O diagnóstico do arquivo privado e os testes automatizados da integração não substituem a execução desse fluxo com duas contas reais.
