import './globals.css'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import ButtonMotionEnhancer from '@/components/ButtonMotionEnhancer'
import ExamLaunchTransition from '@/components/ExamLaunchTransition'
import { LanguageProvider } from '@/components/LanguageProvider'

export const metadata: Metadata = {
  title: 'MockLab999 | TMUA Preparation Platform',
  description: 'Prepare for TMUA with full timed mocks, score conversion, mistake review, and application-focused guides.',
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
