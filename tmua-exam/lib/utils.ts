// Grade mapping: score (0-40) to grade (1.0-9.0)
export const GRADE_MAPPINGS = [
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

export function calculateGrade(totalScore: number): number {
  // Find the highest grade where score <= totalScore
  let grade = 1.0
  for (const mapping of GRADE_MAPPINGS) {
    if (totalScore >= mapping.score) {
      grade = mapping.grade
    } else {
      break
    }
  }
  return grade
}

export function formatTime(seconds: number): string {
  // Defensive: if seconds is NaN or invalid, default to 0
  if (!Number.isFinite(seconds) || seconds < 0) {
    seconds = 0
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
