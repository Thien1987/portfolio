/* Extra trip-maintenance workflows layered onto the core mobile prototype. */
if (!Array.isArray(s.receipts)) s.receipts = structuredClone(seed.receipts);
if (s.rentalReady === undefined) s.rentalReady = false;
if (s.boardingPass === undefined) s.boardingPass = false;
if (!s.mapRoute) s.mapRoute = s.acceptedRoute || 'bart';
if (s.directionStep === undefined) s.directionStep = 0;
if (s.directionsActive === undefined) s.directionsActive = false;

const dayformBaseRender = render;
const dayformBaseOpenSheet = openSheet;
render = function () {
  dayformBaseRender();
  renderExpenses();
};

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function mealTotal() {
  return s.receipts.reduce((total, receipt) => total + Number(receipt.amount || 0), 0);
}
let receiptPhotoPromise=null;
function compressReceiptPhoto(file) {
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/'))return reject(new Error('Choose an image file'));
    if(file.size>20*1024*1024)return reject(new Error('Choose an image smaller than 20 MB'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Could not read that image'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('Could not open that image'));
      image.onload=()=>{
        const scale=Math.min(1,1100/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
        try{resolve(canvas.toDataURL('image/jpeg',.72))}catch(error){reject(error)}
      };
      image.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function renderReceiptPhotoPreview() {
  const preview=document.getElementById('receiptPhotoPreview');if(!preview)return;
  const photo=s.receiptPhotoDraft;
  preview.innerHTML=photo?`<img src="${escapeText(photo)}" alt="Receipt photo preview"><button class="button" type="button" onclick="removeReceiptPhoto()">Remove photo</button>`:'<span class="receipt-photo-empty">No receipt photo added</span>';
}
function previewReceiptPhoto(input) {
  const file=input.files?.[0];if(!file)return;
  ['receiptPhotoLibrary','receiptPhotoCamera'].filter(id=>id!==input.id).forEach(id=>{const other=document.getElementById(id);if(other)other.value='';});
  s.receiptPhotoRemoved=false;
  const status=document.getElementById('receiptPhotoStatus');if(status)status.textContent='Preparing a smaller on-device copy…';
  renderReceiptPhotoPreview();
  receiptPhotoPromise=compressReceiptPhoto(file).then(photo=>{s.receiptPhotoDraft=photo;if(status)status.textContent='Photo ready · saved on this device';renderReceiptPhotoPreview();return photo;}).catch(error=>{receiptPhotoPromise=null;if(status)status.textContent=error.message;input.value='';toast(error.message);throw error;});
  receiptPhotoPromise.catch(()=>{});
}
function removeReceiptPhoto() {
  s.receiptPhotoDraft=null;s.receiptPhotoRemoved=true;receiptPhotoPromise=null;
  ['receiptPhotoLibrary','receiptPhotoCamera'].forEach(id=>{const input=document.getElementById(id);if(input)input.value='';});
  const status=document.getElementById('receiptPhotoStatus');if(status)status.textContent='Photo removed from this receipt';
  renderReceiptPhotoPreview();
}
function receiptInputDate(receipt) {
  const tripId=typeof getSelectedWorkTrip==='function'?getSelectedWorkTrip().id:'sfo';
  const year=tripId==='nyc'?2027:2026;
  const months={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  if(receipt?.date&&/^\d{4}-\d{2}-\d{2}$/.test(receipt.date))return receipt.date;
  if(receipt?.date){const match=receipt.date.match(/^([A-Z][a-z]{2})\s+(\d{1,2})$/);if(match&&months[match[1]])return `${year}-${months[match[1]]}-${String(match[2]).padStart(2,'0')}`;}
  return tripId==='sea'?'2026-12-02':tripId==='nyc'?'2027-01-13':'2026-11-18';
}
function renderExpenses() {
  const total = document.getElementById('mealTotal');
  if (total) total.textContent = '$' + mealTotal().toFixed(2);
  const list = document.getElementById('receiptList');
  if (!list) return;
  list.innerHTML = s.receipts.length ? s.receipts.slice().reverse().map(receipt =>
    `<button class="receipt-row action-row" onclick="editReceipt('${receipt.id}')"><span class="row-icon amber">$</span><span class="row-main"><strong>${escapeText(receipt.merchant)} · ${escapeText(receipt.category)}</strong><span>${escapeText(receipt.date)} · ${receipt.photo?'photo attached':'tap to edit or add photo'}</span></span><span class="receipt-amount">$${Number(receipt.amount).toFixed(2)}</span></button>`
  ).join('') : '<div class="history-line">No meal receipts yet. Add one as you go.</div>';
}

function editReceipt(id) {
  s.editingReceipt = id;
  openSheet('receipt-edit');
}
async function saveReceipt(event) {
  event.preventDefault();
  const merchant = document.getElementById('receiptMerchant').value.trim();
  const amount = Number(document.getElementById('receiptAmount').value);
  const category = document.getElementById('receiptCategory').value;
  const rawDate = document.getElementById('receiptDate').value;
  if (!merchant || !Number.isFinite(amount) || amount <= 0 || !rawDate) {
    toast('Add a merchant, valid amount, and date');
    return;
  }
  const submit=document.querySelector('#receiptForm button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Saving receipt…'}
  let photo=s.receiptPhotoRemoved?null:s.receiptPhotoDraft||null;
  try { if((document.getElementById('receiptPhotoLibrary')?.files?.[0]||document.getElementById('receiptPhotoCamera')?.files?.[0])&&receiptPhotoPromise)photo=await receiptPhotoPromise; }
  catch { if(submit){submit.disabled=false;submit.textContent=s.editingReceipt?'Save receipt changes':'Add to meal expenses'} return; }
  const date = new Date(rawDate + 'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'});
  const existing = s.receipts.find(receipt => receipt.id === s.editingReceipt);
  if (existing) Object.assign(existing, {merchant, amount, category, date, photo});
  else s.receipts.push({id:'meal-' + Date.now(), merchant, amount, category, date, photo});
  s.editingReceipt = null;
  s.receiptPhotoRemoved=false;receiptPhotoPromise=null;
  log(existing ? `Updated ${merchant} meal receipt` : `Logged ${merchant} meal · $${amount.toFixed(2)}`);
  save();
  render();
  closeSheet();
  toast(existing ? 'Receipt updated' : 'Meal receipt saved');
  announce('Meal expense total updated');
}
function deleteReceipt() {
  const receipt = s.receipts.find(item => item.id === s.editingReceipt);
  if (!receipt) return;
  s.receipts = s.receipts.filter(item => item.id !== receipt.id);
  s.editingReceipt = null;
  log(`Removed ${receipt.merchant} meal receipt`);
  save(); render(); closeSheet(); toast('Receipt removed');
}
function toggleBoardingPass() {
  s.boardingPass = !s.boardingPass;
  log(s.boardingPass ? 'Boarding pass marked ready' : 'Boarding pass unmarked');
  save(); render(); openSheet('flight');
  toast(s.boardingPass ? 'Boarding pass marked ready' : 'Boarding pass status cleared');
}
function toggleRentalReady() {
  s.rentalReady = !s.rentalReady;
  log(s.rentalReady ? 'Rental pickup details marked ready' : 'Rental pickup details unmarked');
  save(); render(); openSheet('rental');
  toast(s.rentalReady ? 'Rental details marked ready' : 'Rental status cleared');
}

function openSheet(type = 'agent') {
  if (type !== 'agent' && type !== 'voice' && type !== 'map' && type !== 'flight' && type !== 'rental' && type !== 'receipt' && type !== 'receipt-edit') {
    dayformBaseOpenSheet(type);
    return;
  }
  const title = document.getElementById('sheetTitle');
  const intro = document.getElementById('sheetIntro');
  const body = document.getElementById('sheetBody');

  if (type === 'agent') {
    dayformBaseOpenSheet('agent');
    body.insertAdjacentHTML('beforeend', `<div class="expense-summary"><strong>Meal expenses so far · $${mealTotal().toFixed(2)}</strong><br>${s.receipts.length} receipt${s.receipts.length === 1 ? '' : 's'} logged. I can keep the running total together with your travel details.<div class="direction-controls"><button class="button" onclick="openSheet('flight')">Flight ticket</button><button class="button" onclick="openSheet('rental')">Rental car</button></div><button class="button soft full" style="margin-top:7px" onclick="openSheet('receipt')">＋ Log a meal receipt</button><button class="button full" style="margin-top:7px" onclick="openSheet('map')">Open directions</button></div>`);
    return;
  }

  if (type === 'voice') {
    title.textContent = 'Talk to WorkPal';
    intro.textContent = 'A voice-first trip companion, from departure through the trip home.';
    body.innerHTML = `<div id="voiceOrb" class="voice-orb" aria-hidden="true"><span class="voice-bars"><i></i><i></i><i></i><i></i><i></i></span></div><p id="voiceStatus" class="voice-status" role="status" aria-live="polite">I’m here. What do you need?</p><p class="voice-hint">Tap the microphone and speak, or type a quick request. Voice recognition depends on your browser.</p><div class="voice-setting"><label for="voiceSelect">Spoken voice</label><select id="voiceSelect" aria-label="Choose spoken voice" onchange="setWorkPalVoice(this.value)"></select></div><button id="voiceMic" class="button primary full" style="min-height:52px;font-size:15px" onclick="startVoiceHelp()">🎙 &nbsp; Start talking</button><form class="voice-request" onsubmit="submitVoiceText(event)"><label class="sr" for="voiceText">Ask WorkPal for help</label><input id="voiceText" autocomplete="off" placeholder="e.g. How do I get to my meeting?" /><button class="button" type="submit">Ask</button></form><div id="voiceAnswer" aria-live="polite"></div><div class="voice-shortcuts" aria-label="Common travel help"><button class="button" onclick="answerVoice('flight')">Flight details</button><button class="button" onclick="answerVoice('directions')">Directions</button><button class="button" onclick="answerVoice('schedule')">Next meeting</button><button class="button" onclick="answerVoice('expense')">Log a meal</button></div><p class="receipt-footnote">I can help with your flights, meetings, directions, and expenses. Speech recognition availability varies by browser.</p>`;
    document.getElementById('sheetBackdrop').classList.add('open');
    loadWorkPalVoices();
    setTimeout(() => document.getElementById('voiceMic')?.focus(), 50);
    return;
  }

  if (type === 'flight') {
    const trip = typeof getSelectedWorkTrip === 'function' ? getSelectedWorkTrip() : null;
    const flight = trip?.flight || {carrier:'Air Canada',code:'AC 778',booking:'P6K2QR',record:'AC · ends 42Q',seat:'14A · window',depart:'YYZ · Terminal 1 · 7:15 AM',arrive:'SFO · Terminal 2 · 9:45 AM',baggage:'1 checked · 1 carry-on'};
    title.textContent = `Flight ticket · ${flight.code}`;
    intro.textContent = `${trip?.city || 'San Francisco'} outbound · ${trip?.dates?.split(' · ')[0] || 'Wednesday, November 18'} · reservation saved`;
    body.innerHTML = `<div class="ticket-code">${flight.booking}</div><div class="detail-grid"><div class="detail-cell"><span>PASSENGER</span><b>Jamie Chen</b></div><div class="detail-cell"><span>SEAT</span><b>${flight.seat}</b></div><div class="detail-cell"><span>DEPARTURE</span><b>${flight.depart}</b></div><div class="detail-cell"><span>ARRIVAL</span><b>${flight.arrive}</b></div><div class="detail-cell"><span>BAGGAGE</span><b>${flight.baggage}</b></div><div class="detail-cell"><span>RECORD LOCATOR</span><b>${flight.record}</b></div></div><div class="status-note">${flight.carrier} · Check-in opens 24 hours before departure. Use your airline app for gate and delay updates.</div><button class="button ${s.boardingPass ? 'soft' : 'primary'} full" onclick="toggleBoardingPass()">${s.boardingPass ? '✓ Boarding pass marked ready' : 'Mark boarding pass ready'}</button><button class="button full" style="margin-top:7px" onclick="openSheet('map')">Directions from ${trip?.destination?.name || 'SFO'} →</button>`;
  } else if (type === 'rental') {
    const trip = typeof getSelectedWorkTrip === 'function' ? getSelectedWorkTrip() : null;
    const rental = trip?.rental;
    title.textContent = rental ? `Rental car · ${rental.provider}` : 'No rental car booked';
    intro.textContent = rental ? `${trip.city} · reservation details` : `${trip?.city || 'This trip'} · use the saved route options for local transfers`;
    body.innerHTML = rental ? `<div class="ticket-code">${rental.ref}</div><div class="detail-grid"><div class="detail-cell"><span>DRIVER</span><b>Jamie Chen</b></div><div class="detail-cell"><span>VEHICLE</span><b>${rental.vehicle}</b></div><div class="detail-cell"><span>PICK-UP</span><b>${rental.pickup}</b></div><div class="detail-cell"><span>RETURN</span><b>${rental.return}</b></div><div class="detail-cell"><span>LOCATION</span><b>${rental.provider} · ${rental.address}</b></div><div class="detail-cell"><span>ESTIMATE</span><b>${rental.estimate}</b></div></div><div class="status-note">Bring your driver’s licence and payment card. Fuel, insurance, and final charges are not included in this estimate.</div><button class="button ${s.rentalReady ? 'soft' : 'primary'} full" onclick="toggleRentalReady()">${s.rentalReady ? '✓ Pick-up details ready' : 'Mark pick-up details ready'}</button><button class="button full" style="margin-top:7px" onclick="openSheet('map')">Plan a route →</button>` : `<div class="status-note">No rental car is booked for this trip. Your hotel, airport transfer, and meetings are shown in this trip’s schedule.</div><button class="button primary full" onclick="openSheet('map')">See local route options</button>`;
  } else if (type === 'receipt' || type === 'receipt-edit') {
    if (type === 'receipt') s.editingReceipt = null;
    const old = s.receipts.find(item => item.id === s.editingReceipt);
    s.receiptPhotoDraft=old?.photo||null;s.receiptPhotoRemoved=false;receiptPhotoPromise=null;
    title.textContent = old ? 'Edit meal receipt' : 'Log a meal receipt';
    intro.textContent = 'Add the amount while it’s easy to find. Your running trip total updates on this device.';
    const isoDate=receiptInputDate(old);
    body.innerHTML = `<form id="receiptForm" class="expense-form" onsubmit="saveReceipt(event)"><div class="field"><label for="receiptMerchant">Restaurant or merchant</label><input id="receiptMerchant" required maxlength="80" placeholder="e.g. Harbor House" value="${old ? escapeText(old.merchant) : ''}"></div><div class="field"><label for="receiptAmount">Receipt total · USD</label><input id="receiptAmount" required type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" value="${old ? Number(old.amount).toFixed(2) : ''}"></div><div class="field"><label for="receiptCategory">Expense type</label><select id="receiptCategory"><option ${old?.category === 'Meal' ? 'selected' : ''}>Meal</option><option ${old?.category === 'Client meal' ? 'selected' : ''}>Client meal</option><option ${old?.category === 'Coffee' ? 'selected' : ''}>Coffee</option></select></div><div class="field"><label for="receiptDate">Receipt date</label><input id="receiptDate" type="date" value="${isoDate}"></div><div class="field"><span class="field-label">Receipt photo</span><div class="receipt-photo-actions"><button class="button receipt-photo-action" type="button" onclick="document.getElementById('receiptPhotoLibrary').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM7 16l3.2-3.5 2.4 2.4 1.8-1.8L18 17H7zm2-7.5a1 1 0 1 0 0 .01z"/></svg><span>Add photo</span></button><button class="button receipt-photo-action" type="button" onclick="document.getElementById('receiptPhotoCamera').click()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 6.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.5L16 5zm4 12.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg><span>Take photo</span></button></div><input class="sr" id="receiptPhotoLibrary" type="file" accept="image/*" onchange="previewReceiptPhoto(this)"><input class="sr" id="receiptPhotoCamera" type="file" accept="image/*" capture="environment" onchange="previewReceiptPhoto(this)"><div id="receiptPhotoPreview" class="receipt-photo-preview"></div><span id="receiptPhotoStatus" class="receipt-photo-status" role="status">${old?.photo?'Existing receipt photo · stored on this device':'Choose an image or use your camera.'}</span></div><div class="status-note">Receipt details and a resized photo copy are saved on this device.</div><button class="button primary full" type="submit">${old ? 'Save receipt changes' : 'Add to meal expenses'}</button>${old ? '<button class="button warning full" style="margin-top:7px" type="button" onclick="deleteReceipt()">Remove receipt</button>' : ''}</form>`;
    renderReceiptPhotoPreview();
  } else if (type === 'map') {
    const trip = typeof getSelectedWorkTrip === 'function' ? getSelectedWorkTrip() : {city:'San Francisco',office:'Northstar office',officeAddress:'100 First Street'};
    title.textContent = `Directions to ${trip.office}`;
    intro.textContent = `${trip.officeAddress} · ${trip.city}`;
    body.innerHTML = `<div class="route-destination-card"><span class="row-icon green">⌖</span><div><span class="overline">DESTINATION</span><strong>${trip.office}</strong><p>${trip.officeAddress} · ${trip.city}</p></div></div><div class="status-note live-nav-privacy">Location permission is required. Your location is shared with our routing provider while directions are active; tracking stops when you close navigation.</div><button class="button primary full live-nav-launch" onclick="startLiveNavigation()">Start navigation</button><p class="receipt-footnote">Traffic and incident updates are unavailable here. Continue in Google Maps for live traffic guidance.</p>`;
  }
  document.getElementById('sheetBackdrop').classList.add('open');
}

function startVoiceHelp() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = document.getElementById('voiceStatus');
  if (!Recognition) {
    status.textContent = 'Voice recognition is not available here. Type your request below or choose a quick action.';
    document.getElementById('voiceText')?.focus();
    announce('Voice recognition unavailable. Text request remains available.');
    return;
  }
  try {
    const recognition = new Recognition();
    window.dayformRecognition = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      status.textContent = 'Listening…';
      document.getElementById('voiceOrb')?.classList.add('listening');
      document.querySelector('.agent-nav')?.classList.add('listening');
      startVoiceMeter();
      document.getElementById('voiceMic').textContent = 'Listening… tap to stop';
      document.getElementById('voiceMic').onclick = stopVoiceHelp;
      announce('WorkPal is listening');
    };
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('voiceText').value = transcript;
      answerVoice(transcript);
    };
    recognition.onerror = event => {
      status.textContent = event.error === 'not-allowed' ? 'Microphone access was blocked. Type your request instead.' : 'I didn’t catch that. Try again or type your request.';
      resetVoiceMic();
    };
    recognition.onend = resetVoiceMic;
    recognition.start();
  } catch {
    status.textContent = 'Could not start the microphone. Type your request or choose a quick action.';
  }
}
function resetVoiceMic() {
  document.getElementById('voiceOrb')?.classList.remove('listening');
  document.querySelector('.agent-nav')?.classList.remove('listening');
  stopVoiceMeter();
  const mic = document.getElementById('voiceMic');
  if (mic) { mic.textContent = '🎙  Start talking'; mic.onclick = startVoiceHelp; }
}
function stopVoiceHelp() { window.dayformRecognition?.stop(); resetVoiceMic(); }
function submitVoiceText(event) {
  event.preventDefault();
  const text = document.getElementById('voiceText').value.trim();
  if (text) answerVoice(text);
}
function answerVoice(request) {
  stopVoiceHelp();
  const value = String(request).toLowerCase();
  const trip = typeof getSelectedWorkTrip === 'function' ? getSelectedWorkTrip() : null;
  let message, action, label;
  if (value.includes('flight') || value.includes('boarding') || value.includes('delay')) {
    message = `Your ${trip?.flight.carrier || 'Air Canada'} ${trip?.flight.code || 'AC 778'} leaves ${trip?.flight.depart || 'Toronto Pearson at 7:15 AM'} and arrives ${trip?.flight.arrive || 'at SFO at 9:45 AM'}. I can open the saved ticket details.`; action = "openSheet('flight')"; label = 'Open flight ticket';
  } else if (value.includes('direction') || value.includes('route') || value.includes('get to') || value.includes('map')) {
    message = `I can show a route to ${trip?.office || 'your meeting'}. I can follow your location to this trip's office when you start navigation.`; action = "openSheet('map')"; label = 'Open directions';
  } else if (value.includes('meeting') || value.includes('schedule') || value.includes('calendar') || value.includes('when')) {
    message = `Your next fixed commitment is ${trip?.meetings?.[0]?.[1] || 'the project kickoff'} at ${trip?.meetings?.[0]?.[0]?.replace(/^[A-Z]+ · /,'') || '1:00 PM'}. It stays protected in your ${trip?.city || 'trip'} schedule.`; action = "closeSheet();goTo('schedule')"; label = 'View schedule';
  } else if (value.includes('meal') || value.includes('food') || value.includes('receipt') || value.includes('expense')) {
    message = `Your meal total so far is $${mealTotal().toFixed(2)} across ${s.receipts.length} saved receipt${s.receipts.length === 1 ? '' : 's'}. You can add another expense now.`; action = "openSheet('receipt')"; label = 'Log a meal';
  } else if (value.includes('car') || value.includes('rental') || value.includes('pickup')) {
    message = trip?.rental ? `Your ${trip.rental.provider} pickup is ${trip.rental.pickup} at ${trip.rental.address}. I can open the reservation details.` : `There isn’t a rental car booked for ${trip?.city || 'this trip'}. I can show the local route options instead.`; action = trip?.rental ? "openSheet('rental')" : "openSheet('map')"; label = trip?.rental ? 'Open rental details' : 'See route options';
  } else {
    message = 'I can help with your flight, meeting schedule, directions, rental car, or meal expenses. Try one of the quick actions below.'; action = "openSheet('agent')"; label = 'See trip details';
  }
  const answer = document.getElementById('voiceAnswer');
  if (answer) answer.innerHTML = `<div class="voice-answer"><strong>WorkPal</strong>${escapeText(message)}<button class="button soft full" style="margin-top:10px;min-height:44px" onclick="${action}">${label}</button></div>`;
  const status = document.getElementById('voiceStatus');
  if (status) status.textContent = 'Here’s what I found';
  announce('WorkPal responded to your trip request');
  if ('speechSynthesis' in window && window.SpeechSynthesisUtterance) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    const preferredVoice = getWorkPalVoice();
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.94;
    utterance.pitch = 1.06;
    utterance.volume = 1;
    utterance.onstart = () => setVoiceSpeaking(true);
    utterance.onend = utterance.onerror = () => setVoiceSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
}
function rankWorkPalVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  const feminine = /\b(samantha|ava|jenny|aria|zira|sonia|serena|victoria|karen|tessa|moira|fiona|susan|michelle|emma|amy|hazel|allison|joelle|laura|libby|natasha)\b|female|woman/.test(name);
  const masculine = /\b(david|daniel|james|alex|fred|mark|rishi|aaron|tom|guy|jorge)\b|male/.test(name);
  return (feminine ? 100 : 0) + (/natural|neural|premium|enhanced/.test(name) ? 35 : 0) + (lang.startsWith('en-us') ? 20 : lang.startsWith('en') ? 10 : 0) - (masculine ? 80 : 0);
}
function getWorkPalVoice() {
  if (!('speechSynthesis' in window)) return null;
  const all = speechSynthesis.getVoices();
  const english = all.filter(voice => voice.lang.toLowerCase().startsWith('en'));
  const voices = english.length ? english : all;
  const saved = localStorage.getItem('workpal-voice-uri');
  return voices.find(voice => voice.voiceURI === saved) || voices.slice().sort((a,b) => rankWorkPalVoice(b) - rankWorkPalVoice(a))[0] || null;
}
function loadWorkPalVoices() {
  if (!('speechSynthesis' in window)) return;
  const populate = () => {
    const select = document.getElementById('voiceSelect');
    if (!select) return;
    const all = speechSynthesis.getVoices();
    const english = all.filter(voice => voice.lang.toLowerCase().startsWith('en'));
    const voices = english.length ? english : all;
    if (!voices.length) {
      select.innerHTML = '<option>System voice</option>';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    const preferred = getWorkPalVoice();
    if (!localStorage.getItem('workpal-voice-uri') && preferred) localStorage.setItem('workpal-voice-uri', preferred.voiceURI);
    const saved = localStorage.getItem('workpal-voice-uri');
    select.innerHTML = voices.map(voice => `<option value="${escapeText(voice.voiceURI)}">${escapeText(voice.name)}${voice.voiceURI === preferred?.voiceURI ? ' · recommended' : ''}</option>`).join('');
    select.value = voices.some(voice => voice.voiceURI === saved) ? saved : preferred?.voiceURI || voices[0].voiceURI;
  };
  populate();
  if (!window.workPalVoicesListener && 'addEventListener' in speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', populate);
    window.workPalVoicesListener = true;
  }
}
function setWorkPalVoice(uri) {
  localStorage.setItem('workpal-voice-uri', uri);
  announce('Spoken voice preference saved');
}
let voiceMeterStream = null, voiceMeterContext = null, voiceMeterFrame = null;
async function startVoiceMeter() {
  const AudioContextType = window.AudioContext || window.webkitAudioContext;
  if (!navigator.mediaDevices?.getUserMedia || !AudioContextType) return;
  try {
    voiceMeterStream = await navigator.mediaDevices.getUserMedia({audio:true});
    voiceMeterContext = new AudioContextType();
    const source = voiceMeterContext.createMediaStreamSource(voiceMeterStream);
    const analyser = voiceMeterContext.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const paint = () => {
      if (!voiceMeterContext) return;
      analyser.getByteFrequencyData(data);
      document.querySelectorAll('.voice-bars').forEach(group => {
        group.classList.add('live');
        [...group.children].forEach((bar, i) => {
          const bin = data[2 + i * 3] || 0;
          bar.style.transform = `scaleY(${Math.max(.22, bin / 116)})`;
        });
      });
      voiceMeterFrame = requestAnimationFrame(paint);
    };
    paint();
  } catch { /* Use the CSS waveform when microphone level access is unavailable. */ }
}
function stopVoiceMeter() {
  if (voiceMeterFrame) cancelAnimationFrame(voiceMeterFrame);
  voiceMeterFrame = null;
  voiceMeterStream?.getTracks().forEach(track => track.stop());
  voiceMeterStream = null;
  if (voiceMeterContext) voiceMeterContext.close().catch(() => {});
  voiceMeterContext = null;
  document.querySelectorAll('.voice-bars').forEach(group => group.classList.remove('live'));
  document.querySelectorAll('.voice-bars i').forEach(bar => { bar.style.transform = ''; });
}
function setVoiceSpeaking(active) {
  document.getElementById('voiceOrb')?.classList.toggle('speaking', active);
  document.querySelector('.agent-nav')?.classList.toggle('speaking', active);
}
const dayformBaseCloseVoiceSheet = closeSheet;
closeSheet = function () {
  if (window.dayformRecognition) window.dayformRecognition.stop();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  stopVoiceMeter();
  setVoiceSpeaking(false);
  dayformBaseCloseVoiceSheet();
};

function chooseMapRoute(route) { s.mapRoute = route; s.directionsActive = false; s.directionStep = 0; save(); openSheet('map'); }
function startDirections() { s.directionsActive = true; s.directionStep = 0; save(); openSheet('map'); announce('Route preview opened. Start navigation to follow your location.'); }
function nextDirection() { const max = 3; if (s.directionStep >= max - 1) { s.directionsActive = false; s.directionStep = 0; toast('Route preview complete'); } else s.directionStep++; save(); openSheet('map'); }

const dayformRenderWithReceipts = render;
render = function () { dayformRenderWithReceipts(); renderExpenses(); };
const dayformBaseResetDemo = resetDemo;
resetDemo = function () { dayformBaseResetDemo(); s.receipts = structuredClone(seed.receipts); s.rentalReady = false; s.boardingPass = false; s.mapRoute = 'bart'; s.directionStep = 0; s.directionsActive = false; save(); render(); };
render();

(() => {
  const backdrop=document.getElementById('sheetBackdrop'),shell=document.getElementById('shell');
  let scrollSnapshot=null;
  const updateScrollLock=()=>{
    const isOpen=backdrop.classList.contains('open');
    if(isOpen&&!scrollSnapshot){
      scrollSnapshot={y:window.scrollY||0,shellTop:shell.scrollTop,body:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow},shellOverflow:shell.style.overflow};
      document.body.style.position='fixed';document.body.style.top=`-${scrollSnapshot.y}px`;document.body.style.width='100%';document.body.style.overflow='hidden';
      shell.style.overflow='hidden';document.documentElement.classList.add('overlay-active');
    }else if(!isOpen&&scrollSnapshot){
      const saved=scrollSnapshot;scrollSnapshot=null;
      document.body.style.position=saved.body.position;document.body.style.top=saved.body.top;document.body.style.width=saved.body.width;document.body.style.overflow=saved.body.overflow;
      shell.style.overflow=saved.shellOverflow;document.documentElement.classList.remove('overlay-active');
      window.scrollTo(0,saved.y);shell.scrollTop=saved.shellTop;
    }
  };
  new MutationObserver(updateScrollLock).observe(backdrop,{attributes:true,attributeFilter:['class']});
})();
