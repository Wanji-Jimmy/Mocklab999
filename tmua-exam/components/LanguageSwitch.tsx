'use client'

import { useLanguage } from '@/components/LanguageProvider'

export default function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="warm-card-muted rounded-lg p-1 inline-flex items-center gap-1">
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold ${locale === 'en' ? 'warm-primary-btn' : 'warm-outline-btn'}`}
      >
        {t('lang_en')}
      </button>
      <button
        onClick={() => setLocale('zh')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold ${locale === 'zh' ? 'warm-primary-btn' : 'warm-outline-btn'}`}
      >
        {t('lang_zh')}
      </button>
    </div>
  )
}
