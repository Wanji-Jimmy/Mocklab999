import { ExamTypeValue } from '@/lib/server/model-constants'

export interface SubmittedAnswerMap {
  [questionId: string]: string
}

export interface ScoringQuestion {
  id: string
  moduleOrPaper: string
  questionNumber: number
  answerKey: string
}

export interface ScoreBreakdown {
  [moduleOrPaper: string]: {
    total: number
    correct: number
  }
}

export function evaluateSubmission(
  examType: ExamTypeValue,
  questions: ScoringQuestion[],
  submittedAnswers: SubmittedAnswerMap,
): {
  examType: ExamTypeValue
  totalQuestions: number
  totalCorrect: number
  scoreBreakdown: ScoreBreakdown
  outcomes: Array<{
    questionId: string
    moduleOrPaper: string
    questionNumber: number
    userAnswer?: string
    correctAnswer: string
    isCorrect: boolean
  }>
} {
  const scoreBreakdown: ScoreBreakdown = {}
  let totalCorrect = 0

  const outcomes = questions.map((question) => {
    const userAnswer = submittedAnswers[question.id]
    const isCorrect = userAnswer === question.answerKey

    if (!scoreBreakdown[question.moduleOrPaper]) {
      scoreBreakdown[question.moduleOrPaper] = { total: 0, correct: 0 }
    }

    scoreBreakdown[question.moduleOrPaper].total += 1
    if (isCorrect) {
      scoreBreakdown[question.moduleOrPaper].correct += 1
      totalCorrect += 1
    }

    return {
      questionId: question.id,
      moduleOrPaper: question.moduleOrPaper,
      questionNumber: question.questionNumber,
      userAnswer,
      correctAnswer: question.answerKey,
      isCorrect,
    }
  })

  return {
    examType,
    totalQuestions: questions.length,
    totalCorrect,
    scoreBreakdown,
    outcomes,
  }
}
