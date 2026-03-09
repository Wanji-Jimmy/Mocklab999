export type ExamType = 'TMUA' | 'ESAT'

export interface UploadOptionInput {
  key: string
  latex: string
  image?: string
}

export interface UploadQuestionInput {
  questionNumber: number
  moduleOrPaper: string
  stemLatex: string
  stemImage?: string
  explanationLatex: string
  explanationImage?: string
  answerKey: string
  difficulty?: number
  tags?: string[]
  options: UploadOptionInput[]
}

export interface UploadPayloadInput {
  examType: ExamType
  name: string
  year?: number
  moduleKey?: string
  questions: UploadQuestionInput[]
}

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationReport {
  valid: boolean
  totalQuestions: number
  issueCount: number
  issues: ValidationIssue[]
}
