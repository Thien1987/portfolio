export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type ProjectStatus = 'on-track' | 'at-risk' | 'paused' | 'complete'
export type ProjectStage = 'discovery' | 'planning' | 'execution' | 'monitoring' | 'closure'
export type SteeringLevel = 'quiet' | 'balanced' | 'proactive'
export type WorkspaceView = 'timeline' | 'board' | 'week'
export type CalendarScale = 'day' | 'week' | 'month' | 'quarter' | 'half-year' | 'year'
export type TaskStatus = 'draft' | 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done' | (string & {})
export type TaskAssigneeRole = 'designer' | 'developer'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  assignee?: string
  assigneeRole?: TaskAssigneeRole
  estimatedHours: number
  startDate: string
  dueDate: string
  status: TaskStatus
  dependencies: string[]
  vague?: boolean
  issueKey?: string
  storyDetails?: StoryDetails
}

export interface StoryDetails {
  intent: string
  designBreakdown: string
  engineeringBreakdown: string
  acceptanceCriteria: string[]
  additionalContext?: string
  sections?: { id: string; title: string; content: string }[]
}

export interface ProjectEpicAttachment {
  id: string
  kind: 'image' | 'link' | 'document'
  name: string
  url?: string
  mimeType?: string
  size?: number
  addedAt: string
}

export interface ProjectEpic {
  key: string
  prd: { problem: string; outcome: string; requirements: string[] }
  additionalContext?: string
  sections?: { id: string; title: string; content: string }[]
  team: { pm: string; designer: string; developers: string[] }
  attachments?: ProjectEpicAttachment[]
  dismissedReviewChanges?: string[]
  acceptedReviewSuggestions?: string[]
}

export interface Project {
  id: string
  departments?: string[]
  name: string
  summary: string
  color: string
  startDate?: string
  deadline: string
  priority: Priority
  status: ProjectStatus
  stage?: ProjectStage
  deadlineType: 'hard' | 'flexible'
  tasks: Task[]
  epic?: ProjectEpic
}

export interface SteeringSettings {
  weeklyCapacity: number
  protectFocus: boolean
  proactivity: SteeringLevel
  includedPriorities: Priority[]
}

export interface Plan {
  projects: Project[]
  steering: SteeringSettings
  weekStatuses?: { value: string; label: string }[]
  weekColumnOrder?: string[]
  dismissedSuggestions: string[]
  resolvedSuggestions: string[]
}

export interface HistoryEntry {
  label: string
  at: string
}

export type SuggestionType = 'overload' | 'slipping' | 'next-task' | 'breakdown' | 'priority'

export type ProposedChange =
  | { kind: 'reschedule'; taskId: string; startDate: string; dueDate: string }
  | { kind: 'set-status'; projectId: string; status: ProjectStatus }
  | { kind: 'set-priority'; projectId: string; priority: Priority }
  | { kind: 'add-subtasks'; projectId: string; parentTaskId: string; tasks: Omit<Task, 'projectId'>[] }
  | { kind: 'mark-next'; taskId: string }

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  reason: string
  confidence: number
  target: { projectId?: string; taskId?: string }
  change: ProposedChange
  conflictGroup?: string
}
