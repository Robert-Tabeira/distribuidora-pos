import type { ReactNode } from 'react'
import { HOURS_COLOR_FIELDS, normalizeWeeklyHours, WEEK_DAYS, type LandingHoursSettings, type WeeklyHoursDay } from '@/lib/landing-hours'

export function LandingHoursEditor({ settings, onChange, renderColor }: {
  settings: LandingHoursSettings
  onChange: (changes: Partial<LandingHoursSettings>) => void
  renderColor: (label: string, value: string, onChange: (color: string) => void) => ReactNode
}) {
  const days = normalizeWeeklyHours(settings.weekly_hours_days)
  function updateDay(day: WeeklyHoursDay['day'], changes: Partial<WeeklyHoursDay>) {
    onChange({ weekly_hours_days: days.map(row => row.day === day ? { ...row, ...changes } : row) })
  }
  function copyMonday(all: boolean) {
    const monday = days[0]
    onChange({ weekly_hours_days: days.map((row, index) => index > 0 && (all || index < 5) ? { ...row, status: monday.status, periods: monday.periods.map(period => ({ ...period })) } : row) })
  }
  return <div className="space-y-4 rounded-2xl border border-[#ddd2bb] bg-[#fbf7f0] p-4">
    <div><h4 className="font-semibold text-[#3b3023]">Horarios de lunes a domingo</h4><p className="mt-1 text-xs leading-5 text-text-muted">Cada día puede tener horario corrido, dos turnos con corte al mediodía o estar cerrado. Si todavía no confirmaste un horario, dejalo como pendiente.</p></div>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => copyMonday(false)} className="rounded-xl border border-[#c9bea7] bg-white px-3 py-2 text-xs font-semibold text-[#575b36]">Copiar lunes a martes–viernes</button><button type="button" onClick={() => copyMonday(true)} className="rounded-xl border border-[#c9bea7] bg-white px-3 py-2 text-xs font-semibold text-[#575b36]">Copiar lunes a toda la semana</button></div>
    {days.map(row => <div key={row.day} className="space-y-3 rounded-xl border border-[#e3d7c4] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h5 className="font-semibold text-[#3b3023]">{WEEK_DAYS.find(([day]) => day === row.day)![1]}</h5><label className="text-xs text-text-muted">Estado del día<select className="input mt-1" value={row.status} onChange={event => updateDay(row.day, { status: event.target.value as WeeklyHoursDay['status'] })}><option value="pending">Horario a confirmar</option><option value="open">Abierto · completar horarios</option><option value="closed">Cerrado</option></select></label></div>
      {row.status === 'open' && <div className="space-y-3">
        {row.periods.map((period, index) => <fieldset key={index} className="rounded-xl border border-border p-3"><legend className="px-1 text-xs font-semibold text-text-muted">{row.periods.length === 1 ? 'Horario de atención' : `Turno ${index + 1}`}</legend><div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-xs text-text-muted">Apertura<input type="time" step={60} className="input mt-1 min-w-0" value={period.start} onChange={event => updateDay(row.day, { periods: row.periods.map((entry, position) => position === index ? { ...entry, start: event.target.value } : entry) })} /></label><label className="min-w-0 text-xs text-text-muted">Cierre<input type="time" step={60} className="input mt-1 min-w-0" value={period.end} onChange={event => updateDay(row.day, { periods: row.periods.map((entry, position) => position === index ? { ...entry, end: event.target.value } : entry) })} /></label></div></fieldset>)}
        {row.periods.length === 1 ? <button type="button" onClick={() => updateDay(row.day, { periods: [...row.periods, { start: '', end: '' }] })} className="text-xs font-semibold text-[#575b36] underline">+ Agregar segundo turno</button> : <button type="button" onClick={() => updateDay(row.day, { periods: row.periods.slice(0, 1) })} className="text-xs font-semibold text-[#9a5035] underline">Quitar segundo turno · usar horario corrido</button>}
      </div>}
    </div>)}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-text-muted">Texto pequeño superior<input className="input mt-1" value={settings.hours_eyebrow ?? 'Te esperamos'} maxLength={100} onChange={event => onChange({ hours_eyebrow: event.target.value })} /></label>
      <label className="text-sm font-medium text-text-muted">Texto para días cerrados<input className="input mt-1" value={settings.hours_closed_label ?? 'Cerrado'} maxLength={80} onChange={event => onChange({ hours_closed_label: event.target.value })} /></label>
      <label className="text-sm font-medium text-text-muted sm:col-span-2">Texto para horarios pendientes<input className="input mt-1" value={settings.hours_pending_label ?? 'Horario a confirmar'} maxLength={100} onChange={event => onChange({ hours_pending_label: event.target.value })} /></label>
      <label className="text-sm font-medium text-text-muted sm:col-span-2">Aclaración opcional<textarea className="input mt-1 min-h-20" value={settings.hours_note || ''} maxLength={500} placeholder="Ej.: Consultá los horarios de atención en feriados." onChange={event => onChange({ hours_note: event.target.value })} /></label>
    </div>
    <div><h5 className="mb-3 font-semibold">Colores de la sección</h5><div className="grid gap-3 sm:grid-cols-2">{HOURS_COLOR_FIELDS.map(([key, label, fallback]) => <div key={key}>{renderColor(label, settings[key] || fallback, color => onChange({ [key]: color }))}</div>)}</div><p className="mt-3 text-xs text-text-muted">Los fondos se editan en Fondo de la sección. Las tipografías y sus grosores se editan en los controles generales de este bloque.</p></div>
  </div>
}
