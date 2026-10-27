export const WEEK_DAYS = [
  ['monday', 'Lunes'], ['tuesday', 'Martes'], ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'], ['friday', 'Viernes'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
] as const

export type WeekDay = typeof WEEK_DAYS[number][0]
export interface HoursPeriod { start: string; end: string }
export interface WeeklyHoursDay {
  day: WeekDay
  status: 'pending' | 'open' | 'closed'
  periods: HoursPeriod[]
}
export interface LandingHoursSettings {
  weekly_hours_days?: WeeklyHoursDay[]
  hours_eyebrow?: string
  hours_note?: string
  hours_closed_label?: string
  hours_pending_label?: string
  hours_heading_color?: string
  hours_text_color?: string
  hours_day_color?: string
  hours_closed_color?: string
  hours_border_color?: string
  hours_icon_color?: string
  hours_icon_bg?: string
  hours_note_bg?: string
}

export const HOURS_CONTENT = {
  section_name: 'Horarios de atención',
  title: 'Nuestros horarios, día por día',
  description: 'Consultá los horarios de atención del local de lunes a domingo.',
}

export const HOURS_COLOR_FIELDS = [
  ['hours_heading_color', 'Título', '#30261d'],
  ['hours_text_color', 'Horarios y descripción', '#61594c'],
  ['hours_day_color', 'Nombres de los días', '#3b3023'],
  ['hours_closed_color', 'Texto de días cerrados', '#8a4c35'],
  ['hours_border_color', 'Bordes y separadores', '#e3d7c4'],
  ['hours_icon_color', 'Iconos y etiqueta superior', '#62643e'],
  ['hours_icon_bg', 'Fondo del icono', '#eeeadc'],
  ['hours_note_bg', 'Fondo de la aclaración', '#eeeadc'],
] as const

export function normalizeWeeklyHours(days?: WeeklyHoursDay[]): WeeklyHoursDay[] {
  return WEEK_DAYS.map(([day]): WeeklyHoursDay => {
    const entry = Array.isArray(days) ? days.find(row => row?.day === day) : undefined
    return {
      day,
      status: entry?.status === 'open' || entry?.status === 'closed' ? entry.status : 'pending',
      periods: Array.isArray(entry?.periods) && entry.periods.length
        ? entry.periods.slice(0, 2).map(period => ({ start: typeof period?.start === 'string' ? period.start : '', end: typeof period?.end === 'string' ? period.end : '' }))
        : [{ start: '', end: '' }],
    }
  })
}

export function defaultHoursSettings(): LandingHoursSettings {
  return { weekly_hours_days: normalizeWeeklyHours(), hours_eyebrow: 'Te esperamos', hours_note: '', hours_closed_label: 'Cerrado', hours_pending_label: 'Horario a confirmar' }
}

export function validHoursPeriod(period: HoursPeriod): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(period.start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(period.end) && period.start < period.end
}

/** Same-day shifts must be complete, chronological and must not overlap. */
export function weeklyHoursError(days?: WeeklyHoursDay[]): string | null {
  for (const row of normalizeWeeklyHours(days)) {
    if (row.status !== 'open') continue
    const label = WEEK_DAYS.find(([day]) => day === row.day)![1]
    if (!row.periods.every(validHoursPeriod)) return `${label}: completá la apertura y el cierre de cada turno. El cierre debe ser posterior a la apertura; los turnos de esta sección terminan en el mismo día.`
    if (row.periods.length === 2 && row.periods[1].start <= row.periods[0].end) return `${label}: el segundo turno debe comenzar después del cierre del primero.`
  }
  return null
}
