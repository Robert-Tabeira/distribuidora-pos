'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { optimizedImageSource } from '@/lib/site-image-url'

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
  const hasExplicitStroke = Array.from(document.querySelectorAll('*')).some(element => {
    const stroke = element.getAttribute('stroke')
    const style = element.getAttribute('style') || ''
    return (stroke !== null && stroke.toLowerCase() !== 'none') || /(?:^|;)\s*stroke\s*:\s*(?!none\b)/i.test(style)
  })

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
    const drawable = ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'].includes(element.localName.toLowerCase())
    const ownStroke = element.getAttribute('stroke')
    const hasStroke = ownStroke ? ownStroke.toLowerCase() !== 'none' : inheritedStroke
    const ownWidth = element.getAttribute('stroke-width')
    const currentWidth = ownWidth || inheritedWidth

    if (hasStroke && (ownStroke !== null || ownWidth !== null)) {
      const width = Number.parseFloat(currentWidth || '1')
      if (Number.isFinite(width)) element.setAttribute('stroke-width', String(Math.max(0.25, width + scaledStrokeIncrease)))
    } else if (drawable && !hasExplicitStroke && extraStroke > 0 && element.getAttribute('fill')?.toLowerCase() !== 'none') {
      // Many uploaded outline icons are exported as filled paths. Giving those
      // paths a matching stroke is the only reliable way to honor the weight slider.
      element.setAttribute('stroke', 'currentColor')
      element.setAttribute('stroke-width', String(scaledStrokeIncrease))
      element.setAttribute('stroke-linejoin', 'round')
      element.setAttribute('stroke-linecap', 'round')
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

function getSvgRequestUrl(src: string) {
  try {
    const url = new URL(src)
    const prefix = '/storage/v1/object/public/product-images/landing-sections/'
    if (!url.pathname.includes(prefix)) return src
    const file = decodeURIComponent(url.pathname.split(prefix).pop() || '')
    if (!/^[a-zA-Z0-9_-]+\.svg$/i.test(file)) return src
    return `/api/category-icon?file=${encodeURIComponent(file)}`
  } catch {
    return src
  }
}

const svgRequests = new Map<string, Promise<string>>()

function loadSvgSource(src: string): Promise<string> {
  const requestUrl = getSvgRequestUrl(src)
  const cached = svgRequests.get(requestUrl)
  if (cached) return cached

  const request = fetch(requestUrl, { credentials: 'same-origin' })
    .then(async response => {
      if (!response.ok) throw new Error('No se pudo cargar el icono')
      const source = await response.text()
      if (source.length > 1_000_000) throw new Error('El icono es demasiado grande')
      return source
    })
    .catch(error => {
      if (svgRequests.get(requestUrl) === request) svgRequests.delete(requestUrl)
      throw error
    })
  if (svgRequests.size >= 128) svgRequests.delete(svgRequests.keys().next().value!)
  svgRequests.set(requestUrl, request)
  return request
}

export function CategoryIconImage({ src, weight = 0, className = '' }: { src: string; weight?: number; className?: string }) {
  const [nearViewport, setNearViewport] = useState(false)
  const [svgSource, setSvgSource] = useState<{ src: string; text: string } | null>(null)
  const [maskImage, setMaskImage] = useState<{ request: string; url: string } | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, pixelRatio: 1 })
  const iconRef = useRef<HTMLSpanElement>(null)
  const svg = isSvgUrl(src)

  useEffect(() => {
    if (!iconRef.current) return
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true)
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNearViewport(true)
        observer.disconnect()
      }
    }, { rootMargin: '250px' })
    observer.observe(iconRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!nearViewport || !iconRef.current) return
    const measure = () => {
      const width = iconRef.current?.getBoundingClientRect().width || 0
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 3)
      if (width > 0) setDimensions(current => Math.abs(current.width - width) < 0.5 && current.pixelRatio === pixelRatio ? current : { width, pixelRatio })
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(iconRef.current)
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [nearViewport])

  useEffect(() => {
    if (!nearViewport || !svg) return
    let active = true
    loadSvgSource(src).then(text => {
      if (active) setSvgSource({ src, text })
    }).catch(() => {
      if (active) setSvgSource({ src, text: '' })
    })
    return () => { active = false }
  }, [src, svg, nearViewport])

  const source = svgSource?.src === src ? svgSource.text : ''
  const svgMarkup = useMemo(() => source && dimensions.width > 0
    ? sanitizedSvg(source, Math.max(0, Math.min(6, weight)), dimensions.width)
    : '', [source, weight, dimensions.width])
  const rasterRequest = !svg && dimensions.width > 0
    ? optimizedImageSource(src, Math.ceil(dimensions.width * dimensions.pixelRatio))
    : ''

  useEffect(() => {
    if (!nearViewport || !rasterRequest) return
    let active = true
    let triedOriginal = rasterRequest === src
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (active) setMaskImage({ request: rasterRequest, url: image.src })
    }
    image.onerror = () => {
      if (!triedOriginal) {
        triedOriginal = true
        image.src = src
      }
    }
    image.src = rasterRequest
    return () => {
      active = false
      image.onload = null
      image.onerror = null
    }
  }, [src, rasterRequest, nearViewport])

  const maskSource = svg
    ? nearViewport && dimensions.width > 0 && svgSource?.src === src && !svgMarkup ? src : ''
    : maskImage?.request === rasterRequest ? maskImage.url : ''
  const inline = svg && Boolean(svgMarkup)
  return <span
    ref={iconRef}
    aria-hidden="true"
    className={`${inline || svg && !maskSource ? 'category-inline-svg' : 'category-custom-icon'} block ${className}`}
    style={inline ? undefined : maskSource
      ? { maskImage: `url("${maskSource}")`, WebkitMaskImage: `url("${maskSource}")` }
      : { visibility: 'hidden' }}
    dangerouslySetInnerHTML={inline ? { __html: svgMarkup } : undefined}
  />
}
