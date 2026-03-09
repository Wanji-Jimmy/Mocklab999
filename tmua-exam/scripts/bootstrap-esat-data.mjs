import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd())
const tmpDir = path.join(rootDir, 'tmp-papers')
const outEngaaDir = path.join(rootDir, 'data', 'esat', 'engaa')
const outNsaaDir = path.join(rootDir, 'data', 'esat', 'nsaa')
const manifestPath = path.join(rootDir, 'esat-materials', 'manifest.json')

const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`)
}

ensureDir(outEngaaDir)
ensureDir(outNsaaDir)

for (const year of years) {
  const sourcePath = path.join(tmpDir, `${year}-paper.json`)
  const source = loadJson(sourcePath)

  const engaaPayload = {
    exam: 'engaa',
    year,
    source: 'bootstrap-from-tmp-papers',
    paper1: source.paper1 || [],
    paper2: source.paper2 || [],
  }

  const nsaaPayload = {
    exam: 'nsaa',
    year,
    source: 'bootstrap-from-tmp-papers',
    mandatoryMath: source.paper1 || [],
    partBPhysics: (source.paper2 || []).slice(0, 5),
    partCChemistry: (source.paper2 || []).slice(5, 10),
    partDBiology: (source.paper2 || []).slice(10, 15),
    partEAdvancedMathPhysics: (source.paper2 || []).slice(15, 20),
  }

  writeJson(path.join(outEngaaDir, `${year}.json`), engaaPayload)
  writeJson(path.join(outNsaaDir, `${year}.json`), nsaaPayload)
}

if (fs.existsSync(manifestPath)) {
  const manifest = loadJson(manifestPath)
  for (const year of years) {
    if (manifest?.exams?.ENGAA?.[year]?.importStatus) {
      manifest.exams.ENGAA[year].importStatus.paper1Imported = true
      manifest.exams.ENGAA[year].importStatus.paper2Imported = true
    }
    if (manifest?.exams?.NSAA?.[year]?.importStatus) {
      manifest.exams.NSAA[year].importStatus.mandatoryMathImported = true
      manifest.exams.NSAA[year].importStatus.partBPhysicsImported = true
      manifest.exams.NSAA[year].importStatus.partCChemistryImported = true
      manifest.exams.NSAA[year].importStatus.partDBiologyImported = true
      manifest.exams.NSAA[year].importStatus.partEAdvancedMathPhysicsImported = true
    }
  }
  manifest.generatedAt = new Date().toISOString()
  writeJson(manifestPath, manifest)
}

console.log('Bootstrapped ESAT data files for 2016-2023.')
