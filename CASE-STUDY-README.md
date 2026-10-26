# Case study content guide

Project cards open one responsive case study layout rendered by `openCaseStudy()` in `script.js` and styled in `styles.css`. Each case includes problem framing, research questions, prioritization, design decisions, validation plans, final screens, product and design lenses, and reflection.

## Source and NDA handling

The current project narratives are tailored to the portfolio screens and the information available for each project. Project-specific dates, participant samples, quotes, test results, and business outcomes are not filled in unless they are documented. The case studies state those limits rather than inventing specifics.

Some projects were client work under NDA. Before publishing, confirm what may be shown. Anonymize or alter client names, identifiers, screens, data, and contextual details where required; omit restricted information. Treat the case study's screen-based interpretations and proposed validation plans as hypotheses unless you can verify them against project records.

## Update or add a case

1. Update the matching project in `projects` and its process narrative at the same array index in `caseNarratives` and `caseTakeaways` in `script.js`.
2. Keep `projectScreens` aligned by index. Supported types include `mobile`, `desktop`, `sidebarPair`, `agent`, and `workpal`. AirScout uses `files` for desktop pages and `mobileFiles` for responsive phone previews.
3. Add only approved screens or artifacts. Give each image useful alternative text and label concept work accurately.
4. Replace inferred audiences, decisions, and hypotheses with verified project evidence when you have it. Add participant counts, quotes, or outcomes only when they are real, traceable, and cleared for publication.
5. Keep accessibility, responsive behavior, and edge-state notes specific to the implementation; mark anything that still needs validation.

## Publishing checklist

- [ ] Role, timeline, tools, team, project type, and constraints are accurate or explicitly marked as unavailable.
- [ ] Client and participant information is safe to publish and consistent with NDA obligations.
- [ ] Research methods, sample sizes, quotes, and artifacts are real and traceable.
- [ ] Inferences and proposed approaches are clearly distinguished from observed findings and completed work.
- [ ] Before/after comparisons reflect actual iterations.
- [ ] Metrics are verified outcomes or clearly labeled candidate measures.
- [ ] Screen and artifact descriptions explain their useful content.
- [ ] Navigation, progress, role tabs, disclosures, previews, and close controls work by keyboard.
- [ ] The case study remains readable on mobile and desktop and maintains visible focus states and sufficient contrast.
