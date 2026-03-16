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
    description: 'How to use TMUA papers, review loops, and timing discipline for Economics applications.',
    audience: 'Economics applicants targeting Cambridge-style mathematical admissions filters.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Use full year papers to build a reliable baseline before changing any revision plan.',
      'Track Paper 2 mistakes separately because they often drive volatility in the final score band.',
      'Keep one recent-year paper untouched for final calibration near the application window.',
    ],
    faq: [
      { question: 'What should I practice first?', answer: 'Start with one full timed mock so you can see whether algebra speed or Paper 2 judgement is the bigger issue.' },
      { question: 'How many mocks are enough?', answer: 'Enough to establish a trend. Consistent review quality matters more than just accumulating paper count.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'cambridge-computer-science-tmua-guide',
    title: 'Cambridge Computer Science TMUA Guide',
    description: 'A TMUA planning route for applicants who need strong symbolic fluency and controlled logical reasoning.',
    audience: 'Computer Science applicants preparing for mathematically selective admissions.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Treat early-paper algebra as free marks and avoid spending too long on one stubborn question.',
      'Use Paper 2 review to improve logical equivalence, implication, and counterexample selection.',
      'Measure progress using recent full mocks rather than topic drills alone.',
    ],
    faq: [
      { question: 'Should I focus on Paper 2 more than Paper 1?', answer: 'Only after Paper 1 errors are stable. Paper 2 is high leverage, but avoid neglecting easy Paper 1 losses.' },
      { question: 'What is the best review method?', answer: 'Write down why the correct option is forced and why your chosen option looked tempting.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'ucl-economics-tmua-2026',
    title: 'UCL Economics TMUA 2026',
    description: 'TMUA-focused preparation structure for applicants who need a stable score band rather than occasional peaks.',
    audience: 'UCL Economics applicants planning their 2026 cycle preparation.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Run timed mocks weekly enough to build timing instincts, not just content familiarity.',
      'Use your mistake book to separate calculation slips from concept gaps.',
      'Treat score stability as the main KPI once you reach a competitive middle band.',
    ],
    faq: [
      { question: 'How often should I sit full papers?', answer: 'Usually once per week is enough if the review between papers is disciplined.' },
      { question: 'What matters most after each mock?', answer: 'Understanding whether the lost marks came from speed, judgement, or missing knowledge.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'lse-economics-tmua',
    title: 'LSE Economics TMUA',
    description: 'A high-discipline TMUA route for Economics applicants aiming to protect score consistency under pressure.',
    audience: 'Applicants to highly selective Economics programs with mathematical screening.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Build a repeatable routine for the first ten questions of each paper.',
      'Use post-mock review to identify repeated error families rather than isolated mistakes.',
      'Avoid random practice. Every mock should lead to one explicit adjustment in the next one.',
    ],
    faq: [
      { question: 'Do I need top-end scores immediately?', answer: 'No. A rising and stable range is more useful than occasional outlier performances.' },
      { question: 'What is the biggest avoidable mistake?', answer: 'Doing too many questions without a clear review loop or timing plan.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'warwick-computer-science-tmua',
    title: 'Warwick Computer Science TMUA',
    description: 'TMUA preparation focused on speed, symbolic accuracy, and converting medium questions consistently.',
    audience: 'Computer Science applicants who need strong mathematical screening performance.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Paper 1 should become procedural and low-stress through repeated timed exposure.',
      'Paper 2 gains usually come from fewer hesitations and better interpretation of wording.',
      'Use year variety so you do not overfit to one paper style.',
    ],
    faq: [
      { question: 'How should CS applicants revise differently?', answer: 'Prioritize algebraic speed and logic interpretation, then test both under full timing.' },
      { question: 'When should I re-sit an old paper?', answer: 'Only when you are checking whether a specific review fix has changed your behaviour.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'warwick-mathematics-tmua',
    title: 'Warwick Mathematics TMUA',
    description: 'A TMUA planning page for Mathematics applicants who want a stronger paper-to-paper process.',
    audience: 'Mathematics applicants balancing content mastery with timed multiple-choice performance.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Do not let mathematical confidence hide weak multiple-choice decision habits.',
      'Track how many marks are lost from misreading versus genuine uncertainty.',
      'Use the latest mocks to sharpen execution, not to experiment wildly with new methods.',
    ],
    faq: [
      { question: 'Is content knowledge enough?', answer: 'No. TMUA also rewards fast reading, option elimination, and pacing control.' },
      { question: 'What should I log after each paper?', answer: 'Question number, topic, failure type, and what you would do differently next time.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'durham-mathematics-tmua',
    title: 'Durham Mathematics TMUA',
    description: 'A structured TMUA readiness page for applicants who need a practical mock-and-review workflow.',
    audience: 'Applicants to mathematics-related courses that benefit from TMUA strength.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Older papers are useful for repetition, but recent papers should be protected for honest timing checks.',
      'Improve your review loop before increasing total paper volume.',
      'Use one target score band and one specific weakness target at the same time.',
    ],
    faq: [
      { question: 'Should I start with older papers?', answer: 'Yes, if you need more low-pressure repetitions before using the most recent sets.' },
      { question: 'How do I know my review is working?', answer: 'The same mistake type should appear less often in the next two papers.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'imperial-computing-tmua-guide',
    title: 'Imperial Computing TMUA Guide',
    description: 'A TMUA route for applicants who need controlled pressure handling and reliable logical accuracy.',
    audience: 'Computing applicants targeting mathematically selective admissions pathways.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Use full papers to test whether your process survives time pressure, not just whether you know the math.',
      'Paper 2 often rewards cleaner interpretation more than deeper theory.',
      'Use the score converter to set a realistic short-term band target before chasing the ceiling.',
    ],
    faq: [
      { question: 'Should I drill topics or sit full mocks?', answer: 'Use full mocks to diagnose, then topic work only where the diagnosis is specific.' },
      { question: 'How do I improve quickly?', answer: 'Fix repeated review failures first. They usually block score gains more than new content does.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'which-courses-need-tmua',
    title: 'Which Courses Need TMUA?',
    description: 'A planning guide for applicants mapping course choices to TMUA preparation depth and timing.',
    audience: 'Applicants who want to decide how much TMUA preparation they need before finalizing priorities.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Start from course requirements, then match your paper volume to how critical the test is.',
      'Use one early mock to establish how far you are from your target band.',
      'Let score trend and course priority decide whether to intensify or maintain preparation.',
    ],
    faq: [
      { question: 'When should I finalize my TMUA plan?', answer: 'As early as possible after checking course requirements and running an initial timed mock.' },
      { question: 'What if several target courses use TMUA?', answer: 'Set one shared score target and use the strictest requirement as your preparation anchor.' },
    ],
    updatedAt: '2026-03-15',
  },
  {
    slug: 'tmua-paper-1-vs-paper-2',
    title: 'TMUA Paper 1 vs Paper 2',
    description: 'A practical guide to the different review methods, timing habits, and failure patterns of the two TMUA papers.',
    audience: 'Students who know their overall score but do not yet know which paper is dragging it down.',
    primaryTest: 'TMUA',
    keyPoints: [
      'Paper 1 usually rewards speed and procedural control; Paper 2 rewards interpretation and clean logical structure.',
      'Review both papers differently instead of using one generic post-mock process.',
      'The best next step after a mock often depends more on paper split than on total score.',
    ],
    faq: [
      { question: 'Which paper should I fix first?', answer: 'Fix whichever paper creates the most repeated mistakes with the least uncertainty.' },
      { question: 'Why does Paper 2 feel less stable?', answer: 'Because wording, implication structure, and confidence traps matter more than pure method recall.' },
    ],
    updatedAt: '2026-03-15',
  },
]

export function getGuideBySlug(slug: string): AdmissionsGuide | undefined {
  return ADMISSIONS_GUIDES.find((guide) => guide.slug === slug)
}
