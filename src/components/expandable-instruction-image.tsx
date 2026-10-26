'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/icon'
import styles from './expandable-instruction-image.module.css'

interface ExpandableInstructionImageProps {
  src: string
  mobileSrc?: string
  alt: string
  captionColor?: string
  children: ReactNode
}

const ZOOM_LEVELS = [1, 1.5, 2, 3]

export function ExpandableInstructionImage({ src, mobileSrc, alt, captionColor, children }: ExpandableInstructionImageProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [fullSource, setFullSource] = useState('')
  const [zoomIndex, setZoomIndex] = useState(0)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [imageError, setImageError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const loading = !naturalSize.width && !imageError
  const fit = naturalSize.width && viewportSize.width
    ? Math.max(0, Math.min((viewportSize.width - 32) / naturalSize.width, (viewportSize.height - 32) / naturalSize.height, 1))
    : 0
  const imageWidth = Math.max(1, Math.round(naturalSize.width * fit * ZOOM_LEVELS[zoomIndex]))
  const imageHeight = Math.max(1, Math.round(naturalSize.height * fit * ZOOM_LEVELS[zoomIndex]))

  function openImage() {
    setFullSource(mobileSrc && window.matchMedia('(max-width: 767px)').matches ? mobileSrc : src)
    setNaturalSize({ width: 0, height: 0 })
    setViewportSize({ width: 0, height: 0 })
    setImageError(false)
    setZoomIndex(0)
    setAttempt(0)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
      if (event.key !== 'Tab') return
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') || []).filter(element => element.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (!first) { event.preventDefault(); return }
      const outside = !dialogRef.current?.contains(document.activeElement)
      if (event.shiftKey && (outside || document.activeElement === first)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (outside || document.activeElement === last)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', keyboard)
      if (triggerRef.current?.getClientRects().length) triggerRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open || !viewportRef.current) return
    const viewport = viewportRef.current
    const measure = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight })
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(viewport)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open])

  useEffect(() => {
    if (!open || !viewportRef.current) return
    const viewport = viewportRef.current
    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2)
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2)
  }, [open, imageWidth, imageHeight])

  return <>
    <button ref={triggerRef} type="button" className={styles.trigger} onClick={openImage} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-dialog`} aria-label={`Ampliar imagen: ${alt}`}>
      {children}
      <span className={styles.caption} style={{ color: captionColor }}><Icon name="search" className="h-4 w-4" aria-hidden="true" />Ampliar imagen</span>
    </button>
    {open && createPortal(<div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section ref={dialogRef} id={`${id}-dialog`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`} className={styles.dialog}>
        <header className={styles.header}><div className={styles.heading}><p className={styles.eyebrow}>Guía paso a paso</p><h2 id={`${id}-title`} className={styles.title}>{alt}</h2></div><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar imagen ampliada" className={styles.close}><Icon name="close" className="h-5 w-5" /></button></header>
        <div className={styles.toolbar} role="group" aria-label="Controles de ampliación"><button type="button" className={styles.control} onClick={() => setZoomIndex(index => Math.max(0, index - 1))} disabled={loading || imageError || zoomIndex === 0} aria-label="Reducir ampliación" title="Reducir ampliación">−</button><span className={styles.percentage} role="status" aria-label="Nivel de ampliación">{Math.round(ZOOM_LEVELS[zoomIndex] * 100)} %</span><button type="button" className={styles.control} onClick={() => setZoomIndex(index => Math.min(ZOOM_LEVELS.length - 1, index + 1))} disabled={loading || imageError || zoomIndex === ZOOM_LEVELS.length - 1} aria-label="Ampliar imagen" title="Ampliar imagen">+</button><button type="button" className={styles.reset} disabled={loading || imageError || zoomIndex === 0} onClick={() => setZoomIndex(0)}>Ajustar a pantalla</button></div>
        <div ref={viewportRef} className={styles.viewport} tabIndex={0} aria-label="Imagen ampliada, desplazable cuando se aplica zoom" aria-busy={loading}>
          {loading && <p role="status" className={styles.status}>Cargando imagen…</p>}
          {imageError ? <div role="alert" className={styles.error}><p>No pudimos cargar la imagen ampliada.</p><button type="button" className={styles.reset} onClick={() => { setImageError(false); setNaturalSize({ width: 0, height: 0 }); setAttempt(value => value + 1) }}>Reintentar</button></div> : <div className={styles.canvas}>
            <img key={`${fullSource}-${attempt}`} src={fullSource} alt={alt} decoding="async" draggable={false} onLoad={event => { setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) }} onError={() => setImageError(true)} className={styles.image} style={{ width: imageWidth, height: imageHeight, visibility: loading ? 'hidden' : 'visible' }} />
          </div>}
        </div>
        <p id={`${id}-help`} className={styles.help}>Usá + para ampliar y desplazate por la imagen para leer los detalles.</p>
      </section>
    </div>, document.body)}
  </>
}
