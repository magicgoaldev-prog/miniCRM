import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

type BackButtonProps = {
  fallbackTo: string
}

export function BackButton({ fallbackTo }: BackButtonProps) {
  const navigate = useNavigate()
  const { t } = useI18n()

  function onBack() {
    if (window.history.state?.idx && window.history.state.idx > 0) {
      navigate(-1)
      return
    }
    navigate(fallbackTo)
  }

  return (
    <button
      type="button"
      className="back-arrow"
      onClick={onBack}
      aria-label={t('actions.back')}
      title={t('actions.back')}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M12.25 4.5 6.75 10l5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
