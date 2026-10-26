import { useEffect, useState } from 'react'
import { AlertTriangle, ListTodo, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useWorkspace } from '@/lib/store'
import { TASK_STATUSES } from '@/lib/taskStatus'
import { getTaskAssigneeRole } from '@/lib/teamAssignment'
import { TeamAssigneeCombobox } from '@/components/TeamAssigneeCombobox'
import type { Project, Task, TaskAssigneeRole } from '@/lib/types'

export function EditTaskDialog({ task, project, open, onOpenChange }: {
  task: Task
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateTask = useWorkspace((state) => state.updateTask)
  const deleteTask = useWorkspace((state) => state.deleteTask)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draft, setDraft] = useState<{ title: string; assignee: string; assigneeRole: TaskAssigneeRole | ''; hours: string; startDate: string; dueDate: string; status: Task['status'] }>({
    title: task.title,
    assignee: task.assignee ?? '',
    assigneeRole: getTaskAssigneeRole(task, project) ?? '',
    hours: String(task.estimatedHours),
    startDate: task.startDate,
    dueDate: task.dueDate,
    status: task.status,
  })

  useEffect(() => {
    if (open) {
      setConfirmingDelete(false)
      setDraft({ title: task.title, assignee: task.assignee ?? '', assigneeRole: getTaskAssigneeRole(task, project) ?? '', hours: String(task.estimatedHours), startDate: task.startDate, dueDate: task.dueDate, status: task.status })
    }
  }, [open, task])

  const save = () => {
    const title = draft.title.trim()
    if (!title) return
    updateTask(task.id, {
      title,
      assignee: draft.assignee.trim() || undefined,
      assigneeRole: draft.assignee.trim() ? draft.assigneeRole || undefined : undefined,
      estimatedHours: Math.max(0.5, Number(draft.hours) || 1),
      startDate: draft.startDate,
      dueDate: draft.dueDate < draft.startDate ? draft.startDate : draft.dueDate,
      status: draft.status,
    })
    onOpenChange(false)
  }

  const remove = () => {
    deleteTask(task.id)
    onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="modal-card task-modal edit-task-modal" showCloseButton={false}>
    <div className="modal-title"><div className="modal-mark"><ListTodo size={18} /></div><div><DialogTitle className="modal-heading">Edit task</DialogTitle><DialogDescription className="modal-description">Update the details for {project.name}.</DialogDescription></div><button className="icon-button" onClick={() => onOpenChange(false)} aria-label="Close"><X size={16} /></button></div>
    {confirmingDelete ? <div className="task-delete-confirmation"><div className="task-delete-warning-icon"><AlertTriangle size={19} /></div><div><h3>Delete this task?</h3><p><strong>{task.title}</strong> will be removed from {project.name} and the timeline. You can undo this from the workspace.</p></div></div> : <div className="add-task-form">
      <label className="form-field task-form-field">Task name<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <label className="form-field task-form-field">Assignee · Designer or Developer<TeamAssigneeCombobox project={project} id={`edit-task-assignee-${task.id}`} value={draft.assignee} role={draft.assigneeRole} onChange={(name, memberRole) => setDraft({ ...draft, assignee: name, assigneeRole: memberRole })} /></label>
      <fieldset className="task-schedule-group"><legend>Schedule and effort</legend><div className="task-form-row">
        <label className="form-field task-form-field">Starts<input type="date" value={draft.startDate} max={draft.dueDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} /></label>
        <label className="form-field task-form-field">Due date<input type="date" value={draft.dueDate} min={draft.startDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></label>
        <label className="form-field task-form-field">Effort (hours)<input type="number" min="0.5" step="0.5" value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: event.target.value })} /></label>
      </div></fieldset>
      <label className="form-field task-form-field">Workflow stage<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Task['status'] })}>{TASK_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
    </div>}
    {confirmingDelete
      ? <div className="modal-actions task-modal-actions edit-task-actions"><Button variant="outline" onClick={() => setConfirmingDelete(false)}>Keep task</Button><Button className="task-delete-confirm-button" onClick={remove}><Trash2 size={15} /> Delete task</Button></div>
      : <div className="modal-actions task-modal-actions edit-task-actions"><Button className="task-delete-button" variant="outline" onClick={() => setConfirmingDelete(true)}><Trash2 size={15} /> Delete task</Button><div><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={!draft.title.trim()}>Save changes</Button></div></div>}
  </DialogContent></Dialog>
}
