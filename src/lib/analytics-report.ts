export interface AnalyticsSummary {
  visits: number
  visitors: number
  page_views: number
  catalog_visits: number
  product_views: number
  searches: number
  inquiry_adds: number
  cart_adds: number
  inquiry_clicks: number
  cart_clicks: number
  contact_clicks: number
  contact_visits: number
}
export interface AnalyticsReport {
  from: string
  to: string
  days: number
  timezone: string
  generated_at: string
  tracking_started_at: string
  first_event_at: string | null
  summary: AnalyticsSummary
  daily: { day: string; visits: number; views: number }[]
  products: { product_id: string; name: string; views: number; inquiries: number; cart_adds: number }[]
  searches: { term: string; searches: number; no_results: number }[]
  categories: { category_id: string; name: string; selections: number }[]
  devices: { device: string; visits: number }[]
  sources: { source: string; visits: number }[]
  pages: { path: string; views: number; visits: number }[]
}

export function analyticsCsv(report: AnalyticsReport): string {
  const rows: (string | number)[][] = [
    ['Métricas Los Primos', `${report.from} a ${report.to}`, 'America/Montevideo'],
    ['Registro instalado', report.tracking_started_at],
    ['Nota', 'WhatsApp mide clics, no mensajes enviados ni ventas. Visitantes son navegadores estimados.'],
    [], ['Resumen', 'Cantidad'],
    ...Object.entries(report.summary).map(([key, value]) => [SUMMARY_LABELS[key as keyof AnalyticsSummary], value]),
    [], ['Fecha', 'Visitas', 'Páginas vistas'], ...report.daily.map(row => [row.day, row.visits, row.views]),
    [], ['Productos (hasta 20)', 'Aperturas', 'Agregados a consulta', 'Agregados a compras'],
    ...report.products.map(row => [row.name, row.views, row.inquiries, row.cart_adds]),
    [], ['Búsquedas (hasta 20)', 'Veces', 'Sin resultados'], ...report.searches.map(row => [row.term, row.searches, row.no_results]),
    [], ['Categorías (hasta 20)', 'Selecciones'], ...report.categories.map(row => [row.name, row.selections]),
    [], ['Dispositivo', 'Visitas'], ...report.devices.map(row => [DEVICE_LABELS[row.device] || row.device, row.visits]),
    [], ['Origen (hasta 10)', 'Visitas'], ...report.sources.map(row => [row.source, row.visits]),
    [], ['Página', 'Vistas', 'Visitas'], ...report.pages.map(row => [row.path, row.views, row.visits])
  ]
  return '\uFEFF' + rows.map(row => row.map(value => {
    const text = String(value)
    const safe = /^[=+\-@\t\r]/.test(text.trimStart()) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }).join(';')).join('\r\n')
}

export const DEVICE_LABELS: Record<string, string> = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' }
export const SUMMARY_LABELS: Record<keyof AnalyticsSummary, string> = {
  visits: 'Visitas', visitors: 'Navegadores únicos estimados', page_views: 'Páginas vistas',
  catalog_visits: 'Visitas al catálogo', product_views: 'Productos abiertos', searches: 'Búsquedas',
  inquiry_adds: 'Agregados a consulta', cart_adds: 'Agregados a compras',
  inquiry_clicks: 'Clics WhatsApp de consulta', cart_clicks: 'Clics WhatsApp de compras',
  contact_clicks: 'Clics WhatsApp de contacto', contact_visits: 'Visitas con clic a WhatsApp'
}
