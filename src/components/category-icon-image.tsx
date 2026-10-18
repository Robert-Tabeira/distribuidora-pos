'use client'

import { useEffect, useRef, useState } from 'react'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const ALLOWED_ELEMENTS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])
const ALLOWED_ATTRIBUTES = new Set([
  'viewbox', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
  'transform', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'fill-rule', 'clip-rule',
  'opacity', 'fill-opacity', 'stroke-opacity', 'vector-effect', 'preserveaspectratio', 'xmlns'
])
const SAFE_STYLE_PROPERTIES = new Set(['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity'])

function sanitizedSvg(source: string, extraStroke: number, displayWidth: number) {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  const root = document.documentElement
  if (root.localName.toLowerCase() !== 'svg' || document.querySelector('parsererror')) return ''
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/)
  const viewBoxWidth = Number.parseFloat(viewBox?.[2] || '') || Number.parseFloat(root.getAttribute('width') || '') || 24
  const scaledStrokeIncrease = extraStroke * viewBoxWidth / Math.max(1, displayWidth)

  function cleanElement(element: Element): boolean {
    if (!ALLOWED_ELEMENTS.has(element.localName.toLowerCase())) return false

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      if (name === 'style') {
        for (const declaration of attribute.value.split(';')) {
          const [rawProperty, ...rawValue] = declaration.split(':')
          const property = rawProperty?.trim().toLowerCase()
          const value = rawValue.join(':').trim()
          if (property && SAFE_STYLE_PROPERTIES.has(property) && value && !/url\s*\(|expression\s*\(|javascript:/i.test(value) && !element.hasAttribute(property)) {
            element.setAttribute(property, value)
          }
        }
        element.removeAttribute(attribute.name)
      } else if (!ALLOWED_ATTRIBUTES.has(name) || name.startsWith('on')) {
        element.removeAttribute(attribute.name)
      }
    }

    for (const child of Array.from(element.children)) {
      if (!cleanElement(child)) child.remove()
    }

    const fill = element.getAttribute('fill')
    if (fill && fill.toLowerCase() !== 'none' && fill.toLowerCase() !== 'transparent') element.setAttribute('fill', 'currentColor')
    const stroke = element.getAttribute('stroke')
    if (stroke && stroke.toLowerCase() !== 'none' && stroke.toLowerCase() !== 'transparent') element.setAttribute('stroke', 'currentColor')
    return true
  }

  if (!cleanElement(root)) return ''

  function increaseStroke(element: Element, inheritedStroke: boolean, inheritedWidth: string | null) {
    const ownStroke = element.getAttribute('stroke')
    const hasStroke = ownStroke ? ownStroke.toLowerCase() !== 'none' : inheritedStroke
    const ownWidth = element.getAttribute('stroke-width')
    const currentWidth = ownWidth || inheritedWidth

    if (hasStroke && (ownStroke !== null || ownWidth !== null)) {
      const width = Number.parseFloat(currentWidth || '1')
      if (Number.isFinite(width)) element.setAttribute('stroke-width', String(Math.max(0.25, width + scaledStrokeIncrease)))
    }

    const nextWidth = element.getAttribute('stroke-width') || inheritedWidth
    for (const child of Array.from(element.children)) increaseStroke(child, hasStroke, nextWidth)
  }

  increaseStroke(root, false, null)
  root.setAttribute('xmlns', SVG_NAMESPACE)
  root.setAttribute('width', '100%')
  root.setAttribute('height', '100%')
  root.setAttribute('aria-hidden', 'true')
  return new XMLSerializer().serializeToString(root)
}

function isSvgUrl(src: string) {
  try {
    return new URL(src, 'https://local.invalid').pathname.toLowerCase().endsWith('.svg')
  } catch {
    return false
  }
}

export function CategoryIconImage({ src, weight = 0, className = '' }: { src: string; weight?: number; className?: string }) {
  const [svgMarkup, setSvgMarkup] = useState('')
  const [displayWidth, setDisplayWidth] = useState(24)
  const iconRef = useRef<HTMLSpanElement>(null)
  const svg = isSvgUrl(src)

  useEffect(() => {
    if (!svg || !svgMarkup || !iconRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width && width > 0) setDisplayWidth(current => Math.abs(current - width) < 0.5 ? current : width)
    })
    observer.observe(iconRef.current)
    return () => observer.disconnect()
  }, [src, svg, svgMarkup])

  useEffect(() => {
    if (!svg) {
      setSvgMarkup('')
      return
    }
    let active = true
    async function load() {
      try {
        const response = await fetch(src)
        if (!response.ok) return
        const text = await response.text()
        if (text.length > 1_000_000) return
        const markup = sanitizedSvg(text, Math.max(0, Math.min(6, weight)), displayWidth)
        if (active) setSvgMarkup(markup)
      } catch {
        if (active) setSvgMarkup('')
      }
    }
    void load()
    return () => { active = false }
  }, [src, svg, weight, displayWidth])

  if (svg) {
    return svgMarkup
      ? <span ref={iconRef} className={`category-inline-svg block ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      : <span aria-hidden="true" className={`category-custom-icon block ${className}`} style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }} />
  }

  return <span aria-hidden="true" className={`category-custom-icon block ${className}`} style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }} />
}
