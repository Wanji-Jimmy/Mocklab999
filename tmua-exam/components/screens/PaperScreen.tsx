'use client'

import { useEffect, useState } from 'react'
import { Question, ColorScheme } from '@/lib/types'
import LatexRenderer from '@/components/LatexRenderer'

interface PaperScreenProps {
  question: Question
  selectedAnswer: string | undefined
  onAnswerSelect: (answer: string) => void
  currentIndex: number
  colorScheme: ColorScheme
}

function getSurfaceStyle(colorScheme: ColorScheme) {
  if (colorScheme === 'black-on-light-yellow') return { backgroundColor: '#ffff80', color: '#000000' }
  if (colorScheme === 'black-on-salmon') return { backgroundColor: '#fdd3c5', color: '#000000' }
  if (colorScheme === 'black-on-white') return { backgroundColor: '#ffffff', color: '#000000' }
  if (colorScheme === 'black-on-yellow') return { backgroundColor: '#ffff00', color: '#000000' }
  if (colorScheme === 'high-contrast') return { backgroundColor: '#000000', color: '#ffffff' }
  return { backgroundColor: '#ffffff', color: '#000000' }
}

export default function PaperScreen({
  question,
  selectedAnswer,
  onAnswerSelect,
  currentIndex,
  colorScheme,
}: PaperScreenProps) {
  const [stemImageFailed, setStemImageFailed] = useState(false)

  useEffect(() => {
    setStemImageFailed(false)
  }, [question?.id, question?.stemImage])

  if (!question) {
    return (
      <main className="max-w-5xl mx-auto">
        <p className="text-sm">Loading question...</p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto" style={getSurfaceStyle(colorScheme)}>
      <div className="mb-5 rounded-xl border border-[#b7c5d8] px-4 py-4">
        <h3 className="mb-3 text-[36px] leading-none font-bold">{currentIndex + 1}</h3>
        {question.stemLatex && question.stemLatex !== 'Question text unavailable.' && (
          <div className="text-[28px] leading-relaxed">
            <LatexRenderer latex={question.stemLatex} />
          </div>
        )}
        {question.stemImage && !stemImageFailed && (
          <img
            src={question.stemImage}
            alt="Question stem"
            className="max-w-full h-auto mt-3"
            onError={() => setStemImageFailed(true)}
          />
        )}
        {question.stemImage && stemImageFailed && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Question image failed to load. Please refresh and try again.
          </p>
        )}
      </div>

      {question.imageUrl && (
        <div className="mb-4 flex justify-center">
          <img src={question.imageUrl} alt="Question diagram" className="max-w-full h-auto border border-slate-300" />
        </div>
      )}
      {question.imageUrls && question.imageUrls.length > 0 && (
        <div className="mb-4 space-y-4">
          {question.imageUrls.map((url, idx) => (
            <div key={idx} className="flex justify-center">
              <img src={url} alt={`Question diagram ${idx + 1}`} className="max-w-full h-auto border border-slate-300" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 pb-4">
        {question.options.map((option) => {
          const selected = selectedAnswer === option.key
          return (
            <label
              key={option.key}
              className={`flex items-start rounded-2xl border-2 px-4 py-4 cursor-pointer ${
                selected ? 'border-blue-600 bg-blue-50' : 'border-[#bcc8d9] bg-white'
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.key}
                checked={selected}
                onChange={() => onAnswerSelect(option.key)}
                className="mt-1 mr-4"
              />
              <div className="text-[36px] leading-none font-bold mr-4">{option.key}.</div>
              <div className="flex-1 text-[32px] leading-snug">
                {option.latex && <LatexRenderer latex={option.latex} />}
                {option.image && (
                  <img src={option.image} alt={`Option ${option.key}`} className="max-w-full h-auto mt-2" />
                )}
                {!option.latex && !option.image && (
                  <LatexRenderer latex={option.latex} />
                )}
              </div>
            </label>
          )
        })}
      </div>
    </main>
  )
}
