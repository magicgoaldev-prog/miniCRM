import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import {
  ApiFailure,
  createTask,
  deleteTask,
  getObject,
  listExecutors,
  listTasksForObject,
  updateTaskMeta,
} from '../lib/api'
import { describeFailure } from '../lib/errorText'
import type { Profile, SiteObject, TaskWithNames } from '../lib/types'

export function ObjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useI18n()
  const isAssigner = profile?.role === 'assigner'

  const [object, setObject] = useState<SiteObject | null>(null)
  const [tasks, setTasks] = useState<TaskWithNames[]>([])
  const [executors, setExecutors] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithNames | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [nextObject, nextTasks] = await Promise.all([getObject(id), listTasksForObject(id)])
      setObject(nextObject)
      setTasks(nextTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.LOAD_SITE'))
    }
  }, [id, t])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!isAssigner) return
    listExecutors()
      .then((rows) => {
        setExecutors(rows)
        if (rows[0]) setAssigneeId(rows[0].id)
      })
      .catch(() => undefined)
  }, [isAssigner])

  function openCreate() {
    setEditingTask(null)
    setTaskTitle('')
    setTaskDescription('')
    setAssigneeId(executors[0]?.id ?? '')
    setCreating(true)
  }

  function openEditTask(event: MouseEvent, task: TaskWithNames) {
    event.stopPropagation()
    setCreating(false)
    setEditingTask(task)
    setTaskTitle(task.title)
    setTaskDescription(task.description)
    setAssigneeId(task.assignee_id)
  }

  function closeTaskDialog() {
    setCreating(false)
    setEditingTask(null)
    setTaskTitle('')
    setTaskDescription('')
  }

  async function onDeleteTask(event: MouseEvent, taskId: string) {
    event.stopPropagation()
    if (!window.confirm(t('taskDetail.deleteConfirm'))) return
    try {
      await deleteTask(taskId)
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.DELETE_TASK'))
    }
  }

  async function onSubmitTask(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      if (editingTask) {
        await updateTaskMeta(editingTask.id, {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assignee_id: assigneeId,
        })
      } else {
        await createTask({
          object_id: id,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assignee_id: assigneeId,
          author_id: profile.id,
        })
      }
      closeTaskDialog()
      await reload()
    } catch (err) {
      setError(
        err instanceof ApiFailure
          ? describeFailure(err, t)
          : t(editingTask ? 'errors.UPDATE_TASK' : 'errors.CREATE_TASK'),
      )
    } finally {
      setSaving(false)
    }
  }

  const canReassign =
    !!editingTask && (editingTask.status === 'new' || editingTask.status === 'rework')
  const dialogOpen = creating || editingTask !== null

  if (!object && !error) {
    return <div className="muted">{t('common.loadingSession')}</div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="title-with-back">
            <BackButton fallbackTo="/objects" />
            <h1>{object?.title ?? t('common.site')}</h1>
          </div>
          <p>{object?.address}</p>
        </div>
        {isAssigner && (
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              {t('actions.newTask')}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="panel panel-pad">
        <h2 style={{ marginBottom: 16, fontSize: '1.25rem' }}>{t('siteDetail.tasks')}</h2>
        {tasks.length === 0 ? (
          <div className="empty">{t('siteDetail.empty')}</div>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>{t('common.task')}</th>
                <th>{t('common.assignee')}</th>
                <th>{t('common.status')}</th>
                {isAssigner && <th className="col-actions" />}
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
                  <td className="muted">{task.assignee_name ?? '—'}</td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  {isAssigner && (
                    <td className="col-actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-row"
                          onClick={(event) => openEditTask(event, task)}
                        >
                          {t('actions.edit')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-row"
                          onClick={(event) => void onDeleteTask(event, task.id)}
                        >
                          {t('actions.delete')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dialogOpen && (
        <div className="dialog-backdrop" onClick={closeTaskDialog}>
          <form
            className="dialog stack"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void onSubmitTask(e)}
          >
            <h2>{editingTask ? t('taskDetail.editTitle') : t('siteDetail.createTitle')}</h2>
            <p className="lede">
              {editingTask
                ? canReassign
                  ? t('taskDetail.reassignHint')
                  : t('taskDetail.reassignLocked')
                : t('siteDetail.createLede')}
            </p>
            <div className="field">
              <label htmlFor="task-title">{t('common.title')}</label>
              <input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="task-description">{t('common.description')}</label>
              <textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="task-assignee">{t('common.assignee')}</label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={!!editingTask && !canReassign}
                required
              >
                {executors.map((executor) => (
                  <option key={executor.id} value={executor.id}>
                    {executor.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <button type="button" className="btn btn-ghost" onClick={closeTaskDialog}>
                {t('actions.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !assigneeId}>
                {saving
                  ? t('actions.saving')
                  : editingTask
                    ? t('actions.save')
                    : t('actions.create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
