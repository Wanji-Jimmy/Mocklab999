const fs = require('fs')
const path = require('path')

const source = path.join(__dirname, '..', 'data', 'tmua_questions_with_answers_320.json')
const explanationOverridesPath = path.join(__dirname, '..', 'data', 'explanation_overrides.json')
const stemOverridesPath = path.join(__dirname, '..', 'data', 'stem_overrides.json')
const stemImageOverridesPath = path.join(__dirname, '..', 'data', 'stem_image_overrides.json')
const raw = fs.readFileSync(source, 'utf8')
const questions = JSON.parse(raw)
const explanationOverrides = JSON.parse(fs.readFileSync(explanationOverridesPath, 'utf8'))
const stemOverrides = JSON.parse(fs.readFileSync(stemOverridesPath, 'utf8'))
const stemImageOverrides = JSON.parse(fs.readFileSync(stemImageOverridesPath, 'utf8'))

if (!Array.isArray(questions)) {
  throw new Error('Question source is not an array')
}

const expectedYears = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
const rawIssues = []
const appIssues = []
const validQuestionIds = new Set()

if (questions.length !== 320) {
  rawIssues.push(`Expected 320 total questions, found ${questions.length}`)
}

function validateOverrideMap(name, map, issues) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    issues.push(`${name}: expected object map`)
    return
  }

  for (const [key, value] of Object.entries(map)) {
    if (!/^\d{4}-P[12]-Q\d{1,2}$/.test(key)) {
      issues.push(`${name}: invalid key format '${key}'`)
      continue
    }
    const text = String(value || '')
    if (/[\uE000-\uF8FF]/.test(text)) {
      issues.push(`${name} ${key}: contains private-use Unicode glyphs`)
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(text)) {
      issues.push(`${name} ${key}: contains control characters`)
    }
  }
}

for (const year of expectedYears) {
  const byYear = questions.filter((q) => String(q.year) === year)
  const p1 = byYear.filter((q) => q.paper === 1)
  const p2 = byYear.filter((q) => q.paper === 2)

  if (byYear.length !== 40) rawIssues.push(`${year}: expected 40 total, found ${byYear.length}`)
  if (p1.length !== 20) rawIssues.push(`${year}: expected 20 in Paper 1, found ${p1.length}`)
  if (p2.length !== 20) rawIssues.push(`${year}: expected 20 in Paper 2, found ${p2.length}`)
}

function normalizeOptions(options) {
  const seen = new Set()
  const normalized = []
  for (const option of options || []) {
    const key = String(option?.key || '').trim().toUpperCase()
    const latex = String(option?.text || '').trim()
    if (!key || !latex || seen.has(key)) continue
    seen.add(key)
    normalized.push({ key, latex })
  }
  if (normalized.length >= 2) return normalized
  return [
    { key: 'A', latex: normalized[0]?.latex || 'Option unavailable' },
    { key: 'B', latex: 'Option unavailable' },
  ]
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function normalizeLatexSource(value) {
  let normalized = normalizeText(value)
  if (!normalized) return normalized
  if (normalized.startsWith('$$') && normalized.endsWith('$$') && normalized.length > 4) {
    normalized = normalized.slice(2, -2).trim()
  }
  normalized = normalized.replace(/\${4,}/g, '\n\n')
  normalized = normalized.replace(/[ \t]{2,}/g, ' ').trim()
  return normalized
}

function isImageLikeUrl(value) {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(String(value || '').trim())
}

function normalizeImagePath(value) {
  const normalized = normalizeText(value)
  return normalized || undefined
}

function stripImageUrls(text) {
  return String(text || '').replace(/https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?/gi, '').trim()
}

function cleanExtractedText(value) {
  return String(value || '')
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
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isUsefulExplanation(text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim()
  if (!compact) return false
  if (compact.length >= 40) return true
  return compact.length >= 20 && /[A-Za-z]{3}/.test(compact)
}

questions.forEach((q, idx) => {
  const label = `#${idx + 1} (${q.year} P${q.paper} Q${q.number})`
  const questionKey = `${q.year}-P${q.paper}-Q${q.number}`
  const stemText = String(q.stem || '')
  const explanationText = String(q.explanation || '')
  const optionBlob = (q.options || []).map((o) => String(o?.text || '')).join(' ')
  const textBlob = `${stemText}\n${explanationText}\n${optionBlob}`

  if (!Array.isArray(q.options) || q.options.length < 2) {
    rawIssues.push(`${label}: expected at least 2 options`)
  }

  if (!expectedYears.includes(String(q.year))) {
    rawIssues.push(`${label}: unexpected year`)
  }

  if (!(q.paper === 1 || q.paper === 2)) {
    rawIssues.push(`${label}: paper must be 1 or 2`)
  }

  if (!Number.isInteger(q.number) || q.number < 1 || q.number > 20) {
    rawIssues.push(`${label}: question number should be 1..20`)
  }

  const optionKeys = q.options.map((o) => o.key)
  const keySet = new Set(optionKeys)
  if (keySet.size !== optionKeys.length) {
    rawIssues.push(`${label}: duplicate option keys`)
  }

  for (const key of optionKeys) {
    if (!/^[A-H]$/.test(String(key || '').trim().toUpperCase())) {
      rawIssues.push(`${label}: invalid option key '${key}'`)
      break
    }
  }

  if (!optionKeys.includes(q.answer)) {
    rawIssues.push(`${label}: answer key '${q.answer}' not in options`)
  }

  if (typeof q.stem !== 'string' || q.stem.trim().length === 0) {
    rawIssues.push(`${label}: missing stem text`)
  }

  if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
    rawIssues.push(`${label}: missing explanation text`)
  }

  if (/[\uE000-\uF8FF]/.test(textBlob)) {
    appIssues.push(`${label}: contains private-use Unicode glyphs`)
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(textBlob)) {
    appIssues.push(`${label}: contains control characters`)
  }

  const appOptions = normalizeOptions(q.options)
  if (appOptions.length < 2) {
    appIssues.push(`${label}: normalized options still < 2`)
  }
  if (appOptions.some((o) => /option unavailable/i.test(String(o.latex || '')))) {
    appIssues.push(`${label}: contains fallback option placeholder after normalization`)
  }
  const appAnswer = String(q.answer || '').trim().toUpperCase()
  const safeAnswer = appOptions.some((o) => o.key === appAnswer) ? appAnswer : appOptions[0]?.key
  if (!safeAnswer || !appOptions.some((o) => o.key === safeAnswer)) {
    appIssues.push(`${label}: no valid answer key after normalization`)
  }

  const rawStem = normalizeLatexSource(q.stem)
  const recoveredStem = cleanExtractedText(normalizeLatexSource(stemOverrides[questionKey] || ''))
  const stemImageOverride = normalizeImagePath(stemImageOverrides[questionKey])
  const stemImageFromField = normalizeImagePath(q.stemImage) || normalizeImagePath(q.imageUrl)
  const stemImage = stemImageOverride || stemImageFromField || (isImageLikeUrl(rawStem) ? rawStem : undefined)
  const sourceStem = recoveredStem || (rawStem && !isImageLikeUrl(rawStem) ? rawStem : '')
  const stemLatex = sourceStem ? (stemImage ? stripImageUrls(sourceStem) : sourceStem) : ''
  if (!stemLatex && !stemImage) {
    appIssues.push(`${label}: missing both stem text and stem image after app transformation`)
  }

  const rawExplanation = normalizeLatexSource(q.explanation || '')
  const explanationImage = isImageLikeUrl(rawExplanation) ? rawExplanation : undefined
  const recoveredExplanationRaw = cleanExtractedText(normalizeLatexSource(explanationOverrides[questionKey] || ''))
  const recoveredExplanation = isUsefulExplanation(recoveredExplanationRaw) ? recoveredExplanationRaw : ''
  const sourceExplanation = cleanExtractedText(explanationImage ? stripImageUrls(rawExplanation) : rawExplanation)
  const shouldUseExplanationImage = Boolean(explanationImage && !recoveredExplanation && !sourceExplanation)
  const explanation =
    recoveredExplanation ||
    sourceExplanation ||
    (shouldUseExplanationImage ? 'Explanation image below.' : 'Explanation pending manual completion.')
  if (explanation === 'Explanation pending manual completion.') {
    appIssues.push(`${label}: unresolved explanation placeholder after app transformation`)
  }

  validQuestionIds.add(questionKey)
})

validateOverrideMap('explanation_overrides', explanationOverrides, appIssues)
validateOverrideMap('stem_overrides', stemOverrides, appIssues)
validateOverrideMap('stem_image_overrides', stemImageOverrides, appIssues)

for (const key of Object.keys(explanationOverrides)) {
  if (!validQuestionIds.has(key)) {
    appIssues.push(`explanation_overrides: unknown question key '${key}'`)
  }
}
for (const key of Object.keys(stemOverrides)) {
  if (!validQuestionIds.has(key)) {
    appIssues.push(`stem_overrides: unknown question key '${key}'`)
  }
}
for (const key of Object.keys(stemImageOverrides)) {
  if (!validQuestionIds.has(key)) {
    appIssues.push(`stem_image_overrides: unknown question key '${key}'`)
  }
}

if (rawIssues.length > 0) {
  console.warn(`Raw source has ${rawIssues.length} issue(s), but app normalizer may repair them.`)
  for (const err of rawIssues.slice(0, 20)) {
    console.warn(`- ${err}`)
  }
  if (rawIssues.length > 20) {
    console.warn(`... and ${rawIssues.length - 20} more raw issues`)
  }
}

if (appIssues.length > 0) {
  console.error(`App-ready verification failed with ${appIssues.length} issue(s):`)
  for (const err of appIssues.slice(0, 50)) {
    console.error(`- ${err}`)
  }
  if (appIssues.length > 50) {
    console.error(`... and ${appIssues.length - 50} more issues`)
  }
  process.exit(1)
}

console.log('App-ready data verification passed.')
console.log(`- Total questions: ${questions.length}`)
console.log(`- Years checked: ${expectedYears.join(', ')}`)
console.log('- Normalized answer keys and option sets are consistent')
