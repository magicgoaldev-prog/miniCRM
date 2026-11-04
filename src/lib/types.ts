export type AppRole = 'assigner' | 'executor'

export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'on_review'
  | 'rework'
  | 'accepted'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: AppRole
  created_at: string
}

export type SiteObject = {
  id: string
  title: string
  address: string
  created_by: string
  created_at: string
}

export type Task = {
  id: string
  object_id: string
  title: string
  description: string
  assignee_id: string
  status: TaskStatus
  author_id: string
  created_at: string
  updated_at: string
}

export type TaskStatusHistory = {
  id: string
  task_id: string
  from_status: TaskStatus | null
  to_status: TaskStatus
  actor_id: string
  comment: string | null
  created_at: string
}

export type TaskWithNames = Task & {
  assignee_name?: string
  author_name?: string
  object_title?: string
}

export type TransitionAction = {
  to: TaskStatus
  labelKey:
    | 'actions.startWork'
    | 'actions.submitReview'
    | 'actions.resumeWork'
    | 'actions.accept'
    | 'actions.returnRework'
  requiresComment: boolean
}

export function availableTransitions(
  role: AppRole,
  status: TaskStatus,
  isAssignee: boolean,
): TransitionAction[] {
  if (role === 'executor' && isAssignee) {
    if (status === 'new') {
      return [{ to: 'in_progress', labelKey: 'actions.startWork', requiresComment: false }]
    }
    if (status === 'in_progress') {
      return [{ to: 'on_review', labelKey: 'actions.submitReview', requiresComment: false }]
    }
    if (status === 'rework') {
      return [{ to: 'in_progress', labelKey: 'actions.resumeWork', requiresComment: false }]
    }
  }

  if (role === 'assigner' && status === 'on_review') {
    return [
      { to: 'accepted', labelKey: 'actions.accept', requiresComment: false },
      { to: 'rework', labelKey: 'actions.returnRework', requiresComment: true },
    ]
  }

  return []
}
