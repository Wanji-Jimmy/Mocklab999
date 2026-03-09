import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd())
const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
const partEYears = new Set(['2016', '2017', '2018', '2019'])

const manifestPath = path.join(rootDir, 'esat-materials', 'manifest.json')
const reportPath = path.join(rootDir, 'esat-materials', 'qa-report.json')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function hasL1Shape(question) {
  if (!question || typeof question !== 'object') return false
  if (typeof question.answer !== 'string' || !question.answer.trim()) return false
  if (!question.answers || typeof question.answers !== 'object') return false
  return Object.keys(question.answers).length >= 2
}

function placeholderRatio(rows) {
  if (!rows.length) return 1
  const placeholders = rows.filter((row) => String(row.question || '').trim() === 'Question text unavailable.').length
  return placeholders / rows.length
}

function validateEngaa(year) {
  const filePath = path.join(rootDir, 'data', 'esat', 'engaa', `${year}.json`)
  const data = readJson(filePath)
  const p1 = Array.isArray(data.paper1) ? data.paper1 : []
  const p2 = Array.isArray(data.paper2) ? data.paper2 : []
  const all = [...p1, ...p2]
  const l1ShapeOk = all.every(hasL1Shape)
  const nonEmptyPapers = p1.length > 0 && p2.length > 0
  const ratio = placeholderRatio(all)
  const qaPassed = nonEmptyPapers && l1ShapeOk && ratio <= 0.35
  return {
    exam: 'ENGAA',
    year,
    counts: { paper1: p1.length, paper2: p2.length, total: all.length },
    l1ShapeOk,
    placeholderRatio: Number(ratio.toFixed(3)),
    qaPassed,
  }
}

function validateNsaa(year) {
  const filePath = path.join(rootDir, 'data', 'esat', 'nsaa', `${year}.json`)
  const data = readJson(filePath)
  const mandatoryMath = Array.isArray(data.mandatoryMath) ? data.mandatoryMath : []
  const partB = Array.isArray(data.partBPhysics) ? data.partBPhysics : []
  const partC = Array.isArray(data.partCChemistry) ? data.partCChemistry : []
  const partD = Array.isArray(data.partDBiology) ? data.partDBiology : []
  const partE = Array.isArray(data.partEAdvancedMathPhysics) ? data.partEAdvancedMathPhysics : []
  const all = [...mandatoryMath, ...partB, ...partC, ...partD, ...partE]
  const l1ShapeOk = all.every(hasL1Shape)
  const requiredPartsOk =
    mandatoryMath.length > 0 &&
    partB.length > 0 &&
    partC.length > 0 &&
    partD.length > 0 &&
    (partEYears.has(year) ? partE.length > 0 : true)
  const ratio = placeholderRatio(all)
  const qaPassed = requiredPartsOk && l1ShapeOk && ratio <= 0.35
  return {
    exam: 'NSAA',
    year,
    counts: {
      mandatoryMath: mandatoryMath.length,
      partBPhysics: partB.length,
      partCChemistry: partC.length,
      partDBiology: partD.length,
      partEAdvancedMathPhysics: partE.length,
      total: all.length,
    },
    l1ShapeOk,
    placeholderRatio: Number(ratio.toFixed(3)),
    qaPassed,
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  exams: {
    ENGAA: years.map(validateEngaa),
    NSAA: years.map(validateNsaa),
  },
}

const failed = [
  ...report.exams.ENGAA.filter((row) => !row.qaPassed).map((row) => `${row.exam} ${row.year}`),
  ...report.exams.NSAA.filter((row) => !row.qaPassed).map((row) => `${row.exam} ${row.year}`),
]

if (fs.existsSync(manifestPath)) {
  const manifest = readJson(manifestPath)
  for (const item of report.exams.ENGAA) {
    if (!manifest?.exams?.ENGAA?.[item.year]) continue
    manifest.exams.ENGAA[item.year].qaPassed = item.qaPassed
    manifest.exams.ENGAA[item.year].refinedLevel = item.qaPassed ? 'L1' : 'L0'
  }
  for (const item of report.exams.NSAA) {
    if (!manifest?.exams?.NSAA?.[item.year]) continue
    manifest.exams.NSAA[item.year].qaPassed = item.qaPassed
    manifest.exams.NSAA[item.year].refinedLevel = item.qaPassed ? 'L1' : 'L0'
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Wrote ${reportPath}`)

if (failed.length > 0) {
  console.error('ESAT QA failed for:')
  for (const key of failed) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

console.log('ESAT QA passed for all years.')
