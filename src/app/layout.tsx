import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import OnlineStatus from '@/components/Offline/OnlineStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ruta Azteca',
  description: 'Conectando turistas del Mundial FIFA 2026 con negocios locales verificados',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#C8102E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <OnlineStatus />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
