import { formatTime } from '@/lib/utils'

interface ReadingCountdownProps {
  timeLeft: number
}

export default function ReadingCountdown({ timeLeft }: ReadingCountdownProps) {
  return (
    <main className="max-w-5xl mx-auto">
      <p className="mb-4 text-sm font-bold">You have 1 minute to read these instructions.</p>
      <div className="mb-5 inline-flex rounded-md border border-[#016daa] bg-white px-4 py-2 text-xl font-mono font-bold text-[#016daa]">
        {formatTime(timeLeft)}
      </div>

      <p className="mb-3 text-sm">This exam consists of two subtests:</p>
      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-[#016daa] bg-[#016daa] px-3 py-2 text-left text-white">Subtest</th>
            <th className="border border-[#016daa] bg-[#016daa] px-3 py-2 text-left text-white">Number of Questions</th>
            <th className="border border-[#016daa] bg-[#016daa] px-3 py-2 text-left text-white">Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#016daa] px-3 py-2">Paper 1</td>
            <td className="border border-[#016daa] px-3 py-2">20</td>
            <td className="border border-[#016daa] px-3 py-2">75 minutes</td>
          </tr>
          <tr>
            <td className="border border-[#016daa] px-3 py-2">Paper 2</td>
            <td className="border border-[#016daa] px-3 py-2">20</td>
            <td className="border border-[#016daa] px-3 py-2">75 minutes</td>
          </tr>
        </tbody>
      </table>

      <p className="mb-3 text-sm">For each question, choose the one answer you consider correct.</p>
      <p className="mb-3 text-sm">
        There are no penalties for incorrect responses, only marks for correct answers, so you should attempt all 20
        questions. Each question is worth one mark.
      </p>
      <p className="text-sm">
        Please click the <span className="font-bold">Next (N)</span> button to proceed.
      </p>
    </main>
  )
}
