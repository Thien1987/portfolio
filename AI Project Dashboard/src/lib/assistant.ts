import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { generateSuggestions } from './suggestions'
import { getTaskStatus, isTaskClosed } from './taskStatus'
import type { Plan, Project, Task } from './types'

const priorityRank: Record<Project['priority'], number> = { urgent: 4, high: 3, medium: 2, low: 1 }
const tasksFor = (plan: Plan) => plan.projects.flatMap((project) => project.tasks.map((task) => ({ project, task })))

function findTask(request: string, items: { project: Project; task: Task }[]) {
  const exact = items.find(({ task }) => request.includes(task.title.toLowerCase()))
  if (exact) return exact
  const words = request.split(/[^a-z0-9]+/).filter((word) => word.length > 3)
  return items
    .map((item) => ({ ...item, score: words.filter((word) => item.task.title.toLowerCase().includes(word)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]
}

export function answerWorkspaceRequest(rawRequest: string, plan: Plan): string {
  const request = rawRequest.toLowerCase()
  const items = tasksFor(plan)
  const unfinished = items.filter(({ task }) => !isTaskClosed(task.status))
  const taskMatch = findTask(request, items)

  if (/capacity|overload|busy|workload|hours/.test(request)) {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), 'yyyy-MM-dd')
    const thisWeek = unfinished.filter(({ task }) => task.startDate >= weekStart && task.startDate <= weekEnd)
    const planned = thisWeek.reduce((sum, item) => sum + item.task.estimatedHours, 0)
    const projectHours = [...new Set(thisWeek.map(({ project }) => project.id))].map((id) => ({
      project: plan.projects.find((project) => project.id === id)!,
      hours: thisWeek.filter((item) => item.project.id === id).reduce((sum, item) => sum + item.task.estimatedHours, 0),
    })).sort((a, b) => b.hours - a.hours)
    const lead = projectHours[0]
    return planned > plan.steering.weeklyCapacity
      ? `You have ${planned}h planned against ${plan.steering.weeklyCapacity}h of weekly capacity (${planned - plan.steering.weeklyCapacity}h over). ${lead ? `${lead.project.name} accounts for the most at ${lead.hours}h.` : ''} Review the overload suggestions before moving work.`
      : `You have ${planned}h planned against ${plan.steering.weeklyCapacity}h of weekly capacity, leaving ${plan.steering.weeklyCapacity - planned}h. ${lead ? `${lead.project.name} has the largest share at ${lead.hours}h.` : 'There are no unfinished tasks scheduled this week.'}`
  }

  if (/risk|slip|late|deadline|behind/.test(request)) {
    const risks = generateSuggestions(plan).filter((suggestion) => suggestion.type === 'slipping' || suggestion.type === 'overload')
    if (risks.length) return risks.slice(0, 3).map((suggestion) => `${suggestion.title}: ${suggestion.reason}`).join('\n\n')
    const upcoming = plan.projects.filter((project) => project.status !== 'complete' && project.status !== 'paused')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))[0]
    return upcoming ? `I don't see an active slipping or overload suggestion. The next deadline is ${upcoming.name} on ${format(parseISO(upcoming.deadline), 'MMM d')}.` : 'There are no active project deadlines to review.'
  }

  if (/break|step|subtask|split|divide|smaller/.test(request)) {
    const item = taskMatch ?? unfinished.find(({ task }) => task.vague) ?? unfinished[0]
    return item
      ? `For “${item.task.title}”, try: 1) clarify what done means, 2) gather the inputs, and 3) complete a first pass. These are starter steps to adapt, not changes to your plan.`
      : 'There are no unfinished tasks to break into steps yet.'
  }

  if (/focus|next|priority|important|start/.test(request)) {
    const next = [...unfinished].sort((a, b) => priorityRank[b.project.priority] - priorityRank[a.project.priority] || a.task.dueDate.localeCompare(b.task.dueDate))[0]
    return next
      ? `A useful next task is “${next.task.title}” in ${next.project.name}. It is ${next.project.priority} priority, estimated at ${next.task.estimatedHours}h, and due ${format(parseISO(next.task.dueDate), 'MMM d')}.`
      : 'All planned tasks are complete. You can add a new task or review upcoming project deadlines.'
  }

  if (taskMatch) {
    const { task, project } = taskMatch
    return `“${task.title}” is ${getTaskStatus(task.status).label.toLowerCase()} in ${project.name}, estimated at ${task.estimatedHours}h, and scheduled ${format(parseISO(task.startDate), 'MMM d')}–${format(parseISO(task.dueDate), 'MMM d')}. You can edit it with the pen icon or resize it on the timeline.`
  }

  const projectMatch = plan.projects.find((project) => request.includes(project.name.toLowerCase()))
  if (projectMatch) {
    const remaining = projectMatch.tasks.filter((task) => !isTaskClosed(task.status))
    const remainingHours = remaining.reduce((sum, task) => sum + task.estimatedHours, 0)
    return `${projectMatch.name} is ${projectMatch.status.replace('-', ' ')} with ${remaining.length} unfinished tasks (${remainingHours}h) and a ${projectMatch.deadlineType} deadline on ${format(parseISO(projectMatch.deadline), 'MMM d')}.`
  }

  return `I reviewed your plan: ${plan.projects.length} projects and ${unfinished.length} unfinished tasks. I can help check weekly capacity, find a next priority, review deadline risks, or break down a task. Try one of the common requests below.`
}
