import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, addMonths, addWeeks, format, parseISO } from 'date-fns'
import { createSeedPlan } from './seed'
import { generateSuggestions } from './suggestions'
import { getTaskStatus } from './taskStatus'
import { getProjectStage } from './projectStage'
import { getProjectStartDate } from './projectSchedule'
import type { CalendarScale, HistoryEntry, Plan, Project, SteeringSettings, Suggestion, TaskStatus, WorkspaceView } from './types'

interface WorkspaceState {
  plan: Plan
  department: string
  allProjects: Project[]
  theme: 'light' | 'dark'
  themePreferenceSet: boolean
  view: WorkspaceView
  calendarScale: CalendarScale
  history: Plan[]
  future: Plan[]
  historyEntries: HistoryEntry[]
  selectedProject: string | null
  timelineProjectFilter: string[] | null
  setView: (view: WorkspaceView) => void
  setTheme: (theme: 'light' | 'dark') => void
  setCalendarScale: (scale: CalendarScale) => void
  setDepartment: (department: string) => void
  selectProject: (id: string | null) => void
  setTimelineProjectFilter: (ids: string[] | null) => void
  updateSteering: (patch: Partial<SteeringSettings>) => void
  togglePriority: (priority: SteeringSettings['includedPriorities'][number]) => void
  moveTaskByWeek: (taskId: string, weekOffset: number) => void
  moveTask: (taskId: string, projectId: string, weekOffset: number) => void
  moveTaskByPeriod: (taskId: string, projectId: string, offset: number, scale: CalendarScale) => void
  resizeTaskDuration: (taskId: string, deltaDays: number) => void
  resizeTaskToDate: (taskId: string, dueDate: string) => void
  reorderProjects: (activeId: string, overId: string) => void
  changeTaskStatus: (taskId: string, status: TaskStatus) => void
  addWeekStatus: (label: string) => void
  reorderWeekColumns: (orderedIds: string[]) => void
  updateTask: (taskId: string, patch: Partial<Project['tasks'][number]>) => void
  deleteTask: (taskId: string) => void
  updateProject: (projectId: string, patch: Partial<Project>) => void
  deleteProject: (projectId: string) => void
  addTask: (task: Project['tasks'][number]) => void
  acceptSuggestion: (suggestion: Suggestion) => void
  dismissSuggestion: (suggestion: Suggestion) => void
  addProject: (project: Project) => void
  undo: () => void
  redo: () => void
  reset: () => void
}

const clone = (value: Plan) => structuredClone(value)
const normalizeTaskStatus = (status: string): TaskStatus => ({
  backlog: 'todo', triage: 'todo', ready: 'todo',
  'on-hold': 'blocked', testing: 'in-review', 'awaiting-approval': 'in-review', approved: 'done', canceled: 'done',
}[status] as TaskStatus | undefined) ?? status as TaskStatus
const canceledStatusValues = (statuses: Plan['weekStatuses'] = []) => new Set(statuses.filter((status) => status.label.trim().toLocaleLowerCase().startsWith('cancel') || status.value.toLocaleLowerCase().startsWith('custom-cancel')).map((status) => status.value))
const normalizePlanTaskStatuses = (plan: Plan): Plan => {
  const removedStatuses = canceledStatusValues(plan.weekStatuses)
  return {
    ...plan,
    weekStatuses: plan.weekStatuses?.filter((status) => !removedStatuses.has(status.value)),
    weekColumnOrder: plan.weekColumnOrder?.filter((id) => !removedStatuses.has(id)),
    projects: plan.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => ({ ...task, status: removedStatuses.has(task.status) ? 'done' : normalizeTaskStatus(task.status) })) })),
  }
}
const mergeActiveProjects = (state: WorkspaceState, plan: Plan) => {
  const changed = new Map(plan.projects.map((project) => [project.id, project]))
  const allProjects = state.allProjects.map((project) => changed.get(project.id) ?? project)
  const existingIds = new Set(state.allProjects.map((project) => project.id))
  allProjects.push(...plan.projects.filter((project) => !existingIds.has(project.id)))
  return allProjects
}
const nextIssueKey = (project: Project, offset = 0) => {
  const maxNumber = project.tasks.reduce((max, task) => Math.max(max, Number(task.issueKey?.split('-').at(-1)) || 100), 100)
  return `${project.epic?.key.split('-')[0] ?? 'MARG'}-${maxNumber + 1 + offset}`
}
const record = (state: WorkspaceState, label: string, plan: Plan) => ({
  plan, allProjects: mergeActiveProjects(state, plan), history: [...state.history.slice(-19), clone(state.plan)], future: [],
  historyEntries: [{ label, at: new Date().toISOString() }, ...state.historyEntries].slice(0, 12),
})

const seedPlan = createSeedPlan()
const initialDepartment = 'Product'
const initialProjects = seedPlan.projects
const initialPlan = { ...seedPlan, projects: seedPlan.projects.filter((project) => project.departments?.includes(initialDepartment)) }

export const useWorkspace = create<WorkspaceState>()(persist((set) => ({
  plan: initialPlan, department: initialDepartment, allProjects: initialProjects, theme: 'dark', themePreferenceSet: false, view: 'timeline', calendarScale: 'week', history: [], future: [], historyEntries: [], selectedProject: null, timelineProjectFilter: null,
  setView: (view) => set({ view }), setCalendarScale: (calendarScale) => set({ calendarScale }), selectProject: (selectedProject) => set({ selectedProject }),
  setDepartment: (department) => set((state) => department === state.department ? state : ({ department, plan: { ...state.plan, projects: state.allProjects.filter((project) => project.departments?.includes(department)) }, history: [], future: [], historyEntries: [], selectedProject: null, timelineProjectFilter: null })),
  setTimelineProjectFilter: (timelineProjectFilter) => set({ timelineProjectFilter: timelineProjectFilter ? [...timelineProjectFilter] : null }),
  setTheme: (theme) => set({ theme, themePreferenceSet: true }),
  updateSteering: (patch) => set((state) => ({ plan: { ...state.plan, steering: { ...state.plan.steering, ...patch } } })),
  togglePriority: (priority) => set((state) => {
    const current = state.plan.steering.includedPriorities
    const includedPriorities = current.includes(priority) ? current.filter((item) => item !== priority) : [...current, priority]
    return { plan: { ...state.plan, steering: { ...state.plan.steering, includedPriorities } } }
  }),
  moveTaskByWeek: (taskId, weekOffset) => set((state) => {
    const previous = clone(state.plan)
    const projects = previous.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => task.id !== taskId ? task : {
      ...task, startDate: format(addDays(parseISO(task.startDate), weekOffset * 7), 'yyyy-MM-dd'), dueDate: format(addDays(parseISO(task.dueDate), weekOffset * 7), 'yyyy-MM-dd'),
    }) }))
    return record(state, 'Moved a task on the timeline', { ...previous, projects })
  }),
  moveTask: (taskId, projectId, weekOffset) => set((state) => {
    const plan = clone(state.plan)
    let moved = null as Project['tasks'][number] | null
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.filter((task) => {
      if (task.id !== taskId) return true
      moved = { ...task, projectId, startDate: format(addDays(parseISO(task.startDate), weekOffset * 7), 'yyyy-MM-dd'), dueDate: format(addDays(parseISO(task.dueDate), weekOffset * 7), 'yyyy-MM-dd') }
      return false
    }) }))
    if (!moved) return state
    plan.projects = plan.projects.map((project) => project.id === projectId ? { ...project, tasks: [...project.tasks, moved!] } : project)
    return record(state, 'Moved a task between projects or weeks', plan)
  }),
  moveTaskByPeriod: (taskId, projectId, offset, scale) => set((state) => {
    const shift = (date: string) => {
      const parsed = parseISO(date)
      const months = scale === 'quarter' ? 3 : scale === 'half-year' ? 6 : scale === 'year' ? 12 : 1
      return format(scale === 'day' ? addDays(parsed, offset) : scale === 'week' ? addWeeks(parsed, offset) : addMonths(parsed, offset * months), 'yyyy-MM-dd')
    }
    const plan = clone(state.plan)
    let moved = null as Project['tasks'][number] | null
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.filter((task) => {
      if (task.id !== taskId) return true
      moved = { ...task, projectId, startDate: shift(task.startDate), dueDate: shift(task.dueDate) }
      return false
    }) }))
    if (!moved) return state
    plan.projects = plan.projects.map((project) => project.id === projectId ? { ...project, tasks: [...project.tasks, moved!] } : project)
    const periodName = scale === 'day' ? 'day' : scale === 'week' ? 'week' : scale === 'quarter' ? 'quarter' : scale === 'half-year' ? 'six-month period' : scale === 'year' ? 'year' : 'month'
    return record(state, `Moved a task by ${periodName}`, plan)
  }),
  resizeTaskDuration: (taskId, deltaDays) => set((state) => {
    const plan = clone(state.plan)
    let changed = false
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => {
      if (task.id !== taskId) return task
      const start = parseISO(task.startDate)
      const nextDue = addDays(parseISO(task.dueDate), deltaDays)
      const dueDate = format(nextDue < start ? start : nextDue, 'yyyy-MM-dd')
      changed ||= dueDate !== task.dueDate
      return { ...task, dueDate }
    }) }))
    if (!changed) return state
    return record(state, deltaDays > 0 ? 'Extended a task date range' : 'Shortened a task date range', plan)
  }),
  resizeTaskToDate: (taskId, dueDate) => set((state) => {
    const plan = clone(state.plan)
    let changed = false
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => {
      if (task.id !== taskId) return task
      const end = dueDate < task.startDate ? task.startDate : dueDate
      changed ||= end !== task.dueDate
      return { ...task, dueDate: end }
    }) }))
    if (!changed) return state
    return record(state, 'Resized a task on the timeline', plan)
  }),
  reorderProjects: (activeId, overId) => set((state) => {
    const projects = [...state.plan.projects]
    const from = projects.findIndex((project) => project.id === activeId), to = projects.findIndex((project) => project.id === overId)
    if (from < 0 || to < 0) return state
    projects.splice(to, 0, projects.splice(from, 1)[0])
    return record(state, 'Reordered project priorities', { ...state.plan, projects })
  }),
  changeTaskStatus: (taskId, status) => set((state) => {
    const plan = clone(state.plan)
    const task = plan.projects.flatMap((project) => project.tasks).find((item) => item.id === taskId)
    if (!task || task.status === status) return state
    const taskTitle = task.title
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, status } : task) }))
    return record(state, `Moved ${taskTitle} to ${getTaskStatus(status).label}`, plan)
  }),
  addWeekStatus: (rawLabel) => set((state) => {
    const label = rawLabel.trim().replace(/\s+/g, ' ')
    if (!label) return state
    const existing = state.plan.weekStatuses ?? []
    if ([...existing.map((item) => item.label), 'Draft', 'To do', 'In progress', 'Blocked', 'In review', 'Done'].some((item) => item.toLocaleLowerCase() === label.toLocaleLowerCase())) return state
    const base = `custom-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'status'}`
    let value = base
    let suffix = 2
    while ([...existing.map((item) => item.value), 'draft', 'todo', 'in-progress', 'blocked', 'in-review', 'done'].includes(value)) value = `${base}-${suffix++}`
    const plan = clone(state.plan)
    plan.weekStatuses = [...existing, { value, label }]
    return record(state, `Added “${label}” workflow status`, plan)
  }),
  reorderWeekColumns: (orderedIds) => set((state) => {
    const allIds = ['draft', 'todo', 'in-progress', 'blocked', 'in-review', 'done', ...(state.plan.weekStatuses ?? []).map((item) => item.value)]
    const validIds = new Set(allIds)
    const saved = state.plan.weekColumnOrder ?? []
    const current = [...saved.filter((id) => validIds.has(id)), ...allIds.filter((id) => !saved.includes(id))]
    const next = [...orderedIds.filter((id) => validIds.has(id)), ...current.filter((id) => !orderedIds.includes(id) && validIds.has(id))]
    if (current.length === next.length && current.every((id, index) => id === next[index])) return state
    return record(state, 'Reordered This week workflow columns', { ...state.plan, weekColumnOrder: next })
  }),
  updateTask: (taskId, patch) => set((state) => {
    const plan = clone(state.plan)
    let taskTitle = 'a task'
    plan.projects = plan.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => {
      if (task.id !== taskId) return task
      taskTitle = patch.title?.trim() || task.title
      const nextTask = { ...task, ...patch, title: taskTitle }
      if (nextTask.dueDate < nextTask.startDate) nextTask.dueDate = nextTask.startDate
      return nextTask
    }) }))
    return record(state, `Edited task: ${taskTitle}`, plan)
  }),
  deleteTask: (taskId) => set((state) => {
    const plan = clone(state.plan)
    const task = plan.projects.flatMap((project) => project.tasks).find((item) => item.id === taskId)
    if (!task) return state
    plan.projects = plan.projects.map((project) => ({
      ...project,
      tasks: project.tasks.filter((item) => item.id !== taskId).map((item) => ({ ...item, dependencies: item.dependencies.filter((dependency) => dependency !== taskId) })),
    }))
    return record(state, `Deleted task: ${task.title}`, plan)
  }),
  updateProject: (projectId, patch) => set((state) => {
    const plan = clone(state.plan)
    plan.projects = plan.projects.map((project) => project.id === projectId ? { ...project, ...patch } : project)
    return record(state, `Updated ${plan.projects.find((project) => project.id === projectId)?.name ?? 'a project'}`, plan)
  }),
  deleteProject: (projectId) => set((state) => {
    const project = state.allProjects.find((item) => item.id === projectId) ?? state.plan.projects.find((item) => item.id === projectId)
    if (!project) return state
    const withoutProject = (plan: Plan): Plan => ({ ...plan, projects: plan.projects.filter((item) => item.id !== projectId) })
    const remainingFilter = state.timelineProjectFilter?.filter((id) => id !== projectId)
    return {
      plan: withoutProject(state.plan),
      allProjects: state.allProjects.filter((item) => item.id !== projectId),
      history: state.history.map(withoutProject),
      future: state.future.map(withoutProject),
      historyEntries: [{ label: `Deleted epic: ${project.name}`, at: new Date().toISOString() }, ...state.historyEntries].slice(0, 12),
      selectedProject: state.selectedProject === projectId ? null : state.selectedProject,
      timelineProjectFilter: remainingFilter?.length ? remainingFilter : null,
    }
  }),
  addTask: (task) => set((state) => {
    const plan = clone(state.plan)
    plan.projects = plan.projects.map((project) => project.id === task.projectId ? { ...project, tasks: [...project.tasks, { ...task, issueKey: task.issueKey ?? nextIssueKey(project) }] } : project)
    return record(state, `Added task: ${task.title}`, plan)
  }),
  acceptSuggestion: (suggestion) => set((state) => {
    const next = clone(state.plan)
    if (suggestion.conflictGroup) {
      const competingIds = generateSuggestions(state.plan).filter((item) => item.conflictGroup === suggestion.conflictGroup && item.id !== suggestion.id).map((item) => item.id)
      next.resolvedSuggestions = [...new Set([...next.resolvedSuggestions, ...competingIds])]
    }
    const change = suggestion.change
    if (change.kind === 'reschedule') next.projects = next.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => task.id === change.taskId ? { ...task, startDate: change.startDate, dueDate: change.dueDate } : task) }))
    if (change.kind === 'set-status') next.projects = next.projects.map((project) => project.id === change.projectId ? { ...project, status: change.status } : project)
    if (change.kind === 'set-priority') next.projects = next.projects.map((project) => project.id === change.projectId ? { ...project, priority: change.priority } : project)
    if (change.kind === 'add-subtasks') next.projects = next.projects.map((project) => project.id === change.projectId ? { ...project, tasks: [...project.tasks, ...change.tasks.map((task, index) => ({ ...task, projectId: project.id, issueKey: nextIssueKey(project, index) }))] } : project)
    if (change.kind === 'mark-next') next.projects = next.projects.map((project) => ({ ...project, tasks: project.tasks.map((task) => task.id === change.taskId ? { ...task, status: 'in-progress' } : task) }))
    next.resolvedSuggestions = [...new Set([...next.resolvedSuggestions, suggestion.id])]
    return record(state, `Accepted suggestion: ${suggestion.title}`, next)
  }),
  dismissSuggestion: (suggestion) => set((state) => ({ plan: { ...state.plan, dismissedSuggestions: [...new Set([...state.plan.dismissedSuggestions, suggestion.id])] } })),
  addProject: (project) => set((state) => record(state, `Added project: ${project.name}`, { ...state.plan, projects: [...state.plan.projects, { ...project, departments: project.departments?.length ? project.departments : [state.department] }] })),
  undo: () => set((state) => {
    if (!state.history.length) return state
    const previous = state.history[state.history.length - 1]
    const plan = clone(previous)
    return { plan, allProjects: mergeActiveProjects(state, plan), history: state.history.slice(0, -1), future: [clone(state.plan), ...state.future].slice(0, 20), historyEntries: [{ label: 'Undid the last change', at: new Date().toISOString() }, ...state.historyEntries].slice(0, 12) }
  }),
  redo: () => set((state) => {
    if (!state.future.length) return state
    const plan = clone(state.future[0])
    return { plan, allProjects: mergeActiveProjects(state, plan), history: [...state.history, clone(state.plan)].slice(-20), future: state.future.slice(1), historyEntries: [{ label: 'Redid a change', at: new Date().toISOString() }, ...state.historyEntries].slice(0, 12) }
  }),
  reset: () => set({ plan: initialPlan, department: initialDepartment, allProjects: initialProjects, history: [], future: [], historyEntries: [], selectedProject: null, timelineProjectFilter: null }),
}), {
  name: 'margin-planner-v1',
  version: 18,
  migrate: (persistedState) => {
    const persisted = persistedState as Partial<WorkspaceState>
    const seedPlan = createSeedPlan()
    const plan = persisted.plan ?? seedPlan
    const department = persisted.department ?? initialDepartment
    const savedProjects = persisted.allProjects ?? plan.projects ?? seedPlan.projects
    const savedProjectIds = new Set(savedProjects.map((project) => project.id))
    const projectSource = [...savedProjects, ...seedPlan.projects.filter((project) => !savedProjectIds.has(project.id))]
    const removedCanceledStatuses = canceledStatusValues(plan.weekStatuses)
    const projects = projectSource.map((project) => {
      const seededProject = seedPlan.projects.find((item) => item.id === project.id)
      const epic = project.epic ?? seededProject?.epic ?? {
        key: `MARG-${project.id.replace(/\D/g, '').slice(-4) || '101'}`,
        prd: { problem: project.summary, outcome: 'Deliver the outcome described in this project plan.', requirements: ['Confirm scope with the project team', 'Track delivery through linked stories'] },
        team: { pm: 'Unassigned', designer: 'Unassigned', developers: [] },
      }
      return { ...project, departments: project.departments?.length ? project.departments : seededProject?.departments ?? [department], color: seededProject?.color ?? project.color, startDate: seededProject?.startDate ?? project.startDate ?? getProjectStartDate(project), stage: getProjectStage(project.stage, project.status) ?? seededProject?.stage, epic, tasks: project.tasks.map((task, index) => {
        const seededTask = seededProject?.tasks.find((item) => item.id === task.id)
        return { ...task, startDate: seededTask?.startDate ?? task.startDate, dueDate: seededTask?.dueDate ?? task.dueDate, status: removedCanceledStatuses.has(task.status) ? 'done' : normalizeTaskStatus(task.status), assignee: task.assignee ?? seededTask?.assignee, issueKey: task.issueKey ?? seededTask?.issueKey ?? `${epic.key.split('-')[0]}-${101 + index}`, storyDetails: task.storyDetails ?? seededTask?.storyDetails }
      }) }
    })
    const weekStatuses = plan.weekStatuses?.filter((status) => !removedCanceledStatuses.has(status.value))
    const validWeekColumnIds = new Set(['draft', 'todo', 'in-progress', 'blocked', 'in-review', 'done', ...(weekStatuses ?? []).map((status) => status.value)])
    const nextWeekColumnOrder = plan.weekColumnOrder ? plan.weekColumnOrder.filter((id) => validWeekColumnIds.has(id)) : ['todo', 'in-progress', 'in-review', 'done', ...(plan.weekStatuses ?? []).map((status) => status.value)]
    const insertColumnAt = (id: string, targetId: string, after = false) => {
      if (nextWeekColumnOrder.includes(id)) return
      const targetIndex = nextWeekColumnOrder.indexOf(targetId)
      nextWeekColumnOrder.splice(targetIndex < 0 ? nextWeekColumnOrder.length : targetIndex + (after ? 1 : 0), 0, id)
    }
    insertColumnAt('draft', 'todo')
    insertColumnAt('blocked', 'in-progress', true)
    return {
      department,
      allProjects: projects,
      plan: { ...plan, projects: projects.filter((project) => project.departments?.includes(department)), weekStatuses, weekColumnOrder: nextWeekColumnOrder, dismissedSuggestions: plan.dismissedSuggestions ?? [], resolvedSuggestions: plan.resolvedSuggestions ?? [] },
      theme: persisted.themePreferenceSet ? persisted.theme ?? 'dark' : 'dark', themePreferenceSet: persisted.themePreferenceSet ?? false,
      view: persisted.view ?? 'timeline', calendarScale: persisted.calendarScale ?? 'week',
      history: (persisted.history ?? []).map(normalizePlanTaskStatuses), future: (persisted.future ?? []).map(normalizePlanTaskStatuses), historyEntries: persisted.historyEntries ?? [], selectedProject: persisted.selectedProject ?? null,
      timelineProjectFilter: persisted.timelineProjectFilter ?? (persisted.selectedProject ? [persisted.selectedProject] : null),
    }
  },
}))
