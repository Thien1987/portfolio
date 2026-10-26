import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { answerWorkspaceRequest } from '@/lib/assistant'
import { useWorkspace } from '@/lib/store'

type Message = { id: number; role: 'user' | 'assistant'; text: string }

const commonRequests = [
  'What should I focus on next?',
  'Check my weekly capacity',
  'Which deadlines are at risk?',
]

export function FloatingAssistant() {
  const plan = useWorkspace((state) => state.plan)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: 'I can help you make sense of your current plan. Ask a question or start with one of the common requests.' }])
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const openAssistant = () => setOpen(true)
    window.addEventListener('margin:open-assistant', openAssistant)
    return () => window.removeEventListener('margin:open-assistant', openAssistant)
  }, [])

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, open])

  const send = (value: string) => {
    const text = value.trim()
    if (!text) return
    const id = Date.now()
    const reply = answerWorkspaceRequest(text, plan)
    setMessages((current) => [...current, { id, role: 'user', text }, { id: id + 1, role: 'assistant', text: reply }])
    setDraft('')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    send(draft)
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <Button className="assistant-launcher" aria-label="Open AI planner assistant" title="Ask the planner assistant" onClick={() => setOpen(true)}><Sparkles size={20} /><span>Ask AI</span></Button>
    <DialogContent className="assistant-panel" showCloseButton={false}>
      <header className="assistant-header"><div className="assistant-avatar"><Bot size={19} /></div><div className="assistant-heading"><DialogTitle>Planner assistant</DialogTitle><DialogDescription>Plan-aware help for your projects</DialogDescription></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={17} /></button></header>
      <div className="assistant-messages" role="log" aria-label="Assistant conversation" aria-live="polite">
        {messages.map((message) => <div className={`assistant-message assistant-message-${message.role}`} key={message.id}><span className="assistant-message-label">{message.role === 'user' ? 'You' : 'Planner assistant'}</span><p>{message.text}</p></div>)}
        <div ref={messageEndRef} />
      </div>
      <div className="assistant-quick-requests"><span>Common requests</span><div>{commonRequests.map((request) => <button type="button" key={request} onClick={() => send(request)}>{request}</button>)}</div></div>
      <form className="assistant-composer" onSubmit={submit}>
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your plan..." aria-label="Ask the planner assistant" rows={2} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(draft) } }} />
        <Button type="submit" aria-label="Send message" disabled={!draft.trim()}><Send size={16} /></Button>
      </form>
      <p className="assistant-footnote">Suggestions are based on your current plan. Review each change before applying it.</p>
    </DialogContent>
  </Dialog>
}
