import { format } from 'date-fns'
import type { Project, ProjectEpic, ProjectEpicAttachment } from './types'
import { isTaskClosed } from './taskStatus'

export interface EpicReviewSource {
  id: string
  category: 'Company research' | 'Company strategy' | 'Company delivery' | 'Workspace plan' | 'External reference' | 'Epic attachment'
  title: string
  updatedAt: string
  excerpt: string
  url?: string
}

export type EpicReviewField = 'problem' | 'outcome' | 'requirements'

export interface EpicReviewSuggestion {
  id: string
  aspect: string
  title: string
  finding: string
  suggestion: string
  targetField: EpicReviewField
  targetLabel: string
  why: string
  sourceIds: string[]
  confidence: number
}

export interface EpicReviewResult {
  reviewedAt: string
  contextKey: string
  sources: EpicReviewSource[]
  suggestions: EpicReviewSuggestion[]
}

const companySourceLibrary: Record<string, [EpicReviewSource, EpicReviewSource, EpicReviewSource]> = {
  northstar: [
    { id: 'northstar-interviews', category: 'Company research', title: 'Onboarding interviews · research readout', updatedAt: '2026-10-21', excerpt: '4 of 6 participants asked for help before reaching the first setup milestone.' },
    { id: 'northstar-activation', category: 'Company strategy', title: 'Activation strategy · Q4', updatedAt: '2026-10-18', excerpt: 'Target first-session activation of 55%, improving the current 42% baseline.' },
    { id: 'northstar-identity', category: 'Company delivery', title: 'Identity migration · engineering note', updatedAt: '2026-10-20', excerpt: 'Guided setup must work with the identity migration planned before public release.' },
  ],
  fieldnotes: [
    { id: 'fieldnotes-readers', category: 'Company research', title: 'Reader interviews · issue one', updatedAt: '2026-10-19', excerpt: 'Readers want context about how observations became the published story.' },
    { id: 'fieldnotes-editorial', category: 'Company strategy', title: 'Editorial principles · fall', updatedAt: '2026-10-16', excerpt: 'The first issue should be readable in a single sitting and include clear source attribution.' },
    { id: 'fieldnotes-platform', category: 'Company delivery', title: 'Publishing checklist · web', updatedAt: '2026-10-17', excerpt: 'Long-form pages need responsive reading layouts and accessible image descriptions.' },
  ],
  career: [
    { id: 'career-hiring', category: 'Company research', title: 'Hiring panel feedback · portfolio', updatedAt: '2026-10-22', excerpt: 'Reviewers look for a clear personal contribution and evidence of measurable outcomes.' },
    { id: 'career-positioning', category: 'Company strategy', title: 'Design role profile · target roles', updatedAt: '2026-10-18', excerpt: 'Target roles emphasize product thinking, collaboration, and shipped work.' },
    { id: 'career-sharing', category: 'Company delivery', title: 'Portfolio publishing checklist', updatedAt: '2026-10-20', excerpt: 'Case studies should be concise, accessible, and ready to share before outreach begins.' },
  ],
  garden: [
    { id: 'garden-volunteers', category: 'Company research', title: 'Volunteer feedback · spring events', updatedAt: '2026-10-15', excerpt: 'Volunteers need to know where to arrive, who to ask for help, and what to bring.' },
    { id: 'garden-community', category: 'Company strategy', title: 'Community program goals · spring', updatedAt: '2026-10-14', excerpt: 'The event should make it easy for first-time volunteers to take part.' },
    { id: 'garden-safety', category: 'Company delivery', title: 'Event operations checklist', updatedAt: '2026-10-17', excerpt: 'Confirm tools, safety guidance, accessibility needs, and day-of ownership.' },
  ],
  learning: [
    { id: 'motion-learners', category: 'Company research', title: 'Learning guild pulse · October', updatedAt: '2026-10-20', excerpt: 'Short weekly goals make it easier for members to maintain a creative practice.' },
    { id: 'motion-goals', category: 'Company strategy', title: 'Craft growth themes · Q4', updatedAt: '2026-10-16', excerpt: 'Share one finished experiment and one learning each week.' },
    { id: 'motion-review', category: 'Company delivery', title: 'Peer critique format', updatedAt: '2026-10-18', excerpt: 'Each study should include a question for review and a note about what changed.' },
  ],
}

const externalSources: EpicReviewSource[] = [
  { id: 'external-jira-epics', category: 'External reference', title: 'Learn to use epics · Atlassian', updatedAt: '2026-10-25', excerpt: 'Atlassian describes epics as a way to group related stories, bugs, and tasks under a larger body of work.', url: 'https://www.atlassian.com/agile/tutorials/epics/' },
  { id: 'external-definition-done', category: 'External reference', title: 'Definition of Done · Atlassian', updatedAt: '2026-10-25', excerpt: 'A shared Definition of Done gives teams a consistent quality bar for completed work.', url: 'https://www.atlassian.com/agile/project-management/definition-of-done' },
]

function defaultSources(project: Project): [EpicReviewSource, EpicReviewSource, EpicReviewSource] {
  return [
    { id: `${project.id}-research`, category: 'Company research', title: 'Customer and stakeholder notes', updatedAt: '2026-10-20', excerpt: `Review the user need and evidence behind ${project.name}.` },
    { id: `${project.id}-strategy`, category: 'Company strategy', title: 'Quarterly priorities', updatedAt: '2026-10-18', excerpt: `Align ${project.name} with the intended project outcome and measures of success.` },
    { id: `${project.id}-delivery`, category: 'Company delivery', title: 'Delivery readiness checklist', updatedAt: '2026-10-19', excerpt: 'Confirm ownership, dependencies, and acceptance criteria before delivery.' },
  ]
}

function attachmentSource(attachment: ProjectEpicAttachment): EpicReviewSource {
  return {
    id: `attachment-${attachment.id}`,
    category: 'Epic attachment',
    title: attachment.name,
    updatedAt: format(new Date(attachment.addedAt), 'yyyy-MM-dd'),
    excerpt: attachment.kind === 'link'
      ? `Linked reference: ${attachment.url ?? 'No URL added'}. Its page content is not imported into this review.`
      : attachment.kind === 'document'
        ? `Document attached: ${attachment.name}${attachment.size ? ` (${Math.round(attachment.size / 1024)} KB)` : ''}. Its contents are not extracted for this review.`
        : `Image attachment: ${attachment.name}. Open it from Attachments to review visual details.`,
    url: attachment.kind === 'link' ? attachment.url : undefined,
  }
}

export function epicReviewContextKey(project: Project, epic: NonNullable<Project['epic']>) {
  return JSON.stringify({ id: project.id, name: project.name, summary: project.summary, startDate: project.startDate, deadline: project.deadline, priority: project.priority, status: project.status, stage: project.stage, deadlineType: project.deadlineType, tasks: project.tasks.map(({ id, title, assignee, estimatedHours, startDate, dueDate, status, dependencies, storyDetails }) => ({ id, title, assignee, estimatedHours, startDate, dueDate, status, dependencies, storyDetails })), prd: epic.prd, additionalContext: epic.additionalContext ?? '', sections: epic.sections ?? [], attachments: epic.attachments ?? [], dismissed: epic.dismissedReviewChanges ?? [], accepted: epic.acceptedReviewSuggestions ?? [] })
}

export function generateEpicReview(project: Project, epic: ProjectEpic, reviewedAt = new Date()): EpicReviewResult {
  const companySources = companySourceLibrary[project.id] ?? defaultSources(project)
  const [research, strategy, delivery] = companySources
  const remainingTasks = project.tasks.filter((task) => !isTaskClosed(task.status))
  const remainingHours = remainingTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
  const planSource: EpicReviewSource = {
    id: `plan-${project.id}`,
    category: 'Workspace plan',
    title: `${project.name} · milestones and delivery plan`,
    updatedAt: format(reviewedAt, 'yyyy-MM-dd'),
    excerpt: `${project.priority} priority · ${project.deadlineType} deadline · ${remainingTasks.length} open tasks · ${remainingHours}h estimated work remaining.`,
  }
  const sources = [...companySources, planSource, ...externalSources, ...(epic.attachments ?? []).map(attachmentSource)]
  const prefix = project.id === 'northstar' ? 'first-session setup' : project.id === 'fieldnotes' ? 'the first issue' : project.id === 'career' ? 'the portfolio case study' : project.id === 'garden' ? 'the volunteer day' : project.id === 'learning' ? 'the weekly practice' : 'the intended outcome'
  const reviewSuggestions: EpicReviewSuggestion[] = [
    { id: `${project.id}:research-gap`, aspect: 'User evidence', title: 'Turn the user signal into a validation check', finding: research.excerpt, suggestion: `Add a check that validates ${prefix} with the people described in the research.`, targetField: 'requirements', targetLabel: 'Requirements', why: 'The research identifies a specific need, but the epic does not yet say how the team will verify it is addressed.', sourceIds: [research.id], confidence: 0.9 },
    { id: `${project.id}:success-measure`, aspect: 'Success measure', title: 'Make success observable', finding: `${strategy.excerpt} ${planSource.excerpt}`, suggestion: `Define how the team will measure success for ${project.name} and when the result will be reviewed.`, targetField: 'outcome', targetLabel: 'Desired outcome', why: 'A measurable signal helps the team distinguish delivery completion from achieving the intended outcome.', sourceIds: [strategy.id, planSource.id], confidence: 0.86 },
    { id: `${project.id}:delivery-guardrail`, aspect: 'Delivery risk', title: 'Call out a delivery dependency', finding: delivery.excerpt, suggestion: `Confirm the delivery constraint in “${delivery.title}” is accounted for before the related work is marked complete.`, targetField: 'requirements', targetLabel: 'Requirements', why: 'Naming the constraint in the epic makes it easier for the team to plan around it and validate readiness.', sourceIds: [delivery.id], confidence: 0.82 },
    { id: `${project.id}:acceptance-criteria`, aspect: 'Acceptance criteria', title: 'Check the child work has clear completion criteria', finding: externalSources[1].excerpt, suggestion: 'Add a shared completion check so each child task has a reviewable outcome and the team knows when it is done.', targetField: 'requirements', targetLabel: 'Requirements', why: 'A consistent completion bar can surface missing quality, accessibility, or handoff checks before work is considered complete.', sourceIds: [externalSources[0].id, externalSources[1].id], confidence: 0.78 },
  ]
  const dismissed = new Set(epic.dismissedReviewChanges ?? [])
  const accepted = new Set(epic.acceptedReviewSuggestions ?? [])
  const existingText = [epic.prd.problem, epic.prd.outcome, ...epic.prd.requirements, epic.additionalContext ?? '', ...(epic.sections ?? []).flatMap((section) => [section.title, section.content])].join('\n').toLowerCase()
  const suggestions = reviewSuggestions.filter((item) => !dismissed.has(item.id) && !accepted.has(item.id) && !existingText.includes(item.suggestion.toLowerCase()))
  return { reviewedAt: reviewedAt.toISOString(), contextKey: epicReviewContextKey(project, epic), sources, suggestions }
}
