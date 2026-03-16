export type TmuaResourceItem = {
  title: string
  description: string
  readTime: string
  href: string
  cta: string
  updatedAt: string
}

export type TmuaResourceGroup = {
  category: string
  intro: string
  items: TmuaResourceItem[]
}

export type TmuaScoreBand = {
  min: number
  max: number
  label: string
  summary: string
  focus: string
  nextAction: string
}

export const TMUA_RESOURCE_GROUPS: TmuaResourceGroup[] = [
  {
    category: 'Paper 2 Logic',
    intro: 'Train the decision patterns that usually separate a stable score from a volatile one.',
    items: [
      {
        title: 'How to Read Necessary and Sufficient Conditions Fast',
        description: 'A compact approach to condition language, contrapositive checks, and common trap patterns.',
        readTime: '6 min',
        href: '/guides/tmua-paper-1-vs-paper-2',
        cta: 'Read guide',
        updatedAt: '2026-03-15',
      },
      {
        title: 'Paper 2 Review Method After Every Mock',
        description: 'Turn each wrong answer into one logic rule, one example, and one timing correction.',
        readTime: '5 min',
        href: '/mistakes',
        cta: 'Open mistake center',
        updatedAt: '2026-03-15',
      },
    ],
  },
  {
    category: 'Mock Review',
    intro: 'Keep the full mock workflow, but make each sitting produce cleaner next steps.',
    items: [
      {
        title: 'What to Review in the First 20 Minutes After a Mock',
        description: 'Split your post-paper review into careless errors, concept gaps, and slow decisions.',
        readTime: '4 min',
        href: '/dashboard',
        cta: 'Start next mock',
        updatedAt: '2026-03-15',
      },
      {
        title: 'When to Repeat an Old Paper and When to Move On',
        description: 'Use repeated papers only when you are testing process changes rather than memorized answers.',
        readTime: '5 min',
        href: '/guides/which-courses-need-tmua',
        cta: 'Read guide',
        updatedAt: '2026-03-15',
      },
    ],
  },
  {
    category: 'Planning and Targets',
    intro: 'Use score bands and course goals to make preparation choices less random.',
    items: [
      {
        title: 'How to Set a Realistic TMUA Score Target',
        description: 'Start from your current band, then assign one primary improvement target per week.',
        readTime: '5 min',
        href: '/score-converter',
        cta: 'Use converter',
        updatedAt: '2026-03-15',
      },
      {
        title: 'Which Courses Need TMUA and How Early to Start',
        description: 'A planning page for applicants who need to align course choices with timed practice volume.',
        readTime: '7 min',
        href: '/guides/which-courses-need-tmua',
        cta: 'Read guide',
        updatedAt: '2026-03-15',
      },
    ],
  },
]

export const TMUA_SCORE_BANDS: TmuaScoreBand[] = [
  {
    min: 0,
    max: 11,
    label: 'Foundation rebuild',
    summary: 'You need cleaner algebra, more stable arithmetic, and a slower but more reliable decision process.',
    focus: 'Reduce unforced errors and rebuild confidence on medium questions before chasing speed.',
    nextAction: 'Run one full paper per week and review every wrong answer inside the mistake book.',
  },
  {
    min: 12,
    max: 19,
    label: 'Stability phase',
    summary: 'The basics are present, but timing and Paper 2 logic are still pulling the score band down.',
    focus: 'Improve question selection, shorten dead time, and stop dropping marks on readable questions.',
    nextAction: 'Alternate full mocks with short Paper 2 review blocks focused on logic wording.',
  },
  {
    min: 20,
    max: 27,
    label: 'Competitive middle band',
    summary: 'You are in a useful range, but consistency matters more than one-off high scores.',
    focus: 'Protect your paper opening, improve late-paper stamina, and convert near-miss questions.',
    nextAction: 'Keep full timed mocks and use the converter plus guides to set a course-aligned target.',
  },
  {
    min: 28,
    max: 33,
    label: 'Strong working band',
    summary: 'You are close to a high-value range, so small review gains can materially change the final outcome.',
    focus: 'Sharpen Paper 2 judgement and remove the last cluster of repeated mistake types.',
    nextAction: 'Use recent-year papers under strict timing and review only the questions you nearly solved.',
  },
  {
    min: 34,
    max: 40,
    label: 'Top-end calibration',
    summary: 'The score base is strong; now the main task is repeatability under pressure.',
    focus: 'Protect concentration, keep routines fixed, and avoid overtraining on too many extra materials.',
    nextAction: 'Do fewer but cleaner mocks, then focus on error-free execution and pacing discipline.',
  },
]
