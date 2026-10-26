/* Full-screen live location view for the mobile prototype. */
let navDestination = {lat:37.7915,lng:-122.3971,name:'Northstar office · 100 First Street'};
const navTileUrl=window.WORKPAL_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
let navMap=null,navMarker=null,navAccuracy=null,navRouteLine=null,navWatch=null,navLastRouteAt=0,navRouteSteps=[],navStepIndex=0,navHeading=null,navHasCompass=false,navRouteDistance=0,navRouteDuration=0,navOrientationListener=null;

function ensureNavigationScreen(){
  let screen=document.getElementById('liveNavigation');
  if(!screen){
    screen=document.createElement('section');screen.id='liveNavigation';screen.className='live-nav-screen';screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');screen.setAttribute('aria-label','Full-screen navigation');
    screen.innerHTML=`<div id="liveLeafletMap" class="live-map"></div><header class="live-nav-header"><button class="live-nav-iconbtn" onclick="stopLiveNavigation()" aria-label="Close navigation">×</button><div><b id="liveNavDestination">Northstar office</b><span id="liveNavStatus" role="status" aria-live="polite">Preparing live map…</span></div><span class="live-gps-badge" id="liveGpsBadge">GPS</span></header><div class="live-nav-controls"><button class="live-nav-iconbtn" onclick="recenterLiveMap()" aria-label="Center on my location">◎</button><button class="live-nav-iconbtn" onclick="openGoogleMaps()" aria-label="Continue in Google Maps">↗</button></div><section class="live-nav-card" aria-live="polite"><div class="live-nav-card-top"><span id="liveNavStepTag">LIVE ROUTE</span><span id="liveNavEta">Waiting for location</span></div><strong id="liveNavInstruction">Allow location to start following you</strong><span id="liveNavNext">Your location is used to position you and request a route.</span><small class="live-nav-source">Route estimate · traffic unavailable</small><div class="live-nav-card-actions"><button class="button primary" onclick="openGoogleMaps()">Continue in Google Maps</button><button class="button" onclick="stopLiveNavigation()">Done</button></div></section>`;
    document.body.appendChild(screen);
  }
  return screen;
}
function loadLeaflet(){
  return new Promise((resolve,reject)=>{
    if(window.L)return resolve();
    if(!document.getElementById('leafletCss')){const css=document.createElement('link');css.id='leafletCss';css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);}
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
  });
}
async function startLiveNavigation(){
  const trip=typeof getSelectedWorkTrip==='function'?getSelectedWorkTrip():null;
  if(trip?.destination)navDestination=trip.destination;
  const screen=ensureNavigationScreen();screen.classList.add('open');document.body.classList.add('navigating');
  closeSheet();
  document.getElementById('liveNavDestination').textContent=navDestination.name;
  document.getElementById('liveNavInstruction').textContent='Finding your location…';
  document.getElementById('liveNavStatus').textContent='Requesting location permission';
  document.getElementById('liveNavStepTag').textContent='LIVE NAVIGATION';
  document.getElementById('liveNavNext').textContent='Location is used to follow you and request a route from the public routing service.';
  navHeading=null;navHasCompass=false;requestLiveCompass();
  navLastRouteAt=0;navRouteSteps=[];navStepIndex=0;if(navRouteLine&&navMap)navMap.removeLayer(navRouteLine);navRouteLine=null;if(navMap)navMap.userTouched=false;
  try{await loadLeaflet();initializeLiveMap([37.789,-122.405]);}
  catch{document.getElementById('liveNavStatus').textContent='Map could not load · check your connection';document.getElementById('liveNavInstruction').textContent='You can still open turn-by-turn directions in Google Maps.';}
  if(!navigator.geolocation){document.getElementById('liveNavStatus').textContent='This browser does not provide GPS location';document.getElementById('liveNavInstruction').textContent='Open the route in Google Maps for live navigation.';return;}
  navWatch=navigator.geolocation.watchPosition(onLivePosition,error=>{
    const status=error.code===1?'Location permission is off':error.code===2?'GPS signal unavailable':'Location request timed out';
    document.getElementById('liveNavStatus').textContent=status;document.getElementById('liveNavInstruction').textContent='Enable location or continue in Google Maps.';document.getElementById('liveGpsBadge').textContent='GPS OFF';
  },{enableHighAccuracy:true,maximumAge:2000,timeout:15000});
}
function initializeLiveMap(center){
  if(!window.L)throw new Error('Map library unavailable');
  if(!navMap){
    navMap=L.map('liveLeafletMap',{zoomControl:false,attributionControl:false}).setView(center,16);
    L.tileLayer(navTileUrl,{maxZoom:19,attribution:'© OpenStreetMap contributors',crossOrigin:true}).addTo(navMap);
    navMap.attributionControl=L.control.attribution({prefix:false,position:'bottomright'}).addTo(navMap);
    navMap.attributionControl.addAttribution('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>');
    L.control.zoom({position:'bottomright'}).addTo(navMap);
    navMap.on('dragstart',()=>{navMap.userTouched=true;});
    setTimeout(()=>navMap?.invalidateSize(),150);
  }else{navMap.setView(center,16);setTimeout(()=>navMap?.invalidateSize(),150);}
}
function onLivePosition(position){
  const {latitude:lat,longitude:lng,accuracy,heading,speed}=position.coords,point=[lat,lng];
  document.getElementById('liveNavStatus').textContent=`Following you · ±${Math.round(accuracy)} m accuracy`;
  document.getElementById('liveGpsBadge').textContent='GPS LIVE';
  if(Number.isFinite(heading)&&!navHasCompass)navHeading=heading;
  updateNavMarker(point,accuracy,navHeading);
  if(!navMap){document.getElementById('liveNavInstruction').textContent='Location found, but the map did not load. Continue in Google Maps.';return;}
  if(!navMap.userTouched&&distanceMeters(navMap.getCenter().lat,navMap.getCenter().lng,lat,lng)>7)navMap.setView(point,Math.max(navMap.getZoom(),16),{animate:true});
  advanceLiveRouteStep(lat,lng,accuracy);
  const now=Date.now();
  if(!navRouteLine||(now-navLastRouteAt>30000&&distanceMeters(lat,lng,navDestination.lat,navDestination.lng)>80))fetchLiveRoute(lat,lng);
  if(speed!=null&&speed>=0)document.getElementById('liveNavNext').textContent=`Your location is updating · ${Math.round(speed*3.6)} km/h · compass ${navHeading==null?'unavailable':Math.round(navHeading)+'°'}`;
}
function updateNavMarker(point,accuracy,heading){
  if(!window.L||!navMap)return;
  const arrow=heading==null?'<span class="gps-arrow gps-no-heading"><i></i></span>':`<span class="gps-arrow" style="transform:rotate(${heading}deg)"><i></i></span>`;
  const icon=L.divIcon({className:'',html:arrow,iconSize:[38,38],iconAnchor:[19,19]});
  if(!navMarker)navMarker=L.marker(point,{icon,zIndexOffset:1000}).addTo(navMap);else navMarker.setLatLng(point).setIcon(icon);
  if(!navAccuracy)navAccuracy=L.circle(point,{radius:accuracy,color:'#397bb5',weight:1,fillColor:'#65a6de',fillOpacity:.14}).addTo(navMap);else navAccuracy.setLatLng(point).setRadius(accuracy);
}
async function fetchLiveRoute(lat,lng){
  navLastRouteAt=Date.now();document.getElementById('liveNavStatus').textContent='Refreshing route…';
  try{
    const url=`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${navDestination.lng},${navDestination.lat}?overview=full&geometries=geojson&steps=true`;
    const response=await fetch(url);if(!response.ok)throw new Error('Route unavailable');
    const data=await response.json(),route=data.routes?.[0];if(!route)throw new Error('No route');
    if(navRouteLine)navMap.removeLayer(navRouteLine);
    navRouteLine=L.geoJSON(route.geometry,{style:{color:'#267db5',weight:7,opacity:.9,lineCap:'round',lineJoin:'round'}}).addTo(navMap);
    navRouteSteps=route.legs?.[0]?.steps||[];navStepIndex=0;navRouteDistance=route.distance;navRouteDuration=route.duration;renderLiveRouteStep();
    if(!navMap.userTouched)navMap.fitBounds(navRouteLine.getBounds(),{padding:[40,190],maxZoom:16});
    document.getElementById('liveNavStatus').textContent='Route ready · live GPS';
  }catch{
    if(navRouteLine&&navMap)navMap.removeLayer(navRouteLine);navRouteLine=null;navRouteSteps=[];navStepIndex=0;
    document.getElementById('liveNavStatus').textContent='Route preview unavailable';document.getElementById('liveNavInstruction').textContent='Routing service unavailable. Open Google Maps for directions.';document.getElementById('liveNavEta').textContent='GPS still active';
  }
}
function renderLiveRouteStep(){
  const step=navRouteSteps[navStepIndex];if(!step){document.getElementById('liveNavInstruction').textContent='Continue toward your destination';return;}
  const maneuver=step.maneuver||{},type=maneuver.type==='turn'?(maneuver.modifier||'continue'):maneuver.type||'Continue',road=step.name?` onto ${step.name}`:'';
  document.getElementById('liveNavStepTag').textContent=`STEP ${Math.min(navStepIndex+1,navRouteSteps.length)} OF ${navRouteSteps.length}`;
  document.getElementById('liveNavInstruction').textContent=`${type.charAt(0).toUpperCase()+type.slice(1)}${road}`;
  const next=navRouteSteps[navStepIndex+1]?.maneuver?.location;
  const remaining=next?distanceMeters(navMarker?.getLatLng().lat||next[1],navMarker?.getLatLng().lng||next[0],next[1],next[0]):step.distance;
  document.getElementById('liveNavNext').textContent=remaining<15?'At the next turn':`In ${formatDistance(remaining)} · route to next turn`;
  document.getElementById('liveNavEta').textContent=`${formatDistance(navRouteDistance)} · about ${Math.max(1,Math.round(navRouteDuration/60))} min`;
}
function advanceLiveRouteStep(lat,lng,accuracy){
  while(navStepIndex<navRouteSteps.length-1){
    const next=navRouteSteps[navStepIndex+1]?.maneuver?.location;if(!next)break;
    if(distanceMeters(lat,lng,next[1],next[0])>Math.max(35,Math.min(accuracy||35,80)))break;
    navStepIndex++;renderLiveRouteStep();
  }
}
function requestLiveCompass(){
  const orientation=window.DeviceOrientationEvent;
  if(navOrientationListener)window.removeEventListener('deviceorientationabsolute'in window?'deviceorientationabsolute':'deviceorientation',navOrientationListener,true);
  navOrientationListener=event=>{
    const heading=event.webkitCompassHeading!=null?event.webkitCompassHeading:(event.alpha!=null?(360-event.alpha)%360:null);
    if(heading!=null){navHeading=heading;navHasCompass=true;document.getElementById('liveGpsBadge').textContent='GPS · COMPASS';const p=navMarker?.getLatLng();if(p)updateNavMarker([p.lat,p.lng],navAccuracy?.getRadius()||30,heading);}
  };
  const listen=()=>window.addEventListener('deviceorientationabsolute'in window?'deviceorientationabsolute':'deviceorientation',navOrientationListener,true);
  if(orientation&&typeof orientation.requestPermission==='function')orientation.requestPermission().then(result=>{if(result==='granted')listen();}).catch(()=>{});else listen();
}
function recenterLiveMap(){const p=navMarker?.getLatLng();if(p&&navMap){navMap.userTouched=false;navMap.setView(p,17,{animate:true});}}
function openGoogleMaps(){const p=navMarker?.getLatLng(),origin=p?`${p.lat},${p.lng}`:'',url=`https://www.google.com/maps/dir/?api=1&destination=${navDestination.lat},${navDestination.lng}${origin?`&origin=${encodeURIComponent(origin)}`:''}&travelmode=driving`;window.open(url,'_blank','noopener,noreferrer');}
function stopLiveNavigation(){if(navWatch!=null)navigator.geolocation?.clearWatch(navWatch);navWatch=null;if(navOrientationListener)window.removeEventListener('deviceorientationabsolute'in window?'deviceorientationabsolute':'deviceorientation',navOrientationListener,true);navOrientationListener=null;document.getElementById('liveNavigation')?.classList.remove('open');document.body.classList.remove('navigating');}
function distanceMeters(lat1,lon1,lat2,lon2){const r=6371000,p=Math.PI/180,dLat=(lat2-lat1)*p,dLon=(lon2-lon1)*p,a=Math.sin(dLat/2)**2+Math.cos(lat1*p)*Math.cos(lat2*p)*Math.sin(dLon/2)**2;return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function formatDistance(m){return m>=1000?`${(m/1000).toFixed(1)} km`:`${Math.round(m)} m`;}
