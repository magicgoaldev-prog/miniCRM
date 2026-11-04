import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ApiFailure, listMyTasks } from '../lib/api'
import { describeFailure } from '../lib/errorText'
import type { TaskWithNames } from '../lib/types'

export function MyTasksPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useI18n()
  const [tasks, setTasks] = useState<TaskWithNames[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    listMyTasks(profile.id)
      .then(setTasks)
      .catch((err) =>
        setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.LOAD_TASKS')),
      )
  }, [profile, t])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('myTasks.title')}</h1>
          <p>{t('myTasks.lede')}</p>
        </div>
      </div>

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="panel panel-pad">
        {tasks.length === 0 ? (
          <div className="empty">{t('myTasks.empty')}</div>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>{t('common.task')}</th>
                <th>{t('common.site')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="list-row-link"
                  tabIndex={0}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/tasks/${task.id}`)
                    }
                  }}
                >
                  <td>
                    <span className="list-row-title">{task.title}</span>
                  </td>
                  <td className="muted">{task.object_title ?? '—'}</td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
