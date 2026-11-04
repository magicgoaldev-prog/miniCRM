import type { AppErrorCode } from './errors'
import { extractErrorCode } from './errors'
import { ApiFailure } from './api'

type Translate = (path: string) => string

export function describeFailure(err: unknown, t: Translate): string {
  if (err instanceof ApiFailure) {
    return t(`errors.${err.code as AppErrorCode}`)
  }
  return t('errors.UNKNOWN')
}

export function describeApiError(
  error: { message?: string; code?: string } | null,
  t: Translate,
): string {
  return t(`errors.${extractErrorCode(error)}`)
}
