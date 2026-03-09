# TMUA Mock Exam Web App

A full-featured TMUA (Test of Mathematics for University Admission) mock examination platform built with Next.js.

## Features

- **Complete Exam Flow**: Welcome → Instructions (2 min) → Paper 1 (75 min, 20Q) → Break (2 min) → Paper 2 (75 min, 20Q) → Submit → Results
- **Official Exam Interface**: Blue header/footer matching TMUA design
- **Math Rendering**: KaTeX for fast LaTeX rendering
- **Persistent Sessions**: Auto-save with localStorage (refresh-safe)
- **Question Navigator**: Visual status (answered/flagged/unanswered)
- **Color Schemes**: Light and High Contrast modes
- **Result Analysis**: Detailed scoring, grade mapping, wrong question review
- **Guest Mode**: Take exams without login (save requires login)

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Math**: KaTeX
- **Database**: Prisma + SQLite (MVP)
- **State**: React hooks + localStorage

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
cd tmua-exam

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# (Optional) Initialize database
npx prisma db push

# (Optional) Import TMUA questions into DB bank tables
npm run db:import:tmua

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start the exam.

## Project Structure

```
tmua-exam/
├── app/
│   ├── exam/           # Main exam page
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home redirect
├── components/
│   ├── screens/        # Exam screen components
│   ├── ExamLayout.tsx  # Main layout with header/footer
│   └── LatexRenderer.tsx
├── lib/
│   ├── types.ts        # TypeScript types
│   ├── utils.ts        # Utilities and grade mapping
│   ├── prisma.ts       # Prisma client
│   └── sample-questions.ts
├── prisma/
│   └── schema.prisma   # Database schema
└── public/
```

## Exam Flow States

1. **WELCOME**: Intro and terms
2. **READING_COUNTDOWN**: 2-minute instruction screen
3. **PAPER1_ACTIVE**: 75-minute Paper 1 (20 questions)
4. **BREAK**: 2-minute break
5. **PAPER2_ACTIVE**: 75-minute Paper 2 (20 questions)
6. **SUBMIT_CONFIRM**: Review before submit
7. **RESULT_SUMMARY**: Score report and grade
8. **REVIEW_QUESTION**: Detailed explanation view

## Grade Mapping

Total score (0-40) maps to grade (1.0-9.0):

- 0-3: 1.0
- 4-7: 1.5
- 8-11: 2.0
- ... (configurable in `lib/utils.ts`)
- 38-40: 9.0

## Sample Questions

40 sample questions (20 per paper) are included in `lib/sample-questions.ts`. Replace with real TMUA questions for production use.

## Customization

### Change Timer Durations

Edit `lib/types.ts` in `INITIAL_SESSION`:

```typescript
paper1TimeLeft: 75 * 60, // Change to desired seconds
readingTimeLeft: 2 * 60,
```

### Update Grade Mapping

Edit `lib/utils.ts`:

```typescript
export const GRADE_MAPPINGS = [
  { score: 0, grade: 1.0 },
  // Add/modify mappings
]
```

### Add Real Questions

Replace `lib/sample-questions.ts` with actual TMUA questions in LaTeX format.

## Future Enhancements

- User authentication (NextAuth.js)
- Personal mistake book persistence
- Practice mode from mistake book
- Historical attempts tracking
- Export results as PDF
- Admin panel for question management

## License

MIT

## Notes

- This is an MVP. Payment/subscription features not implemented.
- Guest mode uses localStorage only.
- Database schema ready for future user accounts.

## Backend v2 APIs

New server-side APIs are available for persistent auth, attempts, mistakes, and admin uploads:

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Questions (new): `/api/v2/questions?examType=TMUA|ESAT&year=...`
- Sessions: `/api/v2/sessions` and `/api/v2/sessions/:id`
- Attempts: `/api/v2/attempts`
- Mistakes: `/api/v2/mistakes`
- Admin uploads: `/api/admin/uploads`, `/api/admin/uploads/:id/validate`, `/api/admin/uploads/:id/preview`, `/api/admin/uploads/:id/publish`, `/api/admin/uploads/:id/rollback`

Use `ADMIN_EMAIL_WHITELIST` (comma-separated emails) to assign admin permission on registration.
