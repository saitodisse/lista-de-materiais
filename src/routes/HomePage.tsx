import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from '@tanstack/react-router'
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { ErrorNotice, PageHeader } from '../components/Page'
import { createProfile, deleteProfile, exportLocalData, getProfiles, getProfileSummary, importLocalData, renameProfile } from '../db/database'
import { DemoResetButton } from '../features/demo/DemoResetButton'
import { DriveSyncPanel } from '../features/drive-sync/DriveSyncPanel'

export function HomePage() {
  const { profileId } = useParams({ strict: false }) as { profileId: string }
  const data = useLiveQuery(() => getProfileSummary(profileId), [profileId])
  const profiles = useLiveQuery(() => getProfiles(), [])
  const [error, setError] = useState<string | null>(null)
  const [clearedProfileId, setClearedProfileId] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)
  if (!data) return <p className="loading-state">Preparando os dados neste aparelho…</p>
  const hasDemo = data.demo === 'inserted' && clearedProfileId !== profileId
  const downloadExport = async () => {
    setError(null)
    try {
      const dataToExport = await exportLocalData(profileId)
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lista-de-materiais-${profileId}-${new Date().toISOString().slice(0, 10)}.json`
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
    if (!window.confirm(profileId ? `Importar substituirá todos os Produtos, Receitas, Listas e entradas do Perfil “${profileId}”. Deseja continuar?` : 'Importar substituirá todos os Produtos, Receitas, Listas e entradas deste aparelho. Deseja continuar?')) return

    setError(null)
    setIsImporting(true)
    try { await importLocalData(JSON.parse(await file.text()), profileId) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível importar o arquivo.') }
    finally { setIsImporting(false) }
  }

  return (
    <div className="page detail-page">
      <PageHeader eyebrow="neste aparelho" title="Configurações" description="Gerencie os dados locais, a cópia JSON e a demonstração opcional deste aparelho." />
      {profiles && <ProfileManager profiles={profiles} currentProfileId={profileId} />}
      <section className="detail-card" aria-label="Resumo dos dados locais">
        <div className="section-heading"><p className="eyebrow">Perfil local</p><h2>Conteúdo guardado</h2><p>Produtos e planos de produção ficam somente neste navegador{profileId ? `, separados no Perfil ${profiles?.find((profile) => profile.id === profileId)?.name ?? profileId}` : ''}.</p></div>
        <dl className="spec-list"><div><dt>Produtos</dt><dd>{data.products}</dd></div><div><dt>Planos de produção</dt><dd>{data.lists}</dd></div></dl>
      </section>
      <section className="detail-card" data-guide="settings-json" aria-label="Cópia dos dados locais">
        <div className="section-heading"><p className="eyebrow">cópia local</p><h2>Exportar ou importar dados</h2><p>Use o JSON para levar uma cópia a outro aparelho ou recuperar os dados manualmente. Importar substitui o conteúdo deste aparelho.</p></div>
        <div className="data-actions"><button type="button" className="button quiet" data-guide="json-export" onClick={() => void downloadExport()}><Download size={17} /> Exportar JSON</button><button type="button" className="button quiet" data-guide="json-import" disabled={isImporting} onClick={() => importInput.current?.click()}><Upload size={17} /> {isImporting ? 'Importando…' : 'Importar JSON'}</button><input ref={importInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /></div>
      </section>
      <DriveSyncPanel profileId={profileId} />
      <section className="demo-note demo-control">
        <div><p className="eyebrow">{hasDemo ? 'demonstração carregada' : 'demonstração opcional'}</p><h2>{hasDemo ? 'Limpar os dados deste Perfil' : 'Abrir o Perfil “Demonstração”'}</h2><p>{hasDemo ? 'O mesmo controle limpa Produtos, Listas e entradas deste Perfil após a confirmação.' : 'Cada Perfil é um espaço isolado. A demonstração será aberta em um Perfil “Demonstração”, sem alterar o Perfil atual.'}</p></div>
        <DemoResetButton action={hasDemo ? 'clear' : 'demo'} profileId={profileId} className="button quiet" label={hasDemo ? 'Limpar este Perfil' : 'Abrir Perfil Demonstração'} onComplete={(dest) => { if (dest === profileId) setClearedProfileId(profileId); else if (dest) window.location.assign(`/perfis/${dest}/produtos`) }} />
      </section>
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </div>
  )
}

function ProfileManager({ profiles, currentProfileId }: { profiles: Awaited<ReturnType<typeof getProfiles>>; currentProfileId: string }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = async () => { setError(null); try { const profile = await createProfile(name); setName(''); window.location.assign(`/perfis/${profile.id}/produtos`) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível criar o Perfil.') } }
  const rename = async (profileId: string, currentName: string) => { const next = window.prompt('Novo nome do Perfil', currentName); if (next === null) return; setError(null); try { await renameProfile(profileId, next) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível renomear o Perfil.') } }
  const remove = async (profileId: string, currentName: string) => { if (!window.confirm(`Excluir o Perfil “${currentName}”? Isso remove apenas os dados locais dele e não apaga o arquivo do Drive.`)) return; setError(null); try { await deleteProfile(profileId); window.location.assign('/'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o Perfil.') } }
  return <section className="detail-card profile-manager" aria-label="Perfis locais"><div className="section-heading"><p className="eyebrow">espaços locais</p><h2>Perfis</h2><p>Cada Perfil tem Produtos, Listas, demonstração e vínculo Drive próprios.</p></div><div className="profile-list">{profiles.map((profile) => <div className={`profile-row${profile.id === currentProfileId ? ' current' : ''}`} key={profile.id}><div><strong>{profile.name}</strong>{profile.id === currentProfileId && <span>Perfil atual</span>}</div><div className="profile-row-actions"><a href={`/perfis/${profile.id}/produtos`} className="button quiet">Abrir</a><button type="button" className="icon-button" aria-label={`Renomear ${profile.name}`} onClick={() => void rename(profile.id, profile.name)}><Pencil size={15} /></button><button type="button" className="icon-button" aria-label={`Excluir ${profile.name}`} onClick={() => void remove(profile.id, profile.name)}><Trash2 size={15} /></button></div></div>)}</div><div className="profile-create"><label htmlFor="new-profile-name">Novo Perfil</label><div><input id="new-profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Loja do centro" /><button type="button" className="button secondary" onClick={() => void create()} disabled={!name.trim()}><Plus size={16} /> Criar Perfil</button></div></div>{error && <ErrorNotice>{error}</ErrorNotice>}</section>
}
