'use client'

import { formatTime } from '@/lib/utils'

interface Paper2InstructionsScreenProps {
  timeLeft: number
  onStartPaper2: () => void
  nextPaperLabel?: string
}

export default function Paper2InstructionsScreen({
  timeLeft,
  onStartPaper2,
  nextPaperLabel = 'Paper 2',
}: Paper2InstructionsScreenProps) {
  return (
    <main className="max-w-5xl mx-auto">
      <div className="mb-4 text-lg font-semibold">Review complete. {nextPaperLabel} starts next.</div>

      <div className="mb-5 inline-flex rounded-md border border-[#016daa] bg-white px-4 py-2 text-xl font-mono font-bold text-[#016daa]">
        {formatTime(timeLeft)}
      </div>

      <p className="mb-3 text-sm">
        You are about to proceed to {nextPaperLabel}. You cannot return to Paper 1 after this point.
      </p>
      <p className="mb-5 text-sm">Click the button below when you are ready to continue.</p>

      <button
        onClick={onStartPaper2}
        className="rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold hover:bg-slate-100"
      >
        Start {nextPaperLabel}
      </button>
    </main>
  )
}
