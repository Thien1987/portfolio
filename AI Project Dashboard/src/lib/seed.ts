import { addDays, format, startOfWeek } from 'date-fns'
import type { Plan, Project, ProjectEpic, Task } from './types'

const day = (offset: number) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset), 'yyyy-MM-dd')

export function createSeedPlan(): Plan {
  const makeTask = (projectId: string, id: string, title: string, hours: number, from: number, to: number, status: Task['status'] = 'todo', vague = false, assignee?: string): Task => ({
    id, projectId, title, assignee, estimatedHours: hours, startDate: day(from), dueDate: day(to), status, dependencies: [], vague,
  })
  const projects: Project[] = [
    {
      id: 'northstar', departments: ['Product', 'Engineering'], name: 'Northstar launch', summary: 'Ship the new customer onboarding experience.', color: 'indigo', deadline: day(18), priority: 'urgent', status: 'at-risk', stage: 'execution', deadlineType: 'hard',
      tasks: [
        makeTask('northstar', 'northstar-kickoff', 'Align on launch goals', 2, -5, -5, 'done', false, 'Morgan Lee'),
        makeTask('northstar', 'northstar-research', 'Synthesize user interviews', 5, 0, 1, 'in-progress', false, 'Thien Nguyen'),
        makeTask('northstar', 'northstar-prototype', 'Prototype onboarding flow', 8, 1, 3, 'todo', false, 'Alex Chen'),
        makeTask('northstar', 'northstar-qa', 'Run usability check', 4, 8, 9, 'todo', false, 'Priya Shah'),
      ],
    },
    {
      id: 'fieldnotes', departments: ['Design', 'Marketing'], name: 'Fieldnotes', summary: 'A small publication for notes from the field.', color: 'emerald', deadline: day(34), priority: 'high', status: 'on-track', stage: 'planning', deadlineType: 'flexible',
      tasks: [
        makeTask('fieldnotes', 'fieldnotes-outline', 'Outline issue one', 3, 0, 0, 'in-progress', false, 'Sam Rivera'),
        makeTask('fieldnotes', 'fieldnotes-draft', 'Draft opening essay', 6, 2, 3, 'todo', false, 'Thien Nguyen'),
        makeTask('fieldnotes', 'fieldnotes-edit', 'Edit and proofread', 4, 10, 11, 'todo', false, 'Casey Morgan'),
      ],
    },
    {
      id: 'career', departments: ['Design'], name: 'Career refresh', summary: 'Make space for a focused search and portfolio update.', color: 'amber', deadline: day(28), priority: 'high', status: 'on-track', stage: 'execution', deadlineType: 'hard',
      tasks: [
        makeTask('career', 'career-case-study', 'Refresh portfolio case study', 6, 1, 3, 'in-progress', false, 'Thien Nguyen'),
        makeTask('career', 'career-resume', 'Tailor resume for roles', 3, 3, 3, 'todo', false, 'Avery Wilson'),
        makeTask('career', 'career-outreach', 'Plan thoughtful outreach', 2, 6, 6, 'todo', false, 'Taylor Brooks'),
      ],
    },
    {
      id: 'garden', departments: ['Operations'], name: 'Community garden', summary: 'Coordinate the spring volunteer day.', color: 'rose', deadline: day(45), priority: 'medium', status: 'on-track', stage: 'planning', deadlineType: 'flexible',
      tasks: [
        makeTask('garden', 'garden-plan', 'Coordinate volunteer day', 5, 3, 4, 'todo', true, 'Jamie Park'),
        makeTask('garden', 'garden-supplies', 'Confirm tools and supplies', 2, 7, 7, 'todo', false, 'Devon Clarke'),
      ],
    },
    {
      id: 'learning', departments: ['Design'], name: 'Motion studies', summary: 'Build a weekly practice habit in motion design.', color: 'sky', deadline: day(60), priority: 'low', status: 'paused', stage: 'discovery', deadlineType: 'flexible',
      tasks: [
        makeTask('learning', 'learning-references', 'Collect motion references', 2, 2, 2, 'todo', false, 'Thien Nguyen'),
        makeTask('learning', 'learning-sketches', 'Explore three transitions', 4, 9, 10, 'todo', false, 'Thien Nguyen'),
      ],
    },
  ]
  const epicDetails: Record<string, ProjectEpic> = {
    northstar: { key: 'NORTH-100', prd: { problem: 'New customers struggle to understand the product and reach their first successful outcome.', outcome: 'Help a new customer complete setup and experience value in their first session.', requirements: ['Clarify the setup steps and expected time', 'Provide helpful empty states and progress feedback', 'Validate the flow with moderated usability sessions'] }, team: { pm: 'Morgan Lee', designer: 'Thien Nguyen', developers: ['Alex Chen', 'Priya Shah', 'Jordan Kim'] } },
    fieldnotes: { key: 'FIELD-42', prd: { problem: 'Field researchers lack a calm, consistent way to turn observations into a shareable publication.', outcome: 'Publish a first issue that makes field notes easy to discover and read.', requirements: ['Create a flexible editorial outline', 'Support readable long-form layouts', 'Review the first issue with five readers'] }, team: { pm: 'Sam Rivera', designer: 'Thien Nguyen', developers: ['Casey Morgan', 'Riley Patel'] } },
    career: { key: 'CAREER-18', prd: { problem: 'The job search is fragmented across resume updates, portfolio work, and outreach.', outcome: 'Create a coherent job-search package and a repeatable outreach routine.', requirements: ['Refresh one portfolio case study', 'Tailor the resume to target roles', 'Plan a small, thoughtful outreach list'] }, team: { pm: 'Taylor Brooks', designer: 'Thien Nguyen', developers: ['Avery Wilson'] } },
    garden: { key: 'GARDEN-7', prd: { problem: 'Volunteers need clear ownership and logistics to participate in the spring garden day.', outcome: 'Run a welcoming volunteer day with supplies and roles confirmed in advance.', requirements: ['Confirm the date and volunteer roles', 'Prepare a supplies checklist', 'Share arrival and accessibility details'] }, team: { pm: 'Jamie Park', designer: 'Robin Ellis', developers: ['Devon Clarke', 'Noah Singh'] } },
    learning: { key: 'MOTION-31', prd: { problem: 'Motion-design practice is easy to postpone without a small, visible learning goal.', outcome: 'Build a weekly habit and complete three transition studies.', requirements: ['Collect a focused set of references', 'Explore three distinct transitions', 'Review progress at the end of each week'] }, team: { pm: 'Thien Nguyen', designer: 'Thien Nguyen', developers: [] } },
  }
  const departmentSeeds = [
    { department: 'Product', code: 'PROD', colors: ['emerald', 'amber', 'rose', 'sky'], startOffsets: [0, 5, 14, 18], owner: 'Morgan Lee', designer: 'Thien Nguyen', developers: ['Alex Chen', 'Priya Shah'], names: ['Pricing and packaging refresh', 'Admin workspace', 'Activation insights', 'Feedback prioritization'], summaries: ['Clarify plans and value for growing teams.', 'Give workspace admins clearer member and access controls.', 'Help teams understand where new users reach value.', 'Turn customer feedback into a visible product decision loop.'] },
    { department: 'Design', code: 'DES', colors: ['indigo', 'rose'], startOffsets: [3, 18], owner: 'Taylor Brooks', designer: 'Thien Nguyen', developers: ['Avery Wilson'], names: ['Design system foundations', 'Accessibility improvements'], summaries: ['Create consistent foundations for product surfaces.', 'Improve keyboard access, legibility, and inclusive interaction patterns.'] },
    { department: 'Engineering', code: 'ENG', colors: ['emerald', 'amber', 'rose', 'sky'], startOffsets: [2, 7, 16, 22], owner: 'Jordan Kim', designer: 'Robin Ellis', developers: ['Casey Morgan', 'Riley Patel'], names: ['API reliability', 'Build pipeline modernization', 'Service observability', 'Data migration toolkit'], summaries: ['Reduce API errors and improve recovery behavior.', 'Make builds faster and more dependable for delivery teams.', 'Give teams useful signals for service health and incidents.', 'Make customer data migrations safer and easier to verify.'] },
    { department: 'Marketing', code: 'MKT', colors: ['indigo', 'amber', 'rose', 'sky'], startOffsets: [6, 10, 23, 29], owner: 'Sam Rivera', designer: 'Casey Morgan', developers: ['Noah Singh'], names: ['Spring product launch', 'Customer story program', 'Lifecycle email refresh', 'Website conversion improvements'], summaries: ['Coordinate launch messaging, channels, and readiness.', 'Share customer outcomes through repeatable case studies.', 'Make onboarding and product education emails more useful.', 'Help prospective customers find the right next step.'] },
    { department: 'Operations', code: 'OPS', colors: ['indigo', 'emerald', 'amber', 'sky'], startOffsets: [1, 6, 18, 24], owner: 'Jamie Park', designer: 'Devon Clarke', developers: ['Noah Singh'], names: ['Support handoff playbook', 'Vendor renewal cycle', 'New hire onboarding', 'Quarterly planning operations'], summaries: ['Create clear ownership between support and delivery teams.', 'Track vendor decisions, risks, and renewal dates in one place.', 'Make the first weeks for new teammates easier to navigate.', 'Coordinate inputs and follow-through for quarterly planning.'] },
  ]
  const additionalProjects: Project[] = departmentSeeds.flatMap(({ department, code, colors, startOffsets, owner, designer, developers, names, summaries }) => names.map((name, index) => {
    const id = `${code.toLowerCase()}-${index + 1}`
    const startOffset = startOffsets[index]
    const deadlineOffset = 32 + index * 9
    const requirements = ['Confirm scope and success measures with stakeholders', 'Deliver the first milestone and review it with the team', 'Document follow-up work and ownership']
    return {
      id, departments: [department], name, summary: summaries[index], color: colors[index], startDate: day(startOffset), deadline: day(deadlineOffset), priority: index === 0 ? 'high' : 'medium', status: 'on-track', stage: index < 2 ? 'execution' : 'planning', deadlineType: index === 0 ? 'hard' : 'flexible',
      tasks: [
        makeTask(id, `${id}-align`, 'Align scope and success measures', 3, startOffset, startOffset + 2, 'in-progress', false, owner),
        makeTask(id, `${id}-milestone`, `Deliver ${name.toLowerCase()} milestone`, 6, startOffset + 3, startOffset + 7, 'todo', true, developers[index % developers.length]),
      ],
      epic: { key: `${code}-${200 + index}`, prd: { problem: summaries[index], outcome: `Deliver a measurable improvement for ${department.toLowerCase()} stakeholders.`, requirements }, team: { pm: owner, designer, developers } },
    } satisfies Project
  }))
  projects.push(...additionalProjects)
  const originalProjectStartOffsets: Record<string, number> = { northstar: -5, fieldnotes: 0, career: 1, garden: 3, learning: 2 }
  projects.forEach((project) => {
    project.epic = project.epic ?? epicDetails[project.id]
    project.startDate = project.startDate ?? day(originalProjectStartOffsets[project.id] ?? 0)
    project.tasks.forEach((task, index) => { task.issueKey = `${project.epic!.key.split('-')[0]}-${101 + index}` })
  })
  const sampleStoryBreakdowns: Record<string, NonNullable<Task['storyDetails']>> = {
    'northstar-prototype': {
      intent: 'Help a first-time customer understand each setup step and reach a useful first-session outcome.',
      designBreakdown: 'Map the setup flow and progress states. Design empty, loading, and error states, plus keyboard and small-screen behavior. Validate the steps with a first-time user.',
      engineeringBreakdown: 'Build the flow from shared form and progress components. Persist completed steps, handle identity-migration edge cases, and instrument first-session completion.',
      acceptanceCriteria: ['A new customer can complete setup without facilitator help.', 'Progress is retained when a customer returns to an earlier step.', 'Keyboard users can complete the flow and understand validation errors.'],
    },
    'career-resume': {
      intent: 'Create a clear resume version that communicates fit for the target product design roles.',
      designBreakdown: 'Prioritize measurable outcomes and personal contribution. Align the hierarchy with target role requirements, keep the document scannable, and check contrast and reading order.',
      engineeringBreakdown: 'Maintain a reusable source document and verify exported PDFs preserve selectable text, links, and layout across common viewers.',
      acceptanceCriteria: ['The resume highlights role-relevant outcomes in the first page scan.', 'All links work in the exported PDF.', 'The exported document remains readable when zoomed or printed.'],
    },
    'garden-supplies': {
      intent: 'Make sure the volunteer team has the tools and materials needed for the garden day.',
      designBreakdown: 'Group supplies by activity and make quantities and owner easy to scan. Include a clear way to flag items that are unavailable.',
      engineeringBreakdown: 'Confirm the checklist can be shared with event owners and updated without losing item ownership or completion state.',
      acceptanceCriteria: ['Each required item has a quantity and an owner.', 'Missing items are visible before the event date.', 'The final checklist can be shared with volunteers.'],
    },
  }
  projects.forEach((project) => project.tasks.forEach((task) => { task.storyDetails = sampleStoryBreakdowns[task.id] }))
  return { projects, steering: { weeklyCapacity: 20, protectFocus: true, proactivity: 'balanced', includedPriorities: ['urgent', 'high', 'medium', 'low'] }, dismissedSuggestions: [], resolvedSuggestions: [] }
}
