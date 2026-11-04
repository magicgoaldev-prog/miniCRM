import { useI18n } from '../i18n/I18nContext'
import type { TaskStatus } from '../lib/types'

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n()
  return <span className={`badge badge-${status}`}>{t(`status.${status}`)}</span>
}
