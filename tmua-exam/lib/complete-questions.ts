import rawQuestions from '@/data/tmua_questions_with_answers_320.json'
import stemOverrides from '@/data/stem_overrides.json'
import stemImageOverrides from '@/data/stem_image_overrides.json'
import explanationOverrides from '@/data/explanation_overrides.json'
import { Question } from '@/lib/types'

type RawOption = {
  key: string
  text?: string
  latex?: string
  image?: string
}

type RawQuestion = {
  year: string
  paper: number
  number: number
  stem: string
  stemImage?: string
  imageUrl?: string
  imageUrls?: string[]
  options: RawOption[]
  answer: string
  explanation: string
}

const typedRawQuestions = rawQuestions as RawQuestion[]
const typedStemOverrides = stemOverrides as Record<string, string>
const typedStemImageOverrides = stemImageOverrides as Record<string, string>
const typedExplanationOverrides = explanationOverrides as Record<string, string>

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function normalizeLatexSource(value: unknown): string {
  let normalized = normalizeText(value)
  if (!normalized) return normalized

  // TMUAguru exports commonly wrap the whole sentence in "$$ ... $$".
  if (normalized.startsWith('$$') && normalized.endsWith('$$') && normalized.length > 4) {
    normalized = normalized.slice(2, -2).trim()
  }

  // Internal "$$$$" sequences act like hard separators between text chunks.
  normalized = normalized.replace(/\${4,}/g, '\n\n')

  // Keep prose readable after delimiter cleanup.
  normalized = normalized.replace(/[ \t]{2,}/g, ' ').trim()

  return normalized
}

function isImageLikeUrl(value: string): boolean {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(value.trim())
}

function normalizeImagePath(value: unknown): string | undefined {
  const normalized = normalizeText(value)
  if (!normalized) return undefined
  return normalized
}

function stripImageUrls(text: string): string {
  return text.replace(/https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?/gi, '').trim()
}

function cleanExtractedText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\u0088/g, ' • ')
    .replace(/([A-Za-z0-9])\u0338=/g, '$1≠')
    .replace(/\u0338=/g, '≠')
    .replace(/[\uf8f0-\uf8ff]/gi, ' ')
    .replace(/˙/g, '')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    .replace(/\. \. \./g, '...')
    .replace(/–/g, '-')
    .replace(/−/g, '-')
    .replace(/©\s*UCLES\s*\d{4}/gi, '')
    .replace(/Version\s+\d+(?:\.\d+)?,\s*[A-Za-z]+\s+\d{4}\s+Page\s+\d+/gi, '')
    .replace(/Test of Mathematics for University Admission,?\s*\d{4}\s*Paper\s*[12]\s*Solutions?/gi, '')
    .replace(/We are Cambridge Assessment Admissions Testing[^.\n]*(?:\.\s*)?/gi, '')
    // Repair common OCR math patterns before rendering.
    .replace(/\b([A-Za-z])2\^([A-Za-z(])/g, '$1\\cdot 2^$2')
    .replace(/(\))\s*([0-9])(?=(?:\s|[+\-*/=<>≤≥⩽⩾,.;:!?()|]|$))/g, '$1^$2')
    .replace(/([A-Za-z])([2-9])(?=[A-Za-z])/g, '$1^$2')
    .replace(/\b(sin|cos|tan|cot|sec|csc)\s*([2-9])\b/gi, '$1^$2')
    .replace(/\b([b-z])([2-9])(?=(?:\s|[+\-*/=<>≤≥⩽⩾,.;:!?()|]|$))/gi, '$1^$2')
    .replace(/\\sqrt\s*(?=[,.;:!?)]|$)/g, '')
    .replace(/√\s+([0-9A-Za-z(])/g, '√$1')
    .replace(/^\s*√\s*$/gm, '')
    .replace(/^\s*√\s*(?:[,.;:!?]|$)\s*$/gm, '')
    .replace(/^\s*[¯_—\-]{4,}\s*$/gm, '')
    .replace(/\(cid:\d+\)/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isUsefulExplanation(text: string): boolean {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return false
  if (compact.length >= 40) return true
  return compact.length >= 20 && /[A-Za-z]{3}/.test(compact)
}

function normalizeOptions(options: RawOption[]): Array<{ key: string; latex: string; image?: string }> {
  const seen = new Set<string>()
  const normalized: Array<{ key: string; latex: string; image?: string }> = []

  for (const option of options) {
    const key = String(option?.key || '').trim().toUpperCase()
    const rawText = normalizeLatexSource(option?.text ?? option?.latex)
    const imageFromField = normalizeImagePath(option?.image)
    const imageFromText = isImageLikeUrl(rawText) ? rawText : undefined
    const image = imageFromField || imageFromText
    const latex = imageFromText ? '' : rawText
    if (!key || (!latex && !image) || seen.has(key)) continue
    seen.add(key)
    normalized.push({ key, latex, image })
  }

  if (normalized.length >= 2) return normalized

  // Keep exam flow functional even if source parsing produced invalid options.
  return [
    { key: 'A', latex: normalized[0]?.latex || 'Option unavailable', image: normalized[0]?.image },
    { key: 'B', latex: 'Option unavailable' },
  ]
}

export const completeQuestions: Question[] = typedRawQuestions.map((q) => {
  const questionKey = `${q.year}-P${q.paper}-Q${q.number}`
  const options = normalizeOptions(q.options || [])
  const answerKey = String(q.answer || '').trim().toUpperCase()
  const safeAnswerKey = options.some((option) => option.key === answerKey) ? answerKey : options[0].key
  const rawExplanation = normalizeLatexSource(q.explanation || '')
  const explanationImage = isImageLikeUrl(rawExplanation) ? rawExplanation : undefined
  const recoveredExplanationRaw = cleanExtractedText(normalizeLatexSource(typedExplanationOverrides[questionKey] || ''))
  const recoveredExplanation = isUsefulExplanation(recoveredExplanationRaw) ? recoveredExplanationRaw : ''
  const sourceExplanation = cleanExtractedText(explanationImage ? stripImageUrls(rawExplanation) : rawExplanation)
  const shouldUseExplanationImage = Boolean(explanationImage && !recoveredExplanation && !sourceExplanation)
  const explanation =
    recoveredExplanation ||
    sourceExplanation ||
    (shouldUseExplanationImage ? 'Explanation image below.' : 'Explanation pending manual completion.')
  const rawStem = normalizeLatexSource(q.stem)
  const recoveredStem = cleanExtractedText(normalizeLatexSource(typedStemOverrides[questionKey] || ''))
  const stemImageOverride = normalizeImagePath(typedStemImageOverrides[questionKey])
  const stemImageFromField = normalizeImagePath(q.stemImage) || normalizeImagePath(q.imageUrl)
  const stemImage = stemImageOverride || stemImageFromField || (isImageLikeUrl(rawStem) ? rawStem : undefined)
  const sourceStem = recoveredStem || (rawStem && !isImageLikeUrl(rawStem) ? rawStem : '')
  const stemLatex = sourceStem ? (stemImage ? stripImageUrls(sourceStem) : sourceStem) : ''
  const imageUrls = (q.imageUrls || [])
    .map((value) => normalizeImagePath(value))
    .filter((value): value is string => Boolean(value))
  const imageUrl = normalizeImagePath(q.imageUrl)

  return {
    id: `${q.year}-P${q.paper}-Q${q.number}`,
    paper: q.paper,
    index: q.number - 1,
    stemLatex: stemLatex || 'Diagram-based question. Refer to the image below.',
    stemImage,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    options,
    answerKey: safeAnswerKey,
    explanationLatex: explanation,
    explanationImage: shouldUseExplanationImage ? explanationImage : undefined,
    tags: [q.year, `Paper${q.paper}`],
    difficulty: 2,
  }
})
