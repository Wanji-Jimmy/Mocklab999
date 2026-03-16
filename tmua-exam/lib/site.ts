export const SITE_URL = 'https://mocklab999.com'
export const SITE_NAME = 'MockLab999'
export const SITE_TITLE = 'MockLab999 | TMUA Preparation Platform'
export const SITE_DESCRIPTION =
  'Prepare for TMUA with full timed mocks, score conversion, mistake review, and application-focused guides.'

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}
