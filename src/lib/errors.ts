export const AppErrorCode = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN_ROLE: 'FORBIDDEN_ROLE',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_TRANSITION_FORBIDDEN: 'TASK_TRANSITION_FORBIDDEN',
  TASK_COMMENT_REQUIRED: 'TASK_COMMENT_REQUIRED',
  TASK_REASSIGN_NOT_ALLOWED: 'TASK_REASSIGN_NOT_ALLOWED',
  TASK_STATUS_IMMUTABLE_VIA_UPDATE: 'TASK_STATUS_IMMUTABLE_VIA_UPDATE',
  TASK_FIELD_UPDATE_FORBIDDEN: 'TASK_FIELD_UPDATE_FORBIDDEN',
  ASSIGNEE_MUST_BE_EXECUTOR: 'ASSIGNEE_MUST_BE_EXECUTOR',
  OBJECT_HAS_TASKS: 'OBJECT_HAS_TASKS',
  UNKNOWN: 'UNKNOWN',
} as const

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode]

export function extractErrorCode(error: { message?: string; code?: string } | null): AppErrorCode {
  const raw = `${error?.message ?? ''} ${error?.code ?? ''}`
  for (const code of Object.values(AppErrorCode)) {
    if (code !== AppErrorCode.UNKNOWN && raw.includes(code)) {
      return code
    }
  }
  if (raw.includes('foreign key') || raw.includes('23503')) {
    return AppErrorCode.OBJECT_HAS_TASKS
  }
  return AppErrorCode.UNKNOWN
}
