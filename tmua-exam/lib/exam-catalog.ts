export const SUPPORTED_YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'] as const

export type SupportedYear = (typeof SUPPORTED_YEARS)[number]

export type ExamTrack = 'tmua' | 'engaa' | 'nsaa'

export const NSAA_PARTS = [
  { key: 'part-b-physics', label: 'Part B Physics' },
  { key: 'part-c-chemistry', label: 'Part C Chemistry' },
  { key: 'part-d-biology', label: 'Part D Biology' },
  { key: 'part-e-adv-math-physics', label: 'Part E Advanced Mathematics and Advanced Physics' },
] as const

export type NsaaPartKey = (typeof NSAA_PARTS)[number]['key']

export function isSupportedYear(year: string): year is SupportedYear {
  return SUPPORTED_YEARS.includes(year as SupportedYear)
}

export function isNsaaPartKey(part: string): part is NsaaPartKey {
  return NSAA_PARTS.some((item) => item.key === part)
}

export function getNsaaPartLabel(part: NsaaPartKey): string {
  return NSAA_PARTS.find((item) => item.key === part)?.label || part
}

const NSAA_PARTS_BY_YEAR: Record<SupportedYear, NsaaPartKey[]> = {
  '2016': ['part-b-physics', 'part-c-chemistry', 'part-d-biology', 'part-e-adv-math-physics'],
  '2017': ['part-b-physics', 'part-c-chemistry', 'part-d-biology', 'part-e-adv-math-physics'],
  '2018': ['part-b-physics', 'part-c-chemistry', 'part-d-biology', 'part-e-adv-math-physics'],
  '2019': ['part-b-physics', 'part-c-chemistry', 'part-d-biology', 'part-e-adv-math-physics'],
  '2020': ['part-b-physics', 'part-c-chemistry', 'part-d-biology'],
  '2021': ['part-b-physics', 'part-c-chemistry', 'part-d-biology'],
  '2022': ['part-b-physics', 'part-c-chemistry', 'part-d-biology'],
  '2023': ['part-b-physics', 'part-c-chemistry', 'part-d-biology'],
}

export function getNsaaPartKeysByYear(year: SupportedYear): NsaaPartKey[] {
  return NSAA_PARTS_BY_YEAR[year]
}

export function getNsaaPartsByYear(year: SupportedYear): ReadonlyArray<(typeof NSAA_PARTS)[number]> {
  const allowed = new Set(getNsaaPartKeysByYear(year))
  return NSAA_PARTS.filter((part) => allowed.has(part.key))
}

export function isNsaaPartAvailableForYear(year: SupportedYear, part: string): part is NsaaPartKey {
  return getNsaaPartKeysByYear(year).includes(part as NsaaPartKey)
}
