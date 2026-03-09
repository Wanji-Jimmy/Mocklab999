import { UploadPayloadInput, ValidationIssue, ValidationReport } from '@/lib/server/contracts'

const ALLOWED_EXAM_TYPES = new Set(['TMUA', 'ESAT'])

export function validateUploadPayload(payload: unknown): ValidationReport {
  const issues: ValidationIssue[] = []

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      totalQuestions: 0,
      issueCount: 1,
      issues: [{ path: 'payload', message: 'Payload must be an object' }],
    }
  }

  const body = payload as Partial<UploadPayloadInput>

  if (!body.examType || !ALLOWED_EXAM_TYPES.has(body.examType)) {
    issues.push({ path: 'examType', message: 'examType must be TMUA or ESAT' })
  }

  if (!body.name || !String(body.name).trim()) {
    issues.push({ path: 'name', message: 'name is required' })
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    issues.push({ path: 'questions', message: 'questions must be a non-empty array' })
    return {
      valid: false,
      totalQuestions: 0,
      issueCount: issues.length,
      issues,
    }
  }

  const seenQuestionKeys = new Set<string>()
  const total = body.questions.length

  body.questions.forEach((question, index) => {
    const path = `questions[${index}]`

    if (!question || typeof question !== 'object') {
      issues.push({ path, message: 'question must be an object' })
      return
    }

    const questionNumber = Number(question.questionNumber)
    if (!Number.isInteger(questionNumber) || questionNumber < 1) {
      issues.push({ path: `${path}.questionNumber`, message: 'questionNumber must be a positive integer' })
    }

    if (!question.moduleOrPaper || !String(question.moduleOrPaper).trim()) {
      issues.push({ path: `${path}.moduleOrPaper`, message: 'moduleOrPaper is required' })
    }

    if (!question.stemLatex || !String(question.stemLatex).trim()) {
      issues.push({ path: `${path}.stemLatex`, message: 'stemLatex is required' })
    }

    if (!question.explanationLatex || !String(question.explanationLatex).trim()) {
      issues.push({ path: `${path}.explanationLatex`, message: 'explanationLatex is required' })
    }

    const answerKey = String(question.answerKey || '').trim().toUpperCase()
    if (!answerKey) {
      issues.push({ path: `${path}.answerKey`, message: 'answerKey is required' })
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      issues.push({ path: `${path}.options`, message: 'options must have at least 2 choices' })
    } else {
      const seenOptionKeys = new Set<string>()
      for (let optIndex = 0; optIndex < question.options.length; optIndex += 1) {
        const option = question.options[optIndex]
        const optionPath = `${path}.options[${optIndex}]`
        const key = String(option?.key || '').trim().toUpperCase()
        const latex = String(option?.latex || '').trim()

        if (!key) {
          issues.push({ path: `${optionPath}.key`, message: 'option key is required' })
        }
        if (seenOptionKeys.has(key)) {
          issues.push({ path: `${optionPath}.key`, message: `duplicate option key ${key}` })
        }
        if (!latex && !String(option?.image || '').trim()) {
          issues.push({ path: `${optionPath}.latex`, message: 'option latex or image is required' })
        }

        if (key) seenOptionKeys.add(key)
      }

      if (answerKey && !question.options.some((option) => String(option?.key || '').trim().toUpperCase() === answerKey)) {
        issues.push({ path: `${path}.answerKey`, message: `answerKey ${answerKey} is not present in options` })
      }
    }

    const dedupeKey = `${String(question.moduleOrPaper || '').trim()}#${questionNumber}`
    if (seenQuestionKeys.has(dedupeKey)) {
      issues.push({ path, message: `duplicate question key ${dedupeKey}` })
    } else {
      seenQuestionKeys.add(dedupeKey)
    }
  })

  return {
    valid: issues.length === 0,
    totalQuestions: total,
    issueCount: issues.length,
    issues,
  }
}
