export interface NewProjectDraftSuggestion {
  summary: string
  problem: string
  outcome: string
  requirements: string[]
}

/**
 * Turns the requester's own notes into an editable ticket outline.
 * This is a deterministic starter, not a document reader or a model call.
 */
export function draftNewProjectTicket(projectName: string, context: string): NewProjectDraftSuggestion {
  const cleanContext = context.trim()
  const rawLines = cleanContext.split(/\r?\n/).filter((line) => line.trim())
  const bulletLines = rawLines.filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
  const firstSentence = cleanContext.split(/(?<=[.!?])\s+/)[0]?.trim() ?? ''
  const outcomeMatch = cleanContext.match(/(?:so that|so we can|goal is to|success means)\s+([^.!?]+[.!?]?)/i)
  const subject = projectName.trim() || 'this project'
  return {
    summary: (firstSentence || cleanContext).slice(0, 180),
    problem: cleanContext,
    outcome: outcomeMatch?.[1]?.trim() ?? `Define a measurable outcome for ${subject} and the people it serves.`,
    requirements: bulletLines.length
      ? bulletLines.slice(0, 5)
      : [
          `Confirm the user need and constraints described in the context for ${subject}.`,
          `Agree on a measurable success signal for ${subject}.`,
          'Confirm scope, accountable owners, and delivery dependencies.',
        ],
  }
}

export function createEpicKey(projectName: string, existingKeys: string[]) {
  const prefix = projectName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'WORK'
  const occupied = new Set(existingKeys)
  let number = 1
  while (occupied.has(`${prefix}-${String(number).padStart(3, '0')}`)) number += 1
  return `${prefix}-${String(number).padStart(3, '0')}`
}
