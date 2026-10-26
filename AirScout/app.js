const STORE_KEY = 'airscout-portfolio-flight-agent-v1';
const TODAY = new Date();
const fmtCAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
const defaults = {
  origin: 'Montréal (YUL)', destination: 'Lisbon (LIS)', departDate: '2026-12-07', returnDate: '2026-12-14', flexibleDays: '3', travelers: '1', adults: '1', children: '0', cabin: 'Economy',
  currency: 'CAD', budget: '900', maxStops: '1', maxHours: '14', departWindow: 'Any time', excludedAirlines: '', excludedAirports: '', baggage: '1 checked bag', refundPreference: 'Refundable preferred', monitorUntil: '2026-11-30', permission: 'approval'
};
function freshState() { const now = new Date().toISOString(); return { tripId: `trip-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, screen: 'dashboard', step: 0, settings: { ...defaults }, scenario: 'happy', status: 'Monitoring', log: [], createdAt: now, paused: false, total: 858, seatsRemaining: 4, availabilityAlertEnabled: false, selectedFlightId: null, revisedApproved: false, bookingAttempted: false, bookingCompleted: false, bookingRef: '', cancelSubmitted: false, cancelCompleted: false, editing: false, consent: false, lastCheckAt: now, savedTrips: [], removedTripIds: [] }; }
function sampleTrips() {
  const examples = [
    { sampleId: 'upcoming-trip-1', origin: 'Toronto (YYZ)', destination: 'Vancouver (YVR)', departDate: '2026-11-20', returnDate: '2026-11-25', monitorUntil: '2026-11-15', budget: '2600', travelers: '3', adults: '2', children: '1', trackedAirline: 'Air Canada', trackedStops: 0, trackedConnection: '', trackedNonstop: true, status: 'Monitoring', total: 1926, seatsRemaining: 5 },
    { sampleId: 'upcoming-trip-3', origin: 'Montr\u00e9al (YUL)', destination: 'Calgary (YYC)', departDate: '2027-02-12', returnDate: '2027-02-17', monitorUntil: '2027-02-05', budget: '780', trackedAirline: 'WestJet', trackedStops: 0, trackedConnection: '', trackedNonstop: true, status: 'Paused', paused: true, total: 724, seatsRemaining: 2 },
    { sampleId: 'upcoming-trip-6', origin: 'Montr\u00e9al (YUL)', destination: 'Tokyo (HND)', departDate: '2027-04-15', returnDate: '2027-04-25', monitorUntil: '2027-04-08', budget: '5400', travelers: '3', adults: '2', children: '1', trackedAirline: 'Air Canada', trackedStops: 2, trackedConnection: 'YYZ', trackedConnections: ['YYZ', 'YVR'], trackedNonstop: false, status: 'Monitoring', total: 4278, seatsRemaining: 3 },
    { sampleId: 'upcoming-trip-8', origin: 'Vancouver (YVR)', destination: 'New York (JFK)', departDate: '2027-05-10', returnDate: '2027-05-16', monitorUntil: '2027-05-03', budget: '2550', travelers: '3', adults: '2', children: '1', trackedAirline: 'United Airlines', trackedStops: 1, trackedConnection: 'ORD', trackedNonstop: false, status: 'Monitoring', total: 2226, seatsRemaining: 2 }
  ];
  return examples.map((example, index) => {
    const trip = freshState();
    const { sampleId, status, total, seatsRemaining = 4, paused = false, trackedAirline, trackedStops, trackedConnection, trackedConnections, trackedNonstop, ...settings } = example;
    return { ...trip, tripId: sampleId || `upcoming-trip-${index + 1}`, settings: { ...defaults, ...settings }, trackedAirline, trackedStops, trackedConnection, trackedConnections, trackedNonstop, status, total, seatsRemaining, paused, createdAt: new Date().toISOString(), lastCheckAt: new Date().toISOString(), log: [] };
  });
}
const AIRPORT_NAMES = { YUL: 'Montréal–Trudeau', YYZ: 'Toronto Pearson', YVR: 'Vancouver International', YYC: 'Calgary International', YOW: 'Ottawa International', YHZ: 'Halifax Stanfield', LIS: 'Lisbon Humberto Delgado', KEF: 'Keflavík International', CDG: 'Paris Charles de Gaulle', HND: 'Tokyo Haneda', ORD: 'Chicago O Hare', LHR: 'London Heathrow', JFK: 'New York John F Kennedy' };
const ITINERARY_PRESETS = {
  'YUL-LIS': {
    outbound: [
      { from: 'YUL', to: 'KEF', airline: 'Icelandair', depart: '6:10 a.m.', arrive: '3:20 p.m.', duration: '5h 10m', layover: '2h 25m' },
      { from: 'KEF', to: 'LIS', airline: 'Icelandair', depart: '5:45 p.m.', arrive: '9:15 p.m.', duration: '3h 30m' }
    ],
    returning: [
      { from: 'LIS', to: 'KEF', airline: 'Icelandair', depart: '10:05 a.m.', arrive: '2:25 p.m.', duration: '4h 20m', layover: '1h 55m' },
      { from: 'KEF', to: 'YUL', airline: 'Icelandair', depart: '4:20 p.m.', arrive: '5:55 p.m.', duration: '5h 35m' }
    ]
  },
  'YYZ-YVR': {
    outbound: [{ from: 'YYZ', to: 'YVR', airline: 'Air Canada', depart: '8:15 a.m.', arrive: '10:40 a.m.', duration: '5h 25m' }],
    returning: [{ from: 'YVR', to: 'YYZ', airline: 'Air Canada', depart: '12:10 p.m.', arrive: '7:25 p.m.', duration: '4h 15m' }]
  },
  'YUL-YYC': {
    outbound: [{ from: 'YUL', to: 'YYC', airline: 'WestJet', depart: '8:25 a.m.', arrive: '11:00 a.m.', duration: '4h 35m' }],
    returning: [{ from: 'YYC', to: 'YUL', airline: 'WestJet', depart: '2:25 p.m.', arrive: '7:05 p.m.', duration: '4h 40m' }]
  },
  'YOW-YHZ': {
    outbound: [{ from: 'YOW', to: 'YHZ', airline: 'Porter Airlines', depart: '11:15 a.m.', arrive: '12:40 p.m.', duration: '1h 25m' }],
    returning: [{ from: 'YHZ', to: 'YOW', airline: 'Porter Airlines', depart: '1:30 p.m.', arrive: '2:55 p.m.', duration: '1h 25m' }]
  },
  'YUL-CDG': {
    outbound: [{ from: 'YUL', to: 'CDG', airline: 'Air France', depart: '7:35 p.m.', arrive: '8:25 a.m.', duration: '6h 50m', arriveDayOffset: 1 }],
    returning: [{ from: 'CDG', to: 'YUL', airline: 'Air France', depart: '1:25 p.m.', arrive: '3:45 p.m.', duration: '7h 20m' }]
  },
  'YHZ-LHR': {
    outbound: [
      { from: 'YHZ', to: 'YUL', airline: 'Air Canada', depart: '2:10 p.m.', arrive: '3:45 p.m.', duration: '1h 35m', layover: '2h 25m' },
      { from: 'YUL', to: 'LHR', airline: 'Air Canada', depart: '6:10 p.m.', arrive: '6:20 a.m.', duration: '6h 10m', arriveDayOffset: 1 }
    ],
    returning: [
      { from: 'LHR', to: 'YUL', airline: 'Air Canada', depart: '9:00 a.m.', arrive: '11:15 a.m.', duration: '7h 15m', layover: '2h 05m' },
      { from: 'YUL', to: 'YHZ', airline: 'Air Canada', depart: '1:20 p.m.', arrive: '4:30 p.m.', duration: '3h 10m' }
    ]
  },
  'YVR-JFK': {
    outbound: [
      { from: 'YVR', to: 'ORD', airline: 'United Airlines', depart: '8:20 a.m.', arrive: '2:15 p.m.', duration: '4h 55m', layover: '2h 05m' },
      { from: 'ORD', to: 'JFK', airline: 'United Airlines', depart: '4:20 p.m.', arrive: '7:45 p.m.', duration: '2h 25m' }
    ],
    returning: [
      { from: 'JFK', to: 'ORD', airline: 'United Airlines', depart: '9:15 a.m.', arrive: '11:00 a.m.', duration: '2h 45m', layover: '2h 00m' },
      { from: 'ORD', to: 'YVR', airline: 'United Airlines', depart: '1:00 p.m.', arrive: '3:35 p.m.', duration: '4h 35m' }
    ]
  },
  'YUL-HND': {
    outbound: [
      { from: 'YUL', to: 'YYZ', airline: 'Air Canada', depart: '7:00 a.m.', arrive: '8:25 a.m.', duration: '1h 25m', layover: '2h 20m' },
      { from: 'YYZ', to: 'YVR', airline: 'Air Canada', depart: '10:45 a.m.', arrive: '12:55 p.m.', duration: '5h 10m', layover: '2h 10m' },
      { from: 'YVR', to: 'HND', airline: 'Air Canada', depart: '3:05 p.m.', arrive: '5:25 p.m.', duration: '10h 20m', arriveDayOffset: 1 }
    ],
    returning: [
      { from: 'HND', to: 'YVR', airline: 'Air Canada', depart: '5:10 p.m.', arrive: '9:05 a.m.', duration: '8h 55m', layover: '2h 20m' },
      { from: 'YVR', to: 'YYZ', airline: 'Air Canada', depart: '11:25 a.m.', arrive: '6:55 p.m.', duration: '4h 30m', layover: '2h 10m' },
      { from: 'YYZ', to: 'YUL', airline: 'Air Canada', depart: '9:05 p.m.', arrive: '10:20 p.m.', duration: '1h 15m' }
    ]
  }
};
let state;
try { const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); state = { ...freshState(), ...stored }; const storedSettings = stored.settings || {}; state.settings = { ...defaults, ...storedSettings }; if (!Object.prototype.hasOwnProperty.call(storedSettings, 'adults')) state.settings.adults = String(storedSettings.travelers || '1'); if (!Object.prototype.hasOwnProperty.call(storedSettings, 'children')) state.settings.children = '0'; state.settings.travelers = String((Number(state.settings.adults) || 1) + (Number(state.settings.children) || 0)); if (!Number.isFinite(Number(state.seatsRemaining))) state.seatsRemaining = 4; if (!Array.isArray(state.log)) state.log = []; if (!Array.isArray(state.savedTrips)) state.savedTrips = []; if (!Array.isArray(state.removedTripIds)) state.removedTripIds = []; if (state.screen === 'welcome' && state.createdAt) state.screen = 'dashboard'; } catch { state = freshState(); }
const exampleTrips = sampleTrips();
const exampleTripsById = new Map(exampleTrips.map(trip => [trip.tripId, trip]));
const removedTripIds = new Set(state.removedTripIds);
const availableExamples = exampleTrips.filter(trip => !removedTripIds.has(trip.tripId));
const examplesNeedAirlines = state.savedTrips.some(trip => exampleTripsById.has(trip.tripId) && !removedTripIds.has(trip.tripId) && trip.trackedAirline !== exampleTripsById.get(trip.tripId).trackedAirline);
const examplesNeedSeats = state.savedTrips.some(trip => exampleTripsById.has(trip.tripId) && !removedTripIds.has(trip.tripId) && Number(trip.seatsRemaining) !== Number(exampleTripsById.get(trip.tripId).seatsRemaining));
const examplesNeedPartyData = state.savedTrips.some(trip => { const example = exampleTripsById.get(trip.tripId); return example && !removedTripIds.has(trip.tripId) && (Number(trip.settings?.adults ?? trip.settings?.travelers ?? 1) !== Number(example.settings.adults) || Number(trip.settings?.children || 0) !== Number(example.settings.children) || Number(trip.settings?.budget) !== Number(example.settings.budget) || Number(trip.total) !== Number(example.total)); });
const staleSampleTrips = state.savedTrips.some(trip => /^upcoming-trip-\d+$/.test(trip.tripId) && !exampleTripsById.has(trip.tripId));
if (!state.sampleTripsAdded || state.savedTrips.filter(trip => exampleTripsById.has(trip.tripId) && !removedTripIds.has(trip.tripId)).length < availableExamples.length || examplesNeedAirlines || examplesNeedSeats || examplesNeedPartyData || staleSampleTrips) {
  state.savedTrips = state.savedTrips.filter(trip => !removedTripIds.has(trip.tripId) && (!/^upcoming-trip-\d+$/.test(trip.tripId) || exampleTripsById.has(trip.tripId)));
  state.savedTrips = state.savedTrips.map(trip => {
    const example = exampleTripsById.get(trip.tripId);
    return example ? { ...trip, settings: { ...trip.settings, adults: example.settings.adults, children: example.settings.children, travelers: example.settings.travelers, budget: example.settings.budget }, total: example.total, trackedAirline: example.trackedAirline, trackedStops: example.trackedStops, trackedConnection: example.trackedConnection, trackedConnections: example.trackedConnections, trackedNonstop: example.trackedNonstop, seatsRemaining: example.seatsRemaining } : trip;
  });
  const existingTripIds = new Set(state.savedTrips.map(trip => trip.tripId));
  state.savedTrips.push(...availableExamples.filter(trip => !existingTripIds.has(trip.tripId)));
  state.sampleTripsAdded = true;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* Examples still appear for this session if storage is unavailable. */ }
}
const SAMPLE_FLIGHTS = [
  { id: 'icelandair', airline: 'Icelandair', price: 858, stops: 1, hours: 9.1, connection: 'KEF', depart: '6:10 a.m.', departHour: 6.17, arrive: '9:15 p.m.', arrivalDay: 0, returnDepart: '11:25 a.m.', returnArrive: '1:40 p.m.', returnHours: '7h 15m', nonstop: false, refundable: false, tradeoff: 'The lowest alternative is $46 cheaper, but leaves at 4:55 a.m. and has a 5h 40m connection. This option has a shorter connection and a less extreme departure.' },
  { id: 'play', airline: 'PLAY', price: 812, stops: 1, hours: 10.8, connection: 'KEF', depart: '4:55 a.m.', departHour: 4.92, arrive: '8:42 p.m.', arrivalDay: 0, returnDepart: '9:20 a.m.', returnArrive: '12:10 p.m.', returnHours: '7h 50m', nonstop: false, refundable: false, tradeoff: 'This is the lowest qualifying total. It leaves at 4:55 a.m. and has a 5h 40m connection in Keflavík.' },
  { id: 'air-canada', airline: 'Air Canada', price: 889, stops: 1, hours: 12.2, connection: 'YYZ', depart: '12:40 p.m.', departHour: 12.67, arrive: '10:50 a.m.', arrivalDay: 1, returnDepart: '1:15 p.m.', returnArrive: '5:30 p.m.', returnHours: '9h 15m', nonstop: false, refundable: false, tradeoff: 'This option departs after noon and arrives the following morning, with a longer connection in Toronto.' },
  { id: 'tap', airline: 'TAP Air Portugal', price: 948, stops: 0, hours: 7.1, connection: '', depart: '8:15 p.m.', departHour: 20.25, arrive: '7:20 a.m.', arrivalDay: 1, returnDepart: '5:10 p.m.', returnArrive: '7:35 p.m.', returnHours: '7h 25m', nonstop: true, refundable: false, tradeoff: 'This direct flight avoids a layover but costs more than the current budget.' }
];
function codeFrom(value, fallback) { return /\(([^)]+)\)/.exec(value || '')?.[1]?.trim().toUpperCase() || fallback; }
function cityFrom(value) { return (value || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); }
function partyCounts(settings = state.settings) { const adults = Math.max(1, Number(settings.adults ?? settings.travelers) || 1), children = Math.max(0, Number(settings.children) || 0); return { adults, children, total: adults + children }; }
function partySummary(settings = state.settings) { const { adults, children, total } = partyCounts(settings); return `${adults} adult${adults === 1 ? '' : 's'}${children ? ` + ${children} child${children === 1 ? '' : 'ren'}` : ''} (${total} traveler${total === 1 ? '' : 's'})`; }
function travelerCount() { return partyCounts().total; }
function seatAvailabilitySummary(settings = state.settings) { const count = Math.max(0, Number(state.seatsRemaining) || 0), party = partyCounts(settings); if (!bestFlight()) return `Not verified · ${party.total} traveler${party.total === 1 ? '' : 's'}`; return `${count >= party.total ? 'Enough' : 'Not enough'} · ${count} available for ${party.total} traveler${party.total === 1 ? '' : 's'}`; }
function bagSurcharge() { return state.settings.baggage === '2 checked bags' ? 55 : 0; }
function flightTotal(flight) { return (flight.price + bagSurcharge()) * travelerCount(); }
function excludedList(text) { return (text || '').split(/[,;\n]/).map(x => x.trim().toLowerCase()).filter(Boolean); }
function flightFits(flight) {
  const s = state.settings, excludedAirlines = excludedList(s.excludedAirlines), excludedAirports = excludedList(s.excludedAirports);
  const airportSet = [codeFrom(s.origin, 'YUL'), codeFrom(s.destination, 'LIS'), flight.connection].filter(Boolean).map(x => x.toLowerCase());
  if (flight.stops > Number(s.maxStops) || flight.hours > Number(s.maxHours)) return false;
  if (flightTotal(flight) > Number(s.budget)) return false;
  if (excludedAirlines.some(name => flight.airline.toLowerCase().includes(name))) return false;
  if (excludedAirports.some(name => airportSet.some(code => code.includes(name)))) return false;
  if (s.refundPreference === 'Refundable only' && !flight.refundable) return false;
  return true;
}
function matchingFlights() {
  const eligible = SAMPLE_FLIGHTS.filter(flightFits);
  const window = state.settings.departWindow || 'Any time';
  const preference = window.startsWith('Morning') ? 7 : window.startsWith('Afternoon') ? 14 : window.startsWith('Evening') ? 20 : null;
  return eligible.sort((a, b) => preference === null ? SAMPLE_FLIGHTS.indexOf(a) - SAMPLE_FLIGHTS.indexOf(b) : Math.abs(a.departHour - preference) - Math.abs(b.departHour - preference));
}
function bestFlight() { const matches = matchingFlights(); const flight = matches.find(item => item.id === state.selectedFlightId) || matches[0] || (state.trackedAirline ? SAMPLE_FLIGHTS[0] : null); if (!flight || !state.trackedAirline) return flight; return { ...flight, airline: state.trackedAirline, price: Math.max(0, Number(state.total || 0) / travelerCount() - bagSurcharge()), stops: state.trackedStops ?? flight.stops, connection: state.trackedConnection ?? flight.connection, nonstop: state.trackedNonstop ?? flight.nonstop }; }
if (state.screen === 'welcome') { state.screen = 'dashboard'; state.createdAt ||= new Date().toISOString(); state.status = 'Monitoring'; state.lastCheckAt ||= new Date().toISOString(); }
const app = document.querySelector('#app');
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* Private browsing can disable storage; the current session still works. */ } }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function money(amount) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: state.settings.currency || 'CAD', maximumFractionDigits: 0 }).format(amount); }
function fmtDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) { if (!value) return 'Not set'; const date = new Date(`${value}T12:00:00`); return Number.isNaN(+date) ? value : new Intl.DateTimeFormat('en-CA', opts).format(date); }
function fmtStamp(value = new Date()) { return new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit' }).format(value instanceof Date ? value : new Date(value)); }
function log(title, detail) { state.log.unshift({ title, detail, at: new Date().toISOString() }); state.log = state.log.slice(0, 8); save(); }
function seedActivityHistory() {
  const fares = [944, 932, 938, 918, 928];
  state.log = fares.map((amount, index) => { const at = new Date(); at.setDate(at.getDate() - (fares.length - index - 1)); at.setHours(9 + (index % 3), 12 + index * 7, 0, 0); return { title: 'Fare check', detail: `214 itineraries reviewed; lowest qualifying fare ${money(amount * travelerCount())}.`, at: at.toISOString() }; }).reverse();
}
function sendAvailabilityAlertIfNeeded() {
  if (!state.availabilityAlertEnabled || state.paused) return;
  const flight = bestFlight();
  if (!flight) { state.lastAvailabilityAlertKey = ''; return; }
  const key = `${flight.id}:${selectedTotal()}`;
  if (state.lastAvailabilityAlertKey === key) return;
  state.lastAvailabilityAlertKey = key;
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('A flight matches your trip', { body: `${flight.airline} · ${money(selectedTotal())} total · ${cityFrom(state.settings.origin)} to ${cityFrom(state.settings.destination)}`, icon: './assets/plane.svg', tag: `flight-alert-${state.tripId}` });
      state.availabilityAlertMessage = 'A matching fare is available now. Your browser alert was sent.';
    } else {
      state.availabilityAlertMessage = 'A matching fare is available now. Browser notifications are unavailable.';
    }
  } catch { state.availabilityAlertMessage = 'A matching fare is available now. Check this trip while AirScout is open.'; }
  save();
}
async function toggleFlightAlerts() {
  if (state.availabilityAlertEnabled) {
    state.availabilityAlertEnabled = false;
    state.lastAvailabilityAlertKey = '';
    state.availabilityAlertMessage = 'Fare alerts are off.';
    save(); render(); return;
  }
  if (!('Notification' in window)) {
    state.availabilityAlertMessage = 'This browser does not support browser notifications.';
    save(); render(); return;
  }
  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    state.availabilityAlertMessage = 'Allow browser notifications in site settings to turn fare alerts on.';
    save(); render(); return;
  }
  state.availabilityAlertEnabled = true;
  state.lastAvailabilityAlertKey = '';
  state.availabilityAlertMessage = 'Fare alerts are on for this trip.';
  save(); render();
}
function notify() { /* Status changes render inline in the current view. */ }
function setScreen(screen) { state.screen = screen; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); app.focus({ preventScroll: true }); }
function pill(label, tone = '') { return `<span class="status-pill ${tone}">${esc(label)}</span>`; }
function button(label, action, kind = 'primary-button', attrs = '') { return `<button class="${kind}" data-action="${action}" ${attrs}>${label}</button>`; }
function headerTitle(eyebrow, title, lead = '') { return `<div class="eyebrow">${eyebrow}</div><h2>${title}</h2>${lead ? `<p class="subtle">${lead}</p>` : ''}`; }
function tripRoute() { return `<div class="route-display"><div class="route-end"><b>YUL</b><span>Montréal</span></div><div class="route-plane" aria-hidden="true">✈</div><div class="route-end" style="text-align:right"><b>LIS</b><span>Lisbon</span></div></div>`; }
function welcomeView() {
  return `<section class="view welcome"><div class="welcome-copy"><div class="eyebrow">A clearer way to book</div><h1>Give your trip a plan.<br /><span>Keep the final say.</span></h1><p class="lead">Set your travel rules once. AirScout watches fares, explains the trade-offs, and asks before booking unless you explicitly authorize it to act within your limits.</p><div class="button-row">${button('Set up my trip <span aria-hidden="true">→</span>', 'begin')}${button('View my trip', 'trip-dashboard', 'secondary-button')}</div><div class="trust-row"><div class="trust-item"><span class="trust-icon">✓</span><span><b>Your limits, your call</b><br />Clear approval boundaries</span></div><div class="trust-item"><span class="trust-icon">↗</span><span><b>Reasons with every fare</b><br />Facts separated from forecasts</span></div><div class="trust-item"><span class="trust-icon">Ⅱ</span><span><b>Pause at any time</b><br />Change or revoke permission</span></div></div></div><div class="welcome-panel"><div class="panel-topline"><strong>Your trip</strong>${pill('Approval required')}</div>${tripRoute()}<div class="preview-total"><div><span>Round trip · taxes and one checked bag</span><br /><b>${money(858)}</b></div><span>of ${money(Number(state.settings.budget))}</span></div><div class="preview-items"><span class="mini-tag">Dec 7–14, 2026</span><span class="mini-tag">1 traveler</span><span class="mini-tag">Economy</span><span class="mini-tag">Max 1 layover</span></div><div class="permission-note"><span class="permission-mark">✓</span><p><b>Booking permission not granted.</b> You’ll review the exact fare, total, and rules before any  booking step.</p></div></div></section>`;
}
function setupStepper() { const labels = ['Trip details', 'Limits', 'Permission']; return `<ol class="stepper" aria-label="Trip setup progress">${labels.map((label, i) => `<li class="${state.step === i ? 'current' : i < state.step ? 'done' : ''}"><span class="step-num">${i < state.step ? '✓' : i + 1}</span>${label}</li>`).join('')}</ol>`; }
function field(label, name, value, type = 'text', hint = '', attrs = '') { return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${attrs}/>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`; }
function selectField(label, name, value, options, hint = '') { return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(v => `<option ${v === value ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`; }
function setupAside() {
  const s = state.settings;
  return `<aside class="setup-aside"><section class="surface"><div class="small-label">Trip at a glance</div><div class="aside-price">${esc(s.origin.split('(')[1]?.replace(')', '') || 'YUL')} <span style="color:var(--green)">→</span> ${esc(s.destination.split('(')[1]?.replace(')', '') || 'LIS')}</div><p class="subtle" style="font-size:11px;margin:0">${fmtDate(s.departDate)} – ${fmtDate(s.returnDate)} · ${esc(partySummary(s))}</p><ul class="aside-list"><li><span>Hard limit · total</span><b>${money(Number(s.budget) || 0)}</b></li><li><span>Hard limit · layovers</span><b>${esc(s.maxStops)}</b></li><li><span>Includes</span><b>${esc(s.baggage)}</b></li><li><span>Check until</span><b>${fmtDate(s.monitorUntil)}</b></li></ul><div class="permission-note"><span class="permission-mark">i</span><p>Prices, airlines, and flight details can change before purchase.</p></div></section></aside>`;
}
function tripStep() {
  const s = state.settings;
  return `<section class="surface"><h3>Where are you going?</h3><p class="subtle">Choose the trip details the agent will use to search.</p><div class="form-grid"><div class="field"><label for="origin">From</label><input id="origin" name="origin" value="${esc(s.origin)}" required autocomplete="off" /></div><div class="field"><label for="destination">To</label><input id="destination" name="destination" value="${esc(s.destination)}" required autocomplete="off" /></div>${field('Depart', 'departDate', s.departDate, 'date', '', 'required')}${field('Return', 'returnDate', s.returnDate, 'date', '', 'required')}${selectField('Date flexibility', 'flexibleDays', `${s.flexibleDays} days`, ['0', '1', '2', '3', '5', '7'].map(x => `${x} days`))}${selectField('Adults', 'adults', s.adults, ['1', '2', '3', '4', '5', '6'])}${selectField('Children', 'children', s.children, ['0', '1', '2', '3', '4', '5'])}${selectField('Cabin', 'cabin', s.cabin, ['Economy', 'Premium economy', 'Business', 'First'])}</div><div class="form-actions"><span class="subtle" style="font-size:10px">Round trip · enter the adults and children in your party.</span>${button('Continue <span aria-hidden="true">→</span>', 'setup-next')}</div><p class="setup-error" aria-live="polite"></p></section>`;
}
function limitsStep() {
  const s = state.settings;
  return `<section class="surface"><h3>Set the agent’s limits</h3><p class="subtle">Hard limits block a booking. Preferences help rank fares and can be adjusted.</p><div class="limit-caption"><i></i>Hard limit <i class="pref"></i>Preference</div><form id="limits-form"><div class="form-section"><h4 class="group-title">Price and itinerary · hard limits</h4><div class="form-grid">${field('Maximum total', 'budget', s.budget, 'number', 'Includes taxes and your selected checked bag.', 'min="1" step="1" required')}${selectField('Currency', 'currency', s.currency, ['CAD', 'USD', 'EUR'])}${selectField('Maximum layovers', 'maxStops', s.maxStops, ['0', '1', '2'].map(n => n === '0' ? '0 · nonstop' : n))}${selectField('Maximum journey time', 'maxHours', `${s.maxHours} hours`, ['10', '12', '14', '16', '20'].map(n => `${n} hours`))}</div></div><div class="form-section"><h4 class="group-title">Excluded airlines and airports · hard limits</h4><div class="form-grid">${field('Exclude airlines', 'excludedAirlines', s.excludedAirlines, 'text', 'Optional · comma separated. Any match blocks the fare.')}${field('Exclude airports', 'excludedAirports', s.excludedAirports, 'text', 'Optional · comma separated. Any match blocks the fare.')}</div></div><div class="form-section"><h4 class="group-title">Preferences and included baggage</h4><div class="form-grid">${selectField('Departure time', 'departWindow', s.departWindow, ['Any time', 'Morning · 6 a.m.–noon', 'Afternoon · noon–6 p.m.', 'Evening · after 6 p.m.'])}${selectField('Baggage included in total', 'baggage', s.baggage, ['Personal item only', 'Carry-on bag', '1 checked bag', '2 checked bags'])}${selectField('Refundability', 'refundPreference', s.refundPreference, ['No preference', 'Refundable preferred', 'Refundable only'])}<div class="field full seat-preference"><b>Seat availability</b><span>Require enough seats at this fare for ${esc(partySummary(s))}.</span><small>The agent pauses booking if a source reports fewer seats than your party needs.</small></div></div></div><div class="form-section"><h4 class="group-title">Monitoring window</h4><div class="form-grid">${field('Stop searching after', 'monitorUntil', s.monitorUntil, 'date', 'If no fare fits by this date, monitoring stops and no booking is made.', 'required')}</div></div><div class="form-actions"><button class="secondary-button" type="button" data-action="setup-back">Back</button><button class="primary-button" type="button" data-action="setup-next">Review permission <span aria-hidden="true">→</span></button></div><p class="setup-error" aria-live="polite"></p></form></section>`;
}
function permissionStep() {
  const s = state.settings;
  const agreement = `You authorize one round-trip booking for ${partySummary(s)}, up to ${money(Number(s.budget))} total, with no more than ${s.maxStops} layover${s.maxStops === '1' ? '' : 's'}, including taxes and ${s.baggage}, with enough seats at the fare for ${partySummary(s)}.`;
  return `<section class="surface"><h3>Choose what the agent may do</h3><p class="subtle">Approval before booking is the default. Automatic booking needs an explicit choice.</p><div class="choice-row"><label class="choice-card ${s.permission === 'approval' ? 'selected' : ''}"><input type="radio" name="permission" value="approval" ${s.permission === 'approval' ? 'checked' : ''}/><span><strong>Find options and ask before booking</strong><small>The agent can monitor and recommend. You approve every booking.</small></span></label><label class="choice-card ${s.permission === 'automatic' ? 'selected' : ''}"><input type="radio" name="permission" value="automatic" ${s.permission === 'automatic' ? 'checked' : ''}/><span><strong>Book automatically when all my conditions are met</strong><small>One round trip only, within the exact hard limits below. Any unclear or changed condition stops the booking.</small></span></label></div><div class="form-grid" style="margin-top:18px">${field('Monitoring ends', 'monitorUntil', s.monitorUntil, 'date', 'No qualifying fare by this date? The agent stops and tells you. No limits are expanded.', 'required')}</div><div class="review-agreement"><div class="eyebrow">Review your authorization</div><p>“<b>${esc(agreement)}</b> The agent will stop if the fare changes beyond these limits, an excluded airline or airport appears, or required baggage or refund terms cannot be verified. Monitoring ends ${fmtDate(s.monitorUntil)}.”</p><p style="margin-top:8px">Departure time and refundability preference are used to rank options. The agent will show any trade-off before a booking.</p></div><label class="checkline"><input type="checkbox" name="consent" ${state.consent ? 'checked' : ''}/><span>I understand these limits and authorize monitoring of this trip.</span></label><div class="form-actions"><button class="secondary-button" type="button" data-action="setup-back">Back</button><button class="primary-button" type="button" data-action="start-monitoring">${state.editing ? 'Save trip limits' : 'Start monitoring'}</button></div><p class="setup-error" aria-live="polite"></p></section>`;
}
function setupView() {
  const edit = state.editing;
  const steps = edit ? '' : setupStepper();
  const heading = state.step === 0 ? ['01 · Trip', 'Start with the trip', 'Tell us what you want to book. You can change any of these details later.'] : state.step === 1 ? ['02 · Guardrails', 'Choose your boundaries', 'Hard limits prevent the agent from booking outside your rules.'] : ['03 · Permission', 'Review what you’re authorizing', 'Choose the permission level and read the exact booking conditions.'];
  return `<section class="view"><div class="section-heading"><div>${headerTitle(heading[0], heading[1], heading[2])}</div>${edit ? pill('Editing trip limits') : ''}</div>${steps}<div class="setup-layout"><div>${state.step === 0 ? tripStep() : state.step === 1 ? limitsStep() : permissionStep()}</div>${setupAside()}</div></section>`;
}
function revisedFare() { return selectedTotal() + 26; }
function scenarioView() {
  const budget = Number(state.settings.budget) || 900, current = selectedTotal(), revised = current + 26;
  if (!bestFlight() && ['fare-gone', 'price-increase', 'over-budget'].includes(state.scenario)) state.scenario = 'no-options';
  if (state.scenario === 'price-increase' && revised > budget) state.scenario = 'over-budget';
  const sc = state.scenario, over = budget + 24;
  let d = { tone: 'warn', mark: '!', title: 'The fare disappeared', text: 'The selected fare was no longer available when it was checked again. No booking was made.', charge: 'No charge', paused: 'Booking stopped; monitoring is paused for this fare.', next: 'Keep watching for another option, or change a limit if your needs have changed.', primary: 'Resume monitoring', primaryAction: 'recover-watch', secondary: 'Adjust limits', secondaryAction: 'edit-limits' };
  if (sc === 'price-increase') d = { tone: 'warn', mark: '↗', title: `The fare increased by ${money(revised - current)} to ${money(revised)}`, text: `The revised total is ${money(Math.abs(revised - budget))} ${revised > budget ? 'above' : 'below'} your ${money(budget)} hard budget and still meets the saved layover limit.`, charge: 'No charge', paused: state.settings.permission === 'automatic' ? 'Revalidation paused until the revised fare is checked against the saved conditions.' : 'Booking is paused until you approve the revised total.', next: state.settings.permission === 'automatic' ? `Your automatic permission covers this revised fare because it stays within the ${money(budget)} cap. Verify again before the booking.` : 'This changed total needs your approval. You can accept the revised fare or keep monitoring.', primary: state.settings.permission === 'automatic' ? `Continue authorized booking at ${money(revised)}` : `Approve revised ${money(revised)} fare`, primaryAction: state.settings.permission === 'automatic' ? 'auto-reprice' : 'approve-reprice', secondary: 'Keep watching', secondaryAction: 'recover-watch' };
  if (sc === 'over-budget') d = { tone: 'error', mark: '×', title: 'The fare is over your budget', text: `The rechecked total is ${money(over)}, which is ${money(over - budget)} above your ${money(budget)} hard limit. The agent did not book it.`, charge: 'No charge', paused: 'Automatic booking is blocked. Your budget was not expanded.', next: 'Raise the budget yourself, or keep searching under the current limit.', primary: 'Review budget limit', primaryAction: 'edit-limits', secondary: 'Keep current limits', secondaryAction: 'recover-watch' };
  if (sc === 'no-options') d = { tone: 'warn', mark: '⌕', title: 'No flights meet every hard limit', text: `The search found no fare under ${money(budget)} total with the selected layover, journey time, excluded airline and airport, baggage, and refund conditions.`, charge: 'No charge', paused: 'Searching has paused. No condition was relaxed.', next: 'You can keep the rules as they are, or choose which limit or preference to adjust.', primary: 'Review trip limits', primaryAction: 'edit-limits', secondary: 'Leave monitoring paused', secondaryAction: 'pause-dashboard' };
  if (sc === 'unknown-terms') d = { tone: 'warn', mark: '?', title: 'A required fare detail could not be verified', text: 'The baggage or refund condition is unclear for this available fare. The agent will not guess or mark it as included.', charge: 'No charge', paused: state.settings.permission === 'automatic' ? 'Automatic booking is blocked, even though the price is within budget.' : 'Booking is paused until the baggage and fare terms can be verified.', next: 'Keep watching for verified terms, or change your baggage or refund preferences. Approval does not turn an unknown fact into a verified one.', primary: 'Keep watching for verified terms', primaryAction: 'recover-watch', secondary: 'Review baggage preferences', secondaryAction: 'edit-limits' };
  if (sc === 'insufficient-seats') d = { tone: 'warn', mark: '!', title: 'Not enough seats remain at this fare', text: `The airline source reported ${Math.max(0, Number(state.seatsRemaining) || 0)} seats at this fare, but your group needs ${partySummary()}. The agent stopped before booking.`, charge: 'No charge', paused: 'Booking is paused. The agent did not split your group or substitute another fare.', next: 'Keep monitoring for enough seats, or review the traveler count for this trip.', primary: 'Keep monitoring', primaryAction: 'recover-watch', secondary: 'Review travelers', secondaryAction: 'edit-travelers' };
  if (sc === 'timeout') d = { tone: 'warn', mark: '…', title: 'Booking confirmation is uncertain', text: 'The  booking request timed out before confirmation returned. the booking status is still being checked, so no charge has been made.', charge: 'Booking status: unknown · real charge: none', paused: 'A second attempt is locked until this booking status is checked.', next: 'Verify the booking status before doing anything else. This prevents a duplicate attempt.', primary: 'Check booking status', primaryAction: 'verify-booking', secondary: 'Return to trip after checking', secondaryAction: 'dashboard' };
  if (sc === 'fare-gone') d = { tone: 'warn', mark: '!', title: 'The fare disappeared', text: 'The selected fare was no longer available when it was checked again. No booking was made.', charge: 'No charge', paused: 'Booking stopped; monitoring is paused for this fare.', next: 'Keep watching under the same limits, or change a limit yourself.', primary: 'Resume monitoring', primaryAction: 'recover-watch', secondary: 'Adjust limits', secondaryAction: 'edit-limits' };
  if (sc === 'cancel-failed') d = { tone: 'error', mark: '!', title: 'Cancellation is not confirmed', text: 'The cancellation request did not receive a confirmation. The ticket remains active until status is verified.', charge: 'No new charge · refund not issued', paused: 'A second cancellation request is paused while this result is checked.', next: 'Check the cancellation result again or return to the ticket. Do not treat the ticket as cancelled yet.', primary: 'Check cancellation again', primaryAction: 'verify-cancel', secondary: 'View ticket status', secondaryAction: 'show-ticket' };
  return `<section class="view"><div class="big-state scenario-view"><div class="eyebrow">Update ? · ${esc(sc.replaceAll('-', ' '))}</div><span class="state-symbol ${d.tone}">${d.mark}</span><h1>${esc(d.title)}</h1><p class="lead">${esc(d.text)}</p><div class="state-detail"><article><span>Money</span><b>${esc(d.charge)}</b><p>The booking is paused until you approve or update your settings.</p></article><article><span>What the agent paused</span><b>${esc(d.paused)}</b></article><article><span>Next step</span><b>${esc(d.next)}</b></article></div><div class="state-actions">${button(esc(d.primary), d.primaryAction)}${button(esc(d.secondary), d.secondaryAction, 'secondary-button')}</div><div class="scenario-context">Your saved permission is <b>${esc(permissionName())}</b>. Hard limits are never increased silently. The selected scenario can be changed from the “Explore” menu at the top of the page.</div></div></section>`;
}
function priceHistory() {
  const values = [944, 932, 938, 918, 928];
  const max = Math.max(...values);
  return `<div class="chart" aria-label="Observed prices during the last five days">${values.map((value, i) => { const date = new Date(TODAY); date.setDate(date.getDate() - (values.length - i - 1)); const label = new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(date); return `<div class="chart-column ${i === values.length - 1 ? 'today' : ''}" title="Observed fare ${money(value)} on ${label}"><em>${money(value)}</em><span class="bar" style="height:${Math.round(value / max * 70)}px"></span><small>${label}</small></div>`; }).join('')}</div>`;
}
function timeline() {
  const items = state.log.length ? state.log : [
    { title: 'Monitoring is ready', detail: 'Start a trip to create a persistent activity timeline.', at: new Date().toISOString() },
    { title: 'No booking permission yet', detail: 'The trip is approval-first.', at: new Date().toISOString() }
  ];
  return `<div class="timeline">${items.slice(0, 5).map(item => `<div class="timeline-item"><i class="timeline-dot"></i><div><b>${esc(item.title)}</b><p>${esc(item.detail)}</p><time>${fmtStamp(item.at)}</time></div></div>`).join('')}</div>`;
}
function sourceTimestamp(value) { return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto', timeZoneName: 'short' }).format(value); }
function seatSourceTimestamp() { const checkedAt = state.lastCheckAt ? new Date(state.lastCheckAt) : new Date(); return new Date(checkedAt.getTime() - 60_000); }
function sourceChecksView() {
  const flight = bestFlight(), airline = flight?.airline || state.trackedAirline || 'Airline website';
  const airlineSites = { 'Air Canada': ['Air Canada', 'https://www.aircanada.com'], Icelandair: ['Icelandair', 'https://www.icelandair.com'], WestJet: ['WestJet', 'https://www.westjet.com'], 'Porter Airlines': ['Porter Airlines', 'https://www.flyporter.com'], 'Air France': ['Air France', 'https://www.airfrance.com'], 'United Airlines': ['United Airlines', 'https://www.united.com'], 'TAP Air Portugal': ['TAP Air Portugal', 'https://www.flytap.com'], PLAY: ['PLAY', 'https://www.flyplay.com'] };
  const carrier = airlineSites[airline] || [airline, `https://www.google.com/search?q=${encodeURIComponent(airline)}`];
  const checkedAt = state.lastCheckAt ? new Date(state.lastCheckAt) : new Date();
  const carrierCheckedAt = seatSourceTimestamp();
  const seatsLeft = Math.max(0, Number(state.seatsRemaining) || 0), party = partyCounts(), enoughSeats = seatsLeft >= party.total;
  const records = [
    { name: 'Google Flights', url: 'https://www.google.com/travel/flights', detail: 'Fare listing, schedule, and itinerary', retrieved: checkedAt, result: flight ? `${money(selectedTotal())} total · taxes and selected baggage` : 'No qualifying itinerary in this check' },
    { name: carrier[0], url: carrier[1], detail: 'Airline fare, baggage, and refund conditions', retrieved: carrierCheckedAt, result: flight ? `${esc(flight.airline)} fare conditions recorded` : 'Fare conditions not available for this check' }
  ];
  return `<section class="surface source-checks"><div class="section-title-row"><div><div class="small-label">Fare research</div><h3 style="margin-top:5px">Search history</h3></div><span class="micro-copy">Times shown in Toronto time</span></div><div class="source-check-list">${records.map(source => `<article class="source-check-item"><div class="source-check-site"><b><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)} <span aria-hidden="true">↗</span></a></b><small>${esc(source.detail)}</small></div><div class="source-check-result"><b>${source.result}</b><small>Retrieved ${esc(sourceTimestamp(source.retrieved))}</small></div></article>`).join('')}</div><div role="status" aria-live="polite" class="seat-availability ${enoughSeats ? 'seats-sufficient' : 'seats-insufficient'}"><span class="seat-count"><b>${flight ? `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left at this fare` : 'Seat count unavailable'}</b><small>${esc(carrier[0])} inventory · retrieved ${esc(sourceTimestamp(carrierCheckedAt))}</small></span><span class="seat-party"><b>${flight ? enoughSeats ? 'Enough seats for everyone' : 'Not enough seats for this group' : 'Availability could not be confirmed'}</b><small>${flight ? enoughSeats ? `${esc(partySummary())} can travel on this fare.` : `${esc(partySummary())} needs ${party.total} seats; only ${seatsLeft} remain at this fare.` : 'The agent will wait for a verifiable seat count before booking.'}</small></span></div></section>`;
}
function permissionName() { return state.settings.permission === 'automatic' ? 'Automatic · within stated limits' : 'Approval before booking'; }
function legacyDashboardView() {
  const s = state.settings;
  const status = state.paused ? 'Paused' : state.status;
  const total = state.total || 858;
  const limit = Number(s.budget) || 900;
  const delta = Math.max(0, limit - total);
  const targetDate = new Date(`${s.monitorUntil}T23:59:00`);
  const ended = !Number.isNaN(+targetDate) && targetDate < TODAY;
  return `<section class="view"><div class="dashboard-top"><div><div class="eyebrow">Your delegated trip</div><h1>${esc(s.origin.split('(')[0].trim())} <span style="color:var(--green)">→</span> ${esc(s.destination.split('(')[0].trim())}</h1><p class="lead">${fmtDate(s.departDate)}–${fmtDate(s.returnDate)} · ${esc(partySummary(s))} · ${esc(s.cabin)}</p></div><div class="status-block">${pill(ended ? 'Monitoring ended' : status, state.paused ? 'paused' : '')}<small>Last checked ${esc(state.lastCheckAt ? fmtStamp(state.lastCheckAt) : 'not yet')}</small></div></div><div class="summary-strip"><div class="summary-cell"><span>HARD LIMIT · TOTAL</span><b>${money(limit)} ${esc(s.currency)}</b></div><div class="summary-cell"><span>BOOKING PERMISSION</span><b>${esc(permissionName())}</b></div><div class="summary-cell"><span>MAX LAYOVERS</span><b>${esc(s.maxStops)}</b></div><div class="summary-cell"><span>MONITOR UNTIL</span><b>${fmtDate(s.monitorUntil)}</b></div></div>${followedFlights}<div class="dashboard-grid"><div class="dashboard-main"><section class="surface"><div class="section-title-row"><div><div class="small-label">Best qualifying option</div><div class="current-price"><strong>${money(total)}</strong><span>round trip · all-in estimate</span></div></div><span class="status-pill">Fits your hard limits</span></div><div class="flight-line"><div class="flight-time"><b>6:10 a.m.</b><span>YUL · Mon, Dec 7</span></div><div class="flight-mid">9h 05m · 1 stop<div class="dash"></div>Via KEF</div><div class="flight-time"><b>9:15 p.m.</b><span>LIS · Mon, Dec 7</span></div></div><div class="flight-details"><span>✦ Icelandair · available fare</span><span>1 checked bag included</span><span>Economy · standard</span></div><div class="fit-grid"><div class="fit-item"><i>✓</i><span>${money(total)} total stays ${money(delta)} below your budget.</span></div><div class="fit-item"><i>✓</i><span>One layover, within your maximum.</span></div><div class="fit-item"><i>✓</i><span>Taxes and selected checked bag included.</span></div><div class="fit-item"><i>✓</i><span>Departure matches your “any time” preference.</span></div></div><div class="form-actions"><span class="micro-copy">available fare · checked ${esc(state.lastCheckAt ? fmtStamp(state.lastCheckAt) : 'just now')}</span>${button('Review recommendation <span aria-hidden="true">→</span>', 'decision')}</div></section><section class="surface"><div class="section-title-row"><div><div class="small-label">Price history</div><h3 style="margin-top:5px">Observed fares · last 5 days</h3></div><span class="micro-copy">CAD · taxes + bag included</span></div>${priceHistory()}<div class="chart-callout"><b>Observed fact:</b> This fare is $74 below the five-day average we observed ($932) and $${delta} below your limit. <b>Forecast:</b> Prices could rise or fall; this history can’t predict the next fare.</div></section><section class="surface"><div class="section-title-row"><h3>Agent activity</h3><span class="micro-copy">Saved on this device</span></div>${timeline()}</section></div><aside class="dashboard-side"><section class="surface"><div class="section-title-row"><h3>Permission</h3></div><div class="permission-box"><b>${esc(permissionName())}</b><p>${s.permission === 'automatic' ? `May book one round trip up to ${money(limit)} total if every hard limit and fare condition is verified. Any changed or unknown condition stops the booking.` : 'Can monitor and recommend. It must wait for your approval before any booking step.'}</p></div><div class="permission-tools"><button data-action="edit-limits">Edit limits</button>${monitoringToggleMarkup(state.tripId, state.paused, cityFrom(s.destination))}${s.permission === 'automatic' ? '<button class="revoke" data-action="revoke">Revoke booking permission</button>' : ''}</div></section><section class="surface"><div class="section-title-row"><h3>Trip snapshot</h3><span class="micro-copy">Round trip</span></div><ul class="aside-list"><li><span>Traveler</span><b>${esc(partySummary(s))}</b></li><li><span>Cabin</span><b>${esc(s.cabin)}</b></li><li><span>Layovers</span><b>Up to ${esc(s.maxStops)}</b></li><li><span>Baggage</span><b>${esc(s.baggage)}</b></li><li><span>Refund preference</span><b>${esc(s.refundPreference)}</b></li></ul></section><section class="surface"><div class="section-title-row"><h3>Monitoring status</h3></div><div class="permission-box"><b>${state.paused ? 'Checks are paused' : ended ? 'Monitoring window ended' : 'Monitoring is active'}</b><p>${state.paused ? 'No fare checks or booking actions will run until you resume.' : ended ? 'No further checks will run. You can set a new end date if you want to continue.' : `The agent stops on ${fmtDate(s.monitorUntil)} if no fare qualifies. It will not relax your limits.`}</p></div></section></aside></div></section>`;
}
function decisionView() {
  const total = state.total || 858;
  return `<section class="view"><div class="section-heading"><div>${headerTitle('Flight recommendation', 'A fare that fits your rules', 'Compare the total, itinerary, and Fare conditions before choosing what happens next.')}</div>${button('Back to trip', 'dashboard', 'secondary-button')}</div><div class="decision-layout"><div><section class="surface"><div class="recommendation-banner"><span class="icon">✓</span><p><b>Book now or wait?</b> This fare is $74 below the average we observed over the last five days. It meets your budget and layover limits, but departs at 6:10 a.m. Prices may still fall or rise. We can’t predict the next fare.</p></div><div class="section-title-row"><div><div class="small-label">Recommended · best balance</div><h3 style="margin:4px 0 0">Icelandair · Economy Standard</h3></div><span class="status-pill">${money(total)} total</span></div><div class="decision-route"><div class="flight-time"><b>6:10 a.m.</b><div class="airport-name">Montréal · YUL<br />Mon, Dec 7, 2026</div></div><div class="route-center">9h 05m · 1 stop<div></div>KEF · 1h 20m</div><div class="flight-time"><b>9:15 p.m.</b><div class="airport-name">Lisbon · LIS<br />Mon, Dec 7, 2026</div></div></div><div class="trip-dates"><b>Return · Mon, Dec 14</b><span>LIS 11:25 a.m. → YUL 1:40 p.m. · 7h 15m nonstop</span></div><div class="fare-breakdown"><div class="fare-row"><span>Base fare · round trip</span><b>${money(total - 147)}</b></div><div class="fare-row"><span>Taxes and airport fees</span><b>${money(92)}</b></div><div class="fare-row"><span>One checked bag</span><b>${money(55)}</b></div><div class="fare-row total"><span>Total · CAD</span><b>${money(total)}</b></div></div><div class="form-section"><h4 class="group-title">Fare conditions</h4><ul class="condition-list"><li><i>✓</i><span>One checked bag is included in the total shown above.</span></li><li><i>✓</i><span>Ticket changes allowed before departure; fare difference may apply.</span></li><li><i>!</i><span>Cancellation fee is ${money(150)} before Nov 30, 2026 at 5:00 p.m. Toronto time. After that, only ${money(92)} in taxes is refundable under this available fare.</span></li></ul></div><div class="tradeoff"><b>Trade-off:</b> The lowest alternative is ${money(46)} cheaper, but leaves at 4:55 a.m. and has a 5h 40m connection. This option has a shorter connection and a less extreme departure.</div></section><section class="surface"><div class="section-title-row"><h3>Why this fits</h3><span class="micro-copy">Rules checked against the fare</span></div><div class="fit-grid"><div class="fit-item"><i>✓</i><span>${money(total)} is below your ${money(Number(state.settings.budget))} hard budget.</span></div><div class="fit-item"><i>✓</i><span>One layover is within your maximum.</span></div><div class="fit-item"><i>✓</i><span>Checked bag is included in the displayed total.</span></div><div class="fit-item"><i>✓</i><span>Airline and airports are not on your exclusion list.</span></div></div></section></div><aside><section class="surface"><div class="section-title-row"><h3>Two alternatives</h3><span class="micro-copy">Same dates · available fares</span></div><div class="alternatives"><div class="alternative"><div><b>Lowest total · PLAY</b><span>4:55 a.m. departure · 1 stop · long connection</span></div><strong>${money(812)}</strong></div><div class="alternative"><div><b>Latest arrival · Air Canada</b><span>12:40 p.m. departure · 1 stop · 12h 10m</span></div><strong>${money(889)}</strong></div></div><p class="micro-copy" style="margin:14px 0 0">Alternatives prices and availability can change.</p></section><section class="surface"><div class="section-title-row"><h3>Observed facts vs. forecast</h3></div><div class="facts-forecast"><div><span>Observed</span><p>${money(932)} average across five saved fare checks. Current fare is ${money(total)}.</p></div><div><span>Uncertain</span><p>Future prices may rise or fall. No price movement is guaranteed.</p></div></div></section><section class="surface"><div class="section-title-row"><h3>Booking boundary</h3></div><div class="permission-detail"><b>${esc(permissionName())}.</b> ${state.settings.permission === 'automatic' ? 'This fare matches your saved authorization. If any hard limit or required condition changes, the agent stops and asks you.' : 'No booking begins until you approve this exact itinerary and total.'} You can pause or change the limits at any time.</div><div class="button-row" style="margin-top:14px;flex-direction:column;align-items:stretch">${button(state.settings.permission === 'automatic' ? 'Review authorized booking' : 'Approve this booking', 'review-booking')}${button('Keep watching this fare', 'keep-watching', 'secondary-button')}${button('Adjust preferences', 'edit-limits', 'quiet-button')}</div></section></aside></div></section>`;
}
function bookingReviewView() {
  const total = state.total || 858;
  return `<section class="view"><div class="booking-card"><div class="section-heading"><div>${headerTitle('Before booking', 'Review this exact itinerary', 'The fare and every hard limit are checked again here. We recheck the fare and every hard limit before booking.')}</div>${pill(state.settings.permission === 'automatic' ? 'Within saved authorization' : 'Your approval required')}</div><section class="surface"><div class="section-title-row"><div><div class="small-label">Icelandair · Economy Standard · round trip</div><h3 style="margin:5px 0 0">Montréal YUL ↔ Lisbon LIS</h3></div><span class="micro-copy">1 traveler</span></div><div class="ticket-leg"><div class="flight-time"><b>6:10 a.m.</b><span>Dec 7 · YUL</span></div><div class="flight-mid">9h 05m · 1 stop<div class="dash"></div>KEF · 1h 20m</div><div class="flight-time"><b>9:15 p.m.</b><span>Dec 7 · LIS</span></div></div><div class="ticket-leg"><div class="flight-time"><b>11:25 a.m.</b><span>Dec 14 · LIS</span></div><div class="flight-mid">7h 15m · nonstop<div class="dash"></div>YUL</div><div class="flight-time"><b>1:40 p.m.</b><span>Dec 14 · YUL</span></div></div><div class="traveler-summary"><div><span>Traveler</span><b>1 adult · name not collected</b></div><div><span>Cabin</span><b>${esc(state.settings.cabin)}</b></div><div><span>Baggage</span><b>${esc(state.settings.baggage)} · included</b></div></div><div class="seat-review"><b>Seat availability rechecked</b><span>${Math.max(0, Number(state.seatsRemaining) || 0)} seats remain at this fare; enough for ${esc(partySummary(s))}. Retrieved ${esc(sourceTimestamp(seatSourceTimestamp()))}.</span></div><div class="fare-breakdown"><div class="fare-row"><span>Fare + taxes + checked bag</span><b>${money(total)}</b></div><div class="fare-row total"><span>Final total · CAD</span><b>${money(total)}</b></div></div><div class="booking-warning"><i>!</i><p><b>Revalidation:</b> This fare still fits the ${money(Number(state.settings.budget))} hard budget and ${esc(state.settings.maxStops)} layover limit. Airline, airport, baggage, and refund terms are verified for these conditions. Any fare change stops here.</p></div><div class="booking-boundary"><i>✓</i><p><b>${state.settings.permission === 'automatic' ? 'Automatic permission applies to this exact fare.' : 'You are approving this one itinerary.'}</b> This is one round trip for ${esc(partySummary(state.settings))}, up to ${money(Number(state.settings.budget))} CAD total, with at most ${esc(state.settings.maxStops)} layover. No future or alternate booking is authorized.</p></div><div class="fare-rule-box"><h3>available fare cancellation rule</h3><p>Cancel by <b>Nov 30, 2026 at 5:00 p.m. America/Toronto</b>: ${money(150)} cancellation fee; estimated refund ${money(708)} in 7–10 business days. After this deadline, this ticket is nonrefundable except ${money(92)} in taxes. These are the airline?s fare policy.</p></div><div class="form-actions"><button class="secondary-button" data-action="decision">Back to recommendation</button>${button('Start 15-second stop window <span aria-hidden="true">→</span>', 'start-grace')}</div><p class="micro-copy" style="margin:12px 0 0">Nothing is charged here. The next screen provides an optional pause before submitting the  booking.</p></section></div></section>`;
}
function graceView() {
  const remaining = Math.max(0, Math.ceil((state.graceEndsAt - Date.now()) / 1000));
  return `<section class="view"><div class="big-state"><div class="eyebrow">Optional stop window</div><span class="state-symbol">?</span><h1>Booking is ready</h1><p class="lead">Your itinerary passed the final fare and limit checks. Stop within this window or continue to book the trip.</p><div class="grace-count" id="grace-count">${remaining}s</div><div class="count-note">Time remaining to stop before submitting</div><div class="ticket-summary surface"><div class="ticket-top"><b>Icelandair ? Montr?al ? Lisbon</b><span>1 traveler ? round trip</span></div><div class="ticket-total"><span>Final total ? taxes + checked bag</span><b>${money(state.total)}</b></div><p class="micro-copy" style="margin:9px 0 0">Review the total and fare conditions before continuing.</p></div><div class="state-actions">${button('Continue with booking', 'submit-booking')}${button('Stop booking', 'stop-booking', 'secondary-button')}</div></div></section>`;
}
function processingView() { return `<section class="view"><div class="big-state"><span class="state-symbol">…</span><h1>Checking the booking result</h1><p class="lead">We’re checking the booking status. Do not start another booking while this check is in progress.</p><div class="state-actions">${button('Verify status', 'verify-booking')}${button('Back to trip', 'dashboard', 'secondary-button')}</div></div></section>`; }
function legacyScenarioView() {
  const sc = state.scenario;
  let d = { tone: 'warn', mark: '!', title: 'The fare disappeared', text: 'The selected fare was no longer available when it was checked again. No booking was made.', charge: 'No charge', paused: 'Booking stopped; monitoring is paused for this fare.', next: 'Keep watching for another option, or change a limit if your needs have changed.', primary: 'Resume monitoring', primaryAction: 'recover-watch', secondary: 'Adjust limits', secondaryAction: 'edit-limits' };
  if (sc === 'price-increase') d = { tone: 'warn', mark: '↗', title: 'The fare changed to $884 CAD', text: 'The revised total is $26 below your $900 hard budget and still meets the one-layover limit.', charge: 'No charge', paused: state.settings.permission === 'automatic' ? 'Revalidation paused until this price change is checked against your saved limits.' : 'Booking is paused until you approve the revised total.', next: state.settings.permission === 'automatic' ? 'Your automatic permission covers this revised fare because it stays within the saved cap. Verify again before the booking.' : 'This changed total needs your approval. You can accept $884 CAD or keep monitoring.', primary: state.settings.permission === 'automatic' ? 'Continue authorized booking at $884' : 'Approve revised $884 fare', primaryAction: state.settings.permission === 'automatic' ? 'auto-reprice' : 'approve-reprice', secondary: 'Keep watching', secondaryAction: 'recover-watch' };
  if (sc === 'over-budget') d = { tone: 'error', mark: '×', title: 'The fare is over your budget', text: 'The rechecked total is $924 CAD, which is $24 above your $900 hard limit. The agent did not book it.', charge: 'No charge', paused: 'Automatic booking is blocked. Your budget was not expanded.', next: 'Raise the budget yourself, or keep searching under the current limit.', primary: 'Review budget limit', primaryAction: 'edit-limits', secondary: 'Keep current limits', secondaryAction: 'recover-watch' };
  if (sc === 'no-options') d = { tone: 'warn', mark: '⌕', title: 'No flights meet every hard limit', text: 'The search found no fare under $900 CAD with at most one layover, your baggage included, and the selected airports allowed.', charge: 'No charge', paused: 'Searching has paused. No condition was relaxed.', next: 'You can keep the rules as they are, or choose which limit or preference to adjust.', primary: 'Review trip limits', primaryAction: 'edit-limits', secondary: 'Leave monitoring paused', secondaryAction: 'pause-dashboard' };
  if (sc === 'unknown-terms') d = { tone: 'warn', mark: '?', title: 'A required fare detail could not be verified', text: 'The baggage or refund condition is unclear for this available fare. The agent will not guess or mark it as included.', charge: 'No charge', paused: state.settings.permission === 'automatic' ? 'Automatic booking is blocked, even though the price is within budget.' : 'Booking is paused until the baggage and fare terms can be verified.', next: 'Keep watching for verified terms, or change your baggage or refund preferences. Approval mode does not turn an unknown fact into a verified one.', primary: 'Keep watching for verified terms', primaryAction: 'recover-watch', secondary: 'Review baggage preferences', secondaryAction: 'edit-limits' };
  if (sc === 'timeout') d = { tone: 'warn', mark: '…', title: 'Booking confirmation is uncertain', text: 'The  booking request timed out before confirmation returned. no charge has been made.', charge: 'Booking status: unknown · real charge: none', paused: 'A second attempt is locked until this booking status is checked.', next: 'Verify the booking status before doing anything else. This prevents a duplicate attempt.', primary: 'Check booking status', primaryAction: 'verify-booking', secondary: 'Return to trip after checking', secondaryAction: 'dashboard' };
  if (sc === 'cancel-failed') d = { tone: 'error', mark: '!', title: 'Cancellation is not confirmed', text: 'The cancellation request did not receive a confirmation. The ticket remains active until status is verified.', charge: 'No new charge · refund not issued', paused: 'A second cancellation request is paused while this result is checked.', next: 'Check the cancellation result again or return to the ticket. Do not treat the ticket as cancelled yet.', primary: 'Check cancellation again', primaryAction: 'verify-cancel', secondary: 'View ticket status', secondaryAction: 'show-ticket' };
  return `<section class="view"><div class="big-state scenario-view"><div class="eyebrow">Update ? · ${esc(state.scenario.replaceAll('-', ' '))}</div><span class="state-symbol ${d.tone}">${d.mark}</span><h1>${esc(d.title)}</h1><p class="lead">${esc(d.text)}</p><div class="state-detail"><article><span>Money</span><b>${esc(d.charge)}</b><p>Fare details and booking conditions are shown above.</p></article><article><span>What the agent paused</span><b>${esc(d.paused)}</b></article><article><span>Next step</span><b>${esc(d.next)}</b></article></div><div class="state-actions">${button(esc(d.primary), d.primaryAction)}${button(esc(d.secondary), d.secondaryAction, 'secondary-button')}</div><div class="scenario-context">Your saved permission is <b>${esc(permissionName())}</b>. Hard limits are never increased silently. The selected scenario can be changed from the “Explore” menu at the top of the page.</div></div></section>`;
}
function bookedView() {
  const deadline = new Date('2026-11-30T17:00:00-05:00');
  const days = Math.ceil((deadline - TODAY) / 86400000);
  return `<section class="view"><div class="big-state"><div class="eyebrow">Booking confirmed</div><span class="state-symbol">?</span><h1>Your trip is booked</h1><p class="lead">Keep your booking reference and itinerary details for check-in.</p><div class="reference-number">${esc(state.bookingRef || 'WN-7K4P2A')}</div><p class="micro-copy">Booking reference ? saved with your trip</p><div class="ticket-summary surface"><div class="ticket-top"><b>Icelandair ? Economy Standard</b><span>1 adult ? round trip</span></div><div class="ticket-leg"><div class="flight-time"><b>6:10 a.m.</b><span>Dec 7 ? YUL</span></div><div class="flight-mid">9h 05m ? 1 stop<div class="dash"></div>KEF</div><div class="flight-time"><b>9:15 p.m.</b><span>Dec 7 ? LIS</span></div></div><div class="ticket-leg"><div class="flight-time"><b>11:25 a.m.</b><span>Dec 14 ? LIS</span></div><div class="flight-mid">7h 15m ? nonstop<div class="dash"></div>YUL</div><div class="flight-time"><b>1:40 p.m.</b><span>Dec 14 ? YUL</span></div></div><div class="ticket-total"><span>Trip total ? ${esc(state.settings.currency)}</span><b>${money(state.total)}</b></div><div class="ticket-total"><span>Taxes + checked bag</span><b>Included</b></div></div><div class="fare-rule-box"><h3>Ticket cancellation policy</h3><p>Cancel by <b>Nov 30, 2026 at 5:00 p.m. America/Toronto</b>: ${money(150)} fee; estimated refund ${money(708)} in 7?10 business days. After that time, only ${money(92)} in taxes is refundable under this fare.</p><div class="deadline">${days > 0 ? `<b>${days} days</b> until the fare?s stated deadline.` : '<b>The fare deadline has passed.</b>'} Refund timing follows the airline?s policy.</div></div><div class="state-actions">${button('Review cancellation details', 'cancel-review', 'danger-button')}${button('Back to trip dashboard', 'dashboard', 'secondary-button')}</div></div></section>`;
}
function cancelReviewView() {
  const deadline = new Date('2026-11-30T17:00:00-05:00');
  const before = Date.now() <= +deadline;
  const fee = before ? 150 : state.total - 92;
  const refund = before ? state.total - 150 : 92;
  const feeLabel = before ? 'Cancellation fee' : 'Fare amount not refunded';
  return `<section class="view"><div class="big-state"><div class="eyebrow">Cancel trip</div><span class="state-symbol warn">!</span><h1>Review the refund before cancelling</h1><p class="lead">Cancellation after ticketing follows the fare policy below. Review the fee and refund timing before continuing.</p><div class="cancel-refund"><article><span>${feeLabel}</span><b>${money(fee)}</b></article><article><span>Estimated refund to original method</span><b>${money(refund)}</b></article></div><div class="fare-rule-box"><h3>Fare cancellation policy</h3><p>${before ? `Cancellation requested before <b>Nov 30, 2026 at 5:00 p.m. America/Toronto</b> has a ${money(150)} fee. Estimated refund: ${money(refund)}, returned in 7?10 business days.` : `The stated deadline of <b>Nov 30, 2026 at 5:00 p.m. America/Toronto</b> has passed. The fare is nonrefundable except ${money(92)} in taxes; estimated return takes 7?10 business days.`} No universal free-cancellation promise applies.</p></div><div class="state-actions">${button('Confirm cancellation', 'confirm-cancel', 'danger-button')}${button('Keep this ticket', 'booked', 'secondary-button')}</div></div></section>`;
}
function cancelResultView(success) {
  return `<section class="view"><div class="big-state"><span class="state-symbol ${success ? '' : 'error'}">${success ? '✓' : '×'}</span><div class="eyebrow">${success ? 'Cancellation complete · ' : 'Cancellation result · '}</div><h1>${success ? 'The ticket is cancelled' : 'Cancellation could not be verified'}</h1><p class="lead">${success ? `Cancellation status confirmed. Estimated refund: ${money(state.total - 150)} CAD, less the ${money(150)} cancellation fee. The displayed available fare says 7–10 business days.` : 'The cancellation request did not complete. The ticket is still active and no refund was started. Verify the status before sending another request.'}</p><div class="state-detail"><article><span>Ticket status</span><b>${success ? 'Cancelled · ' : 'Still active · verify before retrying'}</b></article><article><span>Refund status</span><b>${success ? 'Estimated refund pending' : 'No refund issued'}</b></article><article><span>Real charge</span><b>None · booking provider not connected</b></article></div><div class="state-actions">${success ? button('Back to trip dashboard', 'dashboard') : `${button('Verify cancellation again', 'verify-cancel')}${button('View ticket status', 'show-ticket', 'secondary-button')}`}</div></div></section>`;
}
function tripDate(value, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return value ? new Intl.DateTimeFormat('en-CA', options).format(new Date(`${value}T12:00:00`)) : 'date not set'; }
function durationLabel(hours) { const minutes = Math.round(hours * 60); return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`; }
function selectedTotal() { const flight = bestFlight(); if (!flight) return 0; if (state.revisedApproved && state.total === 884) return 884 * travelerCount(); return flightTotal(flight); }
function flightRoute(flight, returnLeg = false) {
  const s = state.settings, from = returnLeg ? codeFrom(s.destination, 'LIS') : codeFrom(s.origin, 'YUL'), to = returnLeg ? codeFrom(s.origin, 'YUL') : codeFrom(s.destination, 'LIS');
  const depart = returnLeg ? flight.returnDepart : flight.depart, arrive = returnLeg ? flight.returnArrive : flight.arrive;
  const day = returnLeg ? tripDate(s.returnDate) : tripDate(s.departDate);
  return `<div class="flight-line"><div class="flight-time"><b>${depart}</b><span>${from} · ${day}</span></div><div class="flight-mid">${returnLeg ? flight.returnHours : durationLabel(flight.hours)} · ${returnLeg ? (flight.nonstop ? 'nonstop' : '1 stop') : (flight.stops === 0 ? 'nonstop' : `${flight.stops} stop${flight.stops === 1 ? '' : 's'}`)}<div class="dash"></div>${returnLeg || flight.nonstop ? to : `Via ${flight.connection}`}</div><div class="flight-time"><b>${arrive}</b><span>${to}${!returnLeg && flight.arrivalDay ? ' · +1' : ''}</span></div></div>`;
}
function noFareMessage() { return `<div class="recommendation-banner"><span class="icon">!</span><p><b>No available flight meets every hard limit.</b> This can happen when the budget, traveler count, stops, travel time, excluded airports or airlines, baggage, or refund requirement rules out all current available fares. No condition was relaxed.</p></div><div class="button-row">${button('Review trip limits', 'edit-limits')}${button('Keep monitoring', 'pause', 'secondary-button')}</div>`; }
function configuredTripRules(settings) {
  const currency = settings.currency || 'CAD';
  const totalLimit = new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(settings.budget) || 0);
  const maxHours = String(settings.maxHours || '14').replace(/\s*hours?\s*/i, '').trim();
  const flexibility = String(settings.flexibleDays || '0').trim();
  const flexibilityText = /\d/.test(flexibility) && Number.parseInt(flexibility, 10) > 0 ? `±${flexibility.replace(/\s*days?\s*/i, '')} days` : 'Fixed dates';
  const excludedAirlines = settings.excludedAirlines?.trim() || 'None';
  const excludedAirports = settings.excludedAirports?.trim() || 'None';
  return `<div class="agent-configured-rules"><h4>Hard limits</h4><dl><div><dt>Total budget</dt><dd>Up to ${esc(totalLimit)} ${esc(currency)} · taxes and selected bag included</dd></div><div><dt>Layovers</dt><dd>Up to ${esc(settings.maxStops || '0')}</dd></div><div><dt>Journey duration</dt><dd>Up to ${esc(maxHours)} hours</dd></div><div><dt>Excluded airlines</dt><dd>${esc(excludedAirlines)}</dd></div><div><dt>Excluded airports</dt><dd>${esc(excludedAirports)}</dd></div></dl><h4>Preferences</h4><dl><div><dt>Date flexibility</dt><dd>${esc(flexibilityText)}</dd></div><div><dt>Departure time</dt><dd>${esc(settings.departWindow || 'Any time')}</dd></div><div><dt>Baggage</dt><dd>${esc(settings.baggage || 'No checked bag')}</dd></div><div><dt>Refundability</dt><dd>${esc(settings.refundPreference || 'No preference')}</dd></div><div><dt>Seat availability</dt><dd>${esc(seatAvailabilitySummary(settings))}</dd></div></dl></div>`;
}
function flightAlertControl(flight, total) {
  const enabled = Boolean(state.availabilityAlertEnabled);
  const fareNow = Boolean(flight) && !state.paused;
  const message = state.availabilityAlertMessage || (enabled ? (fareNow ? 'A flight currently meets your limits. We’ll alert you when a matching fare is found.' : 'We’ll alert you when a fare meets your trip limits.') : 'Get an alert when a fare matches your trip limits.');
  return `<div class="flight-alert-control"><div><b>Fare alerts</b><p>${esc(message)}</p><small>Browser alerts are sent while this app is open and monitoring.</small></div><button class="flight-alert-toggle ${enabled ? 'is-on' : ''}" type="button" role="switch" aria-checked="${enabled}" aria-label="Notify me when a flight matches this trip" data-action="toggle-flight-alerts"><span class="flight-alert-track"><i></i></span><span>${enabled ? 'On' : 'Off'}</span></button></div>`;
}
function dashboardView() {
  const s = state.settings, flight = bestFlight(), total = selectedTotal(), limit = Number(s.budget) || 900, delta = Math.max(0, limit - total);
  const party = partyCounts(s), seatsLeft = Math.max(0, Number(state.seatsRemaining) || 0), seatsSufficient = Boolean(flight) && seatsLeft >= party.total;
  const status = state.paused ? 'Paused' : !flight ? 'No qualifying fare' : state.status;
  const end = new Date(`${s.monitorUntil}T23:59:00`), ended = !Number.isNaN(+end) && end < TODAY;
  const last = state.lastCheckAt ? fmtStamp(state.lastCheckAt) : 'not yet';
  const recommended = flight ? `<section class="surface"><div class="section-title-row"><div><div class="small-label">Best qualifying option · available fare</div><div class="current-price"><strong>${money(total)}</strong><span>round trip · all-in estimate</span></div></div><span class="status-pill">Fits your hard limits</span></div>${flightRoute(flight)}<div class="flight-details"><span>✦ ${esc(flight.airline)} · available fare</span><span>${esc(s.baggage)} covered in total</span><span>${esc(s.cabin)} · standard</span></div><div class="fit-grid"><div class="fit-item"><i>✓</i><span>${money(total)} total stays ${money(delta)} below your budget.</span></div><div class="fit-item"><i>✓</i><span>${flight.stops === 0 ? 'Nonstop' : `${flight.stops} layover${flight.stops === 1 ? '' : 's'}`} is within your maximum.</span></div><div class="fit-item"><i>✓</i><span>Taxes and selected baggage are included.</span></div><div class="fit-item"><i>✓</i><span>${flight.airline} and route avoid your excluded list.</span></div></div>${s.refundPreference === 'Refundable preferred' && !flight.refundable ? '<p class="tradeoff"><b>Your refundable preference is not met.</b> No refundable flight is available. This fare has a cancellation fee until the exact stated deadline below.</p>' : ''}<div class="form-actions"><span class="micro-copy">available fare · checked ${esc(last)}</span>${button('Review recommendation <span aria-hidden="true">→</span>', 'decision')}</div>${flightAlertControl(flight,total)}</section>` : `<section class="surface">${noFareMessage()}</section>`;
  return `<section class="view"><div class="page-back"><button type="button" class="back-button" data-action="back"><span aria-hidden="true">&larr;</span> All destinations</button></div><div class="dashboard-top"><div><div class="eyebrow">Fare monitoring</div><h1>${esc(cityFrom(s.origin))} <span style="color:var(--green)">→</span> ${esc(cityFrom(s.destination))}</h1><p class="lead">${fmtDate(s.departDate)}–${fmtDate(s.returnDate)} · ${esc(partySummary(s))} · ${esc(s.cabin)}</p></div><div class="dashboard-actions"><div class="status-block">${pill(ended ? 'Monitoring ended' : status, state.paused ? 'paused' : !flight ? 'warn' : '')}<small>Last checked ${esc(last)}</small></div>${button('Plan a new trip <span aria-hidden="true">+</span>', 'new-trip')}</div></div><div class="summary-strip"><div class="summary-cell"><span>HARD LIMIT · TOTAL</span><b>${money(limit)} ${esc(s.currency)}</b></div><div class="summary-cell"><span>BOOKING PERMISSION</span><b>${esc(permissionName())}</b></div><div class="summary-cell"><span>MAX LAYOVERS</span><b>${esc(s.maxStops)}</b></div><div class="summary-cell"><span>MONITOR UNTIL</span><b>${fmtDate(s.monitorUntil)}</b></div><div class="summary-cell seat-kpi ${seatsSufficient ? 'seats-ok' : 'seats-low'}" aria-label="${flight ? `${seatsLeft} seats available for ${party.total} travelers: ${seatsSufficient ? 'enough seats' : 'not enough seats'}` : `Seat availability not verified for ${party.total} travelers`}"><span>SEATS FOR ${party.total} TRAVELER${party.total === 1 ? '' : 'S'}</span><b>${flight ? `${seatsSufficient ? 'Enough' : 'Not enough'} · ${seatsLeft} available` : 'Not verified'}</b></div></div><div class="dashboard-grid"><div class="dashboard-main">${recommended}${sourceChecksView()}<section class="surface"><div class="section-title-row"><div><div class="small-label">Price history</div><h3 style="margin-top:5px">Observed fares · last 5 days</h3></div><span class="micro-copy">${esc(s.currency)} · taxes + bag included</span></div>${priceHistory()}<div class="chart-callout"><b>Observed fact:</b> Current fare is ${money(total)} against a five-day average of ${money(932 * travelerCount())}. <b>Forecast:</b> Prices could rise or fall; this history can’t predict the next fare.</div></section><section class="surface"><div class="section-title-row"><h3>Agent activity</h3><span class="micro-copy">Saved on this device</span></div>${timeline()}</section></div><aside class="dashboard-side"><section class="surface"><div class="section-title-row"><h3>Permission</h3></div><div class="permission-box"><b>${esc(permissionName())}</b><p>${s.permission === 'automatic' ? `May book one round trip for ${partySummary(s)} up to ${money(limit)} total if every hard limit and fare condition is verified. Any changed or unknown condition stops the booking.` : 'Can monitor and recommend. It must wait for your approval before any booking step.'}</p></div>${configuredTripRules(s)}<div class="permission-tools"><button data-action="edit-limits">Edit limits</button>${state.paused ? '<button data-action="resume">Resume monitoring</button>' : '<button data-action="pause">Pause monitoring</button>'}${s.permission === 'automatic' ? '<button class="revoke" data-action="revoke">Revoke booking permission</button>' : ''}<button class="stop-tracking-button" type="button" data-action="request-remove-tracking">Stop monitoring</button></div></section><section class="surface"><div class="section-title-row"><h3>Trip snapshot</h3><span class="micro-copy">Round trip</span></div><ul class="aside-list"><li><span>Traveler${travelerCount() > 1 ? 's' : ''}</span><b>${esc(partySummary(s))}</b></li><li><span>Cabin</span><b>${esc(s.cabin)}</b></li><li><span>Layovers</span><b>Up to ${esc(s.maxStops)}</b></li><li><span>Baggage</span><b>${esc(s.baggage)}</b></li><li><span>Refund preference</span><b>${esc(s.refundPreference)}</b></li></ul><button class="text-button" type="button" data-action="edit-travelers">Edit travelers</button></section><section class="surface"><div class="section-title-row"><h3>Monitoring status</h3></div><div class="permission-box"><b>${state.paused ? 'Checks are paused' : ended ? 'Monitoring window ended' : 'Monitoring is active'}</b><p>${state.paused ? 'No fare checks or booking actions will run until you resume.' : ended ? 'No further checks will run. Set a new end date to continue.' : `The agent stops on ${fmtDate(s.monitorUntil)} if no fare qualifies. It will not relax your limits.`}</p></div></section></aside></div></section>`;
}
function decisionView() {
  const flight = bestFlight();
  if (!flight) return `<section class="view limited-width">${headerTitle('Flight recommendation', 'No current option meets your rules', 'The agent stopped before booking because every hard limit stays in force.')}<section class="surface">${noFareMessage()}</section></section>`;
  const s = state.settings, total = selectedTotal(), eligible = matchingFlights();
  const alternatives = eligible.filter(f => f.id !== flight.id).slice(0, 2);
  const avg = 932 * travelerCount(), diff = Math.max(0, avg - total), stopText = flight.stops ? `${flight.stops} layover${flight.stops === 1 ? '' : 's'}` : 'nonstop';
  const fareTaxes = 92 * travelerCount(), fareBag = bagSurcharge() * travelerCount(), fareBase = Math.max(0, total - fareTaxes - fareBag);
  return `<section class="view"><div class="section-heading"><div>${headerTitle('Flight recommendation', 'A fare that fits your rules', 'Compare the total, itinerary, and Fare conditions before choosing what happens next.')}</div>${button('Back to trip', 'dashboard', 'secondary-button')}</div><div class="decision-layout"><div><section class="surface"><div class="recommendation-banner"><span class="icon">✓</span><p><b>Book now or wait?</b> This fare is ${money(diff)} below the average we observed over the last five days. It meets your budget and layover limits. Prices may still fall or rise. We can’t predict the next fare.</p></div><div class="section-title-row"><div><div class="small-label">Recommended · best fit</div><h3 style="margin:4px 0 0">${esc(flight.airline)} · ${esc(s.cabin)}</h3></div><span class="status-pill">${money(total)} total</span></div>${flightRoute(flight)}<div class="trip-dates"><b>Return · ${fmtDate(s.returnDate)}</b><span>${flight.returnDepart} → ${flight.returnArrive} · ${flight.returnHours} ${flight.nonstop ? 'nonstop' : `via ${flight.connection}`}</span></div><div class="fare-breakdown"><div class="fare-row"><span>Base fare · round trip</span><b>${money(Math.max(0, total - 147))}</b></div><div class="fare-row"><span>Taxes and airport fees</span><b>${money(92 * travelerCount())}</b></div><div class="fare-row"><span>${esc(s.baggage)} · included</span><b>${money(Math.max(55, bagSurcharge()) * travelerCount())}</b></div><div class="fare-row total"><span>Total · ${esc(s.currency)}</span><b>${money(total)}</b></div></div><div class="form-section"><h4 class="group-title">Fare conditions</h4><ul class="condition-list"><li><i>✓</i><span>${esc(s.baggage)} is included in the total shown above.</span></li><li><i>✓</i><span>Ticket changes allowed before departure; fare difference may apply.</span></li><li><i>!</i><span>Cancellation fee is ${money(150)} before Nov 30, 2026 at 5:00 p.m. America/Toronto. After that, only ${money(92)} in taxes are refundable under this available fare.</span></li></ul></div><div class="tradeoff"><b>Trade-off:</b> ${esc(flight.tradeoff)}</div></section><section class="surface"><div class="section-title-row"><h3>Why this fits</h3><span class="micro-copy">Rules checked against the fare</span></div><div class="fit-grid"><div class="fit-item"><i>✓</i><span>${money(total)} is below your ${money(Number(s.budget))} hard budget.</span></div><div class="fit-item"><i>✓</i><span>${stopText} is within your maximum of ${esc(s.maxStops)}.</span></div><div class="fit-item"><i>✓</i><span>${esc(s.baggage)} is included in the displayed total.</span></div><div class="fit-item"><i>✓</i><span>${esc(flight.airline)} and the ${esc(flight.connection || 'direct')} route do not match your exclusion list.</span></div></div></section></div><aside><section class="surface"><div class="section-title-row"><h3>Other qualifying options</h3><span class="micro-copy">Same dates · available fares</span></div><div class="alternatives">${alternatives.length ? alternatives.map(f => `<div class="alternative"><div><b>${esc(f.airline)}${f.id === 'play' ? ' · Lowest total' : ''}</b><span>${f.depart} departure · ${f.stops ? `${f.stops} stop · ${f.connection}` : 'nonstop'} · ${durationLabel(f.hours)}</span></div><div class="alternative-price"><strong>${money(flightTotal(f))}</strong><button class="text-button" data-action="select-flight" data-flight="${f.id}">View details</button></div></div>`).join('') : '<p class="subtle" style="font-size:11px">No other current fare meets every hard limit.</p>'}</div><p class="micro-copy" style="margin:14px 0 0">Prices and availability can change.</p></section><section class="surface"><div class="section-title-row"><h3>Observed facts vs. forecast</h3></div><div class="facts-forecast"><div><span>Observed</span><p>${money(avg)} average across five saved fare checks. Current fare is ${money(total)}.</p></div><div><span>Uncertain</span><p>Future prices may rise or fall. No price movement is guaranteed.</p></div></div></section><section class="surface"><div class="section-title-row"><h3>Booking boundary</h3></div><div class="permission-detail"><b>${esc(permissionName())}.</b> ${s.permission === 'automatic' ? 'This fare matches your saved authorization. Any changed or unknown condition stops the booking.' : 'No booking begins until you approve this exact itinerary and total.'} You can pause or change limits at any time.</div><div class="button-row" style="margin-top:14px;flex-direction:column;align-items:stretch">${button(s.permission === 'automatic' ? 'Review authorized booking' : 'Approve this booking', 'review-booking')}${button('Keep watching this fare', 'keep-watching', 'secondary-button')}${button('Adjust preferences', 'edit-limits', 'quiet-button')}</div></section></aside></div></section>`;
}
function bookingReviewView() {
  const flight = bestFlight();
  if (!flight || selectedTotal() > Number(state.settings.budget)) return `<section class="view limited-width">${headerTitle('Final check stopped', 'This fare no longer fits your limits', 'The agent did not begin a booking. Review your rules or choose another qualifying option.')}<section class="surface">${noFareMessage()}</section></section>`;
  const s = state.settings, total = selectedTotal(), to = codeFrom(s.destination, 'LIS'), from = codeFrom(s.origin, 'YUL');
  return `<section class="view"><div class="booking-card"><div class="section-heading"><div>${headerTitle('Before booking', 'Review this exact itinerary', 'The fare and every hard limit are checked again here. We recheck the fare and every hard limit before booking.')}</div>${pill(s.permission === 'automatic' ? 'Within saved authorization' : 'Your approval required')}</div><section class="surface"><div class="section-title-row"><div><div class="small-label">${esc(flight.airline)} · ${esc(s.cabin)} · round trip</div><h3 style="margin:5px 0 0">${esc(cityFrom(s.origin))} ${from} ↔ ${esc(cityFrom(s.destination))} ${to}</h3></div><span class="micro-copy">${esc(partySummary(s))}</span></div>${flightRoute(flight)}<div class="trip-dates"><b>Return · ${fmtDate(s.returnDate)}</b><span>${flight.returnDepart} → ${flight.returnArrive} · ${flight.returnHours}</span></div><div class="traveler-summary"><div><span>Traveler</span><b>${esc(partySummary(s))} · name not collected</b></div><div><span>Cabin</span><b>${esc(s.cabin)}</b></div><div><span>Baggage</span><b>${esc(s.baggage)} · included</b></div></div><div class="seat-review"><b>Seat availability rechecked</b><span>${Math.max(0, Number(state.seatsRemaining) || 0)} seats remain at this fare; enough for ${esc(partySummary(s))}. Retrieved ${esc(sourceTimestamp(seatSourceTimestamp()))}.</span></div><div class="seat-review"><b>Seat availability rechecked</b><span>${Math.max(0, Number(state.seatsRemaining) || 0)} seats remain at this fare; enough for ${esc(partySummary(s))}. Retrieved ${esc(sourceTimestamp(seatSourceTimestamp()))}.</span></div><div class="fare-breakdown"><div class="fare-row"><span>Fare + taxes + selected bag</span><b>${money(total)}</b></div><div class="fare-row total"><span>Final total · ${esc(s.currency)}</span><b>${money(total)}</b></div></div><div class="booking-warning"><i>!</i><p><b>Revalidation:</b> This fare still fits the ${money(Number(s.budget))} hard budget and ${esc(s.maxStops)} layover limit. ${esc(flight.airline)}, ${esc(flight.connection || 'direct')} route, baggage, and refund terms are verified for these conditions. Any fare change stops here.</p></div><div class="booking-boundary"><i>✓</i><p><b>${s.permission === 'automatic' ? 'Automatic permission applies to this exact fare.' : 'You are approving this one itinerary.'}</b> This is one round trip for ${esc(partySummary(s))}, up to ${money(Number(s.budget))} ${esc(s.currency)} total, with at most ${esc(s.maxStops)} layover${s.maxStops === '1' ? '' : 's'}. No alternate booking is authorized.</p></div><div class="fare-rule-box"><h3>available fare cancellation rule</h3><p>Cancel by <b>Nov 30, 2026 at 5:00 p.m. America/Toronto</b>: ${money(150)} cancellation fee; estimated refund ${money(total - 150)} in 7–10 business days. After this deadline, only ${money(92)} in taxes are refundable. These are example rules for this service.</p></div><div class="form-actions"><button class="secondary-button" data-action="decision">Back to recommendation</button>${button('Start 15-second stop window <span aria-hidden="true">→</span>', 'start-grace')}</div><p class="micro-copy" style="margin:12px 0 0">Nothing is charged here. The next screen provides a short pause before submitting the  booking.</p></section></div></section>`;
}
function priceHistory() {
  const values = [944, 932, 938, 918, 928], max = Math.max(...values);
  return `<div class="chart" aria-label="Observed prices during the last five days">${values.map((value, i) => { const date = new Date(TODAY); date.setDate(date.getDate() - (values.length - i - 1)); const label = new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'short' }).format(date); return `<div class="chart-column ${i === values.length - 1 ? 'today' : ''}" title="Observed fare ${money(value * travelerCount())} on ${label}"><em>${money(value * travelerCount())}</em><span class="bar" style="height:${Math.round(value / max * 70)}px"></span><small>${label}</small></div>`; }).join('')}</div>`;
}
function cancelResultView(success) {
  const deadline = new Date('2026-11-30T17:00:00-05:00');
  const before = Date.now() <= +deadline;
  const refund = before ? state.total - 150 : 92;
  return `<section class="view"><div class="big-state"><span class="state-symbol ${success ? '' : 'error'}">${success ? '?' : '?'}</span><div class="eyebrow">${success ? 'Cancellation complete' : 'Cancellation status'}</div><h1>${success ? 'The ticket is cancelled' : 'Cancellation could not be verified'}</h1><p class="lead">${success ? `Cancellation confirmed. Estimated refund: ${money(refund)} CAD. The airline?s listed policy allows 7?10 business days.` : 'The cancellation request did not complete. The ticket remains active until the status is verified.'}</p><div class="state-detail"><article><span>Ticket status</span><b>${success ? 'Cancelled' : 'Active ? verify before retrying'}</b></article><article><span>Refund status</span><b>${success ? 'Refund pending' : 'No refund issued'}</b></article><article><span>Fare policy</span><b>${before ? 'Cancellation fee applies' : 'Taxes only are refundable'}</b></article></div><div class="state-actions">${success ? button('Back to trip dashboard', 'dashboard') : `${button('Verify cancellation again', 'verify-cancel')}${button('View ticket status', 'show-ticket', 'secondary-button')}`}</div></div></section>`;
}
function itineraryDate(value, offset = 0) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(+date)) return value || 'Date not set';
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}
function itineraryTravelMinutes(legs) {
  return legs.reduce((sum, leg) => { const [, hours = '0', minutes = '0'] = /(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(leg.duration || '') || []; return sum + Number(hours) * 60 + Number(minutes); }, 0);
}
function itineraryMinutesLabel(total) { return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`; }
function itineraryLegMarkup(legs, startDate, direction) {
  const totalMinutes = itineraryTravelMinutes(legs) + legs.reduce((sum, leg) => { const [, hours = '0', minutes = '0'] = /(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(leg.layover || '') || []; return sum + Number(hours) * 60 + Number(minutes); }, 0);
  return `<section class="itinerary-direction"><header><h4>${direction}</h4><span>${legs.length === 1 ? 'Direct' : `${legs.length - 1} connection${legs.length > 2 ? 's' : ''}`} · ${itineraryMinutesLabel(totalMinutes)} total</span></header><div class="itinerary-leg-list">${legs.map((leg, index) => `<article class="itinerary-leg"><span class="itinerary-leg-count">LEG ${index + 1}</span><div class="itinerary-leg-route"><b>${esc(leg.from)} <i aria-hidden="true">✈</i> ${esc(leg.to)}</b><small>${esc(AIRPORT_NAMES[leg.from] || leg.from)} to ${esc(AIRPORT_NAMES[leg.to] || leg.to)}</small></div><div class="itinerary-leg-times"><span><small>Departs · ${esc(itineraryDate(startDate, leg.departDayOffset || 0))}</small><b>${esc(leg.depart)}</b></span><span><small>Arrives · ${esc(itineraryDate(startDate, leg.arriveDayOffset || 0))}</small><b>${esc(leg.arrive)}</b></span></div><div class="itinerary-leg-meta"><span>${esc(leg.airline)}</span><b>${esc(leg.duration)} flight</b></div></article>${leg.layover ? `<div class="itinerary-connection"><span class="connection-mark" aria-hidden="true">↳</span><div><b>${esc(leg.layover)} connection at ${esc(AIRPORT_NAMES[leg.to] || leg.to)} (${esc(leg.to)})</b><small>Next flight to ${esc(legs[index + 1]?.to || '')} departs at ${esc(legs[index + 1]?.depart || 'time unavailable')}.</small></div></div>` : ''}`).join('')}</div></section>`;
}
function itineraryDetailsMarkup(settings, stopCount, transitCodes) {
  const routeKey = `${codeFrom(settings.origin, 'YUL')}-${codeFrom(settings.destination, 'LIS')}`;
  const itinerary = ITINERARY_PRESETS[routeKey];
  const summary = stopCount === 0 ? 'Direct flight' : `${stopCount} stop${stopCount === 1 ? '' : 's'} · ${transitCodes.length ? `via ${transitCodes.join(', ')}` : 'connection'}`;
  const body = itinerary ? `${itineraryLegMarkup(itinerary.outbound, settings.departDate, 'Outbound')} ${itineraryLegMarkup(itinerary.returning, settings.returnDate, 'Return')}` : `<p class="itinerary-unavailable">The latest route preview is ${summary}. Detailed flight times will appear when an itinerary is available.</p>`;
  return `<details class="trip-itinerary"><summary>Show leg-by-leg details <span>${esc(summary)}</span></summary><div class="trip-itinerary-content"><p class="itinerary-time-note">All departure and arrival times are local to each airport.</p>${body}</div></details>`;
}
function monitoringToggleMarkup(tripId, paused, route) {
  const isMonitoring = !paused;
  return `<button class="monitor-toggle ${isMonitoring ? 'is-on' : ''}" type="button" role="switch" aria-checked="${isMonitoring}" aria-label="${isMonitoring ? 'Pause' : 'Resume'} monitoring for ${esc(route)}" data-action="toggle-trip-monitoring" data-trip-id="${esc(tripId)}"><span class="monitor-toggle-track"><i></i></span><span>${isMonitoring ? 'Monitoring' : 'Paused'}</span></button>`;
}
function tripsListView() {
  const savedTrips = Array.isArray(state.savedTrips) ? state.savedTrips : [];
  const activeFlight = bestFlight();
  const trips = [...(state.createdAt ? [{ tripId: state.tripId, settings: state.settings, status: state.paused ? 'Paused' : activeFlight ? state.status : 'No qualifying fare', paused: state.paused, total: selectedTotal(), trackedAirline: activeFlight?.airline || 'No fare found', trackedStops: activeFlight?.stops ?? 0, trackedConnection: activeFlight?.connection || '', trackedConnections: state.trackedConnections, current: true }] : []), ...savedTrips];
  const monitoringCount = trips.filter(trip => ['Monitoring', 'Searching', 'Awaiting approval'].includes(trip.status)).length;
  const rows = trips.map((trip, index) => {
    const settings = trip.settings || {};
    const fare = Number(trip.current ? trip.total : trip.total || 0);
    const currency = settings.currency || 'CAD';
    const formatMoney = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
    const route = `${cityFrom(settings.origin || '')} → ${cityFrom(settings.destination || '')}`;
    const dates = `${fmtDate(settings.departDate)}–${fmtDate(settings.returnDate)}`;
    const status = trip.paused ? 'Paused' : trip.status || 'Monitoring';
    const action = trip.current ? 'open-current-trip' : 'open-saved-trip';
    const buttonAttrs = trip.current ? '' : `data-trip-id="${esc(trip.tripId)}"`;
    const paused = Boolean(trip.paused || status === 'Paused');
    const stopCount = Number(trip.trackedStops ?? (trip.current ? activeFlight?.stops : 0)) || 0;
    const connections = Array.isArray(trip.trackedConnections) ? trip.trackedConnections : (trip.current ? [activeFlight?.connection || trip.trackedConnection] : [trip.trackedConnection]);
    const transitCodes = connections.filter(Boolean).slice(0, stopCount);
    const airportCodes = [codeFrom(settings.origin, 'YUL'), ...transitCodes, codeFrom(settings.destination, 'LIS')];
    const previewLabel = stopCount === 0 ? 'Direct flight' : `${stopCount} stop${stopCount === 1 ? '' : 's'} ? ${transitCodes.length ? `via ${transitCodes.join(', ')}` : 'connection details pending'}`;
    return `<div class="destination-row"><button class="destination-row-open" type="button" data-action="${action}" ${buttonAttrs} aria-label="View ${esc(route)}, ${dates}, ${partySummary(settings)}"><span class="destination-main"><span class="destination-number">${String(index + 1).padStart(2, '0')}</span><span class="destination-copy"><b>${esc(route)}</b><small>${dates} · ${esc(partySummary(settings))} · Best available: ${esc(trip.trackedAirline || 'Icelandair')}</small></span></span><span class="destination-preview"><b>${airportCodes.map(esc).join(' <i aria-hidden="true">✈</i> ')}</b><small>${previewLabel}</small></span><span class="destination-fare"><small>Best fare</small><b>${formatMoney(fare)}</b><small>Budget ${formatMoney(Number(settings.budget) || 0)}</small></span></button><div class="destination-row-monitor">${monitoringToggleMarkup(trip.tripId, paused, route)}</div><button class="destination-row-view" type="button" data-action="${action}" ${buttonAttrs} aria-label="View trip details for ${esc(route)}">View trip <b aria-hidden="true">→</b></button>${itineraryDetailsMarkup(settings, stopCount, transitCodes)}</div>`;
  }).join('');
  const listContent = rows || `<div class="tracked-empty"><p>You’re not tracking any destinations yet.</p><button class="primary-button" type="button" data-action="new-trip">Start tracking a trip</button></div>`;
  return `<section class="view destinations-page"><div class="destination-heading"><div><div class="eyebrow">Your flight watchlist</div><h1>Welcome back, John</h1><p class="lead">Follow fares across your destinations. Select a destination to review its best available options, price history, and booking limits.</p></div><div class="destination-summary"><b>${trips.length} destinations</b><span>${monitoringCount} monitoring</span></div></div><section class="surface destination-list"><div class="destination-list-heading"><div><h2>Destinations you’re following</h2><p class="subtle">Best available round trip total, including selected baggage</p></div><button class="primary-button" type="button" data-action="new-trip">Plan a new trip <span aria-hidden="true">+</span></button></div><div class="destination-list-rows">${listContent}</div></section></section>`;
}

function removeTrackingDialog() {
  const route = `${cityFrom(state.settings.origin)} to ${cityFrom(state.settings.destination)}`;
  return `<div class="tracking-overlay" data-remove-backdrop><section class="tracking-dialog" role="alertdialog" aria-modal="true" aria-labelledby="remove-tracking-title" aria-describedby="remove-tracking-copy"><span class="dialog-icon" aria-hidden="true">!</span><h2 id="remove-tracking-title">Stop tracking ${esc(route)}?</h2><p id="remove-tracking-copy">You’ll no longer track fares for this destination. Price monitoring will stop, and this destination will be removed from your list. You can set it up again later.</p><div class="tracking-dialog-actions"><button class="secondary-button" type="button" data-action="cancel-remove-tracking" data-remove-cancel>Keep tracking</button><button class="danger-button" type="button" data-action="confirm-remove-tracking">Stop tracking</button></div></section></div>`;
}

function productStoryView() {
  return `<section class="view product-story-view">
    <div class="story-hero">
      <div class="story-hero-copy"><div class="eyebrow">AirScout · Product design story</div><h1>Let people hand off the search, without handing over control.</h1><p class="lead">A flight agent that makes its evidence, limits, and next action clear before money or itinerary decisions are on the line.</p><div class="story-meta"><span>Problem framing</span><i></i><span>End-to-end journey design</span><i></i><span>Interactive prototype</span></div></div>
      <div class="story-hero-note"><span class="story-note-icon" aria-hidden="true">✦</span><b>Design question</b><p>How might travelers delegate flight monitoring and booking decisions while staying confident about what the agent can do?</p></div>
    </div>
    <section class="story-section story-problem"><div class="story-section-heading"><span class="story-index">01 / THE PROBLEM</span><h2>Flight search is tiring. Delegating it can feel risky.</h2></div><div class="story-problem-copy"><p>Travelers compare prices, schedules, baggage rules, and cancellation terms across multiple sources. Fares can change while they weigh the trade-offs, and a low headline price may not represent the trip they actually need.</p><p>Giving an AI agent permission to act adds a harder question: <b>what exactly has it been authorized to buy?</b> That uncertainty grows for families, where a fare may have fewer seats than the group needs.</p><div class="story-problem-callout">The product challenge is not only finding a good fare. It is making a delegated decision understandable, bounded, and recoverable.</div></div></section>
    <section class="story-tensions" aria-label="Traveler uncertainties"><article><span>01</span><b>Price changes</b><p>Is this the full trip total, and what happens if the fare changes?</p></article><article><span>02</span><b>Hidden conditions</b><p>Are baggage, refund terms, and the itinerary really included?</p></article><article><span>03</span><b>Group availability</b><p>Are there enough seats at this fare for every traveler?</p></article><article><span>04</span><b>Delegated authority</b><p>Will the agent ask first, and can it be paused at any point?</p></article></section>
    <section class="story-section story-principle"><div><span class="story-index">THE PRODUCT PRINCIPLE</span><h2>Make the agent’s authority visible at every step.</h2></div><p>Trust comes from showing specific evidence, setting explicit boundaries, and giving travelers a clear way to stop or change course.</p></section>
    <section class="story-section"><div class="story-section-heading"><span class="story-index">02 / HOW I STRUCTURED THE DESIGN</span><h2>From one search screen to the full responsibility of a trip.</h2></div><div class="story-process">
      <article><div class="story-step-number">01</div><div><h3>Frame the high-stakes questions</h3><p>Map uncertainty before, during, and after a purchase: total price, fare rules, seat availability, permission, and what happens when a booking result is unclear.</p><span class="story-output">Output · a trust and decision problem</span></div></article>
      <article><div class="story-step-number">02</div><div><h3>Separate limits from preferences</h3><p>Make the budget, layover cap, journey time, exclusions, and group seat count enforceable limits. Keep departure timing, baggage choice, and refund preference visible as configurable trip needs.</p><span class="story-output">Output · clear trip rules and permission modes</span></div></article>
      <article><div class="story-step-number">03</div><div><h3>Design monitoring as an ongoing relationship</h3><p>Give the traveler a multi-trip watchlist and a detailed trip view with fare history, sources and retrieval times, seat counts, status, alert preferences, and controls to pause or edit.</p><span class="story-output">Output · a persistent, inspectable dashboard</span></div></article>
      <article><div class="story-step-number">04</div><div><h3>Design the failure paths before calling it done</h3><p>Show what happens when a fare disappears, exceeds the budget, has too few seats, has unverified conditions, or returns an uncertain booking result. Stop, explain the impact, and offer a next action.</p><span class="story-output">Output · recovery and cancellation flows</span></div></article>
      <article><div class="story-step-number">05</div><div><h3>Make the prototype usable end to end</h3><p>Connect trip setup, monitoring, comparison, approval, revalidation, confirmation, and cancellation. Keep settings and progress saved locally so a reviewer can leave and return.</p><span class="story-output">Output · a navigable product prototype</span></div></article>
    </div></section>
    <section class="story-section story-journey-section"><div class="story-section-heading"><span class="story-index">03 / THE EXPERIENCE</span><h2>Permission follows the traveler through the whole journey.</h2></div><div class="story-journey"><article><span>01 · SET UP</span><b>Define the trip</b><p>Dates, travelers, cabin, hard limits, preferences, and monitoring end date.</p></article><i aria-hidden="true">→</i><article><span>02 · MONITOR</span><b>See what is happening</b><p>Multiple destinations, price context, source records, seat counts, and pause controls.</p></article><i aria-hidden="true">→</i><article><span>03 · DECIDE</span><b>Understand the trade-off</b><p>Compare the total and itinerary; see observed facts separately from uncertain forecasts.</p></article><i aria-hidden="true">→</i><article><span>04 · AUTHORIZE</span><b>Recheck before action</b><p>Revalidate price, seats, itinerary, and fare terms. Any changed limit stops the booking.</p></article><i aria-hidden="true">→</i><article><span>05 · MANAGE</span><b>Know what comes next</b><p>Review confirmation, cancellation rules, refund estimates, and status checks.</p></article></div></section>
    <section class="story-section story-decisions"><div class="story-section-heading"><span class="story-index">04 / KEY DESIGN DECISIONS</span><h2>Small interface choices carry the trust model.</h2></div><div class="story-decision-grid"><article><span class="decision-symbol">01</span><h3>Approval is the default</h3><p>“Find options and ask before booking” is the starting mode. Automatic booking takes an explicit choice and a reviewable summary of what is allowed.</p></article><article><span class="decision-symbol">02</span><h3>No silent substitutions</h3><p>If price, itinerary, seat count, baggage, or refund conditions change or cannot be verified, the agent stops and asks.</p></article><article><span class="decision-symbol">03</span><h3>Evidence beats reassurance</h3><p>The interface shows where fare information came from and when it was retrieved, then states what is known and what is uncertain.</p></article><article><span class="decision-symbol">04</span><h3>Design for the whole party</h3><p>Passenger counts and fare-level seat availability are compared directly, so a family is not told a fare works when it cannot seat everyone.</p></article></div></section>
    <section class="story-section story-reflection"><div><span class="story-index">05 / WHAT I WOULD VALIDATE NEXT</span><h2>The next step is testing whether the boundaries feel as clear as they look.</h2></div><div><p>With travelers, I would test whether people can explain the difference between a preference and a hard limit, predict what the agent will do after a fare change, and understand seat availability for a family.</p><p>I would also validate source freshness, alert timing, and the exact cancellation language before connecting any live fare or booking service.</p><div class="story-scope-note"><b>Prototype scope</b><span>Flight results and booking outcomes are illustrative. Trip state is saved in this browser. Live airline inventory, ticketing, payments, and background fare monitoring are not connected.</span></div><button type="button" class="primary-button" data-action="nav" data-screen="dashboard">Return to My trips <span aria-hidden="true">→</span></button></div></section>
  </section>`;
}
function render() {
  document.querySelector('.app-shell')?.classList.toggle('welcome-screen', state.screen === 'welcome');
  const views = { welcome: welcomeView, setup: setupView, dashboard: tripsListView, 'product-story': productStoryView, 'trip-detail': dashboardView, decision: decisionView, review: bookingReviewView, grace: graceView, processing: processingView, exception: scenarioView, booked: bookedView, 'cancel-review': cancelReviewView, 'cancel-process': () => `<section class="view"><div class="big-state"><span class="state-symbol">…</span><h1>Cancellation request in progress</h1><p class="lead">Your request is being checked. Keep this page open or return later; the result is saved on this device.</p><div class="state-actions">${button('Check cancellation status', 'verify-cancel')}${button('Back to trip', 'dashboard', 'secondary-button')}</div></div></section>`, 'cancel-success': () => cancelResultView(true), 'cancel-failure': () => cancelResultView(false) };
  app.innerHTML = (views[state.screen] || welcomeView)();
  if (state.showRemoveTrackingConfirm) app.insertAdjacentHTML('beforeend', removeTrackingDialog());
  if (state.showRemoveTrackingConfirm) app.querySelector('[data-remove-cancel]')?.focus();
  const activeNav = state.screen === 'setup' ? (state.editing ? 'setup' : 'new-trip') : ['trip-detail', 'decision', 'review', 'grace', 'processing', 'booked', 'cancel-review', 'cancel-process', 'cancel-success', 'cancel-failure'].includes(state.screen) ? 'decision' : state.screen === 'product-story' ? 'product-story' : state.screen === 'dashboard' || state.screen === 'exception' ? 'dashboard' : '';
  document.querySelectorAll('.primary-nav [data-action="nav"]').forEach(link => {
    const active = link.dataset.screen === activeNav;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const backScreens = ['setup','decision','review','exception','booked','cancel-review','cancel-success','cancel-failure'];
  if (backScreens.includes(state.screen)) app.innerHTML = app.innerHTML.replace(/(<section class="view[^"]*">)/, '$1<div class="page-back"><button type="button" class="back-button" data-action="back"><span aria-hidden="true">&larr;</span> Back</button></div>');
  if (state.screen === 'grace') tickGrace();
  sendAvailabilityAlertIfNeeded();
}
function tickGrace() {
  const counter = document.querySelector('#grace-count');
  if (!counter) return;
  const remaining = Math.max(0, Math.ceil((state.graceEndsAt - Date.now()) / 1000));
  counter.textContent = `${remaining}s`;
  if (remaining > 0) setTimeout(tickGrace, 300);
  else if (!state.bookingAttempted) submitBooking();
}
function valuesFrom(form) { const data = new FormData(form); for (const [key, value] of data.entries()) { if (Object.prototype.hasOwnProperty.call(state.settings, key)) state.settings[key] = String(value).trim(); } state.settings.travelers = String(partyCounts(state.settings).total); }
function setupError(message) { const el = document.querySelector('.setup-error'); if (el) el.textContent = message; }
function nextSetup() {
  if (state.step === 0) {
    const form = document.querySelector('.setup-layout .surface');
    state.settings.origin = document.querySelector('#origin').value.trim(); state.settings.destination = document.querySelector('#destination').value.trim(); state.settings.departDate = document.querySelector('#departDate').value; state.settings.returnDate = document.querySelector('#returnDate').value;
    state.settings.flexibleDays = document.querySelector('#flexibleDays').value.replace(' days', ''); state.settings.adults = document.querySelector('#adults').value; state.settings.children = document.querySelector('#children').value; state.settings.travelers = String(partyCounts(state.settings).total); state.settings.cabin = document.querySelector('#cabin').value;
    if (!state.settings.origin || !state.settings.destination) return setupError('Enter both a departure and destination.');
    if (!state.settings.departDate || !state.settings.returnDate || state.settings.returnDate <= state.settings.departDate) return setupError('Choose a return date after the departure date.');
  } else if (state.step === 1) {
    const form = document.querySelector('#limits-form'); valuesFrom(form);
    state.settings.budget = state.settings.budget.replace(/[^\d.]/g, ''); state.settings.maxStops = state.settings.maxStops.split(' ')[0]; state.settings.maxHours = state.settings.maxHours.replace(' hours', '');
    if (!(Number(state.settings.budget) > 0)) return setupError('Enter a budget greater than zero.');
    if (state.settings.monitorUntil < new Date().toISOString().slice(0, 10)) return setupError('Choose a monitoring end date in the future.');
  }
  state.step = Math.min(2, state.step + 1); state.consent = false; save(); render();
}
function startMonitoring() {
  const permission = document.querySelector('input[name="permission"]:checked');
  const monitor = document.querySelector('#monitorUntil');
  const consent = document.querySelector('input[name="consent"]');
  if (monitor) state.settings.monitorUntil = monitor.value;
  if (permission) state.settings.permission = permission.value;
  if (!consent?.checked) return setupError('Review the limits and check the authorization box to continue.');
  if (state.settings.monitorUntil < new Date().toISOString().slice(0, 10)) return setupError('Choose a monitoring end date in the future.');
  if (state.editing) { state.editing = false; state.paused = false; state.status = 'Monitoring'; state.scenario = 'happy'; state.revisedApproved = false; state.total = bestFlight() ? flightTotal(bestFlight()) : 0; log('Trip limits updated', `The trip rules were reviewed again. Permission: ${permissionName()}.`); state.screen = 'dashboard'; notify('Trip limits saved.'); }
  else { state.createdAt = new Date().toISOString(); state.paused = false; state.status = 'Monitoring'; state.lastCheckAt = new Date().toISOString(); state.total = bestFlight() ? flightTotal(bestFlight()) : 0; state.screen = 'dashboard'; seedActivityHistory(); log('Monitoring started', `Watching ${state.settings.origin} to ${state.settings.destination} under your saved limits.`); log(bestFlight() ? 'First fare check complete' : 'No qualifying fare found', bestFlight() ? 'A qualifying available fare was found. No booking was made.' : 'Every hard limit remains in force. No booking was made.'); log('Permission recorded', permissionName()); }
  save(); render();
}
function beginGrace() { state.graceEndsAt = Date.now() + 15000; state.screen = 'grace'; state.status = 'Booking'; log('Final fare check passed', `${money(state.total)} total, within the saved limits.`); save(); render(); }
function submitBooking() {
  if (state.bookingAttempted) return notify('This booking attempt is locked until its status is verified.');
  if (Number(state.seatsRemaining) < travelerCount()) { state.scenario = 'insufficient-seats'; state.status = 'Paused'; state.screen = 'exception'; log('Booking stopped at seat validation', `${state.seatsRemaining} seats remain at this fare; ${partySummary()} needs ${travelerCount()}.`); save(); return render(); }
  if (!bestFlight() || selectedTotal() > Number(state.settings.budget)) { state.scenario = 'no-options'; state.status = 'Paused'; state.screen = 'exception'; log('Booking stopped at final validation', 'The current fare no longer meets every hard limit.'); save(); return render(); }
  if (state.scenario === 'fare-gone' || state.scenario === 'over-budget' || state.scenario === 'no-options' || state.scenario === 'unknown-terms') { state.screen = 'exception'; state.status = 'Paused'; save(); return render(); }
  if (state.scenario === 'price-increase' && state.settings.permission !== 'automatic' && !state.revisedApproved) { state.screen = 'exception'; state.status = 'Awaiting approval'; save(); return render(); }
  if (state.scenario === 'price-increase' && !state.revisedApproved) { state.total = revisedFare(); state.revisedApproved = true; log('Fare revalidated at revised total', `${money(state.total)} remains under the saved ${money(Number(state.settings.budget))} budget.`); }
  state.bookingAttempted = true; state.status = 'Booking';
  if (state.scenario === 'timeout') { state.paymentStatus = 'unknown'; state.screen = 'exception'; log('booking response timed out', 'A duplicate attempt is blocked until verification. No charge was made.'); save(); render(); return; }
  state.screen = 'processing'; log(' booking submitted', 'Booking details were not confirmed.'); save(); render(); setTimeout(() => { if (state.screen === 'processing' && !state.bookingCompleted) verifyBooking(); }, 1100);
}
function verifyBooking() {
  if (!state.bookingAttempted) { state.bookingAttempted = true; state.paymentStatus = 'unknown'; }
  state.bookingCompleted = true; state.bookingRef = state.bookingRef || 'WN-7K4P2A'; state.status = 'Booked'; state.screen = 'booked'; state.paymentStatus = 'none · '; log('booking status verified', `Booking reference ${state.bookingRef}; booking status is still being checked.`); state.scenario = 'happy'; save(); render();
}
function afterCancel() { setTimeout(() => { if (state.screen !== 'cancel-process') return; if (state.scenario === 'cancel-failed') { state.screen = 'cancel-failure'; state.cancelCompleted = false; log('Cancellation status unclear', 'The ticket remains active until verified.'); } else { state.screen = 'cancel-success'; state.cancelCompleted = true; state.status = 'Cancelled'; log(' cancellation confirmed', 'The refund estimate is shown; no actual ticket or refund exists.'); } save(); render(); }, 950); }
function verifyCancel() { if (state.scenario === 'cancel-failed') { state.scenario = 'happy'; state.screen = 'cancel-success'; state.cancelCompleted = true; state.status = 'Cancelled'; log('Cancellation status verified', 'The  ticket cancellation is confirmed; the refund has not been issued.'); } else { state.screen = 'cancel-success'; state.cancelCompleted = true; state.status = 'Cancelled'; } save(); render(); }
function recoverWatch() { state.scenario = 'happy'; state.paused = false; state.status = 'Monitoring'; state.screen = 'dashboard'; state.lastCheckAt = new Date().toISOString(); log('Monitoring resumed', 'The agent is watching under the same limits.'); save(); render(); }
function editLimits() { state.editing = true; state.step = 1; state.screen = 'setup'; state.consent = false; save(); render(); }
function saveCurrentTrip() { const current = { ...state }; delete current.savedTrips; current.screen = 'dashboard'; current.step = 0; current.editing = false; current.consent = false; current.scenario = 'happy'; current.tripId ||= `trip-${Date.now()}`; return current; }
function startNewTrip() { const savedTrips = [...(state.savedTrips || [])]; const removedTripIds = [...(state.removedTripIds || [])]; let returnTripId = null; if (state.createdAt) { const active = saveCurrentTrip(); returnTripId = active.tripId; if (!savedTrips.some(trip => trip.tripId === active.tripId)) savedTrips.unshift(active); } state = freshState(); state.savedTrips = savedTrips; state.removedTripIds = removedTripIds; state.returnTripId = returnTripId; state.settings = { ...defaults }; state.screen = 'setup'; state.step = 0; state.status = 'Not started'; state.createdAt = null; state.lastCheckAt = null; state.log = []; state.paused = false; state.bookingAttempted = false; state.bookingCompleted = false; state.bookingRef = ''; state.cancelSubmitted = false; state.cancelCompleted = false; state.revisedApproved = false; state.total = 858; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); }
function openSavedTrip(tripId) { const savedTrips = [...(state.savedTrips || [])]; const removedTripIds = [...(state.removedTripIds || [])]; const index = savedTrips.findIndex(trip => trip.tripId === tripId); if (index < 0) return; const selected = savedTrips[index]; savedTrips.splice(index,1); if (state.createdAt && state.tripId !== selected.tripId) savedTrips.unshift(saveCurrentTrip()); state = { ...freshState(), ...selected, screen: 'trip-detail', savedTrips, removedTripIds }; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); }
function removeSelectedTrip() {
  const removedId = state.tripId;
  const removedTripIds = [...new Set([...(state.removedTripIds || []), removedId])];
  const remaining = (state.savedTrips || []).filter(trip => trip.tripId !== removedId && !removedTripIds.includes(trip.tripId));
  state.showRemoveTrackingConfirm = false;
  if (remaining.length) {
    const nextTrip = remaining.shift();
    state = { ...freshState(), ...nextTrip, screen: 'dashboard', savedTrips: remaining, removedTripIds, sampleTripsAdded: true };
  } else {
    state = { ...freshState(), settings: { ...defaults }, screen: 'dashboard', status: 'Not started', createdAt: null, log: [], paused: false, savedTrips: [], removedTripIds, sampleTripsAdded: true };
  }
  save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function toggleTripMonitoring(tripId) {
  let trip, isCurrent = tripId === state.tripId;
  if (isCurrent) {
    trip = state;
    state.paused = !state.paused;
    state.status = state.paused ? 'Paused' : 'Monitoring';
    log(state.paused ? 'Monitoring paused' : 'Monitoring resumed', state.paused ? 'Fare checks and booking actions are paused until you resume.' : 'Fare checks have resumed under the same saved limits.');
  } else {
    trip = (state.savedTrips || []).find(item => item.tripId === tripId);
    if (!trip) return;
    trip.paused = !trip.paused;
    trip.status = trip.paused ? 'Paused' : 'Monitoring';
    trip.log = Array.isArray(trip.log) ? trip.log : [];
    trip.log.unshift({ title: trip.paused ? 'Monitoring paused' : 'Monitoring resumed', detail: trip.paused ? 'Fare checks and booking actions are paused until you resume.' : 'Fare checks have resumed under the same saved limits.', at: new Date().toISOString() });
    trip.log = trip.log.slice(0, 8);
  }
  const paused = Boolean(trip.paused), route = `${cityFrom(trip.settings?.origin || state.settings.origin)} → ${cityFrom(trip.settings?.destination || state.settings.destination)}`;
  [...(app.querySelectorAll?.('.monitor-toggle') || [])].filter(toggle => toggle.dataset.tripId === tripId).forEach(toggle => {
    toggle.classList.toggle('is-on', !paused);
    toggle.setAttribute('aria-checked', String(!paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} monitoring for ${route}`);
    if (toggle.lastElementChild) toggle.lastElementChild.textContent = paused ? 'Paused' : 'Monitoring';
  });
  const headerPill = app.querySelector?.('.dashboard-top .status-block .status-pill');
  if (headerPill && isCurrent) {
    const end = new Date(`${state.settings.monitorUntil}T23:59:00`), ended = !Number.isNaN(+end) && end < TODAY;
    headerPill.classList.toggle('paused', paused);
    headerPill.classList.toggle('warn', !paused && !bestFlight());
    headerPill.textContent = paused ? 'Paused' : ended ? 'Monitoring ended' : bestFlight() ? state.status : 'No qualifying fare';
  }
  const monitoringPanel = app.querySelector?.('.dashboard-side > .surface:last-child .permission-box');
  if (monitoringPanel && isCurrent) {
    const end = new Date(`${state.settings.monitorUntil}T23:59:00`), ended = !Number.isNaN(+end) && end < TODAY;
    const title = monitoringPanel.querySelector('b'), copy = monitoringPanel.querySelector('p');
    if (title) title.textContent = paused ? 'Checks are paused' : ended ? 'Monitoring window ended' : 'Monitoring is active';
    if (copy) copy.textContent = paused ? 'No fare checks or booking actions will run until you resume.' : ended ? 'No further checks will run. Set a new end date to continue.' : `The agent stops on ${fmtDate(state.settings.monitorUntil)} if no fare qualifies. It will not relax your limits.`;
  }
  const activeCount = [...(state.savedTrips || []), ...(state.createdAt ? [{ status: state.status, paused: state.paused }] : [])].filter(item => !item.paused && ['Monitoring', 'Searching', 'Awaiting approval'].includes(item.status)).length;
  const summary = app.querySelector?.('.destination-summary span');
  if (summary) summary.textContent = `${activeCount} monitoring`;
  const oldTimeline = app.querySelector?.('.dashboard-main .timeline');
  if (oldTimeline && typeof document.createElement === 'function') { const holder = document.createElement('div'); holder.innerHTML = timeline(); oldTimeline.replaceWith(holder.firstElementChild); }
  save();
}
function handleAction(action, target) {
  switch (action) {
    case 'home': setScreen('dashboard'); break;
    case 'toggle-account-menu': { const menu = document.getElementById('account-menu'), trigger = document.querySelector('[data-action="toggle-account-menu"]'); if (!menu || !trigger) break; menu.hidden = !menu.hidden; trigger.setAttribute('aria-expanded', String(!menu.hidden)); if (!menu.hidden) menu.querySelector('[role="menuitem"]')?.focus(); break; }
    case 'account-section': { const menu = document.getElementById('account-menu'), trigger = document.querySelector('[data-action="toggle-account-menu"]'); if (menu) menu.hidden = true; trigger?.setAttribute('aria-expanded', 'false'); trigger?.focus(); notify(`${target.dataset.section} isn't available here yet.`); break; }
    case 'back': if (state.screen === 'trip-detail') { state.returnToTripDetail = false; setScreen('dashboard'); } else if (state.screen === 'setup') { if (state.step > 0) { state.step--; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); } else if (state.returnTripId) openSavedTrip(state.returnTripId); else setScreen('dashboard'); } else if (state.screen === 'decision') setScreen(state.returnToTripDetail ? 'trip-detail' : 'dashboard'); else if (state.screen === 'exception' || state.screen === 'booked' || state.screen === 'cancel-success') setScreen('dashboard'); else if (state.screen === 'review') setScreen('decision'); else if (state.screen === 'cancel-review' || state.screen === 'cancel-failure') setScreen('booked'); break;
    case 'new-trip': if (state.screen === 'setup' && !state.editing) { state.step = 0; save(); render(); } else startNewTrip(); break;
    case 'open-current-trip': setScreen('trip-detail'); break;
    case 'open-saved-trip': openSavedTrip(target.dataset.tripId); break;
    case 'request-remove-tracking': state.showRemoveTrackingConfirm = true; render(); break;
    case 'toggle-flight-alerts': toggleFlightAlerts(); break;
    case 'toggle-trip-monitoring': toggleTripMonitoring(target.dataset.tripId); break;
    case 'cancel-remove-tracking': state.showRemoveTrackingConfirm = false; render(); app.querySelector('[data-action="request-remove-tracking"]')?.focus(); break;
    case 'confirm-remove-tracking': removeSelectedTrip(); break;
    case 'begin': state.step = 0; state.editing = false; setScreen('setup'); break;
    case 'trip-dashboard': state.status = 'Monitoring'; state.createdAt ||= new Date().toISOString(); state.lastCheckAt ||= new Date().toISOString(); if (!state.log.length) seedActivityHistory(); setScreen('dashboard'); break;
    case 'nav': if (target.dataset.screen === 'decision') state.returnToTripDetail = state.screen === 'trip-detail'; if (target.dataset.screen === 'dashboard') state.returnToTripDetail = false; if (target.dataset.screen === 'setup') { state.step = Number(target.dataset.step || 1); state.editing = Boolean(state.createdAt) && !(state.screen === 'setup' && !state.editing); if (state.editing) state.consent = false; } setScreen(target.dataset.screen); break;
    case 'setup-next': nextSetup(); break;
    case 'setup-back': state.step = Math.max(0, state.step - 1); save(); render(); break;
    case 'start-monitoring': startMonitoring(); break;
    case 'dashboard': setScreen('dashboard'); break;
    case 'decision': state.returnToTripDetail = state.screen === 'trip-detail'; setScreen('decision'); break;
    case 'select-flight': { const candidate = matchingFlights().find(f => f.id === target.dataset.flight); if (!candidate) { notify('That available fare no longer meets your saved rules.'); break; } state.selectedFlightId = candidate.id; state.total = flightTotal(candidate); state.revisedApproved = false; state.scenario = 'happy'; save(); setScreen('decision'); break; }
    case 'review-booking': if (state.bookingAttempted) { notify('Check the current booking status before another attempt.'); break; } if (!bestFlight() || selectedTotal() > Number(state.settings.budget)) { state.scenario = 'no-options'; state.status = 'Paused'; state.screen = 'exception'; save(); render(); break; } if (Number(state.seatsRemaining) < travelerCount()) { state.scenario = 'insufficient-seats'; state.status = 'Paused'; state.screen = 'exception'; log('Booking stopped at seat validation', `${state.seatsRemaining} seats remain at this fare; ${partySummary()} needs ${travelerCount()}.`); save(); render(); break; } state.status = 'Awaiting approval'; setScreen('review'); break;
    case 'keep-watching': state.scenario = 'happy'; state.status = 'Monitoring'; log('Recommendation saved', 'Monitoring continues under the same limits.'); setScreen('dashboard'); break;
    case 'edit-limits': editLimits(); break;
    case 'edit-travelers': state.editing = true; state.step = 0; state.consent = false; state.screen = 'setup'; save(); render(); break;
    case 'start-grace': if (state.bookingAttempted) { notify('This booking attempt is locked until verified.'); break; } beginGrace(); break;
    case 'stop-booking': if (state.bookingAttempted) { notify('The stop window has ended. Verify the booking status.'); break; } state.status = 'Monitoring'; state.screen = 'dashboard'; state.scenario = 'happy'; log('Booking stopped during grace period', 'No booking was submitted.'); save(); render(); notify('Booking stopped. Monitoring remains active.'); break;
    case 'submit-booking': submitBooking(); break;
    case 'verify-booking': verifyBooking(); break;
    case 'pause': state.paused = true; state.status = 'Paused'; log('Monitoring paused', 'No fare checks or booking actions will run until resumed.'); setScreen('dashboard'); break;
    case 'resume': recoverWatch(); break;
    case 'revoke': state.settings.permission = 'approval'; state.status = 'Monitoring'; log('Automatic booking permission revoked', 'The agent now asks before every booking.'); setScreen('dashboard'); notify('Booking permission revoked.'); break;
    case 'recover-watch': recoverWatch(); break;
    case 'auto-reprice': state.total = revisedFare(); if (state.total > Number(state.settings.budget)) { state.scenario = 'over-budget'; state.status = 'Paused'; setScreen('exception'); break; } state.revisedApproved = true; state.lastCheckAt = new Date().toISOString(); log('Revised fare checked', `${money(state.total)} remains under the authorized budget; every other condition still matches.`); beginGrace(); break;
    case 'approve-reprice': state.total = revisedFare(); if (state.total > Number(state.settings.budget)) { state.scenario = 'over-budget'; state.status = 'Paused'; setScreen('exception'); break; } state.revisedApproved = true; state.status = 'Awaiting approval'; log('Revised total approved', `The traveler reviewed and accepted the new ${money(state.total)} total.`); setScreen('review'); break;
    case 'pause-dashboard': state.paused = true; state.status = 'Paused'; setScreen('dashboard'); break;
    case 'cancel-review': setScreen('cancel-review'); break;
    case 'booked': setScreen('booked'); break;
    case 'confirm-cancel': if (state.cancelSubmitted && !state.cancelCompleted) { notify('Cancellation is already in progress. Verify its status first.'); break; } state.cancelSubmitted = true; state.screen = 'cancel-process'; log('Cancellation request submitted', 'available fare rules and refund estimate were shown before confirmation.'); save(); render(); afterCancel(); break;
    case 'verify-cancel': verifyCancel(); break;
    case 'show-ticket': state.screen = 'booked'; state.scenario = 'happy'; save(); render(); break;
    default: break;
  }
}
app.addEventListener('click', (event) => { if (event.target.matches('[data-remove-backdrop]')) { handleAction('cancel-remove-tracking', event.target); return; } const target = event.target.closest('[data-action]'); if (!target) return; event.preventDefault(); handleAction(target.dataset.action, target); });
document.addEventListener?.('keydown', (event) => {
  if (event.key === 'Escape' && !state.showRemoveTrackingConfirm) { const menu = document.getElementById('account-menu'), trigger = document.querySelector('[data-action="toggle-account-menu"]'); if (menu && !menu.hidden) { menu.hidden = true; trigger?.setAttribute('aria-expanded', 'false'); trigger?.focus(); } return; }
  if (!state.showRemoveTrackingConfirm) return;
  if (event.key === 'Escape') { event.preventDefault(); handleAction('cancel-remove-tracking'); return; }
  if (event.key === 'Tab') {
    const controls = [...app.querySelectorAll('.tracking-dialog button')];
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
const headerEl = document.querySelector('.app-header');
if (headerEl) headerEl.addEventListener('click', (event) => { const target = event.target.closest('[data-action]'); if (!target) return; event.preventDefault(); handleAction(target.dataset.action, target); });
document.addEventListener?.('click', (event) => { const wrap = document.querySelector('.account-menu-wrap'), menu = document.getElementById?.('account-menu'), trigger = document.querySelector('[data-action="toggle-account-menu"]'); if (wrap && menu && !menu.hidden && !wrap.contains(event.target)) { menu.hidden = true; trigger?.setAttribute('aria-expanded', 'false'); } });
const CHAT_STORE_KEY = 'airscout-portfolio-assistant-chat-v1';
const assistantPanel = document.getElementById?.('assistant-panel');
const assistantFeed = document.getElementById?.('assistant-messages');
const assistantLauncher = document.querySelector('.assistant-launcher');
let assistantMessages = [];
try { assistantMessages = JSON.parse(localStorage.getItem(CHAT_STORE_KEY) || '[]'); } catch { assistantMessages = []; }
if (!Array.isArray(assistantMessages) || !assistantMessages.length) assistantMessages = [{ role: 'assistant', text: 'Hi John. I can summarize your watchlist, compare the fares you’re following, or help you start tracking a destination.', suggestions: [{ label: 'Show my trips', kind: 'query', value: 'Show my trips' }, { label: 'Which fare is lowest?', kind: 'query', value: 'Which fare is lowest?' }, { label: 'Suggest a destination', kind: 'query', value: 'Suggest a destination to follow' }] }];
function persistAssistantChat() { try { localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(assistantMessages.slice(-40))); } catch { /* Chat still works for this session if storage is unavailable. */ } }
function trackedTripsForChat() {
  const rows = [...(state.savedTrips || [])];
  if (state.createdAt && !rows.some(trip => trip.tripId === state.tripId)) rows.unshift({ tripId: state.tripId, settings: state.settings, status: state.status, paused: state.paused, total: selectedTotal(), trackedAirline: bestFlight()?.airline || '', current: true });
  return rows;
}
function assistantMoney(amount, currency = 'CAD') { return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0); }
function assistantAddMessage(role, text, suggestions = []) { assistantMessages.push({ role, text, suggestions }); assistantMessages = assistantMessages.slice(-40); persistAssistantChat(); renderAssistantChat(); }
function renderAssistantChat() {
  if (!assistantFeed) return;
  assistantFeed.innerHTML = assistantMessages.map(message => `<article class="assistant-message ${message.role === 'user' ? 'from-user' : 'from-agent'}"><p>${esc(message.text).replace(/\n/g, '<br>')}</p>${message.suggestions?.length ? `<div class="assistant-suggestions">${message.suggestions.map(item => item.kind === 'trip' ? `<button type="button" data-chat-action="open-trip" data-trip-id="${esc(item.tripId)}">${esc(item.label)}</button>` : item.kind === 'destination' ? `<button type="button" data-chat-action="follow-destination" data-destination="${esc(item.value)}">${esc(item.label)}</button>` : `<button type="button" data-chat-action="send-suggestion" data-query="${esc(item.value)}">${esc(item.label)}</button>`).join('')}</div>` : ''}</article>`).join('');
  assistantFeed.scrollTop = assistantFeed.scrollHeight;
}
function answerAssistant(query) {
  const q = query.toLowerCase(), trips = trackedTripsForChat();
  const routeFor = trip => `${cityFrom(trip.settings?.origin || '')} → ${cityFrom(trip.settings?.destination || '')}`;
  const getFare = trip => trip.current ? selectedTotal() : Number(trip.total) || 0;
  const suggestions = trips.slice(0, 5).map(trip => ({ label: `View ${cityFrom(trip.settings?.destination || 'trip')}`, kind: 'trip', tripId: trip.tripId }));
  if (/suggest|recommend|where|destination|follow/.test(q) && !/my trip|my destination|already/.test(q)) {
    const origin = cityFrom(state.settings.origin || defaults.origin);
    const untracked = ['New York (JFK)', 'London (LHR)', 'Rome (FCO)'].filter(destination => !trips.some(trip => cityFrom(trip.settings?.destination || '').toLowerCase() === cityFrom(destination).toLowerCase()));
    const picks = untracked.slice(0, 3).map(destination => ({ label: `Track ${cityFrom(destination)}`, kind: 'destination', value: destination }));
    assistantAddMessage('assistant', `You’re following ${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} from your watchlist. You can open one below, or start a new search from ${origin}. New trips begin in approval mode, and you’ll review the dates and limits before monitoring starts.`, [...suggestions.slice(0, 2), ...picks]);
    return;
  }
  if (/show|list|watchlist|following|track/.test(q) && trips.length) {
    const summary = trips.slice(0, 5).map(trip => `${routeFor(trip)} · ${assistantMoney(getFare(trip), trip.settings?.currency || 'CAD')} · ${trip.paused ? 'paused' : (trip.status || 'monitoring').toLowerCase()}`).join('\n');
    assistantAddMessage('assistant', `Here’s your current watchlist. Fares are the latest amounts shown in your trip list:\n${summary}`, suggestions);
    return;
  }
  const routeMatch = trips.find(trip => { const city = cityFrom(trip.settings?.destination || '').toLowerCase(); return city && q.includes(city); });
  if (routeMatch) {
    const s = routeMatch.settings || {}, status = routeMatch.paused ? 'paused' : (routeMatch.status || 'monitoring').toLowerCase();
    assistantAddMessage('assistant', `${routeFor(routeMatch)} is ${status}. The latest listed fare is ${assistantMoney(getFare(routeMatch), s.currency || 'CAD')} with ${routeMatch.trackedAirline || 'the currently listed airline'}; your total budget is ${assistantMoney(s.budget, s.currency || 'CAD')}. Dates: ${fmtDate(s.departDate)}–${fmtDate(s.returnDate)}.`, [{ label: `Open ${cityFrom(s.destination)}`, kind: 'trip', tripId: routeMatch.tripId }]);
    return;
  }
  if (/lowest|cheapest|best price|price/.test(q) && trips.length) {
    const cheapest = [...trips].sort((a, b) => getFare(a) - getFare(b))[0];
    assistantAddMessage('assistant', `The lowest listed fare in your watchlist is ${assistantMoney(getFare(cheapest), cheapest.settings?.currency || 'CAD')} for ${routeFor(cheapest)} (${cheapest.trackedAirline || 'listed airline'}). This is the latest amount saved for that trip, not a guarantee that the fare is still available.`, [{ label: `View ${cityFrom(cheapest.settings?.destination || 'trip')}`, kind: 'trip', tripId: cheapest.tripId }, ...suggestions.filter(item => item.tripId !== cheapest.tripId).slice(0, 2)]);
    return;
  }
  if (/airline|carrier/.test(q) && trips.length) {
    assistantAddMessage('assistant', `Airlines currently listed in your watchlist: ${[...new Set(trips.map(trip => trip.trackedAirline).filter(Boolean))].join(', ') || 'No airline is listed yet'}. Each trip’s details show the route and fare conditions.`, suggestions.slice(0, 3));
    return;
  }
  if (/budget|limit|allow/.test(q) && trips.length) {
    assistantAddMessage('assistant', `Your saved total budgets are:\n${trips.slice(0, 5).map(trip => `${routeFor(trip)} · ${assistantMoney(trip.settings?.budget, trip.settings?.currency || 'CAD')}`).join('\n')}\nThese are hard total limits for their respective trips.`, suggestions.slice(0, 3));
    return;
  }
  assistantAddMessage('assistant', trips.length ? 'I can look up a destination, compare the lowest listed fare, summarize your budgets, or suggest a trip to follow. What would you like to know?' : 'There are no destinations in your watchlist yet. Tell me where you want to go, or use the trip planner to set dates and limits.', [{ label: 'Show my trips', kind: 'query', value: 'Show my trips' }, { label: 'Suggest a destination', kind: 'query', value: 'Suggest a destination to follow' }]);
}
function submitAssistantMessage(value) { const query = String(value || '').trim(); if (!query) return; assistantAddMessage('user', query); window.setTimeout(() => answerAssistant(query), 180); }
renderAssistantChat();
document.querySelector('.assistant-widget')?.addEventListener('click', event => {
  const target = event.target.closest('[data-chat-action]'); if (!target) return;
  const action = target.dataset.chatAction;
  if (action === 'toggle' || action === 'close') { const open = action === 'toggle' && assistantPanel.hidden; assistantPanel.hidden = !open; assistantLauncher.setAttribute('aria-expanded', String(open)); if (open) document.getElementById('assistant-input')?.focus(); else assistantLauncher.focus(); }
  if (action === 'send-suggestion') submitAssistantMessage(target.dataset.query);
  if (action === 'open-trip') { const trip = trackedTripsForChat().find(item => item.tripId === target.dataset.tripId); if (trip?.current) setScreen('trip-detail'); else if (trip) openSavedTrip(trip.tripId); }
  if (action === 'follow-destination') { const destination = target.dataset.destination; assistantAddMessage('user', `I want to follow ${cityFrom(destination)}.`); assistantPanel.hidden = true; assistantLauncher.setAttribute('aria-expanded', 'false'); startNewTrip(); state.settings.origin = defaults.origin; state.settings.destination = destination; save(); render(); }
});
document.getElementById?.('assistant-form')?.addEventListener('submit', event => { event.preventDefault(); const input = document.getElementById?.('assistant-input'); if (!input) return; submitAssistantMessage(input.value); input.value = ''; input.focus(); });
document.addEventListener?.('keydown', event => { if (event.key === 'Escape' && assistantPanel && !assistantPanel.hidden && !state.showRemoveTrackingConfirm) { assistantPanel.hidden = true; assistantLauncher?.setAttribute('aria-expanded', 'false'); assistantLauncher?.focus(); } });
app.addEventListener('change', (event) => { if (event.target.name === 'permission') { document.querySelectorAll('.choice-card').forEach(card => card.classList.toggle('selected', card.querySelector('input').checked)); state.settings.permission = event.target.value; save(); } if (event.target.name === 'consent') { state.consent = event.target.checked; save(); } });
const scenarioSelect = document.querySelector('#scenario-select');
if (scenarioSelect) scenarioSelect.addEventListener('change', (event) => { state.scenario = event.target.value; if (state.scenario !== 'cancel-failed' && state.scenario !== 'timeout') { state.revisedApproved = false; state.total = bestFlight() ? flightTotal(bestFlight()) : 0; } if (state.scenario === 'happy') { state.screen = state.createdAt ? 'dashboard' : 'welcome'; state.status = state.createdAt ? 'Monitoring' : 'Not started'; } else if (state.scenario === 'timeout') { state.bookingAttempted = true; state.paymentStatus = 'unknown'; state.status = 'Booking'; state.screen = 'exception'; } else if (state.scenario === 'cancel-failed') { state.bookingCompleted = true; state.bookingRef ||= 'WN-7K4P2A'; state.cancelSubmitted = true; state.status = 'Booked'; state.screen = 'exception'; } else { state.status = state.scenario === 'price-increase' ? 'Awaiting approval' : 'Paused'; state.screen = 'exception'; } log('Trip status updated', state.scenario.replaceAll('-', ' ')); save(); render(); });
const previewScreen = new URLSearchParams(location.search).get('preview');
if (previewScreen) document.body.classList.add('portfolio-preview');
if (['welcome', 'setup', 'dashboard', 'decision', 'review', 'booked', 'exception'].includes(previewScreen)) state.screen = previewScreen;
if (state.screen === 'dashboard' && state.createdAt && !state.log.length) seedActivityHistory();
if (!localStorage.getItem(STORE_KEY)) save();
if (state.screen === 'processing') setTimeout(verifyBooking, 900);
if (state.screen === 'cancel-process') afterCancel();
render();
