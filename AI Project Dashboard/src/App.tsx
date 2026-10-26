import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Flag, Gauge, History, Layers3, LayoutGrid, ListTodo, Moon, Plus, RotateCcw, RotateCw, Search, Settings2, ShieldCheck, Sparkles, Sun, Target, User, WandSparkles, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { TimelineView, TimelineProjectFilter, BoardView, WeekView } from '@/components/WorkspaceViews'
import { ProjectEpicPage } from '@/components/ProjectEpicPage'
import { NewProjectPage } from '@/components/NewProjectPage'
import { StoryPage } from '@/components/StoryPage'
import { ProjectCode } from '@/components/ProjectCode'
import { FloatingAssistant } from '@/components/FloatingAssistant'
import { generateSuggestions } from '@/lib/suggestions'
import { isTaskClosed } from '@/lib/taskStatus'
import { getEpicKey } from '@/lib/projectKey'
import { getTaskAssigneeRole } from '@/lib/teamAssignment'
import { useWorkspace } from '@/lib/store'
import type { CalendarScale, Priority, Project, ProjectStatus, SteeringLevel, Suggestion, WorkspaceView } from '@/lib/types'
import './App.css'

const projectColor: Record<string, string> = { indigo: 'var(--project-indigo)', emerald: 'var(--project-emerald)', amber: 'var(--project-amber)', rose: 'var(--project-rose)', sky: 'var(--project-sky)' }
const priorities: Priority[] = ['urgent', 'high', 'medium', 'low']
const views: { id: WorkspaceView; label: string; icon: typeof CalendarDays }[] = [
  { id: 'timeline', label: 'Timeline', icon: CalendarDays }, { id: 'board', label: 'Projects', icon: LayoutGrid }, { id: 'week', label: 'This week', icon: ListTodo },
]

type TicketNavigation = { kind: 'project'; project: Project; taskId?: string } | { kind: 'workspace'; view: WorkspaceView; allProjects?: boolean } | { kind: 'create' }

function Sidebar({ onAdd, ticketMode = false, onTicketNavigate }: { onAdd: () => void; ticketMode?: boolean; onTicketNavigate?: (destination: TicketNavigation) => void }) {
  const { plan, view, setView, selectedProject, selectProject, timelineProjectFilter, setTimelineProjectFilter } = useWorkspace()
  const openTasks = plan.projects.reduce((sum, project) => sum + project.tasks.filter((task) => !isTaskClosed(task.status)).length, 0)
  return <aside className="app-sidebar">
    <div className="brand-row"><div className="brand-mark"><Layers3 size={17} /></div><div className="brand-name">margin<span>.</span><small>PROJECT SPACE</small></div></div>
    <WorkspaceDropdown />
    <div className="sidebar-section-label">WORKSPACE</div>
    <nav className="main-nav" aria-label="Workspace views">
      {views.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => ticketMode ? onTicketNavigate?.({ kind: 'workspace', view: id }) : setView(id)} aria-current={view === id ? 'page' : undefined}><Icon size={16} /><span>{label}</span>{id === 'week' && <small className="nav-count">{openTasks}</small>}</button>)}
    </nav>
    <div className="sidebar-project-header"><span className="sidebar-section-label">YOUR PROJECTS</span><button onClick={() => ticketMode ? onTicketNavigate?.({ kind: 'create' }) : onAdd()} className="icon-button tiny" aria-label="Add a project"><Plus size={15} /></button></div>
    <nav className="project-nav" aria-label="Filter by project">
      <button className={`project-nav-item ${timelineProjectFilter === null ? 'selected' : ''}`} onClick={() => { if (ticketMode) onTicketNavigate?.({ kind: 'workspace', view: 'timeline', allProjects: true }); else { selectProject(null); setTimelineProjectFilter(null); setView('timeline') } }}><span className="all-projects-icon"><Layers3 size={13} /></span><span>All projects</span><small>{plan.projects.length}</small></button>
      {plan.projects.map((project) => <button key={project.id} className={`project-nav-item ${selectedProject === project.id || timelineProjectFilter?.length === 1 && timelineProjectFilter[0] === project.id ? 'selected' : ''}`} onClick={() => { if (ticketMode) onTicketNavigate?.({ kind: 'project', project }); else { selectProject(project.id); setTimelineProjectFilter([project.id]); setView('timeline') } }}><i className="project-color-dot" style={{ backgroundColor: projectColor[project.color] }} /><span>{project.name}</span>{project.status === 'at-risk' && <i className="sidebar-risk" aria-label="At risk" />}</button>)}
    </nav>
    <div className="sidebar-footer"><div className="sidebar-week"><div className="mini-calendar"><CalendarDays size={15} /></div><div><strong>{format(new Date(), 'MMMM yyyy')}</strong><small>{openTasks} open tasks across your plan</small></div></div><div className="profile-row"><div className="profile-avatar">TN</div><div><strong>Thien Nguyen</strong><small>Designer</small></div></div></div>
  </aside>
}

const departmentOptions = [
  { name: 'Product', detail: 'Roadmaps, epics, and delivery work.' },
  { name: 'Design', detail: 'Design initiatives and experience work.' },
  { name: 'Engineering', detail: 'Technical projects and implementation.' },
  { name: 'Marketing', detail: 'Campaigns, launches, and growth work.' },
  { name: 'Operations', detail: 'Internal programs and team workflows.' },
]

function WorkspaceDropdown() {
  const { department, setDepartment } = useWorkspace()
  const ref = useRef<HTMLDetailsElement>(null)
  const chooseDepartment = (name: string) => {
    setDepartment(name)
    if (ref.current) ref.current.open = false
  }
  return <details className="workspace-dropdown" ref={ref}>
    <summary className="workspace-picker" aria-label="Workspace and department options">
      <div className="workspace-avatar">T</div><span><strong>Thien's workspace</strong><small>{department} department</small></span><ChevronDown size={14} />
    </summary>
    <div className="workspace-department-menu" aria-label="Choose a department">
      <div className="workspace-department-heading"><strong>Switch department</strong><small>Choose a department workspace.</small></div>
      {departmentOptions.map((option) => <button key={option.name} className={`workspace-department-option ${department === option.name ? 'is-current' : ''}`} onClick={() => chooseDepartment(option.name)}>
        <span><strong>{option.name}{department === option.name && <small className="current-plan-label">Current</small>}</strong><small>{option.detail}</small></span>{department === option.name ? <Check size={16} /> : <ArrowRight size={15} />}
      </button>)}
    </div>
  </details>
}

function ThemeToggle() {
  const { theme, setTheme } = useWorkspace()
  return <div className="topbar-theme-toggle" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
    <span aria-hidden="true">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
    <Switch size="sm" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} aria-label="Toggle dark mode" />
  </div>
}

function AccountDropdown() {
  const [notice, setNotice] = useState('')
  const dropdownRef = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) dropdownRef.current?.removeAttribute('open')
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dropdownRef.current?.open) {
        dropdownRef.current.open = false
        dropdownRef.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])
  return <details ref={dropdownRef} className="account-dropdown">
    <summary className="account-trigger" aria-label="Open account options"><span className="topbar-avatar">TN</span><span className="account-trigger-name">Thien Nguyen</span><ChevronDown size={14} /></summary>
    <div className="account-menu">
      <div className="account-menu-identity"><span className="profile-avatar">TN</span><span><strong>Thien Nguyen</strong><small>Designer · Personal workspace</small></span></div>
      <div className="account-menu-divider" />
      <button onClick={() => setNotice('Thien Nguyen · Product designer')}><User size={15} /> Profile</button>
      <button onClick={() => setNotice('Use the appearance switch next to your account to change the theme.')}><Settings2 size={15} /> Preferences</button>
      <button onClick={() => { setNotice('Opening plan help.'); window.dispatchEvent(new Event('margin:open-assistant')) }}><CircleHelp size={15} /> Help &amp; feedback</button>
      {notice && <p className="account-menu-notice" role="status">{notice}</p>}
      <div className="account-menu-divider" />
    </div>
  </details>
}

function TicketSearch({ onOpenProject }: { onOpenProject: (project: Project, taskId?: string) => void }) {
  const plan = useWorkspace((state) => state.plan)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return
      setOpen(false)
      inputRef.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => plan.projects.flatMap((project) => {
    const epicKey = getEpicKey(project)
    const epicResult = { id: `epic:${project.id}`, key: epicKey, title: project.name, project, type: 'Epic', assignee: project.epic?.team.pm || 'Unassigned', assigneeRole: undefined as 'designer' | 'developer' | undefined, content: `${project.epic?.prd.problem ?? ''} ${project.epic?.prd.outcome ?? ''}` }
    const storyResults = project.tasks.map((task, index) => ({ id: task.id, key: task.issueKey ?? `${epicKey.split('-')[0]}-${101 + index}`, title: task.title, project, type: 'Story', assignee: task.assignee || 'Unassigned', assigneeRole: getTaskAssigneeRole(task, project), content: [task.description, task.storyDetails?.intent, task.storyDetails?.designBreakdown, task.storyDetails?.engineeringBreakdown, task.storyDetails?.additionalContext, ...(task.storyDetails?.acceptanceCriteria ?? []), ...(task.storyDetails?.sections ?? []).flatMap((section) => [section.title, section.content])].filter(Boolean).join(' ') }))
    return [epicResult, ...storyResults]
  }).filter((ticket) => !normalizedQuery || [ticket.key, ticket.title, ticket.content, ticket.project.name, ticket.project.summary, ticket.assignee, ticket.project.epic?.team.designer ?? '', ...(ticket.project.epic?.team.developers ?? [])].some((value) => value.toLowerCase().includes(normalizedQuery))).slice(0, 8), [plan.projects, normalizedQuery])
  const selectResult = (project: Project, taskId?: string) => { onOpenProject(project, taskId); setOpen(false); setQuery('') }
  return <div ref={rootRef} className="ticket-search">
    <Search size={16} aria-hidden="true" />
    <input ref={inputRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); rootRef.current?.querySelector<HTMLButtonElement>('.ticket-search-result')?.focus() } }} placeholder="Search" aria-label="Search" aria-expanded={open} aria-controls="ticket-search-results" />
    {query && <button className="ticket-search-clear" type="button" aria-label="Clear ticket search" onClick={() => { setQuery(''); setOpen(true); inputRef.current?.focus() }}><X size={13} /></button>}
    {open && <div className="ticket-search-popover" id="ticket-search-results" role="region" aria-label="Ticket search results">
      {!normalizedQuery ? <p className="ticket-search-hint">Search epics and stories by key, title, project, or assignee.</p> : results.length ? results.map((ticket) => <button className="ticket-search-result" key={ticket.id} onClick={() => selectResult(ticket.project, ticket.type === 'Story' ? ticket.id : undefined)}>
        <span className="ticket-search-result-icon">{ticket.type === 'Epic' ? <BookOpen size={14} /> : <ListTodo size={14} />}</span><span className="ticket-search-result-copy"><span><strong>{ticket.title}</strong><small>{ticket.key} · {ticket.type}</small></span><small>{ticket.project.name}{ticket.type === 'Story' && <> · <ProjectCode code={getEpicKey(ticket.project)} /></>} · {ticket.assignee === 'Unassigned' ? 'Unassigned' : `Assigned to ${ticket.assigneeRole ? `${ticket.assigneeRole === 'designer' ? 'Designer' : 'Developer'} · ` : ''}${ticket.assignee}`}</small></span>
      </button>) : <p className="ticket-search-empty">No matching tickets in this workspace.</p>}
      <div className="ticket-search-scope">Searching all projects in this workspace</div>
    </div>}
  </div>
}

function AppTopbar({ current = 'Overview', onOpenProject }: { current?: string; onOpenProject: (project: Project, taskId?: string) => void }) {
  return <header className="topbar"><div className="breadcrumb"><span>Thien's workspace</span><ChevronRight size={13} /><strong>{current}</strong></div><TicketSearch onOpenProject={onOpenProject} /><div className="topbar-actions"><ThemeToggle /><AccountDropdown /></div></header>
}

function AppHeader({ onAdd, onOpenProject }: { onAdd: () => void; onOpenProject: (project: Project, taskId?: string) => void }) {
  const { view, undo, redo, history, future, plan } = useWorkspace()
  const total = plan.projects.reduce((sum, project) => sum + project.tasks.length, 0)
  const week = format(new Date(), 'EEEE, MMMM d, yyyy')
  const heading = view === 'timeline' ? 'Plan at a glance' : view === 'board' ? 'Your projects' : 'A clear week ahead'
  const description = view === 'timeline' ? 'A little structure for everything you’re moving forward.' : view === 'board' ? 'See what’s moving, paused, and coming up.' : 'A focused view of the work you’ve planned.'
  return <>
    <AppTopbar onOpenProject={onOpenProject} />
    <div className="page-heading">
      <div><div className="eyebrow">{week.toUpperCase()}</div><h1>{heading}</h1><p>{description}</p></div>
      <div className="heading-actions"><div className="undo-group"><Button variant="outline" size="sm" onClick={undo} disabled={!history.length} aria-label="Undo last change"><RotateCcw size={14} /> Undo</Button><Button variant="outline" size="icon-sm" onClick={redo} disabled={!future.length} aria-label="Redo last change"><RotateCw size={14} /></Button></div><Button onClick={onAdd} size="sm" className="add-project-button"><Plus size={15} /> New project</Button></div>
    </div>
    <div className="view-toolbar"><div className="toolbar-meta"><span><i className="toolbar-dot" /> All changes saved</span><Separator orientation="vertical" /><span>{total} tasks</span></div></div>
  </>
}

function SuggestionCard({ suggestion, conflict }: { suggestion: Suggestion; conflict: boolean }) {
  const accept = useWorkspace((state) => state.acceptSuggestion)
  const dismiss = useWorkspace((state) => state.dismissSuggestion)
  const plan = useWorkspace((state) => state.plan)
  const [editing, setEditing] = useState(false)
  const [draftDate, setDraftDate] = useState(suggestion.change.kind === 'reschedule' ? suggestion.change.startDate : '')
  const [draftPriority, setDraftPriority] = useState(suggestion.change.kind === 'set-priority' ? suggestion.change.priority : 'high')
  const [draftStatus, setDraftStatus] = useState(suggestion.change.kind === 'set-status' ? suggestion.change.status : 'at-risk')
  const [draftSubtasks, setDraftSubtasks] = useState(suggestion.change.kind === 'add-subtasks' ? suggestion.change.tasks.map((item) => item.title) : [])
  const [draftTaskId, setDraftTaskId] = useState(suggestion.change.kind === 'mark-next' ? suggestion.change.taskId : '')
  const project = plan.projects.find((item) => item.id === suggestion.target.projectId)
  const task = project?.tasks.find((item) => item.id === suggestion.target.taskId)
  const confidenceLabel = suggestion.confidence < 0.7 ? 'LOW CONFIDENCE' : 'SUGGESTION'
  const applyEdited = () => {
    let adjusted: Suggestion = suggestion
    if (suggestion.change.kind === 'reschedule' && draftDate) {
      const offset = differenceInCalendarDays(parseISO(draftDate), parseISO(suggestion.change.startDate))
      adjusted = { ...suggestion, change: { ...suggestion.change, startDate: draftDate, dueDate: format(addDays(parseISO(suggestion.change.dueDate), offset), 'yyyy-MM-dd') } }
    } else if (suggestion.change.kind === 'set-priority') adjusted = { ...suggestion, change: { ...suggestion.change, priority: draftPriority } }
    else if (suggestion.change.kind === 'set-status') adjusted = { ...suggestion, change: { ...suggestion.change, status: draftStatus } }
    else if (suggestion.change.kind === 'add-subtasks') adjusted = { ...suggestion, change: { ...suggestion.change, tasks: suggestion.change.tasks.map((item, index) => ({ ...item, title: draftSubtasks[index]?.trim() || item.title })) } }
    else if (suggestion.change.kind === 'mark-next' && draftTaskId) adjusted = { ...suggestion, target: { ...suggestion.target, taskId: draftTaskId }, change: { ...suggestion.change, taskId: draftTaskId } }
    accept(adjusted); setEditing(false)
  }
  const icons = { overload: <Gauge size={14} />, slipping: <ArrowDownRight size={14} />, 'next-task': <Target size={14} />, breakdown: <WandSparkles size={14} />, priority: <ArrowUpRight size={14} /> }
  return <article className={`suggestion-card ${suggestion.confidence < 0.7 ? 'suggestion-uncertain' : ''}`}>
    <div className="suggestion-top"><span className="suggestion-icon">{icons[suggestion.type]}</span><span className="suggestion-origin">{confidenceLabel}</span><button className="icon-button tiny dismiss-x" onClick={() => dismiss(suggestion)} aria-label={`Dismiss suggestion: ${suggestion.title}`}><X size={14} /></button></div>
    <h3>{suggestion.title}</h3><p>{suggestion.reason}</p>
    {suggestion.change.kind === 'reschedule' && task && <div className="suggestion-preview"><span className="ghost-task">{task.title}</span><ArrowRight size={13} /><span className="suggested-date">{format(parseISO(suggestion.change.startDate), 'MMM d')}</span></div>}
    {suggestion.change.kind === 'add-subtasks' && <div className="subtask-proposal">{suggestion.change.tasks.map((item) => <span key={item.id}><i />{item.title}</span>)}</div>}
    {conflict && <div className="conflict-note"><AlertIcon /> This overlaps another suggestion for the same week. Review one before applying another.</div>}
    {editing && <div className="suggestion-edit">
      {suggestion.change.kind === 'reschedule' && <label>Move start date<input type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} /></label>}
      {suggestion.change.kind === 'set-priority' && <label>Priority<select value={draftPriority} onChange={(event) => setDraftPriority(event.target.value as Priority)}>{priorities.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>}
      {suggestion.change.kind === 'set-status' && <label>Project status<select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as ProjectStatus)}>{(['on-track', 'at-risk', 'paused', 'complete'] as ProjectStatus[]).map((item) => <option key={item} value={item}>{item.replace('-', ' ')}</option>)}</select></label>}
      {suggestion.change.kind === 'add-subtasks' && <div className="suggestion-subtask-edit">{suggestion.change.tasks.map((item, index) => <label key={item.id}>Step {index + 1}<input value={draftSubtasks[index] ?? ''} onChange={(event) => setDraftSubtasks((current) => current.map((title, titleIndex) => titleIndex === index ? event.target.value : title))} /></label>)}</div>}
      {suggestion.change.kind === 'mark-next' && <label>Task to start<select value={draftTaskId} onChange={(event) => setDraftTaskId(event.target.value)}>{project?.tasks.filter((item) => !isTaskClosed(item.status)).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <div className="edit-actions"><Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" onClick={applyEdited}><Check size={13} /> Apply edited</Button></div>
    </div>}
    <div className="suggestion-actions"><Button size="sm" onClick={() => conflict ? setEditing(true) : accept(suggestion)} disabled={conflict && editing}>Accept</Button><Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Close edit' : 'Edit'}</Button><Button variant="ghost" size="sm" onClick={() => dismiss(suggestion)}>Dismiss</Button></div>
  </article>
}

function AlertIcon() { return <Flag size={12} aria-hidden="true" /> }

function SteeringPanel() {
  const { plan, updateSteering, togglePriority, historyEntries } = useWorkspace()
  const { steering, projects } = plan
  const suggestions = useMemo(() => generateSuggestions(plan), [plan])
  const groups = new Map<string, number>()
  suggestions.forEach((item) => { if (item.conflictGroup) groups.set(item.conflictGroup, (groups.get(item.conflictGroup) ?? 0) + 1) })
  const weekTasks = projects.flatMap((project) => project.tasks.filter((task) => !isTaskClosed(task.status) && task.startDate <= format(addDays(new Date(), 7), 'yyyy-MM-dd')))
  const hours = weekTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
  const capacityOver = Math.max(0, hours - steering.weeklyCapacity)
  const [historyOpen, setHistoryOpen] = useState(false)
  return <aside className="insight-panel">
    <div className="panel-title-row"><div><div className="eyebrow">YOUR PLAN, IN CONTEXT</div><h2>Small nudges</h2></div><Badge variant="outline" className="suggestion-count">{suggestions.length} <Sparkles size={11} /></Badge></div>
    <p className="panel-intro">Suggestions stay close to the work. You decide what to keep.</p>
    <div className="suggestion-list">
      {suggestions.map((item) => <SuggestionCard key={item.id} suggestion={item} conflict={Boolean(item.conflictGroup && (groups.get(item.conflictGroup) ?? 0) > 1)} />)}
      {!suggestions.length && <div className="all-clear"><div className="all-clear-mark"><ShieldCheck size={19} /></div><strong>You're in a good place</strong><span>No suggestions to review right now. Your plan will update as it changes.</span></div>}
    </div>
    <div className="steering-section"><div className="section-title"><Settings2 size={15} /><h3>Steer your plan</h3><span title="Capacity and proactivity shape the rule-based suggestions." aria-label="About these controls"><CircleHelp size={14} /></span></div>
      <div className="steering-control"><div className="steering-label"><span>Weekly capacity</span><strong>{steering.weeklyCapacity}h</strong></div><Slider min={8} max={40} step={1} value={[steering.weeklyCapacity]} aria-label="Weekly capacity in hours" onValueChange={(value) => updateSteering({ weeklyCapacity: Array.isArray(value) ? value[0] : Number(value) })} /><div className="slider-range"><span>8h</span><span>40h</span></div>{capacityOver > 0 && <div className="capacity-warning"><AlertIcon /> {capacityOver}h above capacity this week</div>}</div>
      <div className="steering-switch"><span><strong>Protect focus time</strong><small>Keep room between busy days</small></span><Switch checked={steering.protectFocus} onCheckedChange={(checked) => updateSteering({ protectFocus: checked })} aria-label="Protect focus time" /></div>
      <div className="steering-control"><div className="steering-label"><span>Suggestion frequency</span><small>How often should we nudge?</small></div><div className="proactivity-control" role="group" aria-label="Suggestion frequency">{(['quiet', 'balanced', 'proactive'] as SteeringLevel[]).map((level) => <button key={level} onClick={() => updateSteering({ proactivity: level })} className={steering.proactivity === level ? 'selected' : ''} aria-pressed={steering.proactivity === level}>{level}</button>)}</div></div>
      <div className="steering-control"><div className="steering-label"><span>Project priorities</span><small>Include suggestions for</small></div><div className="priority-pills">{priorities.map((priority) => <button key={priority} className={`priority-pill ${steering.includedPriorities.includes(priority) ? 'active' : ''}`} onClick={() => togglePriority(priority)} aria-pressed={steering.includedPriorities.includes(priority)}><i className={`priority-dot ${priority}`} />{priority}</button>)}</div></div>
    </div>
    <div className="history-section"><button className="history-toggle" onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen}><span><History size={14} /> Recent changes</span><ChevronDown size={14} className={historyOpen ? 'rotate' : ''} /></button>
      {historyOpen && <div className="history-list">{historyEntries.length ? historyEntries.slice(0, 5).map((entry, i) => <div className="history-entry" key={`${entry.at}-${i}`}><i /><span>{entry.label}</span><time>{format(parseISO(entry.at), 'h:mm a')}</time></div>) : <div className="history-empty">Changes you make will show up here.</div>}</div>}
    </div>
    <div className="panel-footnote"><Activity size={13} /><span>Suggestions are based on the plan you’ve made. They won’t change anything until you accept.</span></div>
  </aside>
}

function AddTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { plan, addTask, selectedProject } = useWorkspace()
  const [projectId, setProjectId] = useState(selectedProject ?? plan.projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('2')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'))
  useEffect(() => {
    if (open) setProjectId(selectedProject ?? plan.projects[0]?.id ?? '')
  }, [open, selectedProject, plan.projects])
  const create = () => {
    if (!title.trim() || !projectId) return
    addTask({ id: `task-${Date.now()}`, projectId, title: title.trim(), estimatedHours: Math.max(.5, Number(hours) || 1), startDate, dueDate, status: 'todo', dependencies: [] })
    setTitle(''); onOpenChange(false)
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="modal-card task-modal" showCloseButton={false}>
    <div className="modal-title"><div className="modal-mark"><ListTodo size={18} /></div><div><DialogTitle className="modal-heading">Add a task</DialogTitle><DialogDescription className="modal-description">Choose a project, then place this work on your timeline.</DialogDescription></div><button className="icon-button" onClick={() => onOpenChange(false)} aria-label="Close"><X size={16} /></button></div>
    <div className="add-task-form">
      <label className="form-field task-form-field">Task name<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review the first draft" onKeyDown={(event) => event.key === 'Enter' && create()} /></label>
      <label className="form-field task-form-field">Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{plan.projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {getEpicKey(project)}</option>)}</select></label>
      <fieldset className="task-schedule-group"><legend>Schedule and effort</legend><div className="task-form-row">
        <label className="form-field task-form-field">Starts<input type="date" value={startDate} max={dueDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="form-field task-form-field">Due date<input type="date" value={dueDate} min={startDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        <label className="form-field task-form-field">Effort<input type="number" min="0.5" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} /></label>
      </div><p className="task-form-hint">Set the date range and estimated hours for this task.</p></fieldset>
    </div>
    <div className="modal-actions task-modal-actions"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={create} disabled={!title.trim() || !projectId}>Add task <ArrowRight size={14} /></Button></div>
  </DialogContent></Dialog>
}

function EmptyWorkspace({ onAdd }: { onAdd: () => void }) {
  return <div className="empty-workspace"><div className="empty-art"><Layers3 size={26} /><span><CalendarDays size={16} /></span><i /><i /><i /></div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>A little space to think clearly.</h2><p>Bring your projects together. See what’s on your plate, spot what needs attention, and make a plan that feels doable.</p><Button onClick={onAdd}><Plus size={15} /> Create your first project</Button></div>
}

function MainWorkspace({ onAdd, onAddTask, onOpenProject }: { onAdd: () => void; onAddTask: () => void; onOpenProject: (project: Project) => void }) {
  const { plan, view, calendarScale, setCalendarScale } = useWorkspace()
  if (!plan.projects.length) return <EmptyWorkspace onAdd={onAdd} />
  const content = view === 'timeline' ? <TimelineView onOpenProject={onOpenProject} /> : view === 'board' ? <BoardView onOpenProject={onOpenProject} /> : <WeekView onOpenProject={onOpenProject} />
  return <main className="main-workspace">
    <div className="canvas-toolbar"><div className="canvas-caption">{view === 'timeline' ? <><span className="caption-icon"><CalendarDays size={14} /></span><span><strong>{{ day: 'Two-week daily view', week: 'Six-week view', month: 'Six-month view', quarter: 'Four-quarter view', 'half-year': 'Six-month periods', year: 'Five-year view' }[calendarScale]}</strong><small>Drag items to move them; drag the end grip to resize</small></span></> : view === 'board' ? <><span className="caption-icon"><LayoutGrid size={14} /></span><span><strong>Project board</strong><small>Drag projects to reorder your priorities</small></span></> : <><span className="caption-icon"><Target size={14} /></span><span><strong>Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}</strong><small>A close-up of what’s in motion</small></span></>}</div>
      {view === 'timeline' && <div className="timeline-toolbar-options"><TimelineProjectFilter /><label className="timeline-scale-control"><span>Range</span><select value={calendarScale} aria-label="Timeline range" onChange={(event) => setCalendarScale(event.target.value as CalendarScale)}>{(['week', 'day', 'month', 'quarter', 'half-year', 'year'] as CalendarScale[]).map((scale) => <option key={scale} value={scale}>{scale === 'week' ? 'Weekly' : scale === 'day' ? 'Daily' : scale === 'month' ? 'Monthly' : scale === 'quarter' ? 'Quarterly' : scale === 'half-year' ? '6 months' : 'Yearly'}</option>)}</select></label><div className="canvas-legend"><span><i className="legend-task" /> Your plan</span><span><i className="legend-proposal" /> Suggested</span></div></div>}
    </div>
    {content}
    <div className="empty-tasks-row"><div className="empty-tasks-mark"><Plus size={14} /></div><div><strong>Something missing from this plan?</strong><span>Add a task to make the next step visible.</span></div><Button variant="outline" size="sm" onClick={onAddTask}><Plus size={12} /> Add a task</Button><Button variant="outline" size="sm" onClick={onAdd}>Add a project</Button></div>
  </main>
}

export default function App() {
  const [creatingProject, setCreatingProject] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [epicProjectId, setEpicProjectId] = useState<string | null>(null)
  const [epicTaskId, setEpicTaskId] = useState<string | null>(null)
  const [ticketHasChanges, setTicketHasChanges] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<TicketNavigation | null>(null)
  const theme = useWorkspace((state) => state.theme)
  const projects = useWorkspace((state) => state.plan.projects)
  const setView = useWorkspace((state) => state.setView)
  const selectProject = useWorkspace((state) => state.selectProject)
  const setTimelineProjectFilter = useWorkspace((state) => state.setTimelineProjectFilter)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const previewView = searchParams.get('previewView')
    if (searchParams.get('portfolioPreview') === '1') document.documentElement.classList.add('portfolio-preview')
    if (previewView === 'timeline' || previewView === 'board' || previewView === 'week') setView(previewView)
  }, [setView])
  const epicProject = projects.find((project) => project.id === epicProjectId) ?? null
  const epicTask = epicProject?.tasks.find((task) => task.id === epicTaskId) ?? null
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
  const openProject = (project: Project, taskId?: string) => { setCreatingProject(false); setTicketHasChanges(false); setEpicProjectId(project.id); setEpicTaskId(taskId ?? null) }
  const completeNavigation = (destination: TicketNavigation) => {
    setPendingNavigation(null)
    setTicketHasChanges(false)
    if (destination.kind === 'project') openProject(destination.project, destination.taskId)
    if (destination.kind === 'create') { setEpicProjectId(null); setEpicTaskId(null); setCreatingProject(true) }
    if (destination.kind === 'workspace') {
      setEpicProjectId(null); setEpicTaskId(null); setCreatingProject(false); setView(destination.view)
      if (destination.allProjects) { selectProject(null); setTimelineProjectFilter(null) }
    }
  }
  const requestTicketNavigation = (destination: TicketNavigation) => {
    const hasTicketOpen = Boolean(epicProjectId || creatingProject)
    if (hasTicketOpen && ticketHasChanges) { setPendingNavigation(destination); return }
    completeNavigation(destination)
  }
  const requestOpenProject = (project: Project, taskId?: string) => requestTicketNavigation({ kind: 'project', project, taskId })
  return <div className="app-shell"><Sidebar onAdd={() => setCreatingProject(true)} ticketMode={Boolean(epicProjectId || creatingProject)} onTicketNavigate={requestTicketNavigation} /><div className="app-main">{epicProject ? <><AppTopbar current={epicTask?.issueKey ?? epicProject.epic?.key ?? 'Project epic'} onOpenProject={requestOpenProject} />{epicTask ? <StoryPage key={epicTask.id} project={epicProject} task={epicTask} onBack={() => { setEpicTaskId(null); setTicketHasChanges(false) }} onDirtyChange={setTicketHasChanges} /> : <ProjectEpicPage key={epicProject.id} project={epicProject} onBack={() => { setEpicProjectId(null); setEpicTaskId(null); setTicketHasChanges(false) }} onOpenStory={setEpicTaskId} onDirtyChange={setTicketHasChanges} />}</> : creatingProject ? <><AppTopbar current="New project" onOpenProject={requestOpenProject} /><NewProjectPage onBack={() => { setCreatingProject(false); setTicketHasChanges(false) }} onCreated={openProject} onDirtyChange={setTicketHasChanges} /></> : <><AppHeader onAdd={() => setCreatingProject(true)} onOpenProject={requestOpenProject} /><div className="workspace-columns"><MainWorkspace onAdd={() => setCreatingProject(true)} onAddTask={() => setAddingTask(true)} onOpenProject={requestOpenProject} /><SteeringPanel /></div></>}</div><Dialog open={Boolean(pendingNavigation)} onOpenChange={(open) => { if (!open) setPendingNavigation(null) }}><DialogContent className="modal-card leave-ticket-dialog" showCloseButton={false}><div className="modal-title"><div className="modal-mark leave-ticket-mark"><X size={17} /></div><div><DialogTitle className="modal-heading">Leave without saving?</DialogTitle><DialogDescription className="modal-description">Your changes to {epicTask?.title ?? epicProject?.name ?? 'this ticket'} will be lost if you continue.</DialogDescription></div><button className="icon-button" onClick={() => setPendingNavigation(null)} aria-label="Stay on this ticket"><X size={16} /></button></div><div className="modal-actions"><Button variant="outline" onClick={() => setPendingNavigation(null)}>Stay on ticket</Button><Button variant="destructive" onClick={() => { if (pendingNavigation) completeNavigation(pendingNavigation) }}>Discard changes and leave</Button></div></DialogContent></Dialog><AddTaskDialog open={addingTask} onOpenChange={setAddingTask} /><FloatingAssistant /></div>
}
