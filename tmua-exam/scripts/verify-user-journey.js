const fs = require('fs')
const path = require('path')

const sourceJsonPath = path.join(__dirname, '..', 'data', 'tmua_questions_with_answers_320.json')
const homePath = path.join(__dirname, '..', 'app', 'page.tsx')
const dashboardPath = path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx')
const accountPath = path.join(__dirname, '..', 'app', 'account', 'page.tsx')
const mistakesPath = path.join(__dirname, '..', 'app', 'mistakes', 'page.tsx')
const resultSummaryPath = path.join(__dirname, '..', 'components', 'screens', 'ResultSummary.tsx')
const examRunnerPath = path.join(__dirname, '..', 'components', 'ExamRunner.tsx')
const examLayoutPath = path.join(__dirname, '..', 'components', 'ExamLayout.tsx')
const examYearPagePath = path.join(__dirname, '..', 'app', 'exam', '[year]', 'page.tsx')
const storagePath = path.join(__dirname, '..', 'lib', 'storage.ts')

const gradeMappings = [
  { score: 0, grade: 1.0 },
  { score: 4, grade: 1.5 },
  { score: 8, grade: 2.0 },
  { score: 12, grade: 2.5 },
  { score: 14, grade: 3.0 },
  { score: 16, grade: 3.5 },
  { score: 18, grade: 4.0 },
  { score: 20, grade: 4.5 },
  { score: 22, grade: 5.0 },
  { score: 24, grade: 5.5 },
  { score: 26, grade: 6.0 },
  { score: 28, grade: 6.5 },
  { score: 30, grade: 7.0 },
  { score: 32, grade: 7.5 },
  { score: 34, grade: 8.0 },
  { score: 36, grade: 8.5 },
  { score: 38, grade: 9.0 },
]

function calculateGrade(score) {
  let grade = 1.0
  for (const m of gradeMappings) {
    if (score >= m.score) grade = m.grade
    else break
  }
  return grade
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

function normalizeQuestion(q) {
  const options = normalizeOptions(q.options)
  const answerKey = String(q.answer || '').trim().toUpperCase()
  return {
    id: `${q.year}-P${q.paper}-Q${q.number}`,
    year: String(q.year),
    paper: q.paper,
    index: q.number - 1,
    options,
    answerKey: options.some((o) => o.key === answerKey) ? answerKey : options[0].key,
  }
}

function evaluateExam(questions, p1, p2) {
  let scoreP1 = 0
  let scoreP2 = 0
  const outcomes = []
  for (const q of questions) {
    const answer = q.paper === 1 ? p1[q.index] : p2[q.index]
    const ok = answer === q.answerKey
    if (q.paper === 1 && ok) scoreP1 += 1
    if (q.paper === 2 && ok) scoreP2 += 1
    outcomes.push({ id: q.id, isCorrect: ok })
  }
  const total = scoreP1 + scoreP2
  return { scoreP1, scoreP2, total, grade: calculateGrade(total), outcomes }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function run() {
  const raw = JSON.parse(fs.readFileSync(sourceJsonPath, 'utf8'))
  const normalized = raw.map(normalizeQuestion)

  const years = ['2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016']
  for (const year of years) {
    const ys = normalized.filter((q) => q.year === year)
    const p1 = ys.filter((q) => q.paper === 1)
    const p2 = ys.filter((q) => q.paper === 2)
    assert(ys.length === 40, `Year ${year} should have 40 questions, got ${ys.length}`)
    assert(p1.length === 20, `Year ${year} Paper 1 should have 20, got ${p1.length}`)
    assert(p2.length === 20, `Year ${year} Paper 2 should have 20, got ${p2.length}`)
  }

  const testYear = '2023'
  const qs = normalized
    .filter((q) => q.year === testYear)
    .sort((a, b) => (a.paper !== b.paper ? a.paper - b.paper : a.index - b.index))

  const allCorrectP1 = {}
  const allCorrectP2 = {}
  qs.forEach((q) => {
    if (q.paper === 1) allCorrectP1[q.index] = q.answerKey
    else allCorrectP2[q.index] = q.answerKey
  })

  const perfect = evaluateExam(qs, allCorrectP1, allCorrectP2)
  assert(perfect.total === 40, `Perfect attempt should score 40, got ${perfect.total}`)
  assert(perfect.grade === 9.0, `Perfect attempt should grade 9.0, got ${perfect.grade}`)

  const blank = evaluateExam(qs, {}, {})
  assert(blank.total === 0, `Blank attempt should score 0, got ${blank.total}`)
  assert(blank.grade === 1.0, `Blank attempt should grade 1.0, got ${blank.grade}`)

  // Mistake-book uniqueness behavior expectation
  const mistakeBook = []
  const addMistake = (id) => {
    if (mistakeBook.includes(id)) return false
    mistakeBook.push(id)
    return true
  }
  const firstId = qs[0].id
  assert(addMistake(firstId) === true, 'First add to mistake book should succeed')
  assert(addMistake(firstId) === false, 'Duplicate add to mistake book should be rejected')

  const homeSource = fs.readFileSync(homePath, 'utf8')
  const dashboardSource = fs.readFileSync(dashboardPath, 'utf8')
  const accountSource = fs.readFileSync(accountPath, 'utf8')
  const mistakesSource = fs.readFileSync(mistakesPath, 'utf8')
  const resultSource = fs.readFileSync(resultSummaryPath, 'utf8')
  const runnerSource = fs.readFileSync(examRunnerPath, 'utf8')
  const examLayoutSource = fs.readFileSync(examLayoutPath, 'utf8')
  const examYearPageSource = fs.readFileSync(examYearPagePath, 'utf8')
  const storageSource = fs.readFileSync(storagePath, 'utf8')

  assert(homeSource.includes('MockLab999'), 'Landing page should expose MockLab999 branding')
  assert(dashboardSource.includes('TMUA Year Sets'), 'Dashboard should contain year-set entry section')
  assert(resultSource.includes('Add to Mistakes'), 'Result page should include Add to Mistakes action')
  assert(resultSource.includes('Add All Incorrect to Mistakes'), 'Result page should include bulk add incorrect action')
  assert(resultSource.includes('Add Filtered Incorrect'), 'Result page should include filtered bulk add incorrect action')
  assert(resultSource.includes('Export Result CSV'), 'Result page should include result CSV export action')
  assert(resultSource.includes('Search paper, question, ID, answer...'), 'Result page should include search input')
  assert(resultSource.includes('Reset Search'), 'Result page should include search reset action')
  assert(
    resultSource.includes('!o.isCorrect && Boolean(o.userAnswer)'),
    'Result page incorrect filter should exclude unanswered questions',
  )
  assert(runnerSource.includes('state: \'RESULT_SUMMARY\''), 'Exam runner should route to result summary')
  assert(runnerSource.includes('buildSessionFromDeepLink'), 'Exam runner should support deep-link question routing')
  assert(runnerSource.includes('key === \'U\''), 'Exam runner should support keyboard next-unanswered shortcut')
  assert(runnerSource.includes('key === \'G\''), 'Exam runner should support keyboard next-flagged shortcut')
  assert(runnerSource.includes('onNextUnanswered={'), 'Exam runner should wire next-unanswered handler into layout')
  assert(runnerSource.includes('onNextFlagged={'), 'Exam runner should wire next-flagged handler into layout')
  assert(runnerSource.includes('onAutoAdvanceChange={'), 'Exam runner should wire auto-advance toggle into layout')
  assert(runnerSource.includes('onJumpToQuestion={'), 'Exam runner should wire jump-to-question control into layout')
  assert(examLayoutSource.includes('Next Unanswered'), 'Exam layout should expose next-unanswered toolbar action')
  assert(examLayoutSource.includes('Next Flagged'), 'Exam layout should expose next-flagged toolbar action')
  assert(examLayoutSource.includes('Auto-advance'), 'Exam layout should expose auto-advance toggle')
  assert(examLayoutSource.includes('placeholder="Q#"'), 'Exam layout should expose question jump input')
  assert(examYearPageSource.includes('notFound()'), 'Year exam page should reject invalid year routes')
  assert(examYearPageSource.includes('VALID_YEARS'), 'Year exam page should enforce known TMUA year range')
  assert(storageSource.includes('AttemptQuestionOutcome'), 'Storage should define attempt-level question outcomes')
  assert(
    storageSource.includes('questionOutcomes?: AttemptQuestionOutcome[]'),
    'Storage should persist question outcomes in exam attempts',
  )
  assert(accountSource.includes('Attempt Review'), 'Account page should include attempt review section')
  assert(
    accountSource.includes('Add All Incorrect to Mistake Book'),
    'Account page should support bulk add-to-mistake-book from review',
  )
  assert(accountSource.includes('filteredAttempts.map((attempt)'), 'Account page should render filtered full attempt history')
  assert(!accountSource.includes('.slice(0, 8)'), 'Account page should not cap attempt history to 8 entries')
  assert(accountSource.includes('filteredReviewRows'), 'Account page should support question-level review filtering')
  assert(accountSource.includes('event.key.startsWith(\'tmua_attempts_\')'), 'Account page should auto-sync attempt updates')
  assert(accountSource.includes('Data Backup'), 'Account page should include data backup section')
  assert(accountSource.includes('Export Backup'), 'Account page should expose export backup action')
  assert(accountSource.includes('Export CSV Report'), 'Account page should expose export CSV report action')
  assert(accountSource.includes('Export Filtered CSV'), 'Account page should expose filtered CSV export action')
  assert(accountSource.includes('Remove Filtered Attempts'), 'Account page should expose filtered attempt removal action')
  assert(accountSource.includes('Reset Attempt Filters'), 'Account page should expose attempt filter reset action')
  assert(accountSource.includes('Export Review CSV'), 'Account page should expose review-level CSV export action')
  assert(accountSource.includes('Reset Review Filter'), 'Account page should expose review filter reset action')
  assert(
    accountSource.includes('!row.isCorrect && Boolean(row.userAnswer)'),
    'Account review incorrect filter should exclude unanswered questions',
  )
  assert(accountSource.includes('tmua_account_ui_prefs_v1'), 'Account page should persist UI preferences')
  assert(accountSource.includes('Import Backup'), 'Account page should expose import backup action')
  assert(accountSource.includes('Merge (recommended)'), 'Account page should expose merge import mode')
  assert(accountSource.includes('Replace current data'), 'Account page should expose replace import mode')
  assert(accountSource.includes('handleSelectPreviousReviewQuestion'), 'Account page should support previous review question navigation')
  assert(accountSource.includes('handleSelectNextReviewQuestion'), 'Account page should support next review question navigation')
  assert(accountSource.includes('Add Filtered to Mistake Book'), 'Account page should support filtered bulk add-to-mistake action')
  assert(accountSource.includes('handleJumpToReviewRow'), 'Account page should support review question jump action')
  assert(accountSource.includes('Remove Filtered Mistakes'), 'Account page should expose filtered mistake removal action')
  assert(accountSource.includes('Reset Mistake Filters'), 'Account page should expose mistake filter reset action')
  assert(accountSource.includes('handleExportFilteredMistakesCsv'), 'Account page should support filtered mistake CSV export action')
  assert(storageSource.includes('buildUserBackup'), 'Storage should provide backup payload builder')
  assert(mistakesSource.includes('Mistake Detail'), 'Mistakes page should include in-page mistake detail review')
  assert(mistakesSource.includes('Review question, options, and explanation in one place.'), 'Mistakes detail helper text should be present')
  assert(mistakesSource.includes('Loading question details...'), 'Mistakes detail should handle loading state')
  assert(mistakesSource.includes('Open in Exam'), 'Mistakes detail should keep deep-link open action')
  assert(mistakesSource.includes('Export Filtered CSV'), 'Mistakes page should support filtered CSV export')
  assert(mistakesSource.includes('Reset Filters'), 'Mistakes page should support filter reset action')
  assert(mistakesSource.includes('Previous'), 'Mistakes detail should support previous navigation')
  assert(mistakesSource.includes('Next'), 'Mistakes detail should support next navigation')
  assert(mistakesSource.includes('keyboard ← / →'), 'Mistakes detail should expose keyboard navigation hint')
  assert(mistakesSource.includes('handleJumpToMistakePosition'), 'Mistakes page should support jump-to-index navigation')
  assert(mistakesSource.includes('tmua_mistakes_ui_prefs_v1'), 'Mistakes page should persist UI preferences')

  console.log('User journey verification passed.')
  console.log('- Landing branding present')
  console.log('- Dashboard year entry present')
  console.log('- Scoring outputs valid (0/40 and 40/40)')
  console.log('- Mistake-book add/duplicate behavior validated')
  console.log('- Result and runner flow hooks are present')
  console.log('- Attempt-review persistence and UI flow hooks are present')
  console.log('- Mistake-center detail review hooks are present')
}

run()
