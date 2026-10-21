import type { Metadata, Viewport } from 'next'
import './globals.css'
import './google-fonts.css'
import { SiteFontLoader } from '@/components/site-font-loader'
import { SiteFaviconLoader } from '@/components/site-favicon-loader'

export const metadata: Metadata = {
  title: 'Distribuidora POS',
  description: 'Sistema de punto de venta para distribuidora',
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
        <SiteFaviconLoader />
        {children}
      </body>
    </html>
  )
}
