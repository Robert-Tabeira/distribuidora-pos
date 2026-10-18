import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The client needs to read uploaded SVG markup to adjust its stroke. Proxy only
// category icons from the public landing-sections folder to avoid an open proxy.
export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file') || ''
  if (!/^[a-zA-Z0-9_-]+\.svg$/i.test(file)) {
    return NextResponse.json({ message: 'Archivo no permitido' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return NextResponse.json({ message: 'Supabase no configurado' }, { status: 500 })

  try {
    const baseUrl = new URL(supabaseUrl)
    const upstreamUrl = new URL(`/storage/v1/object/public/product-images/landing-sections/${encodeURIComponent(file)}`, baseUrl)
    const response = await fetch(upstreamUrl, { cache: 'no-store' })
    if (!response.ok) return NextResponse.json({ message: 'No se pudo cargar el icono' }, { status: response.status === 404 ? 404 : 502 })

    const svg = await response.text()
    if (svg.length > 1_000_000 || !/<svg[\s>]/i.test(svg)) {
      return NextResponse.json({ message: 'El archivo no es un SVG válido' }, { status: 400 })
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ message: 'No se pudo cargar el icono' }, { status: 502 })
  }
}
