import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { cn } from '@sctv/ui'
import { ThemeProvider } from '@sctv/ui/theme'

import { TRPCReactProvider } from '~/trpc/react'

import '~/app/globals.css'

import { env } from '~/env'

export const metadata: Metadata = {
  metadataBase: new URL(env.VERCEL_ENV === 'production' ? 'https://sctv.com/' : 'http://localhost:3000'),
  title: 'SCTV',
  description: undefined,
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans text-foreground antialiased', GeistSans.variable, GeistMono.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
