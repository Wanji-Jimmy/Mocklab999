import './globals.css'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import ButtonMotionEnhancer from '@/components/ButtonMotionEnhancer'
import ExamLaunchTransition from '@/components/ExamLaunchTransition'

export const metadata: Metadata = {
  title: 'MockLab999 | TMUA Mock Platform',
  description: 'TMUA full mock exams from 2016 to 2023 with automatic grading, review, and mistake tracking.',
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
