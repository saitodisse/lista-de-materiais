import { useEffect, useRef, useState } from 'react'
import { Cloud, Copy, ExternalLink, FilePlus2, FolderOpen, LogOut, RefreshCw, Send, Upload, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { DriveSyncRecord } from '../../db/database'
import { ErrorNotice } from '../../components/Page'
import { disconnectGoogleDrive, getGoogleAccessToken, getGoogleAccountEmail, hasGoogleConnectionPreference, isGoogleConnected, restoreGoogleDrive } from './auth'
import { describeDriveApiError, DriveApiError } from './client'
import { chooseDriveFile } from './picker'
import { parseDriveReference } from './links'
import { attachDriveFile, connectAndGetAccount, createDriveShare, disconnectDriveShare, getDriveAppLink, receiveDriveShare, refreshDriveShare, sendDriveShare, DriveSyncConflictError, LocalChangedDuringSyncError, type SyncDecision } from './sync'
import { getDriveSync } from '../../db/database'

function formatDate(value: string | null | undefined): string {
  if (!value) return 'ainda não consultado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function explainError(reason: unknown): string {
  if (reason instanceof LocalChangedDuringSyncError) return reason.message
  if (reason instanceof DriveSyncConflictError) return reason.message
  if (reason instanceof DriveApiError) {
    if (reason.status === 401) return 'A autorização Google expirou. Conecte a conta novamente.'
    if (reason.status === 403) return describeDriveApiError(reason)
    if (reason.status === 404) return 'O Google Drive não encontrou este arquivo para a conta conectada. Confirme o compartilhamento, autorize novamente o acesso Drive e, se o link usar uma chave de recurso, cole o link completo do Drive com resourcekey.'
    if (reason.status === 412) return 'O arquivo foi alterado por outra pessoa durante o envio. Consulte a cópia mais recente e escolha novamente.'
    if (reason.retryable) return 'O Google Drive está temporariamente indisponível ou limitou as solicitações. Tente novamente mais tarde.'
    return reason.message
  }
  return reason instanceof Error ? reason.message : 'Não foi possível concluir a operação no Google Drive.'
}

function driveWebLink(record: DriveSyncRecord): string {
  return `https://drive.google.com/open?id=${encodeURIComponent(record.fileId)}`
}

function initialDriveReference(): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fileId = params.get('drive')
  return fileId ? `https://drive.google.com/open?id=${encodeURIComponent(fileId)}${params.get('resourceKey') ? `&resourceKey=${encodeURIComponent(params.get('resourceKey')!)}` : ''}` : ''
}

function ConfirmationDialog({ title, description, actionLabel, onConfirm, onClose, busy }: { title: string; description: string; actionLabel: string; onConfirm: () => void; onClose: () => void; busy: boolean }) {
  const [confirmed, setConfirmed] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => { checkboxRef.current?.focus() }, [])
  return <div className="confirmation-backdrop">
    <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="drive-confirm-title" aria-describedby="drive-confirm-description">
      <button type="button" className="confirmation-close" aria-label="Fechar confirmação" onClick={onClose} disabled={busy}><X size={18} /></button>
      <div className="confirmation-icon"><Cloud size={24} /></div>
      <p className="eyebrow">confirmação necessária</p>
      <h2 id="drive-confirm-title">{title}</h2>
      <p id="drive-confirm-description">{description}</p>
      <label className="confirmation-check">
        <input ref={checkboxRef} type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={busy} />
        <span>Entendo que esta ação substituirá o conteúdo escolhido.</span>
      </label>
      <div className="confirmation-actions">
        <button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancelar</button>
        <button type="button" className="button primary" onClick={onConfirm} disabled={!confirmed || busy}>{busy ? 'Sincronizando…' : actionLabel}</button>
      </div>
    </section>
  </div>
}

export function DriveSyncPanel() {
  const record = useLiveQuery(() => getDriveSync(), [])
  const [connected, setConnected] = useState(isGoogleConnected())
  const [restoring, setRestoring] = useState(() => !isGoogleConnected() && hasGoogleConnectionPreference())
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [reference, setReference] = useState(initialDriveReference)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'receive' | 'create' | 'conflict-receive' | null>(null)
  const [conflict, setConflict] = useState<DriveSyncConflictError | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!restoring) return
    let active = true
    void restoreGoogleDrive()
      .then((token) => getGoogleAccountEmail(token))
      .then((email) => {
        if (!active) return
        setConnected(true)
        setAccountEmail(email)
      })
      .catch(() => {
        if (!active) return
        setConnected(false)
        setAccountEmail(null)
      })
      .finally(() => {
        if (active) setRestoring(false)
      })
    return () => { active = false }
  }, [restoring])

  const run = async (name: string, operation: () => Promise<void>) => {
    setBusy(name)
    setError(null)
    setSuccess(null)
    try { await operation() }
    catch (reason) {
      if (reason instanceof DriveSyncConflictError) setConflict(reason)
      else setError(explainError(reason))
    }
    finally { setBusy(null) }
  }

  const connect = () => void run('connect', async () => {
    const email = await connectAndGetAccount()
    setConnected(true)
    setRestoring(false)
    setAccountEmail(email)
    setSuccess(email ? `Conectado como ${email}.` : 'Conta Google conectada nesta sessão.')
  })

  const create = () => void run('create', async () => {
    const result = await createDriveShare()
    setReference(result.record.fileId)
    setSuccess('Arquivo criado e enviado ao Google Drive. Configure o compartilhamento no Drive antes de enviar o link.')
    setConfirm(null)
  })

  const attach = () => void run('attach', async () => {
    const parsed = parseDriveReference(reference)
    if (!parsed) throw new Error('Cole um link ou ID válido de um arquivo JSON do Google Drive.')
    const result = await attachDriveFile(parsed)
    setSuccess(`Arquivo “${result.record.fileName ?? 'JSON'}” vinculado. Nenhum dado local foi substituído.`)
  })

  const pick = () => void run('pick', async () => {
    const selected = await chooseDriveFile(getGoogleAccessToken(), parseDriveReference(reference)?.fileId)
    if (!selected) return
    setReference(selected.fileId)
    const result = await attachDriveFile(selected)
    setSuccess(`Arquivo “${result.record.fileName ?? 'JSON'}” vinculado. Nenhum dado local foi substituído.`)
  })

  const refresh = () => void run('refresh', async () => {
    const result = await refreshDriveShare()
    setSuccess(`Consulta concluída. Cópia remota de ${formatDate(result.record.lastRemoteModifiedTime)}.`)
  })

  const receive = () => setConfirm('receive')
  const confirmReceive = () => void run('receive', async () => {
    await receiveDriveShare()
    setConfirm(null)
    setSuccess('Dados recebidos do Google Drive e aplicados neste aparelho.')
  })

  const confirmConflictReceive = () => void run('conflict-receive', async () => {
    await sendDriveShare('receive')
    setConfirm(null)
    setSuccess('Dados recebidos do Google Drive.')
  })

  const send = () => void run('send', async () => {
    const result = await sendDriveShare()
    setSuccess(result.uploaded ? 'Dados enviados ao Google Drive.' : 'As cópias já estavam iguais.')
  })

  const resolveConflict = (decision: SyncDecision) => void run('conflict', async () => {
    await sendDriveShare(decision)
    setConflict(null)
    setSuccess(decision === 'receive' ? 'Dados recebidos do Google Drive.' : 'Arquivo do Drive substituído pelos dados locais.')
  })

  const copyLink = () => void run('copy', async () => {
    if (!record) return
    const current = connected ? (await refreshDriveShare()).record : record
    await navigator.clipboard?.writeText(getDriveAppLink(current))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  })

  const disconnect = () => void run('disconnect', async () => {
    await disconnectDriveShare()
    setSuccess('O vínculo foi removido deste aparelho. O arquivo do Drive permanece intacto.')
  })

  const disconnectAccount = () => {
    disconnectGoogleDrive()
    setConnected(false)
    setRestoring(false)
    setAccountEmail(null)
    setSuccess('A sessão Google foi encerrada neste aparelho.')
  }

  return <section className="detail-card drive-sync-panel" aria-label="Sincronização manual com Google Drive">
    <div className="section-heading">
      <p className="eyebrow">cópia compartilhada opcional</p>
      <h2>Sincronizar com Google Drive</h2>
      <p>O catálogo continua neste aparelho. O Drive guarda uma cópia JSON que só é lida ou substituída quando você pede.</p>
    </div>
    <div className="drive-sync-warning"><strong>Compartilhamento do Drive controla o acesso.</strong> Quem puder editar o arquivo poderá substituir todos os Produtos, Receitas e Listas. O link não é uma senha nem uma forma de criptografia.</div>
    <div className="drive-sync-toolbar">
      <button type="button" className="button secondary" onClick={connect} disabled={busy !== null || restoring}><Cloud size={17} /> {restoring ? 'Reconectando Google…' : connected ? 'Reconectar Google' : 'Conectar Google'}</button>
      {connected && <><span className="drive-account">{accountEmail ?? 'conta conectada nesta sessão'}</span><button type="button" className="button quiet" onClick={disconnectAccount} disabled={busy !== null}>Desconectar conta</button></>}
    </div>
    <div className="drive-sync-create">
      <div><strong>Começar um compartilhamento</strong><p>Cria um arquivo `lista-de-materiais.json` no seu Drive com os dados atuais.</p></div>
      <button type="button" className="button quiet" onClick={() => setConfirm('create')} disabled={!connected || busy !== null}><FilePlus2 size={17} /> Criar arquivo no Drive</button>
    </div>
    <div className="drive-sync-link-form">
      <label htmlFor="drive-file-reference">Link ou ID do arquivo compartilhado</label>
      <div className="drive-sync-input-row"><input id="drive-file-reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="https://drive.google.com/file/d/..." /><button type="button" className="button quiet" onClick={pick} disabled={!connected || busy !== null}><FolderOpen size={17} /> Escolher</button><button type="button" className="button primary" onClick={attach} disabled={!connected || busy !== null || !reference.trim()}><Upload size={17} /> Vincular</button></div>
      <small>Vincular consulta e valida a cópia remota; a importação só acontece depois da confirmação.</small>
    </div>
    {record && <div className="drive-sync-status">
      <div className="drive-sync-status-head"><div><p className="eyebrow">arquivo vinculado</p><strong>{record.fileName ?? record.fileId}</strong><code>{record.fileId}</code><span className="drive-permission-note">{record.canModifyContent === false ? 'somente leitura neste arquivo' : 'permissão de envio disponível'}</span></div><span className="drive-sync-status-actions"><button type="button" className="icon-button" aria-label="Copiar link do aplicativo" title={copied ? 'Link copiado' : 'Copiar link'} onClick={copyLink} disabled={busy !== null}><Copy size={16} /></button><a className="icon-button" aria-label="Abrir arquivo no Google Drive" title="Abrir no Google Drive" href={driveWebLink(record)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a></span></div>
      <dl className="drive-sync-dates"><div><dt>Última cópia remota consultada</dt><dd>{formatDate(record.lastRemoteModifiedTime)}</dd></div><div><dt>Último envio</dt><dd>{formatDate(record.lastUploadedAt)}</dd></div><div><dt>Último recebimento</dt><dd>{formatDate(record.lastDownloadedAt)}</dd></div></dl>
      <div className="data-actions"><button type="button" className="button quiet" onClick={refresh} disabled={!connected || busy !== null}><RefreshCw size={16} /> {busy === 'refresh' ? 'Consultando…' : 'Verificar alterações'}</button><button type="button" className="button quiet" onClick={send} disabled={!connected || busy !== null || record.canModifyContent === false}><Send size={16} /> Enviar dados</button><button type="button" className="button quiet" onClick={receive} disabled={!connected || busy !== null}><Upload size={16} /> Receber dados</button><button type="button" className="button quiet" onClick={disconnect} disabled={busy !== null}><LogOut size={16} /> Desvincular</button></div>
    </div>}
    {success && <p className="drive-sync-success" role="status">{success}</p>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {confirm === 'create' && <ConfirmationDialog title="Criar uma cópia no Drive?" description="Os dados atuais deste aparelho serão enviados para um novo arquivo JSON. O arquivo ficará sujeito às permissões que você configurar no Google Drive." actionLabel="Criar e enviar" onConfirm={create} onClose={() => setConfirm(null)} busy={busy !== null} />}
    {confirm === 'receive' && <ConfirmationDialog title="Substituir os dados deste aparelho?" description="Produtos, Receitas, Listas e entradas locais serão substituídos pelo conteúdo validado do arquivo do Drive. Faça uma cópia JSON local se precisar recuperar o estado atual." actionLabel="Receber dados" onConfirm={confirmReceive} onClose={() => setConfirm(null)} busy={busy !== null} />}
    {confirm === 'conflict-receive' && <ConfirmationDialog title="Receber a cópia remota?" description="A cópia do Drive divergiu da referência anterior. Produtos, Receitas, Listas e entradas locais serão substituídos pelo conteúdo remoto validado." actionLabel="Receber do Drive" onConfirm={confirmConflictReceive} onClose={() => setConfirm(null)} busy={busy !== null} />}
    {conflict && <div className="confirmation-backdrop"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="drive-conflict-title"><button type="button" className="confirmation-close" aria-label="Fechar conflito" onClick={() => setConflict(null)} disabled={busy !== null}><X size={18} /></button><div className="confirmation-icon"><RefreshCw size={24} /></div><p className="eyebrow">cópias diferentes</p><h2 id="drive-conflict-title">Escolha qual cópia prevalece</h2><p>O arquivo remoto mudou desde a última referência conhecida ou ainda não há uma referência neste aparelho.</p><div className="confirmation-actions"><button type="button" className="button secondary" onClick={() => setConflict(null)} disabled={busy !== null}>Cancelar</button><button type="button" className="button secondary" onClick={() => { setConflict(null); setConfirm('conflict-receive') }} disabled={busy !== null}>Receber do Drive</button><button type="button" className="button danger" onClick={() => resolveConflict('overwrite')} disabled={busy !== null}>Substituir o Drive</button></div></section></div>}
  </section>
}
