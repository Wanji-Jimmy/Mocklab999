'use client'

import { useEffect, useState } from 'react'
import { Question } from '@/lib/types'
import LatexRenderer from '@/components/LatexRenderer'
import { getOfficialPdfUrl, hasDiagramPlaceholderOption, isDiagramPlaceholderOptionText } from '@/lib/esat-official-pdf'

interface ReviewQuestionProps {
  question: Question
  userAnswer?: string
  onBack: () => void
  onAddToMistakes: (questionId: string) => void
}

export default function ReviewQuestion({
  question,
  userAnswer,
  onBack,
  onAddToMistakes,
}: ReviewQuestionProps) {
  const [stemImageFailed, setStemImageFailed] = useState(false)
  const [explanationImageFailed, setExplanationImageFailed] = useState(false)
  const hasPlaceholderOptions = hasDiagramPlaceholderOption(question)
  const officialPdfUrl = hasPlaceholderOptions ? getOfficialPdfUrl(question) : null

  useEffect(() => {
    setStemImageFailed(false)
    setExplanationImageFailed(false)
  }, [question?.id, question?.stemImage, question?.explanationImage])

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 py-10 space-y-4">
      <button onClick={onBack} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm">
        Back to Results
      </button>

      <div className="brand-card rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-black text-slate-900">
          Paper {question.paper}, Question {question.index + 1}
        </h2>

        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Question</h3>
          <div className="text-lg leading-relaxed brand-card-muted p-5 rounded-xl">
            <LatexRenderer latex={question.stemLatex} />
            {question.stemImage && !stemImageFailed && (
              <img
                src={question.stemImage}
                alt="Question stem"
                className="mt-4 max-w-full h-auto rounded-lg border border-slate-200 bg-white"
                onError={() => setStemImageFailed(true)}
              />
            )}
            {question.stemImage && stemImageFailed && (
              <p className="mt-3 text-sm text-amber-700">Question image failed to load on this device.</p>
            )}
          </div>
        </div>

        <div className="mt-7">
          <h3 className="text-lg font-bold mb-3">Options</h3>
          {hasPlaceholderOptions && officialPdfUrl && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Some options are diagram-based and may not be fully rendered in text.
              {' '}
              <a href={officialPdfUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                Open official question PDF
              </a>
              {' '}
              to review the original figure.
            </div>
          )}
          <div className="space-y-3">
            {question.options.map((option) => (
              <div
                key={option.key}
                className={`p-4 border-2 rounded-xl ${
                  option.key === question.answerKey
                    ? 'border-emerald-400 bg-emerald-50'
                    : option.key === userAnswer
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start">
                  <span className="font-semibold mr-3">{option.key}.</span>
                  <div className="flex-1">
                    {isDiagramPlaceholderOptionText(option.latex) ? (
                      <p className="text-slate-700">Diagram option {option.key}. Refer to the official PDF figure.</p>
                    ) : (
                      <LatexRenderer latex={option.latex} />
                    )}
                  </div>
                  {option.key === question.answerKey && (
                    <span className="ml-2 text-emerald-700 text-sm font-semibold">Correct</span>
                  )}
                  {option.key === userAnswer && option.key !== question.answerKey && (
                    <span className="ml-2 text-red-700 text-sm font-semibold">Your answer</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!userAnswer && (
            <div className="mt-4 text-sm text-red-600 font-semibold">You did not answer this question.</div>
          )}
        </div>

        <div className="mt-7">
          <h3 className="text-lg font-bold mb-3">Explanation</h3>
          <div className="rounded-xl p-5 border border-blue-200 bg-blue-50">
            <LatexRenderer latex={question.explanationLatex} />
            {question.explanationImage && !explanationImageFailed && (
              <img
                src={question.explanationImage}
                alt="Question explanation"
                className="mt-4 max-w-full h-auto rounded-lg border border-blue-200 bg-white"
                onError={() => setExplanationImageFailed(true)}
              />
            )}
            {question.explanationImage && explanationImageFailed && (
              <p className="mt-3 text-sm text-amber-700">Explanation image failed to load on this device.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onAddToMistakes(question.id)}
            className="px-6 py-3 bg-tmua-blue text-white rounded-lg hover:bg-blue-900 font-semibold"
          >
            Add to Mistake Book
          </button>
        </div>
      </div>
    </div>
  )
}
