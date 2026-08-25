import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, PackagePlus, Trash2, Upload } from 'lucide-react'
import { ErrorNotice, PageHeader } from '../components/Page'
import { addDemo, clearAllLocalData, db, exportLocalData, importLocalData } from '../db/database'

export function HomePage() {
  const data = useLiveQuery(async () => ({ products: await db.products.count(), lists: await db.materialLists.count(), demo: await db.meta.get('demo-state') }))
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isChangingDemo, setIsChangingDemo] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)
  if (!data) return <p className="loading-state">Preparando os dados neste aparelho…</p>
  const hasDemo = data.demo?.value === 'inserted'
  const changeDemo = async () => {
    setError(null)
    const confirmation = hasDemo
      ? 'Limpar todos os Produtos, Listas e entradas deste aparelho? Esta ação não pode ser desfeita.'
      : 'Adicionar a demonstração de pizzas a este aparelho?'
    if (!window.confirm(confirmation)) return
    setIsChangingDemo(true)
    try {
      if (hasDemo) await clearAllLocalData()
      else await addDemo()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : hasDemo ? 'Não foi possível limpar os dados locais.' : 'Não foi possível adicionar a demonstração.')
    } finally { setIsChangingDemo(false) }
  }
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
      <section className="detail-card" aria-label="Cópia dos dados locais">
        <div className="section-heading"><p className="eyebrow">cópia local</p><h2>Exportar ou importar dados</h2><p>Use o JSON para levar uma cópia a outro aparelho ou recuperar os dados manualmente. Importar substitui o conteúdo deste aparelho.</p></div>
        <div className="data-actions"><button type="button" className="button quiet" onClick={() => void downloadExport()}><Download size={17} /> Exportar JSON</button><button type="button" className="button quiet" disabled={isImporting} onClick={() => importInput.current?.click()}><Upload size={17} /> {isImporting ? 'Importando…' : 'Importar JSON'}</button><input ref={importInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /></div>
      </section>
      <section className="demo-note demo-control">
        <div><p className="eyebrow">{hasDemo ? 'dados de demonstração' : 'demonstração opcional'}</p><h2>{hasDemo ? 'Limpar todos os dados' : 'Adicionar a demonstração de pizzas'}</h2><p>{hasDemo ? 'Apaga Produtos, Listas e entradas deste aparelho.' : 'Inclui matérias-primas, massa e molho semiacabados, pizza unitária, embalagem, Produto final e uma Lista.'}</p></div>
        <button type="button" className="button quiet" disabled={isChangingDemo} onClick={() => void changeDemo()}>{hasDemo ? <Trash2 size={16} /> : <PackagePlus size={16} />} {isChangingDemo ? 'Aguarde…' : hasDemo ? 'Limpar tudo' : 'Adicionar demonstração'}</button>
      </section>
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </div>
  )
}
