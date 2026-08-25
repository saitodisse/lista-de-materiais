import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, BookOpenCheck, Download, PackagePlus, Trash2, Upload } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { EmptyState, ErrorNotice, PageHeader } from '../components/Page'
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
  return <div className="page home-page"><PageHeader eyebrow="controle local" title="Materiais, sem ruído." description="Fichas de Produto, receitas e BOMs guardadas somente neste aparelho." />
    <section className="control-panel">
      <div className="panel-label">CATÁLOGO LOCAL / 01</div>
      <div className="panel-stats"><div><strong>{data.products}</strong><span>Produtos</span></div><div><strong>{data.lists}</strong><span>Listas</span></div></div>
      <p>Monte uma receita com componentes existentes. Quando precisar, uma Lista transforma os Produtos desejados em materiais terminais consolidados.</p>
      <div className="panel-actions"><Link to="/produtos/novo" className="button primary"><PackagePlus size={18} /> Novo Produto</Link><Link to="/listas/nova" className="button inverse"><BookOpenCheck size={18} /> Nova Lista</Link></div>
    </section>
    {data.products === 0 ? <EmptyState title="Comece pela primeira ficha" action={<Link to="/produtos/novo" className="button primary">Cadastrar Produto</Link>}>Nada sai deste navegador. Cadastre materiais e depois relacione-os em receitas.</EmptyState> : <section className="quick-grid"><Link to="/produtos" className="quick-card"><span>01</span><h2>Catálogo</h2><p>Consulte códigos, unidades, custo, peso e receita.</p><ArrowRight size={20} /></Link><Link to="/listas" className="quick-card"><span>02</span><h2>Listas</h2><p>Peça quantidades e acompanhe a árvore BOM.</p><ArrowRight size={20} /></Link></section>}
    <section className="demo-note"><div><p className="eyebrow">cópia local</p><h2>Exportar ou substituir dados</h2><p>O JSON inclui Produtos, Receitas e Listas. A importação substitui todos os dados deste aparelho.</p></div><div className="data-actions"><button type="button" className="button quiet" onClick={() => void downloadExport()}><Download size={17} /> Exportar JSON</button><button type="button" className="button quiet" disabled={isImporting} onClick={() => importInput.current?.click()}><Upload size={17} /> {isImporting ? 'Importando…' : 'Importar JSON'}</button><input ref={importInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /></div></section>
    <section className="demo-note demo-control"><div><p className="eyebrow">{hasDemo ? 'dados deste aparelho' : 'demonstração opcional'}</p><h2>{hasDemo ? 'Limpar todos os dados' : 'Adicionar a demonstração de pizzas'}</h2><p>{hasDemo ? 'Apaga Produtos, Listas e entradas deste aparelho.' : 'Inclui matérias-primas, massa e molho semiacabados, pizza unitária, embalagem, Produto final e uma Lista.'}</p></div><button type="button" className="button quiet" disabled={isChangingDemo} onClick={() => void changeDemo()}>{hasDemo ? <Trash2 size={16} /> : <PackagePlus size={16} />} {isChangingDemo ? 'Aguarde…' : hasDemo ? 'Limpar tudo' : 'Adicionar demonstração'}</button></section>
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </div>
}
