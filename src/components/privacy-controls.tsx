'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRIVACY_CHANGED, PRIVACY_OPEN, PRIVACY_STORAGE_KEY, browserRejectsAnalytics, openPrivacySettings, readPrivacyPreferences, savePrivacyPreferences } from '@/lib/privacy-preferences'
import styles from './privacy-controls.module.css'
import { LEGAL_READY } from '@/lib/legal-details'

export function PrivacySettingsButton({ className = '' }: { className?: string }) {
  return <button type="button" className={className} onClick={openPrivacySettings}>Configurar privacidad</button>
}

export function PrivacyControls() {
  const pathname = usePathname()
  const [notice, setNotice] = useState(false)
  const [open, setOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [maps, setMaps] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [feedback, setFeedback] = useState('')
  const dialog = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const sync = () => { setNotice(!readPrivacyPreferences()); setBlocked(browserRejectsAnalytics()) }
    const show = () => {
      lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const choice = readPrivacyPreferences()
      setAnalytics(choice?.analytics === true && !browserRejectsAnalytics())
      setMaps(choice?.externalMaps === true)
      setBlocked(browserRejectsAnalytics())
      setOpen(true)
    }
    const storage = (event: StorageEvent) => { if (event.key === PRIVACY_STORAGE_KEY || event.key === null) sync() }
    sync()
    window.addEventListener(PRIVACY_OPEN, show)
    window.addEventListener(PRIVACY_CHANGED, sync)
    window.addEventListener('storage', storage)
    window.addEventListener('focus', sync)
    return () => { window.removeEventListener(PRIVACY_OPEN, show); window.removeEventListener(PRIVACY_CHANGED, sync); window.removeEventListener('storage', storage); window.removeEventListener('focus', sync) }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') || [])
      const first = controls[0], last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', key); lastFocus.current?.focus({ preventScroll: true }) }
  }, [open])

  function choose(allowAnalytics: boolean, allowMaps: boolean) {
    const choice = savePrivacyPreferences(allowAnalytics, allowMaps)
    setOpen(false)
    setNotice(false)
    setFeedback(choice.analytics || choice.externalMaps ? 'Preferencias de privacidad guardadas.' : 'Se guardó tu elección: solo almacenamiento necesario.')
  }

  return <>
    <p role="status" className="sr-only">{feedback}</p>
    {notice && !open && <aside className={styles.notice} aria-label="Preferencias de privacidad">
      <h2 className={styles.heading}>Tu privacidad, tu elección</h2>
      <p className={styles.copy}>Usamos almacenamiento para tus listas y tu cuenta. Podés permitir estadísticas para mejorar el catálogo y mapas de Google, o rechazar lo opcional y seguir usando la web. <Link href="/privacidad" className={styles.link}>Política de privacidad</Link>.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => choose(false,false)}>Rechazar opcionales</button>
        <button type="button" className={styles.button} onClick={openPrivacySettings}>Configurar</button>
        {LEGAL_READY && <button type="button" className={styles.button} onClick={() => choose(true,true)}>Aceptar opcionales</button>}
      </div>
      {!LEGAL_READY && <p className={styles.copy}>Las funciones opcionales permanecen apagadas mientras se completa la información de privacidad del negocio.</p>}
    </aside>}
    {open && <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="privacy-title" tabIndex={-1} className={styles.dialog} onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3"><h2 id="privacy-title" className={styles.heading}>Preferencias de privacidad</h2><button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" aria-label="Cerrar preferencias" onClick={() => setOpen(false)}>✕</button></div>
        <p className={styles.copy}>Elegí qué funciones opcionales permitís. Podés cambiar tu elección desde el pie de página.</p>
        <div className={styles.option}><span aria-hidden="true">✓</span><div><strong>Necesarios · Siempre activos</strong><small>Carrito, lista de consultas, acceso a la cuenta y guardado de esta elección. No dependen de aceptar estadísticas.</small></div></div>
        <label className={styles.option}><input type="checkbox" checked={analytics} disabled={blocked || !LEGAL_READY} onChange={event => setAnalytics(event.target.checked)} /><span><strong>Estadísticas para mejorar la web</strong><small>Visitas, búsquedas, productos abiertos y acciones en listas y WhatsApp, con un identificador del navegador. Ayudan a conocer qué productos interesan y mejorar la navegación. Son de uso interno y no se usan para publicidad.</small>{blocked && <small>Tu navegador solicita no ser rastreado. Las estadísticas permanecen apagadas.</small>}</span></label>
        <label className={styles.option}><input type="checkbox" checked={maps} disabled={!LEGAL_READY} onChange={event => setMaps(event.target.checked)} /><span><strong>Mapas externos de Google</strong><small>Permite cargar el mapa interactivo y establecer una conexión con Google. Sin permiso podés seguir leyendo la dirección y abrir el mapa en otra pestaña.</small></span></label>
        {!LEGAL_READY && <p className={styles.copy}>Las opciones se habilitarán cuando esté completa la información de privacidad del negocio.</p>}
        <div className={styles.actions}><button type="button" className={styles.button} onClick={() => choose(false,false)}>Rechazar opcionales</button><button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => choose(analytics,maps)}>Guardar elección</button></div>
        <p className={styles.copy}>La elección se recuerda hasta 180 días en este navegador. <Link href="/privacidad#cookies" onClick={() => setOpen(false)} className={styles.link}>Almacenamiento y preferencias</Link>.</p>
      </div>
    </div>}
  </>
}
