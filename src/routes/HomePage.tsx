import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import { ErrorNotice, PageHeader } from '../components/Page'
import { db, exportLocalData, importLocalData } from '../db/database'
import { DemoResetButton } from '../features/demo/DemoResetButton'

export function HomePage() {
  const data = useLiveQuery(async () => ({ products: await db.products.count(), lists: await db.materialLists.count(), demo: await db.meta.get('demo-state') }))
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)
  if (!data) return <p className="loading-state">Preparando os dados neste aparelho…</p>
  const hasDemo = data.demo?.value === 'inserted'
  const downloadExport = async () => {
    setError(null)
    try {
      const dataToExport = await exportLocalData()
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lista-de-materiais-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível exportar os dados locais.') }
  }
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm('Importar substituirá todos os Produtos, Receitas, Listas e entradas deste aparelho. Deseja continuar?')) return

    setError(null)
    setIsImporting(true)
    try { await importLocalData(JSON.parse(await file.text())) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível importar o arquivo.') }
    finally { setIsImporting(false) }
  }

  return (
    <div className="page detail-page">
      <PageHeader eyebrow="neste aparelho" title="Configurações" description="Gerencie os dados locais, a cópia JSON e a demonstração opcional deste aparelho." />
      <section className="detail-card" aria-label="Resumo dos dados locais">
        <div className="section-heading"><p className="eyebrow">dados locais</p><h2>Conteúdo guardado</h2><p>Produtos e planos de produção ficam somente neste navegador.</p></div>
        <dl className="spec-list"><div><dt>Produtos</dt><dd>{data.products}</dd></div><div><dt>Planos de produção</dt><dd>{data.lists}</dd></div></dl>
      </section>
      <section className="detail-card" data-guide="settings-json" aria-label="Cópia dos dados locais">
        <div className="section-heading"><p className="eyebrow">cópia local</p><h2>Exportar ou importar dados</h2><p>Use o JSON para levar uma cópia a outro aparelho ou recuperar os dados manualmente. Importar substitui o conteúdo deste aparelho.</p></div>
        <div className="data-actions"><button type="button" className="button quiet" data-guide="json-export" onClick={() => void downloadExport()}><Download size={17} /> Exportar JSON</button><button type="button" className="button quiet" data-guide="json-import" disabled={isImporting} onClick={() => importInput.current?.click()}><Upload size={17} /> {isImporting ? 'Importando…' : 'Importar JSON'}</button><input ref={importInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /></div>
      </section>
      <section className="demo-note demo-control">
        <div><p className="eyebrow">{hasDemo ? 'demonstração carregada' : 'demonstração opcional'}</p><h2>{hasDemo ? 'Limpar todos os dados' : 'Carregar a demonstração de pizzas'}</h2><p>{hasDemo ? 'O mesmo controle limpa Produtos, Listas e entradas deste aparelho após a confirmação.' : 'Limpa a base atual e carrega as mesmas matérias-primas, semiacabados, pizza, embalagem, Produto Final e plano usados no guia.'}</p></div>
        <DemoResetButton action={hasDemo ? 'clear' : 'demo'} className="button quiet" label={hasDemo ? 'Limpar tudo' : 'Limpar e carregar demonstração'} />
      </section>
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </div>
  )
}
