import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspace } from '@/lib/store'
import { getTaskStatus } from '@/lib/taskStatus'
import type { Project, Task } from '@/lib/types'

type HelpChoice = 'breakdown' | 'first-step' | 'schedule' | 'unmatched'

export function TaskAssistDialog({ task, project, open, onOpenChange, onEdit }: {
  task: Task
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}) {
  const changeTaskStatus = useWorkspace((state) => state.changeTaskStatus)
  const [choice, setChoice] = useState<HelpChoice | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) { setChoice(null); setQuery('') }
  }, [open, task.id])

  const steps = [
    `Clarify what “${task.title}” needs to accomplish`,
    'Gather the materials or decisions needed to begin',
    'Complete a first pass, then review what remains',
  ]

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="modal-card task-modal task-assist-modal" showCloseButton={false}>
    <div className="modal-title"><div className="modal-mark"><Sparkles size={19} /></div><div><DialogTitle className="modal-heading">What would you like help with?</DialogTitle><DialogDescription className="modal-description">Ask about ?{task.title}?, or choose a common action below.</DialogDescription></div><button className="icon-button" onClick={() => onOpenChange(false)} aria-label="Close"><X size={16} /></button></div>
    <form className="task-assist-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const request = query.toLowerCase()
      if (/break|step|subtask|split|divide|smaller/.test(request)) setChoice('breakdown')
      else if (/first|start|begin|action/.test(request)) setChoice('first-step')
      else if (/time|schedule|deadline|effort|hour/.test(request)) setChoice('schedule')
      else setChoice('unmatched')
    }}>
      <Textarea value={query} onChange={(event) => setQuery(event.target.value)} aria-label="What would you like help with on this task?" placeholder="What would you like help with on this task?" rows={3} />
      <Button type="submit" disabled={!query.trim()} aria-label="Get task help"><ArrowRight size={16} /></Button>
    </form>
    {choice && <div className="task-help-result">
      <div className="task-help-result-label"><Sparkles size={14} /> A suggestion for this task</div>
      {choice === 'breakdown' && <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>}
      {choice === 'first-step' && <p>Set aside 15 minutes to define what done looks like for <strong>{task.title}</strong>, then choose one action you can complete in that time.</p>}
      {choice === 'schedule' && <p><strong>{task.estimatedHours} hours</strong> planned from {format(parseISO(task.startDate), 'MMM d')} to {format(parseISO(task.dueDate), 'MMM d')} in <strong>{project.name}</strong>.</p>}
      {choice === 'unmatched' && <p>I can help you break down this task, clarify its next step, or plan time for it. Choose an action below.</p>}
      <div className="task-help-result-actions">
        {choice === 'first-step' && getTaskStatus(task.status).category === 'todo' && <Button onClick={() => { changeTaskStatus(task.id, 'in-progress'); onOpenChange(false) }}>Start this task</Button>}
        {choice === 'schedule' && <Button variant="outline" onClick={() => { onOpenChange(false); onEdit() }}>Edit task details</Button>}
      </div>
    </div>}
    <div className="task-assist-quick-actions" aria-label="Common task help actions">
      <span>Try:</span>
      <button type="button" onClick={() => setChoice('breakdown')}>Break into steps</button>
      <button type="button" onClick={() => setChoice('first-step')}>Find a first step</button>
      <button type="button" onClick={() => setChoice('schedule')}>Review schedule</button>
    </div>
  </DialogContent></Dialog>
}
