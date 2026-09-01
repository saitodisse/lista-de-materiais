import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, PackagePlus, Trash2, X } from 'lucide-react'
import { clearAllLocalData, replaceAllWithDemo } from '../../db/database'

interface DemoResetButtonProps {
  action?: 'demo' | 'clear'
  className?: string
  label?: string
  onComplete?: () => void
}

export function DemoResetButton({ action = 'demo', className = 'button primary', label, onComplete }: DemoResetButtonProps) {
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
      if (isClear) await clearAllLocalData()
      else await replaceAllWithDemo()
      setOpen(false)
      setConfirmed(false)
      onComplete?.()
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
          <h2 id="demo-reset-title">{isClear ? 'Limpar todos os dados deste aparelho?' : 'Substituir todos os dados deste aparelho?'}</h2>
          <p id="demo-reset-description">{isClear ? 'Todos os Produtos, Receitas, planos de produção e entradas atuais serão apagados. A base ficará vazia.' : 'Todos os Produtos, Receitas, planos de produção e entradas atuais serão apagados. Em seguida, a demonstração completa de pizzas será carregada.'}</p>
          <label className="confirmation-check">
            <input ref={checkboxRef} type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={saving} />
            <span>Entendo que meus dados atuais serão apagados e não poderão ser recuperados sem uma cópia JSON.</span>
          </label>
          {error && <p className="confirmation-error" role="alert">{error}</p>}
          <div className="confirmation-actions">
            <button type="button" className="button secondary" onClick={close} disabled={saving}>Cancelar</button>
            <button type="button" className="button danger" onClick={() => void replaceData()} disabled={!confirmed || saving}>{saving ? isClear ? 'Limpando…' : 'Substituindo…' : isClear ? 'Limpar todos os dados' : 'Limpar e carregar demonstração'}</button>
          </div>
        </section>
      </div>}
    </>
  )
}
