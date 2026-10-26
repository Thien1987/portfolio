import { useEffect, useRef, useState } from 'react'
import { addDays, format } from 'date-fns'
import { ArrowLeft, BookOpen, CalendarDays, ExternalLink, FilePlus2, FileText, Link2, Paperclip, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ProjectCode } from '@/components/ProjectCode'
import { useWorkspace } from '@/lib/store'
import { deleteEpicAsset, saveEpicAsset } from '@/lib/epicAttachments'
import { createEpicKey, draftNewProjectTicket, type NewProjectDraftSuggestion } from '@/lib/newProjectDraft'
import { PROJECT_STAGES } from '@/lib/projectStage'
import { getProjectQuarterValue, getQuarterStartDate } from '@/lib/projectSchedule'
import type { Project, ProjectEpicAttachment, ProjectStage } from '@/lib/types'

type DraftSection = { id: string; title: string; content: string }

function quarterOptions(startDate: string) {
  const year = Number(startDate.slice(0, 4))
  return [year - 1, year, year + 1].flatMap((itemYear) => [1, 2, 3, 4].map((quarter) => ({ value: `${itemYear}-Q${quarter}`, label: `Q${quarter} · ${itemYear}` })))
}

export function NewProjectPage({ onBack, onCreated, onDirtyChange }: { onBack: () => void; onCreated: (project: Project) => void; onDirtyChange?: (dirty: boolean) => void }) {
  const { addProject, plan } = useWorkspace()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [problem, setProblem] = useState('')
  const [outcome, setOutcome] = useState('')
  const [requirements, setRequirements] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [sections, setSections] = useState<DraftSection[]>([])
  const [attachments, setAttachments] = useState<ProjectEpicAttachment[]>([])
  const [savingFiles, setSavingFiles] = useState(false)
  const [intakeContext, setIntakeContext] = useState('')
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const [suggestion, setSuggestion] = useState<NewProjectDraftSuggestion | null>(null)
  const [priority, setPriority] = useState<Project['priority']>('medium')
  const [stage, setStage] = useState<ProjectStage>('discovery')
  const [startDate, setStartDate] = useState(today)
  const [deadline, setDeadline] = useState(format(addDays(new Date(), 21), 'yyyy-MM-dd'))
  const [deadlineType, setDeadlineType] = useState<Project['deadlineType']>('flexible')
  const [pm, setPm] = useState('')
  const [designer, setDesigner] = useState('')
  const [developers, setDevelopers] = useState('')
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const committedRef = useRef(false)
  const attachmentsRef = useRef(attachments)
  attachmentsRef.current = attachments

  const epicKey = createEpicKey(name, plan.projects.map((project) => project.epic?.key ?? ''))
  const hasUnsavedContent = Boolean(name || summary || problem || outcome || requirements || additionalContext || intakeContext || attachments.length || sections.some((section) => section.title || section.content) || startDate !== today || deadline !== format(addDays(new Date(), 21), 'yyyy-MM-dd') || priority !== 'medium' || stage !== 'discovery' || deadlineType !== 'flexible' || pm || designer || developers)
  useEffect(() => { onDirtyChange?.(hasUnsavedContent) }, [hasUnsavedContent, onDirtyChange])
  useEffect(() => () => {
    if (!committedRef.current) void Promise.all(attachmentsRef.current.filter((item) => item.kind === 'document').map((item) => deleteEpicAsset(item.id).catch(() => undefined)))
  }, [])

  const changeStartDate = (value: string) => {
    setStartDate(value)
    if (deadline < value) setDeadline(value)
  }
  const addSourceLink = () => {
    setLinkError('')
    let parsed: URL
    try { parsed = new URL(linkUrl.trim()) } catch { setLinkError('Enter a complete link, including https://.'); return }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') { setLinkError('Use an http or https link.'); return }
    setAttachments((current) => [...current, { id: crypto.randomUUID(), kind: 'link', name: linkName.trim() || parsed.hostname, url: parsed.href, addedAt: new Date().toISOString() }])
    setLinkName('')
    setLinkUrl('')
  }
  const addDocuments = async (files: FileList | null) => {
    if (!files?.length) return
    setSavingFiles(true)
    setLinkError('')
    const added: ProjectEpicAttachment[] = []
    const allowed = /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv)$/i
    for (const file of Array.from(files)) {
      if (!allowed.test(file.name)) { setLinkError(`${file.name} isn't a supported document. Use PDF, Office, text, Markdown, or CSV.`); continue }
      if (file.size > 15 * 1024 * 1024) { setLinkError(`${file.name} is larger than 15 MB.`); continue }
      const id = crypto.randomUUID()
      try {
        await saveEpicAsset(id, file)
        added.push({ id, kind: 'document', name: file.name, mimeType: file.type || undefined, size: file.size, addedAt: new Date().toISOString() })
      } catch { setLinkError(`Couldn't attach ${file.name}. Try a smaller file.`) }
    }
    if (added.length) setAttachments((current) => [...current, ...added])
    setSavingFiles(false)
  }
  const removeSource = (source: ProjectEpicAttachment) => {
    setAttachments((current) => current.filter((item) => item.id !== source.id))
    if (source.kind === 'document') void deleteEpicAsset(source.id).catch(() => undefined)
  }
  const draftWithAi = () => {
    if (!intakeContext.trim()) return
    setSuggestion(draftNewProjectTicket(name, intakeContext))
  }
  const applySuggestion = () => {
    if (!suggestion) return
    setSummary(suggestion.summary)
    setProblem(suggestion.problem)
    setOutcome(suggestion.outcome)
    setRequirements(suggestion.requirements.join('\n'))
    setSuggestion(null)
    document.getElementById('new-ticket-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const create = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const colors = ['indigo', 'emerald', 'amber', 'rose', 'sky']
    const project: Project = {
      id: `project-${crypto.randomUUID()}`,
      name: trimmedName,
      summary: summary.trim() || problem.trim() || `A new project for ${trimmedName}.`,
      color: colors[plan.projects.length % colors.length],
      startDate,
      deadline,
      priority,
      status: 'on-track',
      stage,
      deadlineType,
      tasks: [],
      epic: {
        key: epicKey,
        prd: { problem: problem.trim(), outcome: outcome.trim(), requirements: requirements.split('\n').map((line) => line.trim()).filter(Boolean) },
        additionalContext: additionalContext.trim() || undefined,
        sections: sections.filter((section) => section.title.trim() || section.content.trim()).map((section) => ({ ...section, title: section.title.trim(), content: section.content.trim() })),
        team: { pm: pm.trim() || 'Unassigned', designer: designer.trim() || 'Unassigned', developers: developers.split('\n').map((person) => person.trim()).filter(Boolean) },
        attachments,
      },
    }
    committedRef.current = true
    addProject(project)
    onCreated(project)
  }
  const back = () => {
    if (hasUnsavedContent) { setLeaveDialogOpen(true); return }
    onBack()
  }

  return <main className="epic-page new-project-page">
    <div className="epic-page-topbar"><Button variant="outline" className="epic-back-button" onClick={back}><ArrowLeft size={15} /> Back to workspace</Button><div className="new-ticket-top-actions"><span className="new-ticket-draft-label">Draft ticket</span><Button onClick={create} disabled={!name.trim()}><Save size={15} /> Create ticket</Button></div></div>
    <header className="epic-page-heading new-ticket-heading">
      <div className="epic-page-icon"><FilePlus2 size={20} /></div>
      <div className="epic-page-heading-copy"><div className="epic-page-overline">NEW PROJECT TICKET</div><div className="epic-page-title-row"><h1>{name.trim() || 'Untitled project'}</h1><ProjectCode code={epicKey} /></div><p>Start with a clear outcome. Add context and source material, then shape the ticket with AI.</p></div>
      <span className="epic-page-status new-ticket-status">Draft</span>
    </header>
    <div className="epic-page-layout new-ticket-layout">
      <div className="epic-page-main">
        <section className="epic-page-section" id="new-ticket-details">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><BookOpen size={16} /></span><div><h2>Ticket details</h2><p>Write the project brief in your own words. You can edit every field before creating the ticket.</p></div></div>
          <div className="epic-page-form">
            <label className="epic-page-field"><span>Project title <small>Required</small></span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Give this project a clear name" /></label>
            <label className="epic-page-field"><span>Short summary</span><Textarea rows={2} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="A concise description that helps people understand the project at a glance." /></label>
          </div>
        </section>

        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><Sparkles size={16} /></span><div><h2>Product requirements</h2><p>Capture the need, intended outcome, and the first requirements to validate.</p></div></div>
          <div className="epic-page-form new-ticket-prd-fields">
            <label className="epic-page-field"><span>Problem</span><Textarea rows={4} value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="What user or business problem needs to be solved?" /></label>
            <label className="epic-page-field"><span>Intended outcome</span><Textarea rows={3} value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="What should be different when this project succeeds?" /></label>
            <label className="epic-page-field"><span>Requirements <small>One per line</small></span><Textarea rows={4} value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Add requirements or decisions the team should validate…" /></label>
            <label className="epic-page-field"><span>Additional context <small>Open text</small></span><Textarea rows={4} value={additionalContext} onChange={(event) => setAdditionalContext(event.target.value)} placeholder="Add background, constraints, open questions, or other details…" /></label>
          </div>
          <div className="new-ticket-custom-sections"><div className="new-ticket-custom-heading"><div><strong>More sections</strong><span>Add any open-text section this ticket needs.</span></div><Button type="button" variant="outline" size="sm" onClick={() => setSections((current) => [...current, { id: crypto.randomUUID(), title: '', content: '' }])}><Plus size={13} /> Add section</Button></div>
            {sections.map((section) => <article className="new-ticket-custom-section" key={section.id}><div className="epic-page-form"><label className="epic-page-field"><span>Section title</span><input value={section.title} placeholder="e.g. Out of scope" onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item))} /></label><label className="epic-page-field"><span>Details</span><Textarea rows={3} value={section.content} placeholder="Write any details for this section…" onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, content: event.target.value } : item))} /></label></div><button type="button" className="epic-custom-section-remove" aria-label={`Remove ${section.title || 'untitled'} section`} onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}><Trash2 size={14} /></button></article>)}
          </div>
        </section>

        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><CalendarDays size={16} /></span><div><h2>Project planning</h2><p>Set when the work starts, its target date, and delivery expectations.</p></div></div>
          <div className="project-schedule-grid">
            <label className="epic-page-field"><span>Start quarter</span><select value={getProjectQuarterValue(startDate)} onChange={(event) => changeStartDate(getQuarterStartDate(event.target.value))}>{quarterOptions(startDate).map((quarter) => <option value={quarter.value} key={quarter.value}>{quarter.label}</option>)}</select></label>
            <label className="epic-page-field"><span>Project start date</span><input type="date" value={startDate} max={deadline} onChange={(event) => changeStartDate(event.target.value)} /></label>
            <label className="epic-page-field"><span>Project due date</span><input type="date" value={deadline} min={startDate} onChange={(event) => setDeadline(event.target.value < startDate ? startDate : event.target.value)} /></label>
            <label className="epic-page-field"><span>Deadline commitment</span><select value={deadlineType} onChange={(event) => setDeadlineType(event.target.value as Project['deadlineType'])}><option value="hard">Hard deadline</option><option value="flexible">Flexible deadline</option></select></label>
            <label className="epic-page-field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as Project['priority'])}>{(['urgent', 'high', 'medium', 'low'] as Project['priority'][]).map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
            <label className="epic-page-field"><span>Project stage</span><select value={stage} onChange={(event) => setStage(event.target.value as ProjectStage)}>{PROJECT_STAGES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          </div>
          <p className="project-schedule-note">Start quarter is derived from the start date. The target date can be marked as hard or flexible.</p>
        </section>

        <section className="epic-page-section">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon"><BookOpen size={16} /></span><div><h2>Initial owners</h2><p>Add the people leading and delivering this project. You can update the team later.</p></div></div>
          <div className="project-schedule-grid"><label className="epic-page-field"><span>Project manager</span><input value={pm} onChange={(event) => setPm(event.target.value)} placeholder="Name" /></label><label className="epic-page-field"><span>Designer</span><input value={designer} onChange={(event) => setDesigner(event.target.value)} placeholder="Name" /></label><label className="epic-page-field" style={{ gridColumn: '1 / -1' }}><span>Developers <small>One per line</small></span><Textarea rows={3} value={developers} onChange={(event) => setDevelopers(event.target.value)} placeholder="Add developer names" /></label></div>
        </section>
      </div>

      <aside className="epic-page-rail new-ticket-rail">
        <section className="epic-page-section new-ticket-ai-card">
          <div className="epic-page-section-heading"><span className="epic-page-section-icon epic-ai-icon"><Sparkles size={16} /></span><div><h2>AI ticket partner</h2><p>Share context and source links to get a structured first draft.</p></div></div>
          <div className="new-ticket-ai-prompt"><strong>What should I understand first?</strong><p>What is happening today, who is affected, and what should improve?</p><Textarea rows={5} value={intakeContext} onChange={(event) => { setIntakeContext(event.target.value); setSuggestion(null) }} placeholder="Describe the situation, people affected, why now, and any known constraints…" /></div>
          <div className="new-ticket-source-add"><strong>Relevant sources</strong><p>Attach multiple research, strategy, or delivery links. Add PDF, Office, text, Markdown, or CSV files up to 15 MB each.</p><label className="epic-page-field"><span>Link name <small>Optional</small></span><input value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="e.g. Customer research" /></label><label className="epic-page-field"><span>Document link</span><input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSourceLink() } }} /></label><div className="new-ticket-source-actions"><Button type="button" variant="outline" size="sm" onClick={addSourceLink} disabled={!linkUrl.trim()}><Link2 size={13} /> Attach link</Button><label className={`epic-upload-button new-ticket-attach-files ${savingFiles ? 'is-uploading' : ''}`}><input type="file" multiple disabled={savingFiles} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv" onChange={(event) => { void addDocuments(event.currentTarget.files); event.currentTarget.value = '' }} /><Paperclip size={14} />{savingFiles ? 'Attaching…' : 'Attach files'}</label></div>{linkError && <p className="new-ticket-error" role="alert">{linkError}</p>}
            {attachments.length > 0 && <ul className="new-ticket-sources">{attachments.map((source) => <li key={source.id}>{source.kind === 'link' ? <a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /><span>{source.name}</span></a> : <span className="new-ticket-source-file"><FileText size={13} /><span>{source.name}{source.size ? ` · ${(source.size / (1024 * 1024)).toFixed(1)} MB` : ''}</span></span>}<button type="button" aria-label={`Remove ${source.name}`} onClick={() => removeSource(source)}><X size={13} /></button></li>)}</ul>}
          </div>
          <div className="new-ticket-ai-note">The draft uses the context you provide. Links and files stay attached to the ticket; source contents are not imported automatically.</div>
          <Button className="new-ticket-draft-button" onClick={draftWithAi} disabled={!intakeContext.trim()}><Sparkles size={15} /> Draft ticket with AI</Button>
          {suggestion && <article className="new-ticket-ai-suggestion"><span className="new-ticket-ai-label"><Sparkles size={12} /> AI STARTER DRAFT</span><strong>Proposed structure</strong><p><b>Problem</b> {suggestion.problem}</p><p><b>Outcome</b> {suggestion.outcome}</p><p><b>Requirements</b> {suggestion.requirements.length} initial checks based on your notes</p><div><Button size="sm" onClick={applySuggestion}>Use draft</Button><button type="button" className="new-ticket-dismiss" onClick={() => setSuggestion(null)}>Dismiss</button></div></article>}
        </section>
      </aside>
    </div>
    <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}><DialogContent className="modal-card leave-ticket-dialog" showCloseButton={false}><div className="modal-title"><div className="modal-mark leave-ticket-mark"><X size={17} /></div><div><DialogTitle className="modal-heading">Discard this ticket?</DialogTitle><DialogDescription className="modal-description">Your unsaved project ticket and attached links will be lost if you leave.</DialogDescription></div><button className="icon-button" onClick={() => setLeaveDialogOpen(false)} aria-label="Stay on the ticket"><X size={16} /></button></div><div className="modal-actions"><Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Keep editing</Button><Button variant="destructive" onClick={onBack}>Discard changes and leave</Button></div></DialogContent></Dialog>
  </main>
}
