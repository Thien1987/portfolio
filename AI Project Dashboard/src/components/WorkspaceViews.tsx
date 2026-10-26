import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, addMonths, addWeeks, differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarWeeks, endOfDay, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfQuarter, startOfWeek, startOfYear } from 'date-fns'
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import { AlertCircle, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, Filter, GripHorizontal, GripVertical, Layers3, Pencil, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { EditTaskDialog } from '@/components/EditTaskDialog'
import { ProjectCode } from '@/components/ProjectCode'
import { TaskAssistDialog } from '@/components/TaskAssistDialog'
import { useWorkspace } from '@/lib/store'
import { getTaskStatus, isTaskClosed, TASK_STATUSES } from '@/lib/taskStatus'
import { getProjectStage, getProjectStageLabel, PROJECT_STAGES } from '@/lib/projectStage'
import { getTaskAssigneeRole } from '@/lib/teamAssignment'
import { getProjectQuarterLabel, getProjectStartDate } from '@/lib/projectSchedule'
import { getEpicKey } from '@/lib/projectKey'
import type { CalendarScale, Project, ProjectStage, Task } from '@/lib/types'

const palette: Record<string, string> = {
  indigo: 'var(--project-indigo)', emerald: 'var(--project-emerald)', amber: 'var(--project-amber)', rose: 'var(--project-rose)', sky: 'var(--project-sky)',
}
const currentMonday = () => startOfWeek(new Date(), { weekStartsOn: 1 })
const weekLabel = (date: Date) => `${format(date, 'MMM d')} – ${format(endOfWeek(date, { weekStartsOn: 1 }), 'MMM d')}`

function periodIndex(date: string, anchor: Date, scale: CalendarScale) {
  const value = parseISO(date)
  if (scale === 'day') return differenceInCalendarDays(value, anchor)
  if (scale === 'week') return differenceInCalendarWeeks(value, anchor, { weekStartsOn: 1 })
  const monthDifference = differenceInCalendarMonths(value, anchor)
  if (scale === 'quarter') return Math.floor(monthDifference / 3)
  if (scale === 'half-year') return Math.floor(monthDifference / 6)
  if (scale === 'year') return value.getFullYear() - anchor.getFullYear()
  return monthDifference
}

function periodEnd(date: Date, scale: CalendarScale) {
  if (scale === 'day') return endOfDay(date)
  if (scale === 'week') return endOfWeek(date, { weekStartsOn: 1 })
  const months = scale === 'quarter' ? 3 : scale === 'half-year' ? 6 : scale === 'year' ? 12 : 1
  return endOfMonth(addMonths(date, months - 1))
}

function addCalendarPeriods(date: Date, count: number, scale: CalendarScale) {
  return scale === 'day' ? addDays(date, count) : scale === 'week' ? addWeeks(date, count) : addMonths(date, count * (scale === 'quarter' ? 3 : scale === 'half-year' ? 6 : scale === 'year' ? 12 : 1))
}

function quarterLabel(date: Date) { return `Q${Math.floor(date.getMonth() / 3) + 1} ${format(date, 'yyyy')}` }

function RiskMarker({ projectId, reason }: { projectId: string; reason: string }) {
  const [open, setOpen] = useState(false)
  const descriptionId = `risk-details-${projectId}`
  return <button type="button" className="risk-icon" aria-label={`At risk: ${reason}`} aria-describedby={descriptionId} aria-expanded={open} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)}>
    <AlertCircle size={15} />
    <span id={descriptionId} role="tooltip" className="risk-tooltip">{reason}</span>
  </button>
}

function TimelineProjectTitle({ project, scheduledRange, onOpenProject }: { project: Project; scheduledRange: string; onOpenProject: (project: Project) => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const tooltipId = `timeline-project-tooltip-${project.id}`
  const projectStartDate = getProjectStartDate(project)
  const showTooltip = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 310
    const estimatedHeight = 185
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
    const below = rect.bottom + 8
    const top = below + estimatedHeight < window.innerHeight - 8 ? below : Math.max(8, rect.top - estimatedHeight - 8)
    setPosition({ left, top })
  }
  return <>
    <button ref={buttonRef} className="project-timeline-filter" onPointerEnter={showTooltip} onPointerLeave={() => setPosition(null)} onFocus={showTooltip} onBlur={() => setPosition(null)} onClick={() => onOpenProject(project)} aria-describedby={position ? tooltipId : undefined} aria-label={`Open epic ${getEpicKey(project)} for ${project.name}`}>
      <span className="project-name-title-line"><strong>{project.name}</strong><ProjectCode code={getEpicKey(project)} /></span>
    </button>
    {position && createPortal(<div id={tooltipId} role="tooltip" className="timeline-project-tooltip" style={position}>
      <div className="timeline-project-tooltip-heading"><strong>{project.name}</strong><ProjectCode code={getEpicKey(project)} /></div>
      <div className="timeline-project-tooltip-row"><span>Project state</span><strong>{getProjectStageLabel(project.stage, project.status)} · {project.status.replace('-', ' ')}</strong></div>
      <div className="timeline-project-tooltip-row"><span>Project starts</span><strong>{getProjectQuarterLabel(projectStartDate)} · {format(parseISO(projectStartDate), 'MMM d, yyyy')}</strong></div>
      <div className="timeline-project-tooltip-row"><span>Scheduled work</span><strong>{scheduledRange}</strong></div>
      <div className="timeline-project-tooltip-row"><span>{project.deadlineType === 'hard' ? 'Hard' : 'Flexible'} deadline</span><strong>{format(parseISO(project.deadline), 'MMM d, yyyy')}</strong></div>
    </div>, document.body)}
  </>
}

function TaskCard({ task, project, startIndex, endIndex, lane }: { task: Task; project: Project; startIndex: number; endIndex: number; lane: number }) {
  const [editOpen, setEditOpen] = useState(false)
  const [assistOpen, setAssistOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `move:${task.id}`,
    data: { kind: 'move', taskId: task.id, projectId: project.id, periodIndex: startIndex },
  })
  const resize = useDraggable({ id: `resize:${task.id}`, data: { kind: 'resize', taskId: task.id, projectId: project.id, startIndex, endIndex } })
  const style = { gridColumn: `${startIndex + 1} / ${endIndex + 2}`, gridRow: lane + 1, ['--task-color' as string]: palette[project.color], ...(transform ? { transform: CSS.Translate.toString(transform) } : {}) } as React.CSSProperties
  const resizeStyle = resize.transform ? { transform: CSS.Translate.toString(resize.transform) } : undefined
  const startCardDrag: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if ((event.target as HTMLElement).closest('button,a,input,select,textarea,.resize-drag-handle')) return
    listeners?.onPointerDown?.(event)
  }
  const tooltipId = `timeline-task-tooltip-${task.id}`
  const projectTaskStarts = project.tasks.map((item) => item.startDate).sort()
  const projectTaskEnds = project.tasks.map((item) => item.dueDate).sort()
  const projectTimeline = projectTaskStarts.length ? `${format(parseISO(projectTaskStarts[0]), 'MMM d, yyyy')} – ${format(parseISO(projectTaskEnds[projectTaskEnds.length - 1]), 'MMM d, yyyy')}` : 'No tasks scheduled'
  const taskDateRange = `${format(parseISO(task.startDate), 'MMM d, yyyy')} – ${format(parseISO(task.dueDate), 'MMM d, yyyy')}`
  const taskAssigneeRole = getTaskAssigneeRole(task, project)
  const projectStartDate = getProjectStartDate(project)
  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const width = 330
    const estimatedHeight = 250
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
    const below = rect.bottom + 8
    const top = below + estimatedHeight < window.innerHeight - 8 ? below : Math.max(8, rect.top - estimatedHeight - 8)
    setTooltipPosition({ left, top })
  }
  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    ;(event.target as HTMLElement).setAttribute('aria-describedby', tooltipId)
    showTooltip(event.currentTarget)
  }
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    ;(event.target as HTMLElement).removeAttribute('aria-describedby')
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setTooltipPosition(null)
  }
  return (
    <>
    <div ref={setNodeRef} style={style} className={cn('task-card', `task-${task.status}`, isDragging && 'task-dragging')} onPointerDown={startCardDrag} onKeyDown={(event) => listeners?.onKeyDown?.(event)} tabIndex={attributes.tabIndex} role={attributes.role} aria-describedby={attributes['aria-describedby']} aria-roledescription={attributes['aria-roledescription']} onPointerEnter={(event) => showTooltip(event.currentTarget)} onPointerLeave={() => setTooltipPosition(null)} onFocusCapture={handleFocus} onBlurCapture={handleBlur}>
      <div className="task-copy">
        <div className="task-title-line">
          {getTaskStatus(task.status).category === 'done' ? <Check size={13} /> : getTaskStatus(task.status).category === 'in-progress' ? <span className="task-dot is-progress" /> : <Circle size={12} />}
          <span>{task.title}</span>
        </div>
        <div className="task-meta"><span className={`task-state-label state-${getTaskStatus(task.status).category}`}>{getTaskStatus(task.status).label}</span><Clock3 size={11} /> {task.estimatedHours}h <span>·</span> {Math.max(1, differenceInCalendarDays(parseISO(task.dueDate), parseISO(task.startDate)) + 1)}d <span>·</span> {format(parseISO(task.dueDate), 'EEE, MMM d')}</div>
      </div>
      <div className="task-card-tools">
        <button type="button" className="task-edit-button" onClick={() => setEditOpen(true)} aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={14} /></button>
        <button type="button" className="task-ai-button" onClick={() => setAssistOpen(true)} aria-label={`Get AI help with ${task.title}`} title="Get AI help"><Sparkles size={14} /></button>
      </div>
      <button ref={resize.setNodeRef} style={resizeStyle} className="resize-drag-handle" aria-label={`Drag to resize ${task.title}`} title="Drag the right edge to resize" {...resize.listeners} {...resize.attributes}><GripHorizontal size={15} /></button>
      <EditTaskDialog task={task} project={project} open={editOpen} onOpenChange={setEditOpen} />
      <TaskAssistDialog task={task} project={project} open={assistOpen} onOpenChange={setAssistOpen} onEdit={() => setEditOpen(true)} />
    </div>
    {tooltipPosition && createPortal(<div id={tooltipId} role="tooltip" className="timeline-task-tooltip" style={tooltipPosition}>
      <div className="timeline-task-tooltip-heading"><span><ProjectCode code={task.issueKey ?? `${getEpicKey(project).split('-')[0]}-story`} /> <strong>{task.title}</strong></span><small>Story</small></div>
      <div className="timeline-task-tooltip-row"><span>Task state</span><strong>{getTaskStatus(task.status).label}</strong></div>
      <div className="timeline-task-tooltip-row"><span>Assignee</span><strong>{task.assignee ? `${taskAssigneeRole ? `${taskAssigneeRole === 'designer' ? 'Designer' : 'Developer'} · ` : ''}${task.assignee}` : 'Unassigned'}</strong></div>
      <div className="timeline-task-tooltip-row"><span>Schedule · {task.estimatedHours}h</span><strong>{taskDateRange}</strong></div>
      <div className="timeline-task-tooltip-row"><span>Project state</span><strong>{getProjectStageLabel(project.stage, project.status)} · {project.status.replace('-', ' ')}</strong></div>
      <div className="timeline-task-tooltip-row"><span>Project starts</span><strong>{getProjectQuarterLabel(projectStartDate)} · {format(parseISO(projectStartDate), 'MMM d, yyyy')}</strong></div>
      <div className="timeline-task-tooltip-row"><span>Project timeline</span><strong>{projectTimeline}</strong></div>
      <div className="timeline-task-tooltip-row"><span>{project.deadlineType === 'hard' ? 'Hard' : 'Flexible'} deadline</span><strong>{format(parseISO(project.deadline), 'MMM d, yyyy')}</strong></div>
    </div>, document.body)}
    </>
  )
}

function WeekDrop({ periodIndex: index, periodCount, projectId, children }: { periodIndex: number; periodCount: number; projectId: string; children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `period-${projectId}-${index}`, data: { periodIndex: index, projectId } })
  return <div ref={setNodeRef} style={{ left: `${index * (100 / periodCount)}%`, width: `${100 / periodCount}%` }} className={cn('timeline-week-cell', isOver && 'is-over')}>{children}</div>
}

export function TimelineProjectFilter() {
  const { plan, timelineProjectFilter, setTimelineProjectFilter, selectedProject, selectProject } = useWorkspace()
  const [draftVisibleIds, setDraftVisibleIds] = useState<Set<string> | null>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const projects = plan.projects
  const visibleIds = new Set(projects.filter((project) => timelineProjectFilter === null || timelineProjectFilter.includes(project.id)).map((project) => project.id))
  const selectedIds = draftVisibleIds ?? visibleIds
  const onToggle = (id: string, checked: boolean) => {
    setDraftVisibleIds((current) => {
      const next = new Set(current ?? visibleIds)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  const onSetAll = (checked: boolean) => {
    setDraftVisibleIds(checked ? new Set(projects.map((project) => project.id)) : new Set())
  }
  const saveSelection = () => {
    const next = selectedIds.size === projects.length ? null : [...selectedIds]
    setTimelineProjectFilter(next)
    if (selectedProject) selectProject(null)
    setDraftVisibleIds(null)
    if (detailsRef.current) detailsRef.current.open = false
  }
  const allVisible = selectedIds.size === projects.length
  return <details ref={detailsRef} className="timeline-project-filter" onToggle={(event) => { if (event.currentTarget.open) setDraftVisibleIds(new Set(visibleIds)) }}>
    <summary className="timeline-project-filter-trigger"><Filter size={14} /><span>Projects</span><small>{visibleIds.size}/{projects.length}</small><ChevronDown size={13} /></summary>
    <div className="timeline-project-filter-menu" id="timeline-project-filter-menu" role="group" aria-label="Filter timeline by project">
      <div className="timeline-project-filter-menu-head"><strong>Show projects</strong><div><button type="button" onClick={() => onSetAll(true)}>All</button><button type="button" onClick={() => onSetAll(false)}>Clear</button></div></div>
      <div className="timeline-project-filter-options">{projects.map((project) => <label className="timeline-project-filter-option" key={project.id}>
        <input type="checkbox" checked={selectedIds.has(project.id)} onChange={(event) => onToggle(project.id, event.target.checked)} />
        <i style={{ backgroundColor: palette[project.color] }} />
        <span>{project.name}</span><ProjectCode code={getEpicKey(project)} />
      </label>)}</div>
      <div className="timeline-project-filter-footer"><span>{allVisible ? 'All projects selected' : `${selectedIds.size} of ${projects.length} selected`} · Save to apply</span><button type="button" className="timeline-project-filter-save" onClick={saveSelection}>Save</button></div>
    </div>
  </details>
}

export function TimelineView({ onOpenProject }: { onOpenProject: (project: Project) => void }) {
  const { plan, calendarScale: scale, selectedProject, selectProject, timelineProjectFilter, setTimelineProjectFilter, moveTaskByPeriod, resizeTaskToDate } = useWorkspace()
  const periodCount = scale === 'day' ? 14 : scale === 'week' || scale === 'month' ? 6 : scale === 'quarter' ? 4 : scale === 'half-year' ? 2 : 5
  const anchor = useMemo(() => {
    const now = new Date()
    if (scale === 'day' || scale === 'week') return currentMonday()
    if (scale === 'month') return startOfMonth(now)
    if (scale === 'quarter') return startOfQuarter(now)
    if (scale === 'half-year') return addMonths(startOfYear(now), Math.floor(now.getMonth() / 6) * 6)
    return startOfYear(now)
  }, [scale])
  const periods = useMemo(() => Array.from({ length: periodCount }, (_, index) => addCalendarPeriods(anchor, index, scale)), [anchor, periodCount, scale])
  const visibleProjectIds = new Set(plan.projects.filter((project) => timelineProjectFilter === null || timelineProjectFilter.includes(project.id)).map((project) => project.id))
  const projects = plan.projects.filter((project) => visibleProjectIds.has(project.id))
  const setProjectVisibility = (id: string, checked: boolean) => {
    const next = new Set(visibleProjectIds)
    if (checked) next.add(id)
    else next.delete(id)
    setTimelineProjectFilter(next.size === plan.projects.length ? null : [...next])
    if (selectedProject) selectProject(null)
  }
  const [resizePreview, setResizePreview] = useState<{ taskId: string; periodIndex: number } | null>(null)
  const resizeOrigin = useRef<{ taskId: string; endIndex: number } | null>(null)
  const panOrigin = useRef<{ pointerId: number; x: number; scrollLeft: number; didPan: boolean } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const [canPan, setCanPan] = useState(false)
  useEffect(() => {
    const element = timelineScrollRef.current
    if (!element) return
    const measureOverflow = () => setCanPan(element.scrollWidth > element.clientWidth + 1)
    measureOverflow()
    const observer = new ResizeObserver(measureOverflow)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    return () => observer.disconnect()
  }, [periodCount, scale, projects.length])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))
  const handleDragStart = (event: DragStartEvent) => {
    const active = event.active.data.current
    resizeOrigin.current = active?.kind === 'resize' && typeof active.taskId === 'string' && typeof active.endIndex === 'number'
      ? { taskId: active.taskId, endIndex: active.endIndex }
      : null
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setResizePreview(null)
    const origin = resizeOrigin.current
    resizeOrigin.current = null
    if (!event.over) return
    const active = event.active.data.current
    const over = event.over.data.current
    const originalEndIndex = origin && origin.taskId === active?.taskId ? origin.endIndex : active?.endIndex
    if (active?.kind === 'resize' && typeof active.taskId === 'string' && typeof originalEndIndex === 'number' && typeof over?.periodIndex === 'number' && over.periodIndex !== originalEndIndex) {
      const targetPeriod = periods[over.periodIndex]
      if (targetPeriod && over.projectId === active.projectId && over.periodIndex >= Number(active.startIndex)) resizeTaskToDate(active.taskId, format(periodEnd(targetPeriod, scale), 'yyyy-MM-dd'))
    } else if (active?.kind === 'move' && typeof active.taskId === 'string' && typeof active.periodIndex === 'number' && typeof over?.periodIndex === 'number' && typeof over.projectId === 'string' && (active.periodIndex !== over.periodIndex || active.projectId !== over.projectId)) {
      moveTaskByPeriod(active.taskId, over.projectId, over.periodIndex - active.periodIndex, scale)
    }
  }
  const handleDragOver = (event: DragOverEvent) => {
    const active = event.active.data.current
    const over = event.over?.data.current
    if (active?.kind !== 'resize') return
    if (typeof active.taskId === 'string' && typeof over?.periodIndex === 'number' && over.projectId === active.projectId && over.periodIndex >= Number(active.startIndex)) setResizePreview({ taskId: active.taskId, periodIndex: over.periodIndex })
    else setResizePreview(null)
  }
  const handlePanStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canPan || event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('button, a, input, select, textarea, .task-card')) return
    panOrigin.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft, didPan: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePanMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = panOrigin.current
    if (!origin || origin.pointerId !== event.pointerId) return
    const delta = event.clientX - origin.x
    if (!origin.didPan && Math.abs(delta) < 4) return
    origin.didPan = true
    setIsPanning(true)
    event.currentTarget.scrollLeft = origin.scrollLeft - delta
    event.preventDefault()
  }
  const handlePanEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panOrigin.current?.pointerId !== event.pointerId) return
    panOrigin.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragCancel={() => { setResizePreview(null); resizeOrigin.current = null }} onDragEnd={handleDragEnd}>
    <div ref={timelineScrollRef} className={cn('timeline-scroll', canPan && 'can-pan', isPanning && 'is-panning')} role="region" aria-label="Scrollable project timeline. Focus and use the left and right arrow keys to scroll, or drag empty calendar space when the timeline extends beyond the view." tabIndex={0} onPointerDown={handlePanStart} onPointerMove={handlePanMove} onPointerUp={handlePanEnd} onPointerCancel={handlePanEnd} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.currentTarget.scrollBy({ left: event.key === 'ArrowLeft' ? -120 : 120, behavior: 'smooth' }); event.preventDefault() } }}>
      <div className="timeline-grid" style={{ gridTemplateColumns: `minmax(236px, 0.85fr) repeat(${periodCount}, minmax(${scale === 'day' ? 110 : 148}px, 1fr))`, width: `max(100%, ${236 + periodCount * (scale === 'day' ? 110 : 148)}px)` }}>
        <div className="timeline-corner"><span>PROJECT / TASK</span><small>Drag a bar to move it · drag its end to resize</small></div>
        {periods.map((period, index) => {
          const totalHours = projects.flatMap((project) => project.tasks).filter((task) => periodIndex(task.startDate, anchor, scale) === index && !isTaskClosed(task.status)).reduce((sum, task) => sum + task.estimatedHours, 0)
          const todayIndex = periodIndex(format(new Date(), 'yyyy-MM-dd'), anchor, scale)
          const isCurrent = index === todayIndex
          const dateLabel = scale === 'day' ? format(period, 'EEE, MMM d') : scale === 'week' ? weekLabel(period) : scale === 'quarter' ? quarterLabel(period) : scale === 'half-year' ? `${format(period, 'MMM')}–${format(addMonths(period, 5), 'MMM yyyy')}` : scale === 'year' ? format(period, 'yyyy') : format(period, 'MMMM yyyy')
          const periodLabel = scale === 'day' ? format(period, 'EEEE').toUpperCase() : scale === 'week' ? (isCurrent ? 'THIS WEEK' : `WEEK ${index + 1}`) : scale === 'month' ? `MONTH ${index + 1}` : scale === 'quarter' ? `QUARTER ${index + 1}` : scale === 'half-year' ? `6 MONTHS · ${index + 1}` : 'YEAR'
          return <div key={index} className={cn('timeline-week-head', isCurrent && 'current-week')}>
            <div className="week-head-top"><span>{periodLabel}</span>{isCurrent && <span className="today-chip">{scale === 'day' ? 'TODAY' : 'NOW'}</span>}</div>
            <strong>{dateLabel}</strong>
            <div className="week-load"><span className={cn(scale === 'week' && totalHours > plan.steering.weeklyCapacity && 'load-over')}>{totalHours}h</span><span>{scale === 'week' ? ` / ${plan.steering.weeklyCapacity}h capacity` : ' scheduled'}</span></div>
          </div>
        })}
        {projects.length === 0 && <div className="timeline-empty"><Layers3 size={22} /><strong>No projects to show</strong><span>Select one or more projects in the project filter to show them on your timeline.</span></div>}
        {projects.map((project) => {
          const projectTasks = project.tasks.filter((task) => periodIndex(task.dueDate, anchor, scale) >= 0 && periodIndex(task.startDate, anchor, scale) < periodCount)
          const placed = projectTasks.map((task) => {
            const startIndex = Math.max(0, periodIndex(task.startDate, anchor, scale))
            const dueIndex = Math.max(startIndex, Math.min(periodCount - 1, periodIndex(task.dueDate, anchor, scale)))
            const endIndex = Math.max(startIndex, Math.min(periodCount - 1, resizePreview?.taskId === task.id ? resizePreview.periodIndex : dueIndex))
            return { task, startIndex, endIndex, lane: 0 }
          }).sort((a, b) => a.startIndex - b.startIndex || a.endIndex - b.endIndex)
          const laneEnds: number[] = []
          placed.forEach((item) => {
            let lane = laneEnds.findIndex((end) => end < item.startIndex)
            if (lane < 0) lane = laneEnds.length
            item.lane = lane
            laneEnds[lane] = item.endIndex
          })
          const laneCount = Math.max(2, laneEnds.length)
          const rowHeight = laneCount * 60
          const deadlineIndex = periodIndex(project.deadline, anchor, scale)
          const done = project.tasks.filter((task) => isTaskClosed(task.status)).length
          const unfinishedTasks = project.tasks.filter((task) => !isTaskClosed(task.status))
          const remainingHours = unfinishedTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
          const daysToDeadline = differenceInCalendarDays(parseISO(project.deadline), new Date())
          const scheduledStarts = project.tasks.map((task) => task.startDate).sort()
          const scheduledEnds = project.tasks.map((task) => task.dueDate).sort()
          const scheduledRange = scheduledStarts.length ? `${format(parseISO(scheduledStarts[0]), 'MMM d, yyyy')} – ${format(parseISO(scheduledEnds[scheduledEnds.length - 1]), 'MMM d, yyyy')}` : 'No tasks scheduled'
          const deadlineContext = daysToDeadline < 0 ? `${Math.abs(daysToDeadline)} days past its deadline` : `due in ${daysToDeadline} days`
          const riskReason = remainingHours
            ? `${remainingHours}h across ${unfinishedTasks.length} unfinished tasks remain, and the ${project.deadlineType} deadline is ${deadlineContext}.`
            : 'This project is marked at risk. Review its status and upcoming milestones.'
          return <div className="project-timeline-row" key={project.id} style={{ ['--project-color' as string]: palette[project.color], gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', gridTemplateRows: '1fr', height: `${rowHeight}px` } as React.CSSProperties}>
            <div className="project-timeline-name" style={{ height: `${rowHeight}px` }}>
              <div className="project-timeline-name-main">
                <button className="project-visibility-toggle" type="button" role="checkbox" aria-checked={visibleProjectIds.has(project.id)} onClick={() => setProjectVisibility(project.id, !visibleProjectIds.has(project.id))} aria-label={`${visibleProjectIds.has(project.id) ? 'Hide' : 'Show'} ${project.name} on the timeline`} title={`${visibleProjectIds.has(project.id) ? 'Hide' : 'Show'} project on timeline`}><span>{visibleProjectIds.has(project.id) && <Check size={11} />}</span></button>
                <span className="project-color-dot" />
                <span className="project-name-copy">
                  <TimelineProjectTitle project={project} scheduledRange={scheduledRange} onOpenProject={onOpenProject} />
                  <span className="project-name-meta"><small>{done}/{project.tasks.length} tasks resolved</small>{project.status === 'at-risk' && <RiskMarker projectId={project.id} reason={riskReason} />}</span>
                </span>
              </div>
            </div>
            <div className="project-timeline-track" style={{ gridColumn: '2 / -1', gridTemplateColumns: `repeat(${periodCount}, minmax(${scale === 'day' ? 110 : 148}px, 1fr))`, gridTemplateRows: `repeat(${laneCount}, 60px)`, height: `${rowHeight}px` }}>
              {periods.map((_, periodIndexValue) => <WeekDrop key={periodIndexValue} projectId={project.id} periodIndex={periodIndexValue} periodCount={periodCount}>
                {deadlineIndex === periodIndexValue && <div className="deadline-marker"><span aria-hidden="true">◆</span> {project.deadlineType === 'hard' ? 'Hard' : 'Flexible'} deadline</div>}
              </WeekDrop>)}
              {placed.map(({ task, startIndex, endIndex, lane }) => <TaskCard key={task.id} task={task} project={project} startIndex={startIndex} endIndex={endIndex} lane={lane} />)}
            </div>
          </div>
        })}
      </div>
    </div>
    </DndContext>
  )
}

function SortableProject({ project, onOpenProject }: { project: Project; onOpenProject: (project: Project) => void }) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })
  const style = { transform: CSS.Transform.toString(transform), transition, ['--project-color' as string]: palette[project.color] } as React.CSSProperties
  const move = useWorkspace((state) => state.changeTaskStatus)
  const updateProject = useWorkspace((state) => state.updateProject)
  const projectStartDate = getProjectStartDate(project)
  return <Card ref={setNodeRef} style={style} className={cn('board-project-card', isDragging && 'board-dragging')}>
    <div className="board-project-head">
      <button {...attributes} {...listeners} className="board-grab" aria-label={`Reorder ${project.name}`}><GripVertical size={16} /></button>
      <button className="board-expand" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={`project-work-${project.id}`} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${project.name} work items`}>{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>
      <span className="project-color-dot" />
      <button type="button" className="board-project-title" onClick={() => onOpenProject(project)} title={`Open epic ${getEpicKey(project)}`} aria-label={`Open epic ${getEpicKey(project)} for ${project.name}`}>{project.name}</button>
      <ProjectCode code={getEpicKey(project)} className="board-project-code" />
      <button className="project-epic-button" onClick={() => onOpenProject(project)} aria-label={`Open epic ${getEpicKey(project)} for ${project.name}`} title={`Open epic ${getEpicKey(project)}`}><BookOpen size={13} /> Epic</button>
      <select className="board-inline-select board-stage-select" value={getProjectStage(project.stage, project.status)} onChange={(event) => updateProject(project.id, { stage: event.target.value as ProjectStage })} aria-label={`${project.name} project stage`} title={PROJECT_STAGES.find((item) => item.value === getProjectStage(project.stage, project.status))?.description}>
        {PROJECT_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
      </select>
      <select className="board-inline-select" value={project.priority} onChange={(event) => updateProject(project.id, { priority: event.target.value as Project['priority'] })} aria-label={`${project.name} priority`} title="Set project priority">
        {(['urgent', 'high', 'medium', 'low'] as Project['priority'][]).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
    </div>
    {expanded && <div id={`project-work-${project.id}`} className="board-project-content"><p className="board-summary">{project.summary}</p><div className="board-task-list">
      {project.tasks.map((task) => <div className="board-task-row" key={task.id}>
        <div className="board-task-copy"><strong className={cn(isTaskClosed(task.status) && 'is-done')}>{task.title}</strong><small>{task.estimatedHours}h · due {format(parseISO(task.dueDate), 'MMM d')}</small></div>
        <select className={`board-task-status status-${getTaskStatus(task.status).category}`} value={task.status} onChange={(event) => move(task.id, event.target.value as Task['status'])} aria-label={`Status for ${task.title}`} title={`Status: ${getTaskStatus(task.status).label}`}>
          {TASK_STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
        </select>
        {task.vague && <Badge variant="secondary" className="small-badge">Broad</Badge>}
      </div>)}
    </div></div>}
    <div className="board-footer"><span title={`${project.tasks.length} ${project.tasks.length === 1 ? 'story' : 'stories'} · ${getProjectQuarterLabel(projectStartDate)} start · ${project.deadlineType} project deadline`}><CalendarDays size={13} /> {project.tasks.length} {project.tasks.length === 1 ? 'story' : 'stories'} · {getProjectQuarterLabel(projectStartDate)} · {format(parseISO(projectStartDate), 'MMM d')}–{format(parseISO(project.deadline), 'MMM d')}</span><span className="board-footer-end"><span className="board-health-label">Health</span><span className={cn('status-label', `status-${project.status}`)}>{project.status.replace('-', ' ')}</span><select className="deadline-type-select" aria-label={`${project.name} deadline type`} value={project.deadlineType} onChange={(event) => updateProject(project.id, { deadlineType: event.target.value as Project['deadlineType'] })}><option value="hard">Hard deadline</option><option value="flexible">Flexible</option></select></span></div>
  </Card>
}

export function BoardView({ onOpenProject }: { onOpenProject: (project: Project) => void }) {
  const plan = useWorkspace((state) => state.plan)
  const reorderProjects = useWorkspace((state) => state.reorderProjects)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  return <DndContext sensors={sensors} onDragEnd={({ active, over }) => { if (over && active.id !== over.id) reorderProjects(String(active.id), String(over.id)) }}>
    <SortableContext items={plan.projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
      <div className="board-list">{plan.projects.map((project) => <SortableProject key={project.id} project={project} onOpenProject={onOpenProject} />)}</div>
    </SortableContext>
  </DndContext>
}

type WeekItem = { project: Project; task: Task }
type WeekSectionDefinition = { id: string; label: string; status: Task['status'][]; dropStatus: Task['status'] }
const defaultWeekSections: WeekSectionDefinition[] = [
  { id: 'draft', label: 'Draft', status: ['draft'], dropStatus: 'draft' },
  { id: 'todo', label: 'To do', status: ['todo'], dropStatus: 'todo' },
  { id: 'in-progress', label: 'In progress', status: ['in-progress'], dropStatus: 'in-progress' },
  { id: 'blocked', label: 'Blocked', status: ['blocked'], dropStatus: 'blocked' },
  { id: 'in-review', label: 'In review', status: ['in-review'], dropStatus: 'in-review' },
  { id: 'done', label: 'Done', status: ['done'], dropStatus: 'done' },
]

function WeekTaskCard({ project, task, onOpenProject, onStatusChange, statuses }: WeekItem & { onOpenProject: (project: Project) => void; onStatusChange: (taskId: string, status: Task['status']) => void; statuses: WeekSectionDefinition[] }) {
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.45 : undefined } as React.CSSProperties
  const startCardDrag: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if ((event.target as HTMLElement).closest('button,select,input,textarea,a,label')) return
    listeners?.onPointerDown?.(event)
  }
  return <Card ref={setNodeRef} style={style} className="week-task-card" onPointerDown={startCardDrag}>
    <div className="week-task-project"><span className="week-task-project-name"><i style={{ backgroundColor: palette[project.color] }} />{project.name}<ProjectCode code={getEpicKey(project)} className="week-project-code" /></span><button className="week-epic-link" onClick={() => onOpenProject(project)} aria-label={`Open epic ${getEpicKey(project)} for ${project.name}`}>Epic</button></div>
    <div className="week-task-title-row"><strong>{task.title}</strong></div>
    <div className="week-task-meta"><span><Clock3 size={12} /> {task.estimatedHours}h</span><span>Due {format(parseISO(task.dueDate), 'EEE, MMM d')}</span></div>
    <label className="week-task-status-control"><span>Status</span><select value={statuses.find((status) => status.status.includes(task.status))?.dropStatus ?? task.status} onChange={(event) => onStatusChange(task.id, event.target.value as Task['status'])} aria-label={`Change status for ${task.title}; it will move to the matching section`} title="Changing status moves this task to the matching column">{statuses.map((status) => <option value={status.dropStatus} key={status.id}>{status.label}</option>)}</select></label>
  </Card>
}

function WeekDropSection({ definition, items, onOpenProject, onStatusChange, statuses, onMoveColumn, isFirst, isLast }: { definition: WeekSectionDefinition; items: WeekItem[]; onOpenProject: (project: Project) => void; onStatusChange: (taskId: string, status: Task['status']) => void; statuses: WeekSectionDefinition[]; onMoveColumn: (id: string, direction: -1 | 1) => void; isFirst: boolean; isLast: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: definition.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : undefined, zIndex: isDragging ? 2 : undefined }
  return <section ref={setNodeRef} style={style} className={`week-column week-column-${definition.id}${isOver ? ' is-drop-target' : ''}`} aria-label={`${definition.label} tasks`}>
    <div className="week-column-head"><div className="week-column-heading"><button className="week-column-drag" {...attributes} {...listeners} aria-label={`Drag to reorder ${definition.label} column`} title="Drag to reorder column"><GripHorizontal size={16} /></button><div className="week-column-title"><h3>{definition.label}</h3><Badge variant="secondary">{items.length}</Badge></div></div><div className="week-column-actions"><button className="week-column-arrow" onClick={() => onMoveColumn(definition.id, -1)} disabled={isFirst} aria-label={`Move ${definition.label} column left`} title="Move column left"><ChevronLeft size={15} /></button><button className="week-column-arrow" onClick={() => onMoveColumn(definition.id, 1)} disabled={isLast} aria-label={`Move ${definition.label} column right`} title="Move column right"><ChevronRight size={15} /></button></div></div>
    {items.length ? items.map(({ project, task }) => <WeekTaskCard key={task.id} project={project} task={task} onOpenProject={onOpenProject} onStatusChange={onStatusChange} statuses={statuses} />) : <div className="week-empty">Drag and drop here</div>}
  </section>
}

export function WeekView({ onOpenProject }: { onOpenProject: (project: Project) => void }) {
  const { plan, changeTaskStatus, updateSteering, addWeekStatus, reorderWeekColumns } = useWorkspace()
  const [capacityDialogOpen, setCapacityDialogOpen] = useState(false)
  const [capacityDraft, setCapacityDraft] = useState(String(plan.steering.weeklyCapacity))
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState('')
  const [statusError, setStatusError] = useState('')
  const baseSections: WeekSectionDefinition[] = [...defaultWeekSections, ...(plan.weekStatuses ?? []).map(({ value, label }) => ({ id: value, label, status: [value], dropStatus: value }))]
  const savedColumnOrder = plan.weekColumnOrder ?? []
  const weekSections = [...baseSections].sort((a, b) => {
    const aIndex = savedColumnOrder.indexOf(a.id), bIndex = savedColumnOrder.indexOf(b.id)
    if (aIndex < 0 && bIndex < 0) return baseSections.indexOf(a) - baseSections.indexOf(b)
    if (aIndex < 0) return 1
    if (bIndex < 0) return -1
    return aIndex - bIndex
  })
  const activeProjects = plan.projects.filter((project) => project.status !== 'paused' && project.status !== 'complete')
  const monday = currentMonday()
  const weekEnd = endOfWeek(monday, { weekStartsOn: 1 })
  const tasks: WeekItem[] = activeProjects.flatMap((project) => project.tasks.filter((task) => parseISO(task.startDate) <= weekEnd && parseISO(task.dueDate) >= monday).map((task) => ({ project, task })))
  const projectsThisWeek = activeProjects.filter((project) => project.tasks.some((task) => parseISO(task.startDate) <= weekEnd && parseISO(task.dueDate) >= monday))
  const planned = tasks.filter(({ task }) => !isTaskClosed(task.status) && task.status !== 'blocked').reduce((sum, item) => sum + item.task.estimatedHours, 0)
  const groups = weekSections.map((definition) => ({ definition, items: tasks.filter(({ task }) => definition.status.includes(task.status)) }))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const activeColumn = weekSections.find((item) => item.id === String(active.id))
    const overColumn = weekSections.find((item) => item.id === String(over.id))
    if (activeColumn && overColumn) {
      const from = weekSections.findIndex((item) => item.id === activeColumn.id), to = weekSections.findIndex((item) => item.id === overColumn.id)
      if (from !== to) reorderWeekColumns(arrayMove(weekSections, from, to).map((item) => item.id))
      return
    }
    if (overColumn) changeTaskStatus(String(active.id), overColumn.dropStatus)
  }
  const moveColumn = (id: string, direction: -1 | 1) => {
    const from = weekSections.findIndex((section) => section.id === id)
    const to = from + direction
    if (from < 0 || to < 0 || to >= weekSections.length) return
    reorderWeekColumns(arrayMove(weekSections, from, to).map((section) => section.id))
  }
  const saveStatus = () => {
    const label = statusDraft.trim().replace(/\s+/g, ' ')
    if (!label) { setStatusError('Enter a name for this status.'); return }
    if (weekSections.some((section) => section.label.toLocaleLowerCase() === label.toLocaleLowerCase())) { setStatusError('A status with this name already exists.'); return }
    addWeekStatus(label)
    setStatusDraft('')
    setStatusError('')
    setStatusDialogOpen(false)
  }
  const saveCapacity = () => {
    const value = Number(capacityDraft)
    if (!Number.isFinite(value) || value < 1 || value > 168) return
    updateSteering({ weeklyCapacity: Math.round(value) })
    setCapacityDialogOpen(false)
  }
  return <div className="week-view">
    <Card className="week-capacity-card">
      <div className="week-capacity-left">
        <div className="eyebrow">HOURS PLANNED THIS WEEK</div>
        <div className="week-capacity-metrics"><div className="week-capacity-figure"><strong>{planned}h</strong><span>planned</span></div><div className="week-capacity-limit"><span>Capacity</span><strong>{plan.steering.weeklyCapacity}h</strong><Button variant="outline" size="sm" className="week-capacity-edit" onClick={() => { setCapacityDraft(String(plan.steering.weeklyCapacity)); setCapacityDialogOpen(true) }}><Pencil size={13} /> Edit</Button></div></div>
        <p>{planned > plan.steering.weeklyCapacity ? `${planned - plan.steering.weeklyCapacity}h above capacity` : `${plan.steering.weeklyCapacity - planned}h capacity remaining`}</p>
        <div className="week-capacity-meter" role="img" aria-label={`${planned} of ${plan.steering.weeklyCapacity} weekly capacity hours planned`}><span style={{ width: `${Math.min(100, planned / plan.steering.weeklyCapacity * 100)}%` }} className={planned > plan.steering.weeklyCapacity ? 'is-over' : ''} /></div>
        <div className="week-capacity-meter-labels"><span>Planned effort</span><span>{planned}h of {plan.steering.weeklyCapacity}h</span></div>
      </div>
      <div className="week-projects-planned"><h3>Projects planned this week</h3>{projectsThisWeek.length ? <ul>{projectsThisWeek.map((project) => <li key={project.id}><i style={{ backgroundColor: palette[project.color] }} />{project.name}</li>)}</ul> : <p>No projects scheduled this week</p>}</div>
    </Card>
    <Dialog open={capacityDialogOpen} onOpenChange={setCapacityDialogOpen}><DialogContent className="modal-card week-capacity-dialog" showCloseButton>
      <div className="modal-title"><div><DialogTitle className="modal-heading">Edit weekly capacity</DialogTitle><DialogDescription className="modal-description">Set the number of hours available for planned work each week.</DialogDescription></div></div>
      <label className="form-field">Hours per week<Input autoFocus type="number" min="1" max="168" step="1" value={capacityDraft} onChange={(event) => setCapacityDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveCapacity() }} aria-label="Weekly capacity in hours" /></label>
      <div className="modal-actions"><Button variant="outline" onClick={() => setCapacityDialogOpen(false)}>Cancel</Button><Button onClick={saveCapacity} disabled={!capacityDraft || Number(capacityDraft) < 1 || Number(capacityDraft) > 168}>Save capacity</Button></div>
    </DialogContent></Dialog>
    <Dialog open={statusDialogOpen} onOpenChange={(open) => { setStatusDialogOpen(open); if (!open) setStatusError('') }}><DialogContent className="modal-card week-capacity-dialog" showCloseButton>
      <div className="modal-title"><div><DialogTitle className="modal-heading">Create a task status</DialogTitle><DialogDescription className="modal-description">Add a workflow column to This week. Tasks can be moved here from their status menu or by dragging.</DialogDescription></div></div>
      <label className="form-field">Status name<Input autoFocus value={statusDraft} maxLength={32} onChange={(event) => { setStatusDraft(event.target.value); setStatusError('') }} onKeyDown={(event) => { if (event.key === 'Enter') saveStatus() }} aria-label="New task status name" aria-invalid={Boolean(statusError)} /></label>
      {statusError && <p className="form-error" role="alert">{statusError}</p>}
      <div className="modal-actions"><Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button><Button onClick={saveStatus}><Plus size={14} /> Create status</Button></div>
    </DialogContent></Dialog>
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="week-board-actions"><span>Task workflow</span><Button variant="outline" size="sm" onClick={() => { setStatusDraft(''); setStatusError(''); setStatusDialogOpen(true) }}><Plus size={14} /> Add status</Button></div>
      <SortableContext items={weekSections.map((section) => section.id)} strategy={rectSortingStrategy}><div className="week-columns">{groups.map((group, index) => <WeekDropSection key={group.definition.id} definition={group.definition} items={group.items} onOpenProject={onOpenProject} onStatusChange={changeTaskStatus} statuses={weekSections} onMoveColumn={moveColumn} isFirst={index === 0} isLast={index === groups.length - 1} />)}</div></SortableContext>
    </DndContext>
    <div className="week-tip"><Sparkles size={15} /><span>Tasks scheduled this week appear from every active project. Drag a task card into a workflow section, or use its status selector to move it with the keyboard.</span><ArrowRight size={14} /></div>
  </div>
}
