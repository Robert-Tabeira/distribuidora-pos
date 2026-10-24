import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PublicLayout } from '@/components/public-layout'
import { LEGAL_DATE_LABEL, LEGAL_DETAILS, LEGAL_LINKS, LEGAL_READY } from '@/lib/legal-details'
import styles from './legal-page.module.css'

export function legalMetadata(title: string): Metadata {
  return { title: `${title} | ${LEGAL_DETAILS.tradingName}`, description: `${title} del sitio de ${LEGAL_DETAILS.tradingName}.`, robots: { index: LEGAL_READY, follow: true } }
}

export function LegalPage({ title, introduction, children }: { title: string; introduction: string; children: ReactNode }) {
  return <PublicLayout><main className={styles.page}><div className={styles.inner}>
    <Link href="/landing" className="text-sm text-[#687049]">← Volver a Los Primos</Link>
    <p className={styles.eyebrow}>Información del sitio</p><h1 className={styles.title}>{title}</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#776b5b]">{introduction}</p>
    <p className="mt-3 text-xs text-[#847966]">Versión: {LEGAL_DATE_LABEL}</p>
    <nav className={styles.nav} aria-label="Páginas legales">{LEGAL_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    {!LEGAL_READY && <aside className={styles.draft}><strong>Borrador para revisión del negocio.</strong> Los campos pendientes deben completarse antes de publicarlo como definitivo.</aside>}
    <article className={styles.article}>{children}</article>
  </div></main></PublicLayout>
}

export function LegalResponsibleDetails() {
  return <dl className={styles.details}>
    <dt>Nombre comercial</dt><dd>{LEGAL_DETAILS.tradingName}</dd>
    <dt>Responsable / razón social</dt><dd>{LEGAL_DETAILS.legalName || <span className={styles.pending}>Pendiente de confirmar por el negocio</span>}</dd>
    <dt>Domicilio del responsable</dt><dd>{LEGAL_DETAILS.registeredAddress || <span className={styles.pending}>Pendiente de confirmar</span>}</dd>
    <dt>Contacto de privacidad</dt><dd>{LEGAL_DETAILS.privacyContact ? (LEGAL_DETAILS.privacyContactHref ? <a href={LEGAL_DETAILS.privacyContactHref}>{LEGAL_DETAILS.privacyContact}</a> : LEGAL_DETAILS.privacyContact) : <span className={styles.pending}>Medio de contacto pendiente de confirmar</span>}</dd>
  </dl>
}
