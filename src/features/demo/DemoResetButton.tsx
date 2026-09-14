import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, PackagePlus, Trash2, X } from 'lucide-react'
import { clearAllLocalData, getOrCreateDemoProfile, getProfileSummary, replaceAllWithDemo } from '../../db/database'

interface DemoResetButtonProps {
  profileId?: string
  action?: 'demo' | 'clear'
  className?: string
  label?: string
  onComplete?: (profileId: string) => void
}

export function DemoResetButton({ action = 'demo', profileId, className = 'button primary', label, onComplete }: DemoResetButtonProps) {
  const isClear = action === 'clear'
  const defaultLabel = isClear ? 'Limpar todos os dados' : 'Carregar demonstração de pizzas'
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const checkboxRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    if (saving) return
    setOpen(false)
    setConfirmed(false)
    setError(null)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [saving])

  useEffect(() => {
    if (!open) return
    checkboxRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [close, open])

  const replaceData = async () => {
    if (!confirmed || saving) return
    setSaving(true)
    setError(null)
    try {
      if (isClear) {
        await clearAllLocalData(profileId)
        onComplete?.(profileId ?? '')
      } else {
        const demoProfile = await getOrCreateDemoProfile()
        const summary = await getProfileSummary(demoProfile.id)
        if (summary.products === 0) await replaceAllWithDemo(demoProfile.id)
        onComplete?.(demoProfile.id)
      }
      setOpen(false)
      setConfirmed(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : isClear ? 'Não foi possível limpar os dados locais.' : 'Não foi possível carregar a demonstração.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={className} onClick={() => setOpen(true)}>{isClear ? <Trash2 size={17} /> : <PackagePlus size={17} />} {label ?? defaultLabel}</button>
      {open && <div className="confirmation-backdrop">
        <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-reset-title" aria-describedby="demo-reset-description">
          <button type="button" className="confirmation-close" aria-label="Fechar confirmação" onClick={close} disabled={saving}><X size={18} /></button>
          <div className="confirmation-icon"><AlertTriangle size={24} /></div>
          <p className="eyebrow">ação irreversível</p>
          <h2 id="demo-reset-title">{isClear ? `Limpar todos os dados ${profileId ? 'deste Perfil' : 'deste aparelho'}?` : 'Carregar o exemplo no Perfil “Demonstração”?'}</h2>
          <p id="demo-reset-description">{isClear ? `Todos os Produtos, Receitas, planos de produção e entradas ${profileId ? 'deste Perfil serão apagados. Os outros Perfis permanecem intactos.' : 'deste aparelho serão apagados. A base ficará vazia.'}` : 'Será criado ou aberto um Perfil separado “Demonstração” com o exemplo completo de pizzas. O Perfil atual e seus dados não serão modificados.'}</p>
          <label className="confirmation-check">
            <input ref={checkboxRef} type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={saving} />
            <span>{isClear ? `Entendo que todos os dados locais deste ${profileId ? 'Perfil' : 'aparelho'} serão apagados.` : 'Entendo que este controle cria um Perfil “Demonstração” para não substituir o catálogo corrente.'}</span>
          </label>
          {error && <p className="confirmation-error" role="alert">{error}</p>}
          <div className="confirmation-actions">
            <button type="button" className="button secondary" onClick={close} disabled={saving}>Cancelar</button>
            <button type="button" className="button danger" onClick={() => void replaceData()} disabled={!confirmed || saving}>{saving ? isClear ? 'Limpando…' : 'Carregando…' : isClear ? 'Limpar todos os dados' : 'Abrir Perfil Demonstração'}</button>
          </div>
        </section>
      </div>}
    </>
  )
}
