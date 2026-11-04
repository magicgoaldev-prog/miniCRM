import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ApiFailure, getTask, listTaskHistory, transitionTask } from '../lib/api'
import { describeFailure } from '../lib/errorText'
import {
  availableTransitions,
  type TaskStatusHistory,
  type TaskWithNames,
} from '../lib/types'

export function TaskDetailPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const { t, locale } = useI18n()

  const [task, setTask] = useState<TaskWithNames | null>(null)
  const [history, setHistory] = useState<TaskStatusHistory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [nextTask, nextHistory] = await Promise.all([getTask(id), listTaskHistory(id)])
      setTask(nextTask)
      setHistory(nextHistory)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.LOAD_TASK'))
    }
  }, [id, t])

  useEffect(() => {
    void reload()
  }, [reload])

  const actions = useMemo(() => {
    if (!profile || !task) return []
    return availableTransitions(profile.role, task.status, task.assignee_id === profile.id)
  }, [profile, task])

  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-GB'

  async function onTransition(to: (typeof actions)[number]['to'], requiresComment: boolean) {
    if (requiresComment && !comment.trim()) {
      setError(t('errors.TASK_COMMENT_REQUIRED'))
      return
    }
    setBusy(true)
    try {
      await transitionTask(id, to, requiresComment ? comment.trim() : undefined)
      setComment('')
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.TRANSITION'))
    } finally {
      setBusy(false)
    }
  }

  if (!task && !error) {
    return <div className="muted">{t('common.loadingSession')}</div>
  }

  const fallbackTo = task ? `/objects/${task.object_id}` : '/objects'

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="page-header">
        <div>
          <div className="title-with-back">
            <BackButton fallbackTo={fallbackTo} />
            <h1>{task?.title ?? t('common.task')}</h1>
          </div>
          <p>{task?.description || t('common.noDescription')}</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {task && (
        <div className="panel panel-pad">
          <dl className="meta-grid">
            <div>
              <dt>{t('common.status')}</dt>
              <dd>
                <StatusBadge status={task.status} />
              </dd>
            </div>
            <div>
              <dt>{t('common.assignee')}</dt>
              <dd>{task.assignee_name ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('common.author')}</dt>
              <dd>{task.author_name ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('common.created')}</dt>
              <dd>{new Date(task.created_at).toLocaleString(dateLocale)}</dd>
            </div>
          </dl>
        </div>
      )}

      {actions.length > 0 && (
        <div className="panel panel-pad stack">
          <h2 style={{ fontSize: '1.2rem' }}>{t('taskDetail.availableActions')}</h2>
          {actions.some((action) => action.requiresComment) && (
            <div className="field">
              <label htmlFor="transition-comment">{t('common.comment')}</label>
              <textarea
                id="transition-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('taskDetail.commentPlaceholder')}
              />
            </div>
          )}
          <div className="row">
            {actions.map((action) => (
              <button
                key={action.to}
                type="button"
                className={`btn ${action.to === 'rework' ? 'btn-warn' : 'btn-primary'}`}
                disabled={busy}
                onClick={() => void onTransition(action.to, action.requiresComment)}
              >
                {t(action.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel panel-pad stack">
        <h2 style={{ fontSize: '1.2rem' }}>{t('taskDetail.history')}</h2>
        {history.length === 0 ? (
          <div className="empty">{t('taskDetail.historyEmpty')}</div>
        ) : (
          <ol className="history-list">
            {history.map((entry, index) => (
              <li
                key={entry.id}
                className="history-item"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div>
                  <strong>
                    {entry.from_status
                      ? `${t(`status.${entry.from_status}`)} → ${t(`status.${entry.to_status}`)}`
                      : `${t('taskDetail.createdAs')} ${t(`status.${entry.to_status}`)}`}
                  </strong>
                </div>
                <div className="muted">
                  {new Date(entry.created_at).toLocaleString(dateLocale)}
                  {entry.comment ? ` · ${entry.comment}` : ''}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
