import { Question } from '@/lib/types'
import { calculateGrade } from '@/lib/utils'

export interface QuestionOutcome {
  question: Question
  userAnswer?: string
  correctAnswer: string
  isCorrect: boolean
}

export interface ExamEvaluation {
  scoreP1: number
  scoreP2: number
  totalScore: number
  grade: number
  questionOutcomes: QuestionOutcome[]
}

export function evaluateExam(
  questions: Question[],
  paper1Answers: Record<number, string>,
  paper2Answers: Record<number, string>,
): ExamEvaluation {
  const ordered = [...questions].sort((a, b) => {
    if (a.paper !== b.paper) return a.paper - b.paper
    return a.index - b.index
  })

  let scoreP1 = 0
  let scoreP2 = 0
  const questionOutcomes: QuestionOutcome[] = []

  for (const q of ordered) {
    const userAnswer = q.paper === 1 ? paper1Answers[q.index] : paper2Answers[q.index]
    const isCorrect = userAnswer === q.answerKey

    if (q.paper === 1 && isCorrect) scoreP1 += 1
    if (q.paper === 2 && isCorrect) scoreP2 += 1

    questionOutcomes.push({
      question: q,
      userAnswer,
      correctAnswer: q.answerKey,
      isCorrect,
    })
  }

  const totalScore = scoreP1 + scoreP2
  const grade = calculateGrade(totalScore)

  return {
    scoreP1,
    scoreP2,
    totalScore,
    grade,
    questionOutcomes,
  }
}
