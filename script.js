const form = document.querySelector('#contact-form');

// Keep the care phone frame still while its app screens cycle gently.
const carePreview = document.querySelector('.care-screen img');
if (carePreview && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const careScreens = [
    { src: 'Portfolio/separated/care-scheduling-01.webp', alt: 'Care scheduling app appointment calendar and booking form' },
    { src: 'Portfolio/separated/care-scheduling-02.webp', alt: 'Care scheduling app appointment details and confirmation' },
    { src: 'Portfolio/separated/care-finder-01.webp', alt: 'Care Finder app screen for starting a doctor search' },
    { src: 'Portfolio/separated/care-finder-02.webp', alt: 'Care Finder app screen for narrowing care options' },
    { src: 'Portfolio/separated/care-finder-03.webp', alt: 'Care Finder app screen with provider information' },
  ];
  careScreens.slice(1).forEach(({ src }) => { const image = new Image(); image.src = src; });
  let careScreenIndex = 0;
  window.setInterval(() => {
    careScreenIndex = (careScreenIndex + 1) % careScreens.length;
    carePreview.classList.add('is-changing');
    window.setTimeout(() => {
      carePreview.src = careScreens[careScreenIndex].src;
      carePreview.alt = careScreens[careScreenIndex].alt;
      carePreview.classList.remove('is-changing');
    }, 300);
  }, 3800);
}

const heroArt = document.querySelector('.hero-art');
const heroFocusCopy = document.querySelector('#hero-focus-copy');
const heroFocusNotes = {
  discovery: 'Start with the people, their context, and what is getting in their way.',
  structure: 'Bring the right information forward and make the next step feel obvious.',
  momentum: 'Turn a shared direction into a useful product, one thoughtful release at a time.'
};

heroArt?.querySelectorAll('.orbit-topic').forEach((topic) => {
  topic.addEventListener('click', () => {
    heroArt.querySelectorAll('.orbit-topic').forEach((item) => {
      const active = item === topic;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (heroFocusCopy) heroFocusCopy.textContent = heroFocusNotes[topic.dataset.focus];
  });
});

if (heroArt && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroArt.addEventListener('pointermove', (event) => {
    const bounds = heroArt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroArt.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${y * -3}deg)`;
  });
  heroArt.addEventListener('pointerleave', () => { heroArt.style.transform = ''; });
}

document.getElementById('cursor-hamster')?.remove();
const cursorHamster = null;
if (cursorHamster) {
  cursorHamster.innerHTML = `<svg viewBox="0 0 96 72" role="presentation">
    <path class="hamster-trail" d="M5 41h9M2 49h8M8 33h7"/>
    <g class="hamster-bob">
      <ellipse class="hamster-shadow" cx="49" cy="63" rx="25" ry="3.5"/>
      <path class="hamster-body" d="M14 42C13 25 27 12 46 11c19-1 34 12 35 29 1 14-10 21-27 21H33c-12 0-18-7-19-19Z"/>
      <path class="hamster-patch" d="M15 42c0-13 8-24 20-28 5 8 5 18 1 27-4 9-12 14-19 12-1-3-2-7-2-11Z"/>
      <g class="hamster-legs"><path class="hamster-leg leg-back" d="M27 51q-1 5-5 10 3 4 7 0l3-7"/><path class="hamster-leg leg-back leg-alt" d="M37 52q2 5-1 9 3 4 7 0l-1-7"/><path class="hamster-leg leg-front" d="M61 52q-3 5-2 9 3 4 7 0l1-7"/><path class="hamster-leg leg-front leg-alt" d="M71 50q3 5 6 9-2 4-6 1l-4-6"/></g>
      <ellipse class="hamster-belly" cx="49" cy="49" rx="19" ry="10"/>
      <circle class="hamster-ear" cx="37" cy="16" r="8"/><circle class="hamster-ear-inner" cx="37" cy="16" r="4.5"/>
      <circle class="hamster-ear" cx="64" cy="16" r="8"/><circle class="hamster-ear-inner" cx="64" cy="16" r="4.5"/>
      <ellipse class="hamster-cheek" cx="55" cy="40" rx="10" ry="9"/><ellipse class="hamster-cheek" cx="74" cy="40" rx="10" ry="9"/>
      <ellipse class="hamster-blush" cx="53" cy="43" rx="4" ry="2.5"/><ellipse class="hamster-blush" cx="77" cy="43" rx="4" ry="2.5"/>
      <circle class="hamster-eye" cx="58" cy="29" r="3.1"/><circle class="hamster-eye" cx="72" cy="29" r="3.1"/>
      <circle class="hamster-glint" cx="59" cy="28" r=".9"/><circle class="hamster-glint" cx="73" cy="28" r=".9"/>
      <path class="hamster-nose" d="M63 36q3-3 6 0l-3 3z"/><path class="hamster-mouth" d="M66 39q-1 4-4 4m4-4q1 4 4 4"/>
      <path class="hamster-whisker" d="M53 37l-9-2m9 6-10 2m29-6 10-2m-10 6 10 2"/>
      <path class="hamster-paw" d="M42 56q3-5 7 0m-3-1v3m22-2q3-5 7 0m-3-1v3"/>
    </g>
    <path class="hamster-spark" d="m22 19 2-5m-5 8-4-1"/>
  </svg>`;
}
if (cursorHamster && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let targetLeft = 0;
  let targetTop = 0;
  let currentLeft = 0;
  let currentTop = 0;
  let previousX = 0;
  let direction = 1;
  let hasStarted = false;
  let hamsterFrame = 0;

  const chaseCursor = () => {
    currentLeft += (targetLeft - currentLeft) * 0.025;
    currentTop += (targetTop - currentTop) * 0.025;
    cursorHamster.style.transform = `translate3d(${currentLeft}px, ${currentTop}px, 0) scaleX(${direction})`;
    if (Math.abs(targetLeft - currentLeft) > 0.3 || Math.abs(targetTop - currentTop) > 0.3) {
      hamsterFrame = requestAnimationFrame(chaseCursor);
    } else {
      hamsterFrame = 0;
    }
  };

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    if (Math.abs(event.clientX - previousX) > 3) direction = event.clientX >= previousX ? 1 : -1;
    previousX = event.clientX;
    targetLeft = event.clientX - (direction > 0 ? 96 : 0);
    targetTop = event.clientY - 42;
    if (!hasStarted) {
      currentLeft = targetLeft;
      currentTop = targetTop;
      hasStarted = true;
      cursorHamster.classList.add('is-visible');
    }
    if (!hamsterFrame) hamsterFrame = requestAnimationFrame(chaseCursor);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => cursorHamster.classList.remove('is-visible'));
  document.documentElement.addEventListener('pointerenter', () => {
    if (hasStarted) cursorHamster.classList.add('is-visible');
  });
  window.addEventListener('blur', () => cursorHamster.classList.remove('is-visible'));
  window.addEventListener('focus', () => {
    if (hasStarted) cursorHamster.classList.add('is-visible');
  });
}

const projects = [
  { title: 'Odyssey · Communications workspace', category: 'MESSAGING & COLLABORATION', image: 'original-3a416374eb84245dd8f84dd12ac11d40.webp', challenge: 'The screen suggests an information-dense workspace where people move between inboxes, projects, and reports. The opportunity is to help users find the next useful action without losing context.', design: 'Map the core jobs across inbox, project, and reporting views. Identify priority paths and navigation gaps; prototype a clearer hierarchy and test whether users can locate and complete their most common tasks. Design reusable patterns for navigation, unread states, empty states, and responsive layouts.', product: 'Define the primary audience and the workspace outcome the product should improve. Validate the highest-friction tasks with customer interviews and usage data; prioritize navigation and triage improvements against reach, impact, effort, and dependency risk. Align engineering and design around a measurable first release.', metric: 'Time to find a message or project, task completion, repeat usage, and support requests.' },
  { title: 'Korean Air · Travel booking web', category: 'TRAVEL · RESPONSIVE WEB', image: 'original-11dcdc9c0748cb8623ba08033f897638.webp', challenge: 'The page brings trip search, destination inspiration, and fares together. The design question is how to support both people ready to book and people still exploring without making either path feel crowded.', design: 'Study the booking journey from destination choice through fare selection. Separate task-first search from inspiration content, clarify form hierarchy and errors, and prototype the responsive experience. Validate the path with first-time and returning travelers, including keyboard and screen-reader checks.', product: 'Set the business and customer outcome for the booking funnel. Use funnel analytics, search logs, and traveler interviews to locate the biggest abandonment point. Prioritize a focused search-flow release, align pricing and inventory dependencies, and instrument step-level conversion and failure reasons.', metric: 'Search-to-booking conversion, form completion, booking errors, and abandonment by step.' },
  { title: 'Orchid Garden · Flower discovery & shop', category: 'COMMERCE · MOBILE APP', image: 'original-4d62de968216b5b59a369259201030e0.webp', challenge: 'The screens show browsing by bouquet, season, and occasion alongside detailed product information. The opportunity is to help shoppers choose confidently when they may not know flower names or care requirements.', design: 'Explore how shoppers describe intent: occasion, budget, style, and delivery timing. Organize the catalog around these mental models, design scannable cards and useful product details, and test whether people can find an appropriate bouquet and understand what they are buying.', product: 'Clarify which shopper segment and purchase occasion to serve first. Combine search behavior, order patterns, and customer questions to prioritize discovery and product-detail improvements. Define inventory, delivery, and catalog dependencies before sequencing an MVP.', metric: 'Product discovery success, add-to-cart rate, checkout completion, and product-related support contacts.' },
  { title: 'Care finder · Find a doctor', category: 'HEALTHCARE · MOBILE APP', image: 'original-6c333302a576fd4176fd6e3dbd1105ac.webp', challenge: 'The interface presents care categories, search, and clinician listings. In healthcare, a useful next step must be easy to understand while respecting trust, accessibility, and the limits of the information shown.', design: 'Map the care-seeking journey from “I need help” to a suitable clinician. Test category language, search and filtering, clinician comparison, and the transition to booking. Include accessible labels, reassuring empty states, and clear explanations when no match is available.', product: 'Align clinical, operations, and product stakeholders on the intended care-navigation outcome. Validate the most common reasons people seek care and the constraints on provider data. Prioritize a safe, useful discovery path, then measure successful matches alongside failed searches and booking follow-through.', metric: 'Successful provider matches, search refinement, booking starts/completions, and no-result searches.' },
  { title: 'SoundSphere · Music listening', category: 'MEDIA · DESKTOP PRODUCT', image: 'original-6f5633803ceb87f5eb8150189463d920.webp', challenge: 'The dashboard combines charts, listening history, playlists, and a persistent player. The opportunity is to make exploration and playback feel connected, while keeping the interface legible as content grows.', design: 'Observe how listeners move between discovery, library, and playback. Establish a clear content hierarchy and persistent player behavior; prototype browse, queue, and playback states. Test scanning, recognition, and control discoverability across common viewport sizes.', product: 'Choose the listening behavior to improve first, such as discovery or returning to a saved playlist. Use qualitative interviews and event funnels to identify friction. Sequence the smallest coherent release, coordinate catalog and playback dependencies, and track engagement without mistaking time spent for user value.', metric: 'Discovery-to-play rate, saves, repeat listening, and successful playback starts.' },
  { title: 'Newton · Project overview dashboard', category: 'PRODUCTIVITY · SAAS DASHBOARD', image: 'original-756df0db06cf7cba0cb8f31ae70009b3.webp', challenge: 'The view surfaces project status, workload, and detailed task rows. The design challenge is to help different roles quickly understand what needs attention and move from overview to action.', design: 'Identify the decisions managers and contributors make from this dashboard. Audit the information hierarchy, status language, filters, and row-level actions; prototype a progressive overview that emphasizes exceptions and test whether users can spot and resolve a blocked project.', product: 'Define the operational outcome behind the dashboard: faster intervention, clearer accountability, or fewer overdue tasks. Validate stakeholder needs and current reporting workarounds. Prioritize the signals and actions that change decisions, then define adoption and workflow measures with analytics and customer success.', metric: 'Time to identify a blocker, overdue-task rate, resolution time, and recurring dashboard use.' },
  { title: 'Stay · Cottage booking', category: 'TRAVEL · MOBILE & WEB', image: 'original-785895a7be086f9baa7d6c4065270919.webp', challenge: 'The screens show a rental list and property detail with price, amenities, and a reservation action. The opportunity is to build confidence before a traveler commits to a stay.', design: 'Trace the path from destination search through comparing properties and understanding total cost. Make availability, amenities, fees, and cancellation details easy to compare; prototype the detail-to-reservation transition and test whether travelers feel informed enough to proceed.', product: 'Determine where prospective guests hesitate and which trust questions are unanswered. Combine funnel data with guest interviews and host constraints. Prioritize the highest-impact clarity improvements, coordinate inventory and policy requirements, and define a staged experiment for booking confidence.', metric: 'Search-to-detail engagement, reservation completion, booking abandonment, and post-booking questions.' },
  { title: 'Home voice · Smart home assistant', category: 'CONNECTED HOME · MOBILE APP', image: 'original-87829c1d4a98304c1d946c9e20c3bd7e.webp', challenge: 'The concept combines room controls, energy information, and a voice interaction. The product challenge is to make device state and control outcomes understandable, especially when automation does not behave as expected.', design: 'Map common home-control tasks and the mental models people use for rooms, devices, and routines. Design clear states, feedback, and recovery when a command fails. Prototype voice and touch paths and test the experience across household roles and accessibility needs.', product: 'Set a narrow, measurable first use case for connected-home control. Validate device compatibility, privacy expectations, and setup friction with target households. Prioritize reliable core controls before broad automation and align hardware, platform, and support dependencies.', metric: 'Successful control commands, setup completion, recovery from failed commands, and repeat use.' },
  { title: 'Care scheduling · Appointment booking', category: 'HEALTHCARE · MOBILE FLOW', image: 'original-ab7d19ecb1f6dc9a425dbdffaedb2088.webp', challenge: 'The flow displays provider selection, calendar availability, patient details, and booking confirmation. The opportunity is to reduce uncertainty and prevent avoidable errors in a high-stakes scheduling task.', design: 'Walk the appointment journey with patients and clinic staff. Clarify provider choice, date and time selection, required information, and final confirmation. Prototype edge cases such as unavailable slots and validation errors; test the whole flow with realistic tasks.', product: 'Align clinic operations and patient needs on what a successful booking means. Analyze drop-off, rescheduling, and appointment availability constraints. Prioritize improvements that reduce booking friction without creating scheduling burden for staff, and instrument completion and downstream changes.', metric: 'Booking completion, time to book, validation errors, reschedules, and missed appointments.' },
  { title: 'Stream · Anime discovery', category: 'ENTERTAINMENT · DESKTOP WEB', image: 'original-cd8c3c4426d17093515c8c5c53a4d62.webp', challenge: 'The interface combines featured content, continue-watching, and discovery rows. The opportunity is to help viewers pick something relevant quickly and return easily to a show they started.', design: 'Understand how viewers browse by mood, genre, and viewing history. Clarify the relationship between featured content and personalized rows; prototype content cards and continuation states. Test whether viewers can choose a title and resume playback without unnecessary browsing.', product: 'Define the discovery outcome to optimize while balancing catalog goals and viewer trust. Review browse-to-play behavior, search terms, and qualitative feedback. Prioritize a focused discovery experiment and evaluate play starts, return viewing, and content diversity together.', metric: 'Browse-to-play rate, resume success, search reformulation, and return viewing.' },
  { title: 'Getaway · Cabin discovery', category: 'TRAVEL · MOBILE BOOKING', image: 'original-cfd3e1316d18aa8b68d1fbe0fe820fe6.webp', challenge: 'These screens show map-led exploration, location search, dates, guest counts, and filters. The design challenge is to make planning flexible without obscuring which stays actually fit the trip.', design: 'Map how travelers narrow options by place, dates, group size, and amenities. Design clear filter states and map/list continuity, then prototype changes to dates and guests. Test whether people understand which results match their current criteria and can recover from an empty result set.', product: 'Identify which constraint most often prevents a suitable stay from being found. Combine search and filter analytics with traveler interviews. Prioritize the discovery controls that improve qualified results, coordinate listing-data quality, and define success and guardrails for conversion and support.', metric: 'Qualified search results, filter use, detail views, booking starts, and empty-result recovery.' },
  { title: 'Home energy · Device control', category: 'CONNECTED HOME · MOBILE APP', image: 'original-d50ac76b66f75bd8937158c5c53a4d62.webp', challenge: 'The home screen presents room-level energy use, temperatures, and device controls. The opportunity is to help residents understand what is happening and take a useful action without needing to decode technical readings.', design: 'Research how residents interpret energy data and control devices today. Prioritize plain-language status, room grouping, and feedback after a control action. Prototype the overview and detail states; test comprehension and confidence before and after an adjustment.', product: 'Define the customer outcome and the business case for an energy-control experience. Validate data accuracy, device coverage, and the actions customers can actually take. Prioritize a dependable set of insights and controls, and measure both user value and energy-related outcomes where data supports attribution.', metric: 'Control-task success, insight comprehension, repeat use, and verified energy change where measurable.' },
  { title: 'Messenger · Desktop conversations', category: 'COMMUNICATION · DESKTOP APP', image: 'original-72cd8468816b87170ec34090b0c1e25b.webp', challenge: 'The screen shows a multi-column messaging workspace with conversations, contact details, and shared files. The opportunity is to keep context visible without overwhelming users who are switching between threads.', design: 'Observe how people find conversations, scan recent context, and retrieve shared files. Establish hierarchy between thread list, active conversation, and contact panel. Prototype responsive and unread states, then test common retrieval and reply tasks with keyboard and assistive technology.', product: 'Clarify which communication workflow the product serves and what constitutes a better outcome. Use task observation and usage data to locate context-switching pain. Prioritize thread navigation or shared-file retrieval based on evidence, and define engagement alongside interruption and notification guardrails.', metric: 'Time to locate a thread or file, reply completion, search success, and notification opt-outs.' },
  { title: 'Navigate · Local discovery & transit', category: 'MOBILITY · MOBILE APP', image: 'original-e2c10df6309e809329b498408c14c931.webp', challenge: 'The supplied visual is a map-centered mobile experience with search and route information. The design opportunity is to help someone move from “where do I go?” to a route they understand and trust.', design: 'Study how people search for a destination, compare route choices, and interpret arrival information. Make location, route options, and next steps legible at a glance; prototype the search-to-route transition and test under realistic mobile conditions.', product: 'Define the target navigation use case and the most valuable routing outcome. Validate data freshness, transit coverage, and user trust in route recommendations. Prioritize a reliable core journey, align mapping and transit dependencies, and track route selection and successful arrival signals.', metric: 'Search-to-route selection, route completion, reroutes, and reported arrival confidence.' },
  { title: 'AirScout · AI flight agent', category: 'AI AGENT · FLIGHT BOOKING', challenge: 'Flight search can leave travelers comparing scattered fares, baggage rules, and layovers across multiple sites. AirScout explores an AI agent that searches within a traveler’s constraints and explains its recommendation before booking.', design: 'Map the flow from trip intent to search, recommendation, fare verification, approval, and booking status. Keep the traveler’s constraints, total price, fare details, and agent confidence visible. Prototype what happens when a fare changes or an itinerary no longer meets the rules, then test whether people understand and trust each step.', product: 'Validate which parts of flight planning travelers want to delegate and what must remain under their control. Define guardrails for budget, layovers, baggage, and fare changes. Start with a transparent search and recommendation flow, then measure verified savings, recommendation acceptance, booking completion, and exceptions against a manual-search baseline.', metric: 'Verified fare savings, recommendation acceptance, booking completion, fare-change exceptions, and traveler confidence.', brief: 'AirScout is a prototype for an AI flight agent that looks for better fares while respecting a traveler’s budget and trip requirements.', designerSteps: [['Understand the trip constraints', 'Learn which details travelers care about most: dates, budget, baggage, layovers, and flexibility. Make these requirements explicit before the agent searches.'], ['Make the agent legible', 'Show what the agent is checking, why it recommends an itinerary, and which conditions are verified. Keep the total price and fare rules easy to compare.'], ['Design safe approval', 'Keep travelers in control of committing to a booking. Prototype changed fares, missing details, and routes that no longer match the saved requirements.'], ['Test confidence and recovery', 'Ask travelers to review a recommendation, challenge a constraint, and recover from a fare change. Check that they know what the agent did and what happens next.']], pmSteps: [['Set the customer outcome', 'Define what “a better fare” means for the target traveler and which trip constraints are non-negotiable.'], ['Validate the opportunity', 'Compare current search behavior, traveler pain points, and fare availability. Test whether delegation saves meaningful effort and money.'], ['Define agent guardrails', 'Specify budget, layover, baggage, fare-change, and approval rules. Align data freshness and booking dependencies before expanding automation.'], ['Measure verified value', 'Compare like-for-like fare savings with a manual-search baseline. Track accepted recommendations, booking completion, changed fares, and trust-related support issues.']], roadblock: { challenge: 'A low headline fare is not a good recommendation if baggage, layovers, or a changed price violate the traveler’s requirements.', design: 'I would make the saved trip constraints visible alongside the recommendation, distinguish verified details from estimates, and pause for approval if the fare or itinerary changes.', product: 'Set hard limits for budget and itinerary conditions, then define which fare changes require a fresh approval. Track verified savings and booking exceptions together so a cheaper fare does not mask a broken trip.' } },
];

projects.push({
  title: 'WorkPal · AI travel companion',
  category: 'AI AGENT · BUSINESS TRAVEL',
  brief: 'The problem: business travelers often switch between itinerary details, preparation checklists, meetings, ground transport, and expenses across different tools. WorkPal explores a mobile-first trip companion that brings those needs into one contextual experience, with AI assistance available when plans or questions arise.',
  challenge: 'The UX challenge is to make a busy trip feel manageable on a phone without hiding important details or creating another place to search. The product challenge is to make assistance useful while being clear about what information is available, what is only a suggestion, and what still needs the traveler’s review.',
  design: 'UX/UI considerations: I organized the experience around the trip timeline—preparation, outbound travel, on-site days, and return—so the interface reflects what the traveler is doing now. A clear phase indicator, prioritized next action, readiness checklist, and compact meeting and transport details reduce scanning and context switching. I used concise labels, consistent cards and status cues, and kept Ask Pal suggestions and editable trip changes reviewable. The phone-first layout keeps key actions reachable and the itinerary readable in a travel context.',
  product: 'Product Manager perspective: frame the opportunity around reducing the effort and uncertainty of managing a business trip, then validate which moments cause the most friction through traveler interviews, support themes, and task observation. Prioritize a dependable trip overview and timely, context-aware assistance before broader automation. Confirm data freshness, service access, permissions, and recovery behavior as launch dependencies. Measure preparation-task completion, time to find trip information, successful use of route guidance, and traveler confidence, while watching for corrections and abandoned suggestions.',
  metric: 'Potential measures: time to find trip information, completion of preparation tasks, successful use of route guidance, expense task completion, and traveler confidence in assistant suggestions.',
  role: 'Product design prototype · mobile-first business travel companion',
  prototypeHref: 'WorkPal/index.html',
  designerSteps: [['Map the travel timeline', 'Follow the journey from preparation through return. Identify what travelers need at each phase and what information should stay close at hand.'], ['Prioritize the next useful action', 'Bring upcoming tasks, meetings, and travel details into a trip hub that reflects the traveler’s current context.'], ['Make assistance reviewable', 'Keep Ask Pal’s suggestions connected to the trip details and provide clear ways to inspect or change route and expense information.'], ['Design for interruption and recovery', 'Test the experience with realistic changes, limited connectivity, and mobile use so travelers can understand status and recover without losing context.']],
  pmSteps: [['Choose a traveler outcome', 'Validate which moments create the most effort for business travelers and define the primary outcome before adding more assistant capabilities.'], ['Verify the data foundation', 'Confirm which trip records are available, how fresh they are, and where travelers need to verify details before acting.'], ['Sequence a dependable MVP', 'Prioritize trip overview, preparation tasks, and contextual assistance. Treat maps, voice support, and external service handoffs as dependencies with clear limits.'], ['Measure usefulness and trust', 'Track task completion and time to information alongside corrections, abandoned suggestions, and traveler confidence. Use results to decide what should be automated next.']],
  roadblock: { challenge: 'A helpful travel assistant needs to work across many trip moments, but broad automation can make it unclear what information is current or what the assistant has actually changed.', design: 'Keep the experience organized around the traveler’s trip phase and make suggestions, route changes, and expense edits reviewable before they are applied.', product: 'Validate the data and service dependencies behind each action. Expand from contextual information to higher-impact actions only when accuracy, recovery, and user control meet clear release criteria.' }
});

projects.push({
  title: 'Margin · AI-assisted product delivery workspace',
  category: 'AI AGENT · PRODUCT MANAGEMENT',
  brief: 'Margin is a workspace for managing a product initiative from roadmap to development. It brings project progress, roadmap position, requirements, and delivery work into one flow, with AI assistance to draft tickets and surface gaps in a PRD before the team hands work to engineering.',
  challenge: 'Managing a feature means keeping its intent connected to the work that will deliver it. In many teams, roadmap priorities, project status, PRDs, decisions, and tickets sit in different places. Priorities shift, dependencies surface late, and engineers have to ask for context that never made it into the handoff. A product manager then spends time reconciling status and rewriting the same information for each tool instead of resolving the open product questions. Margin is designed to make the initiative’s place in the roadmap and its delivery progress easier to scan, then carry that context into requirements and tickets. Its AI support can help a PM get from an early brief to reviewable PRD and ticket drafts, while calling out information that still needs a decision.',
  design: 'I organized the workspace around the product lifecycle: see where an initiative sits in the roadmap, understand its current progress, open the project brief and requirements, then move into the tickets that make up delivery. Timeline, project, and weekly views give teams different ways to read progress without losing the initiative context. The PRD and ticket views keep the problem, intended outcome, requirements, source material, acceptance criteria, and ownership together. I placed AI assistance beside those steps so it can structure a first draft, suggest a ticket breakdown, or flag missing context while the PM can still edit the content. The important design decision is to make gaps visible instead of making an incomplete draft look finished. Product intent, AI suggestions, and committed work should stay distinguishable and reviewable.',
  product: 'The product opportunity is to reduce the coordination work between deciding what to build and giving a team enough context to build it well. I would start with one feature initiative and follow it from roadmap review through discovery, PRD, ticket breakdown, development, and delivery. The first release should connect status and roadmap position to the work items, then support PRD completeness and ticket drafting where PMs repeatedly translate or re-enter context. A useful AI partner should ground drafts in the brief and attached sources, identify unanswered questions such as users, constraints, dependencies, edge cases, and success criteria, and leave prioritization and approval with the PM and team. Shifting priorities, stale source material, unclear ownership, and engineering dependencies need to remain visible throughout the workflow. I would measure time to a reviewable PRD and ticket set, requirement and acceptance-criteria completeness, clarification and rework after handoff, roadmap-to-delivery traceability, and how often AI suggestions are accepted, edited, or rejected.',
  metric: 'The prototype has no measured launch results. I would evaluate time from an initiative brief to a reviewable PRD and ticket set, completeness of requirements and acceptance criteria, clarification and rework during development, roadmap-to-delivery traceability, and the quality of AI suggestions after PM review.',
  role: 'Product design prototype · AI-assisted product management and delivery',
  prototypeHref: 'AI Project Dashboard/dist/index.html',
  designerSteps: [['Connect intent to delivery', 'Keep the initiative, roadmap position, project state, PRD, and work items linked so a change in one part does not erase the context in another.'], ['Make progress easy to read', 'Use roadmap and project views to show stage, status, ownership, dependencies, and next milestones. Distinguish a decision that is blocked from work that is simply in progress.'], ['Help a PM shape requirements', 'Let the PM capture the problem, users, outcome, scope, constraints, and evidence. Use AI to point out missing context or unanswered questions, not silently invent answers.'], ['Draft tickets with enough context', 'Turn an approved requirement into a useful first pass at stories, tasks, and acceptance criteria. Keep links back to the PRD and let the PM and engineering team edit the breakdown.'], ['Keep AI work reviewable', 'Show where a draft came from, which details are missing, and what still needs a human decision before the work is considered ready.']],
  pmSteps: [['Define the through-line', 'Choose a real initiative and make its customer problem, intended outcome, roadmap position, and accountable owner clear before adding process automation.'], ['Set up one source of context', 'Agree which project, roadmap, requirement, and ticket fields are authoritative. Make dependencies, assumptions, priority changes, and unresolved decisions visible instead of leaving them in separate documents or conversations.'], ['Use AI at the translation points', 'Start where PMs repeat work: structuring a PRD, checking it for missing users, constraints, edge cases, dependencies, and success measures, and drafting tickets from approved requirements. Require review before anything becomes committed scope.'], ['Close the loop with delivery', 'Keep status and ticket progress connected to the roadmap initiative. When delivery reveals a gap or the priority changes, make it possible to update the PRD and communicate the impact.'], ['Measure handoff quality', 'Track time to a reviewable brief and ticket set, developer clarification and rework, requirement coverage, status freshness, and traceability from roadmap intent to shipped work. Review AI drafts for useful edits, unsupported details, and omissions.']],
  roadblock: { challenge: 'Roadmaps, PRDs, project status, and development tickets often drift apart. Shifting priorities and late dependencies make that gap worse: teams lose the reason behind the work, while the PM has to reconstruct progress and answer the same questions across tools.', design: 'Keep the initiative’s roadmap position, current status, requirements, decisions, and tickets connected. Use AI to accelerate first drafts and call out missing information, while clearly separating confirmed context from suggestions that still need review.', product: 'Define where roadmap and ticket status come from, how changes propagate, and who approves scope. Start with PRD completeness and ticket drafting before automating prioritization or commitments. Evaluate saved coordination time alongside requirement quality, handoff rework, and whether roadmap status stays current.' }
});

const caseStudyDetails = [
  {
    brief: 'Odyssey is a communications workspace for messages, projects, and reports. I wanted its sidebar to make the information hierarchy easier to scan, use space efficiently, and bring attention to the items that need it.',
    design: 'I led the design, focusing on a calmer, clearer navigation system. The work starts with understanding what people need to reach most, then separating primary destinations from secondary actions and making priority states easy to spot.',
    product: 'From a product perspective, I’d start with the jobs people come to the workspace to do. I’d prioritize the highest-value routes with RICE, then look at task completion, time to destination, and backtracking.',
    metric: 'Time to reach a project or report, navigation task success, backtracking, and use of priority items.',
    designerSteps: [['Map the workspace', 'List the main jobs across messages, projects, and reports. Identify the destinations people use most and the moments when they lose their place.'], ['Set the hierarchy', 'Group related destinations, distinguish global navigation from page actions, and give priority items a clear but restrained visual treatment.'], ['Prototype the sidebar', 'Explore compact and expanded states, labels, icons, and responsive behavior. Keep the information visible without making every item compete for attention.'], ['Check focus and speed', 'Test realistic find-and-return tasks. Look for missed priority items, unnecessary clicks, and places where the sidebar takes space away from the work.']],
    pmSteps: [['Define the outcome', 'Agree which navigation tasks should become easier and for whom. Treat faster access to important work as the goal, not a prettier sidebar.'], ['Find the friction', 'Review task data and support feedback, then talk with people who use multiple workspace areas. Separate label confusion from hierarchy or discoverability problems.'], ['Choose a small release', 'Prioritize the highest-traffic or highest-cost navigation issue. Align design and engineering on labels, states, responsive behavior, and migration constraints.'], ['Measure the change', 'Compare task success, time to destination, backtracking, and priority-item visits before and after release. Use feedback to decide what to refine next.']]
  },
  {
    brief: 'Korean Air’s website felt dated and made useful travel information hard to find. I redesigned the experience around clearer navigation and more direct paths through trip search and booking.',
    design: 'I led the redesign with a focus on information architecture and easier scanning. The key is to make booking tasks obvious while keeping destination and travel information easy to reach when people need it.',
    product: 'I’d use booking analytics and traveler feedback to find where people lose confidence or drop out. Then I’d prioritize the fixes by reach, impact, confidence, and effort, and track completion at each booking step.',
    metric: 'Findability of key travel information, search completion, booking-step abandonment, and booking errors.',
    designerSteps: [['Audit the current paths', 'Walk through finding a flight, comparing options, and locating essential trip information. Record unclear labels, dead ends, and repeated navigation.'], ['Reorganize around traveler tasks', 'Group content by what travelers are trying to do. Keep flight search prominent and give supporting information a predictable home.'], ['Redesign the booking flow', 'Clarify the order of choices, form labels, fare details, and confirmation. Make errors easy to understand and fix.'], ['Test the new structure', 'Ask travelers to complete realistic tasks on desktop and mobile. Check whether they find the right information and move through booking with fewer hesitations.']],
    pmSteps: [['Set the customer and business goal', 'Agree whether the first priority is information findability, booking completion, or both, and define guardrails for usability and accessibility.'], ['Locate the biggest obstacles', 'Review search and booking analytics alongside customer feedback. Identify the steps where people abandon, repeat searches, or seek help.'], ['Prioritize the redesign', 'Sequence information architecture, search, and booking improvements by user impact, effort, and dependencies such as fare and flight data.'], ['Track the funnel', 'Compare search completion and step-level drop-off before and after release. Pair conversion data with usability feedback so the team understands why behavior changed.']]
  },
  {
    brief: 'Orchid Garden is a flower-shopping app for a large product catalog. I wanted shoppers to explore more easily, move through clearer categories, and keep track of what was already in their basket.',
    design: 'I led the design around product discovery and basket visibility. The experience should help people browse by a familiar need, understand a product at a glance, and stay oriented as they add items.',
    product: 'I’d map the path from browsing to checkout and find where shoppers get stuck. RICE can help prioritize navigation and basket improvements before adding more features; I’d follow discovery, add-to-cart, and checkout together.',
    metric: 'Product findability, product-detail visits, add-to-basket rate, basket edits, and checkout completion.',
    designerSteps: [['Understand shopping intent', 'Learn how customers describe what they want, such as an occasion, style, or budget. Use those terms to shape categories and entry points.'], ['Make browsing easier', 'Create a clear category hierarchy and scannable product cards. Keep enough detail to compare items without turning every card into a wall of text.'], ['Keep the basket in view', 'Show when an item has been added and make basket contents easy to inspect or edit without losing the browsing context.'], ['Test the whole journey', 'Ask shoppers to find an appropriate bouquet, compare options, and confirm what is in their basket. Note where labels or feedback cause uncertainty.']],
    pmSteps: [['Define the shopping problem', 'Choose the customer segment and shopping need to support first. Set a clear goal for discovery and purchase completion.'], ['Read the funnel', 'Review catalog searches, category use, product views, basket changes, and checkout exits. Ask customers what they could not find or understand.'], ['Prioritize discovery and basket fixes', 'Estimate the value of better categories, product information, and basket visibility. Sequence work around catalog quality and checkout dependencies.'], ['Evaluate conversion quality', 'Track add-to-basket and checkout completion alongside removals, returns, and support contacts. Better conversion should also mean shoppers understood what they chose.']]
  },
  {
    brief: 'Finding a doctor in Quebec can be a frustrating process. Care Finder is an app intended to make that search easier by helping people narrow down the kind of care they need and compare providers against their needs.',
    design: 'I led the design around a more guided search and clearer provider comparison. The goal is to help people understand their options and make a useful next step without overstating what a profile can tell them.',
    product: 'I’d work with care teams to define what a useful match means and where provider data has gaps. An opportunity tree can help prioritize the biggest unmet need, with no-result searches and match quality as guardrails.',
    metric: 'Search completion, useful provider matches, no-result searches, profile-to-contact actions, and time to find an option.',
    designerSteps: [['Understand the search journey', 'Map how someone goes from a concern to a provider search. Identify where people get stuck, what information they trust, and what they need to compare.'], ['Guide the first choices', 'Use plain language to narrow the search by care need. Make it easy to change an answer or broaden the search if the first path does not help.'], ['Make provider fit legible', 'Present relevant provider details consistently, explain what each detail means, and avoid implying a guaranteed clinical match.'], ['Test difficult cases', 'Test no-result, incomplete-profile, and limited-availability scenarios. Make the next available step clear and keep urgent-care guidance within verified product requirements.']],
    pmSteps: [['Align on the service promise', 'Set expectations for what the app can and cannot do. Confirm provider-data sources, coverage, and how information will stay current.'], ['Understand unmet demand', 'Combine search behavior with patient and provider feedback. Find common dead ends and separate a discovery problem from a provider-availability problem.'], ['Prioritize a safe match flow', 'Start with the most useful care categories and reliable provider details. Coordinate data, clinical, privacy, and operations dependencies.'], ['Measure access and trust', 'Track successful searches, no-result rates, contact follow-through, and user confidence. Review mismatches and stale listings as product quality signals.']]
  },
  {
    brief: 'SoundSphere is a music platform designed to make listening and discovery work together. People can keep their music playing while exploring what to hear next.',
    design: 'I led the design with a focus on navigation during playback. The listening experience needs to keep playback controls easy to reach while making discovery feel like a natural next step.',
    product: 'I’d choose whether discovery, saving, or returning to music is the first outcome to improve. An opportunity solution tree can connect that need to a focused release; successful playback and unwanted interruptions are useful paired measures.',
    metric: 'Discovery-to-play rate, playback interruptions, saves, repeat listening, and successful playback starts.',
    designerSteps: [['Map listening behavior', 'Understand how people move between search, library, playlists, and discovery while audio is playing. Note what they need to keep visible.'], ['Keep playback in reach', 'Create a persistent player and clear navigation so listeners can browse without losing control of the current track or queue.'], ['Connect discovery to listening', 'Show enough context to judge a recommendation and make play, save, and return actions easy to find.'], ['Test while multitasking', 'Test the interface during common listening tasks. Check whether people can explore, manage the queue, and return to playback without losing their place.']],
    pmSteps: [['Choose the product outcome', 'Decide whether the first opportunity is discovery, return listening, or playlist engagement. Avoid optimizing time spent without evidence of listener value.'], ['Find the interruption points', 'Review listening and discovery journeys. Combine event data with listener interviews to see where exploration breaks playback or fails to lead to a play.'], ['Prioritize the connection', 'Sequence improvements to the persistent player, discovery entry points, and save actions. Coordinate catalog, recommendation, and playback dependencies.'], ['Measure discovery value', 'Track plays from discovery, saves, repeat listening, and playback failures. Check that discovery improves without increasing unwanted interruptions.']]
  },
  {
    brief: 'Newton is an operations dashboard for product managers and business teams. It aims to show a lot of useful information with minimal color and without making the overview feel overwhelming.',
    design: 'I led the design around information hierarchy and efficient use of space. The dashboard should make the important signals easy to scan, then let people move into detail when they need to act.',
    product: 'I’d start with the decisions this dashboard needs to support and prioritize the signals that help people act. RICE can help sequence the work; time to spot a blocker and resolution time show whether the overview is useful.',
    metric: 'Time to identify an issue, dashboard task success, drill-down use, and resolution time for flagged work.',
    designerSteps: [['Identify key decisions', 'Talk with the people monitoring operations and list the decisions they make from the overview. Separate must-see signals from supporting detail.'], ['Build a clear hierarchy', 'Group related information, use color only when it adds meaning, and give exceptions enough emphasis to stand out.'], ['Design overview and detail', 'Keep the top-level view concise while making it easy to inspect a project, owner, status, or blocker without losing context.'], ['Check scanability', 'Test whether people can find a blocker and understand what needs attention. Refine density, labels, and visual priority based on where they hesitate.']],
    pmSteps: [['Define the decisions and users', 'Clarify which roles rely on the dashboard and what operational action should follow from each signal.'], ['Validate the information need', 'Compare existing reports and team workarounds. Confirm which data is trusted, timely, and actionable.'], ['Prioritize meaningful signals', 'Select the smallest set of status and exception views that support action. Coordinate data quality and permissions before adding more metrics.'], ['Measure decision support', 'Track time to spot and resolve issues, repeat use by target roles, and whether users still maintain parallel reports.']]
  },
  {
    brief: 'Stay is an app for finding places to stay outside the city. The experience helps travelers browse accommodation and understand the details before choosing a place.',
    design: 'I led the design around easier exploration and clearer comparison. Search, filters, property details, and the path to booking should work together so travelers can narrow choices without losing their criteria.',
    product: 'I’d look for the unanswered questions that stop someone from booking, then prioritize the details that build confidence. I’d track qualified property views and booking completion, while checking whether fees and policies are clear.',
    metric: 'Search-to-detail engagement, filter success, booking starts, reservation completion, and questions about property details.',
    designerSteps: [['Understand the trip', 'Learn how people choose a destination, dates, and type of stay. Identify which constraints they need to keep visible while browsing.'], ['Make exploration flexible', 'Design filters and result cards that make relevant differences easy to compare. Keep search criteria available as people move between results and details.'], ['Clarify the property decision', 'Give amenities, price, availability, and booking details a consistent place so travelers can assess a stay without hunting.'], ['Test browse to book', 'Ask travelers to find and compare stays, then decide whether to proceed. Observe where they need more detail or lose confidence.']],
    pmSteps: [['Choose the traveler problem', 'Define which trip-planning need to serve first and what counts as a useful result for that traveler.'], ['Find decision friction', 'Review search refinement, result-to-detail behavior, and booking exits. Use interviews to learn which missing details change a decision.'], ['Prioritize the journey', 'Sequence improvements to filters, result comparison, and property details. Confirm availability, pricing, and policy dependencies.'], ['Measure qualified progress', 'Track useful property views, booking starts and completion, plus post-booking questions or cancellations that indicate a mismatch.']]
  },
  {
    title: 'Home Voice Care · Smart home assistant',
    brief: 'Home Voice Care is a smart-home app that uses voice commands and AI to control household devices and notify residents when something new happens at home.',
    design: 'I led the design around making voice and home controls understandable. People need to know which device will respond, what the system heard, and what changed after a command or notification.',
    product: 'I’d begin with a small set of useful, dependable home actions and define privacy and safety boundaries up front. A risk-and-reversibility review can help sequence features; failed commands and false alerts should stay visible.',
    metric: 'Successful commands, correction rate, alert usefulness, false-alert reports, setup completion, and repeat use.',
    designerSteps: [['Map household tasks', 'Identify common actions by room and device, plus the situations where a person wants to be notified. Include shared-home and accessibility needs.'], ['Make commands legible', 'Show what the assistant heard, which device it will affect, and whether the action completed. Give people a clear way to correct or cancel.'], ['Design useful alerts', 'Explain what changed, why it matters, and what the resident can do next. Make alert settings and privacy controls easy to find.'], ['Test errors and edge cases', 'Test misunderstood commands, offline devices, conflicting requests, and false alerts. Make recovery predictable and avoid taking consequential actions without clear confirmation.']],
    pmSteps: [['Select the first use case', 'Choose one household task or alert that solves a frequent, validated problem. Define the value and the boundaries of the assistant.'], ['Validate trust and feasibility', 'Check device compatibility, data access, privacy expectations, and the cost of incorrect commands or alerts.'], ['Scope a reliable release', 'Prioritize setup, core controls, status feedback, and recovery before broad automation. Align platform, hardware, and support requirements.'], ['Evaluate usefulness and safety', 'Track command success and corrections, alert usefulness and false alarms, and user retention. Use those signals to decide whether to expand.']]
  },
  {
    brief: 'Care Scheduling brings provider selection and appointment booking into a mobile flow. The project focuses on making the path from choosing a provider to confirming a time easier to follow.',
    design: 'I led the design with a focus on clear navigation through the booking steps. Availability, required details, and confirmation should stay understandable as people move through the flow.',
    product: 'I’d plan around both patient needs and clinic capacity. Mapping the operational dependencies before prioritizing helps avoid a smoother-looking flow that cannot be fulfilled; I’d track completion alongside reschedules and staff workload.',
    metric: 'Booking completion, time to book, slot-selection errors, reschedules, and support questions about appointments.',
    designerSteps: [['Map the booking journey', 'List the decisions from provider choice through appointment confirmation. Identify the details people need at each step.'], ['Make availability clear', 'Present appointment options in a way that is easy to compare and understand. Keep the selected provider and time visible as the flow progresses.'], ['Reduce form friction', 'Ask only for necessary information, explain why it is needed, and make validation errors easy to correct.'], ['Test end to end', 'Test unavailable slots, changed selections, and confirmation. Check that people know whether the appointment is booked and what happens next.']],
    pmSteps: [['Define booking success', 'Align patients, clinic operations, and product on what a completed booking means and which constraints the flow must respect.'], ['Locate drop-off', 'Review scheduling availability, booking exits, reschedules, and staff workarounds. Confirm whether the issue is the interface or limited appointment supply.'], ['Prioritize the flow', 'Sequence provider choice, slot selection, and form improvements around the biggest friction and scheduling-system dependencies.'], ['Track completed appointments', 'Measure booking completion and time alongside reschedules, cancellations, and staff workload to ensure the change improves the whole process.']]
  },
  {
    title: 'Crunchyroll · Anime discovery',
    brief: 'The anime discovery experience is a redesign of Crunchyroll. I felt the existing page needed a refresh, with clearer navigation, better exploration, and an easy way to resume an anime where someone left off.',
    design: 'I led the design around discovery and continuity. People should be able to browse new shows, understand why a title may interest them, and return to the episode they were watching.',
    product: 'I’d balance finding something new with making it easy to resume a show. An opportunity tree can show whether the bigger friction is browsing, recommendations, or saved progress; browse-to-play and resume success keep both goals in view.',
    metric: 'Browse-to-play rate, time to resume, continue-watching selection, search success, and playback starts.',
    designerSteps: [['Audit discovery paths', 'Review navigation, search, featured content, and show categories. Find where viewers have to work too hard to locate something to watch.'], ['Clarify content exploration', 'Organize browsing around recognizable genres and useful title information. Make search and category navigation easy to reach.'], ['Make resuming effortless', 'Give continue-watching a clear position and show enough episode context to pick up without searching again.'], ['Test browse and return', 'Ask viewers to find a new show and resume an existing one. Check whether they can choose confidently and return to playback quickly.']],
    pmSteps: [['Set the viewing outcome', 'Decide how discovery and resuming should improve for viewers. Treat successful starts and returns as stronger signals than browsing time alone.'], ['Find the friction', 'Review search, browse, and continue-watching behavior. Ask viewers where recommendations or saved progress fail them.'], ['Prioritize a coherent update', 'Sequence navigation, discovery rows, and viewing progress based on user impact and content-platform dependencies.'], ['Measure starts and returns', 'Track browse-to-play and resume success, then review playback errors and repeat viewing to understand whether the redesign helps.']]
  },
  {
    brief: 'Getaway is an accommodation-discovery concept. The project explores how people can narrow their options and compare places to stay before deciding where to book.',
    design: 'I led the design around navigation and exploration, making it easier to move between search, filters, and accommodation details while keeping the trip criteria in view.',
    product: 'I’d define the trip this experience serves first, then identify which constraints most often narrow the search. RICE can help prioritize those controls, with useful-result rates and empty-search recovery as checks.',
    metric: 'Search refinement, relevant property views, empty-result recovery, booking starts, and booking completion.',
    designerSteps: [['Understand how people narrow choices', 'Identify the filters travelers reach for first and what makes a result feel relevant to their trip.'], ['Keep search context visible', 'Make destination, dates, guests, and filters easy to inspect and change as people explore.'], ['Support comparison', 'Give property details a consistent structure so travelers can compare options without repeatedly returning to search.'], ['Test empty and changed searches', 'Test filter combinations, no-result states, and changes to trip details. Make it easy to adjust a search and continue.']],
    pmSteps: [['Choose a target trip need', 'Define the traveler segment and booking need this experience should serve first.'], ['Validate search quality', 'Review common queries, refinement behavior, empty results, and traveler feedback to find where the catalog misses intent.'], ['Prioritize discovery controls', 'Sequence search, filters, and listing-detail improvements. Confirm listing quality and availability dependencies.'], ['Measure useful discovery', 'Track relevant property views, empty-result recovery, booking starts, and completed stays rather than raw search volume alone.']]
  },
  {
    brief: 'Home Energy is a connected-home dashboard for reviewing energy use and household device controls. The design challenge is to make a lot of useful information understandable at a glance.',
    design: 'I led the design around clear hierarchy and efficient use of space. Residents should be able to understand what is happening at home and locate the right control without decoding a dense dashboard.',
    product: 'I’d validate which readings people trust and what actions the product can reliably support. I’d prioritize the most useful insights first, then compare task success and comprehension with energy outcomes where attribution is possible.',
    metric: 'Understanding of energy information, successful control tasks, time to find a device, and repeat use.',
    designerSteps: [['Learn what residents need to know', 'Find out which readings and device states help people make a decision, and which details create noise.'], ['Organize by home and action', 'Group information in a way that matches how residents think about rooms and devices. Distinguish status from controls.'], ['Show clear feedback', 'Make the effect of a control easy to see and provide a useful recovery path when the device does not respond.'], ['Test comprehension', 'Ask residents to explain the energy overview and complete common control tasks. Refine labels and hierarchy where interpretation is uncertain.']],
    pmSteps: [['Define a useful outcome', 'Choose the customer action or understanding the product should improve. Avoid claiming energy savings unless the data can support attribution.'], ['Validate data and control limits', 'Check reading accuracy, device coverage, update frequency, and which controls are available to each household.'], ['Prioritize dependable information', 'Start with a small set of understandable readings and reliable controls. Coordinate device and data dependencies before adding complexity.'], ['Measure comprehension and use', 'Track successful control tasks, repeat use, and support issues. Measure energy change only when there is a sound baseline and attribution method.']]
  },
  {
    brief: 'Messenger combines messages from multiple social platforms in one place, so people do not have to visit several websites just to check conversations.',
    design: 'I led the design around a unified inbox that keeps conversations easy to find without losing the context of which platform they came from.',
    product: 'I’d find out which services people need together most and where switching causes real friction. I’d phase integrations around reliability, privacy, and notification control, then watch sync accuracy and account setup closely.',
    metric: 'Time to find a conversation, message response completion, account connection success, notification settings changes, and return use.',
    designerSteps: [['Understand switching behavior', 'Learn which services people check, how often they move between them, and what context they need before replying.'], ['Create a unified but recognizable inbox', 'Bring conversations together while keeping platform identity, unread state, and sender context clear.'], ['Make replies predictable', 'Design the conversation view and composer so people know which service they are replying through and can find shared files.'], ['Test trust and control', 'Test connected-account states, failed connections, notification controls, and message retrieval. Make privacy and service boundaries easy to understand.']],
    pmSteps: [['Validate the integration need', 'Identify target users and the services they need in one place. Check whether each integration is technically and contractually feasible.'], ['Prioritize the first connections', 'Use customer demand, reliability, and integration effort to choose a small useful set. Define how account access and data will be handled.'], ['Scope the core inbox', 'Prioritize conversation finding, unread state, reply routing, and notification control before adding broad features.'], ['Measure reduced friction', 'Track account setup, time to find and reply, connection failures, and notification opt-outs. Review trust feedback as a product-quality signal.']]
  },
  {
    brief: 'Navigate is a public-transit app for getting reliable bus arrival times and understanding how long a trip will take. Its friendly map and route experience aims to make transit information easier to use.',
    design: 'I led the design around clear navigation from destination search to route choice. Arrival time, route options, and the next step should be easy to read while someone is on the move.',
    product: 'I’d validate data freshness and route coverage before expanding the feature set. Prioritizing reliability first gives the team clear guardrails; route completion and arrival confidence matter more than search volume alone.',
    metric: 'Arrival-time accuracy, route selection, successful trip completion, reroutes, and reported confidence in transit information.',
    designerSteps: [['Understand the trip moment', 'Map how riders choose a destination, compare routes, and check when the next bus will arrive. Include the quick checks they make while walking.'], ['Make route choices comparable', 'Present duration, transfers, and arrival information consistently so riders can choose without parsing a dense map.'], ['Keep the next action clear', 'Show where to go, when to leave, and what to do if a route changes. Make map and list views support each other.'], ['Test in realistic conditions', 'Test route finding on a phone with time pressure and changing plans. Check legibility, confidence, and how riders recover from a missed bus or reroute.']],
    pmSteps: [['Define reliability', 'Agree what an accurate arrival and useful route mean for the first target use case and service area.'], ['Validate data coverage', 'Check transit-feed freshness, route coverage, disruption handling, and the limits of prediction accuracy.'], ['Prioritize the core journey', 'Focus on search, route comparison, and arrival updates before adding secondary discovery features. Coordinate mapping and transit-data dependencies.'], ['Track real trip usefulness', 'Measure prediction accuracy and route selection alongside successful trip completion, reroutes, and rider feedback.']]
  }
];
const roadblockDetails = [
  { challenge: 'The sidebar had to hold messages, projects, and reports without making every destination compete for attention.', design: 'I focused the hierarchy on primary destinations, grouped related links, and used progressive disclosure for secondary items. Clear labels and consistent placement support recognition over recall.', product: 'Use Jobs to Be Done to map the key workspace tasks, then apply RICE to prioritize the routes with the greatest user reach and impact. Track task success and time to destination.' },
  { challenge: 'Travelers needed to find booking actions and essential trip information in a site that felt dated and difficult to navigate.', design: 'I reorganized content around traveler tasks, made flight search visually prominent, and separated supporting information into clearer groups. Card sorting and tree testing are useful checks for whether that structure matches traveler expectations.', product: 'Use funnel data and customer feedback to locate the highest-friction booking step. Prioritize fixes with RICE, while tracking step completion and information-finding success.' },
  { challenge: 'A large flower catalog made it harder to browse by occasion, compare products, and keep track of the basket.', design: 'I brought category, occasion, and product details into a clearer browsing hierarchy. Persistent basket visibility and recognizable filter states help shoppers understand where they are and what they have selected.', product: 'Map the browse-to-purchase journey, then prioritize the biggest drop-off or confusion point with RICE. Measure product discovery, add-to-cart, and checkout completion together.' },
  { challenge: 'Finding a doctor in Quebec can feel overwhelming, especially when someone is unsure what kind of care to search for.', design: 'I shaped the experience around a guided start, plain-language care categories, and clear provider details. Progressive disclosure reduces the initial choice burden; visible criteria help people understand why a provider may fit.', product: 'Use an opportunity tree to break down failed searches, unclear needs, and provider availability. Prioritize the most common unmet need and guard against no-result searches or misleading fit signals.' },
  { challenge: 'Listeners needed to discover music without losing control of what was already playing.', design: 'I treated playback as a persistent part of the experience and kept discovery actions distinct from player controls. This supports user control and system status while reducing accidental interruption.', product: 'Define whether the first opportunity is discovery, saving, or returning to music. Use an opportunity solution tree to connect that need to a focused release, with successful playback as a guardrail.' },
  { challenge: 'The dashboard needed to show a lot of operational information without making every metric feel equally urgent.', design: 'I used hierarchy, spacing, restrained color, and progressive disclosure to separate status from detail. Exception-led emphasis helps direct attention to work that may need action.', product: 'Prioritize decisions the dashboard should improve using RICE, then connect leading signals such as blocker discovery to operational outcomes such as resolution time.' },
  { challenge: 'Travelers comparing stays outside the city needed enough location, amenity, and price context to choose with confidence.', design: 'I made key comparison details easier to scan and kept search criteria visible while exploring. Clear filter states and total-price context reduce uncertainty and support user control.', product: 'Map the search-to-reservation journey and identify where uncertainty slows a decision. Sequence the most valuable trust improvements, tracking qualified detail views and booking completion.' },
  { challenge: 'Voice and AI controls can make home actions feel unclear, especially when an automation changes something or reports a new situation.', design: 'I emphasized visible device status, clear confirmation, and a direct way to recover or switch to touch controls. These patterns support visibility of system status, error prevention, and user control.', product: 'Use a risk and reversibility lens to scope the first release around dependable actions. Define guardrails for failed commands and noisy alerts before expanding automation.' },
  { challenge: 'Booking an appointment depends on real availability, and a confusing flow can waste time for both patients and clinic staff.', design: 'I structured the steps around provider, time, and confirmation, with clear validation and preserved information when people go back. Timely feedback makes the booking state easier to understand.', product: 'Map clinic capacity and scheduling dependencies before prioritizing interface changes. Track booking completion alongside reschedules and staff-facing operational impact.' },
  { challenge: 'Viewers needed a simpler way to explore anime and return to a show they had already started.', design: 'I gave continue-watching a clear place, made viewing progress easy to read, and organized discovery so it did not bury familiar content. This supports recognition and reduces repeat searching.', product: 'Balance browse-to-play with resume success rather than optimizing clicks alone. Use an opportunity tree to identify whether navigation, recommendations, or continuation is the main friction.' },
  { challenge: 'Planning a getaway combines several changing constraints: place, dates, guests, and the type of stay.', design: 'I kept applied filters legible and connected map exploration to the available listings. Clear empty states and easy-to-edit criteria help people recover when a search is too narrow.', product: 'Prioritize the constraints that most often prevent a useful result. Validate listing and map data quality, then measure qualified results and recovery from empty searches.' },
  { challenge: 'Energy readings and device controls can become overwhelming when people cannot tell what matters or what action to take.', design: 'I grouped information by room, used plain-language status, and connected a control action to clear feedback. Progressive disclosure keeps the overview readable while leaving detail available.', product: 'Prioritize insights that lead to a meaningful action, not just more data. Pair task success and comprehension with energy outcomes where the available data supports attribution.' },
  { challenge: 'Combining messages from several social platforms risks confusing identities, unread states, and notification expectations.', design: 'I focused on consistent navigation and clear account context across conversations. Distinct unread and source cues help people recognize where a message came from without repeatedly opening settings.', product: 'Treat platform access and synchronization as core dependencies. Phase the experience around reliable integrations first, with sync accuracy and notification control as launch guardrails.' },
  { challenge: 'Transit directions are only useful when arrival information feels current and route choices are easy to understand.', design: 'I kept the next action and arrival estimate prominent, with route context and alternatives available when needed. Showing update status and recovery options helps preserve trust when conditions change.', product: 'Validate data freshness and route coverage before expanding features. Set reliability guardrails, then follow the journey from route selection through arrival rather than measuring searches alone.' },
];

projects.forEach((project, index) => Object.assign(project, caseStudyDetails[index], { roadblock: roadblockDetails[index] || project.roadblock }));

const categoryList = document.querySelector('#category-list');
const projectSlider = document.querySelector('#project-slider');
const caseDialog = document.querySelector('#case-dialog');
const caseContent = document.querySelector('#case-content');
const imageLightbox = document.querySelector('#image-lightbox');
const lightboxImages = document.querySelector('#lightbox-images');
const lightboxTitle = document.querySelector('#lightbox-title');
const lightboxThumbnails = document.querySelector('#lightbox-thumbnails');
let activeCaseProjectIndex = 0;
let caseStudyReturnScrollY = 0;
let caseStudyReturnTitle = document.title;
let expandedSlides = [];
let expandedSlideIndex = 0;

const categories = [
  { id: 'all', label: 'All projects', indexes: projects.map((_, index) => index) },
  { id: 'ai-agent', label: 'AI agent', indexes: [14, 15, 16] },
  { id: 'health', label: 'Healthcare', indexes: [3, 8] },
  { id: 'travel', label: 'Travel & mobility', indexes: [1, 6, 10, 13] },
  { id: 'productivity', label: 'Productivity & collaboration', indexes: [0, 5, 12] },
  { id: 'home', label: 'Home & connected devices', indexes: [7, 11] },
  { id: 'culture', label: 'Commerce, culture & media', indexes: [2, 4, 9] }
];
const projectScreens = [
  { type: 'sidebarPair', files: ['Portfolio/separated/odyssey-01.webp', 'Portfolio/separated/odyssey-02.webp'] },
  { type: 'desktop', files: ['Portfolio/original-11dcdc9c0748cb8623ba08033f897638.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/orchid-garden-nav-01.webp', 'Portfolio/separated/orchid-garden-nav-02.webp', 'Portfolio/separated/orchid-garden-detail-nav.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/care-finder-03.webp', 'Portfolio/separated/care-finder-02.webp', 'Portfolio/separated/care-finder-01.webp'] },
  { type: 'desktop', files: ['Portfolio/separated/soundsphere-01.webp'] },
  { type: 'desktop', files: ['Portfolio/separated/newton-dashboard-01.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/cottage-stays-01.webp', 'Portfolio/separated/cottage-stays-02.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/home-assistant-01.webp', 'Portfolio/separated/home-assistant-02.webp', 'Portfolio/separated/home-assistant-03.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/care-scheduling-01.webp', 'Portfolio/separated/care-scheduling-02.webp'] },
  { type: 'desktop', files: ['Portfolio/separated/anime-stream-01.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/getaway-01.webp', 'Portfolio/separated/getaway-02.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/home-control-01.webp'] },
  { type: 'desktop', files: ['Portfolio/separated/messenger-01.webp'] },
  { type: 'mobile', files: ['Portfolio/separated/maps-transit-01.webp', 'Portfolio/separated/maps-transit-02.webp', 'Portfolio/separated/maps-transit-03.webp'] },
  { type: 'agent', files: ['welcome', 'dashboard'], mobileFiles: ['dashboard', 'review'] },
  { type: 'workpal', files: ['overview', 'schedule', 'essentials', 'activity'] },
  { type: 'planner', files: ['timeline', 'board', 'week'] }
];
let activeCategory = categories[0];
let sliderLoopPoint = 0;
let sliderPaused = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartScrollLeft = 0;
let sliderPointerDown = false;
let isDraggingSlider = false;
let suppressSliderClick = false;
let sliderResumeTimer = 0;
const sliderToggle = document.querySelector('#slider-toggle');

function updateSliderToggle() {
  sliderToggle.textContent = sliderPaused ? '▶' : 'Ⅱ';
  sliderToggle.setAttribute('aria-label', sliderPaused ? 'Resume project scrolling' : 'Pause project scrolling');
  sliderToggle.setAttribute('aria-pressed', String(sliderPaused));
}
updateSliderToggle();

function renderDevice(file, type, className = '') {
  const expandable = /(?:^|\s)(?:case-device|case-gallery-device|case-gallery-mobile-device)(?:\s|$)/.test(className)
    ? ' role="button" tabindex="0" aria-label="Expand project screen"'
    : '';
  if (type === 'sidebarPair') {
    return `<span class="sidebar-artwork sidebar-artwork-pair ${className}"${expandable}>${file.map((image, index) => `<img src="${image}" alt="Odyssey ${index === 0 ? 'dark' : 'light'} mode sidebar" loading="lazy">`).join('')}</span>`;
  }
  if (type === 'agent') {
    const preview = typeof file === 'string' ? file : 'welcome';
    return `<span class="desktop-device agent-device ${className}"${expandable}><span class="desktop-chrome"><i></i><i></i><i></i><b>AirScout · ${preview}</b></span><span class="desktop-display agent-display"><iframe src="AirScout/index.html?preview=${encodeURIComponent(preview)}&amp;release=booking-confirmed-check-v1" title="AirScout ${preview} page preview" tabindex="-1" loading="lazy"></iframe></span></span>`;
  }
  if (type === 'agentMobile') {
    const preview = typeof file === 'string' ? file : 'dashboard';
    return `<span class="project-device agent-mobile-device ${className}"${expandable}><span class="device-island"></span><span class="device-screen"><iframe src="AirScout/index.html?preview=${encodeURIComponent(preview)}&amp;release=booking-confirmed-check-v1" title="AirScout ${preview} mobile page preview" tabindex="-1" loading="lazy"></iframe></span><span class="device-home"></span></span>`;
  }
  if (type === 'workpal') {
    const previewPage = typeof file === 'string' ? file : 'overview';
    return `<span class="project-device workpal-device ${className}"${expandable}><span class="device-island"></span><span class="device-screen"><iframe src="WorkPal/index.html?portfolioPreview=1&amp;previewPage=${encodeURIComponent(previewPage)}" title="WorkPal ${previewPage} page preview" tabindex="-1" loading="lazy"></iframe><span class="workpal-scroll-indicator" aria-hidden="true"><i></i></span></span><span class="device-home"></span></span>`;
  }
  if (type === 'planner') {
    const view = typeof file === 'string' ? file : 'timeline';
    const title = view === 'board' ? 'Projects' : view === 'week' ? 'This week' : 'Timeline';
    return `<span class="desktop-device planner-device ${className}"${expandable}><span class="desktop-chrome"><i></i><i></i><i></i><b>Margin · ${title}</b></span><span class="desktop-display planner-display"><iframe src="AI Project Dashboard/dist/index.html?portfolioPreview=1&amp;previewView=${encodeURIComponent(view)}" title="Margin ${title} project planning view" tabindex="-1" loading="lazy"></iframe></span></span>`;
  }
  if (type === 'desktop') {
    const alt = file.includes('11dcdc9c0748cb8623ba08033f897638')
      ? 'Korean Air flight search and destination discovery page with the main navigation, booking form, and complete destination cards.'
      : 'Desktop app screen';
    return `<span class="desktop-device ${className}"${expandable}><span class="desktop-chrome"><i></i><i></i><i></i></span><span class="desktop-display"><img src="${file}" alt="${alt}" loading="lazy"></span></span>`;
  }
  return `<span class="project-device ${className}"${expandable}><span class="device-island"></span><span class="device-screen"><img src="${file}" alt="Mobile app screen" loading="lazy"></span><span class="device-home"></span></span>`;
}

function updateWorkPalScrollIndicator(event) {
  const data = event.data;
  if (data?.type !== 'workpal-scroll') return;
  const frame = [...document.querySelectorAll('.workpal-device iframe')].find((item) => item.contentWindow === event.source);
  const track = frame?.closest('.device-screen')?.querySelector('.workpal-scroll-indicator');
  const thumb = track?.querySelector('i');
  if (!track || !thumb) return;
  const range = Math.max(0, data.scrollHeight - data.clientHeight);
  if (!range) { track.classList.remove('is-scrollable'); return; }
  const trackHeight = track.clientHeight;
  const thumbHeight = Math.max(18, trackHeight * data.clientHeight / data.scrollHeight);
  const travel = Math.max(0, trackHeight - thumbHeight);
  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${travel * Math.min(1, data.scrollTop / range)}px)`;
  track.classList.add('is-scrollable');
}
window.addEventListener('message', updateWorkPalScrollIndicator);

function fitPhoneScreen(image) {
  const fit = () => {
    const frame = image.closest('.project-device');
    const screen = image.closest('.device-screen');
    if (!frame || !screen || !image.naturalWidth || !image.naturalHeight) return;
    const frameStyle = getComputedStyle(frame);
    const paddingTop = parseFloat(frameStyle.paddingTop);
    const paddingRight = parseFloat(frameStyle.paddingRight);
    const paddingBottom = parseFloat(frameStyle.paddingBottom);
    const paddingLeft = parseFloat(frameStyle.paddingLeft);
    const maxHeight = frame.clientHeight - paddingTop - paddingBottom;
    const screenHeight = maxHeight;
    const screenWidth = screenHeight * image.naturalWidth / image.naturalHeight;
    const frameWidth = screenWidth + paddingLeft + paddingRight + frame.clientLeft * 2;
    frame.style.setProperty('--phone-frame-width', `${frameWidth}px`);
    frame.style.width = `${frameWidth}px`;
    screen.style.width = `${screenWidth}px`;
    screen.style.height = `${screenHeight}px`;
  };
  if (image.complete) fit();
  else if (!image.dataset.fitListener) {
    image.dataset.fitListener = 'true';
    image.addEventListener('load', () => {
      delete image.dataset.fitListener;
      fit();
    }, { once: true });
  }
}

function fitPhoneScreens(root = document) {
  root.querySelectorAll('.device-screen img').forEach(fitPhoneScreen);
}

function fitWorkPalScreens(root = document) {
  root.querySelectorAll('.workpal-device .device-screen').forEach((screen) => {
    const scale = screen.clientHeight / 844;
    const viewportWidth = screen.clientWidth / scale;
    if (scale > 0) {
      screen.style.setProperty('--workpal-scale', String(scale));
      screen.style.setProperty('--workpal-viewport-width', `${viewportWidth}px`);
      screen.style.setProperty('--workpal-nav-clearance', `${70 * scale}px`);
    }
  });
}

function fitDesktopScreen(image) {
  const fit = () => {
    const frame = image.closest('.desktop-device');
    const display = image.closest('.desktop-display');
    if (!frame || !display || !image.naturalWidth || !image.naturalHeight) return;

    // Match the monitor height to the screenshot while keeping its CSS width.
    let screenWidth = display.clientWidth;
    if (frame.classList.contains('lightbox-device')) {
      const maxScreenHeight = window.innerHeight * (imageLightbox.classList.contains('has-multiple') ? 0.55 : 0.72);
      const maxScreenWidth = maxScreenHeight * image.naturalWidth / image.naturalHeight;
      if (screenWidth > maxScreenWidth) {
        const frameStyle = getComputedStyle(frame);
        const horizontalFrameSpace = parseFloat(frameStyle.paddingLeft) + parseFloat(frameStyle.paddingRight)
          + parseFloat(frameStyle.borderLeftWidth) + parseFloat(frameStyle.borderRightWidth);
        frame.style.width = `${maxScreenWidth + horizontalFrameSpace}px`;
        screenWidth = display.clientWidth;
      }
    }
    const screenHeight = screenWidth * image.naturalHeight / image.naturalWidth;
    const frameStyle = getComputedStyle(frame);
    const top = parseFloat(getComputedStyle(display).top) || 22;
    const bottom = parseFloat(getComputedStyle(display).bottom) || 7;
    const border = parseFloat(frameStyle.borderTopWidth) + parseFloat(frameStyle.borderBottomWidth);
    frame.style.height = `${screenHeight + top + bottom + border}px`;
  };
  if (image.complete) fit();
  else if (!image.dataset.fitDesktopListener) {
    image.dataset.fitDesktopListener = 'true';
    image.addEventListener('load', () => {
      delete image.dataset.fitDesktopListener;
      fit();
    }, { once: true });
  }
}

function fitDesktopScreens(root = document) {
  root.querySelectorAll('.desktop-display img').forEach(fitDesktopScreen);
}

function fitAgentScreens(root = document) {
  root.querySelectorAll('.agent-display').forEach((display) => {
    const frame = display.querySelector('iframe');
    if (!frame) return;
    const scale = Math.min(display.clientWidth / 1440, display.clientHeight / 900);
    if (!scale) return;
    frame.style.width = '1440px';
    frame.style.height = '900px';
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
  });
}

function fitPlannerScreens(root = document) {
  root.querySelectorAll('.planner-display').forEach((display) => {
    const frame = display.querySelector('iframe');
    if (!frame) return;
    const scale = Math.min(display.clientWidth / 1000, display.clientHeight / 625);
    if (!scale) return;
    frame.style.position = 'absolute';
    frame.style.width = '1000px';
    frame.style.height = '625px';
    frame.style.left = `${(display.clientWidth - 1000 * scale) / 2}px`;
    frame.style.top = `${(display.clientHeight - 625 * scale) / 2}px`;
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
  });
}

function fitAirScoutMobileScreens(root = document) {
  root.querySelectorAll('.agent-mobile-device:not(.case-gallery-mobile-device):not(.lightbox-device) .device-screen').forEach((screen) => {
    const frame = screen.querySelector('iframe');
    if (!frame) return;
    const scale = Math.min(screen.clientWidth / 390, screen.clientHeight / 720);
    if (!scale) return;
    frame.style.width = '390px';
    frame.style.height = '720px';
    frame.style.transform = `scale(${scale})`;
    frame.style.left = `${(screen.clientWidth - 390 * scale) / 2}px`;
    frame.style.top = `${(screen.clientHeight - 720 * scale) / 2}px`;
    frame.style.transformOrigin = 'top left';
  });
}

function renderCategoryList() {
  categoryList.innerHTML = categories.map((category) => `
    <button class="category-tab ${activeCategory.id === category.id ? 'active' : ''}" type="button" role="tab" aria-selected="${activeCategory.id === category.id}" data-category="${category.id}">
      <span class="category-index">${String(categories.indexOf(category) + 1).padStart(2, '0')}</span><span>${category.label}</span><span class="category-count">${category.indexes.length}</span>
    </button>`).join('');
}

function renderProjectSlider() {
  const screenItems = activeCategory.indexes.flatMap((projectIndex) => {
    const screenSet = projectScreens[projectIndex];
    if (screenSet.type === 'sidebarPair') return [{ projectIndex, file: screenSet.files, screenIndex: 0, deviceType: screenSet.type }];
    return [
      ...screenSet.files.map((file, screenIndex) => ({ projectIndex, file, screenIndex, deviceType: screenSet.type })),
      ...(screenSet.mobileFiles || []).map((file, screenIndex) => ({ projectIndex, file, screenIndex: screenSet.files.length + screenIndex, deviceType: 'agentMobile' }))
    ];
  });
  projectSlider.innerHTML = screenItems.map(({ projectIndex, file, screenIndex, deviceType }) => {
    const project = projects[projectIndex];
    const screenSet = projectScreens[projectIndex];
    const screenCount = deviceType === 'sidebarPair' ? 1 : screenSet.files.length + (screenSet.mobileFiles?.length || 0);
    const cardDeviceClass = deviceType === 'agent' ? 'desktop' : deviceType === 'agentMobile' ? 'mobile' : deviceType;
    const aiAgentClass = deviceType === 'agent' || deviceType === 'workpal' ? 'ai-agent-card' : '';
    return `<button class="slider-card ${cardDeviceClass}-card ${aiAgentClass}" type="button" data-project="${projectIndex}">
      <span class="device-wrap">${renderDevice(file, deviceType)}${deviceType === 'mobile' ? '<span class="device-glint"></span>' : ''}</span>
      <span class="slider-card-meta"><span class="slider-card-num">SCREEN ${String(screenIndex + 1).padStart(2, '0')} / ${String(screenCount).padStart(2, '0')}</span><span class="slider-card-arrow">↗</span></span>
      <span class="slider-card-title">${project.title}</span><span class="slider-card-category">${project.category}</span>
    </button>`;
  }).join('');
  const originalCards = [...projectSlider.children];
  if (originalCards.length > 1) {
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      projectSlider.append(clone);
    });
    sliderLoopPoint = 0;
  } else {
    sliderLoopPoint = 0;
  }
  const label = document.querySelector('#slider-label');
  label.textContent = `${activeCategory.label.toUpperCase()} · ${screenItems.length} SCREENS / ${activeCategory.indexes.length} PROJECTS`;
  projectSlider.scrollLeft = 0;
  measureSliderLoop();
}

function measureSliderLoop() {
  const originalCount = projectSlider.children.length / 2;
  if (!Number.isInteger(originalCount) || originalCount < 1) {
    sliderLoopPoint = 0;
    return;
  }
  const cloneStart = projectSlider.children[originalCount];
  if (cloneStart) {
    sliderLoopPoint = cloneStart.getBoundingClientRect().left - projectSlider.getBoundingClientRect().left + projectSlider.scrollLeft;
  }
  fitPhoneScreens(projectSlider);
  fitDesktopScreens(projectSlider);
  fitPlannerScreens(projectSlider);
  fitAgentScreens(projectSlider);
  fitAirScoutMobileScreens(projectSlider);
  fitWorkPalScreens(projectSlider);
}

function initPrototypeCarousel() {
  const carousel = document.querySelector('#prototype-carousel');
  const track = document.querySelector('#prototype-carousel-track');
  const pagination = document.querySelector('#prototype-carousel-pagination');
  if (!carousel || !track || !pagination) return;
  const slides = [...track.children];
  if (!slides.length) return;
  const projectTypes = { AirScout: 'TRAVEL', WorkPal: 'BUSINESS TRAVEL', Margin: 'PROJECT PLANNING' };
  const projectTeasers = {
    Margin: {
      lead: 'A workspace for taking a product initiative from roadmap to development: see progress, shape a complete PRD, and turn requirements into tickets with AI assistance.',
      rows: [['Purpose', 'Connect roadmap position, project progress, requirements, and delivery work'], ['AI support', 'Draft tickets and surface missing PRD context for PM review']]
    }
  };
  slides.forEach((slide, index) => {
    const title = slide.querySelector('h3')?.textContent.trim();
    const kicker = slide.querySelector('.airscout-kicker');
    if (kicker && projectTypes[title]) kicker.lastChild.textContent = ` FEATURED INTERACTIVE PROTOTYPE · AI-ASSISTED ${projectTypes[title]}`;
    const teaser = projectTeasers[title];
    if (teaser) {
      const lead = slide.querySelector('.airscout-feature-lead');
      if (lead) lead.textContent = teaser.lead;
      const metaRows = slide.querySelectorAll('.airscout-feature-meta span');
      teaser.rows.forEach(([label, value], rowIndex) => { if (metaRows[rowIndex]) metaRows[rowIndex].innerHTML = `<b>${label}</b> ${value}`; });
    }
    const prototypeLink = slide.querySelector('.airscout-feature-link[href]');
    if (!prototypeLink || slide.querySelector('.airscout-details-link')) return;
    prototypeLink.innerHTML = 'Open the interactive prototype <span aria-hidden="true">↗</span>';
    const actions = document.createElement('div');
    actions.className = 'airscout-feature-actions';
    prototypeLink.parentNode.insertBefore(actions, prototypeLink);
    actions.append(prototypeLink);
    const detailsButton = document.createElement('button');
    detailsButton.className = 'airscout-feature-link airscout-details-link';
    detailsButton.type = 'button';
    detailsButton.dataset.project = String([14, 15, 16][index]);
    detailsButton.innerHTML = 'Project details <span aria-hidden="true">↓</span>';
    actions.append(detailsButton);
  });
  let current = 0;
  let timer = 0;
  let dots = [];
  let pausedByPointer = false;
  let pausedByFocus = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.style.width = `${slides.length * 100}%`;
  slides.forEach((slide) => { slide.style.flex = `0 0 ${100 / slides.length}%`; slide.style.width = `${100 / slides.length}%`; });
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    const previewFrame = slides[current].querySelector('iframe[data-src]');
    if (previewFrame && !previewFrame.getAttribute('src')) {
      previewFrame.src = previewFrame.dataset.src;
      delete previewFrame.dataset.src;
    }
    track.style.transform = `translateX(-${current * (100 / slides.length)}%)`;
    dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    slides.forEach((slide, slideIndex) => {
      slide.setAttribute('aria-hidden', String(slideIndex !== current));
      slide.inert = slideIndex !== current;
    });
  };
  const stop = () => { window.clearInterval(timer); timer = 0; };
  const start = () => {
    if (reducedMotion || pausedByPointer || pausedByFocus || document.hidden || timer) return;
    timer = window.setInterval(() => show(current + 1), 9500);
  };
  dots = slides.map((slide, index) => {
    const title = slide.querySelector('h3')?.textContent.trim() || `Prototype ${index + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'prototype-carousel-dot';
    dot.setAttribute('aria-label', `Show ${title} featured prototype`);
    dot.addEventListener('click', () => { show(index); stop(); start(); });
    return dot;
  });
  pagination.replaceChildren(...dots);
  carousel.addEventListener('click', (event) => {
    const detailsButton = event.target.closest('.airscout-details-link[data-project]');
    if (!detailsButton) return;
    event.preventDefault();
    openCaseStudy(Number(detailsButton.dataset.project));
  });
  carousel.querySelector('[data-prototype-prev]')?.addEventListener('click', () => { show(current - 1); stop(); start(); });
  carousel.querySelector('[data-prototype-next]')?.addEventListener('click', () => { show(current + 1); stop(); start(); });
  carousel.addEventListener('pointerenter', () => { pausedByPointer = true; stop(); });
  carousel.addEventListener('pointerleave', () => { pausedByPointer = false; start(); });
  carousel.addEventListener('focusin', () => { pausedByFocus = true; stop(); });
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) { pausedByFocus = false; start(); }
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  show(0);
  start();
}

renderCategoryList();
renderProjectSlider();
initPrototypeCarousel();
fitWorkPalScreens(document);
fitPlannerScreens(document);
new ResizeObserver(measureSliderLoop).observe(projectSlider);

// A timer keeps the project carousel moving independently of animation-frame
// visibility throttling. Pause is still available by dragging or using the control.
window.setInterval(() => {
  if (sliderPaused || caseDialog.open || projectSlider.scrollWidth <= projectSlider.clientWidth) return;
  projectSlider.scrollLeft += 0.7;
  if (sliderLoopPoint && projectSlider.scrollLeft >= sliderLoopPoint) {
    projectSlider.scrollLeft -= sliderLoopPoint;
  }
}, 20);

projectSlider.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartScrollLeft = projectSlider.scrollLeft;
  sliderPointerDown = true;
  isDraggingSlider = false;
});

window.addEventListener('pointermove', (event) => {
  if (!sliderPointerDown || !event.isPrimary || !event.buttons) return;
  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;
  if (!isDraggingSlider && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
    isDraggingSlider = true;
    suppressSliderClick = true;
    sliderPaused = true;
    clearTimeout(sliderResumeTimer);
    updateSliderToggle();
    projectSlider.classList.add('is-dragging');
  }
  if (isDraggingSlider) {
    event.preventDefault();
    projectSlider.scrollLeft = dragStartScrollLeft - deltaX;
  }
});

function finishSliderDrag() {
  sliderPointerDown = false;
  if (!isDraggingSlider) return;
  isDraggingSlider = false;
  projectSlider.classList.remove('is-dragging');
  clearTimeout(sliderResumeTimer);
  sliderResumeTimer = window.setTimeout(() => {
    sliderPaused = false;
    updateSliderToggle();
  }, 5000);
}
window.addEventListener('pointerup', finishSliderDrag);
window.addEventListener('pointercancel', finishSliderDrag);
window.addEventListener('resize', () => {
  fitPhoneScreens();
  fitDesktopScreens();
  fitWorkPalScreens();
});

sliderToggle.addEventListener('click', () => {
  sliderPaused = !sliderPaused;
  updateSliderToggle();
});

categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = categories.find((category) => category.id === button.dataset.category);
  renderCategoryList();
  renderProjectSlider();
});

categoryList.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
  const tabs = [...categoryList.querySelectorAll('.category-tab')];
  const current = tabs.indexOf(document.activeElement);
  const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
  const next = tabs[(current + direction + tabs.length) % tabs.length];
  event.preventDefault();
  next.focus();
  next.click();
});

function moveSlider(direction) {
  const firstCard = projectSlider.querySelector('.slider-card');
  if (!firstCard) return;
  const gap = Number.parseFloat(getComputedStyle(projectSlider).columnGap) || 0;
  const distance = firstCard.getBoundingClientRect().width + gap;
  if (direction < 0 && projectSlider.scrollLeft <= 1 && sliderLoopPoint) {
    projectSlider.scrollLeft = Math.max(0, sliderLoopPoint - distance);
  } else {
    projectSlider.scrollLeft += direction * distance;
  }
}
document.querySelector('#slider-prev').addEventListener('click', () => moveSlider(-1));
document.querySelector('#slider-next').addEventListener('click', () => moveSlider(1));

const caseNarratives = [
  { users:'People coordinating conversations, project work, and reporting in one workspace.', situation:'A team member is switching between messages, project status, and reports.', motivation:'find the right update and act without losing the thread.', outcome:'a timely, well-informed next action.', constraint:'Dense information, multiple user roles, and preserving message/project context.', unknown:'Which destination users reach for most often, and where context switching costs them time.', hypothesis:'If destinations are grouped by primary jobs and current context stays visible, people can find and resume work with fewer detours.', focus:'Unify the entry points while keeping message, project, and report context recognizable.', defer:'Automations, advanced reporting, and new collaboration features until the core navigation is clear.', insights:['A combined workspace can save navigation effort only if each content type remains recognizable.','People need status and context at the point they decide what to open next.'], questions:['Which destinations and workarounds are used most often?','How do comparable workspaces group conversations, projects, and reports?','Can people find a message or project and resume the task without losing context?'], journey:'Open workspace → choose inbox, project, or report → scan context → take action → return to the broader work.', ia:'Group the primary destinations first; keep related projects and reports under clear, predictable labels.', decision:'Keep the core destinations visible, then group secondary routes by job.', alternative:'A flat list of every destination or separate workspaces for each content type.', reasoning:'The visible workload spans several related jobs; grouping reduces competition while preserving a shared workspace.', evidence:'Portfolio screens show the combined workspace structure. The CV confirms research and usability testing across roles, but no finding is tied to this case.', tasks:['Find a recent conversation linked to a project.','Locate a report and return to the active project.','Recover when a destination is empty or access is unavailable.'], measure:'Task success, time to locate a message/project, repeated navigation, and support requests; no project results were supplied.', change:'The supplied screens emphasize a shared hierarchy and visible context; no before/after record was supplied.', unresolved:'Permission differences and notification overload need validation with the actual team and product rules.', screenRationale:'Shows how navigation, context, and action hierarchy are organized.', accessibility:'CV confirms WCAG advocacy and design QA experience; this case has no project-specific contrast or assistive-technology audit in the supplied materials.', responsive:'The supplied set includes desktop screens. Mobile behavior is not documented here; verify navigation collapse and task continuity before claiming it.', edgeStates:'Empty inbox, no-access project, loading report, failed sync, and deleted conversation.', outcomePlan:'No project-specific outcome data is included in the CV or supplied case files. Report verified time-to-task or support changes only if cleared; otherwise present the measures as a validation plan.', reflection:'I would validate the destination hierarchy with real usage patterns before extending the workspace with automation.', screenCount:'Current screens illustrate the unified workspace and its navigation.' },
  { users:'Travelers comparing flights and people helping them plan or purchase a trip.', situation:'A traveler knows a destination or date but is unsure whether to search or explore options first.', motivation:'compare viable fares and complete a booking with confidence.', outcome:'a suitable itinerary at a clear total price.', constraint:'Fare inventory, changing prices, form errors, accessibility, and responsive booking steps.', unknown:'Where exploratory content helps and where it distracts from a booking task.', hypothesis:'If task-first search remains easy to reach while inspiration is clearly secondary, both ready-to-book and exploring travelers can move forward.', focus:'Make trip search, fare comparison, total cost, and next steps clear across screen sizes.', defer:'Promotional extras and inspiration modules that do not help someone evaluate or book a flight.', insights:['Travel search requires clear criteria before fares can be compared.','Price and itinerary detail should stay connected through the booking decision.'], questions:['What do travelers need before they can compare routes?','How do airline sites balance search, inspiration, and fare detail?','Can a traveler complete search and understand the selected fare without error?'], journey:'Set trip details → review route and fare options → compare total cost and rules → enter traveler details → confirm booking.', ia:'Lead with trip search, keep fare results and fare details adjacent, then separate optional destination inspiration.', decision:'Give flight search a prominent task-first path and support exploration beside it.', alternative:'Start with destination imagery and travel deals before showing search fields.', reasoning:'The supplied design challenge is serving two intents; a clear primary search prevents inspiration from obscuring the booking task.', evidence:'Current portfolio screens and the case notes support this design question. CV confirms user research/interviews across roles, but project-specific research and booking outcomes are not listed.', tasks:['Search a route and dates.','Compare two fares, including total price and restrictions.','Correct a form error and return to the selected itinerary.'], measure:'Search completion, fare-detail comprehension, booking-step completion, and errors; no project results were supplied.', change:'The shown screens prioritize search and trip information; an earlier version was not supplied.', unresolved:'Live pricing, inventory, and fare-rule integration must be verified with the production service.', screenRationale:'Shows the balance between flight search, destination information, and fare evaluation.', accessibility:'CV confirms WCAG advocacy; no project-specific contrast, keyboard, or screen-reader results were supplied.', responsive:'Portfolio screens are responsive web examples; verify the same search criteria and fare context remain available on smaller screens.', edgeStates:'No flights, stale fare, invalid dates, form validation, and interrupted checkout.', outcomePlan:'No cleared conversion or booking results are provided. If this was client work, share only approved funnel changes; otherwise propose search completion and error measures.', reflection:'I would test whether exploration helps trip planning or competes with the booking task for each traveler segment.', screenCount:'Current screens illustrate flight search and fare booking content.' },
  { users:'Shoppers choosing flowers for an occasion, budget, style, or delivery date.', situation:'A shopper has an occasion in mind but may not know flower names or care requirements.', motivation:'find a fitting bouquet and understand delivery and product details.', outcome:'choose confidently and complete the purchase.', constraint:'Catalog breadth, seasonal availability, delivery windows, product descriptions, and mobile browsing.', unknown:'Which shopping intent is most common and what information shoppers need to distinguish similar arrangements.', hypothesis:'If browsing begins with familiar needs such as occasion and style, shoppers can narrow the catalog before comparing details.', focus:'Organize discovery around shopper language and make product, price, and delivery details scannable.', defer:'Complex personalization or loyalty features until category discovery and product comparison work.', insights:['Occasion and style can be more useful starting points than flower terminology.','Delivery timing and product details influence whether a bouquet is a viable choice.'], questions:['How do shoppers describe the bouquet they want?','Which catalog patterns make occasion and product comparison easier?','Can people find a suitable bouquet and understand delivery before adding it?'], journey:'Choose occasion or style → browse category → compare bouquets → inspect details and delivery → add to basket → checkout.', ia:'Use shopper intent as the top-level browse structure; keep product detail and basket access close to the selection.', decision:'Organize discovery around occasion and style rather than requiring shoppers to know flower names.', alternative:'Lead with botanical categories and make occasion a secondary filter.', reasoning:'The case notes describe shoppers who may not know product terminology; familiar intents lower the knowledge needed to start.', evidence:'The existing screens show catalog and product details. CV confirms competitive research as part of freelance work, but no project-specific study or order data is supplied.', tasks:['Find a bouquet for a stated occasion and budget.','Compare two arrangements and check delivery timing.','Return to the basket and confirm the selected product.'], measure:'Product discovery success, add-to-cart, checkout completion, and questions about delivery; no project results were supplied.', change:'The portfolio screens show category discovery and product detail; no prior-state artifact was supplied.', unresolved:'Live seasonal inventory, substitutions, and delivery capacity need confirmation.', screenRationale:'Shows category discovery, product detail, and the path to the basket.', accessibility:'CV confirms accessibility advocacy; no specific contrast, focus, or touch-target audit for this case was supplied.', responsive:'The portfolio screens are mobile app views; confirm how catalog density and product comparison behave on larger layouts.', edgeStates:'Out-of-stock bouquet, unavailable delivery date, basket empty, and failed payment.', outcomePlan:'No cleared sales results are present. Report conversion or support changes only if approved; otherwise use discovery and checkout measures as a future evaluation plan.', reflection:'I would test the category language with shoppers who do not already know flower names.', screenCount:'Current screens illustrate catalog discovery and product detail.' },
  { users:'People seeking care who need help choosing a care category or clinician.', situation:'Someone knows they need care but is uncertain which provider or category fits.', motivation:'understand the options and choose a safe next step.', outcome:'find an appropriate provider or know where to go next.', constraint:'Clinical accuracy, provider availability, accessibility, privacy, and the limits of profile information.', unknown:'How people describe their care need and which provider details support a confident choice.', hypothesis:'If entry language is plain and provider information is comparable, people can refine a search without being asked to interpret clinical terminology.', focus:'Make the care-seeking entry point, search criteria, provider information, and no-match recovery clear.', defer:'Automated clinical recommendations or fit claims unsupported by validated data.', insights:['A guided entry can reduce uncertainty only when categories use language people understand.','A no-match state needs a useful next step, not a dead end.'], questions:['What language do people use for the care they need?','Which provider details matter for comparing options?','Can people select a care category, filter clinicians, and recover from no results?'], journey:'Describe need → choose care category → search/filter clinicians → review provider details → continue to contact or booking.', ia:'Start with care need and category, then expose search and filters; keep provider details comparable.', decision:'Use a guided start with plain-language care categories before asking for detailed filtering.', alternative:'Open on a broad clinician directory with filters as the only entry point.', reasoning:'The project notes describe people who may not know what kind of care to search for; a guided first choice can reduce the initial burden.', evidence:'The supplied screens show categories, search, and clinician listings. The CV confirms healthcare product work, user research, and testing, but provides no case-specific sample or finding.', tasks:['Choose a care category from a plain-language need.','Compare clinicians using the available details.','Recover from a no-result search.'], measure:'Search refinement, provider detail use, successful next-step selection, and no-result recovery; no patient outcome data was supplied.', change:'The available screens emphasize guided categories and provider details; no previous version was supplied.', unresolved:'Provider data freshness, clinical review, and jurisdiction-specific content need validation.', screenRationale:'Shows care-category entry, clinician discovery, and provider details.', accessibility:'CV confirms WCAG advocacy and healthcare work; no case-specific accessibility audit is included in the supplied materials.', responsive:'The provided portfolio screens are mobile app views; confirm readable provider details and controls at larger breakpoints.', edgeStates:'No providers, incomplete profiles, urgent-care needs outside scope, and unavailable booking.', outcomePlan:'No cleared patient or booking outcomes are provided. Use safe next-step completion and no-result recovery as candidate measures, not outcomes.', reflection:'I would validate the care language with patients and clinical reviewers before expanding recommendations.', screenCount:'Current screens illustrate care discovery and provider information.' },
  { users:'Listeners moving between discovery, their library, and active playback.', situation:'A listener wants to find something new without losing control of the current queue.', motivation:'explore music and return to a saved or playing track easily.', outcome:'start or resume music without accidental interruption.', constraint:'Catalog content, playback state, queue behavior, and screen density.', unknown:'Whether listeners struggle more with discovery, saved music, or maintaining playback context.', hypothesis:'If playback remains persistent and discovery actions stay distinct from player controls, listeners can explore without losing the current session.', focus:'Protect active playback while clarifying discovery, library, queue, and player controls.', defer:'Social or recommendation features before playback continuity and core discovery are clear.', insights:['People need playback status to remain visible while they explore.','Discovery should not accidentally replace a track or queue.'], questions:['How do listeners move between browsing and active playback?','How do music products keep queue and playback controls available?','Can listeners find a track, add it to a queue, and return to the current player?'], journey:'Browse or search → inspect track/playlist → choose play or queue → continue listening → return to discovery.', ia:'Keep player controls persistent and organize discovery separately from library and queue actions.', decision:'Separate discovery actions from persistent playback controls.', alternative:'Make each discovery page a full-screen destination that replaces the player.', reasoning:'The supplied challenge centers on losing control of what is playing; persistent system status supports safe exploration.', evidence:'The portfolio screen shows a persistent player and discovery elements. The CV does not tie listening research or performance metrics to this project.', tasks:['Find a playlist while a track is playing.','Add a selection without replacing the queue.','Return to the player and change playback.'], measure:'Successful playback starts, queue changes, interruptions, and discovery-to-play; no project results were supplied.', change:'The provided screen connects discovery with a persistent player; no before state or iteration notes were supplied.', unresolved:'Catalog rights, playback service behavior, and accessibility of player controls require verification.', screenRationale:'Shows the relationship between music discovery and persistent playback.', accessibility:'CV confirms WCAG advocacy; no project-specific keyboard, contrast, or screen-reader audit was supplied.', responsive:'The provided image is a desktop product screen; preserve playback status and key actions at narrow widths.', edgeStates:'No search results, unavailable track, playback failure, and empty queue.', outcomePlan:'No listening analytics are included in the supplied materials. Treat discovery-to-play and interruptions as proposed measures.', reflection:'I would validate the persistent player behavior during real listening tasks, not only through static screen review.', screenCount:'Current screen illustrates the music discovery dashboard and player.' },
  { users:'Project managers and contributors scanning project health, workload, and tasks.', situation:'A team lead needs to see what is blocked or overdue and decide where to intervene.', motivation:'spot the exception and move directly to the relevant work.', outcome:'resolve a blocker before it becomes a larger delay.', constraint:'Dense operational data, role-specific permissions, status quality, and the risk of visual noise.', unknown:'Which indicators change a decision and which are merely reportable.', hypothesis:'If exceptions are prioritized while supporting detail remains available, managers can identify the next action without scanning every metric equally.', focus:'Use hierarchy to connect project status with the task or blocker that needs action.', defer:'Adding more dashboard metrics before their decisions and data quality are understood.', insights:['An overview is useful when it directs attention to an action, not when it displays every available number.','Status labels need consistent meaning across roles and projects.'], questions:['Which project signals prompt an intervention?','How do managers distinguish an exception from normal variation?','Can a user find a blocked project and move to the task that needs attention?'], journey:'Scan portfolio status → identify exception → inspect project/task details → assign or resolve action → confirm status change.', ia:'Lead with portfolio health and exceptions; provide drill-down to project and task detail.', decision:'Prioritize exceptions and actionable project signals over equal-weight metric display.', alternative:'Show every metric and task in a dense table with no exception hierarchy.', reasoning:'The portfolio challenge is information overload; hierarchy and drill-down help the overview support decisions.', evidence:'The supplied dashboard shows status, workload, and task rows. CV confirms SaaS product design and cross-functional delivery; project-level analytics are not provided.', tasks:['Identify the most urgent blocked project.','Open its relevant task and determine the next action.','Filter or compare status across projects.'], measure:'Time to identify a blocker, task success, resolution time, and recurring use; no actual results were supplied.', change:'The available screen uses restrained color and separates status from detail; no earlier state was supplied.', unresolved:'Data freshness, role-based access, and status definitions should be validated with product and engineering.', screenRationale:'Shows how operational status is prioritized and connected to task detail.', accessibility:'CV confirms WCAG advocacy and design QA; this project has no supplied audit for color-only status or keyboard access.', responsive:'The supplied screen is desktop SaaS; verify whether the same exceptions remain scannable on tablet and smaller screens.', edgeStates:'No projects, delayed data, missing status, permission-restricted task, and failed refresh.', outcomePlan:'No operational results are provided. Report blocker discovery or resolution changes only if a source is cleared.', reflection:'I would align status definitions with the people who maintain the data before polishing the dashboard hierarchy.', screenCount:'Current screen illustrates the project overview and operational task detail.' },
  { users:'Travelers comparing cottages or stays outside a city.', situation:'A traveler has dates and a general area but needs to compare amenities, total price, and policies.', motivation:'choose a stay that fits the trip and understand the commitment.', outcome:'reserve without surprises about price or property rules.', constraint:'Listing accuracy, availability, fees, cancellations, map/list synchronization, and mobile comparison.', unknown:'Which details most influence a guest’s confidence before reserving.', hypothesis:'If location, total price, amenities, and policies are easy to compare, travelers can move from search to reservation with fewer unanswered questions.', focus:'Keep search criteria and decision-critical property information visible through comparison.', defer:'Personalized upsells or booking extras that do not answer core trust questions.', insights:['A property is only comparable when price and key amenities are visible together.','Changing dates or guest count should not silently invalidate the current result set.'], questions:['What information do guests need before opening a property?','How do booking sites communicate price, fees, and cancellation terms?','Can travelers compare properties and understand total cost before reserving?'], journey:'Set destination, dates, guests → browse stays → refine/map → compare details and price → choose property → reserve.', ia:'Keep search criteria visible, present comparable listing cards, and surface total-price and policy details in the property view.', decision:'Prioritize comparable property information and total cost over promotional content.', alternative:'Show attractive property imagery first and move fees and cancellation policies later in the flow.', reasoning:'The booking decision depends on fit and trust; delayed cost or policy detail can undermine confidence.', evidence:'The supplied screens show listing and property-detail content. The CV does not identify project-specific guest research or booking outcomes.', tasks:['Filter stays by dates and guests.','Compare two properties by amenities and total price.','Find the cancellation terms before starting a reservation.'], measure:'Qualified property views, booking starts, completion, and questions about property details; no results were supplied.', change:'The available screens show listings and property details; no earlier screens were provided.', unresolved:'Inventory accuracy, price breakdowns, and cancellation policy ownership need validation.', screenRationale:'Shows accommodation discovery and the details needed to decide.', accessibility:'CV confirms accessibility advocacy; no project-specific audit was supplied.', responsive:'The screen set includes mobile and web layouts; keep criteria and comparison context aligned between them.', edgeStates:'No availability, changed price, empty search, listing removed, and reservation failure.', outcomePlan:'No cleared booking data is included. Use booking completion and policy-related support as candidate measures.', reflection:'I would test price and policy comprehension before adding more listing filters.', screenCount:'Current screens illustrate stay search and property-detail comparison.' },
  { users:'Residents using voice or touch to check and control connected home devices.', situation:'A resident gives a command or receives an alert and needs to know what changed.', motivation:'control a device and understand whether the action succeeded.', outcome:'a predictable home state with a safe way to recover.', constraint:'Device compatibility, connection reliability, household privacy, permissions, and voice recognition errors.', unknown:'Which commands are safe to automate and what confirmation people expect.', hypothesis:'If device state and command outcomes are visible, residents can trust voice while retaining touch control and recovery.', focus:'Show current device state, confirm changes, and provide a clear manual alternative.', defer:'Broad autonomous routines before permissions, failure handling, and device coverage are proven.', insights:['A voice command needs visible confirmation and an understandable failure state.','A touch path is important when voice is unavailable or ambiguous.'], questions:['Which home tasks do residents want to control by voice?','How do people expect automation to report success or failure?','Can a resident verify a device state and recover from a failed command?'], journey:'Choose room/device → issue voice or touch command → view status and confirmation → correct or undo if needed.', ia:'Organize by rooms and devices; keep controls, energy information, and recent alerts distinct.', decision:'Pair voice commands with visible device state and a direct touch fallback.', alternative:'Make the voice assistant the only control surface or silently run automation.', reasoning:'Home actions need to be understandable and reversible, particularly when a command is misheard or changes a device.', evidence:'The project notes describe voice, energy, and device controls. Home Voice is explicitly a concept; no participant findings or command data are supplied.', tasks:['Change a device setting by voice.','Verify the state after a command.','Recover from an unclear or failed command.'], measure:'Command success, correction, false alerts, setup completion, and repeat use; these are candidate measures only.', change:'The concept screens combine room controls and voice interaction; no iteration history was supplied.', unresolved:'Compatibility, household consent, privacy, and false-alert handling need validation before implementation.', screenRationale:'Shows device controls, home status, and voice-assistant context.', accessibility:'CV confirms WCAG advocacy; validate non-voice control, visible focus, readable state, and accessible alert announcements.', responsive:'The supplied screens are mobile app views; ensure critical controls remain reachable on smaller devices.', edgeStates:'Device offline, command misunderstood, alert dismissed, and room with no connected devices.', outcomePlan:'This is described as a concept. There are no launch outcomes; validate command comprehension and recovery before tracking household use.', reflection:'I would prototype failure and undo states before adding a larger automation catalog.', screenCount:'Current concept screen illustrates smart-home controls and assistant interaction.' },
  { users:'Patients booking an appointment and clinic staff managing real availability.', situation:'A patient has chosen a provider and needs a suitable appointment time.', motivation:'book the right slot without repeating information or guessing whether it is confirmed.', outcome:'a confirmed appointment that matches actual availability.', constraint:'Provider schedules, slot freshness, required patient details, clinical operations, and privacy.', unknown:'Where booking friction comes from: unclear steps, unavailable supply, or data entry.', hypothesis:'If provider, time, and confirmation steps are explicit and resilient to unavailable slots, patients and staff will face fewer avoidable booking errors.', focus:'Clarify the provider/time sequence, preserve entered details, and make confirmation unambiguous.', defer:'Automated triage or scheduling rules that require clinical or operational validation.', insights:['An interface cannot solve a slot-supply problem, so availability must remain clear.','Confirmation should identify the chosen provider and time, not just show a generic success state.'], questions:['What information must be collected before a slot can be held?','How do clinics recover when a selected time is no longer available?','Can a patient book, review, and understand the confirmed appointment?'], journey:'Choose provider → choose available time → enter required details → review → confirm → receive next-step information.', ia:'Keep provider choice, time selection, patient details, and confirmation in a clear sequence with a review point.', decision:'Make the selected provider and appointment time persistent through a review-before-confirm step.', alternative:'Collect all details on one long form or confirm immediately after slot selection.', reasoning:'Scheduling is constrained by real availability; a review step helps catch mistakes before the patient leaves the flow.', evidence:'The screens show provider selection, calendar availability, details, and confirmation. CV confirms healthcare research/testing experience, but no study result is tied to this project.', tasks:['Select a provider and available appointment.','Change a detail and return without losing the selected slot.','Confirm and verify the appointment details.'], measure:'Booking completion, time to book, slot errors, reschedules, and support questions; no project results were supplied.', change:'The current screens show a staged booking path; no original or tested before/after comparison was supplied.', unresolved:'Live scheduling integration and clinic-specific cancellation or reschedule rules require validation.', screenRationale:'Shows provider selection, available times, and booking confirmation.', accessibility:'CV confirms WCAG advocacy and clinical stakeholder work; no project-specific audit or compliance approval is supplied.', responsive:'The supplied set is a mobile flow; verify date selection, form errors, and confirmation at larger widths too.', edgeStates:'No slots, slot taken during entry, validation error, duplicate booking, and cancellation.', outcomePlan:'No appointment or patient outcome results are included. Treat booking completion and rescheduling as candidate measures.', reflection:'I would validate slot freshness and rescheduling rules with clinic operations before treating the flow as complete.', screenCount:'Current screens illustrate appointment selection and confirmation.' },
  { users:'Viewers choosing something to watch and people returning to an unfinished series.', situation:'A viewer opens the service without a specific title or wants to resume one already started.', motivation:'find something relevant or continue quickly.', outcome:'start or resume playback with minimal browsing.', constraint:'Catalog availability, personalization quality, content rights, and balancing featured titles with personal history.', unknown:'Whether the bigger friction is discovery, search, recommendations, or remembering progress.', hypothesis:'If continuation is easy to spot and discovery remains organized, viewers can either resume or choose something new.', focus:'Give continue-watching a clear place and organize discovery around recognizable content cues.', defer:'More recommendation complexity before the basic browse and resume paths work.', insights:['Returning viewers need progress and resume actions to be recognizable.','Discovery rows should not bury familiar or recently watched content.'], questions:['How do viewers decide what to watch when they have no title in mind?','Which content details help people choose?','Can viewers resume an episode and find a new title without confusion?'], journey:'Open home → scan continue-watching or discovery → inspect title → play or resume → return to home.', ia:'Separate continuation from discovery while keeping both near the start of the experience.', decision:'Surface resume progress as a primary path alongside new-content discovery.', alternative:'Use the entire first screen for promotional or featured content.', reasoning:'The project brief identifies both choosing and returning; clear continuation supports recognition and reduces repeated search.', evidence:'The current screen includes featured content, continuation, and discovery rows. The project description calls this a redesign; no project-specific viewer research or playback data is supplied.', tasks:['Resume a partially watched episode.','Find a new title using a familiar category.','Understand where the selected title will play.'], measure:'Browse-to-play, resume success, time to resume, search reformulation, and return viewing; no results were supplied.', change:'The available screen presents discovery and continuation together; an earlier design was not supplied.', unresolved:'Catalog metadata, recommendation relevance, and progress syncing across devices need validation.', screenRationale:'Shows featured content, continue-watching, and discovery hierarchy.', accessibility:'CV confirms WCAG advocacy; no case-specific keyboard, contrast, or caption audit was supplied.', responsive:'The provided screen is desktop web; preserve resume visibility and readable content cards on mobile.', edgeStates:'No watch history, unavailable title, expired catalog item, playback error, and missing progress.', outcomePlan:'No viewer or playback outcomes are included. Treat browse-to-play and resume success as proposed measures.', reflection:'I would test resume and discovery separately to see which path needs the stronger first-screen priority.', screenCount:'Current screen illustrates the home discovery and continuation experience.' },
  { users:'Travelers comparing cabins or stays by location, dates, group size, and amenities.', situation:'A traveler is flexible about the exact property but has several trip constraints.', motivation:'narrow a broad area to stays that fit the trip.', outcome:'compare useful options and begin a booking.', constraint:'Listing accuracy, map performance, inventory, changing filters, and empty-result recovery.', unknown:'Which trip constraint should lead the search and how travelers move between map and list.', hypothesis:'If filter state remains visible and map/list results stay synchronized, people can explore without losing the criteria that define a suitable stay.', focus:'Connect location exploration to clear filters, qualified listings, and property details.', defer:'Rich recommendations or booking extras before filter state and result quality are dependable.', insights:['Map exploration is useful only when the listing set reflects the current criteria.','A clear empty state can help people broaden a narrow search.'], questions:['Which constraints are non-negotiable when choosing a stay?','How do travelers compare map and list views?','Can people edit dates or guests and recover from no results?'], journey:'Set place/dates/guests → explore map or list → refine amenities → inspect property → start booking.', ia:'Keep trip criteria visible, synchronize map and list, and expose filters that refine meaningful attributes.', decision:'Keep search constraints visible as people move between the map and listings.', alternative:'Treat map and list as separate modes with independent filter states.', reasoning:'Travel constraints change as people explore; preserving them helps users understand what the current results represent.', evidence:'The screens show map-led exploration, filters, dates, and guest count. The description calls Getaway a concept; no field research or booking outcomes are supplied.', tasks:['Search an area for given dates and guests.','Apply an amenity filter and confirm the map/list update.','Recover from an empty result set by changing one constraint.'], measure:'Qualified results, filter success, empty-result recovery, and booking starts; no project results were supplied.', change:'The available screens show map/list exploration and filters; no prior version was supplied.', unresolved:'Map data, listing freshness, and inventory consistency need validation.', screenRationale:'Shows map exploration, trip constraints, and accommodation results.', accessibility:'CV confirms WCAG advocacy; verify map alternatives, keyboard filtering, focus, and contrast before claiming compliance.', responsive:'The supplied screens are mobile booking views; keep map/list switching and applied filters understandable on small screens.', edgeStates:'No listings, map unavailable, stale inventory, cleared filters, and date change.', outcomePlan:'This is described as a concept; no booking results are reported. Validate result relevance and empty-search recovery.', reflection:'I would test map/list transitions with people who have different levels of destination flexibility.', screenCount:'Current concept screens illustrate cabin discovery and trip filters.' },
  { users:'Residents monitoring household energy and controlling connected devices.', situation:'A resident notices an energy reading or wants to adjust a room setting.', motivation:'understand what is happening and take an appropriate action.', outcome:'make a useful change without decoding technical data.', constraint:'Data accuracy, device coverage, privacy, time ranges, and the difference between insight and estimate.', unknown:'Which readings people understand and which ones actually guide household actions.', hypothesis:'If energy information is grouped by room and paired with a clear action, people can interpret the overview and control a device with less guesswork.', focus:'Use plain-language status, room grouping, and feedback after a control action.', defer:'Predictive recommendations until the underlying data and device state are reliable.', insights:['Energy data needs a clear unit, time period, and household context.','A control action should result in visible feedback that matches the device state.'], questions:['How do residents interpret current energy readings?','Which device controls are used in everyday routines?','Can a resident understand a room-level summary and change a setting?'], journey:'Open home overview → scan room/device status → inspect energy detail → adjust control → verify updated state.', ia:'Group by room and distinguish measured energy from device controls and recommendations.', decision:'Use room-level grouping and plain-language status before adding more analytics.', alternative:'Lead with dense charts and technical readings, leaving controls in a separate area.', reasoning:'The project challenge is comprehension; actionable summaries can help residents connect data to a task.', evidence:'The portfolio screen shows room-level energy and device controls. The CV does not include project-specific energy research or verified savings.', tasks:['Find the highest-use room for a stated period.','Change a device temperature and confirm status.','Explain what a displayed energy number represents.'], measure:'Insight comprehension, control-task success, repeat use, and verified energy change only with a valid baseline; no results supplied.', change:'The supplied overview groups energy and controls; no prior screen or iteration result was provided.', unresolved:'Meter accuracy, device compatibility, and causal attribution of energy changes must be resolved.', screenRationale:'Shows room-level energy status and related device controls.', accessibility:'CV confirms WCAG advocacy; no project-specific audit of chart labels, contrast, or non-color state was supplied.', responsive:'The available screen is a mobile view; preserve chart context and essential actions on larger dashboards.', edgeStates:'Missing meter data, device offline, unusual spike, stale reading, and no connected rooms.', outcomePlan:'No verified energy changes or user outcomes are supplied. Any energy-impact claim needs a baseline and attribution method.', reflection:'I would validate whether people understand the measurement period before interpreting the screen’s visual hierarchy.', screenCount:'Current screen illustrates energy overview and device control.' },
  { users:'People checking conversations from several connected social platforms.', situation:'A user switches between accounts to find a conversation and reply.', motivation:'manage messages in one place while knowing which service and identity are active.', outcome:'find and respond to the right thread without cross-posting.', constraint:'Third-party API reliability, account permissions, sync delays, platform identity, and notification volume.', unknown:'Which platform combinations people need and what context they rely on before replying.', hypothesis:'If a unified inbox preserves source identity, unread state, and reply destination, people can reduce app switching without losing trust.', focus:'Unify thread navigation while keeping platform and sender context visible.', defer:'Adding integrations before sync reliability, privacy, and account controls are clear.', insights:['A unified inbox must preserve which service a message belongs to.','A reply should make its destination obvious before sending.'], questions:['Which services do people need to check together?','What source context do users need when scanning a unified feed?','Can a person find, identify, and reply to the correct conversation?'], journey:'Connect services → review unified inbox → open thread → check source/contact → reply or find shared file.', ia:'Use a shared conversation list with clear platform cues, unread state, and a thread-level reply destination.', decision:'Combine conversation lists but retain platform identity at the thread and composer.', alternative:'Show one generic inbox without source cues or maintain entirely separate inboxes.', reasoning:'The product promise is fewer app switches, but platform ambiguity can cause a serious reply error.', evidence:'The supplied screen is a multi-column messaging workspace. CV confirms cross-functional SaaS work; project-specific integration research or reliability data is not provided.', tasks:['Find a conversation from a named platform.','Confirm the service and account before replying.','Locate a shared file or recover when an account disconnects.'], measure:'Account connection success, sync accuracy, time to reply, search success, and notification opt-outs; no project results supplied.', change:'The current screen displays source context alongside conversations; no prior state was included.', unresolved:'API limits, data retention, authorization, and platform changes require explicit review.', screenRationale:'Shows a unified inbox while preserving conversation and account context.', accessibility:'CV confirms WCAG advocacy; test keyboard navigation across columns and accessible announcements for incoming messages.', responsive:'The supplied screen is desktop app; define a mobile thread-first layout and preserve the source cue.', edgeStates:'Disconnected account, delayed sync, duplicate message, expired permission, and empty inbox.', outcomePlan:'No sync or engagement metrics are supplied. Treat reliability and task-completion measures as a validation plan.', reflection:'I would validate account boundaries and reply destination before expanding the number of supported services.', screenCount:'Current screen illustrates a multi-column conversation workspace.' },
  { users:'Transit riders checking routes, arrivals, and what to do next while traveling.', situation:'A rider needs to get somewhere and may have limited time or attention.', motivation:'choose a route and understand where to go next.', outcome:'complete the trip with confidence and recover when conditions change.', constraint:'Transit-feed freshness, service disruptions, map accuracy, network access, and on-the-move legibility.', unknown:'How riders balance route duration, transfers, reliability, and real-time arrival updates.', hypothesis:'If route options and arrival freshness are clear, riders can choose a route and respond to a disruption.', focus:'Present arrival and next action clearly, with route alternatives and status available.', defer:'Broad local discovery features before route reliability and coverage are dependable.', insights:['Route guidance needs a visible next step, not only a line on a map.','Arrival estimates need an update status and a way to recover when service changes.'], questions:['How do riders compare route time, transfers, and arrival reliability?','What detail do they need while walking to a stop?','Can a rider follow a route and recover when an arrival changes?'], journey:'Enter destination → compare routes → select route → follow stop/transfer cues → confirm arrival or reroute.', ia:'Pair map information with a readable route list, status freshness, and clear next action.', decision:'Keep route summary and next action readable alongside the map.', alternative:'Use a map-only experience or a route list without spatial context.', reasoning:'The same trip requires both spatial orientation and quick comparison; pairing views supports different moments.', evidence:'The supplied screen is map-centered with search and route information. CV confirms product design/research experience, but no project-specific accuracy results are included.', tasks:['Find a route to a destination.','Compare options by duration and transfers.','Recover after a missed bus or stale arrival time.'], measure:'Arrival accuracy, route selection, successful completion, reroutes, and confidence; no project results supplied.', change:'The current screen combines map, search, and route information; no iteration record was supplied.', unresolved:'Transit-feed coverage, prediction confidence, and offline behavior need validation.', screenRationale:'Shows map-led destination search and transit route information.', accessibility:'CV confirms WCAG advocacy; verify contrast, map alternatives, voice-over labels, and touch targets.', responsive:'The supplied screen is mobile; ensure route details remain readable with large text and while on the move.', edgeStates:'No route, service disruption, stale feed, location denied, and lost connection.', outcomePlan:'No transit accuracy or trip completion results are supplied. Do not claim reliability improvements without a source.', reflection:'I would test the route flow in realistic travel conditions and measure data accuracy separately from interface comprehension.', screenCount:'Current screen illustrates transit search and route guidance.' },
  { users:'Travelers delegating flight research while keeping approval over fare and booking decisions.', situation:'A traveler wants help finding a lower fare but has firm rules for price, bags, dates, or layovers.', motivation:'delegate comparison without surrendering control of the purchase.', outcome:'choose a verified itinerary and approve the final fare knowingly.', constraint:'Live fare changes, baggage rules, inventory freshness, agent permissions, and payment/booking boundaries.', unknown:'Which search tasks travelers are willing to delegate and what changes require renewed approval.', hypothesis:'If the agent exposes constraints, evidence, and approval boundaries, travelers can delegate search while retaining control over booking.', focus:'Make the agent’s progress, fare evidence, trade-offs, and next action visible; require approval for changed terms.', defer:'Autonomous purchase or background booking before accuracy, permissions, and recovery are validated.', insights:['A low headline price is not useful unless the itinerary meets the traveler’s saved constraints.','A changed fare or route needs a clear pause and fresh approval.'], questions:['Which travel decisions do people want the agent to handle?','What evidence is needed to trust a fare recommendation?','Can travelers understand what the agent may do and stop or approve it?'], journey:'Set constraints → agent searches → compare verified options → review fare rules → approve or revise → track booking.', ia:'Keep saved constraints, search status, result evidence, and approval action adjacent.', decision:'Separate search delegation from purchase authorization and pause when fare conditions change.', alternative:'Allow the agent to book automatically or show a recommendation without its evidence.', reasoning:'The prototype centers on a high-stakes purchase; transparency and explicit approval protect user control.', evidence:'AirScout is a user-described AI flight-agent prototype. Current screens are concept UI, not live airline results; no real savings or testing outcomes were supplied.', tasks:['Set a budget and layover constraint.','Review a recommendation and verify its total fare.','Respond to a changed fare or revoke the agent’s permission.'], measure:'Verified comparable fare savings, recommendation acceptance, booking completion, fare-change exceptions, and confidence; these are proposed measures, not results.', change:'The prototype screens distinguish recommendations, constraints, and approval; no test-driven before/after record was supplied.', unresolved:'Live inventory, booking APIs, payment handling, and background agent execution are not verified or connected.', screenRationale:'Shows constraint setup, recommendations, approval, and recovery states in the flight agent.', accessibility:'Use explicit status text, keyboard-operable approvals, readable fare detail, and non-color-only state; no formal project audit was supplied.', responsive:'The prototype has desktop and mobile formats; verify the same fare evidence and approval boundary on both.', edgeStates:'No matching fares, stale inventory, changed total, missing baggage data, interrupted booking, and revoked permission.', outcomePlan:'This is a prototype, not a live booking product. Evaluate with travelers using scenario tasks before claiming savings or agent trust.', reflection:'I would test whether people distinguish search permission from permission to purchase before adding more automation.', screenCount:'Current concept pages illustrate search, constraints, recommendations, approval, and booking status.' },
  { users:'People traveling for work who coordinate flights, meetings, hotel details, preparation, and expenses.', situation:'A traveler moves between planning before departure, a busy workday, and the journey home.', motivation:'keep trip details and next actions in one contextual place.', outcome:'stay prepared and adapt when plans change without searching across tools.', constraint:'Mobile attention, changing itineraries, calendar/booking data access, offline use, privacy, and AI uncertainty.', unknown:'Which trip moments create the most context switching and what assistance feels useful rather than intrusive.', hypothesis:'If trip information is organized by travel phase and assistance shows its source and limits, travelers can act quickly while retaining control.', focus:'Make the current travel phase, key trip details, preparation tasks, and help easy to reach on mobile.', defer:'Broad autonomous changes to travel bookings until data access and approval boundaries are clear.', insights:['The useful information changes before departure, on site, and during return.','AI suggestions need clear provenance and a review step when they affect real plans.'], questions:['What do business travelers need at each trip phase?','Which tasks are repeated across calendar, booking, notes, and expense tools?','Can a traveler find the next task and understand what the assistant knows?'], journey:'Prepare trip → travel outbound → manage on-site schedule → handle expenses/changes → return and close out.', ia:'Organize by trip phase and keep itinerary, checklist, schedule, and companion actions connected.', decision:'Use a phase-based mobile companion instead of placing every trip feature in one undifferentiated feed.', alternative:'Use a single chronological feed or a set of disconnected feature tabs.', reasoning:'The concept addresses changing travel contexts; phase-based navigation can surface relevant tasks without hiding the full itinerary.', evidence:'WorkPal is a user-described mobile-first business travel prototype. No user study, calendar connection, or productivity outcome is supplied.', tasks:['Prepare for departure and identify an incomplete task.','Find the next meeting and travel instruction on site.','Review a suggested route or trip change before accepting it.'], measure:'Task completion by phase, time to find a trip detail, accepted/rejected suggestions, and recovery after changes; proposed only.', change:'The prototype shows overview, schedule, essentials, and activity pages; no test-based change log was supplied.', unresolved:'Calendar and booking integrations, offline details, and handling of sensitive itineraries require validation.', screenRationale:'Shows phase-based itinerary, schedule, essentials, and trip updates.', accessibility:'CV confirms WCAG advocacy; validate touch targets, focus order, readable text, and announcements for changing itinerary states.', responsive:'WorkPal is designed as a mobile companion; ensure wider layouts retain the same phase hierarchy without stretching phone patterns.', edgeStates:'Offline itinerary, delayed flight, missing receipt, schedule conflict, and assistant uncertainty.', outcomePlan:'This is a prototype; there are no launch outcomes. Test finding trip details and responding to changes before choosing adoption metrics.', reflection:'I would validate which phases need separate navigation and which information should stay global across the trip.', screenCount:'Current concept pages illustrate trip overview, schedule, essentials, and activity.' },
  { users:'Product managers, designers, engineers, and leaders coordinating a feature from idea through delivery.', situation:'A PM is shaping a new functionality while priorities, dependencies, requirements, and delivery status evolve across different tools.', motivation:'keep the reason for the work connected to its roadmap position, project progress, PRD, and development tickets.', outcome:'give the team a shared, current view of what is being built, why it matters, what is decided, and what still needs an answer.', constraint:'Priorities change; source information can be incomplete or stale; ownership and dependencies cross teams; a generated PRD or ticket can sound complete while missing important product context.', unknown:'Where teams lose the thread between roadmap intent, requirements, and day-to-day delivery, and which missing details cause the most avoidable clarification.', hypothesis:'If initiative status, roadmap placement, requirements, decisions, and tickets stay connected, the team can see progress and gaps earlier and spend less time reconstructing context.', focus:'Make the initiative roadmap position and progress easy to scan; carry the product problem and decisions into a structured PRD and reviewable ticket drafts; make unanswered questions and dependencies visible.', defer:'Autonomous prioritization, scope changes, or ticket creation without PM and engineering review. Start with drafting and visibility, then expand only where the information is dependable.', insights:['A roadmap view is more useful when it links strategic intent to the active project and its delivery work.','A fast ticket draft still needs a clear user problem, expected behavior, constraints, dependencies, and acceptance criteria.','AI assistance should expose gaps and sources so a PM can judge what is ready, instead of filling unknowns with confident guesses.'], questions:['Can a PM locate an initiative on the roadmap and understand its current delivery status?','Can the workspace help turn a product brief into a PRD that makes users, goals, scope, constraints, and open questions explicit?','Do ticket drafts preserve the requirement and acceptance criteria, and make dependencies or missing decisions easy to spot?'], journey:'Frame the product problem → place and prioritize the initiative → clarify scope and dependencies → write and review the PRD → break requirements into tickets → track development and blockers → update roadmap status and communicate changes.', ia:'Connect roadmap initiative, project status, brief/PRD, decisions, dependencies, and tickets; keep source context visible when AI drafts or flags missing information.', decision:'Treat Margin as a connected product-delivery workspace, with AI helping at the points where PMs translate intent into requirements and tickets.', alternative:'Add a standalone AI ticket generator or another status dashboard without connecting the roadmap, PRD, and delivery context.', reasoning:'The core problem spans the full lifecycle. A draft generator can speed up one step, but linked context helps a team understand why the work exists and whether delivery still matches the plan.', evidence:'Margin is intended to help manage projects, see progress and roadmap position, accelerate ticket creation, and surface gaps while writing a PRD.', tasks:['Find a feature and explain its roadmap position, owner, current status, and next milestone.','Review a PRD draft and identify missing users, outcomes, constraints, edge cases, dependencies, or success criteria.','Generate a ticket draft from an approved requirement and trace it back to the PRD.','Update a blocker or priority change and see what work and stakeholders need attention.'], measure:'Evaluate time from brief to reviewable PRD and tickets, completeness of requirements and acceptance criteria, clarification/rework during handoff, roadmap-to-ticket traceability, status freshness, and PM edits to AI drafts.', change:'The product should help the team move from a scattered view of project work to a connected view of intent, progress, requirements, and delivery. Validate with PMs and engineers before claiming reduced cycle time or rework.', unresolved:'The team needs to agree which system owns roadmap and ticket status, how priority changes affect committed work, who approves AI-generated content, and how source links and permissions are maintained.', screenRationale:'Shows project and roadmap tracking alongside product requirements and AI-assisted ticket creation.', accessibility:'Use clear status text, keyboard access for roadmap and ticket actions, visible focus, readable dense tables, and a review flow that does not rely on color alone.', responsive:'The prototype is a desktop workspace; preserve roadmap-to-project context and key status information at narrower widths without hiding critical delivery signals.', edgeStates:'Unprioritized idea, stale status, blocked dependency, missing PRD context, conflicting source documents, failed draft generation, ticket permission error, and changed scope.', outcomePlan:'No launch outcomes are claimed for this prototype. Validate whether PMs can find project state, spot missing requirements, produce reviewable tickets, and communicate changes with less context switching.', reflection:'I would test the full handoff with PMs and engineers using a feature brief, then refine where roadmap changes, unresolved questions, and ticket ownership need to stay visible.', screenCount:'Margin brings together a project overview, roadmap and progress views, requirements, and AI-assisted ticket workflows.' }
];
const caseTakeaways = [
  'People needed one workspace without losing message and project context.',
  'Travelers needed search and inspiration without letting either path obscure the other.',
  'Shoppers needed to choose without already knowing flower terminology.',
  'The first care-search choice had to be understandable and clinically responsible.',
  'Listeners needed to explore without losing control of playback.',
  'Project status had to surface decisions, not just more metrics.',
  'Booking confidence depended on comparable property details and total cost.',
  'Home commands had to be visible, reversible, and safe.',
  'Appointment booking had to reflect real availability at every step.',
  'Viewers needed both a quick resume path and useful discovery.',
  'Trip constraints had to stay visible while exploring the map.',
  'Energy data had to point to an understandable household action.',
  'A unified inbox had to preserve the source of every message.',
  'Route guidance had to remain useful when live data changed.',
  'A flight agent had to show its evidence before asking for approval.',
  'Business travel support had to adapt to the phase of the trip.',
  'PMs need to verify context across sources, then carry product intent from roadmap to PRD and delivery tickets.'
];

const caseSummaries = [
  'Teams were moving between conversations, project updates, and reports just to understand what needed attention. I designed a shared workspace that brings those signals together and keeps the context for each decision close at hand.',
  'Flight search often asks travelers to choose between getting straight to the booking task and exploring where to go. I designed an airline experience that puts route and fare comparison first, with destination inspiration available without getting in the way.',
  'Choosing flowers is difficult when a shopper knows the occasion but not the names of the blooms. I designed a mobile storefront organized around familiar needs, with product and delivery details available before a customer commits.',
  'Finding the right care can be confusing before someone even knows which kind of clinician to search for. I designed a care finder that starts with understandable categories, then helps people compare providers and choose a next step.',
  'Exploring new music should not make listeners lose track of what is already playing. I designed a desktop listening experience that connects discovery and library browsing to a persistent player and queue.',
  'A project dashboard can show plenty of data and still leave a manager unsure where to act. I designed an overview that brings project health, workload, and task detail into a clearer path from spotting an issue to addressing it.',
  'Travelers need to compare stays with a clear view of what each property offers and what it will cost. I designed a booking experience that connects search, property details, and reservation decisions so the important trade-offs are easier to see.',
  'Smart home controls become hard to trust when people cannot tell a device’s current state or whether a command worked. I designed a concept that brings room controls and energy information together with clear feedback after each action.',
  'Booking a care appointment can stall when availability changes or the next step is unclear. I designed a scheduling flow that connects provider choice, real appointment times, patient details, and a clear confirmation.',
  'When a streaming catalog is large, viewers can spend more time browsing than watching. I designed a discovery experience that balances featured recommendations with a quick way back to shows already in progress.',
  'Planning a stay across a map, dates, group size, and amenities can make it hard to tell which options actually fit. I designed a mobile search experience that keeps those trip constraints visible as travelers explore and refine results.',
  'Energy readings are only useful when residents can understand what is happening and what they can change. I designed a home control experience that connects room-level usage and temperature information to direct device actions.',
  'A busy inbox can strip messages of the context that explains why they matter. I designed a desktop conversation workspace that keeps each message connected to its source, people, and shared files.',
  'A route recommendation loses value when service conditions change and the next step is unclear. I designed a transit experience that keeps route choices and live updates connected, with a clearer way to respond when a trip is disrupted.',
  'Comparing flights across multiple sites makes it difficult to understand whether a fare is genuinely a good option. I designed AirScout, an AI travel agent that compares itineraries, explains its recommendation, and asks for approval before booking.',
  'Business trips involve details spread across bookings, calendars, and last-minute updates. I designed WorkPal, a mobile travel companion that brings the itinerary, schedule, and trip essentials together around travelers at each stage.',
  'A product initiative can lose context as it moves from roadmap to PRD to development tickets. I designed Margin to bring project progress and information from multiple sources together, let PMs review that information before relying on it, surface gaps in requirements, and accelerate ticket drafting while leaving decisions with the team.'
];

caseNarratives.push({
  users: 'Product managers coordinating a feature with design and engineering, alongside leaders who need a dependable view of roadmap progress.',
  situation: 'A feature moves from a product decision into a PRD, then into tickets and development, with context and status spread across different tools and conversations.',
  motivation: 'see where the work stands, give the team enough context to build it, and keep decisions connected as priorities or requirements change.',
  outcome: 'a clear line from roadmap intent to requirements, tickets, and delivery progress.',
  constraint: 'The roadmap, PRD, ticket tracker, and team knowledge may have different owners and update at different times. AI drafts are only as useful as the source context they can see.',
  unknown: 'Where PMs spend the most time translating or reconciling information, and which missing details most often slow a feature handoff.',
  hypothesis: 'If roadmap position, project status, requirements, and tickets stay connected, PMs can spot progress and gaps sooner and give engineering a clearer starting point.',
  focus: 'Make the product lifecycle visible in one workspace and use AI to help structure requirements and ticket drafts while keeping scope and decisions with the team.',
  defer: 'Automatic roadmap reprioritization, unreviewed ticket creation, and AI-generated requirements that cannot be traced to a brief, decision, or source.',
  insights: ['Roadmap status is only useful when it connects to the active project and the work actually underway.', 'AI can speed up writing, but a ticket is not ready until its requirement, acceptance criteria, and open questions are clear.'],
  questions: ['Can a PM tell where a feature sits in the roadmap and what is moving or blocked?', 'Does the PRD explain the user problem, outcome, scope, dependencies, and edge cases the team needs?', 'Can the team trace a ticket back to the requirement and decision that created it?'],
  journey: 'Capture the problem and outcome → place the initiative on the roadmap → shape and review the PRD → resolve open questions → draft tickets and acceptance criteria → align with engineering → track progress and update the roadmap when scope or priorities change.',
  ia: 'Connect roadmap initiatives to project progress, PRD and source material, decisions, epics, and delivery tickets. Keep the AI partner available beside the work it is helping to draft.',
  decision: 'Keep project context and delivery artifacts together, with AI assisting at the points where a PM turns product intent into requirements and tickets.',
  alternative: 'Use separate roadmap, PRD, and ticket tools and rely on a general AI chat to draft text without links to the initiative or its source context.',
  reasoning: 'The PM needs to preserve why the feature matters while making it actionable for design and engineering. Connecting the artifacts makes status, dependencies, and missing information easier to inspect.',
  evidence: 'The prototype includes timeline, project, and weekly views; project epics with product requirements and source material; ticket creation and story details; and AI support for drafting and planning suggestions.',
  tasks: ['Find an initiative on the roadmap and explain its current stage, status, and next milestone.', 'Start a PRD from a feature brief, attach relevant context, and identify unanswered questions before sharing it.', 'Turn an approved requirement into a ticket with acceptance criteria, then confirm its link back to the parent project.'],
  measure: 'Time from initiative brief to a reviewable PRD and ticket set, requirement and acceptance-criteria completeness, clarification and rework during development, roadmap-to-delivery traceability, and the proportion of AI drafts accepted, edited, or rejected.',
  change: 'The workspace brings roadmap views, project progress, requirement details, ticket creation, and contextual AI assistance into a connected flow.',
  unresolved: 'Source links and decisions need to stay current as scope changes. I would also validate how the system flags missing information without treating a plausible AI draft as an approved product decision.',
  screenRationale: 'Shows how roadmap progress, project work, product requirements, tickets, and AI assistance relate across the feature lifecycle.',
  accessibility: 'Keep project stage, status, and risk understandable without color alone. Make requirement fields, source links, ticket actions, and AI suggestions keyboard accessible and clearly labeled.',
  responsive: 'The roadmap is information-dense, so smaller layouts should keep the initiative, stage, status, and next action visible, then open requirements and tickets in a focused detail view.',
  edgeStates: 'A feature without an owner or roadmap date, a dependency that changes, missing PRD context, conflicting source documents, a ticket with unclear acceptance criteria, and a priority change during development.',
  outcomePlan: 'I would look for less time spent reconciling status and preparing handoffs, with fewer avoidable clarification loops and more complete requirements. I would measure those outcomes before claiming a delivery improvement.',
  reflection: 'I would keep the product intent visible as work moves into development. AI can make the first draft faster, but the PM and delivery team still need to resolve trade-offs, validate requirements, and agree what is ready to build.',
  screenCount: 'The prototype spans roadmap and project views, requirements, ticket creation, and AI-assisted planning.'
});

Object.assign(projects[16], {
  brief: 'Margin is a workspace for managing a product initiative from roadmap to development. It brings project progress, roadmap position, requirements, and delivery work into one flow. PMs can gather context from multiple sources, review those sources for relevance and validity, and use AI to surface PRD gaps or draft tickets before handing work to engineering.',
  challenge: 'A PM can miss information that changes the right product decision when context is split across roadmaps, research, customer feedback, analytics, specs, and team conversations. Priorities shift, dependencies emerge, and important assumptions may never make it into the PRD or ticket handoff. Margin brings those sources together with the initiative so the PM can inspect where information came from and decide whether it is current and trustworthy before using it. The workspace then connects that reviewed context to progress, roadmap position, requirements, and delivery tickets.',
  design: 'I organized the workspace around the product lifecycle: see where an initiative sits in the roadmap, understand progress, gather supporting context from multiple sources, review each source, and carry validated details into the PRD and tickets. Source links stay close to the information they support so a PM can inspect and confirm relevance before relying on it. AI can structure a draft, suggest a ticket breakdown, or flag missing context, but it should distinguish cited information from unanswered questions and generated suggestions. The PM remains responsible for validating sources and approving decisions.',
  product: 'The opportunity is to help PMs make better-informed decisions and reduce the coordination work between deciding what to build and giving a team enough context to build it. A first release should connect roadmap position and project status to the PRD, its supporting sources, decisions, and delivery tickets. It should make source review part of the workflow: show provenance, let the PM inspect the original material, and surface conflicting, outdated, or missing context before AI turns it into a polished draft. AI can accelerate PRD structure and ticket creation, while prioritization, source validation, and scope approval stay with the PM and team. I would evaluate source-review completion, requirement and acceptance-criteria completeness, time to a reviewable PRD and ticket set, handoff clarification, roadmap-to-delivery traceability, and how PMs edit or reject AI suggestions.'
});

Object.assign(caseNarratives[16], {
  constraint: 'Critical context can be spread across roadmaps, research, customer feedback, analytics, specs, and team discussions. Sources may be incomplete, outdated, or in conflict, and an AI draft can hide those gaps if it is not tied back to evidence.',
  unknown: 'Which sources PMs need to consult to make a feature decision, and how they judge whether that information is relevant and current.',
  hypothesis: 'If PMs can gather context from multiple sources, inspect provenance, and validate the material before using it, they can catch missing or conflicting information earlier and make more grounded product decisions.',
  focus: 'Keep roadmap and delivery progress connected to the PRD, while making source provenance, review, and missing context visible wherever AI helps draft requirements or tickets.',
  defer: 'Treating imported information as automatically valid, or allowing AI to turn an unverified source into approved scope or a committed ticket.',
  insights: ['PMs need to see the source behind a requirement or recommendation before they can judge whether it belongs in the decision.', 'A connected roadmap and delivery view should carry reviewed context into the PRD and tickets, not just carry status.', 'AI should flag missing, stale, or conflicting evidence rather than smoothing it into a confident answer.'],
  questions: ['Can a PM tell where a feature sits in the roadmap and what is moving or blocked?', 'Can the PM gather relevant context from multiple sources and inspect each source before using it?', 'Does the PRD explain the user problem, outcome, scope, dependencies, and edge cases, with claims traceable to valid sources?', 'Can the team trace a ticket back to the requirement, source material, and decision that created it?'],
  ia: 'Connect roadmap initiatives to project progress, source material, PRD requirements, decisions, epics, and delivery tickets. Keep source links and review status visible beside the details they support, with AI assistance next to the work it drafts.',
  decision: 'Keep project context and delivery artifacts together, and make source review part of the PM workflow before AI uses information to draft requirements or tickets.',
  reasoning: 'PMs need to preserve why a feature matters and verify the context behind a decision before making it actionable for design and engineering. Source links and review states make gaps and conflicting information easier to inspect.',
  evidence: 'The prototype includes project and roadmap views, requirements and source material, ticket creation, and AI support for drafting and planning suggestions.',
  tasks: ['Find an initiative on the roadmap and explain its current stage, status, and next milestone.', 'Gather relevant context for a feature, open a source, and decide whether it is current and relevant.', 'Start a PRD from a feature brief and reviewed sources; identify unsupported claims or unanswered questions.', 'Turn an approved requirement into a ticket with acceptance criteria and trace it back to the PRD and source material.'],
  measure: 'Source inspection and validation before use, time from brief and source review to a reviewable PRD and ticket set, requirement and acceptance-criteria completeness, clarification during development, roadmap-to-delivery traceability, and PM edits to AI drafts.',
  unresolved: 'The product needs clear ways to judge source ownership, date, relevance, and conflicts. I would validate how PMs confirm or reject source material and how the interface communicates that an AI suggestion still needs review.',
  edgeStates: 'A source without an owner or date, conflicting source documents, stale customer feedback, unsupported AI-generated detail, a missing requirement, a blocked dependency, and a priority change during development.'
});

const projectReferences = [
  { name: 'Slack', url: 'https://slack.com/', lens: 'I looked at how Slack keeps conversations, channels, and connected work close together.' },
  { name: 'Lastminute.com', url: 'https://www.lastminute.com/', lens: 'I looked at how Lastminute.com balances flight search with holiday deals and destination discovery.', researchUrl: 'https://wearesigma.com/news/travel-booking-websites-usability-and-accessibility-review/', research: 'In a 2016 usability review, Lastminute.com’s booking process scored 5/10. The review called out unclear form labels, required fields, and progress cues.' },
  { name: 'Bloom & Wild', url: 'https://www.bloomandwild.com/', lens: 'I looked at how Bloom & Wild helps shoppers browse gifts by occasion and understand product and delivery details.' },
  { name: 'Zocdoc', url: 'https://www.zocdoc.com/', lens: 'I looked at how Zocdoc connects a care need and location to a provider search.' },
  { name: 'Spotify', url: 'https://open.spotify.com/', lens: 'I looked at how Spotify makes room for discovery without losing the listener’s library and current playback.' },
  { name: 'monday.com', url: 'https://monday.com/', lens: 'I looked at how monday.com presents work status, available views, and the next action.' },
  { name: 'Airbnb', url: 'https://www.airbnb.com/', lens: 'I looked at how Airbnb keeps destination, dates, and guest details connected while people compare places to stay.' },
  { name: 'Google Home', url: 'https://home.google.com/', lens: 'I looked at how Google Home groups rooms, devices, and household controls.' },
  { name: 'Zocdoc', url: 'https://www.zocdoc.com/', lens: 'I looked at how Zocdoc takes people from choosing a provider to finding an available appointment.' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com/', lens: 'I looked at how Crunchyroll balances a large anime catalog with a way to pick up a show already in progress.' },
  { name: 'Airbnb', url: 'https://www.airbnb.com/', lens: 'I looked at how Airbnb lets travelers narrow a map of stays by place, dates, group size, and amenities.' },
  { name: 'Google Nest', url: 'https://store.google.com/category/connected_home', lens: 'I looked at how Google Nest presents connected-home controls and energy features.' },
  { name: 'Front', url: 'https://front.com/', lens: 'I looked at how Front keeps ownership, conversation history, and collaboration together in a shared inbox.' },
  { name: 'Google Maps', url: 'https://maps.google.com/', lens: 'I looked at how Google Maps pairs route choices with the context people need to get around.' },
  { name: 'Air India · eZ Booking', url: 'https://www.airindia.com/', lens: 'I looked at Air India’s conversational booking concept as a reference for an AI-assisted flight search.', researchUrl: 'https://www.airindia.com/content/dam/air-india/newsroom/press-releases/pdf/Press%20Release_AIR%20INDIA%20LAUNCHES%20AI-DRIVEN%20eZ%20Booking.pdf' },
  { name: 'Navan', url: 'https://navan.com/', lens: 'I looked at how Navan brings business-trip details and support into one place.' }
];

function caseImageSlot(title, description) {
  return `<div class="case-artifact-placeholder" role="note"><b>${title}</b><small>${description}</small></div>`;
}

// Project case study renderer, with project-specific context and evidence limits.
function openCaseStudy(index, { fromHistory = false } = {}) {
  activeCaseProjectIndex = index;
  if (!fromHistory && !caseDialog.open) {
    const previousState = history.state && typeof history.state === 'object' ? history.state : {};
    caseStudyReturnScrollY = window.scrollY;
    caseStudyReturnTitle = document.title;
    history.pushState({ ...previousState, portfolioCaseStudyIndex: index, portfolioCaseStudyReturnY: caseStudyReturnScrollY, portfolioCaseStudyReturnTitle: caseStudyReturnTitle }, '', location.href);
  } else if (fromHistory) {
    caseStudyReturnScrollY = Number(history.state?.portfolioCaseStudyReturnY) || caseStudyReturnScrollY;
    caseStudyReturnTitle = history.state?.portfolioCaseStudyReturnTitle || caseStudyReturnTitle;
  }
  const project = projects[index];
  const screens = projectScreens[index];
  const marketReference = projectReferences[index];
  const n = { ...caseNarratives[index] };
  const removeMetaSentences = (text) => text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/(?:\bCV\b|resume|portfolio screen|supplied screen|the supplied|case notes|not documented|not supplied|not included|not provided|no project-specific|no project results|no prior|no earlier|no before|no verified|no test-driven|no test results|not listed|not a claim|not a validated|no formal|no project audit|there are no launch outcomes)/i.test(sentence))
    .join(' ')
    .trim();
  Object.entries(n).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    n[key] = removeMetaSentences(value);
  });
  n.evidence = '';
  n.change = '';
  n.outcomePlan = '';
  n.measure = removeMetaSentences((caseNarratives[index].measure || '').split(/;\s*(?:no project|these are proposed|project results|no results)/i)[0]);
  const takeaway = caseTakeaways[index];
  const summary = caseSummaries[index] || project.challenge || project.brief;
  const isConcept = [7, 10, 14, 15, 16].includes(index);
  const pageRedesigns = {
    0: {
      title: 'The sidebar is the redesign; the story is about making the workspace easier to scan.',
      purpose: 'A communications workspace needs to make destinations recognizable without letting navigation compete with the work area.',
      task: 'Find a message, project, or report and understand which items need attention.',
      focus: 'Group related destinations, make priority states legible, and keep the sidebar compact enough to protect the working canvas.',
      checks: ['Can people distinguish primary destinations from secondary links at a glance?', 'Are priority and unread states noticeable without relying on color alone?', 'Does the expanded and compact treatment preserve useful context?']
    },
    1: {
      title: 'The homepage redesign makes flight search and travel information easier to find.',
      purpose: 'The page has to serve travelers ready to search as well as people still gathering information, without making either audience work through competing content.',
      task: 'Start a flight search or locate useful information before planning a trip.',
      focus: 'Give the booking entry point a clear visual priority, group supporting travel information by traveler need, and keep the page scannable across widths.',
      checks: ['Can a first-time visitor identify where to begin a flight search?', 'Can travelers find a relevant supporting detail without scanning every section?', 'Does the hierarchy remain clear at mobile and desktop widths?']
    },
    4: {
      title: 'The listening page redesign keeps playback in reach while making discovery easier to scan.',
      purpose: 'Listeners should be able to explore music without losing track of what is currently playing or how to control it.',
      task: 'Understand the current listening context and choose something else to play.',
      focus: 'Separate persistent playback controls from discovery content, keep the current track recognizable, and make the next listening action easy to spot.',
      checks: ['Can listeners tell what is playing and find playback controls immediately?', 'Can a listener distinguish discovery options from the current queue?', 'Does the visual hierarchy support both a quick scan and a longer browse?']
    },
    5: {
      title: 'The dashboard redesign makes project status easier to scan without flattening every signal.',
      purpose: 'A project overview should help a busy team understand the state of work and notice where attention may be needed.',
      task: 'Scan the overview, understand project status, and identify an item that needs attention.',
      focus: 'Use restrained emphasis for exceptions, clear labels for status, and a deliberate density so the important signals rise above supporting data.',
      checks: ['Can someone identify the status of a project in a quick scan?', 'Do urgent exceptions stand apart from routine information?', 'Can the page retain useful detail without making all metrics look equally important?']
    },
    9: {
      title: 'The discovery-page redesign balances finding a new series with returning to one already started.',
      purpose: 'A streaming homepage should help viewers choose what to watch while keeping their current progress easy to pick up again.',
      task: 'Choose a series to explore or resume an episode in progress.',
      focus: 'Give continuation a predictable place, make discovery categories easy to scan, and show enough title context to support a confident choice.',
      checks: ['Can viewers find their in-progress show without searching again?', 'Can viewers understand the featured and recommended content at a glance?', 'Does the page balance returning content with new discovery?']
    },
    11: {
      title: 'The home dashboard redesign turns energy and device information into a clearer at-a-glance view.',
      purpose: 'Residents need to understand what is happening at home and find a relevant control without first decoding a dense set of readings.',
      task: 'Check a room or energy status and locate the related device control.',
      focus: 'Group information in a way that connects status to the room or device, use plain-language labels, and make actionable controls easy to distinguish from readings.',
      checks: ['Can a resident explain the key status shown on the page?', 'Can they find the control associated with a room or device?', 'Are readings and actions visually distinct, including for people who do not distinguish color easily?']
    },
    12: {
      title: 'The inbox-page redesign keeps the source of each conversation clear in a unified workspace.',
      purpose: 'Bringing conversations together can save switching, but the page still needs to preserve who is speaking, where a message came from, and whether it needs attention.',
      task: 'Scan conversations, recognize their source and status, and open the right thread.',
      focus: 'Make source identity and unread state scannable, keep conversation context close to the thread list, and prevent platform cues from overwhelming message content.',
      checks: ['Can someone recognize which connected service a thread belongs to?', 'Are unread conversations visible without relying only on color?', 'Can the page show context without making the thread list difficult to scan?']
    }
  };
  const pageRedesign = pageRedesigns[index] || null;
  const hasPrototype = [14, 15, 16].includes(index) || Boolean(project.prototypeHref);
  const prototypeHref = index === 14 ? 'AirScout/index.html?preview=dashboard&release=booking-confirmed-check-v1' : index === 15 ? 'WorkPal/index.html' : index === 16 ? 'AI Project Dashboard/dist/index.html' : project.prototypeHref;
  const role = 'Product Designer / UX/UI Designer; product-management responsibilities varied by initiative.';
  const researchStatus = pageRedesign
    ? `I kept this redesign focused on the page itself: what people notice first, what they understand, and whether the next action is easy to find. ${pageRedesign.purpose}`
    : hasPrototype
      ? `I wanted to understand ${n.unknown.charAt(0).toLowerCase() + n.unknown.slice(1)}`
      : `I started by asking ${n.unknown.charAt(0).toLowerCase() + n.unknown.slice(1)}`;
  const researchWhy = pageRedesign
    ? ['I looked for what should lead and what could sit in the background.', 'I checked that the main action stands out from everything around it.', 'I checked how the layout holds up as the screen gets smaller.']
    : [n.unknown, n.reasoning, n.focus];
  const researchHeadings = pageRedesign
    ? ['Content hierarchy', 'Primary task and action', 'Responsive scan']
    : ['Who this is for', 'What needs to be clear', 'Where the experience can break'];
  const researchCards = n.questions.slice(0, 3).map((question, i) => `<article class="case-method-card"><h4>${researchHeadings[i]}</h4><p>${pageRedesign ? pageRedesign.checks[i] : question}</p><p>${researchWhy[i]}</p></article>`).join('');
  const pageCraftNotes = [
    n.accessibility && `<div><b>Inclusive use</b><p>${n.accessibility}</p></div>`,
    n.responsive && `<div><b>Responsive behavior</b><p>${n.responsive}</p></div>`,
    n.edgeStates && `<div><b>Details I designed for</b><p>${n.edgeStates}</p></div>`,
    n.unresolved && `<div><b>What I’d refine next</b><p>${n.unresolved}</p></div>`
  ].filter(Boolean).join('');
  const craftDetails = [
    n.accessibility && `<div><h4>Accessibility</h4><p>${n.accessibility}</p></div>`,
    n.responsive && `<div><h4>Responsive design</h4><p>${n.responsive}</p></div>`,
    n.edgeStates && `<div><h4>Details I designed for</h4><p>${n.edgeStates}</p></div>`
  ].filter(Boolean).join('');
  const referenceImage = marketReference
    ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(marketReference.url)}?w=1280&h=850`
    : '';
  const referenceMarkup = marketReference
    ? `<aside class="case-reference-card"><a class="case-reference-image" href="${marketReference.url}" target="_blank" rel="noreferrer" aria-label="Open ${marketReference.name} in a new tab"><img src="${referenceImage}" alt="${marketReference.name} homepage" loading="lazy"><span>OPEN ${marketReference.name.toUpperCase()} ↗</span></a><div class="case-reference-copy"><span class="case-section-index">A REFERENCE I LOOKED AT</span><p>${marketReference.lens}</p>${marketReference.research ? `<p class="case-reference-evidence">${marketReference.research} <a href="${marketReference.researchUrl}" target="_blank" rel="noreferrer">Read the review ↗</a></p>` : marketReference.researchUrl ? `<p class="case-reference-evidence">${marketReference.name} announced a related flight-booking approach. <a href="${marketReference.researchUrl}" target="_blank" rel="noreferrer">Read about it ↗</a></p>` : ''}<div class="case-reference-response"><b>What I carried into this design</b><p>${n.decision}</p></div></div></aside>`
    : '';
  const screenItems = screens.type === 'sidebarPair'
    ? [{ file: screens.files, type: screens.type, label: 'Light and dark sidebar views' }]
    : [...screens.files.map((file, i) => ({ file, type: screens.type, label: index === 3 ? ['Choose a doctor', 'Browse care categories', 'Choose a care path'][i] : screens.type === 'agent' ? `AirScout desktop · ${file}` : screens.type === 'workpal' ? `WorkPal · ${file}` : screens.type === 'planner' ? ['Timeline and workload', 'Project board', 'Weekly plan'][i] : `Screen ${String(i + 1).padStart(2, '0')}` })), ...(screens.mobileFiles || []).map((file) => ({ file, type: 'agentMobile', label: `AirScout mobile · ${file}` }))];
  const screenMarkup = screenItems.map(({ file, type: deviceType, label }) => `<div class="case-screen-item">${renderDevice(file, deviceType, deviceType === 'agentMobile' ? 'case-gallery-mobile-device' : 'case-gallery-device')}<span>${label}</span></div>`).join('');
  const stepsMarkup = (items) => `<ol class="case-steps">${items.map(([title, body]) => `<li><b>${title}</b><p>${body}</p></li>`).join('')}</ol>`;
  const designerSteps = pageRedesign
    ? [
        ['Read the page as it is', `Start with the visible audience and task: ${pageRedesign.task} Identify which information currently competes for attention.`],
        ['Set a clear hierarchy', pageRedesign.focus],
        ['Clarify the primary action', `Make the next step recognizable and keep secondary information available without giving it equal visual weight. ${n.decision}`],
        ['Check the page in context', `Review the page at desktop and mobile widths, then evaluate these criteria: ${pageRedesign.checks.join(' ')}`]
      ]
    : [
        ['Frame the task', `Start from the working audience and job: ${n.users} The exact segment should be confirmed against project records.`],
        ['Make the key choice visible', n.decision],
        [hasPrototype ? 'Prototype the connected experience' : 'Connect the key screens', n.journey],
        ['See where people hesitate', `I would ask someone to ${n.tasks[1]} and watch for the moments where the interface leaves them guessing.`]
      ];
  const managerSteps = pageRedesign
    ? [
        ['Agree on the page outcome', `Define what the page should help people do: ${pageRedesign.task}`],
        ['Prioritize what earns attention', `Use the primary task to rank the information and actions. Start with ${pageRedesign.focus}`],
        ['Resolve content and delivery needs', `Confirm the content, data, responsive behavior, and implementation constraints that affect this page. ${n.constraint}`],
        ['Measure page effectiveness', 'Track first-click accuracy, time to find the primary action or key information, task completion, and accessibility issues.']
      ]
    : [
        ['Define the outcome', n.hypothesis],
        ['Check constraints and dependencies', n.constraint],
        ['Choose what to do first', `I would start with ${n.focus} For now, I would leave ${n.defer}`],
        ['Agree on measures', n.measure]
      ];
  const problemDetails = pageRedesign
    ? `<div class="case-two-col"><div><h4>What this page needs to do</h4><p>${pageRedesign.purpose}</p><h4>Primary page task</h4><p>${pageRedesign.task}</p></div><div><h4>Redesign constraint</h4><p>${n.constraint}</p><h4>Success hypothesis</h4><p>${n.hypothesis}</p><div class="case-note"><b>What was unknown at the start</b><p>${n.unknown}</p></div></div></div>`
    : `<div class="case-two-col"><div><h4>Problem statement</h4><p>${project.brief || project.challenge}</p><h4>Who I designed for</h4><p>${n.users}</p></div><div><h4>Constraints</h4><p>${n.constraint}</p><h4>What I wanted to improve</h4><p>${n.hypothesis}</p><div class="case-note"><b>The question I started with</b><p>${n.unknown}</p></div></div></div>`;
  const researchSection = pageRedesign
    ? `<h3>I kept the redesign focused on the page itself.</h3><p class="case-section-lead">${researchStatus}</p><div class="case-method-grid">${researchCards}</div>`
    : `<h3>${hasPrototype ? 'I shaped the experience around the decisions that matter most.' : 'I focused on the moments that shape the experience.'}</h3><p class="case-section-lead">${researchStatus}</p><div class="case-method-grid">${researchCards}</div><div class="case-insight-grid">${n.insights.map((insight, i) => `<article class="case-insight-card"><p>${insight} That led me to <b>${i === 0 ? n.decision : n.focus}</b></p></article>`).join('')}</div>`;
  const defineSection = pageRedesign
    ? `<h3>${pageRedesign.title}</h3><div class="case-two-col"><div><h4>Audience and context</h4><p>${n.users}</p><h4>Page job</h4><p>${pageRedesign.task}</p></div><div><h4>How might we</h4><p class="case-prompt">How might we help people ${pageRedesign.task.charAt(0).toLowerCase() + pageRedesign.task.slice(1)} with less scanning and clearer hierarchy?</p><div class="case-priority-grid"><div><b>What I focused on</b><p>${pageRedesign.focus}</p></div><div><b>What I left out</b><p>${n.defer}</p></div></div></div></div>`
    : `<h3>I focused on the job people come here to do.</h3><div class="case-two-col"><div><h4>Who it is for</h4><p>${n.users}</p><h4>What they need</h4><p>When <b>${n.situation}</b>, they want to <b>${n.motivation}</b>, so they can <b>${n.outcome}</b></p><h4>How the experience fits together</h4><p>${n.journey}</p></div><div><h4>The question I kept coming back to</h4><p class="case-prompt">How might I help people ${n.motivation} while respecting ${n.constraint.toLowerCase()}?</p><div class="case-priority-grid"><div><b>What I focused on</b><p>${n.focus}</p></div><div><b>What I left for later</b><p>${n.defer}</p></div></div></div></div>`;
  const decisionArtifacts = pageRedesign
    ? `<div class="case-priority-grid"><div><b>What I brought forward</b><p>${pageRedesign.focus}</p></div><div><b>Alternative considered</b><p>${n.alternative}</p></div></div>`
    : `<div class="case-priority-grid"><div><b>What I brought forward</b><p>${n.focus}</p></div><div><b>What I kept out of scope</b><p>${n.defer}</p></div></div>`;
  const testSection = pageRedesign
    ? `<h3>I would check whether people can quickly understand the page and find the action they came for.</h3><div class="case-two-col"><div><h4>What I would look for</h4><ul>${pageRedesign.checks.map((check) => `<li>${check}</li>`).join('')}</ul></div><div><h4>What I would measure</h4><p>Whether people choose the right first action, how quickly they find key information, and whether the page still reads clearly on a smaller screen.</p><h4>What I would refine next</h4><p>${n.unresolved}</p></div></div>`
    : `<h3>I’d put the important moments in front of people and see where the design holds up.</h3><div class="case-two-col"><div><h4>What I’d ask someone to try</h4><ul>${n.tasks.map((task) => `<li>${task}</li>`).join('')}</ul></div><div>${n.measure ? `<h4>What I’d pay attention to</h4><p>${n.measure}</p>` : ''}<h4>What I’d work through next</h4><p>${n.unresolved}</p></div></div>`;
  const craftSection = pageRedesign
    ? `<h3>The redesign lives in the details of this one screen.</h3><p class="case-section-lead">${pageRedesign.focus}</p><div class="case-decision-grid page-redesign-details"><div><b>Information hierarchy</b><p>${n.decision}</p></div><div><b>Primary task</b><p>${pageRedesign.task}</p></div><div><b>Visual clarity</b><p>${n.reasoning}</p></div></div>${pageCraftNotes ? `<div class="case-craft-grid">${pageCraftNotes}</div>` : ''}`
    : `<h3>${hasPrototype ? 'I designed the key states to work together as one product.' : 'I brought these screens together around the same product logic.'}</h3><p class="case-section-lead">My main priority was to ${n.focus.charAt(0).toLowerCase() + n.focus.slice(1)}</p><div class="case-screen-gallery">${screenMarkup}</div>${craftDetails ? `<div class="case-craft-grid">${craftDetails}</div>` : ''}`;

  caseContent.innerHTML = `
    <div class="case-reading-progress" role="progressbar" aria-label="Case study reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
    <nav class="case-section-nav" aria-label="Case study sections"><a href="#case-problem">Problem</a><a href="#case-research">Research</a><a href="#case-define">Approach</a><a href="#case-decide">Decisions</a><a href="#case-test">Next steps</a><a href="#case-craft">Design</a><a href="#case-reflection">Reflection</a></nav>
    <header class="case-study-summary" id="case-summary">
      <div class="case-summary-copy"><span class="case-kicker">${project.category || 'PRODUCT DESIGN'} · CASE STUDY</span><h2 id="case-title">${project.title}</h2><p>${summary}</p>${prototypeHref ? `<a class="button dark prototype-launch" href="${prototypeHref}" aria-haspopup="dialog">Open interactive prototype <span>↗</span></a>` : ''}</div>
      <div class="case-feature-screen">${renderDevice(screens.type === 'sidebarPair' ? screens.files : screens.files[0], screens.type, 'case-device')}</div>
      ${![14, 15, 16].includes(index) ? '<aside class="case-note case-nda-note"><p>I\'ve changed some names and details to respect client confidentiality.</p></aside>' : ''}
    </header>
    <article class="case-study-body">
      <section class="case-study-section" id="case-problem" data-case-section><span class="case-section-index">01 / ${pageRedesign ? 'PAGE REDESIGN' : 'THE PROBLEM'}</span><h3>${pageRedesign ? pageRedesign.title : takeaway}</h3>${problemDetails}</section>
      <section class="case-study-section" id="case-research" data-case-section><span class="case-section-index">02 / ${pageRedesign ? 'PAGE REVIEW' : 'DESIGN QUESTIONS'}</span>${researchSection}</section>
      <section class="case-study-section" id="case-define" data-case-section><span class="case-section-index">03 / ${pageRedesign ? 'PAGE PRIORITIES' : 'MY APPROACH'}</span>${defineSection}</section>
      <section class="case-study-section" id="case-decide" data-case-section><span class="case-section-index">04 / DECISIONS</span><h3>${pageRedesign ? 'I prioritized what the page needs to communicate first.' : `I chose to ${n.decision.toLowerCase()}`}</h3>${referenceMarkup}${decisionArtifacts}<article class="case-decision-card"><div class="case-decision-heading"><span>THE CHOICE</span><p>${n.decision}</p></div><div class="case-decision-grid"><div><b>Another direction</b><p>${n.alternative}</p></div><div><b>Why it made sense</b><p>${n.reasoning}</p></div></div></article><div class="case-lens-wrap"><div class="case-role-head"><div><span class="case-section-index">TWO WAYS I THINK ABOUT THE WORK</span><h4>Design craft and product judgment</h4></div><div class="role-tabs" role="tablist" aria-label="Choose a role lens"><button type="button" class="role-tab active" role="tab" aria-selected="true" data-role="designer">Product Designer</button><button type="button" class="role-tab" role="tab" aria-selected="false" data-role="manager">Product Manager</button></div></div><div class="role-panel" id="role-panel"></div></div></section>
      <section class="case-study-section" id="case-test" data-case-section><span class="case-section-index">05 / WHAT I’D DO NEXT</span>${testSection}</section>
      <section class="case-study-section" id="case-craft" data-case-section><span class="case-section-index">06 / DESIGN DETAILS</span>${craftSection}</section>
      ${n.reflection ? `<section class="case-study-section case-outcome-section" id="case-reflection" data-case-section><span class="case-section-index">07 / REFLECTION</span><h3>What I’d carry into the next round</h3><p class="case-section-lead">${n.reflection}</p></section>` : ''}
      <footer class="case-footer"><span>Have a related challenge?</span><a class="button dark" href="#contact">Let’s talk <span>↗</span></a></footer>
    </article>`;

  document.title = `${project.title} - Case Study | Thien Nguyen`;
  caseContent.querySelectorAll('.case-section-nav a').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    caseContent.querySelector(link.hash)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));
  function setRole(role) {
    const items = role === 'designer' ? designerSteps : managerSteps;
    const body = pageRedesign
      ? role === 'designer'
        ? `This is a page-level redesign. I would judge the work by the clarity of the hierarchy, the ease of finding the primary task, and how well the layout holds together across screen sizes. ${pageRedesign.focus}`
        : `From a product perspective, I would align the page with its primary customer and business task, then prioritize content and implementation around that goal. ${project.product || n.hypothesis}`
      : role === 'designer' ? project.design : project.product;
    caseContent.querySelectorAll('.role-tab').forEach((button) => {
      const active = button.dataset.role === role;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    caseContent.querySelector('#role-panel').innerHTML = `<div class="role-intro"><p>${body || n.hypothesis}</p></div>${stepsMarkup(items)}`;
  }
  setRole('designer');
  caseContent.querySelectorAll('.role-tab').forEach((button) => button.addEventListener('click', () => setRole(button.dataset.role)));
  caseContent.querySelector('.role-tabs')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const tabs = [...caseContent.querySelectorAll('.role-tab')];
    const activeIndex = tabs.indexOf(document.activeElement);
    if (activeIndex < 0) return;
    event.preventDefault();
    tabs[(activeIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].click();
    caseContent.querySelector('.role-tab.active')?.focus();
  });
  caseContent.scrollTop = 0;
  caseDialog.showModal();
  fitPhoneScreens(caseContent);
  fitDesktopScreens(caseContent);
  fitPlannerScreens(caseContent);
  fitWorkPalScreens(caseContent);
  fitAirScoutMobileScreens(caseContent);
  fitAgentScreens(caseContent);
  updateCaseStudyNavigation();
}

function updateCaseStudyNavigation() {
  const maxScroll = caseContent.scrollHeight - caseContent.clientHeight;
  const progress = maxScroll > 0 ? Math.min(100, Math.max(0, caseContent.scrollTop / maxScroll * 100)) : 0;
  const bar = caseContent.querySelector('.case-reading-progress');
  if (bar) {
    bar.setAttribute('aria-valuenow', String(Math.round(progress)));
    bar.querySelector('span').style.width = `${progress}%`;
  }
  const marker = caseContent.getBoundingClientRect().top + 150;
  let current = null;
  caseContent.querySelectorAll('[data-case-section]').forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });
  caseContent.querySelectorAll('.case-section-nav a').forEach((link) => {
    if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
caseContent.addEventListener('scroll', updateCaseStudyNavigation, { passive: true });

projectSlider.addEventListener('click', (event) => {
  if (suppressSliderClick) {
    event.preventDefault();
    event.stopPropagation();
    suppressSliderClick = false;
    return;
  }
  const trigger = event.target.closest('[data-project]');
  if (trigger) openCaseStudy(Number(trigger.dataset.project));
});

function renderExpandedSlide() {
  const slide = expandedSlides[expandedSlideIndex];
  if (!slide) return;

  lightboxImages.className = 'lightbox-images';
  let expandedView;
  if (slide.type === 'sidebarPair') {
    expandedView = document.createElement('div');
    expandedView.className = 'sidebar-artwork sidebar-artwork-pair lightbox-artwork';
    slide.files.forEach((file, index) => {
      const image = document.createElement('img');
      image.src = file;
      image.alt = `Odyssey ${index === 0 ? 'dark' : 'light'} mode sidebar`;
      expandedView.append(image);
    });
    lightboxImages.classList.add('is-artwork');
  } else if (slide.type === 'sidebar') {
    expandedView = document.createElement('div');
    expandedView.className = 'lightbox-artwork-single';
    const image = document.createElement('img');
    image.src = slide.files[0];
    image.alt = slide.label;
    expandedView.append(image);
    lightboxImages.classList.add('is-artwork');
  } else if (slide.type === 'desktop' || slide.type === 'agent' || slide.type === 'planner') {
    expandedView = document.createElement('div');
    if (slide.type === 'agent') {
      expandedView.className = 'agent-expanded-preview';
      expandedView.innerHTML = `${renderDevice(slide.files[0], 'agent', 'lightbox-device')}<a class="button dark prototype-launch" href="AirScout/index.html?preview=dashboard" aria-haspopup="dialog">Open prototype <span>↗</span></a>`;
    } else if (slide.type === 'planner') {
      expandedView.className = 'agent-expanded-preview planner-expanded-preview';
      expandedView.innerHTML = `${renderDevice(slide.files[0], 'planner', 'lightbox-device')}<a class="button dark prototype-launch" href="AI Project Dashboard/dist/index.html" aria-haspopup="dialog">Open prototype <span>↗</span></a>`;
    } else {
      expandedView.className = 'desktop-device lightbox-device';
      expandedView.innerHTML = '<span class="desktop-chrome"><i></i><i></i><i></i></span><span class="desktop-display"><img alt="Expanded desktop app screen"></span>';
      expandedView.querySelector('img').src = slide.files[0];
    }
    lightboxImages.classList.add('is-desktop');
  } else if (slide.type === 'agentMobile') {
    expandedView = document.createElement('div');
    expandedView.className = 'agent-expanded-preview agent-expanded-mobile';
    expandedView.innerHTML = `${renderDevice(slide.files[0], 'agentMobile', 'lightbox-device')}<a class="button dark prototype-launch" href="AirScout/index.html?preview=dashboard" aria-haspopup="dialog">Open prototype <span>↗</span></a>`;
    lightboxImages.classList.add('is-phone');
  } else if (slide.type === 'workpal') {
    expandedView = document.createElement('div');
    expandedView.className = 'agent-expanded-preview workpal-expanded-preview';
    expandedView.innerHTML = renderDevice(slide.files[0], 'workpal', 'lightbox-device');
    lightboxImages.classList.add('is-phone');
  } else {
    expandedView = document.createElement('div');
    expandedView.className = 'project-device lightbox-device';
    expandedView.innerHTML = '<span class="device-island"></span><span class="device-screen"><img alt="Expanded mobile app screen"></span><span class="device-home"></span>';
    expandedView.querySelector('img').src = slide.files[0];
    lightboxImages.classList.add('is-phone');
  }
  lightboxImages.replaceChildren(expandedView);
  lightboxTitle.textContent = slide.label;
  lightboxThumbnails.hidden = slide.type === 'agent' || slide.type === 'agentMobile' || slide.type === 'workpal';
  lightboxThumbnails.querySelectorAll('.lightbox-thumb').forEach((button, index) => {
    button.classList.toggle('active', index === expandedSlideIndex);
    button.setAttribute('aria-pressed', String(index === expandedSlideIndex));
  });
  fitPhoneScreens(imageLightbox);
  fitDesktopScreens(imageLightbox);
  fitPlannerScreens(imageLightbox);
  fitWorkPalScreens(imageLightbox);
}

function openWorkPalPrototypeOverlay() {
  if (imageLightbox.open) return;
  expandedSlides = [{ type: 'workpal', files: ['overview'], label: 'WorkPal · Interactive prototype' }];
  expandedSlideIndex = 0;
  document.documentElement.classList.add('prototype-overlay-open');
  imageLightbox.classList.add('workpal-prototype-overlay');
  imageLightbox.classList.remove('prototype-app-overlay');
  imageLightbox.classList.remove('has-multiple');
  lightboxThumbnails.replaceChildren();
  document.querySelector('.lightbox-prev').hidden = true;
  document.querySelector('.lightbox-next').hidden = true;
  renderExpandedSlide();
  imageLightbox.showModal();
  requestAnimationFrame(() => fitWorkPalScreens(imageLightbox));
  document.querySelector('.lightbox-close').focus();
}

function openFullPrototypeOverlay(title, src) {
  if (imageLightbox.open && imageLightbox.classList.contains('prototype-app-overlay')) return;
  const alreadyOpen = imageLightbox.open;
  document.documentElement.classList.add('prototype-overlay-open');
  imageLightbox.classList.add('prototype-app-overlay');
  imageLightbox.classList.remove('workpal-prototype-overlay', 'has-multiple');
  lightboxImages.className = 'lightbox-images prototype-app-frame';
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = `${title} interactive prototype`;
  frame.allow = 'fullscreen';
  lightboxImages.replaceChildren(frame);
  lightboxTitle.textContent = `${title} · Interactive prototype`;
  lightboxThumbnails.replaceChildren();
  lightboxThumbnails.hidden = true;
  document.querySelector('.lightbox-prev').hidden = true;
  document.querySelector('.lightbox-next').hidden = true;
  if (!alreadyOpen) imageLightbox.showModal();
  document.querySelector('.lightbox-close').focus();
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const path = decodeURIComponent(new URL(link.href, location.href).pathname);
  let launch;
  if (path.endsWith('/WorkPal/index.html')) launch = ['workpal'];
  else if (path.endsWith('/AirScout/index.html')) launch = ['AirScout', new URL('AirScout/index.html?preview=dashboard&release=booking-confirmed-check-v1', location.href).href];
  else if (path.endsWith('/AI Project Dashboard/dist/index.html')) launch = ['Margin', new URL('AI Project Dashboard/dist/index.html?portfolioPreview=1&previewView=timeline&mobileViewport=1', location.href).href];
  if (!launch) return;
  event.preventDefault();
  if (launch[0] === 'workpal') openWorkPalPrototypeOverlay();
  else openFullPrototypeOverlay(launch[0], launch[1]);
});
imageLightbox.addEventListener('close', () => { imageLightbox.classList.remove('workpal-prototype-overlay', 'prototype-app-overlay'); document.documentElement.classList.remove('prototype-overlay-open'); });

function setExpandedSlide(index) {
  if (!expandedSlides.length) return;
  expandedSlideIndex = (index + expandedSlides.length) % expandedSlides.length;
  renderExpandedSlide();
}

function openExpandedScreens(device) {
  const screenSet = projectScreens[activeCaseProjectIndex];
  if (!screenSet?.files?.length) return;
  const sourceImages = [...device.querySelectorAll('img')];
  const clickedSource = sourceImages[0]?.getAttribute('src');
  expandedSlides = screenSet.files.map((file, index) => ({
    type: screenSet.type === 'sidebarPair' ? 'sidebar' : screenSet.type,
    files: [file],
    label: screenSet.type === 'sidebarPair'
      ? (index === 0 ? 'Odyssey · dark mode' : 'Odyssey · light mode')
      : `Screen ${String(index + 1).padStart(2, '0')} of ${String(screenSet.files.length).padStart(2, '0')}`,
  }));
  if (screenSet.type === 'sidebarPair') {
    expandedSlides = screenSet.files.map((file, index) => ({
      type: 'sidebar', files: [file],
      label: `Odyssey · ${index === 0 ? 'dark' : 'light'} mode`,
    }));
  }
  if (screenSet.type === 'agent') {
    const mobilePreview = device.classList.contains('agent-mobile-device');
    if (mobilePreview) {
      expandedSlides = [{ type: 'agentMobile', files: [null], label: 'AirScout · My trips on mobile' }];
    } else {
      const activePreview = new URL(device.querySelector('iframe')?.src || location.href).searchParams.get('preview');
      expandedSlides = screenSet.files.map((page) => ({ type: 'agent', files: [page], label: `AirScout · ${page.replaceAll('-', ' ')}` }));
      expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === activePreview));
    }
  }
  if (screenSet.type === 'workpal') {
    const activePage = new URL(device.querySelector('iframe')?.src || location.href).searchParams.get('previewPage');
    expandedSlides = screenSet.files.map((page) => ({ type: 'workpal', files: [page], label: `WorkPal · ${page}` }));
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === activePage));
  }
  if (screenSet.type !== 'agent' && screenSet.type !== 'workpal') {
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === clickedSource));
  }

  if (screenSet.type === 'agentMobile') {
    expandedSlideIndex = 0;
    lightboxThumbnails.replaceChildren();
    imageLightbox.classList.remove('has-multiple');
    document.querySelector('.lightbox-prev').hidden = true;
    document.querySelector('.lightbox-next').hidden = true;
    renderExpandedSlide();
    imageLightbox.showModal();
    requestAnimationFrame(() => fitWorkPalScreens(imageLightbox));
    return;
  }

  const interactivePages = screenSet.type === 'agent' || screenSet.type === 'workpal';
  lightboxThumbnails.replaceChildren(...(interactivePages ? [] : expandedSlides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lightbox-thumb';
    if (slide.type === 'desktop') button.classList.add('desktop-thumb');
    if (slide.type === 'sidebar') button.classList.add('sidebar-thumb');
    button.setAttribute('aria-label', `Show ${slide.label}`);
    button.setAttribute('aria-pressed', String(index === expandedSlideIndex));
    button.addEventListener('click', () => setExpandedSlide(index));
    const preview = document.createElement('img');
    preview.src = slide.files[0];
    preview.alt = '';
    const caption = document.createElement('span');
    caption.textContent = screenSet.type === 'sidebarPair'
      ? (index === 0 ? 'DARK' : 'LIGHT')
      : String(index + 1).padStart(2, '0');
    button.append(preview, caption);
    return button;
  })));
  imageLightbox.classList.toggle('has-multiple', expandedSlides.length > 1);
  document.querySelector('.lightbox-prev').hidden = expandedSlides.length < 2;
  document.querySelector('.lightbox-next').hidden = expandedSlides.length < 2;
  renderExpandedSlide();
  imageLightbox.showModal();
  requestAnimationFrame(() => fitPlannerScreens(imageLightbox));
  fitPhoneScreens(imageLightbox);
  fitDesktopScreens(imageLightbox);
  fitWorkPalScreens(imageLightbox);
}

function openExpandedScreens(device) {
  const screenSet = projectScreens[activeCaseProjectIndex];
  if (!screenSet?.files?.length) return;
  const mobileAirScout = screenSet.type === 'agent' && device.classList.contains('agent-mobile-device');
  const activePage = new URL(device.querySelector('iframe')?.src || location.href).searchParams.get(screenSet.type === 'workpal' ? 'previewPage' : 'preview');
  if (screenSet.type === 'agent') {
    const pages = mobileAirScout ? screenSet.mobileFiles || [] : screenSet.files;
    const type = mobileAirScout ? 'agentMobile' : 'agent';
    expandedSlides = pages.map((page) => ({ type, files: [page], label: `AirScout · ${mobileAirScout ? 'mobile' : 'desktop'} · ${page.replaceAll('-', ' ')}` }));
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === activePage));
  } else if (screenSet.type === 'workpal') {
    expandedSlides = screenSet.files.map((page) => ({ type: 'workpal', files: [page], label: `WorkPal · ${page}` }));
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === activePage));
  } else if (screenSet.type === 'planner') {
    const selectedView = new URL(device.querySelector('iframe')?.src || location.href).searchParams.get('previewView');
    const labels = { timeline: 'Timeline and workload', board: 'Project board', week: 'Weekly plan' };
    expandedSlides = screenSet.files.map((view) => ({ type: 'planner', files: [view], label: labels[view] || 'Project planning view' }));
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === selectedView));
  } else if (screenSet.type === 'sidebarPair') {
    expandedSlides = screenSet.files.map((file, i) => ({ type: 'sidebar', files: [file], label: `Odyssey · ${i === 0 ? 'dark' : 'light'} mode` }));
    const source = device.querySelector('img')?.getAttribute('src');
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === source));
  } else {
    const source = device.querySelector('img')?.getAttribute('src');
    expandedSlides = screenSet.files.map((file, i) => ({ type: screenSet.type, files: [file], label: `Screen ${String(i + 1).padStart(2, '0')} of ${String(screenSet.files.length).padStart(2, '0')}` }));
    expandedSlideIndex = Math.max(0, expandedSlides.findIndex((slide) => slide.files[0] === source));
  }
  lightboxThumbnails.replaceChildren(...(screenSet.type === 'agent' && !mobileAirScout || screenSet.type === 'workpal' ? [] : expandedSlides.map((slide, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lightbox-thumb';
    button.setAttribute('aria-label', `Show ${slide.label}`);
    button.setAttribute('aria-pressed', String(i === expandedSlideIndex));
    button.addEventListener('click', () => setExpandedSlide(i));
    const caption = document.createElement('span');
    caption.textContent = String(i + 1).padStart(2, '0');
    button.append(caption);
    return button;
  })));
  imageLightbox.classList.toggle('has-multiple', expandedSlides.length > 1);
  document.querySelector('.lightbox-prev').hidden = expandedSlides.length < 2;
  document.querySelector('.lightbox-next').hidden = expandedSlides.length < 2;
  renderExpandedSlide();
  imageLightbox.showModal();
  fitPhoneScreens(imageLightbox);
  fitDesktopScreens(imageLightbox);
  fitPlannerScreens(imageLightbox);
  fitAgentScreens(imageLightbox);
  fitAirScoutMobileScreens(imageLightbox);
  fitWorkPalScreens(imageLightbox);
}

window.addEventListener('resize', () => {
  fitAgentScreens();
  fitPlannerScreens();
  fitAirScoutMobileScreens();
  if (caseDialog.open) {
    fitAgentScreens(caseContent);
    fitAirScoutMobileScreens(caseContent);
  }
  if (imageLightbox.open) {
    fitAgentScreens(imageLightbox);
    fitAirScoutMobileScreens(imageLightbox);
  }
});

function expandableDevice(target) {
  return target.closest('.case-feature-screen [role="button"], .case-screen-item [role="button"]');
}

caseContent.addEventListener('click', (event) => {
  const device = expandableDevice(event.target);
  if (device) openExpandedScreens(device);
});

caseContent.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const device = expandableDevice(event.target);
  if (!device) return;
  event.preventDefault();
  openExpandedScreens(device);
});

function returnFromCaseStudy() {
  if (history.state?.portfolioCaseStudyIndex === activeCaseProjectIndex) history.back();
  else caseDialog.close();
}
document.querySelector('.case-close').addEventListener('click', returnFromCaseStudy);
caseDialog.addEventListener('cancel', (event) => { event.preventDefault(); returnFromCaseStudy(); });
caseDialog.addEventListener('click', (event) => {
  if (event.target === caseDialog) returnFromCaseStudy();
});
window.addEventListener('popstate', (event) => {
  const caseIndex = event.state?.portfolioCaseStudyIndex;
  if (Number.isInteger(caseIndex)) {
    openCaseStudy(caseIndex, { fromHistory: true });
    return;
  }
  if (caseDialog.open) {
    caseDialog.close();
    document.title = caseStudyReturnTitle;
    requestAnimationFrame(() => window.scrollTo(0, caseStudyReturnScrollY));
  }
});

document.querySelector('.lightbox-close').addEventListener('click', () => imageLightbox.close());
document.querySelector('.lightbox-prev').addEventListener('click', () => setExpandedSlide(expandedSlideIndex - 1));
document.querySelector('.lightbox-next').addEventListener('click', () => setExpandedSlide(expandedSlideIndex + 1));
imageLightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); setExpandedSlide(expandedSlideIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); setExpandedSlide(expandedSlideIndex + 1); }
});
imageLightbox.addEventListener('click', (event) => {
  if (event.target === imageLightbox) imageLightbox.close();
});

const sectionNavLinks = [...document.querySelectorAll('.topbar nav a[href^="#"]')];
const sectionNavTargets = sectionNavLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean)
  .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
const topbar = document.querySelector('.topbar');
const sectionNav = topbar?.querySelector('nav');
function syncTopbarScrollOffset() {
  if (!topbar) return;
  document.documentElement.style.setProperty('--topbar-height', `${Math.ceil(topbar.getBoundingClientRect().height)}px`);
  if (sectionNav) requestAnimationFrame(updateSectionNavigation);
}
syncTopbarScrollOffset();
if (topbar && 'ResizeObserver' in window) new ResizeObserver(syncTopbarScrollOffset).observe(topbar);
window.addEventListener('resize', syncTopbarScrollOffset, { passive: true });
let sectionNavFrame = 0;
function updateSectionNavigation() {
  sectionNavFrame = 0;
  const headerBottom = topbar?.getBoundingClientRect().bottom || 0;
  // Switch sections as soon as their top reaches the content edge below the sticky header.
  const marker = headerBottom + 18;
  let current = null;
  for (const section of sectionNavTargets) {
    if (section.getBoundingClientRect().top <= marker) current = section;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sectionNavTargets.at(-1) || current;
  }
  sectionNavLinks.forEach((link) => {
    if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const activeLink = sectionNavLinks.find((link) => link.getAttribute('aria-current') === 'location');
  if (sectionNav && activeLink) {
    const navRect = sectionNav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    sectionNav.style.setProperty('--nav-indicator-x', `${linkRect.left - navRect.left}px`);
    sectionNav.style.setProperty('--nav-indicator-width', `${linkRect.width}px`);
    sectionNav.dataset.hasActiveSection = 'true';
  } else if (sectionNav) {
    sectionNav.dataset.hasActiveSection = 'false';
  }
}
function queueSectionNavigationUpdate() {
  if (!sectionNavFrame) sectionNavFrame = requestAnimationFrame(updateSectionNavigation);
}
window.addEventListener('scroll', queueSectionNavigationUpdate, { passive: true });
window.addEventListener('resize', queueSectionNavigationUpdate);
window.addEventListener('hashchange', queueSectionNavigationUpdate);
updateSectionNavigation();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const subject = `Portfolio inquiry from ${data.get('name')}`;
  const body = `${data.get('message')}\n\nFrom: ${data.get('name')} (${data.get('email')})`;
  const mailto = `mailto:thien.ann.nguyen@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
});
