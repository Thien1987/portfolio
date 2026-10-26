import type { Project } from './types'

export function getProjectStartDate(project: Project) {
  return project.startDate ?? project.tasks.map((task) => task.startDate).sort()[0] ?? project.deadline
}

export function getProjectQuarterValue(date: string) {
  const [year, month] = date.split('-').map(Number)
  return `${year}-Q${Math.ceil(month / 3)}`
}

export function getProjectQuarterLabel(date: string) {
  const [year, quarter] = getProjectQuarterValue(date).split('-')
  return `${quarter} ${year}`
}

export function getQuarterStartDate(value: string) {
  const [year, quarter] = value.split('-Q').map(Number)
  const month = (quarter - 1) * 3 + 1
  return `${year}-${String(month).padStart(2, '0')}-01`
}
