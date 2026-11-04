import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSwitch } from './LanguageSwitch'

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useI18n()
  const isAssigner = profile?.role === 'assigner'

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <div className="brand-mark">{t('brand.name')}</div>
          <div className="brand-sub">{t('brand.tagline')}</div>
        </div>

        <nav className="nav-links">
          <NavLink to="/objects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {t('nav.sites')}
          </NavLink>
          {!isAssigner && (
            <NavLink
              to="/my-tasks"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {t('nav.myTasks')}
            </NavLink>
          )}
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {t('nav.profile')}
          </NavLink>
        </nav>

        <div className="nav-footer">
          <LanguageSwitch />
          <NavLink to="/profile" className="nav-profile-card">
            <div className="nav-avatar" aria-hidden>
              {(profile?.full_name ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="nav-profile-copy">
              <div className="nav-user-name">{profile?.full_name}</div>
              <div className="nav-user-meta">
                {isAssigner ? t('roles.assigner') : t('roles.executor')}
              </div>
            </div>
          </NavLink>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      <main className="main-pane">
        <Outlet />
      </main>
    </div>
  )
}
