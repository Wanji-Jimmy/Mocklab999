// Exam state machine types
export type ExamState =
  | 'WELCOME'
  | 'READING_COUNTDOWN'
  | 'PAPER1_ACTIVE'
  | 'PAPER2_INSTRUCTIONS'
  | 'PAPER2_ACTIVE'
  | 'PAPER3_INSTRUCTIONS'
  | 'PAPER3_ACTIVE'
  | 'SUBMIT_CONFIRM'
  | 'RESULT_SUMMARY'
  | 'REVIEW_QUESTION'

export type ColorScheme = 'light' | 'high-contrast' | 'black-on-light-yellow' | 'black-on-salmon' | 'black-on-white' | 'black-on-yellow'

export interface QuestionOption {
  key: string
  latex: string
  image?: string // Option image URL (new format)
}

export interface Question {
  id: string
  paper: number
  index: number
  stemLatex: string
  stemImage?: string // Stem image URL (new format)
  imageUrl?: string // Single image URL (legacy, compatibility)
  imageUrls?: string[] // Multiple image URLs (legacy, compatibility)
  options: QuestionOption[]
  answerKey: string
  explanationLatex: string
  explanationImage?: string
  tags: string[]
  difficulty: number
}

export interface ExamSession {
  state: ExamState
  colorScheme: ColorScheme
  currentPaper: 1 | 2 | 3
  currentQuestionIndex: number
  
  // Timer
  paper1TimeLeft: number // seconds
  paper2TimeLeft: number // seconds
  paper3TimeLeft: number // seconds
  paper2InstructionsTimeLeft: number // seconds
  paper3InstructionsTimeLeft: number // seconds
  readingTimeLeft: number // seconds
  
  // Answers and flags
  paper1Answers: Record<number, string> // questionIndex -> selectedOption
  paper2Answers: Record<number, string>
  paper3Answers: Record<number, string>
  paper1Flags: Record<number, boolean>
  paper2Flags: Record<number, boolean>
  paper3Flags: Record<number, boolean>
  
  // Results
  scoreP1?: number
  scoreP2?: number
  scoreP3?: number
  totalScore?: number
  grade?: number
  questionOutcomes?: Array<{
    question: Question
    userAnswer?: string
    correctAnswer: string
    isCorrect: boolean
  }>
  
  // Review state
  reviewingQuestionId?: string
}

export interface GradeMapping {
  score: number
  grade: number
}

export const INITIAL_SESSION: ExamSession = {
  state: 'WELCOME',
  colorScheme: 'light',
  currentPaper: 1,
  currentQuestionIndex: 0,
  
  paper1TimeLeft: 75 * 60, // 75 minutes
  paper2TimeLeft: 75 * 60,
  paper3TimeLeft: 75 * 60,
  paper2InstructionsTimeLeft: 1 * 60, // 1 minute
  paper3InstructionsTimeLeft: 1 * 60, // 1 minute
  readingTimeLeft: 1 * 60, // 1 minute
  
  paper1Answers: {},
  paper2Answers: {},
  paper3Answers: {},
  paper1Flags: {},
  paper2Flags: {},
  paper3Flags: {},
}
