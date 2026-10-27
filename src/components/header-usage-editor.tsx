'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { HeaderUsageMenu } from '@/components/header-usage-menu'
import { catalogUsageLink, usageMenuLinks, resolveUsageMenuSettings, USAGE_MENU_ICONS, USAGE_MENU_COLOR_FIELDS, type CatalogUsageSettings } from '@/lib/catalog-usage-navigation'
import { isInstructionBlock } from '@/lib/landing-background'
import type { MobileMenuSettings } from '@/lib/mobile-menu-settings'

type ColorKey = typeof USAGE_MENU_COLOR_FIELDS[number][0]
interface UsageSection { id: string; title: string | null; section_name: string; block_type: string; is_visible: boolean }

export function HeaderUsageEditor({ value, onChange, sections, fonts, weights, mobileSettings, navStyle, showIcons, transparentColor, fallbackColors, renderColor }: {
  value: CatalogUsageSettings
  onChange: (value: CatalogUsageSettings) => void
  sections: UsageSection[]
  fonts: { value: string; label: string }[]
  weights: { value: string; label: string }[]
  mobileSettings: MobileMenuSettings
  navStyle: CSSProperties
  showIcons: boolean
  transparentColor: string
  fallbackColors: Record<ColorKey, string>
  renderColor: (label: string, color: string, onChange: (color: string) => void) => ReactNode
}) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'hero' | 'mobile'>('desktop')
  const candidates = sections.filter(section => isInstructionBlock(section.block_type))
  const selectedIds = value.section_ids ?? candidates.filter(section => section.is_visible).map(section => section.id)
  const ordered = [...new Set(selectedIds)].flatMap(id => candidates.filter(section => section.id === id)).concat(candidates.filter(section => !selectedIds.includes(section.id)))
  const links = candidates.filter(section => section.is_visible).map(catalogUsageLink)
  const change = (update: Partial<CatalogUsageSettings>) => onChange({ ...value, ...update })

  return <div className="mt-4 space-y-5">
    <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={value.enabled} onChange={event => change({ enabled: event.target.checked })} className="h-5 w-5" />Mostrar este índice en el header y en el menú móvil</label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-text-muted">Nombre del botón<input className="input mt-2" value={value.label} maxLength={80} placeholder="Modo de uso" onChange={event => change({ label: event.target.value })} /></label>
      <label className="text-sm font-semibold text-text-muted">Título dentro del desplegable<input className="input mt-2" value={value.panel_title} maxLength={120} placeholder="Opcional" onChange={event => change({ panel_title: event.target.value })} /></label>
      <label className="text-sm font-semibold text-text-muted">Icono del botón<select className="input mt-2" value={value.trigger_icon} onChange={event => change({ trigger_icon: event.target.value as CatalogUsageSettings['trigger_icon'] })}>{USAGE_MENU_ICONS.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}</select></label>
      <label className="text-sm font-semibold text-text-muted">Mostrar icono del botón<select className="input mt-2" value={value.show_trigger_icon} onChange={event => change({ show_trigger_icon: event.target.value as CatalogUsageSettings['show_trigger_icon'] })}><option value="inherit">Seguir el estilo del menú</option><option value="show">Mostrar en computadora y celular</option><option value="hide">Ocultar en ambos</option></select></label>
      <label className="text-sm font-semibold text-text-muted">Mayúsculas del botón<select className="input mt-2" value={value.uppercase} onChange={event => change({ uppercase: event.target.value as CatalogUsageSettings['uppercase'] })}><option value="inherit">Seguir el estilo del menú</option><option value="uppercase">Mayúsculas</option><option value="normal">Como lo escribiste</option></select></label>
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={value.show_link_icons} onChange={event => change({ show_link_icons: event.target.checked })} className="h-5 w-5" />Mostrar iconos de los instructivos</label>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      {([['font_family', 'Tipografía del botón'], ['link_font_family', 'Tipografía del desplegable']] as const).map(([key, label]) => <label key={key} className="text-sm font-semibold text-text-muted">{label}<select className="input mt-2" value={value[key]} onChange={event => change({ [key]: event.target.value })}><option value="inherit">Heredar del menú / botón</option>{fonts.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}</select></label>)}
      {([['font_weight', 'Grosor del botón'], ['link_font_weight', 'Grosor de los enlaces']] as const).map(([key, label]) => <label key={key} className="text-sm font-semibold text-text-muted">{label}<select className="input mt-2" value={value[key]} onChange={event => change({ [key]: event.target.value })}><option value="inherit">Heredar del menú / botón</option>{weights.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}</select></label>)}
    </div>

    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div><h4 className="font-semibold">Instructivos incluidos y su orden</h4><p className="mt-1 text-xs leading-5 text-text-muted">Los enlaces llevan a los bloques existentes de la landing. Sus pasos e imágenes se editan en Bloques de Landing. Un bloque oculto tampoco aparece en el índice.</p></div>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={value.section_ids === null} onChange={event => change({ section_ids: event.target.checked ? null : [...selectedIds] })} className="mt-1 h-4 w-4 shrink-0" /><span>Incluir automáticamente todos los instructivos visibles, en el orden de la landing</span></label>
      {!candidates.length && <p className="text-sm text-text-muted">Creá primero un bloque de instrucciones en la landing.</p>}
      {ordered.map(section => {
        const index = selectedIds.indexOf(section.id)
        const selected = index >= 0
        const move = (direction: number) => {
          const ids = [...selectedIds]
          const target = index + direction
          if (index < 0 || target < 0 || target >= ids.length) return
          ;[ids[index], ids[target]] = [ids[target], ids[index]]
          change({ section_ids: ids })
        }
        return <div key={section.id} className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start gap-2"><label className="flex min-w-0 flex-1 items-start gap-2 text-sm"><input type="checkbox" checked={selected} onChange={event => change({ section_ids: event.target.checked ? [...selectedIds, section.id] : selectedIds.filter(id => id !== section.id) })} className="mt-1 h-4 w-4 shrink-0" /><span className="min-w-0 break-words"><strong className="block">{section.section_name}</strong><span className="text-xs text-text-muted">{section.is_visible ? 'Visible en la landing' : 'Oculto: no aparece en el índice'}</span></span></label><div className="flex shrink-0 gap-1"><button type="button" disabled={!selected || index === 0} onClick={() => move(-1)} aria-label={`Subir ${section.section_name}`} className="rounded-lg border px-2 py-1 disabled:opacity-30">↑</button><button type="button" disabled={!selected || index === selectedIds.length - 1} onClick={() => move(1)} aria-label={`Bajar ${section.section_name}`} className="rounded-lg border px-2 py-1 disabled:opacity-30">↓</button></div></div>
          {selected && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-text-muted">Nombre en el índice<input className="input mt-1" value={value.link_labels[section.id] || ''} maxLength={120} placeholder={section.title || section.section_name} onChange={event => change({ link_labels: { ...value.link_labels, [section.id]: event.target.value } })} /><span className="mt-1 block">Vacío: usa el título del bloque.</span></label><label className="text-xs text-text-muted">Icono del enlace<select className="input mt-1" value={value.link_icons[section.id] || ''} onChange={event => {
            const icons = { ...value.link_icons }
            if (event.target.value) icons[section.id] = event.target.value as CatalogUsageSettings['trigger_icon']
            else delete icons[section.id]
            change({ link_icons: icons })
          }}><option value="">Automático según el instructivo</option>{USAGE_MENU_ICONS.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}</select></label></div>}
        </div>
      })}
      <p className="text-xs leading-5 text-text-muted">Al elegir o mover enlaces, pasás a una selección manual. Para incluir nuevos instructivos automáticamente, activá de nuevo la opción de arriba.</p>
    </div>

    <div className="space-y-3"><div><h4 className="font-semibold">Colores propios de Modo de uso</h4><p className="mt-1 text-xs text-text-muted">Cada color puede heredar el estilo del header o menú móvil. Estos ajustes solo afectan a este índice.</p></div><div className="grid gap-4 sm:grid-cols-2">{USAGE_MENU_COLOR_FIELDS.map(([key, label]) => <div key={key}>{renderColor(label, value[key] || fallbackColors[key], color => change({ [key]: color }))}<button type="button" disabled={!value[key]} onClick={() => change({ [key]: '' })} className="mt-2 text-xs font-semibold underline disabled:no-underline disabled:opacity-50">{value[key] ? 'Volver a heredar' : 'Heredando del menú'}</button></div>)}</div></div>

    <div className="space-y-3 rounded-2xl border border-border p-4">
      <label className="block text-sm font-semibold text-text-muted">Vista previa · pulsá el botón para abrir<select className="input mt-2" value={previewMode} onChange={event => setPreviewMode(event.target.value as typeof previewMode)}><option value="desktop">Header sólido / catálogo</option><option value="hero">Header sobre el hero</option><option value="mobile">Menú móvil</option></select></label>
      <div className="min-h-[340px] rounded-xl border border-border p-5" style={{ backgroundColor: previewMode === 'hero' ? '#30261d' : previewMode === 'mobile' ? mobileSettings.background : '#ffffff' }}>
        {usageMenuLinks(links, resolveUsageMenuSettings(value)).length ? <div className={previewMode === 'mobile' ? '' : 'flex justify-center'}><HeaderUsageMenu links={links} settings={{ ...mobileSettings, usage_menu: value }} mobile={previewMode === 'mobile'} overHero={previewMode === 'hero'} uppercase={navStyle.textTransform === 'uppercase'} showIcon={previewMode === 'mobile' || showIcons} triggerStyle={{ ...navStyle, color: previewMode === 'hero' ? transparentColor : previewMode === 'mobile' ? undefined : navStyle.color }} preview /></div> : <p className="text-sm text-[#817565]">{value.enabled ? 'No hay instructivos visibles seleccionados.' : 'El índice está oculto.'}</p>}
      </div>
      <p className="text-xs leading-5 text-text-muted">Los enlaces de esta vista previa no navegan. Guardá el estilo del header para publicar los cambios.</p>
    </div>
  </div>
}
