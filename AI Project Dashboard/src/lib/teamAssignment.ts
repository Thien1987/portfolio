import type { Project, Task, TaskAssigneeRole } from './types'

export function getTaskAssigneeRole(task: Task, project: Project): TaskAssigneeRole | undefined {
  if (task.assigneeRole) return task.assigneeRole
  if (!task.assignee) return undefined
  if (task.assignee === project.epic?.team.designer) return 'designer'
  if (project.epic?.team.developers.includes(task.assignee)) return 'developer'
  return undefined
}

export function getProjectAssignees(project: Project) {
  const team = project.epic?.team
  const members = [
    ...(team?.designer && team.designer !== 'Unassigned' ? [{ name: team.designer, role: 'designer' as const }] : []),
    ...(team?.developers ?? []).filter((name) => name && name !== 'Unassigned').map((name) => ({ name, role: 'developer' as const })),
  ]
  return members.filter((member, index) => members.findIndex((candidate) => candidate.name === member.name && candidate.role === member.role) === index)
}
