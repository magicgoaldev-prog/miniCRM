import { useI18n } from '../i18n/I18nContext'
import type { Locale } from '../i18n/types'

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' },
]

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className={`lang-switch${compact ? ' lang-switch-compact' : ''}`}>
      {!compact && <span className="lang-switch-label">{t('nav.language')}</span>}
      <div className="lang-switch-track" role="group" aria-label={t('nav.language')}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`lang-switch-btn${locale === option.value ? ' active' : ''}`}
            onClick={() => setLocale(option.value)}
            aria-pressed={locale === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
