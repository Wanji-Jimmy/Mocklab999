'use client'

interface NavigatorModalProps {
  isOpen: boolean
  onClose: () => void
  totalQuestions: number
  answers: Record<number, string>
  flags: Record<number, boolean>
  onJumpToQuestion: (index: number) => void
  currentIndex: number
}

function getStatus(idx: number, currentIndex: number, answers: Record<number, string>): 'Complete' | 'Incomplete' | 'Unseen' {
  if (answers[idx]) return 'Complete'
  if (idx > currentIndex) return 'Unseen'
  return 'Incomplete'
}

function getStatusColor(status: 'Complete' | 'Incomplete' | 'Unseen'): string {
  if (status === 'Complete') return 'text-black'
  return 'text-red-600'
}

export default function NavigatorModal({
  isOpen,
  onClose,
  totalQuestions,
  answers,
  flags,
  onJumpToQuestion,
  currentIndex,
}: NavigatorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-md bg-white p-5">
        <div className="h-[400px] overflow-y-auto overflow-x-hidden border border-[#005b97]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-[#005b97] bg-[#005b97] px-3 py-2 text-left text-sm text-white">Question #</th>
                <th className="border border-[#005b97] bg-[#005b97] px-3 py-2 text-left text-sm text-white">Status</th>
                <th className="border border-[#005b97] bg-[#005b97] px-3 py-2 text-left text-sm text-white">Flagged for Review</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalQuestions }, (_, idx) => {
                const status = getStatus(idx, currentIndex, answers)
                const flagged = Boolean(flags[idx])
                const current = idx === currentIndex
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      onJumpToQuestion(idx)
                      onClose()
                    }}
                    className={`cursor-pointer ${current ? 'bg-[#fffd70]' : 'hover:bg-[#fffd70]'}`}
                  >
                    <td className="border border-[#005b97] px-3 py-2 text-sm">Question {idx + 1}</td>
                    <td className={`border border-[#005b97] px-3 py-2 text-sm font-semibold ${getStatusColor(status)}`}>
                      {status}
                    </td>
                    <td className="border border-[#005b97] px-3 py-2 text-sm">{flagged ? '⚑' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-md bg-[#005b97] px-5 py-2 text-white hover:bg-[#004a7a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
