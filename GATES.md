# Gates: Perfis locais isolados

OWNS: src/**, docs/**, package.json, CHANGELOG.md

Scope: implementar Perfis locais isolados com migração Dexie, rotas, gestão de dados e sincronização Drive por Perfil.

Estado: implementação e verificação realizadas em 2026-09-14.

- [x] G1: o schema e os serviços persistem Perfis isolados e migram uma base v7 sem perder dados
  CHECK: pnpm exec vitest run src/db/database.test.ts src/db/migration.test.ts
  EXPECT: Tests passed
  EVIDENCE: database.test.ts cobre isolamento A/B e gestão de Perfis; migration.test.ts cobre base nova e upgrade real v7→v8 preservando catálogo, meta e driveSync

- [x] G2: a aplicação compila com todas as rotas e componentes separados por Perfil
  CHECK: pnpm typecheck
  EXPECT: tsc
  EVIDENCE: tsc -b sem erros

- [x] G3: lint, build e a suíte completa passam
  CHECK: pnpm test && pnpm lint && pnpm build
  EXPECT: ✓ built in / Tests passed
  EVIDENCE: 23 arquivos e 98 testes aprovados; oxlint sem warnings ou erros; vite build concluído com sucesso (apenas avisos não bloqueantes de tamanho de chunk e configuração PWA)

- [x] G4: os fluxos críticos de troca de Perfil, importação, demonstração e Drive mantêm o isolamento
  CHECK: pnpm test
  EXPECT: Tests passed
  EVIDENCE: isolamento A→B validado em database.test.ts; demonstração aberta em Perfil separado «Demonstração»; HomePage.test.tsx e GuidePage.test.tsx cobrem isolamento de demo, limpeza e importação; o Drive é coberto pelos testes de painel e sincronização

- [x] G5: a implementação foi revisada manualmente contra o ADR e o planejamento
  EVIDENCE: revisão frente a docs/planejamento-perfis-locais.md e docs/adr/0001-perfis-locais-e-sincronizacao.md; sem escopo de login ou sincronização automática

## Desvios conhecidos e fora deste corte

- A demonstração abre um Perfil separado «Demonstração» desde Configurações e desde o guia, sem sobrescrever o catálogo corrente. Se esse Perfil já existe, a ação apenas o abre.
- A descoberta de arquivos do Drive busca arquivos próprios pelo prefixo `Lista de Materiais - ` e pelo nome legado exato `lista-de-materiais.json`; os novos arquivos levam o nome do Perfil e uma `appProperty` privada do aplicativo. Vários resultados exigem seleção explícita.
- Não há login, backend, sincronização automática, backup integral multi-Perfil, permissões por Perfil nem cópia do vínculo Drive ao duplicar dados; esses itens ficam fora deste corte.
