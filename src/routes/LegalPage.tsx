import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '../components/Page'

export const LEGAL_UPDATE_DATE = '2026-09-05'

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="page legal-page">
      <PageHeader eyebrow="informações legais" title={title} description={description} />
      <p className="legal-updated">Última atualização: <time dateTime={LEGAL_UPDATE_DATE}>5 de setembro de 2026</time></p>
      {children}
      <nav className="legal-navigation" aria-label="Documentos legais">
        <Link to="/politica-de-privacidade">Política de Privacidade</Link>
        <Link to="/termos-de-servico">Termos de Serviço</Link>
        <Link to="/configuracoes">Voltar para Configurações</Link>
      </nav>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="detail-card legal-section"><h2>{title}</h2>{children}</section>
}
