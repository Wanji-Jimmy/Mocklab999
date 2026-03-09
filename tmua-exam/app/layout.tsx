import './globals.css'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import ButtonMotionEnhancer from '@/components/ButtonMotionEnhancer'
import ExamLaunchTransition from '@/components/ExamLaunchTransition'

export const metadata: Metadata = {
  title: 'MockLab999 | TMUA + ESAT Mock Platform',
  description: 'Independent TMUA and ESAT mock routes with timed papers, scoring, review, and mistake tracking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ButtonMotionEnhancer />
        <ExamLaunchTransition />
        {children}
      </body>
    </html>
  )
}
