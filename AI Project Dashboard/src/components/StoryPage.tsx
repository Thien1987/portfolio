import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Clock3, Plus, Save, Trash2, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ProjectCode } from '@/components/ProjectCode'
import { useWorkspace } from '@/lib/store'
import { getTaskStatus, TASK_STATUSES } from '@/lib/taskStatus'
import { getEpicKey } from '@/lib/projectKey'
import { getTaskAssigneeRole } from '@/lib/teamAssignment'
import { TeamAssigneeCombobox } from '@/components/TeamAssigneeCombobox'
import type { Project, StoryDetails, Task, TaskAssigneeRole } from '@/lib/types'

type StoryDraft = {
  title: string
  assignee: string
  assigneeRole: TaskAssigneeRole | ''
  status: Task['status']
  estimatedHours: string
  startDate: string
  dueDate: string
  intent: string
  designBreakdown: string
  engineeringBreakdown: string
  acceptanceCriteria: string
  additionalContext: string
  sections: NonNullable<StoryDetails['sections']>
}

function makeDraft(task: Task, project: Project): StoryDraft {
  const details = task.storyDetails
  return {
    title: task.title,
    assignee: task.assignee ?? '',
    assigneeRole: getTaskAssigneeRole(task, project) ?? '',
    status: task.status,
    estimatedHours: String(task.estimatedHours),
    startDate: task.startDate,
    dueDate: task.dueDate,
    intent: details?.intent ?? task.description ?? '',
    designBreakdown: details?.designBreakdown ?? '',
    engineeringBreakdown: details?.engineeringBreakdown ?? '',
    acceptanceCriteria: details?.acceptanceCriteria.join('\n') ?? '',
    additionalContext: details?.additionalContext ?? '',
    sections: structuredClone(details?.sections ?? []),
  }
}

function detailsFromDraft(draft: StoryDraft): StoryDetails {
  return {
    intent: draft.intent.trim(),
    designBreakdown: draft.designBreakdown.trim(),
    engineeringBreakdown: draft.engineeringBreakdown.trim(),
    acceptanceCriteria: draft.acceptanceCriteria.split('\n').map((item) => item.trim()).filter(Boolean),
    additionalContext: draft.additionalContext.trim(),
    sections: draft.sections.map((section) => ({ ...section, title: section.title.trim(), content: section.content.trim() })).filter((section) => section.title || section.content),
  }
}

export function StoryPage({ project, task, onBack, onDirtyChange }: { project: Project; task: Task; onBack: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const updateTask = useWorkspace((state) => state.updateTask)
  const [draft, setDraft] = useState(() => makeDraft(task, project))
  const [message, setMessage] = useState('')
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const baseline = useMemo(() => makeDraft(task, project), [task, project])
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline)
  const status = getTaskStatus(draft.status)

  useEffect(() => { setDraft(makeDraft(task, project)); setMessage('') }, [task.id])
  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])

  const update = <K extends keyof StoryDraft>(key: K, value: StoryDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const back = () => {
    if (isDirty) { setLeaveDialogOpen(true); return }
    onBack()
  }
  const save = () => {
    const title = draft.title.trim()
    if (!title) return
    updateTask(task.id, {
      title,
      description: draft.intent.trim() || undefined,
      assignee: draft.assignee.trim() || undefined,
      assigneeRole: draft.assignee.trim() ? draft.assigneeRole || undefined : undefined,
      status: draft.status,
      estimatedHours: Math.max(0.5, Number(draft.estimatedHours) || 1),
      startDate: draft.startDate,
      dueDate: draft.dueDate < draft.startDate ? draft.startDate : draft.dueDate,
      storyDetails: detailsFromDraft(draft),
    })
    setMessage('Story details saved.')
    window.setTimeout(() => setMessage(''), 2600)
  }

  const addSection = () => update('sections', [...draft.sections, { id: crypto.randomUUID(), title: '', content: '' }])
  const setSection = (id: string, key: 'title' | 'content', value: string) => update('sections', draft.sections.map((section) => section.id === id ? { ...section, [key]: value } : section))

  return <main className="epic-page story-page">
    <div className="epic-page-topbar"><Button variant="outline" className="epic-back-button" onClick={back}><ArrowLeft size={15} /> Back to {project.name}</Button><div className="epic-page-actions">{message && <span role="status" className="epic-save-message">{message}</span>}<Button onClick={save} disabled={!isDirty || !draft.title.trim()}><Save size={15} /> Save changes</Button></div></div>
    <header className="epic-page-heading story-page-heading">
      <div className="epic-page-icon"><Check size={20} /></div>
      <div className="epic-page-heading-copy"><div className="epic-page-overline">STORY · {task.issueKey ?? `${getEpicKey(project).split('-')[0]}-101`}</div><div className="epic-page-title-row"><input aria-label="Story title" className="story-title-input" value={draft.title} onChange={(event) => update('title', event.target.value)} /><ProjectCode code={getEpicKey(project)} /></div><p>Break down the design and engineering work, and agree what done means.</p></div>
      <label className="epic-project-stage-control"><span>Workflow stage</span><select value={draft.status} onChange={(event) => update('status', event.target.value as Task['status'])}>{TASK_STATUSES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      <span className={`epic-page-status status-${status.category}`}>{status.label}</span>
    </header>
    <div className="story-page-layout">
      <div className="story-page-main">
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Story intent</h2><p>Describe the user need or outcome this piece of work should deliver.</p></div></div>
          <label className="epic-page-field"><span>What this story needs to accomplish</span><textarea rows={4} value={draft.intent} onChange={(event) => update('intent', event.target.value)} placeholder="As a… I need… so that…" /></label>
        </section>
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Team breakdown</h2><p>Make the design and implementation work visible before the story moves forward.</p></div></div>
          <label className="epic-page-field story-breakdown-field"><span>Design team</span><textarea rows={5} value={draft.designBreakdown} onChange={(event) => update('designBreakdown', event.target.value)} placeholder="Flows, screens, content, interaction states, accessibility, and research or validation needed…" /></label>
          <label className="epic-page-field story-breakdown-field"><span>Engineering team</span><textarea rows={5} value={draft.engineeringBreakdown} onChange={(event) => update('engineeringBreakdown', event.target.value)} placeholder="Implementation steps, dependencies, data or API needs, edge cases, and testing…" /></label>
        </section>
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Acceptance criteria</h2><p>One check per line, written so the team can verify when the story is complete.</p></div></div>
          <label className="epic-page-field"><span>Completion checks</span><textarea rows={5} value={draft.acceptanceCriteria} onChange={(event) => update('acceptanceCriteria', event.target.value)} placeholder={'A user can complete the primary flow…\nThe experience works with keyboard navigation…'} /></label>
        </section>
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Clock3 size={16} /></span><div><h2>Planning details</h2><p>Keep ownership, delivery stage, and schedule linked to this story.</p></div></div>
          <div className="story-planning-grid">
            <label className="epic-page-field"><span>Assignee · Designer or Developer</span><TeamAssigneeCombobox project={project} id={`story-assignee-${task.id}`} value={draft.assignee} role={draft.assigneeRole} onChange={(name, memberRole) => { update('assignee', name); update('assigneeRole', memberRole) }} /></label>
            <label className="epic-page-field"><span>Estimated effort · hours</span><input type="number" min="0.5" step="0.5" value={draft.estimatedHours} onChange={(event) => update('estimatedHours', event.target.value)} /></label>
            <label className="epic-page-field"><span>Starts</span><input type="date" value={draft.startDate} max={draft.dueDate} onChange={(event) => update('startDate', event.target.value)} /></label>
            <label className="epic-page-field"><span>Due date</span><input type="date" value={draft.dueDate} min={draft.startDate} onChange={(event) => update('dueDate', event.target.value)} /></label>
          </div>
          <p className="story-parent-link">Part of <strong>{project.name}</strong> · <ProjectCode code={getEpicKey(project)} /> · {format(parseISO(project.deadline), 'MMM d, yyyy')} project deadline</p>
        </section>
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Additional context</h2><p>Capture constraints, decisions, and open questions specific to this story.</p></div></div>
          <label className="epic-page-field"><span>Notes</span><textarea rows={4} value={draft.additionalContext} onChange={(event) => update('additionalContext', event.target.value)} placeholder="Add any context the team should know…" /></label>
          <div className="epic-custom-sections story-custom-sections"><div className="epic-custom-sections-heading"><div><strong>More sections</strong><span>Create custom headings for story-specific details.</span></div><Button type="button" variant="outline" size="sm" onClick={addSection}><Plus size={13} /> Add section</Button></div>
            {draft.sections.map((section) => <article className="epic-custom-section" key={section.id}><div className="epic-custom-section-fields"><label className="epic-page-field"><span>Section title</span><input value={section.title} placeholder="e.g. Out of scope" onChange={(event) => setSection(section.id, 'title', event.target.value)} /></label><label className="epic-page-field"><span>Details</span><textarea rows={4} value={section.content} placeholder="Write the story-specific details…" onChange={(event) => setSection(section.id, 'content', event.target.value)} /></label></div><button type="button" className="epic-custom-section-remove" aria-label={`Remove ${section.title || 'untitled'} section`} onClick={() => update('sections', draft.sections.filter((item) => item.id !== section.id))}><Trash2 size={14} /></button></article>)}
          </div>
        </section>
      </div>
      <aside className="story-page-rail"><section className="epic-page-section"><div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Epic context</h2><p>This story contributes to the project outcome.</p></div></div><strong className="story-epic-name">{project.name}</strong><p className="story-epic-summary">{project.epic?.prd.outcome ?? project.summary}</p><div className="story-epic-meta"><span>Owner</span><strong>{project.epic?.team.pm ?? 'Unassigned'}</strong><span>Designer</span><strong>{project.epic?.team.designer ?? 'Unassigned'}</strong><span>Engineers</span><strong>{project.epic?.team.developers.length ? project.epic.team.developers.join(', ') : 'Unassigned'}</strong></div></section></aside>
    </div>
    {isDirty && <div className="epic-page-bottom-save"><span>Unsaved story changes</span><Button onClick={save}><Save size={14} /> Save changes</Button></div>}
    <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}><DialogContent className="modal-card leave-ticket-dialog" showCloseButton={false}><div className="modal-title"><div className="modal-mark leave-ticket-mark"><X size={17} /></div><div><DialogTitle className="modal-heading">Leave without saving?</DialogTitle><DialogDescription className="modal-description">Your changes to this story will be lost.</DialogDescription></div><button className="icon-button" onClick={() => setLeaveDialogOpen(false)} aria-label="Stay on this story"><X size={16} /></button></div><div className="modal-actions"><Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Stay on story</Button><Button variant="destructive" onClick={onBack}>Discard changes and leave</Button></div></DialogContent></Dialog>
  </main>
}
