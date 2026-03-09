interface SubmitConfirmProps {
  paper1Answers: Record<number, string>
  paper2Answers: Record<number, string>
  paper1Flags: Record<number, boolean>
  paper2Flags: Record<number, boolean>
  onConfirm: () => void
  onCancel: () => void
}

export default function SubmitConfirm({
  paper1Answers,
  paper2Answers,
  paper1Flags,
  paper2Flags,
  onConfirm,
  onCancel,
}: SubmitConfirmProps) {
  const getStatus = (answers: Record<number, string>, idx: number) => {
    if (answers[idx]) return 'Complete'
    return 'Incomplete'
  }

  const getStatusColor = (answers: Record<number, string>, idx: number) => {
    if (answers[idx]) return 'text-green-600'
    return 'text-red-500'
  }

  return (
    <main className="max-w-6xl mx-auto">
      <div className="mb-5 text-lg font-semibold">Review your answers before completing the TMUA:</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-center">Paper 1</h3>
          <table className="w-full border-collapse">
            <thead className="bg-tmua-blue text-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold border">Question #</th>
                <th className="px-3 py-2 text-left font-semibold border">Status</th>
                <th className="px-3 py-2 text-left font-semibold border">Flagged for Review</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }, (_, i) => {
                const isFlagged = paper1Flags[i]
                const status = getStatus(paper1Answers, i)
                const statusColor = getStatusColor(paper1Answers, i)
                const rowBg = isFlagged ? 'bg-yellow-100' : 'bg-white'

                return (
                  <tr key={i} className={`border ${rowBg}`}>
                    <td className="px-3 py-2 border text-sm">Question {i + 1}</td>
                    <td className={`px-3 py-2 font-semibold border text-sm ${statusColor}`}>{status}</td>
                    <td className="px-3 py-2 border text-sm">{isFlagged ? '⚑' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2 text-center">Paper 2</h3>
          <table className="w-full border-collapse">
            <thead className="bg-tmua-blue text-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold border">Question #</th>
                <th className="px-3 py-2 text-left font-semibold border">Status</th>
                <th className="px-3 py-2 text-left font-semibold border">Flagged for Review</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }, (_, i) => {
                const isFlagged = paper2Flags[i]
                const status = getStatus(paper2Answers, i)
                const statusColor = getStatusColor(paper2Answers, i)
                const rowBg = isFlagged ? 'bg-yellow-100' : 'bg-white'

                return (
                  <tr key={i} className={`border ${rowBg}`}>
                    <td className="px-3 py-2 border text-sm">Question {i + 1}</td>
                    <td className={`px-3 py-2 font-semibold border text-sm ${statusColor}`}>{status}</td>
                    <td className="px-3 py-2 border text-sm">{isFlagged ? '⚑' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center gap-3 pb-2">
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
        >
          Back to Paper 2
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 bg-tmua-blue text-white rounded hover:bg-blue-800 font-semibold"
        >
          Complete TMUA
        </button>
      </div>
    </main>
  )
}
