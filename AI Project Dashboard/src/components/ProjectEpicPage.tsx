import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, Circle, Download, ExternalLink, FileText, ImagePlus, Link2, LoaderCircle, Paperclip, Plus, Save, Sparkles, Trash2, Users, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ProjectCode } from '@/components/ProjectCode'
import { AddStoryDialog } from '@/components/AddStoryDialog'
import { TeamAssigneeCombobox } from '@/components/TeamAssigneeCombobox'
import { useWorkspace } from '@/lib/store'
import { getTaskStatus, TASK_STATUSES } from '@/lib/taskStatus'
import { deleteEpicAsset, loadEpicAsset, saveEpicAsset } from '@/lib/epicAttachments'
import { epicReviewContextKey, generateEpicReview, type EpicReviewResult, type EpicReviewSuggestion } from '@/lib/epicReview'
import { getProjectStage, PROJECT_STAGES } from '@/lib/projectStage'
import { getTaskAssigneeRole } from '@/lib/teamAssignment'
import { getProjectQuarterValue, getProjectStartDate, getQuarterStartDate } from '@/lib/projectSchedule'
import type { Project, ProjectEpic, ProjectEpicAttachment, ProjectStage } from '@/lib/types'

const reviewPause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function fallbackEpic(project: Project): ProjectEpic {
  return project.epic ?? {
    key: `MARG-${project.id.replace(/\D/g, '').slice(-4) || '101'}`,
    prd: { problem: project.summary, outcome: 'Deliver the outcome described in this project plan.', requirements: ['Confirm scope with the project team', 'Track delivery through linked stories'] },
    team: { pm: 'Unassigned', designer: 'Unassigned', developers: [] },
  }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getQuarterOptions(startDate: string) {
  const currentYear = new Date().getFullYear()
  const selectedYear = Number(startDate.slice(0, 4))
  const years = Array.from({ length: 7 }, (_, index) => currentYear - 2 + index)
  if (!years.includes(selectedYear)) years.push(selectedYear)
  return years.sort((left, right) => left - right).flatMap((year) => [1, 2, 3, 4].map((quarter) => ({ value: `${year}-Q${quarter}`, label: `Q${quarter} · ${year}` })))
}

export function ProjectEpicPage({ project, onBack, onOpenStory, onDirtyChange }: { project: Project; onBack: () => void; onOpenStory: (taskId: string) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const updateProject = useWorkspace((state) => state.updateProject)
  const deleteProject = useWorkspace((state) => state.deleteProject)
  const updateTask = useWorkspace((state) => state.updateTask)
  const changeTaskStatus = useWorkspace((state) => state.changeTaskStatus)
  const baseEpic = fallbackEpic(project)
  const baseSchedule = { startDate: getProjectStartDate(project), deadline: project.deadline, deadlineType: project.deadlineType }
  const [draft, setDraft] = useState<ProjectEpic>(() => structuredClone(baseEpic))
  const [scheduleDraft, setScheduleDraft] = useState(() => ({ ...baseSchedule }))
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [message, setMessage] = useState('')
  const [saveToast, setSaveToast] = useState(false)
  const [review, setReview] = useState<EpicReviewResult | null>(null)
  const [selectedSource, setSelectedSource] = useState<EpicReviewResult['sources'][number] | null>(null)
  const [addingStory, setAddingStory] = useState(false)
  const [processing, setProcessing] = useState<{ result: EpicReviewResult; completed: string[]; currentSourceId: string | null; phase: 'Reviewing sources' | 'Comparing evidence' } | null>(null)
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({})
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [savingImages, setSavingImages] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const attachments = draft.attachments ?? []
  const attachmentKey = attachments.map((item) => item.id).join('|')
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseEpic) || JSON.stringify(scheduleDraft) !== JSON.stringify(baseSchedule)
  const reviewIsStale = Boolean(review && review.contextKey !== epicReviewContextKey(project, draft))

  useEffect(() => {
    if (!saveToast) return
    const timeout = window.setTimeout(() => setSaveToast(false), 3800)
    return () => window.clearTimeout(timeout)
  }, [saveToast])

  useEffect(() => {
    let cancelled = false
    const urls: string[] = []
    const load = async () => {
      const pairs = await Promise.all(attachments.filter((item) => item.kind !== 'link').map(async (item) => {
        try {
          const blob = await loadEpicAsset(item.id)
          if (!blob) return [item.id, ''] as const
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return [item.id, url] as const
        } catch {
          return [item.id, ''] as const
        }
      }))
      if (!cancelled) setImageUrls(Object.fromEntries(pairs))
      else urls.forEach(URL.revokeObjectURL)
    }
    void load()
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL) }
  // attachmentKey keeps previews stable while unrelated PRD fields are edited.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, attachmentKey])

  const updateTeam = (key: 'pm' | 'designer', value: string) => setDraft((current) => ({ ...current, team: { ...current.team, [key]: value } }))
  const updateDevelopers = (value: string) => setDraft((current) => ({ ...current, team: { ...current.team, developers: value.split('\n').map((name) => name.trim()).filter(Boolean) } }))
  const updateStartDate = (startDate: string) => setScheduleDraft((current) => ({ ...current, startDate, deadline: current.deadline < startDate ? startDate : current.deadline }))
  const updateDeadline = (deadline: string) => setScheduleDraft((current) => ({ ...current, deadline: deadline < current.startDate ? current.startDate : deadline }))

  const save = async () => {
    updateProject(project.id, { epic: draft, startDate: scheduleDraft.startDate, deadline: scheduleDraft.deadline, deadlineType: scheduleDraft.deadlineType })
    setMessage('')
    setSaveToast(true)
  }

  const runReview = async () => {
    const result = generateEpicReview(project, draft)
    setReview(null)
    setReviewDrafts(Object.fromEntries(result.suggestions.map((suggestion) => [suggestion.id, suggestion.suggestion])))
    setAcceptedSuggestions([])
    setProcessing({ result, completed: [], currentSourceId: null, phase: 'Reviewing sources' })
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const pause = reducedMotion ? 40 : 280
    for (const source of result.sources) {
      setProcessing((current) => current ? { ...current, currentSourceId: source.id } : current)
      await reviewPause(pause)
      setProcessing((current) => current ? { ...current, completed: [...current.completed, source.id], currentSourceId: null } : current)
      await reviewPause(reducedMotion ? 20 : 75)
    }
    setProcessing((current) => current ? { ...current, phase: 'Comparing evidence' } : current)
    await reviewPause(reducedMotion ? 80 : 420)
    setProcessing(null)
    setReview(result)
    setMessage(result.suggestions.length ? `Review complete · ${result.suggestions.length} suggestions to consider` : 'Review complete · no new considerations found')
  }

  const dismissSuggestion = (suggestion: EpicReviewSuggestion) => {
    const dismissedReviewChanges = [...new Set([...(draft.dismissedReviewChanges ?? []), suggestion.id])]
    const nextEpic = { ...draft, dismissedReviewChanges }
    setDraft(nextEpic)
    updateProject(project.id, { epic: { ...baseEpic, dismissedReviewChanges } })
    setReview((current) => current ? { ...current, contextKey: epicReviewContextKey(project, nextEpic) } : current)
    setMessage('Suggestion dismissed. It won’t be raised again for this epic.')
  }

  const agreeSuggestion = (suggestion: EpicReviewSuggestion) => {
    if (reviewIsStale) return
    const text = (reviewDrafts[suggestion.id] ?? suggestion.suggestion).trim()
    if (!text) return
    const acceptedReviewSuggestions = [...new Set([...(draft.acceptedReviewSuggestions ?? []), suggestion.id])]
    const prd = { ...draft.prd }
    if (suggestion.targetField === 'problem') prd.problem = `${prd.problem.trim()}\n\n${text}`.trim()
    if (suggestion.targetField === 'outcome') prd.outcome = `${prd.outcome.trim()}\n\n${text}`.trim()
    if (suggestion.targetField === 'requirements' && !prd.requirements.some((item) => item.toLowerCase() === text.toLowerCase())) prd.requirements = [...prd.requirements, text]
    const nextEpic = { ...draft, prd, acceptedReviewSuggestions }
    setDraft(nextEpic)
    updateProject(project.id, { epic: nextEpic })
    setReview((current) => current ? { ...current, contextKey: epicReviewContextKey(project, nextEpic) } : current)
    setAcceptedSuggestions((current) => [...new Set([...current, suggestion.id])])
    setMessage(`Suggestion added to ${suggestion.targetLabel}.`)
  }

  const discardNewImages = async () => {
    const existingIds = new Set((baseEpic.attachments ?? []).map((item) => item.id))
    await Promise.all(attachments.filter((item) => item.kind !== 'link' && !existingIds.has(item.id)).map((item) => deleteEpicAsset(item.id).catch(() => undefined)))
  }

  const back = () => {
    if (isDirty || pendingReviewCount > 0) { setLeaveDialogOpen(true); return }
    onBack()
  }
  const discardAndLeave = async () => {
    if (isDirty) await discardNewImages()
    setLeaveDialogOpen(false)
    onBack()
  }

  const addLink = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = linkUrl.trim()
    let parsed: URL
    try { parsed = new URL(trimmed) } catch { setMessage('Enter a valid link starting with https://'); return }
    if (!['http:', 'https:'].includes(parsed.protocol)) { setMessage('Only web links starting with http:// or https:// are supported.'); return }
    const item: ProjectEpicAttachment = { id: crypto.randomUUID(), kind: 'link', name: linkName.trim() || parsed.hostname, url: parsed.toString(), addedAt: new Date().toISOString() }
    setDraft((current) => ({ ...current, attachments: [...(current.attachments ?? []), item] }))
    setLinkName(''); setLinkUrl(''); setMessage('Link added. Save epic changes to attach it to this ticket.')
  }

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return
    setSavingImages(true); setMessage('')
    const added: ProjectEpicAttachment[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { setMessage(`${file.name} is not an image file.`); continue }
      if (file.size > 15 * 1024 * 1024) { setMessage(`${file.name} is larger than 15 MB. Choose a smaller image.`); continue }
      const id = crypto.randomUUID()
      try {
        await saveEpicAsset(id, file)
        added.push({ id, kind: 'image', name: file.name, addedAt: new Date().toISOString() })
      } catch { setMessage(`Couldn't store ${file.name} in this browser.`) }
    }
    if (added.length) {
      setDraft((current) => ({ ...current, attachments: [...(current.attachments ?? []), ...added] }))
      setMessage(`${added.length} picture${added.length === 1 ? '' : 's'} added. Save epic changes to attach them to this ticket.`)
    }
    setSavingImages(false)
  }

  const addDocuments = async (files: FileList | null) => {
    if (!files?.length) return
    setSavingImages(true); setMessage('')
    const added: ProjectEpicAttachment[] = []
    const allowed = /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv)$/i
    for (const file of Array.from(files)) {
      if (!allowed.test(file.name)) { setMessage(`${file.name} is not a supported document type.`); continue }
      if (file.size > 15 * 1024 * 1024) { setMessage(`${file.name} is larger than 15 MB. Choose a smaller file.`); continue }
      const id = crypto.randomUUID()
      try {
        await saveEpicAsset(id, file)
        added.push({ id, kind: 'document', name: file.name, mimeType: file.type || undefined, size: file.size, addedAt: new Date().toISOString() })
      } catch { setMessage(`Couldn't store ${file.name} in this browser.`) }
    }
    if (added.length) {
      setDraft((current) => ({ ...current, attachments: [...(current.attachments ?? []), ...added] }))
      setMessage(`${added.length} document${added.length === 1 ? '' : 's'} added. Save epic changes to attach them to this ticket.`)
    }
    setSavingImages(false)
  }

  const removeAttachment = (item: ProjectEpicAttachment) => {
    setDraft((current) => ({ ...current, attachments: (current.attachments ?? []).filter((attachment) => attachment.id !== item.id) }))
    if (item.kind !== 'link' && !(baseEpic.attachments ?? []).some((attachment) => attachment.id === item.id)) void deleteEpicAsset(item.id).catch(() => undefined)
  }
  const saveAndBack = async () => {
    await save()
    onBack()
  }
  const confirmDelete = async () => {
    if (deleting) return
    setDeleting(true)
    const storedAttachments = [...new Map([...(baseEpic.attachments ?? []), ...attachments].map((item) => [item.id, item])).values()]
    await Promise.allSettled(storedAttachments.filter((item) => item.kind !== 'link').map((item) => deleteEpicAsset(item.id)))
    deleteProject(project.id)
    setDeleteDialogOpen(false)
    onBack()
  }

  const addRequirement = (event: FormEvent) => {
    event.preventDefault()
    const text = newRequirement.trim()
    if (!text) return
    setDraft((current) => ({ ...current, prd: { ...current.prd, requirements: [...current.prd.requirements, text] } }))
    setNewRequirement('')
  }

  const taskRows = useMemo(() => project.tasks.map((task, index) => ({ ...task, issueKey: task.issueKey ?? `${baseEpic.key.split('-')[0]}-${101 + index}` })), [project.tasks, baseEpic.key])
  const reviewSourceById = new Map((review?.sources ?? []).map((source) => [source.id, source]))
  const selectedAttachmentId = selectedSource?.id.startsWith('attachment-') ? selectedSource.id.slice('attachment-'.length) : null
  const selectedAttachment = selectedAttachmentId ? attachments.find((item) => item.id === selectedAttachmentId) : undefined
  const dismissedSuggestionIds = new Set(draft.dismissedReviewChanges ?? [])
  const pendingReviewCount = review?.suggestions.filter((suggestion) => !acceptedSuggestions.includes(suggestion.id) && !dismissedSuggestionIds.has(suggestion.id)).length ?? 0

  useEffect(() => { onDirtyChange?.(isDirty || pendingReviewCount > 0) }, [isDirty, pendingReviewCount, onDirtyChange])

  return <main className="epic-page">
    <div className="epic-page-topbar">
      <Button variant="outline" className="epic-back-button" onClick={back}><ArrowLeft size={15} /> Back to workspace</Button>
      <div className="epic-page-actions">{message && <span role="status" className="epic-save-message">{message}</span>}<Button onClick={() => void save()} disabled={!isDirty}><Save size={15} /> Save changes</Button></div>
    </div>
    {saveToast && <div className="epic-save-toast" role="status" aria-live="polite"><CheckCircle2 size={18} /><span><strong>Changes saved</strong><small>Project dates and ticket details are up to date.</small></span><button type="button" aria-label="Dismiss save confirmation" onClick={() => setSaveToast(false)}><X size={15} /></button></div>}
    <header className="epic-page-heading">
      <div className="epic-page-icon"><BookOpen size={20} /></div>
      <div className="epic-page-heading-copy"><div className="epic-page-overline">PROJECT EPIC</div><div className="epic-page-title-row"><h1>{project.name}</h1><ProjectCode code={draft.key} /></div><p>Shape the brief, clarify ownership, and keep linked work together.</p></div>
      <label className="epic-project-stage-control"><span>Project stage</span><select value={getProjectStage(project.stage, project.status)} onChange={(event) => updateProject(project.id, { stage: event.target.value as ProjectStage })}>{PROJECT_STAGES.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select></label>
      <span className={`epic-page-status status-${project.status}`}>Health · {project.status.replace('-', ' ')}</span>
    </header>
    <div className="epic-page-layout">
      <div className="epic-page-main">
        <section className="epic-page-section epic-project-schedule">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><CalendarDays size={16} /></span><div><h2>Project timeline</h2><p>Set the planning quarter, start date, and target delivery date for this project.</p></div></div>
          <div className="project-schedule-grid">
            <label className="epic-page-field"><span>Start quarter</span><select value={getProjectQuarterValue(scheduleDraft.startDate)} onChange={(event) => updateStartDate(getQuarterStartDate(event.target.value))}>{getQuarterOptions(scheduleDraft.startDate).map((quarter) => <option value={quarter.value} key={quarter.value}>{quarter.label}</option>)}</select></label>
            <label className="epic-page-field"><span>Project start date</span><input type="date" value={scheduleDraft.startDate} max={scheduleDraft.deadline} onChange={(event) => updateStartDate(event.target.value)} /></label>
            <label className="epic-page-field"><span>Project due date</span><input type="date" value={scheduleDraft.deadline} min={scheduleDraft.startDate} onChange={(event) => updateDeadline(event.target.value)} /></label>
            <label className="epic-page-field"><span>Deadline commitment</span><select value={scheduleDraft.deadlineType} onChange={(event) => setScheduleDraft((current) => ({ ...current, deadlineType: event.target.value as Project['deadlineType'] }))}><option value="hard">Hard deadline</option><option value="flexible">Flexible deadline</option></select></label>
          </div>
          <p className="project-schedule-note">The quarter follows the start date. Choosing a quarter sets the start date to its first day; you can then adjust the exact date.</p>
        </section>
        <section className="epic-page-section epic-authored-prd">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><BookOpen size={16} /></span><div><h2>Product requirements</h2><p>The brief written by the project owner. Edit it directly; review suggestions never change it without your agreement.</p></div><span className="epic-page-section-tag">{draft.key}</span></div>
          <label className="epic-page-field"><span>Problem</span><textarea value={draft.prd.problem} rows={4} onChange={(event) => setDraft((current) => ({ ...current, prd: { ...current.prd, problem: event.target.value } }))} /></label>
          <label className="epic-page-field"><span>Intended outcome</span><textarea value={draft.prd.outcome} rows={3} onChange={(event) => setDraft((current) => ({ ...current, prd: { ...current.prd, outcome: event.target.value } }))} /></label>
          <div className="epic-prd-requirements"><strong>Requirements</strong><ol>{draft.prd.requirements.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol>
            <form onSubmit={addRequirement}><input aria-label="Add a requirement" value={newRequirement} onChange={(event) => setNewRequirement(event.target.value)} placeholder="Add a requirement" /><Button type="submit" variant="outline" size="sm" disabled={!newRequirement.trim()}><Plus size={13} /> Add</Button></form>
          </div>
          <label className="epic-page-field epic-freeform-context"><span>Additional context <small>Anything useful that doesn’t fit the fields above</small></span><textarea value={draft.additionalContext ?? ''} rows={5} placeholder="Add background, constraints, open questions, decisions, or other details…" onChange={(event) => setDraft((current) => ({ ...current, additionalContext: event.target.value }))} /></label>
          <div className="epic-custom-sections"><div className="epic-custom-sections-heading"><div><strong>More sections</strong><span>Create your own headings and add open text under each.</span></div><Button type="button" variant="outline" size="sm" onClick={() => setDraft((current) => ({ ...current, sections: [...(current.sections ?? []), { id: crypto.randomUUID(), title: '', content: '' }] }))}><Plus size={13} /> Add section</Button></div>
            {(draft.sections ?? []).map((section) => <article className="epic-custom-section" key={section.id}><div className="epic-custom-section-fields"><label className="epic-page-field"><span>Section title</span><input value={section.title} placeholder="e.g. Out of scope" onChange={(event) => setDraft((current) => ({ ...current, sections: (current.sections ?? []).map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) }))} /></label><label className="epic-page-field"><span>Details</span><textarea rows={4} value={section.content} placeholder="Write any detail that belongs in this section…" onChange={(event) => setDraft((current) => ({ ...current, sections: (current.sections ?? []).map((item) => item.id === section.id ? { ...item, content: event.target.value } : item) }))} /></label></div><button type="button" className="epic-custom-section-remove" aria-label={`Remove ${section.title || 'untitled'} section`} title="Remove section" onClick={() => setDraft((current) => ({ ...current, sections: (current.sections ?? []).filter((item) => item.id !== section.id) }))}><Trash2 size={14} /></button></article>)}
          </div>
        </section>
        <section className="epic-page-section epic-ai-review">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon epic-ai-icon"><Sparkles size={16} /></span><div><h2>AI epic review</h2><p>Check the epic against company context and the delivery plan.</p></div><span className="epic-page-section-tag">EVIDENCE REVIEW</span></div>
          <div className="epic-ai-intro"><strong>Your epic stays yours.</strong><span>The agent looks for overlooked considerations across company research, strategy, delivery notes, your project plan, and curated external guidance. It suggests additions for you to review.</span></div>
          <Button className="epic-run-review" onClick={() => void runReview()} disabled={Boolean(processing)}>{processing ? <LoaderCircle className="epic-processing-spin" size={15} /> : <Sparkles size={15} />}{processing ? 'Reviewing sources…' : review ? reviewIsStale ? 'Refresh review' : 'Review again' : 'Review epic'}</Button>
          {processing && <section className="epic-processing-panel" aria-live="polite" aria-label="Epic review progress">
            <div className="epic-processing-heading"><div><strong>{processing.phase}</strong><span>{processing.phase === 'Reviewing sources' ? 'Checking each source against the written brief.' : 'Connecting evidence to possible gaps in the brief.'}</span></div><span>{processing.completed.length} / {processing.result.sources.length}</span></div>
            <div className="epic-processing-track" role="progressbar" aria-label="Sources reviewed" aria-valuemin={0} aria-valuemax={processing.result.sources.length} aria-valuenow={processing.completed.length}><span style={{ width: `${processing.result.sources.length ? processing.completed.length / processing.result.sources.length * 100 : 0}%` }} /></div>
            <div className="epic-processing-sources">{processing.result.sources.map((source) => {
              const status = processing.completed.includes(source.id) ? 'Reviewed' : processing.currentSourceId === source.id ? 'Reviewing' : 'Waiting'
              const StatusIcon = status === 'Reviewed' ? CheckCircle2 : status === 'Reviewing' ? LoaderCircle : Circle
              return <article className={`epic-processing-source ${status === 'Reviewing' ? 'is-current' : ''}`} key={source.id}><StatusIcon size={15} className={status === 'Reviewing' ? 'epic-processing-spin' : ''} /><div><strong>{source.title}</strong><small>{source.category} · {source.excerpt}</small></div><span>{status}</span></article>
            })}</div>
          </section>}
          {review && <div className="epic-review-results" aria-live="polite">
            <div className="epic-review-summary"><span className="epic-review-check"><Check size={14} /></span><div><strong>Review complete</strong><small>{pendingReviewCount} suggestions to review · {review.sources.length} sources checked · {format(new Date(review.reviewedAt), 'MMM d, yyyy · h:mm a')}</small></div><button type="button" className="epic-review-clear" onClick={() => { setReview(null); setReviewDrafts({}) }}>Clear review</button></div>
            {reviewIsStale && <div className="epic-review-stale" role="status"><strong>Plan updated since this review.</strong> Refresh to check the new information before acting on suggestions.</div>}
            {review.suggestions.length ? <div className="epic-review-change-list">{review.suggestions.map((suggestion) => {
              const accepted = acceptedSuggestions.includes(suggestion.id) || (draft.acceptedReviewSuggestions ?? []).includes(suggestion.id)
              const dismissed = dismissedSuggestionIds.has(suggestion.id)
              return <article className={`epic-review-change ${accepted ? 'is-confirmed' : dismissed ? 'is-dismissed' : ''}`} key={suggestion.id}>
                <div className="epic-review-change-head"><div className="epic-suggestion-heading"><span className="epic-suggestion-aspect">{suggestion.aspect}</span><strong>{suggestion.title}</strong></div><span className="epic-confidence">{Math.round(suggestion.confidence * 100)}% confidence</span>{accepted && <span className="epic-confirmed-label"><Check size={12} /> Added to {suggestion.targetLabel}</span>}{dismissed && <span className="epic-dismissed-label">Dismissed</span>}</div>
                <div className="epic-suggestion-finding"><span>WHAT THE AGENT FOUND</span><p>{suggestion.finding}</p></div>
                <label className="epic-suggestion-edit"><span>SUGGESTED ADDITION · EDIT BEFORE AGREEING <small>Will be added to {suggestion.targetLabel.toLowerCase()}.</small></span><textarea rows={3} value={reviewDrafts[suggestion.id] ?? suggestion.suggestion} disabled={accepted || dismissed || reviewIsStale} onChange={(event) => setReviewDrafts((current) => ({ ...current, [suggestion.id]: event.target.value }))} /></label>
                <p className="epic-change-reason"><strong>Why consider it?</strong> {suggestion.why}</p>
                <div className="epic-change-sources"><span>Source:</span>{suggestion.sourceIds.map((id) => { const source = reviewSourceById.get(id); return source ? <button type="button" key={id} onClick={() => setSelectedSource(source)}>{source.title}</button> : null })}</div>
                {!accepted && !dismissed && <div className="epic-suggestion-actions"><Button onClick={() => agreeSuggestion(suggestion)} disabled={reviewIsStale || !(reviewDrafts[suggestion.id] ?? suggestion.suggestion).trim()}><Check size={13} /> Agree &amp; add to {suggestion.targetLabel}</Button><button type="button" className="epic-dismiss-change" disabled={reviewIsStale} onClick={() => dismissSuggestion(suggestion)}>Dismiss</button></div>}
              </article>
            })}</div> : <div className="epic-review-empty"><Check size={16} /><span>No additional considerations surfaced. The epic already covers the available evidence, or you have dismissed prior suggestions.</span></div>}
            <div className="epic-review-sources" id="epic-review-sources"><div className="epic-review-sources-heading"><div><strong>Sources reviewed</strong><small>Select a source to inspect the material used</small></div><span>{review.sources.length}</span></div>
              {review.sources.map((source) => <button type="button" className="epic-review-source" key={source.id} onClick={() => setSelectedSource(source)} aria-label={`View material from ${source.title}`}><div><span className="epic-source-category">{source.category}</span><small>{source.category === 'External reference' ? 'Checked' : 'Updated'} {format(parseISO(source.updatedAt), 'MMM d, yyyy')}</small></div><strong>{source.title}</strong><p>{source.excerpt}</p><span className="epic-source-view-link">View source material <ExternalLink size={12} /></span></button>)}
            </div>
          </div>}
        </section>
        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Check size={16} /></span><div><h2>Stories and tasks</h2><p>Open a story to define its design and engineering breakdown.</p></div><span className="epic-page-section-tag">{taskRows.length}</span><Button type="button" variant="outline" size="sm" className="epic-add-story-button" onClick={() => setAddingStory(true)}><Plus size={14} /> Add story</Button></div>
          <div className="epic-page-issues">{taskRows.length ? taskRows.map((task) => <article className="epic-page-issue" key={task.id}><span className="epic-page-issue-key">{task.issueKey}</span><button type="button" className="epic-story-open" onClick={() => onOpenStory(task.id)} aria-label={`Open story ${task.issueKey}: ${task.title}`}>{task.title}</button><div className="epic-issue-assignee"><TeamAssigneeCombobox project={project} id={`epic-assignee-${task.id}`} value={task.assignee ?? ''} role={getTaskAssigneeRole(task, project) ?? ''} label={`Assign ${task.issueKey}`} onChange={(name, role) => updateTask(task.id, { assignee: name || undefined, assigneeRole: name ? role || undefined : undefined })} /></div><select className={`epic-issue-status status-${getTaskStatus(task.status).category}`} aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => changeTaskStatus(task.id, event.target.value as typeof task.status)}>{TASK_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}</select><span className="epic-page-issue-date"><CalendarDays size={13} />{format(parseISO(task.dueDate), 'MMM d')}</span></article>) : <div className="epic-page-empty">No stories are linked yet. Add a task from the workspace to create one.</div>}</div>
        </section>
      </div>
      <aside className="epic-page-rail">
        <section className="epic-page-section epic-team-editor">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Users size={16} /></span><div><h2>Project team</h2><p>Who is responsible for delivery?</p></div></div>
          <label className="epic-page-field"><span>Project manager</span><input value={draft.team.pm} onChange={(event) => updateTeam('pm', event.target.value)} placeholder="Name" /></label>
          <label className="epic-page-field"><span>Designer</span><input value={draft.team.designer} onChange={(event) => updateTeam('designer', event.target.value)} placeholder="Name" /></label>
          <label className="epic-page-field"><span>Developers <small>One per line</small></span><textarea value={draft.team.developers.join('\n')} onChange={(event) => updateDevelopers(event.target.value)} rows={3} placeholder="Add developer names" /></label>
          <div className="epic-team-preview">{[draft.team.pm, draft.team.designer, ...draft.team.developers].filter((person) => person.trim()).map((person, index) => <span className="epic-team-chip" key={`${person}-${index}`}><i>{initials(person)}</i>{person}</span>)}</div>
        </section>
        <section className="epic-page-section epic-attachments-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Link2 size={16} /></span><div><h2>Attachments</h2><p>Add pictures, documents, and useful links to this ticket.</p></div></div>
          <label className="epic-upload-button"><ImagePlus size={15} />{savingImages ? 'Adding pictures…' : 'Add pictures'}<input type="file" accept="image/*" multiple disabled={savingImages} onChange={(event) => { void addImages(event.target.files); event.currentTarget.value = '' }} /></label>
          <label className="epic-upload-button epic-document-upload"><Paperclip size={15} />{savingImages ? 'Adding files…' : 'Add documents'}<input type="file" multiple disabled={savingImages} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv" onChange={(event) => { void addDocuments(event.target.files); event.currentTarget.value = '' }} /></label>
          <form className="epic-add-link-form" onSubmit={addLink}><label className="epic-page-field"><span>Link name</span><input value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="e.g. Research notes" /></label><label className="epic-page-field"><span>URL</span><input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" required /></label><Button type="submit" variant="outline" size="sm"><Plus size={13} /> Attach link</Button></form>
          {attachments.length ? <div className="epic-attachment-grid">{attachments.map((item) => <article className="epic-attachment-card" key={item.id}>
            {item.kind === 'image' ? <>{imageUrls[item.id] ? <a className="epic-image-preview" href={imageUrls[item.id]} target="_blank" rel="noreferrer" aria-label={`View ${item.name}`}><img src={imageUrls[item.id]} alt={item.name} /></a> : <div className="epic-image-unavailable"><ImagePlus size={20} /><span>Image preview unavailable</span></div>}<strong title={item.name}>{item.name}</strong></> : item.kind === 'link' ? <a className="epic-link-attachment" href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /><span><strong>{item.name}</strong><small>{item.url}</small></span></a> : imageUrls[item.id] ? <a className="epic-link-attachment epic-document-attachment" href={imageUrls[item.id]} download={item.name}><FileText size={18} /><span><strong>{item.name}</strong><small>{item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB · ` : ''}Download document</small></span><Download size={14} /></a> : <div className="epic-link-attachment epic-document-attachment"><FileText size={18} /><span><strong>{item.name}</strong><small>File unavailable</small></span></div>}
            <button type="button" className="epic-attachment-remove" onClick={() => removeAttachment(item)} aria-label={`Remove ${item.name}`} title="Remove attachment"><Trash2 size={13} /></button>
          </article>)}</div> : <div className="epic-attachments-empty">No pictures, documents, or links attached yet.</div>}
          {attachments.length > 0 && <p className="epic-attachment-save-hint">Attachments are linked to {draft.key}. Save changes to confirm edits.</p>}
          <div className="epic-delete-zone"><div><strong>Delete this epic</strong><span>Remove it and its linked work from this workspace.</span></div><Button type="button" variant="outline" className="epic-delete-trigger" onClick={() => setDeleteDialogOpen(true)}><Trash2 size={14} /> Delete epic</Button></div>
        </section>
      </aside>
    </div>
    <Dialog open={Boolean(selectedSource)} onOpenChange={(open) => { if (!open) setSelectedSource(null) }}>
      <DialogContent className="epic-source-panel" showCloseButton>
        {selectedSource && <>
          <div className="epic-source-panel-heading"><span className="epic-source-category">{selectedSource.category}</span><DialogTitle>{selectedSource.title}</DialogTitle><DialogDescription>{selectedSource.category === 'External reference' ? 'External reference checked' : 'Source material reviewed'} · {format(parseISO(selectedSource.updatedAt), 'MMMM d, yyyy')}</DialogDescription></div>
          <section className="epic-source-material"><h3>Material considered</h3><blockquote>{selectedSource.excerpt}</blockquote></section>
          {selectedAttachment?.kind === 'image' && imageUrls[selectedAttachment.id] && <img className="epic-source-image" src={imageUrls[selectedAttachment.id]} alt={selectedSource.title} />}
          {selectedAttachment?.kind === 'document' && imageUrls[selectedAttachment.id] && <a className="epic-source-open-original" href={imageUrls[selectedAttachment.id]} download={selectedAttachment.name}>Download attached document <Download size={14} /></a>}
          <p className="epic-source-panel-note">{selectedAttachment?.kind === 'document' ? 'This document is attached to the ticket. Its contents are not extracted for this review.' : selectedAttachment?.kind === 'link' ? 'This link is attached to the ticket. The page content is not imported into this review.' : 'This is the material recorded for this source in the review.'}</p>
          {selectedSource.url && <a className="epic-source-open-original" href={selectedSource.url} target="_blank" rel="noreferrer">Open original source <ExternalLink size={14} /></a>}
        </>}
      </DialogContent>
    </Dialog>
    <AddStoryDialog project={project} open={addingStory} onOpenChange={setAddingStory} />
    <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) setDeleteDialogOpen(open) }}>
      <DialogContent className="modal-card leave-ticket-dialog epic-delete-dialog" showCloseButton={false}>
        <div className="modal-title"><div className="modal-mark epic-delete-mark"><AlertTriangle size={17} /></div><div><DialogTitle className="modal-heading">Delete this epic?</DialogTitle><DialogDescription className="modal-description">This permanently deletes “{project.name},” including its epic details, {project.tasks.length} linked {project.tasks.length === 1 ? 'story or task' : 'stories and tasks'}, and all attached links and files. It will be removed from the project list and timeline. Unsaved changes will be discarded. This action cannot be undone.</DialogDescription></div><button className="icon-button" onClick={() => setDeleteDialogOpen(false)} aria-label="Keep epic" disabled={deleting}><X size={16} /></button></div>
        <div className="modal-actions"><Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Keep epic</Button><Button className="epic-delete-confirm-button" onClick={() => void confirmDelete()} disabled={deleting}><Trash2 size={15} />{deleting ? 'Deleting…' : 'Delete epic'}</Button></div>
      </DialogContent>
    </Dialog>
    <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}><DialogContent className="modal-card leave-ticket-dialog" showCloseButton={false}><div className="modal-title"><div className="modal-mark leave-ticket-mark"><X size={17} /></div><div><DialogTitle className="modal-heading">Leave without saving?</DialogTitle><DialogDescription className="modal-description">Your unsaved epic changes or unconfirmed AI suggestions will be lost.</DialogDescription></div><button className="icon-button" onClick={() => setLeaveDialogOpen(false)} aria-label="Stay on this ticket"><X size={16} /></button></div><div className="modal-actions"><Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Stay on ticket</Button><Button variant="destructive" onClick={() => void discardAndLeave()}>Discard changes and leave</Button></div></DialogContent></Dialog>
    {isDirty && <div className="epic-page-bottom-save"><span>Unsaved epic changes</span><Button onClick={() => void saveAndBack()}><Save size={14} /> Save and return</Button></div>}
  </main>
}
