import { extractErrorCode } from './errors'
import { supabase } from './supabase'
import type {
  Profile,
  SiteObject,
  Task,
  TaskStatus,
  TaskStatusHistory,
  TaskWithNames,
} from './types'

export class ApiFailure extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function fail(error: { message?: string; code?: string } | null): never {
  const code = extractErrorCode(error)
  throw new ApiFailure(code, code)
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) fail(error)
  return data as Profile
}

export async function listExecutors(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'executor')
    .order('full_name')

  if (error) fail(error)
  return (data ?? []) as Profile[]
}

export async function listObjects(): Promise<SiteObject[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) fail(error)
  return (data ?? []) as SiteObject[]
}

export async function getObject(id: string): Promise<SiteObject> {
  const { data, error } = await supabase.from('objects').select('*').eq('id', id).single()
  if (error || !data) fail(error)
  return data as SiteObject
}

export async function createObject(input: {
  title: string
  address: string
  created_by: string
}): Promise<SiteObject> {
  const { data, error } = await supabase.from('objects').insert(input).select('*').single()
  if (error || !data) fail(error)
  return data as SiteObject
}

export async function updateObject(
  id: string,
  input: { title: string; address: string },
): Promise<SiteObject> {
  const { data, error } = await supabase
    .from('objects')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) fail(error)
  return data as SiteObject
}

export async function deleteObject(id: string): Promise<void> {
  const { error } = await supabase.from('objects').delete().eq('id', id)
  if (error) fail(error)
}

export async function listTasksForObject(objectId: string): Promise<TaskWithNames[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('object_id', objectId)
    .order('created_at', { ascending: false })

  if (error) fail(error)
  return enrichTasks((data ?? []) as Task[])
}

export async function listMyTasks(assigneeId: string): Promise<TaskWithNames[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', assigneeId)
    .order('updated_at', { ascending: false })

  if (error) fail(error)
  return enrichTasks((data ?? []) as Task[])
}

export async function getTask(id: string): Promise<TaskWithNames> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (error || !data) fail(error)
  const [enriched] = await enrichTasks([data as Task])
  return enriched
}

async function enrichTasks(tasks: Task[]): Promise<TaskWithNames[]> {
  if (tasks.length === 0) return []

  const profileIds = [...new Set(tasks.flatMap((t) => [t.assignee_id, t.author_id]))]
  const objectIds = [...new Set(tasks.map((t) => t.object_id))]

  const [{ data: profiles }, { data: objects }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', profileIds),
    supabase.from('objects').select('id, title').in('id', objectIds),
  ])

  const nameById = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string]))
  const titleById = new Map((objects ?? []).map((o) => [o.id as string, o.title as string]))

  return tasks.map((task) => ({
    ...task,
    assignee_name: nameById.get(task.assignee_id),
    author_name: nameById.get(task.author_id),
    object_title: titleById.get(task.object_id),
  }))
}

export async function createTask(input: {
  object_id: string
  title: string
  description: string
  assignee_id: string
  author_id: string
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...input, status: 'new' })
    .select('*')
    .single()
  if (error || !data) fail(error)
  return data as Task
}

export async function updateTaskMeta(
  id: string,
  input: { title: string; description: string; assignee_id: string },
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) fail(error)
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) fail(error)
}

export async function transitionTask(
  taskId: string,
  toStatus: TaskStatus,
  comment?: string,
): Promise<Task> {
  const { data, error } = await supabase.rpc('transition_task', {
    p_task_id: taskId,
    p_to_status: toStatus,
    p_comment: comment ?? null,
  })
  if (error || !data) fail(error)
  return data as Task
}

export async function listTaskHistory(taskId: string): Promise<TaskStatusHistory[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) fail(error)
  return (data ?? []) as TaskStatusHistory[]
}
