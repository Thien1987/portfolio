import type { TaskStatus } from './types'

export type TaskStatusCategory = 'todo' | 'in-progress' | 'done'

export const TASK_STATUSES: { value: TaskStatus; label: string; category: TaskStatusCategory }[] = [
  { value: 'draft', label: 'Draft', category: 'todo' },
  { value: 'todo', label: 'To do', category: 'todo' },
  { value: 'in-progress', label: 'In progress', category: 'in-progress' },
  { value: 'blocked', label: 'Blocked', category: 'in-progress' },
  { value: 'in-review', label: 'In review', category: 'in-progress' },
  { value: 'done', label: 'Done', category: 'done' },
]

export function getTaskStatus(status: string) {
  return TASK_STATUSES.find((item) => item.value === status) ?? { value: 'todo' as const, label: status.replaceAll('-', ' '), category: 'todo' as const }
}

export function isTaskClosed(status: string) {
  return getTaskStatus(status).category === 'done'
}

export function isTaskComplete(status: string) {
  return status === 'done'
}

