import type { Metadata, Viewport } from 'next'
import './globals.css'
import './google-fonts.css'
import { SiteFontLoader } from '@/components/site-font-loader'
import { publicSiteOrigin } from '@/lib/public-seo'

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin()),
  title: 'Distribuidora Los Primos | Las Toscas',
  description: 'Catálogo de Los Primos, consultas de precios y pedidos por WhatsApp. Las Toscas, Canelones, Uruguay.',
  applicationName: 'Los Primos',
  robots: { index: false, follow: true },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined },
  icons: { icon: [{ url: '/favicon' }] },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <SiteFontLoader />
        {children}
      </body>
    </html>
  )
}
