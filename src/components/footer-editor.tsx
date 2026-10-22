'use client'

import { useRef, useState, type ReactNode } from 'react'
import { FooterDesign } from '@/components/footer-design'
import { SiteImage } from '@/components/site-image'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import { DEFAULT_FOOTER_SETTINGS, FOOTER_COLOR_FIELDS, normalizeFooterSettings, type FooterBusinessInfo, type FooterSettings } from '@/lib/footer-settings'
import type { SiteFont } from '@/lib/site-fonts'

function Group({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return <details className="card" open={open || undefined}>
    <summary className="cursor-pointer font-bold text-text">{title}</summary>
    <div className="mt-5 space-y-4">{children}</div>
  </details>
}

export function FooterEditor({ value, onChange, business, customFonts, palette, saving, disabled, message, onSave }: {
  value: FooterSettings
  onChange: (value: FooterSettings) => void
  business?: FooterBusinessInfo | null
  customFonts: SiteFont[]
  palette: { name: string; hex: string }[]
  saving: boolean
  disabled: boolean
  message: { type: 'success' | 'error'; text: string } | null
  onSave: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const currentValue = useRef(value)
  currentValue.current = value
  const form = normalizeFooterSettings(value)
  const update = <K extends keyof FooterSettings>(key: K, next: FooterSettings[K]) => onChange({ ...value, [key]: next })
  const text = (key: keyof FooterSettings, label: string, multiline = false, placeholder = '') => <label className="block text-sm font-medium text-text-muted">{label}
    {multiline ? <textarea className="input mt-1 min-h-20" value={String(value[key])} onChange={e => update(key, e.target.value)} placeholder={placeholder} /> : <input className="input mt-1" value={String(value[key])} onChange={e => update(key, e.target.value)} placeholder={placeholder} />}
  </label>
  const toggle = (key: keyof FooterSettings, label: string) => <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm text-text-muted"><input type="checkbox" checked={Boolean(value[key])} onChange={e => update(key, e.target.checked)} className="h-4 w-4 shrink-0" />{label}</label>
  const range = (key: keyof FooterSettings, label: string, min: number, max: number) => <label className="block text-sm text-text-muted">{label}: <strong>{Number(form[key])} px</strong><input type="range" min={min} max={max} value={Number(form[key])} onChange={e => update(key, Number(e.target.value))} className="mt-2 block w-full" /></label>
  const moveLink = (index: number, direction: -1 | 1) => {
    const links = [...value.links]
    const target = index + direction
    if (target < 0 || target >= links.length) return
    ;[links[index], links[target]] = [links[target], links[index]]
    update('links', links)
  }

  return <div className="space-y-5">
    <div><h3 className="mb-1 text-xl font-bold">Footer del sitio</h3><p className="text-sm text-text-muted">Un cierre cálido para la landing y el catálogo. Personalizá cada bloque y revisá los cambios antes de guardar.</p></div>
    <fieldset disabled={saving || disabled} className="min-w-0 space-y-5">
    <Group title="Identidad y logo" open>
      {text('eyebrow', 'Etiqueta sobre el nombre')}
      {text('brand_title', 'Nombre del negocio', false, business?.site_name || 'Los Primos')}
      <p className="text-xs text-text-muted">Dejá el nombre vacío para usar el nombre general del sitio.</p>
      {text('description', 'Descripción del negocio', true)}
      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">Logo propio del footer (opcional)</p>
        <p className="text-xs text-text-muted">Podés usar una versión clara sobre el fondo oscuro. Sin logo se muestra el nombre del negocio.</p>
        {value.logo_url && <div className="rounded-lg p-4" style={{ backgroundColor: form.background_color }}><SiteImage src={value.logo_url} alt="Logo del footer" width={360} height={160} className="h-20 w-full object-contain" /></div>}
        <label className="block text-sm text-text-muted">Subir logo
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={uploading || saving} className="input mt-1" onChange={async e => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            setUploading(true)
            setUploadError('')
            try {
              const result = await uploadImageToSupabase(file, 'logo')
              if (result.error || !result.url) throw new Error(result.error || 'No se pudo subir el logo.')
              onChange({ ...currentValue.current, logo_url: result.url })
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : 'No se pudo subir el logo.')
            } finally { setUploading(false) }
          }} />
        </label>
        {uploading && <p role="status" className="text-sm text-text-muted">Subiendo logo…</p>}
        {uploadError && <p role="alert" className="text-sm text-red-600">{uploadError}</p>}
        {value.logo_url && <button type="button" className="text-sm text-red-600 underline" disabled={uploading} onClick={() => update('logo_url', '')}>Quitar logo y mostrar el nombre</button>}
        <div className="grid gap-4 sm:grid-cols-2">{range('logo_width', 'Ancho en tablet / escritorio', 60, 360)}{range('logo_width_mobile', 'Ancho en móvil', 60, 300)}</div>
        <p className="text-xs text-text-muted">El logo se guarda al pulsar «Guardar footer».</p>
      </div>
    </Group>

    <Group title="Contacto y horarios">
      {toggle('show_contact', 'Mostrar contacto')}
      {value.show_contact && <div className="space-y-3">{text('contact_title', 'Título del bloque de contacto')}{toggle('show_phone', 'Mostrar WhatsApp')}{toggle('show_email', 'Mostrar correo electrónico')}{toggle('show_address', 'Mostrar dirección')}</div>}
      {toggle('show_hours', 'Mostrar horarios')}
      {value.show_hours && text('hours_title', 'Título de horarios')}
      <p className="text-xs text-text-muted">Los datos se toman de Configuración del negocio. La dirección abre Google Maps y el teléfono abre WhatsApp.</p>
    </Group>

    <Group title="Enlaces del footer">
      {toggle('show_navigation', 'Mostrar enlaces de navegación')}
      {value.show_navigation && <>
        {text('navigation_title', 'Título de los enlaces')}
        {value.links.map((link, index) => <div key={index} className="space-y-3 rounded-xl border border-border p-3">
          <label className="block text-xs text-text-muted">Texto del enlace {index + 1}<input className="input mt-1" value={link.label} onChange={e => update('links', value.links.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} /></label>
          <label className="block text-xs text-text-muted">Destino<input className="input mt-1" placeholder="/catalogo o https://…" value={link.url} onChange={e => update('links', value.links.map((item, i) => i === index ? { ...item, url: e.target.value } : item))} /></label>
          <div className="flex gap-3 text-sm"><button type="button" className="rounded border px-3 py-1 disabled:opacity-30" aria-label={`Subir enlace ${index + 1}`} disabled={index === 0} onClick={() => moveLink(index, -1)}>↑</button><button type="button" className="rounded border px-3 py-1 disabled:opacity-30" aria-label={`Bajar enlace ${index + 1}`} disabled={index === value.links.length - 1} onClick={() => moveLink(index, 1)}>↓</button><button type="button" className="ml-auto text-red-600" onClick={() => update('links', value.links.filter((_, i) => i !== index))}>Eliminar</button></div>
        </div>)}
        <button type="button" className="btn btn-outline w-full" disabled={value.links.length >= 12} onClick={() => update('links', [...value.links, { label: '', url: '' }])}>Agregar enlace</button>
        <p className="text-xs text-text-muted">También podés pegar enlaces a categorías o productos del catálogo.</p>
      </>}
    </Group>

    <Group title="Invitación al catálogo (opcional)">
      {toggle('show_cta', 'Mostrar una tarjeta con botón antes de las columnas')}
      {value.show_cta && <>{text('cta_title', 'Título de la invitación')}{text('cta_description', 'Descripción', true)}{text('cta_label', 'Texto del botón')}{text('cta_url', 'Destino del botón', false, '/catalogo')}</>}
    </Group>

    <Group title="Tipografías, tamaños y espacio">
      <div className="grid gap-4 sm:grid-cols-2">
        {(['heading', 'body'] as const).map(kind => <div key={kind} className="space-y-4">
          <label className="block text-sm text-text-muted">{kind === 'heading' ? 'Tipografía de títulos' : 'Tipografía del texto'}<select className="input mt-1" value={value[`${kind}_font`]} onChange={e => update(`${kind}_font`, e.target.value)}>
            {[['dm_sans', 'DM Sans'], ['fira_sans', 'Fira Sans'], ['lora', 'Lora'], ['georgia', 'Georgia']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
          </select></label>
          <label className="block text-sm text-text-muted">{kind === 'heading' ? 'Grosor de títulos' : 'Grosor del texto'}<select className="input mt-1" value={value[`${kind}_weight`]} onChange={e => update(`${kind}_weight`, e.target.value)}>
            {[['300', 'Liviano'], ['400', 'Normal'], ['500', 'Medio'], ['600', 'Seminegrita'], ['700', 'Negrita'], ['800', 'Extranegrita'], ['900', 'Negro']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select></label>
        </div>)}
        {range('brand_size', 'Nombre en tablet / escritorio', 20, 64)}{range('brand_size_mobile', 'Nombre en móvil', 20, 48)}
        {range('heading_size', 'Títulos de las columnas', 14, 32)}{range('body_size', 'Texto y enlaces', 12, 22)}
        {range('padding_y', 'Espacio superior', 24, 112)}
      </div>
    </Group>

    <Group title="Colores del footer">
      <div className="grid gap-4 sm:grid-cols-2">{FOOTER_COLOR_FIELDS.map(([key, label]) => <div key={key}>
        <p className="text-sm text-text-muted">{label}</p><div className="mt-1 flex gap-2"><input type="color" aria-label={`Selector: ${label}`} value={form[key]} onChange={e => update(key, e.target.value)} className="h-11 w-12 shrink-0 cursor-pointer rounded border" /><input className="input min-w-0" value={value[key]} onChange={e => update(key, e.target.value)} aria-label={`Código: ${label}`} maxLength={7} /></div>
        {palette.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{palette.map((color, index) => <button key={index} type="button" title={color.name} aria-label={`${label}: ${color.name}`} style={{ backgroundColor: color.hex }} className="h-5 w-5 rounded-full border border-black/20" onClick={() => update(key, color.hex)} />)}</div>}
      </div>)}</div>
      <button type="button" className="text-sm underline" onClick={() => onChange({ ...value, ...Object.fromEntries(FOOTER_COLOR_FIELDS.map(([key]) => [key, DEFAULT_FOOTER_SETTINGS[key]])) })}>Restablecer colores crema y oliva</button>
    </Group>

    <Group title="Texto inferior">{text('copyright_text', 'Aviso de derechos')}<p className="text-xs text-text-muted">Se agrega automáticamente el año actual y el nombre del negocio.</p></Group>
    <details className="card lg:hidden"><summary className="cursor-pointer font-bold">Vista previa del footer</summary><div className="mt-4 max-h-[600px] overflow-auto rounded-xl"><FooterDesign settings={value} business={business} preview /></div></details>
    </fieldset>
    {message && <p role="status" className={`rounded-xl p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}
    <button type="button" onClick={onSave} disabled={disabled || saving || uploading} className="btn btn-primary w-full">{saving ? 'Guardando…' : 'Guardar footer'}</button>
  </div>
}
