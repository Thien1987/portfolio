import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { ArrowRight, ListTodo, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useWorkspace } from '@/lib/store'
import { TASK_STATUSES } from '@/lib/taskStatus'
import { TeamAssigneeCombobox } from '@/components/TeamAssigneeCombobox'
import type { Project, Task, TaskAssigneeRole } from '@/lib/types'

export function AddStoryDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (open: boolean) => void }) {
  const addTask = useWorkspace((state) => state.addTask)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [assigneeRole, setAssigneeRole] = useState<TaskAssigneeRole | ''>('')
  const [hours, setHours] = useState('2')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'))
  const [status, setStatus] = useState<Task['status']>('todo')

  const close = () => onOpenChange(false)
  const create = () => {
    if (!title.trim()) return
    addTask({ id: crypto.randomUUID(), projectId: project.id, title: title.trim(), assignee: assignee.trim() || undefined, assigneeRole: assignee.trim() ? assigneeRole || undefined : undefined, estimatedHours: Math.max(0.5, Number(hours) || 1), startDate, dueDate: dueDate < startDate ? startDate : dueDate, status, dependencies: [] })
    setTitle('')
    setAssignee('')
    setAssigneeRole('')
    setHours('2')
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
    setDueDate(format(addDays(new Date(), 2), 'yyyy-MM-dd'))
    setStatus('todo')
    close()
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="modal-card task-modal" showCloseButton={false}>
    <div className="modal-title"><div className="modal-mark"><ListTodo size={18} /></div><div><DialogTitle className="modal-heading">Add a story</DialogTitle><DialogDescription className="modal-description">Create a work item linked to {project.name} · {project.epic?.key}.</DialogDescription></div><button className="icon-button" onClick={close} aria-label="Close"><X size={16} /></button></div>
    <div className="add-task-form">
      <label className="form-field task-form-field">Story title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Design the first-run experience" /></label>
      <label className="form-field task-form-field">Assignee · Designer or Developer<TeamAssigneeCombobox project={project} id={`new-story-assignee-${project.id}`} value={assignee} role={assigneeRole} onChange={(name, memberRole) => { setAssignee(name); setAssigneeRole(memberRole) }} /></label>
      <label className="form-field task-form-field">Workflow stage<select value={status} onChange={(event) => setStatus(event.target.value as Task['status'])}>{TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <fieldset className="task-schedule-group"><legend>Schedule and effort</legend><div className="task-form-row">
        <label className="form-field task-form-field">Starts<input type="date" value={startDate} max={dueDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="form-field task-form-field">Due date<input type="date" value={dueDate} min={startDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        <label className="form-field task-form-field">Effort · hours<input type="number" min="0.5" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} /></label>
      </div><p className="task-form-hint">The new story will appear in this epic and on the shared timeline.</p></fieldset>
    </div>
    <div className="modal-actions task-modal-actions"><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={create} disabled={!title.trim() || Boolean(assignee.trim() && !assigneeRole)}>Add story <ArrowRight size={14} /></Button></div>
  </DialogContent></Dialog>
}
