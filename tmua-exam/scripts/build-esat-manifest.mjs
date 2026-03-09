import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd())
const pdfDir = path.join(rootDir, 'esat-materials', 'pdf')
const manifestPath = path.join(rootDir, 'esat-materials', 'manifest.json')
const dataDir = path.join(rootDir, 'data', 'esat')

if (!fs.existsSync(pdfDir)) {
  console.error(`Missing directory: ${pdfDir}`)
  process.exit(1)
}

const examData = {
  ENGAA: {},
  NSAA: {},
}

const files = fs.readdirSync(pdfDir)
const re = /^(ENGAA|NSAA)_(20\d{2})_S1_(QuestionPaper|AnswerKey)\.pdf$/

for (const file of files) {
  const m = file.match(re)
  if (!m) continue
  const [, exam, year, type] = m
  if (!examData[exam][year]) examData[exam][year] = {}
  examData[exam][year][type] = file
}

const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
const partEYears = new Set(['2016', '2017', '2018', '2019'])

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function hasL1QuestionShape(row) {
  return row && typeof row.answer === 'string' && row.answer.trim() && row.answers && Object.keys(row.answers).length >= 2
}

function getEngaaImportState(year) {
  const filePath = path.join(dataDir, 'engaa', `${year}.json`)
  const payload = safeReadJson(filePath)
  if (!payload) return { imported: false, qaPassed: false, refinedLevel: 'L0' }
  const p1 = Array.isArray(payload.paper1) ? payload.paper1 : []
  const p2 = Array.isArray(payload.paper2) ? payload.paper2 : []
  const merged = [...p1, ...p2]
  const imported = p1.length > 0 && p2.length > 0
  const qaPassed = imported && merged.every(hasL1QuestionShape)
  return { imported, qaPassed, refinedLevel: qaPassed ? 'L1' : imported ? 'L0' : 'L0' }
}

function getNsaaImportState(year) {
  const filePath = path.join(dataDir, 'nsaa', `${year}.json`)
  const payload = safeReadJson(filePath)
  if (!payload) return { imported: false, qaPassed: false, refinedLevel: 'L0' }
  const mandatoryMath = Array.isArray(payload.mandatoryMath) ? payload.mandatoryMath : []
  const partB = Array.isArray(payload.partBPhysics) ? payload.partBPhysics : []
  const partC = Array.isArray(payload.partCChemistry) ? payload.partCChemistry : []
  const partD = Array.isArray(payload.partDBiology) ? payload.partDBiology : []
  const partE = Array.isArray(payload.partEAdvancedMathPhysics) ? payload.partEAdvancedMathPhysics : []
  const hasExpectedPartE = partEYears.has(year) ? partE.length > 0 : true
  const imported = mandatoryMath.length > 0 && partB.length > 0 && partC.length > 0 && partD.length > 0 && hasExpectedPartE
  const merged = [...mandatoryMath, ...partB, ...partC, ...partD, ...partE]
  const qaPassed = imported && merged.every(hasL1QuestionShape)
  return { imported, qaPassed, refinedLevel: qaPassed ? 'L1' : imported ? 'L0' : 'L0' }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
  exams: {
    ENGAA: {},
    NSAA: {},
  },
}

for (const exam of ['ENGAA', 'NSAA']) {
  for (const year of years) {
    const y = examData[exam][year] || {}
    const state = exam === 'ENGAA' ? getEngaaImportState(year) : getNsaaImportState(year)
    manifest.exams[exam][year] = {
      questionPaper: y.QuestionPaper || null,
      answerKey: y.AnswerKey || null,
      readyToImport: Boolean(y.QuestionPaper && y.AnswerKey),
      imported: state.imported,
      qaPassed: state.qaPassed,
      refinedLevel: state.refinedLevel,
      importStatus:
        exam === 'ENGAA'
          ? {
              paper1Imported: state.imported,
              paper2Imported: state.imported,
            }
          : {
              mandatoryMathImported: state.imported,
              partBPhysicsImported: state.imported,
              partCChemistryImported: state.imported,
              partDBiologyImported: state.imported,
              partEAdvancedMathPhysicsImported: partEYears.has(year) ? state.imported : null,
            },
    }
  }
}

fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote ${manifestPath}`)
