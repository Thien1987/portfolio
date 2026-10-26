import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, UserRound } from 'lucide-react'
import { getProjectAssignees } from '@/lib/teamAssignment'
import type { Project, TaskAssigneeRole } from '@/lib/types'

export function TeamAssigneeCombobox({ project, value, role, onChange, id, label = 'Assign teammate' }: {
  project: Project
  value: string
  role: TaskAssigneeRole | ''
  onChange: (name: string, role: TaskAssigneeRole | '') => void
  id: string
  label?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const team = useMemo(() => {
    const members = getProjectAssignees(project)
    if (value && role && !members.some((member) => member.name === value && member.role === role)) members.unshift({ name: value, role })
    return members
  }, [project, role, value])
  const options = team.filter((member) => `${member.name} ${member.role}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])

  const close = (returnFocus = false) => {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus())
  }
  const select = (name: string, selectedRole: TaskAssigneeRole | '') => {
    onChange(name, selectedRole)
    close(true)
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, options.length)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
    if (event.key === 'Enter' && activeIndex === 0) { event.preventDefault(); select('', '') }
    if (event.key === 'Enter' && activeIndex > 0 && options[activeIndex - 1]) { event.preventDefault(); select(options[activeIndex - 1].name, options[activeIndex - 1].role) }
    if (event.key === 'Escape') { event.preventDefault(); close(true) }
  }

  return <div className={`team-assignee-combobox ${open ? 'is-open' : ''}`} ref={rootRef}>
    <button ref={triggerRef} type="button" className="team-assignee-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-menu`} aria-label={`${label}${value ? `: ${role === 'designer' ? 'Designer' : role === 'developer' ? 'Developer' : 'Team member'} ${value}` : ''}`} onClick={() => { if (open) close(); else { setQuery(''); setActiveIndex(-1); setOpen(true) } }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setQuery(''); setActiveIndex(-1); setOpen(true) } }}>
      <UserRound size={14} aria-hidden="true" /><span className="team-assignee-trigger-name">{value || 'Assign teammate'}</span>{value && role && <small>{role === 'designer' ? 'Designer' : 'Developer'}</small>}<ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className="team-assignee-menu" id={`${id}-menu`}>
      <label className="team-assignee-search"><Search size={14} aria-hidden="true" /><input ref={searchRef} id={id} type="search" role="combobox" aria-label="Search employees" aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-options`} aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} value={query} placeholder="Search employees…" onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1) }} onKeyDown={handleKeyDown} /></label>
      <div className="team-assignee-options" id={`${id}-options`} role="listbox" aria-label="Designers and developers">
        <button type="button" className={`team-assignee-option is-unassigned ${activeIndex === 0 ? 'is-active' : ''}`} id={`${id}-option-0`} role="option" aria-selected={!value} onPointerDown={(event) => event.pointerType === 'mouse' && event.preventDefault()} onMouseEnter={() => setActiveIndex(0)} onClick={() => select('', '')}><UserRound size={14} /><span>Unassigned</span>{!value && <Check size={14} />}</button>
        {options.length ? options.map((member, index) => <button type="button" className={`team-assignee-option ${activeIndex === index + 1 ? 'is-active' : ''}`} id={`${id}-option-${index + 1}`} role="option" aria-selected={value === member.name && role === member.role} key={`${member.role}-${member.name}`} onPointerDown={(event) => event.pointerType === 'mouse' && event.preventDefault()} onMouseEnter={() => setActiveIndex(index + 1)} onClick={() => select(member.name, member.role)}><span className="team-assignee-avatar">{member.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><span className="team-assignee-option-name">{member.name}</span><small>{member.role === 'designer' ? 'Designer' : 'Developer'}</small>{value === member.name && role === member.role && <Check size={14} />}</button>) : <p className="team-assignee-empty">{team.length ? 'No employees match that search.' : 'Add a designer or developer to the Epic team first.'}</p>}
      </div>
    </div>}
  </div>
}
