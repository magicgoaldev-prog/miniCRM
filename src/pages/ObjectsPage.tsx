import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ApiFailure, createObject, deleteObject, listObjects, updateObject } from '../lib/api'
import { describeFailure } from '../lib/errorText'
import type { SiteObject } from '../lib/types'

export function ObjectsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useI18n()
  const isAssigner = profile?.role === 'assigner'
  const [objects, setObjects] = useState<SiteObject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    try {
      setObjects(await listObjects())
      setError(null)
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.LOAD_SITES'))
    }
  }

  useEffect(() => {
    void reload()
  }, [t])

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setAddress('')
    setCreating(true)
  }

  function openEdit(event: MouseEvent, object: SiteObject) {
    event.stopPropagation()
    setCreating(false)
    setEditingId(object.id)
    setTitle(object.title)
    setAddress(object.address)
  }

  function closeDialog() {
    setCreating(false)
    setEditingId(null)
    setTitle('')
    setAddress('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      if (editingId) {
        await updateObject(editingId, { title: title.trim(), address: address.trim() })
      } else {
        await createObject({
          title: title.trim(),
          address: address.trim(),
          created_by: profile.id,
        })
      }
      closeDialog()
      await reload()
    } catch (err) {
      setError(
        err instanceof ApiFailure
          ? describeFailure(err, t)
          : t(editingId ? 'errors.UPDATE_SITE' : 'errors.CREATE_SITE'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(event: MouseEvent, objectId: string) {
    event.stopPropagation()
    if (!window.confirm(t('siteDetail.deleteConfirm'))) return
    try {
      await deleteObject(objectId)
      await reload()
    } catch (err) {
      setError(err instanceof ApiFailure ? describeFailure(err, t) : t('errors.DELETE_SITE'))
    }
  }

  const dialogOpen = creating || editingId !== null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('sites.title')}</h1>
          <p>{isAssigner ? t('sites.ledeAssigner') : t('sites.ledeExecutor')}</p>
        </div>
        {isAssigner && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            {t('actions.newSite')}
          </button>
        )}
      </div>

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="panel panel-pad">
        {objects.length === 0 ? (
          <div className="empty">{t('sites.empty')}</div>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.address')}</th>
                {isAssigner && <th className="col-actions" />}
              </tr>
            </thead>
            <tbody>
              {objects.map((object) => (
                <tr
                  key={object.id}
                  className="list-row-link"
                  tabIndex={0}
                  onClick={() => navigate(`/objects/${object.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/objects/${object.id}`)
                    }
                  }}
                >
                  <td>
                    <span className="list-row-title">{object.title}</span>
                  </td>
                  <td className="muted">{object.address}</td>
                  {isAssigner && (
                    <td className="col-actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-row"
                          onClick={(event) => openEdit(event, object)}
                        >
                          {t('actions.edit')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-row"
                          onClick={(event) => void onDelete(event, object.id)}
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
        <div className="dialog-backdrop" onClick={closeDialog}>
          <form
            className="dialog stack"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void onSubmit(e)}
          >
            <h2>{editingId ? t('siteDetail.editTitle') : t('sites.dialogTitle')}</h2>
            {!editingId && <p className="lede">{t('sites.dialogLede')}</p>}
            <div className="field">
              <label htmlFor="site-title">{t('common.name')}</label>
              <input
                id="site-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="site-address">{t('common.address')}</label>
              <input
                id="site-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="row">
              <button type="button" className="btn btn-ghost" onClick={closeDialog}>
                {t('actions.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? t('actions.saving')
                  : editingId
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
