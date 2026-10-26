# Design notes

## Problem and thesis

People manage several commitments across work, personal projects, learning, and career goals. Static boards require constant manual upkeep and can quietly go stale. Chat-first AI makes people describe plans in prose and hides the spatial relationships between deadlines and workload. As a result, people can lose track of what matters this week, miss conflicts, and overlook plans that are slipping.

**Thesis:** chat is a poor interface for planning and tracking. The user should work directly on a visual workspace, while AI proposes contextual changes that the user can accept, edit, or dismiss. Light controls should steer those proposals without requiring a written prompt.

## Design decision log

### 2026-10-25 — Change task stage directly from its card

- **Decision:** Replace the separate status display and selector in each This week task card with one clearly labeled dropdown containing the board's five workflow states and any custom states the user adds. Updating it writes to the shared task record, so the card immediately appears in the matching column.
- **Alternative considered:** Keep a status badge and place the selector elsewhere in the card, or expose every Jira-like task state even when it has no column on This week.
- **Why:** One control avoids duplicated status information; limiting the dropdown to visible columns makes its result predictable. Users can create a new named state and corresponding column when their workflow needs one.
- **Interview point:** Put the state control where the user acts, and keep it synchronized with the board structure; retain keyboard accessibility alongside drag and drop.

- **Persistence and history:** Custom workflow columns are stored with the plan in local storage and participate in undo/redo. Existing detailed statuses remain in the project and timeline workflow; the This week dropdown maps those to their broad board column.

### 2026-10-25 — Reorder This week workflow columns

- **Decision:** Add a dedicated drag handle to each column header. Reordering changes the board sequence while leaving each status and its tasks together; the order is saved in the plan and recorded in undo/redo history. The drag handle also supports keyboard sorting.
- **Alternative considered:** Let users drag the entire column surface, or provide a settings-based ordering menu.
- **Why:** A small, explicit handle avoids competing with task dragging and dropping inside the column. It makes column movement discoverable while preserving the existing task interaction.
- **Interview point:** Separate drag affordances by scope: a header handle moves columns, while task cards move between columns.
- **Follow-up polish:** Removed the redundant “Drop here” header cue. The empty-column message already describes the drop action, leaving the header available for the column name and reorder control.
- **Follow-up control:** Added left/right arrow buttons at the top right of each header for precise one-column moves. Edge arrows disable at the first and last positions. This complements freeform dragging with an explicit, keyboard-operable alternative.

### 2026-10-25 — Add longer timeline horizons

- **Decision:** Extend the timeline scale switch with **Quarterly**, **6 months**, and **Yearly**. The quarterly view shows four quarter columns, the 6-month view shows two half-year columns, and the yearly view shows five calendar years starting with the current year. Each scale aligns to calendar boundaries; dragging and resizing shift work by the selected unit. Tasks that began before the visible horizon remain visible when they overlap it.
- **Alternative considered:** Add more daily/weekly columns, or make the yearly option a compressed monthly grid.
- **Why:** These horizon levels let project managers inspect delivery commitments at progressively higher levels while preserving the same task interaction model. Calendar-aligned boundaries are easier to discuss in planning reviews.
- **Known tradeoff:** Higher-level views compress date precision to quarters, half-years, or years. A future usability test should check whether users understand that a drag moves work by the selected unit and whether the year range is useful for comparing long-term commitments.
- **Interview point:** A zoom control changes both the time horizon and the unit of direct manipulation, so labels and drag behavior must stay explicit and consistent.
- **Follow-up:** Updated the yearly view to show five distinct years side by side after feedback that a single annual bucket did not support year-to-year comparison.

### 2026-10-25 — Drag timeline tasks from anywhere on the card

- **Decision:** Remove the timeline task's dedicated grab icon and allow dragging from any non-control area of the task card. The resize grip, edit action, and AI action keep their own pointer behavior; keyboard dragging remains available on the card.
- **Alternative considered:** Keep a narrow drag handle, or make the resize edge and buttons part of the drag surface.
- **Why:** A larger drag target is easier to discover and operate. Keeping nested actions excluded prevents schedule movement from stealing clicks or resizing.

### 2026-10-25 — Consolidate timeline scale controls

- **Decision:** Replace the row of six timeline scale tabs with a labeled **Range** dropdown containing Daily, Weekly, Monthly, Quarterly, 6 months, and Yearly.
- **Alternative considered:** Keep the tabs and make them scroll or wrap on smaller screens.
- **Why:** The growing set of ranges was crowding the toolbar. A single native select keeps every range easy to find, supports keyboard and assistive technology by default, and fits the existing compact toolbar pattern.

### 2026-10-25 — Give timeline suggestion cards more room

- **Decision:** Increase inline suggestion card height from 52px to 72px and allow the affected task title to wrap to two lines. Reserve a matching taller lane so the card does not overlap adjacent work.
- **Why:** A small increase makes more of the task title visible while retaining the compact timeline layout.

### 2026-10-25 — Remove inline suggestions from the timeline

- **Decision:** Remove the inline suggested-work cards from timeline rows for now. Suggestions remain available in the dedicated suggestion panel.
- **Why:** The compact timeline card remained too small to read. Removing it restores space for scheduled tasks until a more suitable presentation is designed.

### 2026-10-25 — Choose a department workspace

- **Decision:** Change the workspace menu from subscription tiers to Product, Design, Engineering, Marketing, and Operations departments. The selected department appears under the workspace name and closes the menu immediately after selection.
- **Why:** The control is framed as workspace selection, so department context is more relevant than an account plan tier for a project-management workspace.

### 2026-10-25 — Scope projects to the selected department

- **Decision:** Associate projects with one or more departments and use the selected department to scope the sidebar, search, timeline, board, and This week view. Cross-functional work can appear in multiple departments and remains the same shared project when edited. New projects inherit the selected department. Department choice and all project data persist in the workspace store.
- **Alternative considered:** Change only the department label while leaving the same project list visible, or duplicate projects for each department.
- **Why:** Department selection should change the work context. Shared cross-functional project records avoid divergent duplicates while each department view stays focused.

### 2026-10-25 — Seed a usable portfolio for every department

- **Decision:** Provide at least five sample projects in each department, with linked tasks, owners, deadlines, priorities, and epic context. Cross-functional Northstar and Fieldnotes work is shared across relevant departments instead of duplicated. The data migration adds the new sample projects to existing saved workspaces when their IDs are not already present.
- **Why:** Department switching should demonstrate a meaningful project portfolio in every workspace and support realistic review of capacity and cross-project commitments.
- **Known limitation:** The seeded teams and project details are illustrative. Real deployments should load department membership and ownership from the organization’s project system.

### 2026-10-25 — Distinguish projects by color within each department

- **Decision:** Assign a different project color to each seeded project within its department, while keeping shared cross-functional projects on the same color wherever they appear. The workspace migration updates seeded color associations for existing users.
- **Why:** Consistent, non-repeating project colors make the department timeline easier to scan and preserve project identity across views.

### 2026-10-25 — Stagger project start weekdays by department

- **Decision:** Stagger seeded project starts across Monday through Friday within each department, while keeping each task schedule aligned to its parent project's start. Shared projects retain the same start date across departments. Existing seeded project and task dates are updated by migration.
- **Why:** A portfolio with every project beginning on Monday looks artificial and hides how real teams stagger kickoffs and capacity demand. Weekday-only starts avoid suggesting routine weekend kickoffs.

### 2026-10-25 — Default new workspaces to dark mode

- **Decision:** Start new workspaces in dark mode. On upgrade, use dark mode unless the user has already changed the theme preference; persist future changes through the existing toggle.
- **Why:** The user asked for dark mode as the starting appearance while keeping the theme choice under user control.

### 2026-10-25 — Remove Canceled from the built-in task workflow

- **Decision:** Remove Canceled from task status menus and This week columns, including any previously saved custom status with a cancel label. Existing tasks in those states migrate to Done so they remain visible in the workflow.
- **Why:** Keep the built-in workflow focused on the statuses currently needed; cancellation can be reintroduced if the team needs it.

### 2026-10-25 — Show the timeline grab cursor only when an action is available

- **Decision:** Show the hand cursor over the timeline only when its content actually overflows horizontally and empty-space panning is enabled. If it fits, the timeline surface uses the normal cursor while draggable task cards retain their own grab cursor.
- **Why:** A grab cursor should describe an available action. This avoids suggesting that users can pan a timeline that has no horizontal overflow, without hiding task drag-and-drop.

### 2026-10-25 — Make the full task card a drag target

- **Decision:** Allow pointer dragging from any non-control area of a This week task card and remove the per-card grip icon. Buttons and links remain clickable; the workflow selector moves tasks to their matching column and remains the keyboard-accessible alternative.
- **Alternative considered:** Require dragging only from the grip icon.
- **Why:** The narrow handle was hard to discover and harder to target. Making the card itself draggable reduces precision demands without turning nested controls into accidental drag initiators.
- **Interview point:** Expand the direct-manipulation target while preserving safe interaction zones and an accessible keyboard route. Empty sections say “Drag and drop here” to clarify the drop destination.

### 2026-10-25 — Separate This week task cards from their columns

- **Decision:** Give each task card a stronger neutral outline, white surface, and subtle shadow; use a lighter border/background in dark mode to maintain the same separation.
- **Alternative considered:** Rely on spacing and subtle card shadows alone.
- **Why:** The board contains multiple cards in each tinted workflow column. A visible perimeter improves scanning and keeps adjacent tasks distinct without using project/status color as the only separator.
- **Interview point:** Use shape, borders, and spacing alongside color so task boundaries remain clear in both themes.

### 2026-10-25 — Guard ticket navigation when there are unsaved changes

- **Decision:** From an epic, story, or new-ticket draft, navigation to another project or workspace view happens immediately when the page is clean. When the page has unsaved edits or an unconfirmed review, show a custom confirmation dialog that states those changes will be lost and offers **Stay on ticket** or **Discard changes and leave**. Use the same guard for sidebar navigation and ticket search, and a matching dialog for the ticket's own back button.
- **Alternative considered:** Rely on the browser's native confirmation, silently discard, or save every field immediately.
- **Why:** Users need to understand the consequence before leaving, while direct navigation remains fast when there is nothing to lose. A designed dialog gives clear recovery and supports the app's visual language.
- **Interview point:** Match confirmation friction to risk: no prompt when clean, explicit warning when leaving would discard work.

### 2026-10-25 — Create projects as full ticket drafts

- **Decision:** The **New project** action opens a ticket-style page rather than a short modal. The author can write the title, summary, problem, outcome, requirements, custom sections, schedule, priority, lifecycle stage, and initial owners before creating the project. The sticky create action saves the ticket and opens its full epic page.
- **AI flow:** An inline ticket partner asks what is happening, who is affected, and what should improve, then accepts relevant document links. A deterministic drafting helper turns the supplied notes into an editable starter outline. The author can apply or dismiss it, and the linked sources persist as epic attachments. The interface explains that links are attached but their document contents are not imported automatically.
- **Alternative considered:** Keep the quick name/date dialog and ask the author to fill in the epic after creation, or introduce a chat-first interview.
- **Why:** Product teams create a project ticket as a structured artifact with scope, owners, and timing. Keeping the author on the ticket makes the data visible and editable, while the contextual AI panel supports drafting without replacing the form or asking for a long prompt.
- **Interview point:** Let the user own the brief and use AI to shape their context into fields they can review; distinguish user-supplied sources from material the system can actually read.
- **Known limitation:** The starter helper uses deterministic templates and the app stores source URLs without fetching protected or external document contents. A connected document index or permission-aware source reader would be needed to review those documents directly.

### 2026-10-25 — Allow multiple source links and document attachments

- **Decision:** Keep the repeatable **Attach link** action and add a multiple-file **Attach files** picker for PDF, Office, text, Markdown, and CSV documents, up to 15 MB each. Persist file blobs in IndexedDB and attachment metadata on the epic; provide remove and download actions.
- **Alternative considered:** Store only source URLs or place document contents in localStorage.
- **Why:** Teams often need to attach a bundle of research and planning material. IndexedDB is designed for binary files, while the existing project record stays small and the attachment list is easy to inspect.
- **Interview point:** Support batch selection, keep source documents attached to the ticket, and state clearly that the review engine does not extract their contents.
- **Known limitation:** Files are kept in this browser's IndexedDB and are not synced to a server or read by the deterministic review engine.

### 2026-10-25 — Edit capacity beside a project-only weekly summary

- **Decision:** Keep the planned-hours figure on the left of the This week summary and place a compact list of project names scheduled this week on the right. Put an **Edit** button beside the weekly capacity value; it opens a dialog to set available hours from 1 to 168.
- **Alternative considered:** Keep the workload bar or make capacity editable inline in the summary.
- **Why:** The summary should show the week's workload and project scope at a glance, with a deliberate dialog for changing an important planning constraint. Listing project names without task details keeps the summary at project level.
- **Interview point:** Match information hierarchy to the user's question: total effort and available hours at left, which projects contribute at right.

### 2026-10-25 — Scope This week to scheduled tasks across projects

- **Decision:** Show tasks from every active project whose scheduled date range overlaps the current week. Group them into To do, In progress, In review, On hold, and Done. Dragging a task changes its saved workflow status; the existing status selector remains as a keyboard and touch alternative. Weekly planned effort sums the estimates of tasks scheduled this week, excluding completed and on-hold work.
- **Alternative considered:** Show every task from every active project regardless of schedule, or keep the original three broad status groups.
- **Why:** A weekly capacity measure should represent the work scheduled for that week, while including all projects prevents cross-project commitments from disappearing. Distinct workflow stages make review and paused work visible.
- **Interview point:** Keep the scope of the board and capacity calculation aligned to the week, while using shared task status data for direct manipulation.

### 2026-10-25 — Make workflow columns read as drop targets

- **Decision:** Give each status column a persistent “Drop here” cue, stronger card-like boundaries, and a distinct highlight when a task is dragged over it. Clarify that the status selector changes the task's column immediately.
- **Alternative considered:** Depend on empty-column placeholder text or a subtle background shift to teach drag and drop.
- **Why:** Populated columns also need to communicate their drop behavior. The cue stays visible, while the stronger hover state confirms where a dragged task will land.
- **Interview point:** Make drag targets discoverable before interaction and provide immediate feedback during the move; the status selector remains an accessible alternative.

### 2026-10-25 — Keep project timing and story count in the footer

- **Decision:** Keep the project title row focused on identity. Keep the schedule in the existing bottom-left footer and add the story count there; show the project description in expanded details.
- **Alternative considered:** Repeat the story count and schedule beside the epic code in the title row.
- **Why:** The footer already shows the same timing information, so repeating it in the header added clutter without adding context. Pairing story count with the existing schedule gives the overview one compact source for project scope and timing.
- **Interview point:** Remove duplicate metadata and keep related planning facts together in the established footer location.

### 2026-10-25 — Add account options and persistent appearance controls

- **Decision:** Make the top-right avatar open a compact account menu and add a dark-mode switch to the sidebar. Save the theme with the workspace preference and apply it across the planner, dialogs, and assistant panel.
- **Alternative considered:** Put appearance under a settings page or rely on the operating system theme.
- **Why:** The contrast preference is frequent and benefits from a direct, visible control. A lightweight account menu matches the existing profile affordance while making demo-only account limitations clear.
- **Interview point:** Preference controls should be easy to find and persist; the appearance switch stays in the workspace navigation rather than being buried.

### 2026-10-25 — Add a global plan-aware assistant panel

- **Decision:** Add a fixed bottom-right AI launcher that opens a side panel with a conversation area, a text composer, and common requests for focus, capacity, and deadlines. Replies are generated by local rules from the current plan; the panel does not call a model API.
- **Alternative considered:** Keep all assistance limited to inline recommendations or move the conversation into a separate full-screen view.
- **Why:** The panel gives the user an always-available place to ask about their plan while keeping the timeline visible as the main workspace. Quick requests make common needs discoverable, and deterministic answers keep the portfolio demo reliable.
- **Interview point:** The user requested a conversational entry point, so the product supports it as a plan-aware layer while retaining direct manipulation as the primary planning surface.

### 2026-10-25 — Keep task actions beside the schedule bar

- **Decision:** Hovering a truncated task name shows its full title. A pen button opens an edit dialog for task name, dates, effort, and status; a separate AI icon below it opens a task-focused text box with common actions along the bottom. The right-edge grip is reserved for direct duration resizing.
- **Alternative considered:** Make the resize grip also open a week adjustment menu.
- **Why:** Keeping edit, AI help, and resize on distinct controls makes the interaction predictable and prevents accidental duration changes. The helper maps typed keywords and quick actions to deterministic breakdown, first-step, and schedule guidance, without adding a chat history or live model.
- **Interview point:** Separate controls map cleanly to separate intents: the pen edits task details, the sparkle opens contextual guidance, and the edge grip changes duration.

- **Follow-up:** The add-task dialog groups start date, due date, and effort into one schedule section with larger, aligned fields. Task edits use the same visual structure and are saved to undoable history.

### 2026-10-25 — Keep project rows aligned

- **Decision:** Keep a 120 px minimum calendar row, truncate long project names to one line, and expose the full name on hover/focus. Add a distinct vertical lane for every overlapping task and grow only that project's row as needed.
- **Alternative considered:** Cap visible tasks and send the rest to the board, or let overlapping task cards cover one another.
- **Why:** A modest default row keeps the calendar compact, while expanding busy rows makes every commitment visible without overlap. Users can inspect dense projects in place.
- **Interview point:** Row height responds to actual schedule density rather than making every project pay the vertical cost of the busiest one.
- **Implementation follow-up:** Each project now occupies one explicit subgrid row, so its measured lane count sets the height for both the project label and its task track after a resize.

### 2026-10-25 — Make the timeline directly pannable

- **Decision:** Let users drag empty timeline space to pan horizontally, while preserving task drag handles for rescheduling and resize handles for changing duration. Keep native touch/trackpad scrolling and add focused arrow-key scrolling with a labeled region.
- **Alternative considered:** Rely only on the scrollbar or add separate previous/next controls.
- **Why:** Direct panning matches the spatial canvas interaction and is faster for desktop pointer users; keeping task manipulation on explicit handles avoids ambiguous gestures. Keyboard and native scroll remain alternatives.
- **Interview point:** Gestures are scoped by intent: blank canvas navigates, task handles edit the plan.

### 2026-10-25 — Set a usable minimum type size

- **Decision:** Replace former 7–11 px labels with a shared 12 px supporting-text token and a 14 px body/control token. Keep headings larger, give timeline rows more vertical room, and enlarge compact controls so labels do not clip.
- **Alternative considered:** Increase only the page heading or rely on browser zoom.
- **Why:** Important planning information appears throughout task cards, capacity indicators, timeline headers, suggestion reasons, and steering controls. A readable minimum applies consistently while a separate body size preserves hierarchy.
- **Interview point:** Readability is part of the information hierarchy: people scan task names and reasons before decoration, so supporting information should not disappear at small sizes.

### 2026-10-25 — Start from the plan, not an AI prompt

- **Decision:** Make the timeline the primary workspace, with daily (14 days), weekly (6 weeks), and monthly (6 months) scales plus a project board and This week view sharing the same plan data. Dragging a task moves it by the selected scale; dragging its right edge resizes its date range. Keyboard sensors provide drag alternatives.
- **Alternative considered:** Start with a conversational assistant or a dashboard of AI summaries.
- **Why:** The central problem is keeping a spatial overview of commitments. Starting with the plan makes direct manipulation the main action and keeps the user oriented when suggestions appear.
- **Interview point:** AI is an assistant to the planning interaction, not the destination screen.

### 2026-10-25 — Adopt shadcn/ui as a design-system foundation

- **Decision:** Use the Nova preset and Base UI primitives, with editable shadcn/ui components, semantic CSS-variable tokens, Lucide icons, and a small shared spacing scale. Apply a muted evergreen accent to a light neutral surface.
- **Alternative considered:** Install a closed component library or hand-build every control.
- **Why:** shadcn/ui provides accessible, composable starting points while leaving component code open for the specialized planner UI. The timeline and suggestion cards are purpose-built; familiar controls such as tabs, buttons, sliders, switches, and dialogs use the shared system.
- **Interview point:** The visual system helps reduce UI inconsistency, while open components leave room for domain-specific interaction.

### 2026-10-25 — Show suggestions beside work and in a review panel

- **Decision:** Reschedule proposals appear as dashed ghost tasks in the proposed timeline week and as review cards with a short reason and Accept, Edit, and Dismiss actions.
- **Alternative considered:** Put every recommendation in a detached inbox or apply changes automatically.
- **Why:** A ghost task reveals the spatial consequence before the user accepts. The review panel keeps the rationale and decision controls together. No proposal changes the plan until accepted.
- **Interview point:** The ghost styling and “Suggested” label preserve authorship; the user can tell planned work from proposed work at a glance.

### 2026-10-25 — Keep steering explicit and reversible

- **Decision:** Weekly capacity, focus-time preference, suggestion frequency, and included priority levels are controls in the workspace. Accepted suggestions, task changes, and project updates can be undone or redone; recent changes are listed in the history panel.
- **Alternative considered:** Ask the user to describe capacity and intent in a prompt, or silently infer both.
- **Why:** The controls map to concrete preferences and make cause and effect visible. Undo reduces the cost of trying a suggestion.
- **Interview point:** Steering is a product control surface, not prompt composition in disguise.

### 2026-10-25 — Use deterministic rules for an explainable demo

- **Decision:** A separate rule-based module returns typed suggestions with an ID, target, reason, confidence, and proposed change. No LLM API is used.
- **Alternative considered:** Connect a live model or write recommendations directly in UI components.
- **Why:** Deterministic behavior makes the portfolio walkthrough reliable, and a dedicated interface leaves a path to replace the rule engine later without redesigning the workspace.
- **Interview point:** Separate the source of recommendations from the way people review and apply them.

### 2026-10-25 — Preserve user decisions across sessions

- **Decision:** Persist plan data and dismissed/resolved suggestion IDs in localStorage. Recompute suggestions from the latest plan so stale recommendations disappear. When two suggestions target the same task or project field, surface the conflict and retire the competing proposal after one is chosen.
- **Alternative considered:** Keep decisions only in memory or show the same recommendation again after dismissal.
- **Why:** Remembered dismissals reduce nagging, and recomputation lets the workspace respond to user changes without a separate “refresh AI” action.
- **Interview point:** Recommendations are disposable views of the current plan; a user's intent to dismiss or choose one is durable state.

## Suggestion-engine rules

`generateSuggestions(plan)` is a pure function in `src/lib/suggestions.ts`. It accepts the projects/tasks plus steering preferences and returns a sorted list of suggestions. Each item contains a stable ID, type, target, short reason, confidence, proposed change, and optional conflict group.

| Type | Rule | Why it appears | Confidence |
| --- | --- | --- | --- |
| Overload | Sum unfinished estimated hours by Monday-starting week. If planned work exceeds weekly capacity, propose moving the lowest-priority scheduled task to the following week. | Makes a capacity problem and a concrete adjustment visible before the week starts. | 0.91 |
| Slipping | For an at-risk project with an upcoming deadline and remaining work, propose moving the next unfinished task earlier. A project nearing a hard deadline without an at-risk state can be flagged when remaining effort is high relative to available capacity. | Treats deadline pressure as a reason to inspect or protect the plan, not as an automatic reschedule. | 0.82–0.86 |
| Next task | Select the highest-priority unfinished task whose dependencies are complete, favoring earlier scheduled work. Offer to mark it in progress. | Turns a large plan into a visible next action. | 0.88 |
| Breakdown | In proactive mode, find a task marked broad and propose two editable subtasks. | Makes a vague commitment easier to start, with lower confidence because the engine lacks the user's full context. | 0.58 |
| Priority | If a project has a hard deadline within 35 days and is not urgent, suggest raising its priority. | Connects deadline pressure to the priority tag the user already uses. | 0.79 |

Steering filters suggestions by included priority tags. Quiet mode hides the next-task, breakdown, and priority nudges; proactive mode adds the lower-confidence breakdown proposal. Capacity changes the overload threshold. Focus protection changes the wording and framing of the overload proposal. Project priority and deadline flexibility are directly editable on the project board.

Dismissed IDs and accepted IDs are filtered from future results. Reschedule suggestions use a stable task-based ID, so moving the task does not cause the same dismissed recommendation to reappear under a new week ID. Suggestions are regenerated as plan and steering state changes.

## Known limitations

- The timeline offers 14-day, 6-week, and 6-month scales, but it does not place work into time-of-day slots. Dragging the resize handle snaps the due date to the end of the selected day, week, or month; labeled controls also adjust the date range by a week.
- Capacity uses estimated hours grouped by task start week. Daily and monthly headers show scheduled effort without claiming a daily or monthly capacity target. The model does not account for calendar availability, partial workdays, recurring obligations, or effort spent across every week of a task's date range.
- Dependencies are represented in the data model and honored by the next-task rule, but this MVP does not yet offer a dependency editor.
- Project lifecycle phases and task workflow stages use a shared built-in set. Jira organizations can customize their workflows; this MVP does not yet provide a workflow editor or import statuses from Jira.
- The suggestion engine uses simple thresholds and seeded statuses. It cannot infer actual progress, task scope, or the reason behind a deadline, so its confidence is heuristic.
- There is no account, cloud sync, collaboration, import/export, Jira connection, or real LLM connection. Epic, PRD, team, and issue-key data are local demo records in browser localStorage on this device.
- Project creation starts with a project shell; tasks are added separately. Project descriptions and colors are currently seeded or defaulted rather than editable.
- Visual layout could not be checked in a browser in this environment because the computer-use browser was unavailable. The production build succeeds; visual review remains a follow-up.

## What I would test with real users next

## Recent design decision: task deletion

The task editor now exposes a clearly labeled, soft red **Delete task** action. Choosing it replaces the edit form with an in-context confirmation that names the task and project, explains that the task will be removed from the timeline, and notes that the workspace's undo control can restore it. The final confirmation uses a stronger red fill with a separate **Keep task** escape action. This two-step pattern makes the destructive consequence explicit without adding a browser-native alert that would interrupt the workspace context. Deletion is recorded in change history and is undoable; dependency references to the deleted task are removed to avoid dangling links. I chose this over an immediate delete or a generic confirmation modal because task deletion is consequential but should remain legible and reversible in the current editing flow.

This interaction should be tested with keyboard users and on narrow screens to confirm both confirmation actions remain easy to find and that the warning is understood before the task is removed.

## Recent design decision: dark theme palette

The dark theme now uses neutral charcoal and gray surfaces instead of green-tinted backgrounds and controls. The light theme retains the original restrained green accent identity; destructive warnings remain red in both themes. This responds to the user's comfort feedback while preserving hierarchy through surface contrast, borders, and text rather than relying on a strong hue. Next, test the dark theme in a dim room and check that task/project distinctions remain clear for users with color-vision differences.

The calendar's Weekly, Daily, and Monthly selector now has explicit dark-theme states, including a brighter neutral selected state and hover feedback. It previously inherited its light-theme background because it was not covered by the first dark-theme pass.

The appearance switch now sits in the top-right header directly before the account menu. This keeps a global preference close to account controls and preserves the project navigation area for project work; the switch remains icon-labeled for compact layouts and exposes an accessible name.

The account identity is now Thien Nguyen throughout the workspace header, profile, and account menu. The top-left workspace control is a keyboard-operable plan menu. Selecting Free, Plus, or Pro updates the visible current-plan label, closes the menu, and persists the selection locally.

## Recent design decision: project epic and delivery team

Projects carry an epic key and an editable delivery team (PM, designer, developers). The user-authored epic stays intact while the review agent identifies potential omissions as separate, evidence-backed suggestions. Each card labels the consideration, shows the finding and source, explains why it may matter, and offers an editable addition. Agreeing appends only that addition to its target section; dismissals and accepted suggestion IDs persist with the epic. A changed epic or plan marks an open review stale until refreshed. I chose this one-suggestion-at-a-time flow over rewriting the epic because PMs need to judge scope and keep authorship. The **Epic** action is available from the project row in the timeline, project card in the board, and project label in This week. Epic details use a full workspace page with a clear Back action because review, team context, and attachments need room to work together. The page includes explicit save/leave behavior so edits are not silently lost. Seeded projects include distinct team and source examples; newly created projects get a generated local epic key and an unassigned team to avoid inventing ownership. Existing saved plans are migrated to attach sample metadata where available and safe defaults otherwise.

Users can attach image files (up to 15 MB each) and named web links to an epic. Image blobs live in IndexedDB rather than localStorage so the task plan stays compact; attachment metadata is saved with the epic. Newly added but unsaved images are removed if the user discards changes. Detached image blobs are retained so undo can restore the attachment; this can leave unreferenced images in local storage and is a known cleanup limitation. This is still local demo data with no Jira sync.

The review engine is deterministic and uses project-specific company knowledge records, workspace task/deadline data, and curated external product guidance. It records source titles, excerpts, and last-updated dates so the PM can inspect the basis for each suggestion. Atlassian epic and Definition of Done guidance are included as linked external references. The engine does not connect to a company drive, fetch linked pages, or interpret uploaded image contents; these remain integration opportunities, while the current review clearly links users to those sources when their content is needed.

The epic page now leads with the project owner's editable problem statement, intended outcome, and requirements before offering review. This gives the review a clear authored baseline and reinforces that the agent advises rather than authors the brief. On review, a staged source-by-source progress panel names each record, shows its excerpt/category, and communicates waiting, reviewing, and reviewed states before revealing suggestions. This is intentionally a deterministic presentation of local review work, not a live model or company-drive scan; a real integration should preserve these provenance and progress cues while reflecting actual access and retrieval status. Reduced-motion preferences shorten the staged sequence and disable the progress animation.

The authored brief also includes an unconstrained Additional context field and owner-defined sections with editable headings and text. This keeps the PRD structure useful without forcing every detail into problem, outcome, or requirements. Custom context is included in review freshness checks and in the engine's existing-content check, so a refreshed review can account for what's already documented. These fields persist with the epic.

The at-risk marker now exposes an in-app tooltip on hover and keyboard focus, and can be clicked to keep the explanation open. It shows unfinished effort, task count, and time to (or past) the hard/flexible deadline. The marker sits outside the clipped project title control so the explanation can extend over the timeline without being cut off.

Next, test whether people understand the epic key as the parent ticket and task keys as child work, whether they can tell each optional consideration from the original epic, and whether the finding, source, and suggested addition are enough to make an agree/edit/dismiss decision. Also test dismissal memory and stale-review refresh behavior, source freshness cues, and whether team ownership is clear.

## Recent design decision: story workflow stages

Jira does not have one exhaustive list of task/story statuses. Teams can configure status names in workflows, while each status maps to a broad category. After feedback that the menu was too long, the built-in workflow is now Draft, To do, In progress, Blocked, In review, and Done. This smaller set keeps drafting, active work, interruption, review, and resolution distinct without implying every company needs a separate approval, QA, or cancellation state. Older persisted states migrate to the closest current status (for example, Testing to In review, On hold to Blocked, and Canceled to Done); organization-specific workflow administration remains a future integration. Sources: [Atlassian workflow statuses](https://support.atlassian.com/jira-cloud-administration/docs/what-is-a-workflow-status/) and [Atlassian work item statuses](https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/).

Each task's stage can be changed in the task editor, directly in the project board, in This week, or from its linked epic story row. The timeline shows the stage label so color is not the only cue. The This week columns use the same concise statuses, and status changes are stored in shared task data and recorded in workspace history. Done satisfies dependencies; Canceled is resolved for capacity/progress but does not satisfy a dependency as completed work.

## Recent design decision: project lifecycle stage and compact project list

Project stage is now separate from the existing health signal and priority. Jira work item workflows focus on individual work, and there is no single universal list of project statuses. For a project-level lifecycle, I use Discovery, Planning, Execution, Monitoring, and Closure, adapting the first phase label to Discovery for product work. Health (on track, at risk, paused, complete) still communicates delivery condition, while priority (including Urgent) communicates relative importance. The new stage dropdown sits alongside priority in the project list and is also editable from the epic page. Existing saved projects infer an initial stage from seeded metadata when available, or from their previous health state. Sources: [Atlassian's project management phases](https://www.atlassian.com/work-management/project-management/phases/) and [Jira's configurable workflow/status categories](https://support.atlassian.com/jira-cloud-administration/docs/what-is-a-workflow-status/).

The project board now starts as a compact list, with each project collapsed and its story list revealed on demand. This addresses scanning project-level commitments first while keeping task-level detail available without overwhelming the page. The row retains stage, priority, deadline, health, and an Epic shortcut; the disclosure control is keyboard operable and its expanded state is announced. I chose per-project disclosure over a single global collapse because people can inspect one project while keeping the rest of the portfolio compact.

## Recent design decision: ticket navigation and workspace search

Project names now open their epic directly from the timeline and board; the timeline's project filter has its own small control so a navigation affordance does not remove existing filtering. Epic keys use an uppercase alphabetic project prefix and number (for example, `NORTH-100`), are shown with the project shortcut, and new project keys derive from a short name prefix with collision checking. The epic page already identifies its key at the top.

The global topbar search indexes every project epic and child story in the current workspace, matching ticket key, title, project, and assignee. Results show ticket type, key, parent project, and owner. Selecting an epic opens its epic page; selecting a story opens the parent epic and scrolls to/highlights that story. Task assignee is now an editable field and is included in search. I chose a workspace-wide search over the selected-project filter so cross-project and teammate work is discoverable. It searches the current workspace data only; live Jira/company-wide ticket search requires an integration and permission-aware index.

Epic keys are now displayed immediately beside project names in the sidebar, timeline, board, This week view, epic heading, and project context in task creation/search. Repeating the compact key beside each title reduces the need to remember which ticket a project maps to as people move between views. Search results avoid repeating the same key when the result itself is the epic.

Timeline filtering now uses project checkboxes instead of a filter icon on each row. A checkbox at the left edge of each timeline project supports quick include/exclude, and a **Projects** menu beside the Weekly/Daily/Monthly switch exposes the full multi-select list with All/Clear controls. The sidebar's single-project selection maps into the same filter; returning to All projects clears it. I chose explicit checkboxes over hidden toggle semantics so users can see which commitments are included before interpreting the timeline or its capacity totals. The selection persists with workspace preferences.

The multi-select menu now stages checkbox changes until the user presses **Save**. This avoids the timeline shifting while someone is still choosing several projects. Closing and reopening the menu resets its draft to the last saved filter.

Timeline columns now use flexible fractional widths with minimum readable widths. The grid fills the available viewport on large screens, while its content-driven minimum width preserves horizontal scrolling on smaller screens. I chose proportional expansion over fixed-width periods so a wider display reveals more breathing room without changing the calendar scale or task placement.

Epic review sources and each suggestion's source chips now open the same right-side source detail panel. It displays the exact source excerpt recorded for the review, source category and date, and a link to the original when one exists; image attachments show their preview. This keeps the review suggestions in place while letting people inspect provenance on demand. I changed the suggestion label from “Evidence” to “Source” to make the source chips' purpose more direct. The current review engine stores excerpts rather than full internal documents, so the panel is explicit that it shows the material recorded for that source.

Stories now open as their own ticket pages from the epic story list and workspace search. Each page separates story intent, design-team work, engineering-team work, acceptance criteria, planning metadata, additional context, and optional open-text sections. The owner edits and saves the breakdown; changes flow through the shared task model, persist with the workspace, and enter undo/history as one task edit. The epic remains the parent context with its outcome and owners visible in a side rail. I chose a full page to give each story enough room for usable text fields and a clear back path, rather than adding a dense modal to the timeline. Existing stories can have empty breakdowns until their team fills them in. Story fields are included in ticket search and make an epic review stale when they change, so the existing navigation and review freshness rules remain coherent.

Timeline project-title hover details use an immediate custom tooltip (rather than the browser's delayed title popup) with project lifecycle stage, delivery health, scheduled task date range, and hard or flexible project deadline. Task-card hover now has its own immediate detail tooltip with story key, task stage, assignee, effort, task dates, parent project stage and health, project task range, and deadline. Both tooltips also appear on keyboard focus, while the compact calendar labels remain unchanged.

Story and task ownership now uses a searchable dropdown sourced from the parent epic's Designer and Developer roster. Each selected person carries their workstream role into the task data, and the role is shown in the epic story list, search results, and task hover details. I chose one authoritative project roster over free-text-only assignment so large story lists remain searchable and role ownership is consistent. Teams need to add designers and developers to the epic before assigning them; unassigned remains an explicit option.

The Epic's **Add story** action creates a linked ticket with an initial workflow stage, schedule, estimate, and optional team owner. It is placed with the Stories and tasks heading, parallel to the custom-section action in the brief editor, so epic authors can add work from the place where they manage its relationship to the project.

Project planning now stores an explicit start date in addition to the existing due date. The quarter is derived from that date, and the Epic offers both a quarter selector (which starts the date at the quarter's first day) and an exact date control, plus hard/flexible due-date commitment. The project list shows the quarter and date span so the overview stays useful without opening each ticket. I chose a derived quarter to avoid contradictory quarter and date values. Existing projects infer their initial start date from the earliest scheduled task (or their due date if no tasks exist). Saving the Epic keeps its action sticky and confirms success in a dismissible, timed green toast.

The timeline's first column now separates project identity from risk details: the checkbox, color marker, title, code, and completion count share a clear row, with risk details below when needed. I widened the column from 198px to 236px so long names and alphanumeric ticket codes have more room before truncation. The project title is the only timeline entry point to its epic; removing a duplicate Epic button restores space and makes the interaction hierarchy clearer. The tradeoff is a slightly wider horizontal canvas, which is already scrollable.

1. Ask people managing three or more parallel commitments to create a project and schedule work without instructions. Watch whether the week-based timeline is clear enough or whether they expect daily placement.
2. Present the overload ghost and ask users to explain what is proposed, why it appeared, and whether they would accept it. Check that ghost styling and the reason are noticed before acting.
3. Let users dismiss a suggestion, change the plan, and return later. Check whether the remembered decision feels respectful or suppresses advice they wanted to see again.
4. Compare quiet, balanced, and proactive modes. Ask whether users can predict how the controls change the number and relevance of suggestions.
5. Observe keyboard-only task rescheduling and project reordering, then test with screen readers and reduced-motion settings.
6. Test the empty and overloaded states with a fresh browser profile and a deliberately capacity-constrained plan. Check if users understand the next useful action in both cases.
