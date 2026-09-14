---
status: accepted
---

# Perfis locais como raiz do catálogo e do vínculo Drive

O banco Dexie continuará único e local, mas Produtos, Receitas, Listas, metadados e o vínculo do Google Drive passarão a pertencer a um Perfil local identificado por uma chave interna. A identidade dos códigos permanece relativa ao Perfil, o JSON/Drive continua sendo um snapshot v1 de um Perfil, e a sessão Google permanece global e somente em memória. Escolhemos stores novas com chaves compostas e migração transacional porque trocar as chaves primárias das stores existentes colocaria em risco os dados legados; manter um arquivo Drive por Perfil evita que catálogos locais independentes disputem silenciosamente o mesmo remoto.
