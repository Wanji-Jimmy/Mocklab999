import './globals.css'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import ButtonMotionEnhancer from '@/components/ButtonMotionEnhancer'
import ExamLaunchTransition from '@/components/ExamLaunchTransition'
import { LanguageProvider } from '@/components/LanguageProvider'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ButtonMotionEnhancer />
          <ExamLaunchTransition />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
