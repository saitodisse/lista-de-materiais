# Gates: tutorial conectado à demonstração local

OWNS: src/features/demo/**, src/features/guide/**, src/routes/GuidePage.tsx, src/routes/GuidePage.test.tsx, src/routes/HomePage.tsx, src/routes/HomePage.test.tsx, src/db/database.ts, src/db/database.test.ts, src/index.css, GATES.md

Scope: substituir com confirmação toda a base pela demonstração oficial de pizzas e fazer o guia abrir exatamente os Produtos e o plano carregados.

- [x] G0: o ledger contém gates válidos e verificáveis
  CHECK: node /home/saito/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/saito/_git/lista-de-materiais; path=2b294d9d45eb/20 entries; EXPECT=matched; output-sha256=45f2f0b23659d603aebd358a717e9093af5a69c8ff812ab8199510941e171ecc; output-bytes=150

- [x] G1: a substituição transacional e o tutorial conectado à demonstração passam nos testes focados
  CHECK: pnpm exec vitest run src/db/database.test.ts src/routes/GuidePage.test.tsx src/routes/HomePage.test.tsx && node -e "process.stdout.write('targeted-demo-flow-ok')"
  EXPECT: targeted-demo-flow-ok
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/saito/_git/lista-de-materiais; path=2b294d9d45eb/20 entries; EXPECT=matched; output-sha256=7a2af3f6d4c5a8e7c11c8cf88836602b24f74c565109896da0078bfbdd9df849; output-bytes=247

- [x] G2: todos os testes do aplicativo passam com o novo fluxo
  CHECK: pnpm test && node -e "process.stdout.write('full-suite-ok')"
  EXPECT: full-suite-ok
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/saito/_git/lista-de-materiais; path=2b294d9d45eb/20 entries; EXPECT=matched; output-sha256=8159dbe95ca0ae18f26ea1820501ffc25589ee8f24f5db90e36e2d4ff13e05b7; output-bytes=324

- [x] G3: tipos, lint e build de produção aceitam a integração completa
  CHECK: pnpm typecheck && pnpm lint && pnpm build && node -e "process.stdout.write('static-and-build-ok')"
  EXPECT: static-and-build-ok
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/saito/_git/lista-de-materiais; path=2b294d9d45eb/20 entries; EXPECT=matched; output-sha256=1975a2a1f482eb3827674f2064b9128020a502cc7f8eb26d1f13018922bad778; output-bytes=2172

- [x] G4: o fluxo real no navegador exige o checkbox, substitui dados e abre registros da demonstração
  EVIDENCE: agent-browser sessions demo-flow, guide-new-tabs, guide-index, guide-single, guide-properties, guide-code, guide-hero, guide-material-compare and guide-demo-cta on 2026-08-31: /como-usar showed the confirmation dialog with the destructive action disabled until the checkbox was checked; confirmation loaded 14 Products and the demo List, /produtos/massa-de-pizza opened the persisted Massa de pizza record, and /listas/demo-lista-pacote-3-pizzas-mucarela opened the persisted plan. /configuracoes showed the same control as “Limpar tudo” when the demo was present, with its own checkbox confirmation. Clicking Massa de pizza opened the record in a second tab while the original tutorial remained open. The final guide used one computed grid column for every main layout at 1440px and 390px; its reading column measured 840px on desktop and 339px on mobile, body copy measured 18px, the level image measured 339x250px on mobile, and no horizontal overflow occurred. Clicking Nível 2 kept the route, changed the hash to #massa, updated aria-current, and moved from scrollY 0 through 9 to 5208 with computed scroll-behavior smooth. The properties block exposed ten separate explanatory cards matching the Product form, the four level descriptions were expanded, and the Product registration tour button was absent from the guide in both desktop and mobile checks. In the plan tree, the root code grew from 130x28px over two lines to 158x14px on one line inside a 220px desktop allowance; mobile retained the safe 130px wrapping behavior with no horizontal overflow. The former #entenda concept section became a single demo-loading hero with one button and no aside at 840px desktop and 339px mobile; its modal still required the unchecked confirmation checkbox before enabling the destructive action. The Código property example became a complete sentence explaining the pizza slug and the absence of spaces, accents and uppercase letters; it rendered in a 49px/611px example row on desktop and a 251px single column on mobile without horizontal overflow. The material comparison showed exactly three terminal raw materials and two decomposable semi-finished products, kept compact links to the other six raw materials, and therefore preserved links to all 14 persisted demo Products. At 390px it rendered five cards, two semantic groups and six supplemental links in one column with document scrollWidth equal to clientWidth and no browser errors. The demo CTA became a full-width orange action inside a light safety panel, measured 676x68px on desktop and 255x95px on mobile, preserved equal document scrollWidth and clientWidth, and opened the confirmation modal with the checkbox unchecked and the destructive button disabled.
