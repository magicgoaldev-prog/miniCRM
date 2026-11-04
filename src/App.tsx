import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { useAuth } from './context/AuthContext'
import { useI18n } from './i18n/I18nContext'
import { LoginPage } from './pages/LoginPage'
import { MyTasksPage } from './pages/MyTasksPage'
import { ObjectDetailPage } from './pages/ObjectDetailPage'
import { ObjectsPage } from './pages/ObjectsPage'
import { ProfilePage } from './pages/ProfilePage'
import { TaskDetailPage } from './pages/TaskDetailPage'

function Protected({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const { t } = useI18n()

  if (loading) {
    return <div className="loading-screen">{t('common.loadingSession')}</div>
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/objects" replace />} />
        <Route path="objects" element={<ObjectsPage />} />
        <Route path="objects/:id" element={<ObjectDetailPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
