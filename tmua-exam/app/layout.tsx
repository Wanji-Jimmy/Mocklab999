import './globals.css'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import ButtonMotionEnhancer from '@/components/ButtonMotionEnhancer'
import ExamLaunchTransition from '@/components/ExamLaunchTransition'
import { LanguageProvider } from '@/components/LanguageProvider'

export const metadata: Metadata = {
  title: 'MockLab999 | TMUA + ESAT Mock Platform',
  description: 'Prepare for UK admissions tests with realistic mocks, course-specific pathways, and weakness diagnosis.',
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
