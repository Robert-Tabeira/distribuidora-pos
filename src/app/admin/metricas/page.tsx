'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Icon } from '@/components/ui/icon'
import { analyticsCsv, DEVICE_LABELS, type AnalyticsReport } from '@/lib/analytics-report'
import { ANALYTICS_ACCESS_KEY, clearAnalyticsAccess, readAnalyticsAccess } from '@/lib/analytics-admin'
import styles from './metrics.module.css'
import { LEGAL_READY } from '@/lib/legal-details'
import { SITE_ANALYTICS_ENABLED } from '@/lib/analytics-config'

const number = (value: number) => new Intl.NumberFormat('es-UY', { maximumFractionDigits: 1 }).format(value)
function date(value: string, time = false) {
  return new Intl.DateTimeFormat('es-UY', { timeZone: 'America/Montevideo', day: '2-digit', month: '2-digit', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } as const : {}) }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
}
function errorMessage(error: { code?: string; message?: string }) {
  if (['PGRST202', '42P01', '42883'].includes(error.code || '')) return 'Las métricas todavía no están activadas en la base de datos. Ejecutá la migración 202610220001_site_analytics.sql en Supabase y volvé a intentar.'
  return error.message || 'No se pudo cargar la información. Intentá nuevamente.'
}
function Ranking({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map(row => row.value))
  return <section className={styles.card}><h2 className={`${styles.heading} mb-5 text-xl`}>{title}</h2>
    {rows.length ? <ul className="space-y-5">{rows.map((row, index) => <li key={index}><div className="flex items-start justify-between gap-4 text-sm"><span className="min-w-0 break-words">{row.label}</span><strong>{number(row.value)}</strong></div><div className={styles.bar}><span style={{ width: `${row.value / max * 100}%` }} /></div></li>)}</ul> : <p className={styles.muted}>Todavía no hay actividad registrada en este período.</p>}
  </section>
}

export default function MetricsPage() {
  if (!SITE_ANALYTICS_ENABLED) return <main className={styles.page}><div className={styles.inner}>
    <Link href="/admin" className="text-sm text-[#686c46]">← Volver al panel</Link>
    <h1 className={`${styles.heading} mt-6 text-3xl`}>Estadísticas deshabilitadas</h1>
    <p className="mt-4 text-sm">La recopilación y el panel de métricas internas están desactivados.</p>
  </div></main>
  return <MetricsDashboard />
}

function MetricsDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ id: string; name: string } | null>(null)
  const [token, setToken] = useState('')
  const [pin, setPin] = useState('')
  const [authenticating, setAuthenticating] = useState(false)
  const [days, setDays] = useState(30)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<AnalyticsReport | null>(null)

  useEffect(() => {
    try {
      const employee = JSON.parse(localStorage.getItem('employee') || 'null')
      if (!employee || employee.role !== 'admin') { router.replace('/login'); return }
      setAdmin({ id: employee.id, name: employee.name })
      const access = readAnalyticsAccess(employee.id)
      if (access) setToken(access.token)
    } catch { router.replace('/login') }
  }, [router])

  useEffect(() => {
    if (!token) return
    let active = true
    setLoading(true)
    setError('')
    setReport(null)
    void (async () => {
      try {
        const result = await supabase.rpc('site_analytics_report', { p_token: token, p_days: days })
        if (!active) return
        if (result.error) {
          if (result.error.code === '42501') {
            setToken('')
            void clearAnalyticsAccess(token)
          }
          throw result.error
        }
        if (!result.data?.summary) throw new Error('El informe recibido no es válido.')
        setReport(result.data as AnalyticsReport)
      } catch (caught) {
        if (active) setError(errorMessage(caught as { code?: string; message?: string }))
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [token, days, refresh])

  async function authenticate(event: React.FormEvent) {
    event.preventDefault()
    if (!admin) return
    setAuthenticating(true)
    setError('')
    try {
      const result = await supabase.rpc('site_analytics_login', { p_employee_id: admin.id, p_pin: pin })
      if (result.error) throw result.error
      if (!result.data?.success || typeof result.data.token !== 'string') throw new Error(result.data?.message || 'No se pudo validar el acceso.')
      const access = { token: result.data.token, expires_at: result.data.expires_at, employee_id: admin.id }
      try { sessionStorage.setItem(ANALYTICS_ACCESS_KEY, JSON.stringify(access)) } catch { /* The current page can still display the report. */ }
      setPin('')
      setToken(access.token)
    } catch (caught) { setError(errorMessage(caught as { code?: string; message?: string })) }
    finally { setAuthenticating(false) }
  }

  function downloadCsv() {
    if (!report) return
    const url = URL.createObjectURL(new Blob([analyticsCsv(report)], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `metricas-los-primos-${report.from}-${report.to}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!admin) return <main className={`${styles.page} grid place-items-center`}><p>Cargando…</p></main>
  const summary = report?.summary
  const whatsapp = summary ? summary.inquiry_clicks + summary.cart_clicks + summary.contact_clicks : 0
  const conversion = summary?.visits ? summary.contact_visits / summary.visits * 100 : 0
  const maxDaily = Math.max(1, ...(report?.daily.map(row => row.visits) || []))
  const chartX = (index: number) => 12 + index / Math.max(1,(report?.daily.length || 1)-1) * 696
  const chartY = (visits: number) => 146 - visits / maxDaily * 120
  const chartPoints = report?.daily.map((row,index) => `${chartX(index)},${chartY(row.visits)}`).join(' ') || ''

  return <main className={styles.page}><div className={styles.inner}>
    <Link href="/admin" className={`${styles.screenControls} mb-6 inline-flex items-center gap-2 text-sm text-[#686c46]`}>← Volver al panel</Link>
    <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
      <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#71764e]">Los Primos · Actividad del sitio</p><h1 className={`${styles.heading} text-3xl sm:text-4xl`}>Métricas de la web</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#776c5d]">Conocé qué buscan, qué productos miran y cuándo se acercan a consultar.</p></div>
      {token && <button type="button" onClick={() => { setToken(''); setReport(null); void clearAnalyticsAccess(token) }} className={`${styles.button} ${styles.screenControls}`}>Bloquear métricas</button>}
    </header>
    {!LEGAL_READY && <p className={`${styles.notice} mb-6`}>Las estadísticas nuevas están pausadas hasta completar y revisar la información de privacidad del negocio. Los registros anteriores pueden seguir visibles; no se consideran autorizados de forma retroactiva.</p>}

    {!token ? <section className={`${styles.card} max-w-lg`}>
      <h2 className={`${styles.heading} mb-2 text-xl`}>Confirmá tu acceso</h2><p className="mb-5 text-sm leading-6 text-[#776c5d]">{admin.name}, ingresá tu PIN de administrador para ver los reportes. El acceso dura hasta cuatro horas en esta pestaña.</p>
      <form onSubmit={authenticate} className="space-y-4"><label className="block text-sm font-semibold">PIN de administrador<input type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} className="input mt-2 max-w-xs tracking-[.4em]" /></label><button disabled={authenticating || pin.length !== 4} className={`${styles.button} ${styles.primary}`}>{authenticating ? 'Validando…' : 'Ver métricas'}</button></form>
    </section> : <div className={`${styles.screenControls} mb-6 flex flex-wrap items-end gap-3`}>
      <label className="text-xs font-semibold text-[#776c5d]">Período<select value={days} onChange={event => setDays(Number(event.target.value))} className="input mt-1 block min-w-44">{[7,30,90].map(value => <option key={value} value={value}>Últimos {value} días</option>)}</select></label>
      <button className={styles.button} disabled={loading} onClick={() => setRefresh(value => value + 1)}>Actualizar</button><button className={styles.button} disabled={!report || loading} onClick={downloadCsv}><Icon name="document" className="h-4 w-4" />Exportar CSV</button><button className={styles.button} disabled={!report || loading} onClick={() => window.print()}>Imprimir / PDF</button>
    </div>}
    {error && <p role="alert" className="my-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading && <p role="status" className={`${styles.notice} my-6`}>Cargando actividad real del sitio…</p>}

    {report && summary && <div className="space-y-6">
      <div className={styles.notice}><strong>{date(report.from)} al {date(report.to)}</strong> · Horario de Uruguay. Actualizado: {date(report.generated_at,true)}.<br />Registro instalado el {date(report.tracking_started_at,true)}. {report.first_event_at ? `Primera actividad registrada: ${date(report.first_event_at,true)}.` : 'Todavía no se registraron visitas.'} No hay datos anteriores a la activación.</div>
      {summary.visits === 0 && <div className={styles.notice}>No hay actividad registrada en este período. Los valores son reales: este panel no incluye datos de demostración. Para registrar una visita, abrí la web publicada desde otro navegador sin sesión de empleado.</div>}
      <section className={styles.stats} aria-label="Resumen de actividad">
        {[
          ['Visitas',summary.visits,'Sesiones con actividad; se renuevan tras 30 minutos sin uso.'],
          ['Visitantes estimados',summary.visitors,'Navegadores identificados; no equivale a personas.'],
          ['Páginas vistas',summary.page_views,'Aperturas de landing y catálogo.'],
          ['Productos abiertos',summary.product_views,'Veces que se abrió el detalle de un producto.'],
          ['Búsquedas',summary.searches,'Consultas completadas en el buscador del catálogo.'],
          ['Agregados a consulta',summary.inquiry_adds,'Productos incorporados a la lista de precios.'],
          ['Clics a WhatsApp',whatsapp,'Consultas, compras y contacto directo.'],
          ['Visitas con contacto',`${number(conversion)}%`,'Porcentaje de visitas con algún clic a WhatsApp.']
        ].map(([label,value,hint]) => <article key={String(label)} className={styles.card}><h2 className="text-xs font-semibold text-[#776c5d]">{label}</h2><p className={styles.statValue}>{typeof value === 'number' ? number(value) : value}</p><p className={styles.muted}>{hint}</p></article>)}
      </section>

      <section className={styles.card}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className={`${styles.heading} text-xl`}>Visitas por día</h2><span className={styles.muted}>{date(report.from)} — {date(report.to)}</span></div>
        <svg viewBox="0 0 720 180" role="img" aria-label="Evolución diaria de visitas" className={styles.chart}>
          <line x1="12" y1="146" x2="708" y2="146" stroke="#e3d7c4" />
          <polygon fill="#e3e5cf" points={`12,146 ${chartPoints} 708,146`} />
          <polyline fill="none" stroke="#6c7547" strokeWidth="2.5" points={chartPoints} />
          {report.daily.map((row,index) => <circle key={row.day} cx={chartX(index)} cy={chartY(row.visits)} r="3" fill="#6c7547"><title>{date(row.day)}: {row.visits} visitas</title></circle>)}
          <text x="12" y="170" fill="#776c5d" fontSize="11">{date(report.from)}</text><text x="708" y="170" textAnchor="end" fill="#776c5d" fontSize="11">{date(report.to)}</text><text x="12" y="15" fill="#776c5d" fontSize="11">Máximo diario: {number(Math.max(0,...report.daily.map(row=>row.visits)))}</text>
        </svg>
        <details><summary className="cursor-pointer text-xs font-semibold text-[#6d7547]">Ver datos diarios</summary><div className={`${styles.tableWrap} mt-3 max-h-64 overflow-y-auto`}><table className={styles.table}><thead><tr><th>Fecha</th><th>Visitas</th><th>Páginas vistas</th></tr></thead><tbody>{report.daily.map(row=><tr key={row.day}><td>{date(row.day)}</td><td>{number(row.visits)}</td><td>{number(row.views)}</td></tr>)}</tbody></table></div></details>
      </section>

      <section className={styles.card}><h2 className={`${styles.heading} text-xl`}>Productos con más interés</h2><p className={`${styles.muted} mt-1 mb-4`}>Hasta 20 productos, ordenados por aperturas de su ficha.</p>
        {report.products.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Producto</th><th>Aperturas</th><th>En consulta</th><th>En compras</th></tr></thead><tbody>{report.products.map(row=><tr key={row.product_id}><td><Link href={`/catalogo?producto=${encodeURIComponent(row.product_id)}`}>{row.name}</Link></td><td>{number(row.views)}</td><td>{number(row.inquiries)}</td><td>{number(row.cart_adds)}</td></tr>)}</tbody></table></div> : <p className={styles.muted}>Todavía no se abrieron productos en este período.</p>}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={styles.card}><h2 className={`${styles.heading} mb-1 text-xl`}>Qué buscan en el catálogo</h2><p className={`${styles.muted} mb-4`}>Hasta 20 términos. Las búsquedas sin resultados ayudan a detectar oportunidades.</p>{report.searches.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Búsqueda</th><th>Veces</th><th>Sin resultados</th></tr></thead><tbody>{report.searches.map(row=><tr key={row.term}><td>{row.term}</td><td>{number(row.searches)}</td><td>{number(row.no_results)}</td></tr>)}</tbody></table></div> : <p className={styles.muted}>Todavía no hay búsquedas registradas.</p>}</section>
        <Ranking title="Categorías más elegidas" rows={report.categories.map(row=>({label:row.name,value:row.selections}))} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Ranking title="Dispositivos" rows={report.devices.map(row=>({label:DEVICE_LABELS[row.device]||row.device,value:row.visits}))} />
        <Ranking title="Origen de las visitas" rows={report.sources.map(row=>({label:row.source,value:row.visits}))} />
        <Ranking title="Clics hacia WhatsApp" rows={[{label:'Consulta de precios',value:summary.inquiry_clicks},{label:'Lista de compras',value:summary.cart_clicks},{label:'Contacto directo',value:summary.contact_clicks}]} />
      </div>
      <section className={styles.card}><h2 className={`${styles.heading} mb-4 text-xl`}>Páginas visitadas</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Página</th><th>Vistas</th><th>Visitas</th></tr></thead><tbody>{report.pages.map(row=><tr key={row.path}><td>{row.path === '/landing' ? 'Landing' : 'Catálogo'}</td><td>{number(row.views)}</td><td>{number(row.visits)}</td></tr>)}</tbody></table></div><p className={`${styles.muted} mt-4`}>{number(summary.catalog_visits)} visitas tuvieron actividad en el catálogo. {number(summary.cart_adds)} productos fueron agregados a listas de compras.</p></section>
      <p className={`${styles.muted} pb-4`}>Las métricas son aproximadas y solo se recopilan con estadísticas autorizadas. Se excluyen sesiones de empleados, desarrollo local, robots identificables y navegadores que piden no ser rastreados. Un mismo navegador puede generar varias visitas; una persona con varios dispositivos puede contarse varias veces. “Directo” también incluye orígenes que el navegador no comunica. Los clics a WhatsApp no confirman mensajes enviados ni ventas.</p>
    </div>}
  </div></main>
}
