export const EXAM_TYPES = {
  TMUA: 'TMUA',
  ESAT: 'ESAT',
} as const

export type ExamTypeValue = (typeof EXAM_TYPES)[keyof typeof EXAM_TYPES]

export const UPLOAD_STATUS = {
  UPLOADED: 'UPLOADED',
  VALIDATED: 'VALIDATED',
  FAILED: 'FAILED',
  PUBLISHED: 'PUBLISHED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const

export type UploadStatusValue = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS]
