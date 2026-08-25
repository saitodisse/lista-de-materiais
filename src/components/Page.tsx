import type { ReactNode } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  backTo,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: { to: string; label: string }
  backTo?: string
}) {
  return (
    <header className="page-header">
      <div>
        {backTo && <Link to={backTo} className="back-link"><ArrowLeft size={17} /> Voltar</Link>}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <Link to={action.to} className="button primary"><Plus size={18} /> {action.label}</Link>}
    </header>
  )
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="empty-state"><div className="empty-rule" /><h2>{title}</h2><p>{children}</p>{action}</section>
}

export function ErrorNotice({ children }: { children: ReactNode }) {
  return <p className="error-notice" role="alert">{children}</p>
}
