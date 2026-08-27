import { useCallback, useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { hasSeenScreenGuide, markScreenGuideSeen, startGuideTour, stopGuideTour, type ScreenGuideTopic } from './tours'

export function GuideHelpButton({ topic }: { topic: ScreenGuideTopic }) {
  const [opening, setOpening] = useState(false)
  const openingRef = useRef(false)
  const mountedRef = useRef(false)

  const open = useCallback(async () => {
    if (openingRef.current) return
    openingRef.current = true
    setOpening(true)
    try {
      const tour = await startGuideTour(topic)
      if (tour && mountedRef.current) markScreenGuideSeen(topic)
      if (tour && !mountedRef.current) stopGuideTour()
    } catch {
      // A ajuda manual continua disponível se o carregamento do tour falhar.
    } finally {
      openingRef.current = false
      if (mountedRef.current) setOpening(false)
    }
  }, [topic])

  useEffect(() => {
    mountedRef.current = true
    const timer = hasSeenScreenGuide(topic) ? undefined : window.setTimeout(() => { if (mountedRef.current) void open() }, 0)
    return () => {
      mountedRef.current = false
      openingRef.current = false
      if (timer !== undefined) window.clearTimeout(timer)
      stopGuideTour()
    }
  }, [open, topic])

  return <button type="button" className="guide-help-button" aria-label="Abrir ajuda desta tela" aria-busy={opening} title="Abrir ajuda desta tela" disabled={opening} onClick={() => void open()}><HelpCircle size={18} aria-hidden="true" /><span className="sr-only">Ajuda</span></button>
}
