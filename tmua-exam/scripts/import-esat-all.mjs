import { spawnSync } from 'node:child_process'

const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
const failures = []

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  return result.status === 0
}

for (const year of years) {
  if (!run('python3', ['scripts/import-engaa-from-pdf.py', '--year', year])) {
    failures.push(`ENGAA ${year}`)
  }
  if (!run('python3', ['scripts/import-nsaa-from-pdf.py', '--year', year])) {
    failures.push(`NSAA ${year}`)
  }
}

run('node', ['scripts/build-esat-manifest.mjs'])

if (failures.length > 0) {
  console.error('\nSome imports failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('\nESAT import finished for all years.')
