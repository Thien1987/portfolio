import type { ProjectStage, ProjectStatus } from './types'

export const PROJECT_STAGES: { value: ProjectStage; label: string; description: string }[] = [
  { value: 'discovery', label: 'Discovery', description: 'Understand the problem, value, users, stakeholders, and scope.' },
  { value: 'planning', label: 'Planning', description: 'Agree the work, owners, timeline, and dependencies.' },
  { value: 'execution', label: 'Execution', description: 'Deliver the planned work.' },
  { value: 'monitoring', label: 'Monitoring', description: 'Track progress, risks, and changes while work is underway.' },
  { value: 'closure', label: 'Closure', description: 'Confirm outcomes, hand off, and capture learnings.' },
]

export function getProjectStage(stage: ProjectStage | string | undefined, health: ProjectStatus): ProjectStage {
  if (stage === 'initiation') return 'discovery'
  const matched = PROJECT_STAGES.find((item) => item.value === stage)
  if (matched) return matched.value
  if (health === 'complete') return 'closure'
  if (health === 'paused') return 'planning'
  return 'execution'
}

export function getProjectStageLabel(stage: ProjectStage | undefined, health: ProjectStatus) {
  return PROJECT_STAGES.find((item) => item.value === getProjectStage(stage, health))?.label ?? 'Execution'
}
