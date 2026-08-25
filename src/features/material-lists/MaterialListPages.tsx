import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ClipboardList, Edit3, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ErrorNotice, EmptyState, PageHeader } from '../../components/Page'
import { db, deleteMaterialList, saveMaterialList } from '../../db/database'
import { newLocalId, type MaterialList, type MaterialListEntry } from '../../domain/catalog'
import { BomResult } from '../bom/BomResult'
import { calculateBom } from '../bom/calculator'
import { MaterialListForm } from './MaterialListForm'

export function MaterialListsPage() {
  const data = useLiveQuery(async () => ({ lists: await db.materialLists.orderBy('updatedAt').reverse().toArray(), entries: await db.materialListEntries.toArray() }))
  if (!data) return <p className="loading-state">Abrindo as Listas locais…</p>
  const countByList = new Map<string, number>()
  data.entries.forEach((entry) => countByList.set(entry.listId, (countByList.get(entry.listId) ?? 0) + 1))
  return <div className="page"><PageHeader eyebrow="boms locais" title="Listas de Materiais" description="Quantidades desejadas, consolidadas neste aparelho." action={{ to: '/listas/nova', label: 'Nova Lista' }} />
    {data.lists.length === 0 ? <EmptyState title="Nenhuma Lista de Materiais" action={<Link to="/listas/nova" className="button primary">Criar Lista</Link>}>Monte uma Lista para consolidar receitas aninhadas.</EmptyState> : <section className="list-stack">{data.lists.map((list) => <Link to="/listas/$listId" params={{ listId: list.id }} key={list.id} className="list-card"><ClipboardList size={22} /><div><h2>{list.name}</h2><p>{countByList.get(list.id) ?? 0} Produto(s) desejado(s)</p></div><span>Ver BOM →</span></Link>)}</section>}
  </div>
}

export function MaterialListEditorPage() {
  const { listId } = useParams({ strict: false }) as { listId?: string }
  const navigate = useNavigate()
  const data = useLiveQuery(async () => ({ products: await db.products.orderBy('name').toArray(), list: listId ? await db.materialLists.get(listId) : undefined, entries: listId ? await db.materialListEntries.where('listId').equals(listId).toArray() : [] }), [listId])
  if (!data) return <p className="loading-state">Abrindo os dados locais…</p>
  if (listId && !data.list) return <div className="page"><PageHeader title="Lista não encontrada" backTo="/listas" /><ErrorNotice>Essa Lista não existe neste aparelho.</ErrorNotice></div>
  const list = data.list
  return <div className="page editor-page"><PageHeader eyebrow={list ? 'edição' : 'nova lista'} title={list ? `Editar ${list.name}` : 'Nova Lista de Materiais'} description="Informe os Produtos e as quantidades desejadas. Não há datas, lotes ou status." backTo={list ? `/listas/${list.id}` : '/listas'} />
    {data.products.length === 0 ? <EmptyState title="Cadastre um Produto primeiro" action={<Link to="/produtos/novo" className="button primary">Novo Produto</Link>}>Uma Lista de Materiais só pode usar Produtos que existem no catálogo.</EmptyState> : <MaterialListForm list={list} entries={data.entries} products={data.products} onSave={async (name, inputs) => {
      const now = new Date().toISOString()
      const materialList: MaterialList = list ? { ...list, name, updatedAt: now } : { id: newLocalId(), name, createdAt: now, updatedAt: now }
      const entries: MaterialListEntry[] = inputs.map((entry) => ({ ...entry, listId: materialList.id }))
      await saveMaterialList(materialList, entries)
      await navigate({ to: '/listas/$listId', params: { listId: materialList.id } })
    }} />}
  </div>
}

export function MaterialListDetailPage() {
  const { listId } = useParams({ strict: false }) as { listId: string }
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const data = useLiveQuery(async () => ({ list: await db.materialLists.get(listId), entries: await db.materialListEntries.where('listId').equals(listId).toArray(), products: await db.products.toArray() }), [listId])
  const calculation = useMemo(() => {
    if (!data?.list) return null
    try { return { result: calculateBom(data.products, data.entries), error: null } }
    catch (reason) { return { result: null, error: reason instanceof Error ? reason.message : 'Não foi possível calcular esta BOM.' } }
  }, [data])
  if (!data) return <p className="loading-state">Calculando a BOM local…</p>
  if (!data.list) return <div className="page"><PageHeader title="Lista não encontrada" backTo="/listas" /><ErrorNotice>Essa Lista não existe neste aparelho.</ErrorNotice></div>
  const list = data.list
  const remove = async () => {
    setError(null)
    if (!window.confirm(`Excluir a Lista “${list.name}”?`)) return
    try { await deleteMaterialList(list.id); await navigate({ to: '/listas' }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir a Lista.') }
  }
  return <div className="page detail-page"><PageHeader eyebrow="lista local" title={list.name} description={`${data.entries.length} Produto(s) desejado(s) nesta Lista.`} backTo="/listas" />
    <div className="detail-actions list-actions"><Link to="/listas/$listId/editar" params={{ listId: list.id }} className="button secondary"><Edit3 size={17} /> Editar Lista</Link><button type="button" className="button danger" onClick={() => void remove()}><Trash2 size={17} /> Excluir</button></div>
    {calculation?.error ? <ErrorNotice>{calculation.error}</ErrorNotice> : calculation?.result && <BomResult calculation={calculation.result} />}
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </div>
}
