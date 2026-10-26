import type { Project } from './types'

export function getEpicKey(project: Pick<Project, 'id' | 'epic'>) {
  return project.epic?.key ?? `MARG-${project.id.replace(/\D/g, '').slice(-4) || '101'}`
}
