export type Locale = 'en' | 'zh'

export const LOCALE_STORAGE_KEY = 'mocklab_locale'

const MESSAGES = {
  en: {
    nav_account: 'My Account',
    nav_mistakes: 'Mistake Center',
    nav_back: 'Back',
    nav_back_to_entrance: 'Back to Entrance',
    nav_system_entrance: 'System Entrance',
    lang_en: 'EN',
    lang_zh: '中文',

    home_badge: 'UK Admissions Test Platform',
    home_title: 'MockLab999 Operating System',
    home_desc: 'Prepare for UK admissions tests with realistic mocks, course-specific pathways, and weakness diagnosis.',
    home_next_step_title: 'Next step',
    home_next_step_desc: 'Choose your exam system to open the correct preparation workflow.',
    home_guides_title: 'Admissions Guides',
    home_guides_desc: 'High-intent pages for university-course pathways, test comparisons, and requirement-focused prep strategy.',
    home_guides_all: 'Open All Guides',
    home_guides_test_picker: 'Which UAT-UK Test Do I Need?',

    tmua_system: 'TMUA System',
    tmua_subtitle: 'Mathematics admissions mock system (2016-2023)',
    tmua_cta: 'Enter TMUA System',
    tmua_next_step: 'Open year dashboard',

    esat_system: 'ESAT System',
    esat_subtitle: 'ENGAA/NSAA route-based mock system',
    esat_cta: 'Enter ESAT System',
    esat_next_step: 'Open ESAT track hub',

    switch_tmua: 'TMUA System',
    switch_esat: 'ESAT System',

    dashboard_badge: 'Platform Home',
    dashboard_title: 'Choose TMUA or ESAT Before Starting a Mock',
    dashboard_desc: 'This page is the main platform entrance. Pick your exam system first, then enter the corresponding mock workflow.',
    dashboard_open_esat: 'Open ESAT Hub',
    dashboard_open_account: 'Open My Account',
    dashboard_open_mistakes: 'Open Mistake Center',
    dashboard_year_sets: 'TMUA Year Sets (2016-2023)',
    dashboard_year_sub: 'Each set includes Paper 1 + Paper 2, total 40 questions.',

    esat_badge: 'ESAT Mock Hub',
    esat_title: 'Choose ENGAA or NSAA',
    esat_desc: 'ESAT routes are isolated from TMUA and have their own exam entry flow.',

    engaa_title: 'ENGAA 2016-2023',
    engaa_desc: 'Select one year to enter ENGAA Paper 1 + Paper 2 mock.',

    nsaa_title: 'NSAA 2016-2023',
    nsaa_desc: 'Select a year, then choose 1 or 2 Parts for remaining papers.',
    nsaa_year_title: 'NSAA',
    nsaa_mandatory: 'Paper 1 is mandatory mathematics.',
    nsaa_choose_parts: 'Choose 1 or 2 Parts for the remaining papers.',
    nsaa_selected: 'Selected',
    nsaa_click_select: 'Click to select this Part',
    nsaa_start_mock: 'Start NSAA Mock',
  },
  zh: {
    nav_account: '我的账户',
    nav_mistakes: '错题中心',
    nav_back: '返回',
    nav_back_to_entrance: '返回入口页',
    nav_system_entrance: '系统入口',
    lang_en: 'EN',
    lang_zh: '中文',

    home_badge: '英国申请考试平台',
    home_title: 'MockLab999 备考操作系统',
    home_desc: '通过真实模考、专业路径规划和弱点诊断，系统准备英国大学入学测试。',
    home_next_step_title: '下一步',
    home_next_step_desc: '先选择考试系统，再进入对应的备考流程。',
    home_guides_title: '申请指南库',
    home_guides_desc: '高意图内容页：院校专业路径、考试对比、要求导向的备考策略。',
    home_guides_all: '查看全部指南',
    home_guides_test_picker: '我需要参加哪个 UAT-UK 考试？',

    tmua_system: 'TMUA 系统',
    tmua_subtitle: '数学能力入学模考系统（2016-2023）',
    tmua_cta: '进入 TMUA 系统',
    tmua_next_step: '进入年份模考面板',

    esat_system: 'ESAT 系统',
    esat_subtitle: 'ENGAA / NSAA 路径化模考系统',
    esat_cta: '进入 ESAT 系统',
    esat_next_step: '进入 ESAT 轨道主页',

    switch_tmua: 'TMUA 系统',
    switch_esat: 'ESAT 系统',

    dashboard_badge: '平台主页',
    dashboard_title: '先选择 TMUA 或 ESAT，再开始模考',
    dashboard_desc: '这里是平台主入口。先确定考试系统，再进入对应模考工作流。',
    dashboard_open_esat: '打开 ESAT Hub',
    dashboard_open_account: '打开我的账户',
    dashboard_open_mistakes: '打开错题中心',
    dashboard_year_sets: 'TMUA 年份套卷（2016-2023）',
    dashboard_year_sub: '每套包含 Paper 1 + Paper 2，共 40 题。',

    esat_badge: 'ESAT 模考中心',
    esat_title: '选择 ENGAA 或 NSAA',
    esat_desc: 'ESAT 与 TMUA 路由完全隔离，拥有独立入口和考试流程。',

    engaa_title: 'ENGAA 2016-2023',
    engaa_desc: '选择年份，进入 ENGAA Paper 1 + Paper 2 模考。',

    nsaa_title: 'NSAA 2016-2023',
    nsaa_desc: '先选年份，再选择 1 或 2 个 Part 组成考试。',
    nsaa_year_title: 'NSAA',
    nsaa_mandatory: 'Paper 1 为必考数学。',
    nsaa_choose_parts: '剩余试卷请选择 1 或 2 个 Part。',
    nsaa_selected: '已选择',
    nsaa_click_select: '点击选择该 Part',
    nsaa_start_mock: '开始 NSAA 模考',
  },
} as const

export type MessageKey = keyof (typeof MESSAGES)['en']

export function getMessage(locale: Locale, key: MessageKey): string {
  return MESSAGES[locale][key] || MESSAGES.en[key]
}
