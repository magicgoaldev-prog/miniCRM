import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export function ProfilePage() {
  const { profile } = useAuth()
  const { t, locale } = useI18n()

  if (!profile) return null

  const roleLabel = profile.role === 'assigner' ? t('roles.assigner') : t('roles.executor')
  const memberSince = new Date(profile.created_at).toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>{t('profile.title')}</h1>
          <p>{t('profile.lede')}</p>
        </div>
      </div>

      <section className="profile-hero panel">
        <div className="profile-hero-glow" aria-hidden />
        <div className="profile-hero-grid">
          <div className="profile-avatar-xl" aria-hidden>
            {profile.full_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-hero-copy">
            <p className="profile-kicker">{t('profile.signedInAs')}</p>
            <h2>{profile.full_name}</h2>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-chip-row">
              <span className="profile-chip">{roleLabel}</span>
              <span className="profile-chip profile-chip-soft">{t('brand.name')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-panels">
        <section className="panel panel-pad profile-panel">
          <h3>{t('profile.identity')}</h3>
          <dl className="profile-dl">
            <div>
              <dt>{t('profile.fullName')}</dt>
              <dd>{profile.full_name}</dd>
            </div>
            <div>
              <dt>{t('profile.email')}</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>{t('profile.memberSince')}</dt>
              <dd>{memberSince}</dd>
            </div>
            <div>
              <dt>{t('profile.userId')}</dt>
              <dd className="profile-mono">{profile.id}</dd>
            </div>
          </dl>
        </section>

        <section className="panel panel-pad profile-panel">
          <h3>{t('profile.access')}</h3>
          <dl className="profile-dl">
            <div>
              <dt>{t('profile.role')}</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>{t('profile.workspace')}</dt>
              <dd>{t('brand.tagline')}</dd>
            </div>
            <div>
              <dt>{t('profile.session')}</dt>
              <dd>{t('profile.account')}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
