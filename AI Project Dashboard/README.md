# Margin

Margin is a visual project planner where people organize work directly on a shared timeline. A deterministic suggestion engine offers contextual changes for the user to review; it does not call an LLM or change the plan on its own.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build`.

## Project structure

- `src/lib/types.ts` — plan, project, task, steering, and suggestion types.
- `src/lib/taskStatus.ts` — shared story workflow stages and their high-level status categories.
- `src/lib/projectStage.ts` — project lifecycle phases, labels, descriptions, and legacy-stage fallback.
- `src/lib/projectSchedule.ts` — project start-date fallback and quarter formatting shared by the Epic and project overview.
- `src/lib/projectKey.ts` and `src/components/ProjectCode.tsx` — consistent epic-key fallback and compact project-code label used across views.
- `src/lib/seed.ts` — five sample projects, with deadline pressure and a deliberately overloaded week.
- `src/lib/suggestions.ts` — deterministic rule-based suggestion engine.
- `src/lib/assistant.ts` — local plan-aware answers for the floating assistant panel.
- `src/lib/store.ts` — shared Zustand state, localStorage persistence, undo/redo, and history.
- `src/components/WorkspaceViews.tsx` — timeline, project board, and weekly focus views.
- `src/components/ProjectEpicPage.tsx` — full-page epic review, editable source-backed suggestions, team, linked story keys, and ticket attachments.
- `src/components/StoryPage.tsx` — full-page story intent, design and engineering breakdowns, acceptance criteria, planning metadata, and custom sections.
- `src/components/AddStoryDialog.tsx` and `src/components/TeamAssigneeCombobox.tsx` — add epic-linked stories and assign a Designer or Developer from a searchable project roster.
- `src/lib/epicAttachments.ts` — IndexedDB storage for uploaded epic images.
- `src/lib/epicReview.ts` — deterministic, cited epic-review proposals from local sample company sources and project plan data.
- `src/components/FloatingAssistant.tsx` — bottom-right assistant launcher and side panel.
- `src/components/EditTaskDialog.tsx` and `src/components/TaskAssistDialog.tsx` — task editing and task-focused help.
- `src/components/ui/` — editable shadcn/ui components (Base UI primitives, Nova preset).
- `src/App.tsx` and `src/App.css` — app shell, contextual suggestion panel, steering controls, and responsive layout.
- The topbar ticket search in `src/App.tsx` searches epic and story keys, titles, project names, and assignees across workspace projects.
- `DESIGN_NOTES.md` — rationale, suggestion rules, limitations, and user research questions.

The timeline switches between daily (14 days), weekly (6 weeks), and monthly (6 months) scales. Drag a task to move it by the current scale, or drag its right edge to resize its date range. The floating assistant answers plan questions using deterministic local rules and offers common requests without a real LLM connection.

Use the project checkboxes beside the timeline scale controls or at the left of a timeline row to choose which projects are visible.

Workspace plan and appearance preferences are persisted in browser storage.

Use the appearance switch beside the top-right account control to toggle between light and dark themes. The top-left workspace control changes the selected plan tier.
