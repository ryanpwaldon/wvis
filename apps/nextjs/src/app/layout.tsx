import type { Metadata, Viewport } from 'next'
import { Martian_Mono as FontMono } from 'next/font/google'
import { cn } from '@acme/ui'
import { ThemeProvider } from '@acme/ui/theme'
import { TooltipProvider } from '@acme/ui/tooltip'

import '~/app/globals.css'

import { env } from '~/env'

const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
})

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
    <html className="h-full w-full" lang="en" suppressHydrationWarning>
      <body className={cn('fixed left-0 top-0 h-full w-full bg-background font-mono text-xs font-light text-foreground antialiased', fontMono.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{props.children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
