import engaa2016 from '@/data/esat/engaa/2016.json'
import engaa2017 from '@/data/esat/engaa/2017.json'
import engaa2018 from '@/data/esat/engaa/2018.json'
import engaa2019 from '@/data/esat/engaa/2019.json'
import engaa2020 from '@/data/esat/engaa/2020.json'
import engaa2021 from '@/data/esat/engaa/2021.json'
import engaa2022 from '@/data/esat/engaa/2022.json'
import engaa2023 from '@/data/esat/engaa/2023.json'
import nsaa2016 from '@/data/esat/nsaa/2016.json'
import nsaa2017 from '@/data/esat/nsaa/2017.json'
import nsaa2018 from '@/data/esat/nsaa/2018.json'
import nsaa2019 from '@/data/esat/nsaa/2019.json'
import nsaa2020 from '@/data/esat/nsaa/2020.json'
import nsaa2021 from '@/data/esat/nsaa/2021.json'
import nsaa2022 from '@/data/esat/nsaa/2022.json'
import nsaa2023 from '@/data/esat/nsaa/2023.json'
import { NsaaPartKey } from '@/lib/exam-catalog'
import { Question } from '@/lib/types'

type RawPaperQuestion = {
  question: string
  answers: Record<string, string>
  explanation?: string
  answer: string
}

type EngaaYearData = {
  exam: 'engaa'
  year: string
  source: string
  paper1: RawPaperQuestion[]
  paper2: RawPaperQuestion[]
}

type NsaaYearData = {
  exam: 'nsaa'
  year: string
  source: string
  mandatoryMath: RawPaperQuestion[]
  partBPhysics: RawPaperQuestion[]
  partCChemistry: RawPaperQuestion[]
  partDBiology: RawPaperQuestion[]
  partEAdvancedMathPhysics: RawPaperQuestion[]
}

const ENGAA_BY_YEAR: Record<string, EngaaYearData> = {
  '2016': engaa2016 as EngaaYearData,
  '2017': engaa2017 as EngaaYearData,
  '2018': engaa2018 as EngaaYearData,
  '2019': engaa2019 as EngaaYearData,
  '2020': engaa2020 as EngaaYearData,
  '2021': engaa2021 as EngaaYearData,
  '2022': engaa2022 as EngaaYearData,
  '2023': engaa2023 as EngaaYearData,
}

const NSAA_BY_YEAR: Record<string, NsaaYearData> = {
  '2016': nsaa2016 as NsaaYearData,
  '2017': nsaa2017 as NsaaYearData,
  '2018': nsaa2018 as NsaaYearData,
  '2019': nsaa2019 as NsaaYearData,
  '2020': nsaa2020 as NsaaYearData,
  '2021': nsaa2021 as NsaaYearData,
  '2022': nsaa2022 as NsaaYearData,
  '2023': nsaa2023 as NsaaYearData,
}

function cleanLatex(raw: string): string {
  return String(raw || '').replace(/\r\n/g, '\n').replace(/\${4,}/g, '\n\n').trim()
}

function isImageUrl(value: string): boolean {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(value.trim())
}

function toQuestionList(
  source: 'ENGAA' | 'NSAA',
  year: string,
  paper: 1 | 2 | 3,
  rows: RawPaperQuestion[],
  tagSuffix?: string,
): Question[] {
  return rows.map((row, idx) => {
    const options = Object.entries(row.answers || {})
      .map(([key, value]) => ({ key: key.toUpperCase(), latex: cleanLatex(String(value || '')) }))
      .filter((option) => option.key && option.latex)
      .sort((a, b) => a.key.localeCompare(b.key))

    const answerKey = String(row.answer || '').trim().toUpperCase()
    const safeAnswer = options.some((option) => option.key === answerKey) ? answerKey : options[0]?.key || 'A'
    const explanationRaw = cleanLatex(String(row.explanation || ''))
    const explanationImage = isImageUrl(explanationRaw) ? explanationRaw : undefined

    return {
      id: `${source}-${year}-P${paper}-Q${idx + 1}${tagSuffix ? `-${tagSuffix}` : ''}`,
      paper,
      index: idx,
      stemLatex: cleanLatex(row.question) || 'Question text unavailable.',
      options:
        options.length > 1
          ? options
          : [
              { key: 'A', latex: 'Option unavailable' },
              { key: 'B', latex: 'Option unavailable' },
            ],
      answerKey: safeAnswer,
      explanationLatex: explanationImage ? 'Explanation image below.' : explanationRaw || 'Explanation pending.',
      explanationImage,
      tags: [year, source, `Paper${paper}`, tagSuffix || ''],
      difficulty: 2,
    }
  })
}

export function getEngaaQuestionsByYear(year: string): Question[] {
  const source = ENGAA_BY_YEAR[year]
  if (!source) return []
  const p1 = toQuestionList('ENGAA', year, 1, source.paper1)
  const p2 = toQuestionList('ENGAA', year, 2, source.paper2)
  return [...p1, ...p2]
}

function getNsaaRowsByPart(source: NsaaYearData, part: NsaaPartKey): RawPaperQuestion[] {
  if (part === 'part-b-physics') return source.partBPhysics
  if (part === 'part-c-chemistry') return source.partCChemistry
  if (part === 'part-d-biology') return source.partDBiology
  return source.partEAdvancedMathPhysics
}

export function getNsaaQuestionsByYearAndPart(year: string, part: NsaaPartKey): Question[] {
  return getNsaaQuestionsByYearAndParts(year, [part])
}

export function getNsaaQuestionsByYearAndParts(year: string, parts: NsaaPartKey[]): Question[] {
  const source = NSAA_BY_YEAR[year]
  if (!source) return []
  const mandatoryMath = toQuestionList('NSAA', year, 1, source.mandatoryMath, 'mandatory-math')
  const chosen = parts.slice(0, 2)
  const papers = chosen.flatMap((part, idx) => {
    const paperNumber = (idx + 2) as 2 | 3
    return toQuestionList('NSAA', year, paperNumber, getNsaaRowsByPart(source, part), part)
  })
  return [...mandatoryMath, ...papers]
}
