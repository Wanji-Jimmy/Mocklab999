/* eslint-disable no-console */
const fs = require('node:fs')
const path = require('node:path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function normalizeOption(option) {
  const key = String(option?.key || '').trim().toUpperCase()
  const latex = String(option?.text ?? option?.latex ?? '').trim()
  const image = option?.image ? String(option.image).trim() : null
  return {
    key,
    latex,
    image,
  }
}

async function main() {
  const sourcePath = path.join(__dirname, '..', 'data', 'tmua_questions_with_answers_320.json')
  const raw = fs.readFileSync(sourcePath, 'utf8')
  const questions = JSON.parse(raw)

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No TMUA questions found in source file')
  }

  const years = Array.from(
    new Set(
      questions
        .map((item) => Number.parseInt(String(item.year), 10))
        .filter((year) => Number.isFinite(year) && year >= 2000),
    ),
  ).sort((a, b) => a - b)

  const bankByYear = new Map()
  for (const year of years) {
    await prisma.questionBank.deleteMany({
      where: {
        examType: 'TMUA',
        year,
        name: `TMUA ${year} Imported Set`,
      },
    })
    const bank = await prisma.questionBank.create({
      data: {
        examType: 'TMUA',
        name: `TMUA ${year} Imported Set`,
        year,
        version: 1,
        isPublished: true,
        publishedAt: new Date(),
      },
    })
    bankByYear.set(year, bank)
  }

  let importedCount = 0
  for (const item of questions) {
    const year = Number.parseInt(String(item.year), 10)
    const bank = bankByYear.get(year)
    if (!bank) continue
    const paper = Number.parseInt(String(item.paper), 10)
    const number = Number.parseInt(String(item.number), 10)
    const options = Array.isArray(item.options) ? item.options.map(normalizeOption).filter((o) => o.key) : []

    const question = await prisma.question.create({
      data: {
        examType: 'TMUA',
        bankId: bank.id,
        moduleOrPaper: `P${paper}`,
        questionNumber: number,
        stemLatex: String(item.stem || '').trim() || 'Question text unavailable.',
        stemImage: item.stemImage ? String(item.stemImage) : null,
        explanationLatex: String(item.explanation || '').trim() || 'Explanation pending.',
        answerKey: String(item.answer || '').trim().toUpperCase(),
        difficulty: 2,
        tags: JSON.stringify([String(item.year), `Paper${paper}`]),
      },
    })

    if (options.length > 0) {
      for (let index = 0; index < options.length; index += 1) {
        const option = options[index]
        await prisma.option.create({
          data: {
            questionId: question.id,
            key: option.key,
            latex: option.latex,
            image: option.image,
            order: index,
          },
        })
      }
    }
    importedCount += 1

  }

  console.log(`Imported ${importedCount} TMUA questions across ${bankByYear.size} year banks`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
