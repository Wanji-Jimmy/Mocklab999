export type GuideFAQ = {
  question: string
  answer: string
}

export type AdmissionsGuide = {
  slug: string
  title: string
  description: string
  audience: string
  primaryTest: string
  secondaryTests?: string[]
  keyPoints: string[]
  faq: GuideFAQ[]
  updatedAt: string
}

export const ADMISSIONS_GUIDES: AdmissionsGuide[] = [
  {
    slug: 'cambridge-economics-tmua-guide',
    title: 'Cambridge Economics TMUA Guide',
    description: 'How TMUA preparation maps to Economics applications and interview-stage readiness.',
    audience: 'Economics applicants targeting Cambridge-style mathematical admissions filters.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Use year-based timed mocks to build speed on algebra, functions, and logic-heavy MCQ.',
      'Track weak tags after each paper and convert them into weekly revision blocks.',
      'Keep one full timed mock for final calibration before deadline windows.',
    ],
    faq: [
      { question: 'What should I practice first?', answer: 'Start with full Paper 1 + Paper 2 mocks to identify weak domains, then drill by weakness.' },
      { question: 'How many mocks are enough?', answer: 'Complete several timed papers across years and prioritize error-quality over volume.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'cambridge-engineering-esat-modules',
    title: 'Cambridge Engineering ESAT Modules',
    description: 'A module-by-module ESAT planning page for Engineering-track applicants.',
    audience: 'Engineering applicants deciding between ESAT module combinations.',
    primaryTest: 'ESAT',
    secondaryTests: ['ENGAA legacy', 'NSAA legacy'],
    keyPoints: [
      'Plan around mandatory mathematics paper plus selected science/advanced modules.',
      'Test module pairings under realistic timing before locking your final combination.',
      'Use attempts and mistake logs to compare module fit over multiple weeks.',
    ],
    faq: [
      { question: 'How do I choose modules?', answer: 'Choose modules aligned with your intended course demands and strongest score potential.' },
      { question: 'Should I switch modules late?', answer: 'Avoid late switches unless repeated mocks show a clear performance advantage.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'ucl-economics-tmua-2026',
    title: 'UCL Economics TMUA 2026',
    description: 'TMUA-focused readiness framework for UCL Economics cycle planning.',
    audience: 'UCL Economics applicants preparing for 2026 entry expectations.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Run fixed weekly timed papers to stabilize your grade band before submission.',
      'Review wrong answers by concept family, not only by raw score.',
      'Build a personal threshold score target and maintain it across recent papers.',
    ],
    faq: [
      { question: 'How often should I do full mocks?', answer: 'A regular cadence (for example weekly) helps track consistency and timing pressure.' },
      { question: 'What matters most in review?', answer: 'Error patterns and decision speed on medium-difficulty questions.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'ucl-eee-esat-2026',
    title: 'UCL EEE ESAT 2026',
    description: 'ESAT planning route for Electrical and Electronic Engineering applicants.',
    audience: 'Applicants to EEE-style courses requiring math + science test evidence.',
    primaryTest: 'ESAT',
    keyPoints: [
      'Treat mathematics as baseline and optimize second/third paper choices with data.',
      'Compare module outcomes over multiple attempts before finalizing your pathway.',
      'Use timed mock transitions to reduce paper-to-paper performance drop-off.',
    ],
    faq: [
      { question: 'Can I prepare all modules equally?', answer: 'Prioritize likely selected modules and keep light maintenance on alternatives.' },
      { question: 'How do I improve fast?', answer: 'Use mistake replay + targeted practice immediately after each timed attempt.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'lse-economics-tmua',
    title: 'LSE Economics TMUA',
    description: 'TMUA-centric prep lane for mathematically selective Economics admissions.',
    audience: 'Economics applicants aiming for highly selective programs.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Establish a stable score floor first, then push ceiling through hard-paper drilling.',
      'Track accuracy by question position to spot late-paper stamina issues.',
      'Use account-level history to show trend improvement over time.',
    ],
    faq: [
      { question: 'Do I need perfect scores?', answer: 'No; consistency and strong trend direction are more practical targets.' },
      { question: 'What should I avoid?', answer: 'Avoid random paper selection without a review loop.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'warwick-computer-science-tmua',
    title: 'Warwick Computer Science TMUA',
    description: 'TMUA preparation flow for Computer Science and adjacent quantitative routes.',
    audience: 'CS applicants who need strong mathematical screening performance.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Prioritize symbolic manipulation speed and multi-step reasoning discipline.',
      'Use mixed-year papers to avoid overfitting to a single style.',
      'Validate exam-day pacing with strict full-length simulations.',
    ],
    faq: [
      { question: 'How should CS applicants revise?', answer: 'Focus on logic-heavy and algebraic questions with timed constraints.' },
      { question: 'When should I start mocks?', answer: 'As early as possible so trend data can guide your preparation choices.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'imperial-engineering-esat-2026',
    title: 'Imperial Engineering ESAT 2026',
    description: 'ESAT planning workflow for Engineering applicants targeting Imperial-style quantitative selection.',
    audience: 'Engineering applicants who need high-confidence ESAT module decisions and timed performance.',
    primaryTest: 'ESAT',
    keyPoints: [
      'Lock mandatory math performance first, then optimize secondary module pairing.',
      'Benchmark each selected module under full timing, not isolated untimed drills.',
      'Use trend data across multiple papers to confirm readiness before submission windows.',
    ],
    faq: [
      { question: 'How should I sequence revision?', answer: 'Start with baseline full mocks, then split weekly work into module-specific remediation blocks.' },
      { question: 'What indicates module readiness?', answer: 'Consistent timed accuracy with reduced variance across multiple attempts.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'imperial-computing-tmua-guide',
    title: 'Imperial Computing TMUA Guide',
    description: 'TMUA-focused preparation lane for Computing applicants with strong mathematical screening demands.',
    audience: 'Computing applicants preparing for competitive quantitative admissions evaluation.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Prioritize algebraic fluency, logical consistency, and strict question-time budgeting.',
      'Use full-paper simulation to measure stability, not only best-case scores.',
      'Convert every mistake into a specific remediation action before the next paper.',
    ],
    faq: [
      { question: 'Should I focus on speed or accuracy first?', answer: 'Build accuracy foundations first, then raise speed while protecting decision quality.' },
      { question: 'How do I track improvement correctly?', answer: 'Track rolling averages and variance, not single-attempt peaks.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'tmua-vs-esat-vs-tara',
    title: 'TMUA vs ESAT vs TARA',
    description: 'Comparison page to decide which admissions test family best matches your course path.',
    audience: 'Applicants uncertain about which test they should prioritize.',
    primaryTest: 'Comparison',
    secondaryTests: ['TMUA', 'ESAT', 'TARA'],
    keyPoints: [
      'Match your likely test to course requirements first, then optimize preparation depth.',
      'Use diagnostic mocks to estimate comparative readiness between test paths.',
      'Keep test-choice documentation in one place to avoid late-cycle confusion.',
    ],
    faq: [
      { question: 'What is the fastest way to choose?', answer: 'Start from course requirements, then confirm with one diagnostic mock per relevant test.' },
      { question: 'Can I prepare for all three?', answer: 'Only if timelines allow; otherwise prioritize requirement-critical tests first.' },
    ],
    updatedAt: '2026-03-09',
  },
  {
    slug: 'which-uat-uk-test-do-i-need',
    title: 'Which UAT-UK Test Do I Need?',
    description: 'Decision guide for mapping course choices to UK admissions test pathways.',
    audience: 'Applicants who want a clear test-selection workflow before deep preparation.',
    primaryTest: 'Decision Guide',
    secondaryTests: ['TMUA', 'ESAT', 'TARA'],
    keyPoints: [
      'Map target courses to required/recommended tests first.',
      'Use one-week diagnostic phase to validate your baseline in each relevant test.',
      'Commit to a primary pathway and review changes only when official guidance updates.',
    ],
    faq: [
      { question: 'When should I finalize test choice?', answer: 'Finalize early after requirement checks and initial diagnostics.' },
      { question: 'How often should I re-check requirements?', answer: 'Re-check whenever official admissions guidance is updated.' },
    ],
    updatedAt: '2026-03-09',
  },
]

export function getGuideBySlug(slug: string): AdmissionsGuide | undefined {
  return ADMISSIONS_GUIDES.find((guide) => guide.slug === slug)
}
