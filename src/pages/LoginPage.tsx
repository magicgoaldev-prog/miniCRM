import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export function LoginPage() {
  const { session, profile, loading, signIn } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && profile) {
    return <Navigate to={profile.role === 'executor' ? '/my-tasks' : '/objects'} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email.trim(), password)
    if (message) setError(message)
    setSubmitting(false)
  }

  return (
    <div className="login-screen">
      <form className="panel login-card" onSubmit={(e) => void onSubmit(e)}>
        <div className="login-lang">
          <LanguageSwitch compact />
        </div>
        <h1>{t('brand.name')}</h1>
        <p className="lede">{t('login.lede')}</p>

        <div className="stack">
          <div className="field">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? t('actions.signingIn') : t('actions.signIn')}
          </button>
        </div>
      </form>
    </div>
  )
}
