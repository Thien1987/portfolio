import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import type { Plan, Priority, Project, Suggestion, Task } from './types'
import { getTaskStatus, isTaskClosed, isTaskComplete } from './taskStatus'

const priorityWeight: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
const weekKey = (date: string) => format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd')

export function generateSuggestions(plan: Plan): Suggestion[] {
  const found: Suggestion[] = []
  const { projects, steering } = plan
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const unscheduled = projects.flatMap((project) => project.tasks.filter((task) => !isTaskClosed(task.status)).map((task) => ({ project, task })))
  const weekly = new Map<string, { project: Project; task: Task }[]>()
  for (const item of unscheduled) {
    const key = weekKey(item.task.startDate)
    weekly.set(key, [...(weekly.get(key) ?? []), item])
  }

  for (const items of weekly.values()) {
    const hours = items.reduce((sum, item) => sum + item.task.estimatedHours, 0)
    if (hours <= steering.weeklyCapacity) continue
    const movable = [...items].sort((a, b) => priorityWeight[a.project.priority] - priorityWeight[b.project.priority] || b.task.estimatedHours - a.task.estimatedHours)[0]
    if (!movable) continue
    const start = parseISO(movable.task.startDate)
    const end = parseISO(movable.task.dueDate)
    const shift = 7
    const suggestedStart = format(addDays(start, shift), 'yyyy-MM-dd')
    const suggestedEnd = format(addDays(end, shift), 'yyyy-MM-dd')
    found.push({
      id: `overload:${movable.task.id}`, type: 'overload', title: steering.protectFocus ? `Protect a little breathing room` : `Shift overflow out of this week`,
      reason: `This week is at ${hours}h against your ${steering.weeklyCapacity}h capacity. ${steering.protectFocus ? 'Moving this task to a quieter week preserves a focus block.' : 'This lower-priority task can move without changing its estimate.'}`,
      confidence: 0.91, target: { projectId: movable.project.id, taskId: movable.task.id },
      change: { kind: 'reschedule', taskId: movable.task.id, startDate: suggestedStart, dueDate: suggestedEnd },
    })
  }

  for (const project of projects) {
    if (project.status === 'complete' || project.status === 'paused') continue
    const remaining = project.tasks.filter((task) => !isTaskClosed(task.status))
    const remainingHours = remaining.reduce((sum, task) => sum + task.estimatedHours, 0)
    const daysToDeadline = differenceInCalendarDays(parseISO(project.deadline), today)
    const available = Math.max(0, Math.ceil(daysToDeadline / 7)) * steering.weeklyCapacity
    if (daysToDeadline >= 0 && daysToDeadline <= 21 && remainingHours > available * 0.72 && project.status !== 'at-risk') {
      found.push({ id: `slipping:${project.id}`, type: 'slipping', title: `${project.name} may be slipping`,
        reason: `${remainingHours}h remain with ${daysToDeadline} days until its ${project.deadlineType} deadline. A little more room could protect the finish.`,
        confidence: 0.86, target: { projectId: project.id }, change: { kind: 'set-status', projectId: project.id, status: 'at-risk' } })
    } else if (project.status === 'at-risk' && daysToDeadline >= 0 && daysToDeadline <= 30 && remainingHours > 0) {
      const tomorrow = format(addDays(today, 1), 'yyyy-MM-dd')
      const first = remaining.filter((task) => task.startDate > tomorrow).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
      if (first && steering.proactivity !== 'quiet') {
        const duration = differenceInCalendarDays(parseISO(first.dueDate), parseISO(first.startDate))
        found.push({ id: `slipping:${project.id}`, type: 'slipping', title: `Protect time for ${project.name}`,
        reason: `${remainingHours}h remain before the deadline. Moving the next step earlier gives the plan more breathing room.`,
        confidence: 0.82, target: { projectId: project.id, taskId: first.id },
        change: { kind: 'reschedule', taskId: first.id, startDate: tomorrow, dueDate: format(addDays(parseISO(tomorrow), Math.max(1, duration)), 'yyyy-MM-dd') } })
      }
    }
  }

  if (steering.proactivity !== 'quiet') {
    const next = unscheduled.filter(({ task }) => task.dependencies.every((id) => projects.some((p) => p.tasks.some((candidate) => candidate.id === id && isTaskComplete(candidate.status)))))
      .sort((a, b) => priorityWeight[b.project.priority] - priorityWeight[a.project.priority] || a.task.startDate.localeCompare(b.task.startDate))[0]
    if (next && getTaskStatus(next.task.status).category === 'todo') found.push({ id: `next:${next.task.id}`, type: 'next-task', title: `A good next step: ${next.task.title}`,
      reason: `It supports ${next.project.name}, your ${next.project.priority}-priority project, and is already on your plan.`,
      confidence: 0.88, target: { projectId: next.project.id, taskId: next.task.id }, change: { kind: 'mark-next', taskId: next.task.id } })

    const vague = unscheduled.find(({ task }) => task.vague)
    if (vague && steering.proactivity === 'proactive') found.push({ id: `breakdown:${vague.task.id}`, type: 'breakdown', title: `Make “${vague.task.title}” easier to start`,
      reason: `This task is broad. A small first pass and a follow-up would make progress easier to see. Might be worth a look.`,
      confidence: 0.58, target: { projectId: vague.project.id, taskId: vague.task.id },
      change: { kind: 'add-subtasks', projectId: vague.project.id, parentTaskId: vague.task.id, tasks: [
        { id: `${vague.task.id}-first-pass`, title: 'Gather the key details', description: 'List people, materials, and decisions needed.', estimatedHours: 2, startDate: vague.task.startDate, dueDate: vague.task.startDate, status: 'todo', dependencies: [] },
        { id: `${vague.task.id}-follow-up`, title: 'Confirm the plan with the group', description: 'Share a concise plan and capture any open questions.', estimatedHours: 3, startDate: vague.task.dueDate, dueDate: vague.task.dueDate, status: 'todo', dependencies: [`${vague.task.id}-first-pass`] },
      ] } })

    const nudge = projects.find((project) => project.status !== 'complete' && project.status !== 'paused' && project.deadlineType === 'hard' && project.priority !== 'urgent' && differenceInCalendarDays(parseISO(project.deadline), today) < 35)
    if (nudge) found.push({ id: `priority:${nudge.id}`, type: 'priority', title: `Bring ${nudge.name} higher this week`,
      reason: `It has a hard deadline in ${differenceInCalendarDays(parseISO(nudge.deadline), today)} days and is currently ${nudge.priority} priority.`, confidence: 0.79,
      target: { projectId: nudge.id }, change: { kind: 'set-priority', projectId: nudge.id, priority: 'urgent' } })
  }

  const visible = found.filter((suggestion) => !plan.dismissedSuggestions.includes(suggestion.id) && !plan.resolvedSuggestions?.includes(suggestion.id))
    .filter((suggestion) => !suggestion.target.projectId || steering.includedPriorities.includes(projects.find((project) => project.id === suggestion.target.projectId)?.priority ?? 'low'))
  const conflicts = new Map<string, string[]>()
  visible.forEach((suggestion) => {
    const target = suggestion.change.kind === 'reschedule' ? `task:${suggestion.change.taskId}`
      : suggestion.change.kind === 'set-status' ? `status:${suggestion.change.projectId}`
        : suggestion.change.kind === 'set-priority' ? `priority:${suggestion.change.projectId}` : null
    if (!target) return
    conflicts.set(target, [...(conflicts.get(target) ?? []), suggestion.id])
  })
  const conflictIds = new Set([...conflicts.values()].filter((ids) => ids.length > 1).flat())
  return visible.map((suggestion) => conflictIds.has(suggestion.id) ? { ...suggestion, conflictGroup: `conflict:${suggestion.target.taskId ?? suggestion.target.projectId}` } : suggestion)
    .sort((a, b) => b.confidence - a.confidence)
}
