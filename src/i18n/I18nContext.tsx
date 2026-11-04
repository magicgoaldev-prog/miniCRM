import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './en'
import { ru } from './ru'
import type { Locale, MessageTree } from './types'

const STORAGE_KEY = 'siteflow.locale'
const dictionaries: Record<Locale, MessageTree> = { ru, en }

type TranslateArgs = Record<string, string | number>

type I18nState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, args?: TranslateArgs) => string
  messages: MessageTree
}

const I18nContext = createContext<I18nState | null>(null)

function readStoredLocale(): Locale {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'en' || raw === 'ru') return raw
  return 'ru'
}

function resolvePath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split('.')
  let cursor: unknown = tree
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return typeof cursor === 'string' ? cursor : undefined
}

function format(template: string, args?: TranslateArgs): string {
  if (!args) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(args[key] ?? ''))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale())

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const messages = dictionaries[locale]

  const t = useCallback(
    (path: string, args?: TranslateArgs) => {
      const value = resolvePath(messages, path) ?? resolvePath(ru, path) ?? path
      return format(value, args)
    },
    [messages],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n requires I18nProvider')
  return ctx
}
