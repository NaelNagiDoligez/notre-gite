// Notre gîte d'été : application (voir README.md)
(function(){
'use strict';

/* ---------- Données fixes ---------- */
const FR = window.FR_DATA;
const DEP = {}; const DEP_LIST = [];
FR.d.forEach(r => { const o = {c:r[0], n:r[1], d:r[2], cx:r[3], cy:r[4]}; DEP[o.c] = o; DEP_LIST.push(o); });
const project = (lat, lng) => [(lng * FR.k - FR.minx) * FR.s + FR.pad, (-lat - FR.miny) * FR.s + FR.pad];

const DEFAULT_CONFIG = {
  title: "Notre gîte d'été",
  criteria: [
    {id:'prix', label:'Prix'},
    {id:'lieu', label:'Localisation'},
    {id:'confort', label:'Confort et équipements'},
    {id:'ambiance', label:'Photos et ambiance'},
    {id:'couchages', label:'Couchages'},
    {id:'activites', label:'Activités autour'}
  ],
  statuses: [
    {id:'propose', label:'Proposé'}, {id:'discussion', label:'En discussion'},
    {id:'preselection', label:'Présélectionné'}, {id:'reserve', label:'Réservé'}
  ],
  perms: {deleteListing:'owner', editCriteria:'owner', closeVotes:'owner', changeStatus:'all'},
  closed: false, closedAt: null
};
const VIEWS = ['galerie','comparateur','podium','carte','dates'];
const TRIP_FIELDS = [['destination','Destination','France'],['periode','Période','Dates à définir']];
const SOURCES = [['airbnb','Airbnb'],['booking.','Booking.com'],['abritel','Abritel'],['vrbo','Vrbo'],['gites-de-france','Gîtes de France'],['leboncoin','Leboncoin'],['clevacances','Clévacances'],['expedia','Expedia'],['interhome','Interhome'],['belvilla','Belvilla'],['papvacances','PAP Vacances'],['homeexchange','HomeExchange'],['tripadvisor','Tripadvisor']];
const EASE_OUT = 'cubic-bezier(0.23,1,0.32,1)', EASE_IO = 'cubic-bezier(0.77,0,0.175,1)', EASE_BACK = 'cubic-bezier(0.34,1.56,0.64,1)';
const POP = [{transform:'scale(1)'}, {transform:'scale(1.4)'}, {transform:'scale(1)'}];
const GM = window.GiteMotion || {}; /* couche GSAP (motion.js), facultative */

const IC = {
  flip:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7"/></svg>',
  house:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/></svg>',
  yes:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  maybe:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 13c2.5-3 4.5-3 7 0s4.5 3 7 0"/></svg>',
  no:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  heart:'<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  ban:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/></svg>',
  lock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ext:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  pen:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  chev:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
};

/* ---------- Utilitaires ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = u => { try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
const num = v => { if (v == null || v === '') return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[\s  €]/g, '').replace(',', '.')); return isFinite(n) ? n : null; };
const int = v => { const n = num(v); return n == null ? null : Math.max(0, Math.round(n)); };
const fmtPrice = n => n == null ? 'Prix à préciser' : new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(n);
const fmtScore = n => n == null || !isFinite(n) ? '–' : n.toFixed(1).replace('.', ',');
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}) : '';
const fmtLong = ts => ts ? new Date(ts).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'}) : '';
const plural = (n, w, ws) => n + ' ' + (n > 1 ? (ws || w + 's') : w);
const hashN = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % n; };
const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
const store = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
};
function relTime(ts){
  if (!ts) return '';
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'à l’instant';
  if (d < 3600) return 'il y a ' + Math.floor(d / 60) + ' min';
  if (d < 86400) return 'il y a ' + Math.floor(d / 3600) + ' h';
  if (d < 172800) return 'hier';
  return 'le ' + fmtDate(ts);
}
const depLabel = c => DEP[c] ? DEP[c].n + ' (' + c + ')' : (c === 'autre' ? 'Hors métropole' : (c || ''));
const placeOf = l => [l.commune, depLabel(l.dept)].filter(Boolean).join(' · ') || 'Lieu à préciser';
let SB = null;
/* Une photo est soit un chemin du bucket « photos », soit l'adresse https d'une image hébergée ailleurs. */
const EXT_PHOTO = /^https:\/\/[^\s"'<>\\]{6,1900}$/;
const isExtPhoto = id => EXT_PHOTO.test(id);
const photoUrl = id => isExtPhoto(id) ? id : (SB ? SB.storage.from('photos').getPublicUrl(id).data.publicUrl : '');
const PHOTO_STORE = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/;
const PHOTO_ID = { test: id => typeof id === 'string' && (PHOTO_STORE.test(id) || isExtPhoto(id)) };
const storedOnly = ids => ids.filter(id => PHOTO_STORE.test(id));

/* ---------- Mouvement ---------- */
const reducedPref = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion = (() => { const v = store.get('gite-motion'); return v ? v === 'on' : !reducedPref; })();
const M = () => motion;
function applyMotion(){
  document.documentElement.dataset.motion = motion ? 'on' : 'off';
  if (!motion) { if (revealSkip) revealSkip(); if (GM.disable) GM.disable(); }
  if ($('#gear-pop') && !$('#gear-pop').hidden) renderGear();
}

/* ---------- Roue crantée : réglages rapides ---------- */
const PREFS = {
  scene: () => store.get('gite-scene') !== 'off',
  theme: () => store.get('gite-theme') || 'time'
};
function renderGear(){
  const p = $('#gear-pop'); if (!p) return;
  const sw = (k, label, hint, on) => `<button type="button" class="gp-sw" role="switch" aria-checked="${on}" data-pref="${k}"><span class="gp-l"><strong>${label}</strong><small>${hint}</small></span><span class="sw" aria-hidden="true"></span></button>`;
  const opt = (v, cur, l) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  const name = S.members[S.myId] ? S.members[S.myId].name : '';
  const out = SB && S.myId;
  p.innerHTML = `<div class="gp-head"><h2 class="gp-t">Réglages</h2><button type="button" class="icon-btn" data-gear-close aria-label="Fermer">${IC.x}</button></div>
    ${canEdit() ? `<div class="gp-me"><span class="gp-av">${avatar(S.myId, 'av-sm')}</span><div><strong>${esc(name || 'Mon profil')}</strong><button type="button" class="link-btn" data-act="my-settings">Mon profil et le carnet</button></div></div>` : ''}
    <div class="gp-list">
      ${sw('motion', 'Animations', 'Mouvement et transitions', motion)}
      ${sw('scene', 'Décor illustré', 'Paysage et ciel qui suit l’heure', PREFS.scene())}
    </div>
    <label class="gp-f"><span>Thème</span><select id="gp-theme" class="input">${opt('time', PREFS.theme(), 'Selon l’heure')}${opt('light', PREFS.theme(), 'Clair')}${opt('dark', PREFS.theme(), 'Sombre')}${opt('system', PREFS.theme(), 'Comme mon appareil')}</select></label>
    ${out ? '<button type="button" class="btn gp-out" data-act="logout">Se déconnecter</button>' : ''}`;
}
function openGear(){
  const p = $('#gear-pop'), b = $('#gear-btn'); if (!p.hidden) { closeGear(); return; }
  closePop(); renderGear(); p.hidden = false; b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect(); const cw = Math.min(document.documentElement.clientWidth, innerWidth), pw = Math.min(340, cw - 32); p.style.top = Math.round(r.bottom + 8) + 'px'; p.style.width = pw + 'px'; p.style.right = 'auto'; p.style.left = Math.round(Math.max(16, Math.min(r.right - pw, cw - pw - 16))) + 'px'; p.style.transformOrigin = Math.round(r.left + r.width / 2 - parseFloat(p.style.left)) + 'px top';
  anim(p, [{opacity:0, transform:'translateY(-8px) scale(.96)'}, {opacity:1, transform:'none'}], {duration:240, easing:EASE_OUT});
  const f = $('[data-pref]', p) || $('button', p); if (f) f.focus({preventScroll:true});
}
function closeGear(refocus){
  const p = $('#gear-pop'); if (!p || p.hidden) return;
  p.hidden = true; $('#gear-btn').setAttribute('aria-expanded', 'false'); if (refocus) $('#gear-btn').focus();
}
function setPref(k, v){
  if (k === 'motion') { motion = !motion; store.set('gite-motion', motion ? 'on' : 'off'); applyMotion(); return; }
  if (k === 'scene') { store.set('gite-scene', PREFS.scene() ? 'off' : 'on'); }
  if (k === 'theme') store.set('gite-theme', v);
  if (window.GiteScene) GiteScene.refresh();
}
function anim(el, kf, opts){ if (!M() || !el || !el.animate) return null; try { return el.animate(kf, opts); } catch (e) { return null; } }
function flipCapture(root){ const m = new Map(); if (!root) return m; $$('[data-k]', root).forEach(el => { if (el.getClientRects().length) m.set(el.dataset.k, el.getBoundingClientRect()); }); return m; }
function flipPlay(root, before, enter, gm){
  if (!root || !M()) return;
  let n = 0; const fresh = [];
  $$('[data-k]', root).forEach(el => {
    if (!el.getClientRects().length) return;
    const b = before.get(el.dataset.k);
    if (b) {
      const r = el.getBoundingClientRect(); const dx = b.left - r.left, dy = b.top - r.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        /* Les lignes qui se déplacent le plus passent au-dessus des autres, sans disparaître derrière elles */
        const a = anim(el, [{transform:`translate(${dx}px,${dy}px)`}, {transform:'none'}], {duration:480, easing:EASE_IO});
        if (a && el.tagName === 'TR') { el.classList.add('fl-row'); el.style.position = 'relative'; el.style.zIndex = String(2 + Math.min(40, Math.round(Math.abs(dy) / 40))); const done = () => { el.classList.remove('fl-row'); el.style.zIndex = ''; el.style.position = ''; }; a.onfinish = done; a.oncancel = done; }
      }
    } else if (enter !== false) {
      if (gm && GM.enterCards) fresh.push(el);
      else anim(el, [{opacity:0, transform:'translateY(24px) scale(.95) rotate(-0.8deg)'}, {opacity:1, transform:'none'}], {duration:600, delay:Math.min(n++, 10) * 60, easing:EASE_OUT, fill:'backwards'});
    }
  });
  if (fresh.length) GM.enterCards(fresh);
}
function countUp(el, to, dur){
  if (!el) return;
  if (!M() || to == null || !dur) { el.textContent = fmtScore(to); return; }
  const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 4); el.textContent = fmtScore(to * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- État ---------- */
const S = {
  booted:false, db:null, user:null, sample:null, assets:null, downloads:null,
  myId:null, isOwner:false, readOnly:false, meName:'',
  waiting:true, config:null, trip:{}, members:{}, votes:{}, listings:{}, comments:{},
  loaded:{members:false, listings:false, votes:false, trip:false},
  view:'galerie', f:{dept:'', status:'', sort:'score'}, cmp:{key:'overall', dir:-1},
  flipped:new Set(), stampWeek:false, openId:null, mapSel:null, myVoteDirty:false, onboardShown:false, confirmClose:false, dwConfirm:false,
  st:{}, unlockedSeen:new Set(), highlight:null, revealPlayed:false,
  navDir:0, newsHidden:false, prevMarks:{}, focusWeek:null, popBtn:null
};
const cfg = () => Object.assign({}, DEFAULT_CONFIG, S.config || {});
const crits = () => (Array.isArray(cfg().criteria) && cfg().criteria.length ? cfg().criteria : DEFAULT_CONFIG.criteria);
const statuses = () => (Array.isArray(cfg().statuses) && cfg().statuses.length ? cfg().statuses : DEFAULT_CONFIG.statuses);
const listingsArr = () => Object.values(S.listings);
const memberIds = () => Object.keys(S.members);
const isPayer = () => true; /* plus de distinction : tout le monde note tous les critères */
const nameOf = uid => (S.members[uid] && S.members[uid].name) || 'Quelqu’un';
const votesOf = uid => S.votes[uid] || {scores:{}, heart:null, veto:null};
const canEdit = () => !!S.db && !!S.myId && !S.readOnly;
const wouldVote = () => canEdit() && !cfg().closed;
const canVote = () => wouldVote() && !!S.members[S.myId];
/* La galerie attend d'avoir reçu les logements, les notes et les inscrits : sinon les cartes se redessinent au fil des réponses et l'entrée animée est coupée. */
const dataReady = () => !S.waiting && (!S.db || (S.loaded.listings && S.loaded.votes && S.loaded.members));
const applicable = uid => crits().filter(c => !c.payersOnly || isPayer(uid));
/* Un critère ajouté après coup n'est exigé que pour les logements qu'on commence à noter après son ajout :
   ajouter un critère ne recache pas les notes déjà débloquées. */
function hasCompleted(uid, lid){
  if (!uid) return false;
  const sc = (votesOf(uid).scores || {})[lid] || {};
  const ap = applicable(uid).filter(c => !c.addedAt || (sc._t0 && sc._t0 > c.addedAt));
  return ap.length > 0 && ap.every(c => typeof sc[c.id] === 'number');
}
const anyScore = x => !!x && Object.keys(x).some(k => k !== '_t0');
const canSee = lid => !wouldVote() || hasCompleted(S.myId, lid);

function stats(lid){
  const per = {}; const ids = memberIds();
  crits().forEach(c => {
    const vals = [];
    for (const uid of ids) {
      if (c.payersOnly && !isPayer(uid)) continue;
      const v = ((votesOf(uid).scores || {})[lid] || {})[c.id];
      if (typeof v === 'number') vals.push(v);
    }
    per[c.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
  const avgs = crits().map(c => per[c.id]).filter(v => v != null);
  const overall = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  const hearts = [], vetos = []; let voted = 0;
  for (const uid of ids) {
    const v = votesOf(uid);
    if (v.heart === lid) hearts.push(uid);
    if (v.veto === lid) vetos.push(uid);
    if (hasCompleted(uid, lid)) voted++;
  }
  return {per, overall, hearts, vetos, voted, total:ids.length};
}
function computeStats(){ const o = {}; listingsArr().forEach(l => { o[l.id] = stats(l.id); }); return o; }
const st = lid => S.st[lid] || stats(lid);
/* Un logement qui a reçu un veto passe après tous ceux qui n'en ont pas (puis le moins de veto d'abord). */
function ranking(){
  return listingsArr().map(l => ({l, s:st(l.id)})).sort((a, b) => {
    const va = a.s.vetos.length ? 1 : 0, vb = b.s.vetos.length ? 1 : 0;
    if (va !== vb) return va - vb;
    if (a.s.vetos.length !== b.s.vetos.length) return a.s.vetos.length - b.s.vetos.length;
    const oa = a.s.overall == null ? -1 : a.s.overall, ob = b.s.overall == null ? -1 : b.s.overall;
    if (ob !== oa) return ob - oa;
    if (b.s.hearts.length !== a.s.hearts.length) return b.s.hearts.length - a.s.hearts.length;
    return (a.l.createdAt || 0) - (b.l.createdAt || 0);
  });
}
/* ---------- Prix par nuit ---------- */
const MOIS3 = ['jan','fév','mar','avr','mai','jui','jul','aoû','sep','oct','nov','déc'];
function monthIdx(w){ if (!w) return -1; w = w.toLowerCase().replace('fev', 'fév').replace('aou', 'aoû').replace('dec', 'déc'); if (/^juil/.test(w)) return 6; if (/^juin/.test(w)) return 5; return MOIS3.findIndex(m => w.startsWith(m)); }
function nightsOf(l){
  if (num(l.nights)) return num(l.nights);
  const t = String(l.priceDates || '');
  const n = t.match(/(\d{1,2})\s*nuit/i); if (n) return +n[1];
  const w = t.match(/(\d{1,2})(?:er)?\s*([a-zéûè]{3,})?\.?\s*(?:au|→|->|-|–|à)\s*(\d{1,2})(?:er)?\s*([a-zéûè]{3,})/i);
  if (w) {
    const m2 = monthIdx(w[4]), m1 = w[2] ? monthIdx(w[2]) : m2; if (m1 < 0 || m2 < 0) return null;
    const d = Math.round((new Date(YEAR, m2, +w[3]) - new Date(YEAR, m1, +w[1])) / 864e5);
    if (d >= 1 && d <= 60) return d;
  }
  return null;
}
function perPN(l){ const p = num(l.price), n = nightsOf(l); return p != null && n ? p / n : null; }
const fmtEur = n => n == null ? '–' : new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(n);
function statusOf(l){ const ss = statuses(); let i = ss.findIndex(s => s.id === l.status); if (i < 0) i = 0; return {i, s:ss[i]}; }
const chipHTML = l => { const o = statusOf(l); return `<span class="chip st${o.i % 4 + 1}">${esc(o.s.label)}</span>`; };
/* Disponibilité du logement pour la semaine retenue (vérifiée par quelqu'un de la famille) */
const dispoOf = l => { const w = (S.trip || {}).week; return w && l.dispo && l.dispo.week === w ? l.dispo.v : null; };
const dispoChip = l => { if (!(S.trip || {}).week) return ''; const d = dispoOf(l); return d === 'oui' ? '<span class="chip dispo-oui">Libre ✓</span>' : d === 'non' ? '<span class="chip dispo-non">Pas libre</span>' : ''; };
const avatar = (uid, cls) => { const n = nameOf(uid); return `<span class="av av${hashN(uid, 6) + 1} ${cls || ''}" title="${esc(n)}" aria-hidden="true">${esc((n.trim()[0] || '?').toUpperCase())}</span>`; };
const photosOf = l => { const a = Array.isArray(l.photos) ? l.photos.filter(x => PHOTO_ID.test(x)) : []; if (!a.length && l.photo && PHOTO_ID.test(l.photo)) a.push(l.photo); return a; };
const MAX_PH = 6;
function photoHTML(l, extra){
  const tint = 'ph' + (hashN(l.id || 'x', 6) + 1);
  const ps = photosOf(l);
  if (ps.length) return `<div class="ph ${tint}"><img src="${esc(photoUrl(ps[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer" data-fb>${extra || ''}${extra !== undefined && ps.length > 1 ? `<span class="ph-count" aria-label="${ps.length} photos">${ps.length} photos</span>` : ''}</div>`;
  return `<div class="ph ${tint}">${IC.house}${extra || ''}</div>`;
}
const DEPBB = {};
function depBox(c){
  if (DEPBB[c]) return DEPBB[c];
  const d = DEP[c]; if (!d) return null;
  let x = 0, y = 0, sx = 0, sy = 0, cmd = 'M', minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9; const nums = [];
  const tok = d.d.match(/[MmLlHhVvZz]|-?\d*\.?\d+/g) || [];
  const put = () => { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); };
  for (let i = 0; i < tok.length;) {
    if (/[A-Za-z]/.test(tok[i])) { cmd = tok[i++]; if (cmd === 'z' || cmd === 'Z') { x = sx; y = sy; } continue; }
    const rel = cmd === cmd.toLowerCase();
    if (cmd === 'H' || cmd === 'h') { x = rel ? x + +tok[i++] : +tok[i++]; }
    else if (cmd === 'V' || cmd === 'v') { y = rel ? y + +tok[i++] : +tok[i++]; }
    else { const a = +tok[i++], b = +tok[i++]; x = rel ? x + a : a; y = rel ? y + b : b; if (cmd === 'M' || cmd === 'm') { sx = x; sy = y; cmd = rel ? 'l' : 'L'; } }
    put();
  }
  return (DEPBB[c] = {w:maxx - minx, h:maxy - miny});
}
/* Points répartis dans le département : un logement seul au centre, plusieurs en couronne (jamais l'un sur l'autre). */
function pinMap(){
  const by = {};
  listingsArr().forEach(l => { const k = DEP[l.dept] ? l.dept : '?'; (by[k] = by[k] || []).push(l); });
  const out = {};
  Object.keys(by).forEach(k => {
    const arr = by[k].slice().sort((a, b) => a.id < b.id ? -1 : 1);
    const d = DEP[k], bb = d && depBox(k), R = bb ? Math.max(5, Math.min(bb.w, bb.h) * .3) : 0, n = arr.length;
    const geo = [];
    arr.forEach((l, i) => {
      const lat = num(l.lat), lng = num(l.lng);
      if (lat != null && lng != null && lat > 41 && lat < 51.5 && lng > -5.5 && lng < 10) {
        let p = project(lat, lng), j = 0;
        while (geo.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 6) && j < 12) { const a = j++ * 2.4; p = [p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7]; }
        geo.push(p); out[l.id] = p; return;
      }
      if (!d) return;
      if (n === 1) { out[l.id] = [d.cx, d.cy]; return; }
      const base = hashN(k, 360) * Math.PI / 180;
      if (n <= 7) { const a = base + i * 2 * Math.PI / n; out[l.id] = [d.cx + Math.cos(a) * R * .65, d.cy + Math.sin(a) * R * .65]; }
      else { const a = base + i * 2.399963, r = R * Math.sqrt((i + .5) / n); out[l.id] = [d.cx + Math.cos(a) * r, d.cy + Math.sin(a) * r]; }
    });
  });
  return out;
}
function pinPos(l, map){ return (map || pinMap())[l.id] || null; }

/* ---------- Écriture ---------- */
const writeQ = {};
function writeDoc(path, data){
  const prev = writeQ[path] || Promise.resolve();
  const p = prev.catch(() => {}).then(() => S.db.doc(path).set(data));
  writeQ[path] = p;
  p.catch(onWriteError);
  return p;
}
/* Modifie quelques champs en relisant d'abord la version en base : on n'écrase pas ce que quelqu'un d'autre vient de changer. */
function patchDoc(path, patch){
  const prev = writeQ[path] || Promise.resolve();
  const p = prev.catch(() => {}).then(async () => {
    const r = S.db.doc(path); const sn = await r.get();
    if (!sn.exists) throw {code:'not_found', message:'absent'};
    return r.set(Object.assign({}, sn.data(), patch));
  });
  writeQ[path] = p;
  p.catch(e => { if (e && e.code === 'not_found') toast('Ce logement vient d’être supprimé.'); else onWriteError(e); });
  return p;
}
function onWriteError(e){
  const c = e && e.code;
  if (c === 'invalid_argument') { S.readOnly = true; toast('Modification refusée : ton accès ne permet pas d’écrire ici.'); schedule(); }
  else if (c === 'quota_exceeded') toast('Le carnet est plein : supprime des éléments pour en ajouter.');
  else if (c === 'resource_exhausted') toast('Trop de modifications d’un coup, attends un instant.');
  else toast('Connexion instable : la modification n’est pas passée, réessaie.');
}
let voteTimer = 0;
function editMyVote(fn){
  const cur = S.votes[S.myId];
  const v = cur ? JSON.parse(JSON.stringify(cur)) : {scores:{}, heart:null, veto:null};
  v.scores = v.scores || {};
  fn(v); v.updatedAt = Date.now();
  S.votes[S.myId] = v; S.myVoteDirty = true;
}
function saveVote(now){ clearTimeout(voteTimer); setSave('Enregistrement…'); voteTimer = setTimeout(flushVote, now ? 0 : 550); }
function flushVote(){
  const v = S.votes[S.myId]; if (!v) return;
  writeDoc('votes/' + S.myId, JSON.parse(JSON.stringify(v))).then(() => {
    if (S.votes[S.myId] === v) S.myVoteDirty = false;
    setSave('Enregistré');
  }).catch(() => setSave(''));
}
let savePillT = 0;
function setSave(t){
  const el = $('#dw-save'); if (el) el.textContent = t;
  const dw = $('#drawer'); if (!dw || !S.openId || !t) return;
  let pill = $('.dw-pill', dw); if (!pill) { pill = document.createElement('div'); pill.className = 'dw-pill'; pill.setAttribute('role', 'status'); dw.append(pill); }
  const ok = t === 'Enregistré';
  pill.textContent = ok ? '✓ Vote enregistré' : t; pill.classList.toggle('ok', ok); pill.classList.add('show');
  clearTimeout(savePillT); savePillT = setTimeout(() => pill.classList.remove('show'), ok ? 1700 : 4000);
}

/* ---------- Pastilles coup de cœur / veto ---------- */
function badgesHTML(l, s, inter, inline){
  const out = [];
  const one = (kind, ids, icon, label) => {
    if (!ids.length) return;
    const cls = `pas pas-${kind}${inter ? '' : ' pas-static'}`;
    if (inter) out.push(`<button type="button" class="${cls}" data-pop="${kind}" data-lid="${esc(l.id)}" aria-label="${esc(label)} : voir qui et pourquoi">${icon}${ids.length}</button>`);
    else out.push(`<span class="${cls}" aria-label="${esc(label)}">${icon}${ids.length}</span>`);
  };
  one('heart', s.hearts, IC.heart, plural(s.hearts.length, 'coup de cœur', 'coups de cœur'));
  one('veto', s.vetos, IC.ban, plural(s.vetos.length, 'veto'));
  return out.length ? `<span class="${inline ? 'badges-inline' : 'ph-badges'}">${out.join('')}</span>` : '';
}
function marksList(kind, ids){
  return `<ul class="mk-list">${ids.map(u => {
    const why = votesOf(u)[kind === 'heart' ? 'heartWhy' : 'vetoWhy'];
    return `<li>${avatar(u, 'av-sm')}<div><strong>${esc(nameOf(u))}</strong><p class="why">${why ? '« ' + esc(why) + ' »' : 'Pas de raison donnée'}</p></div></li>`;
  }).join('')}</ul>`;
}
const markTitle = (kind, n) => `<p class="mk-t ${kind === 'heart' ? 'mk-heart' : 'mk-veto'}">${kind === 'heart' ? IC.heart : IC.ban}${esc(kind === 'heart' ? plural(n, 'coup de cœur', 'coups de cœur') : plural(n, 'veto'))}</p>`;
function marksHTML(s){
  let h = '';
  if (s.hearts.length) h += `<div class="marks">${markTitle('heart', s.hearts.length)}${marksList('heart', s.hearts)}</div>`;
  if (s.vetos.length) h += `<div class="marks">${markTitle('veto', s.vetos.length)}${marksList('veto', s.vetos)}</div>`;
  return h;
}
function openPop(btn){
  const lid = btn.dataset.lid, kind = btn.dataset.pop, l = S.listings[lid]; if (!l) return;
  const pop = $('#pop');
  if (!pop.hidden && pop.dataset.for === kind + lid) { closePop(); return; }
  const s = st(lid); const ids = kind === 'heart' ? s.hearts : s.vetos;
  pop.dataset.for = kind + lid;
  pop.setAttribute('aria-label', (kind === 'heart' ? 'Coups de cœur' : 'Veto') + ' : ' + (l.title || ''));
  pop.innerHTML = `${markTitle(kind, ids.length)}<p class="small muted">${esc(l.title)}</p>${marksList(kind, ids)}<div><button type="button" class="btn btn-sm" data-open="${esc(lid)}">Ouvrir la fiche</button></div>`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.min(innerWidth - w - 16, Math.max(16, r.right - w));
  let top = r.bottom + 8; if (top + h > innerHeight - 16) top = Math.max(16, r.top - h - 8);
  pop.style.left = left + 'px'; pop.style.top = top + 'px';
  anim(pop, [{opacity:0, transform:'translateY(-8px) scale(.95)'}, {opacity:1, transform:'none'}], {duration:260, easing:EASE_BACK});
  $$('.mk-list li', pop).forEach((li, i) => anim(li, [{opacity:0, transform:'translateX(8px)'}, {opacity:1, transform:'none'}], {duration:300, delay:60 + i * 50, easing:EASE_OUT, fill:'backwards'}));
  S.popBtn = btn;
  const f = $('button', pop); if (f) f.focus({preventScroll:true});
}
function closePop(){ const p = $('#pop'); if (!p || p.hidden) return; p.hidden = true; p.dataset.for = ''; }
function flipCard(id, card){
  if (!card) return;
  const to = !S.flipped.has(id);
  const mid = () => {
    if (to) S.flipped.add(id); else S.flipped.delete(id);
    card.classList.toggle('flipped', to); $('.flip-btn', card).setAttribute('aria-pressed', String(to)); $('.card-back', card).setAttribute('aria-hidden', String(!to));
    if (to && M()) $$('.bk-list .gauge>span', card).forEach((g, i) => { const fin = g.style.transform; anim(g, [{transform:'scaleX(0)'}, {transform:fin}], {duration:600, delay:120 + i * 50, easing:EASE_OUT, fill:'backwards'}); });
  };
  if (M() && GM.flip) GM.flip(card, mid); else mid();
  const b = $('.flip-btn', card); if (b) b.focus({preventScroll:true});
}
function burst(el){
  if (!M() || !el) return;
  if (GM.burst && GM.burst(el, IC.heart)) return;
  const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 9; i++) {
    const s = document.createElement('span'); s.className = 'burst'; s.innerHTML = IC.heart;
    s.style.left = (cx - 8) + 'px'; s.style.top = (cy - 8) + 'px'; document.body.append(s);
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5, d = 38 + Math.random() * 30;
    const an = s.animate([{transform:'translate(0,0) scale(.3)', opacity:1}, {transform:`translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d - 16).toFixed(1)}px) scale(${(0.6 + Math.random() * 0.6).toFixed(2)})`, opacity:0}], {duration:650 + Math.random() * 250, easing:EASE_OUT});
    an.onfinish = () => s.remove(); an.oncancel = () => s.remove();
  }
}
function podiumEntrance(el){
  if (!M()) return;
  const gm = GM.podium ? GM.podium(el) : null; /* {r1, r2, r3} : instants où la carte se pose, en ms */
  const delays = gm || {r3:0, r2:170, r1:340};
  $$('.stage .step', el).forEach(stp => {
    const k = ['r1', 'r2', 'r3'].find(c => stp.classList.contains(c)); const d = delays[k] || 0;
    if (!gm) {
      anim($('.plinth', stp), [{transform:'scaleY(0)'}, {transform:'none'}], {duration:680, delay:d, easing:EASE_BACK, fill:'backwards'});
      anim($('.step-card', stp), [{opacity:0, transform:'translateY(-28px)'}, {opacity:1, transform:'none'}], {duration:560, delay:d + 300, easing:EASE_OUT, fill:'backwards'});
    }
    const sc = $('.step-score', stp); if (sc) { const v = num(sc.dataset.score); sc.textContent = fmtScore(0); setTimeout(() => countUp(sc, v, 900), d + (gm ? 120 : 320)); }
  });
  if (!gm) $$('.rest li', el).forEach((li, i) => anim(li, [{opacity:0, transform:'translateX(-14px)'}, {opacity:1, transform:'none'}], {duration:420, delay:620 + i * 55, easing:EASE_OUT, fill:'backwards'}));
  else GM.sections(el);
}

/* ---------- Doublons ---------- */
function normUrl(u){
  try { const x = new URL(String(u).trim()); const parts = x.hostname.replace(/^www\./, '').split('.'); const site = parts.length >= 2 ? parts[parts.length - 2] : parts[0]; return (site + x.pathname.replace(/\/+$/, '')).toLowerCase(); }
  catch (e) { return ''; }
}
function checkDup(){
  const box = $('#li-dup'); if (!box) return;
  const k = normUrl($('#li-url').value);
  const hit = k ? listingsArr().find(l => l.id !== ML.editId && normUrl(l.url) === k) : null;
  if (!hit) { box.hidden = true; box.innerHTML = ''; return; }
  const was = box.hidden;
  box.innerHTML = `<span>Cette annonce est déjà dans le carnet : <strong>${esc(hit.title)}</strong>, proposée par ${esc(nameOf(hit.addedBy))}.</span><button type="button" class="btn btn-sm" data-dupopen="${esc(hit.id)}">Ouvrir la fiche</button>`;
  box.hidden = false;
  if (was) anim(box, [{opacity:0, transform:'translateY(-6px)'}, {opacity:1, transform:'none'}], {duration:320, easing:EASE_BACK});
}

/* ---------- Sondage de dates ---------- */
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dShort = d => d.toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
function summerWeeks(){
  const now = new Date(); const y = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  const d = new Date(y, 5, 19); while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  const out = []; const stop = new Date(y, 7, 29);
  while (d < stop) { const e = new Date(d); e.setDate(e.getDate() + 7); out.push({id:ymd(d), s:new Date(d), e}); d.setDate(d.getDate() + 7); }
  return out;
}
const WEEKS = summerWeeks(); const YEAR = WEEKS[0].s.getFullYear();
const weekLabel = w => dShort(w.s) + ' → ' + dShort(w.e);
function weekStats(){
  const ids = memberIds();
  return WEEKS.map(w => { let yes = 0, maybe = 0, no = 0; ids.forEach(u => { const a = (votesOf(u).avail || {})[w.id]; if (a === 2) yes++; else if (a === 1) maybe++; else if (a === 0) no++; }); return {w, yes, maybe, no, score:yes + maybe * 0.5}; });
}
function bestWeek(){
  const ws = weekStats(); if (!ws.some(x => x.yes + x.maybe > 0)) return null;
  return ws.slice().sort((a, b) => b.score - a.score || b.yes - a.yes || a.no - b.no)[0];
}
function periodSub(){
  const t = S.trip || {}; if (t.week) return '';
  const b = bestWeek();
  if (b) return `<button type="button" class="tf-sub" data-view="dates">Sondage : ${esc(weekLabel(b.w))} en tête</button>`;
  return canEdit() ? '<button type="button" class="tf-sub" data-view="dates">Donner mes disponibilités</button>' : '';
}
function cycleWeek(wid){
  if (!canEdit()) return;
  if (!S.members[S.myId]) { openSettings(true); return; }
  editMyVote(v => {
    v.avail = Object.assign({}, v.avail || {});
    const a = v.avail[wid]; const n = (a === 2) ? 1 : (a === 1) ? 0 : (a === 0) ? null : 2;
    if (n === null) delete v.avail[wid]; else v.avail[wid] = n;
  });
  saveVote(false); S.focusWeek = wid; schedule();
}
function fixWeek(wid){
  const w = WEEKS.find(x => x.id === wid); if (!w || !S.isOwner || !canEdit()) return;
  const f = d => d.toLocaleDateString('fr-FR', {day:'numeric', month:'long'});
  S.trip = Object.assign({}, S.trip, {week:wid, periode:'Du ' + f(w.s) + ' au ' + f(w.e) + ' ' + YEAR, updatedAt:Date.now()});
  S.stampWeek = true;
  writeDoc('trip/main', S.trip).then(() => toast('Semaine retenue'));
  schedule();
}
function fillDates(changed){
  const el = $('#dates'); if (!el) return;
  if (!dataReady()) { el.innerHTML = '<div class="pod-head"><div><h2 class="h2" style="font-size:34px">Quand partir à l’été ' + YEAR + ' ?</h2></div></div>' + skWrap('<div class="sk sk-banner"></div>' + skRows(5)); el._h = null; return; }
  const ids = memberIds(); const me = S.myId; const t = S.trip || {};
  const ws = weekStats(); const best = bestWeek(); const max = Math.max(1, ids.length);
  const canMark = canEdit() && !!S.members[me];
  const order = ids.slice().sort((a, b) => a === me ? -1 : b === me ? 1 : nameOf(a).localeCompare(nameOf(b), 'fr'));
  const hl = w => (t.week ? t.week === w.id : (best && best.w.id === w.id)) ? ' class="best"' : '';
  const ICO = {2:IC.yes, 1:IC.maybe, 0:IC.no}, TXT = {2:'disponible', 1:'peut-être', 0:'pas disponible'};
  const cell = (u, w) => {
    const a = (votesOf(u).avail || {})[w.id]; const has = a === 0 || a === 1 || a === 2;
    const lab = weekLabel(w) + ' : ' + (has ? TXT[a] : 'pas de réponse');
    if (u === me && canMark) return `<td${hl(w)}><button type="button" class="dc${has ? ' s' + a : ''}" data-week="${w.id}" aria-label="${esc('Ma réponse, ' + lab)}">${has ? ICO[a] : ''}</button></td>`;
    return `<td${hl(w)}><span class="dc${has ? ' s' + a : ''}" role="img" aria-label="${esc(nameOf(u) + ', ' + lab)}">${has ? ICO[a] : ''}</span></td>`;
  };
  const owner = S.isOwner && canEdit();
  const cRet = () => { const w = WEEKS.find(x => x.id === t.week); return `<div><p class="lab">Semaine retenue</p><p class="big">${esc(w ? weekLabel(w) : (t.periode || ''))}</p></div>${owner ? '<button type="button" class="btn" data-act="unfix-week">Changer de semaine</button>' : ''}`; };
  const cBest = (b = best) => `<div><p class="lab">En tête du sondage</p><p class="big">${esc(weekLabel(b.w))}</p><p>${b.yes} dispo · ${b.maybe} peut-être · ${b.no} pas dispo, sur ${esc(plural(ids.length, 'inscrit'))}</p></div>${owner ? `<button type="button" class="btn" data-fixweek="${b.w.id}">Retenir cette semaine</button>` : ''}`;
  const cNone = '<div><p class="big">Personne n’a encore répondu</p><p>Coche tes semaines possibles : la meilleure apparaîtra ici et dans le bandeau.</p></div>';
  const card = t.week ? cRet() : best ? cBest() : cNone;
  const table = ids.length ? `<div class="tbl-wrap"><table class="dt"><thead><tr><th scope="col" style="text-align:left;padding-left:12px">Personne</th>${WEEKS.map(w => `<th scope="col"${hl(w)}>${esc(dShort(w.s))}<br><span style="font-weight:600">→ ${esc(dShort(w.e))}</span></th>`).join('')}</tr></thead>
    <tbody>${order.map(u => `<tr><th scope="row">${esc(nameOf(u))}${u === me ? ' <span class="muted" style="font-weight:600">(toi)</span>' : ''}</th>${WEEKS.map(w => cell(u, w)).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><th scope="row" style="text-align:left;padding-left:12px">Total</th>${ws.map(x => `<td${hl(x.w)}><div class="wbar"><span class="col"><span style="transform:scaleY(${(x.score / max).toFixed(3)})"></span></span><span class="num small">${x.yes}${x.maybe ? ' + ' + x.maybe : ''}</span></div></td>`).join('')}</tr></tfoot></table></div>
    <div class="legend-d"><span><span class="dc s2">${IC.yes}</span>Dispo</span><span><span class="dc s1">${IC.maybe}</span>Peut-être</span><span><span class="dc s0">${IC.no}</span>Pas dispo</span><span>Sous chaque semaine : nombre de « dispo » + « peut-être ». Un « peut-être » compte pour une demi-voix.</span></div>`
    : '<p class="muted">Personne n’est encore inscrit.</p>';
  const html = `<div class="pod-head"><div><h2 class="h2" style="font-size:34px">Quand partir à l’été ${YEAR} ?</h2><p class="muted" style="max-width:62ch;margin-top:6px">Indique tes disponibilités semaine par semaine, du samedi au samedi. Un clic sur ta case passe de « dispo » à « peut-être », puis « pas dispo », puis la vide.</p></div></div>
    <section class="best-card">${card}${t.week ? '<span class="stamp stamp-week" aria-label="Retenu">Retenu</span>' : ''}</section>
    ${canEdit() && !S.members[me] ? '<p class="banner">Choisis ton prénom pour répondre au sondage. <button type="button" class="link-btn" data-act="profile">Choisir mon prénom</button></p>' : ''}
    ${table}`;
  if (el._h !== html) {
    const prevBars = $$('.wbar .col span', el).map(b => b.style.transform);
    el.innerHTML = html; el._h = html;
    /* Hauteur du bandeau constante (la plus grande des variantes) : plus aucun saut de page quand il change de contenu */
    const bc = $('.best-card', el);
    if (bc) {
      const w = bc.offsetWidth, key = w + '|' + (owner ? 1 : 0) + '|' + ids.length;
      if (el._bcKey !== key) {
        const pr = bc.cloneNode(false); pr.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;min-height:0;width:' + w + 'px';
        document.body.append(pr); let mh = 0;
        [cNone, cRet(), cBest(best || {w:WEEKS[0], yes:ids.length, maybe:ids.length, no:ids.length})].forEach(v => { if (v) { pr.innerHTML = v; mh = Math.max(mh, pr.offsetHeight); } });
        pr.remove(); el._bcKey = key; el._bcH = mh;
      }
      bc.style.minHeight = el._bcH + 'px';
    }
    if (!changed && prevBars.length && GM.bars) GM.bars($$('.wbar .col span', el), prevBars);
    if (S.stampWeek) { S.stampWeek = false; const sp = $('.best-card .stamp', el); if (sp && M() && GM.stamp) GM.stamp(sp, .2); }
    if (changed && M()) {
      anim($('.best-card', el), [{opacity:0, transform:'translateY(12px) scale(.98)'}, {opacity:1, transform:'none'}], {duration:520, delay:80, easing:EASE_OUT, fill:'backwards'});
      $$('tbody tr', el).forEach((tr, r) => $$('.dc', tr).forEach((c, i) => anim(c, [{opacity:0, transform:'scale(.5)'}, {opacity:1, transform:'none'}], {duration:380, delay:220 + r * 60 + i * 28, easing:EASE_BACK, fill:'backwards'})));
      $$('.wbar .col span', el).forEach((b, i) => { const fin = b.style.transform; anim(b, [{transform:'scaleY(0)'}, {transform:fin}], {duration:800, delay:300 + i * 45, easing:EASE_OUT, fill:'backwards'}); });
    }
  }
  if (S.focusWeek) {
    const b = $(`[data-week="${CSS.escape(S.focusWeek)}"]`, el);
    if (b) {
      b.focus({preventScroll:true});
      const row = b.closest('tr'); const idx = row ? $$('.dc', row).indexOf(b) : 0;
      if (!(row && M() && GM.wave && GM.wave(row, Math.max(0, idx)))) anim(b, [{transform:'scale(.8)'}, {transform:'scale(1.12)'}, {transform:'none'}], {duration:380, easing:EASE_OUT});
    }
    S.focusWeek = null;
  }
}

/* ---------- Depuis ta dernière visite ---------- */
function renderNews(){
  const el = $('#news'); const me = S.myId; const since = S.seenPrev;
  const off = () => { el.hidden = true; el._h = ''; };
  if (S.newsHidden || !since || !me) return off();
  const items = [];
  memberIds().filter(u => u !== me && (S.members[u].joinedAt || 0) > since).forEach(u => items.push(`<li><span>${esc(nameOf(u))} a rejoint le carnet</span></li>`));
  listingsArr().filter(l => l.addedBy !== me && (l.createdAt || 0) > since).sort((a, b) => b.createdAt - a.createdAt)
    .forEach(l => items.push(`<li><button type="button" data-open="${esc(l.id)}">${esc(nameOf(l.addedBy))} a proposé « ${esc(l.title)} »</button></li>`));
  const byL = {}; Object.values(S.comments).filter(c => c.by !== me && (c.at || 0) > since && S.listings[c.lid]).forEach(c => { byL[c.lid] = (byL[c.lid] || 0) + 1; });
  Object.keys(byL).forEach(lid => items.push(`<li><button type="button" data-open="${esc(lid)}">${esc(plural(byL[lid], 'commentaire'))} sur « ${esc(S.listings[lid].title)} »</button></li>`));
  const voters = memberIds().filter(u => u !== me && (votesOf(u).updatedAt || 0) > since);
  if (voters.length) items.push(`<li><span>${esc(voters.map(nameOf).join(', '))} ${voters.length > 1 ? 'ont' : 'a'} voté</span></li>`);
  if (!items.length) return off();
  const n = Math.min(8, items.length);
  const html = `<p class="news-t">Depuis ta dernière visite</p><button type="button" class="news-t news-tg" data-act="news-toggle" aria-expanded="${!!S.newsOpen}">Depuis ta dernière visite <span class="news-n">${n} nouveauté${n > 1 ? 's' : ''}</span>${IC.chev}</button><ul>${items.slice(0, 8).join('')}</ul><button type="button" class="link-btn" data-act="news-hide">J’ai vu</button>`;
  if (el._h === html) return;
  const first = el.hidden; el.innerHTML = html; el._h = html; el.hidden = false; el.classList.toggle('open', !!S.newsOpen);
  if (first) { const hh = el.offsetHeight; anim(el, [{opacity:0, transform:'translateY(-10px)', height:'0px', paddingBlock:'0px', overflow:'hidden'}, {opacity:1, transform:'none', height:hh + 'px', overflow:'hidden'}], {duration:480, easing:EASE_OUT}); $$('li', el).forEach((li, i) => anim(li, [{opacity:0, transform:'scale(.9)'}, {opacity:1, transform:'none'}], {duration:360, delay:160 + i * 60, easing:EASE_BACK, fill:'backwards'})); }
}

/* ---------- Connexion et base de données (Supabase) ---------- */
const MAIL_DOMAIN = 'notre-gite.example.com';
const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const newId = () => ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, '').slice(0, 20);
function sbErr(e){
  const m = (e && e.message) || '';
  const refused = e && (e.code === '42501' || /row-level security|permission denied/i.test(m));
  return {code: refused ? 'invalid_argument' : 'unavailable', message: m};
}
/* Même interface que la base des pages Claude : doc(chemin) / collection(nom), lecture en direct. */
function makeDb(sb, uid){
  const cache = new Map(); const docL = new Map(); const colL = new Map(); const loaded = new Set();
  const colOf = p => p.split('/').slice(0, -1).join('/');
  const meta = {fromCache:false, hasPendingWrites:false};
  const snapDoc = p => ({id:p.split('/').pop(), exists:cache.has(p), data:() => cache.get(p), metadata:meta});
  const snapCol = c => { const docs = Array.from(cache.keys()).filter(k => colOf(k) === c).map(snapDoc); return {docs, size:docs.length, empty:!docs.length, docChanges:() => [], metadata:meta}; };
  const emit = p => {
    (docL.get(p) || new Set()).forEach(f => f(snapDoc(p)));
    const c = colOf(p); if (loaded.has(c)) (colL.get(c) || new Set()).forEach(f => f(snapCol(c)));
  };
  sb.channel('docs-' + newId()).on('postgres_changes', {event:'*', schema:'public', table:'docs'}, pl => {
    if (pl.eventType === 'DELETE') { const p = pl.old && pl.old.path; if (p) { cache.delete(p); emit(p); } }
    else if (pl.new && pl.new.path) { cache.set(pl.new.path, pl.new.data); emit(pl.new.path); }
  }).subscribe();
  const docRef = p => {
    const ref = {
      id:p.split('/').pop(), path:p,
      async get(){ const {data, error} = await sb.from('docs').select('data').eq('path', p).maybeSingle(); if (error) throw sbErr(error); if (data) cache.set(p, data.data); else cache.delete(p); return snapDoc(p); },
      async set(d){ const {error} = await sb.from('docs').upsert({path:p, collection:colOf(p), data:d, updated_by:uid, updated_at:new Date().toISOString()}); if (error) throw sbErr(error); cache.set(p, d); emit(p); },
      async update(d){ const cur = cache.get(p); if (!cur) throw {code:'invalid_argument', message:'absent'}; return ref.set(Object.assign({}, cur, d)); },
      async delete(){ const {error} = await sb.from('docs').delete().eq('path', p); if (error) throw sbErr(error); cache.delete(p); emit(p); },
      onSnapshot(next, onErr){ if (!docL.has(p)) docL.set(p, new Set()); docL.get(p).add(next); ref.get().then(next, e => onErr && onErr(e)); return () => docL.get(p).delete(next); },
      collection(c){ return colRef(p + '/' + c); }
    };
    return ref;
  };
  const colRef = c => ({
    path:c,
    doc(id){ return docRef(c + '/' + (id || newId())); },
    async add(d){ const r = docRef(c + '/' + newId()); await r.set(d); return r; },
    onSnapshot(next, onErr){
      if (!colL.has(c)) colL.set(c, new Set()); colL.get(c).add(next);
      sb.from('docs').select('path,data').eq('collection', c).then(({data, error}) => {
        if (error) { if (onErr) onErr(sbErr(error)); return; }
        (data || []).forEach(r => cache.set(r.path, r.data)); loaded.add(c); next(snapCol(c));
      });
      return () => colL.get(c).delete(next);
    }
  });
  /* Au retour sur la page (iPhone : Safari coupe la connexion en arrière-plan), on relit tout ce qui est suivi. */
  async function refresh(){
    await Promise.all(Array.from(loaded).map(async c => {
      const {data, error} = await sb.from('docs').select('path,data').eq('collection', c); if (error) return;
      const seen = new Set((data || []).map(r => r.path));
      Array.from(cache.keys()).forEach(k => { if (colOf(k) === c && !seen.has(k)) cache.delete(k); });
      (data || []).forEach(r => cache.set(r.path, r.data));
      (colL.get(c) || new Set()).forEach(f => f(snapCol(c)));
    }).concat(Array.from(docL.keys()).map(p => docRef(p).get().then(sn => (docL.get(p) || new Set()).forEach(f => f(sn)), () => {}))));
  }
  return {doc:docRef, collection:colRef, refresh};
}
/* Photos : stockées dans le « bucket » photos de Supabase. */
function makeAssets(sb, uid){
  return {
    async upload(blob, opt){
      const type = (opt && opt.type) || blob.type || 'image/jpeg';
      const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
      const path = uid + '/' + newId() + '.' + ext;
      const {error} = await sb.storage.from('photos').upload(path, blob, {contentType:type, upsert:false});
      if (error) throw {code:/exceed|size|large/i.test(error.message || '') ? 'too_large' : 'upstream_error', message:error.message};
      return {id:path, url:photoUrl(path)};
    },
    async delete(id){ await sb.storage.from('photos').remove([id]); return {deleted:true}; }
  };
}
/* Téléchargements : fichier enregistré directement par le navigateur. */
const DOWNLOADS = {
  async save({filename, data}){
    const type = /\.csv$/.test(filename) ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8';
    const blob = data instanceof Blob ? data : new Blob([data], {type});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return {status:'saved'};
  }
};
function hideBoot(){ const b = $('#boot'); if (!b) return; b.classList.add('out'); setTimeout(() => b.remove(), 400); }
function showLogin(msg){
  S.waiting = false; hideBoot();
  const L = $('#login'); L.hidden = false; $('#app').inert = true;
  $('#lg-err').textContent = msg || '';
  const n = store.get('gite-name'); if (n && !$('#lg-name').value) $('#lg-name').value = n;
  $('#f-login').hidden = false; $('#lg-wait').hidden = true;
  if ($('#lg-name').value) { $('#lg-alt').open = true; setTimeout(() => $('#lg-code').focus(), 60); }
  if (!(M() && GM.login && GM.login(L))) anim($('.login-card'), [{opacity:0, transform:'translateY(14px) scale(.98)'}, {opacity:1, transform:'none'}], {duration:520, easing:EASE_OUT});
}
function showWait(failed){
  S.waiting = false; hideBoot();
  const L = $('#login'); L.hidden = false; $('#app').inert = true;
  $('#f-login').hidden = true; $('#lg-wait').hidden = false;
  $('#lg-wait-t').textContent = failed ? 'Impossible de vérifier ton accès pour l’instant. Réessaie dans un instant.' : 'Ta demande est bien envoyée. Dès qu’un organisateur t’a validé, tu peux entrer dans le carnet.';
}
async function recheck(){
  const b = $('#lg-recheck'); if (!S.pendingSession || b.disabled) return;
  b.disabled = true; b.textContent = 'Vérification…';
  await start(S.pendingSession);
  b.disabled = false; b.textContent = 'Vérifier maintenant';
}
function hideLogin(){ $('#login').hidden = true; $('#app').inert = false; }
async function googleLogin(){
  const err = $('#lg-err'), btn = $('#lg-google'); err.textContent = ''; btn.disabled = true;
  let res;
  try { res = await SB.auth.signInWithOAuth({provider:'google', options:{redirectTo: location.origin + location.pathname, queryParams:{prompt:'select_account'}}}); }
  catch (e) { res = {error:{message:'network'}}; }
  if (res.error) { btn.disabled = false; err.textContent = /provider|enabled/i.test(res.error.message || '') ? 'La connexion Google n’est pas encore activée.' : 'Connexion impossible : vérifie ta connexion internet.'; }
}
async function doLogin(){
  const name = $('#lg-name').value.trim(), code = $('#lg-code').value;
  const err = $('#lg-err'), btn = $('#lg-btn');
  if (!name || !code) { err.textContent = 'Indique ton prénom (ou ton e-mail) et ton code, ou continue avec Google.'; return; }
  const isMail = name.includes('@');
  const email = isMail ? name.toLowerCase() : slug(name) + '@' + MAIL_DOMAIN;
  btn.disabled = true; btn.textContent = 'Connexion…'; err.textContent = '';
  let res;
  try { res = await SB.auth.signInWithPassword({email, password:code}); }
  catch (e) { res = {error:{message:'network'}}; }
  btn.disabled = false; btn.textContent = 'Entrer';
  if (res.error || !res.data || !res.data.session) {
    err.textContent = /fetch|network/i.test((res.error && res.error.message) || '') ? 'Connexion impossible : vérifie ta connexion internet.' : 'Identifiant ou code incorrect. Vérifie l’orthographe ou demande ton code à l’organisateur.';
    anim($('.login-card'), [{transform:'translateX(0)'}, {transform:'translateX(-8px)'}, {transform:'translateX(8px)'}, {transform:'translateX(-4px)'}, {transform:'none'}], {duration:360, easing:'ease-out'});
    return;
  }
  if (!isMail) store.set('gite-name', cap1(name));
  start(res.data.session);
}

/* ---------- Démarrage ---------- */
async function boot(){
  applyMotion(); readHash(); bindStatic();
  const C = window.GITE_CONFIG || {};
  if (!window.supabase && C.url && C.key && !/COLLE_ICI/.test(C.url + C.key)) { S.netMissing = true; S.waiting = false; S.booted = true; renderAll(); runIntro(); return; }
  if (!C.url || !C.key || /COLLE_ICI/.test(C.url + C.key)) { S.cfgMissing = true; S.waiting = false; S.booted = true; renderAll(); runIntro(); return; }
  SB = window.supabase.createClient(C.url, C.key);
  renderAll();
  let session = null;
  try { const {data} = await SB.auth.getSession(); session = data && data.session; } catch (e) {}
  if (session) start(session); else showLogin();
}
/* Séquence d'ouverture : jouée une seule fois, quand le carnet devient visible (donc après la connexion). */
function runIntro(){
  S.waiting = false; hideBoot();
  if (S.introDone) return; S.introDone = true;
  if (GM.ready && M() && GM.intro) { if (performance.now() > 500) setTimeout(() => GM.intro(renderHeader), 200); else GM.intro(renderHeader); return; }
  document.documentElement.classList.remove('js-motion'); /* sans GSAP ou sans animations : retour au fondu CSS d'origine */
}
async function isApproved(uid){
  try {
    const [a, m] = await Promise.all([SB.from('admins').select('user_id').eq('user_id', uid).maybeSingle(), SB.from('approved').select('user_id').eq('user_id', uid).maybeSingle()]);
    if (a.error || m.error) return null;
    S.isOwner = !!a.data;
    return !!(a.data || m.data);
  } catch (e) { return null; }
}
async function start(session){
  const uid = session.user.id;
  const ok = await isApproved(uid);
  if (ok !== true) { S.pendingSession = session; showWait(ok === null); return; }
  S.pendingSession = null; hideLogin(); runIntro();
  S.myId = uid; S.db = makeDb(SB, uid); S.assets = makeAssets(SB, uid); S.downloads = DOWNLOADS; S.sample = null;
  const meta = session.user.user_metadata || {};
  S.meName = meta.prenom || meta.given_name || (meta.full_name || '').split(' ')[0] || store.get('gite-name') || cap1(((session.user.email || '').split('@')[0] || '').split('-')[0]);
  S.booted = true;
  subscribe(); renderAll();
  if (S.isOwner) SB.from('pending').select('user_id', {count:'exact', head:true}).then(r => { if (r.count) setTimeout(() => toast(r.count + (r.count > 1 ? ' personnes attendent' : ' personne attend') + ' ta validation (Réglages)'), 1500); }, () => {});
}
function dbErr(e){ if (e && e.code === 'revoked') { S.readOnly = true; schedule(); } }
function subscribe(){
  const db = S.db;
  db.doc('config/main').onSnapshot(s => { S.config = s.exists ? s.data() : null; schedule(); }, dbErr);
  db.doc('trip/main').onSnapshot(s => { S.trip = s.exists ? s.data() : {}; S.loaded.trip = true; schedule(); }, dbErr);
  db.collection('members').onSnapshot(q => { const m = {}; q.docs.forEach(d => { m[d.id] = d.data(); }); S.members = m; if (!q.metadata.fromCache) S.loaded.members = true; schedule(); }, dbErr);
  db.collection('votes').onSnapshot(q => { const v = {}; q.docs.forEach(d => { v[d.id] = d.data(); }); if (S.myVoteDirty && S.votes[S.myId]) v[S.myId] = S.votes[S.myId]; S.votes = v; S.loaded.votes = true; schedule(); }, dbErr);
  db.collection('listings').onSnapshot(q => { const l = {}; q.docs.forEach(d => { l[d.id] = Object.assign({}, d.data(), {id:d.id}); }); S.listings = l; S.loaded.listings = true; schedule(); }, dbErr);
  db.collection('comments').onSnapshot(q => { const c = {}; q.docs.forEach(d => { c[d.id] = Object.assign({}, d.data(), {id:d.id}); }); S.comments = c; schedule(); }, dbErr);
}
let raf = 0;
function schedule(){ if (raf) return; raf = requestAnimationFrame(() => { raf = 0; renderAll(); }); }
function renderAll(){
  S.st = computeStats();
  if (S.seenPrev === undefined && S.loaded.members && S.myId && S.members[S.myId]) {
    S.seenPrev = S.members[S.myId].seenAt || 0;
    if (canEdit()) setTimeout(() => { const m = S.members[S.myId]; if (m) writeDoc('members/' + S.myId, Object.assign({}, m, {seenAt:Date.now()})); }, 5000);
  }
  renderHeader(); renderBanner(); renderTrip(); renderNews(); renderTabs(); renderView();
  if (S.openId) updateDrawer();
  if (S.booted && S.loaded.members && S.myId && !S.readOnly && S.db && !S.members[S.myId] && !S.onboardShown && $('#modal').hidden) { S.onboardShown = true; openSettings(true); }
  maybeReveal();
}

/* ---------- En-tête, bandeau, onglets ---------- */
function renderHeader(){
  const tEl = $('#title'), tTxt = cfg().title || DEFAULT_CONFIG.title;
  if (!GM.titleLocked && tEl.textContent !== tTxt) tEl.textContent = tTxt; /* pendant l'ouverture animée, le titre est découpé en lettres : on n'y touche pas */
  const ids = memberIds();
  const avEl = $('#avatars');
  const avHTML = ids.slice(0, 8).map(id => avatar(id)).join('') + (ids.length > 8 ? `<span class="av av-more">+${ids.length - 8}</span>` : '');
  const loadingAv = !!S.db && !S.loaded.members && !avEl._h;
  if (loadingAv) { if (!avEl.firstChild) avEl.innerHTML = '<span class="av sk sk-av"></span><span class="av sk sk-av"></span><span class="av sk sk-av"></span>'; }
  else if (avEl._h !== avHTML) {
    const first = !avEl._h; avEl.innerHTML = avHTML; avEl._h = avHTML;
    if (first && ids.length && S.introDone && M() && GM.avatars) GM.avatars(avEl);
  }
  $('#grp').textContent = loadingAv ? '' : (ids.length ? plural(ids.length, 'inscrit') : '');
  if (!$('#gear-pop').hidden) renderGear();
  $('#add-btn').hidden = !canEdit(); $('#add-fab').hidden = !canEdit();
}
function renderBanner(){
  let msg = '';
  if (S.cfgMissing) msg = 'Le site n’est pas encore relié à sa base de données : renseigne l’adresse et la clé Supabase dans le fichier config.js.';
  else if (S.netMissing) msg = 'Impossible de joindre la base de données (connexion coupée ?). Vérifie ta connexion puis recharge la page.';
  else if (S.booted && !S.db) msg = 'Connecte-toi pour voir les logements du groupe et voter.';
  else if (S.booted && !S.myId) msg = 'Ton compte n’est pas reconnu sur cette page : tu peux regarder, mais pas voter.';
  else if (S.readOnly) msg = 'Tu peux consulter le carnet mais pas le modifier. Préviens l’organisateur.';
  else if (cfg().closed) msg = 'Les votes sont clos depuis le ' + fmtLong(cfg().closedAt) + '. Le podium est définitif.';
  const b = $('#banner'); b.hidden = !msg; b.textContent = msg;
}
function avancementHTML(){
  const ls = listingsArr(); const n = ls.length;
  if (!n) return '<span class="tf-v tf-empty">Aucun logement pour l’instant</span>';
  const k = ls.filter(l => { const x = st(l.id); return x.total > 0 && x.voted >= x.total; }).length;
  return `<span class="tf-v">${esc(plural(n, 'logement'))}</span><button type="button" class="tf-sub" data-view="podium">${k} / ${n} noté${k > 1 ? 's' : ''} par tout le monde</button>`;
}
function renderTrip(force){
  const band = $('#trip');
  if (!force && band.querySelector('input')) return;
  const t = S.trip || {}; const ids = memberIds();
  const pen = canEdit();
  const wait = !!S.db && !S.loaded.trip;
  const html = TRIP_FIELDS.map(([k, l, ph]) => {
    const v = t[k];
    const inner = wait ? '<span class="sk sk-l sk-w80" style="height:26px"></span>' : pen
      ? `<button type="button" class="tf-v tf-edit${v ? '' : ' tf-empty'}" data-trip="${k}" aria-describedby="tl-${k}" title="Modifier">${esc(v || ph)}${IC.pen}</button>`
      : `<span class="tf-v">${esc(v || ph)}</span>`;
    return `<div class="tf"><span class="tf-l" id="tl-${k}">${l}</span>${inner}${k === 'periode' ? periodSub() : ''}</div>`;
  }).join('') + `<div class="tf"><span class="tf-l">Avancement</span>${dataReady() ? avancementHTML() : '<span class="sk sk-l sk-w70" style="height:26px"></span><span class="sk sk-l sk-w90"></span>'}</div><div class="tf"><span class="tf-l">Groupe</span>${!S.loaded.members && S.db ? '<span class="sk sk-l sk-w60" style="height:26px"></span>' : ''}<span class="tf-v"${!S.loaded.members && S.db ? ' hidden' : ''}>${ids.length ? esc(plural(ids.length, 'inscrit')) : 'Personne pour l’instant'}</span></div>`;
  if (force || band._h !== html) { band.innerHTML = html; band._h = html; }
}
function editTrip(k){
  const btn = $(`[data-trip="${k}"]`); if (!btn) return;
  const cur = (S.trip || {})[k] || '';
  const inp = document.createElement('input');
  inp.id = 'trip-in-' + k; inp.value = cur; inp.maxLength = 80; inp.setAttribute('aria-labelledby', 'tl-' + k);
  inp.placeholder = (TRIP_FIELDS.find(f => f[0] === k) || [])[2] || '';
  btn.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  const fin = save => {
    if (done) return; done = true;
    let v = inp.value.trim();
    if (save && v !== cur) {
      S.trip = Object.assign({}, S.trip, {[k]:v, updatedAt:Date.now()});
      writeDoc('trip/main', S.trip).then(() => toast('Voyage mis à jour'));
    }
    renderTrip(true);
    const nb = $(`[data-trip="${k}"]`); if (nb) nb.focus();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fin(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); } });
  inp.addEventListener('blur', () => fin(true));
}
let indPlaced = false;
function renderTabs(){
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.view === S.view)));
  placeInd(indPlaced); indPlaced = true;
}
function placeInd(animate){
  const nav = $('#tabs'), ind = $('#tab-ind'), a = $('.tab[aria-selected="true"]', nav); if (!a) return;
  /* offsetLeft/offsetTop ignorent les transformations : l'indicateur reste juste même quand les onglets sont en pleine animation d'entrée */
  /* Copie des onglets en couleurs inversées : la pastille les traverse par-dessus sans jamais les masquer */
  if (ind.children.length !== $$('button.tab', nav).length) ind.innerHTML = $$('button.tab', nav).map(t => `<span class="tab">${t.innerHTML}</span>`).join('');
  const nw = nav.clientWidth, nh = nav.clientHeight;
  if (!nw) return;
  const l = a.offsetLeft, t = a.offsetTop, w = a.offsetWidth, h = a.offsetHeight;
  ind.style.transition = animate && M() ? 'clip-path 360ms ' + EASE_OUT : 'none';
  ind.style.clipPath = `inset(${t}px ${nw - l - w}px ${nh - t - h}px ${l}px round 999px)`;
}
function setView(v){
  if (!VIEWS.includes(v) || v === S.view) return;
  closePop();
  S.navDir = VIEWS.indexOf(v) > VIEWS.indexOf(S.view) ? 1 : -1;
  S.view = v;
  try { history.replaceState(null, '', '#' + v); } catch (e) {}
  renderTabs();
  /* Onglets collants : si on a défilé loin, on remonte au début du nouvel onglet (juste sous la barre) */
  { const bar = $('.bar'), pn = $('#panel'); if (bar && pn) { const bb = bar.getBoundingClientRect(), pt = pn.getBoundingClientRect().top; if (pt < bb.bottom - 1) window.scrollTo({top:Math.max(0, scrollY + pt - bb.height - 8), behavior:'instant'}); } }
  if (M() && GM.swap && lastView) {
    S.swapping = true;
    GM.swap($('#panel'), S.navDir, () => { renderView(); S.swapping = false; });
  } else renderView();
}
function readHash(){ const h = (location.hash || '').slice(1); if (VIEWS.includes(h)) S.view = h; }

/* ---------- Vues ---------- */
let lastView = null;
function renderView(){
  const panel = $('#panel'); const changed = lastView !== S.view;
  if (changed) {
    panel.innerHTML = shellHTML(S.view); lastView = S.view;
    panel.setAttribute('aria-labelledby', 'tab-' + S.view);
    const dx = (S.navDir || 0) * 32;
    if (!S.swapping) anim(panel, [{opacity:0, transform:`translate(${dx}px, ${dx ? 0 : 10}px)`}, {opacity:1, transform:'none'}], {duration:360, easing:EASE_OUT}); /* sinon c'est GM.swap qui anime le panneau */
    S.navDir = 0;
  }
  ({galerie:fillGallery, comparateur:fillCompare, podium:fillPodium, carte:fillMap, dates:fillDates})[S.view](changed);
}
function filtersHTML(withSort){
  return `<div class="filters"><h2 class="count" id="g-count"></h2><div class="f-set">
    <div class="fld"><label for="f-dept">Département</label><select id="f-dept"></select></div>
    <div class="fld"><label for="f-status">Statut</label><select id="f-status"></select></div>
    <div class="fld" id="f-dispo-fld" hidden><label for="f-dispo">Semaine retenue</label><select id="f-dispo"><option value="">Tous</option><option value="oui">Libres</option><option value="pasnon">Sauf « pas libre »</option></select></div>
    ${withSort ? '<div class="fld"><label for="f-sort">Trier par</label><select id="f-sort"></select></div>' : ''}
  </div></div>`;
}
function shellHTML(v){
  if (v === 'galerie') return `${filtersHTML(true)}<div class="g-layout" style="margin-top:20px">
    <div class="g-main"><div id="todo"></div><div class="grid" id="grid"></div></div>
    <aside class="g-side" aria-label="Aperçu">
      <section class="side-card"><h3 class="side-t">Où sont-ils ?</h3><div id="mini-map"></div><p class="small muted">Clique sur un département pour l’explorer sur la carte.</p></section>
      <section class="side-olive" id="side-podium"></section>
    </aside></div>`;
  if (v === 'comparateur') return `${filtersHTML(false)}<div class="tbl-wrap" style="margin-top:20px" id="cmp-wrap"></div>
    <p class="note" style="margin-top:12px">Les notes d’un logement apparaissent dès que tu l’as noté toi-même. Clique sur un titre de colonne pour trier.</p>`;
  if (v === 'podium') return `<div id="podium" class="sec-gap" style="gap:28px"></div>`;
  if (v === 'dates') return `<div id="dates" class="sec-gap" style="gap:22px"></div>`;
  return `<div class="map-layout"><div class="map-wrap"><div class="map-ctrl"><button type="button" class="btn btn-sm" id="map-reset" data-act="map-reset" hidden>Vue d’ensemble</button></div><div id="big-map"></div>
    <div class="legend"><span><i style="background:var(--land-on)"></i>Département avec des logements</span><span><i style="background:var(--accent);border-color:var(--accent);border-radius:50%"></i>Logement</span></div></div>
    <aside class="map-side" id="map-side" aria-live="polite"></aside></div>`;
}
const fpass = l => (!S.f.dept || l.dept === S.f.dept) && (!S.f.status || statusOf(l).s.id === S.f.status) && (!S.f.dispo || !(S.trip || {}).week || (S.f.dispo === 'oui' ? dispoOf(l) === 'oui' : dispoOf(l) !== 'non'));
function fillFilterSelects(){
  { const df = $('#f-dispo-fld'); if (df) { df.hidden = !(S.trip || {}).week; const sel = $('#f-dispo'); if (sel && document.activeElement !== sel) sel.value = S.f.dispo || ''; } }
  const d = $('#f-dept'), s = $('#f-status'), so = $('#f-sort');
  if (d && document.activeElement !== d) {
    const present = Array.from(new Set(listingsArr().map(l => l.dept).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr', {numeric:true}));
    if (S.f.dept && !present.includes(S.f.dept)) present.push(S.f.dept);
    d.innerHTML = '<option value="">Tous</option>' + present.map(c => `<option value="${esc(c)}">${esc(depLabel(c))}</option>`).join('');
    d.value = S.f.dept;
  }
  if (s && document.activeElement !== s) {
    s.innerHTML = '<option value="">Tous</option>' + statuses().map(x => `<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
    s.value = S.f.status;
  }
  if (so && document.activeElement !== so) {
    const opts = [['score','Meilleure note'],['recent','Plus récents'],['prix','Prix croissant']].concat(crits().map(c => ['crit:' + c.id, 'Note : ' + c.label]));
    so.innerHTML = opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
    so.value = S.f.sort; if (so.value !== S.f.sort) { S.f.sort = 'score'; so.value = 'score'; }
  }
}
function countLabel(n, all){
  if (!all) return dataReady() ? 'Aucun logement' : 'Chargement…';
  return n === all ? plural(all, 'logement') : n + ' sur ' + plural(all, 'logement');
}
function galleryList(){
  const arr = listingsArr().filter(fpass); const s = S.f.sort;
  const key = l => s === 'score' ? st(l.id).overall : (s.startsWith('crit:') ? st(l.id).per[s.slice(5)] : null);
  arr.sort((a, b) => {
    if (s === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
    if (s === 'prix') { const pa = num(a.price), pb = num(b.price); return (pa == null ? 1e12 : pa) - (pb == null ? 1e12 : pb); }
    const va = canSee(a.id), vb = canSee(b.id);
    if (va !== vb) return va ? -1 : 1;
    if (!va) return (b.createdAt || 0) - (a.createdAt || 0);
    const ka = key(a), kb = key(b);
    return (kb == null ? -1 : kb) - (ka == null ? -1 : ka) || (b.createdAt || 0) - (a.createdAt || 0);
  });
  return arr;
}
function cardHTML(l){
  const s = st(l.id); const see = canSee(l.id);
  let score;
  if (see && s.overall != null) score = `<span class="score" data-v="${s.overall}" aria-label="Note moyenne ${fmtScore(s.overall)} sur 10">${fmtScore(s.overall)}</span>`;
  else if (canVote() && !hasCompleted(S.myId, l.id)) score = '<span class="todo">À toi de noter</span>';
  else score = '<span class="score score-none" aria-label="Pas encore noté">–</span>';
  const facts = [fmtPrice(num(l.price)), l.beds ? plural(l.beds, 'couchage') : '', l.bedrooms ? plural(l.bedrooms, 'chambre') : '', l.bathrooms ? plural(l.bathrooms, 'salle de bain', 'salles de bain') : ''].filter(Boolean).join(' · ');
  const eq = (l.equipments || []).slice(0, 4).join(' · ');
  const flipped = S.flipped.has(l.id);
  return `<article class="card${S.awayId === l.id ? ' card-away' : ''}${S.highlight === l.id ? ' hl' : ''}${flipped ? ' flipped' : ''}" data-k="${esc(l.id)}">
    ${photoHTML(l, badgesHTML(l, s, true))}${l.status === 'reserve' ? '<span class="stamp stamp-sm" aria-label="Retenu">Retenu</span>' : ''}
    <div class="cb">
      <div class="c-top"><div><h3 class="c-title">${esc(l.title || 'Sans titre')}</h3><p class="c-place">${esc(placeOf(l))}</p></div>${score}</div>
      <p class="facts">${esc(facts)}</p>
      ${eq ? `<p class="eq">${esc(eq)}</p>` : ''}
      <div class="chips">${chipHTML(l)}${dispoChip(l)}</div>
      <div class="foot"><span>Proposé par ${esc(nameOf(l.addedBy))}</span><span>${s.voted} / ${s.total} ont noté</span></div>
    </div>
    <button type="button" class="card-hit" data-open="${esc(l.id)}" aria-label="Ouvrir la fiche : ${esc(l.title || 'Sans titre')}"></button>
    <button type="button" class="flip-btn" data-flip="${esc(l.id)}" aria-label="Retourner la carte : les notes de ${esc(l.title || 'ce logement')}" aria-pressed="${flipped}">${IC.flip}</button>
    ${backHTML(l, s, see)}
  </article>`;
}
/* Dos de la carte : les notes par critère (cachées tant qu'on n'a pas noté, comme partout). */
function backHTML(l, s, see){
  const cs = crits();
  let body;
  if (see) {
    body = s.overall == null ? '<p class="muted small">Personne n’a encore tout noté.</p>' :
      `<ul class="bk-list">${cs.map(c => { const v = s.per[c.id]; return `<li><span>${esc(c.label)}</span><span class="gauge"><span style="transform:scaleX(${v == null ? 0 : (v / 10).toFixed(3)})"></span></span><b>${v == null ? '–' : fmtScore(v)}</b></li>`; }).join('')}</ul>`;
  } else body = `<div class="bk-lock">${IC.lock}<p>Note ce logement pour voir les notes du groupe.</p></div>`;
  return `<div class="card-back" aria-hidden="${!S.flipped.has(l.id)}"><div class="bk-top"><h3 class="bk-t">${esc(l.title || 'Sans titre')}</h3>${see && s.overall != null ? `<span class="bk-score">${fmtScore(s.overall)}<small>/10</small></span>` : ''}</div>${body}</div>`;
}
/* Attente du chargement : les éléments à venir apparaissent en silhouettes floutées qui brillent doucement. */
const skCard = () => `<article class="card sk-card" aria-hidden="true"><div class="sk sk-ph"></div><div class="cb"><div class="sk sk-l sk-w70"></div><div class="sk sk-l sk-w45"></div><div class="sk sk-l sk-w90" style="margin-top:14px"></div><div class="sk-chips"><span class="sk sk-pill"></span><span class="sk sk-pill"></span></div></div></article>`;
const skRows = n => Array.from({length:n}, () => `<div class="sk-row"><span class="sk sk-th"></span><span class="grow"><span class="sk sk-l sk-w60"></span><span class="sk sk-l sk-w35"></span></span><span class="sk sk-pill"></span></div>`).join('');
const skWrap = inner => `<div class="sk-wrap" role="status" aria-label="Chargement du carnet">${inner}<span class="sr-only">Chargement du carnet…</span></div>`;
function emptyHTML(){
  if (!dataReady()) return Array.from({length:6}, skCard).join('') + '<span class="sr-only" role="status">Chargement du carnet…</span>';
  if (listingsArr().length) return `<div class="empty"><h3>Aucun logement ne correspond</h3><p>Change de département ou de statut pour en voir d’autres.</p><button type="button" class="btn" data-act="reset-filters">Voir tous les logements</button></div>`;
  return `<div class="empty">${IC.house}<h3>Le carnet est encore vide</h3>
    <p>Trouve une annonce sur Airbnb, Abritel, Gîtes de France ou ailleurs, puis ajoute-la ici avec son lien. Colle le texte ou une capture d’écran de l’annonce : la fiche se remplit toute seule.</p>
    ${canEdit() ? '<button type="button" class="btn btn-accent" data-act="add">Ajouter le premier logement</button>' : ''}</div>`;
}
/* « Ce qu'il te reste à noter » et relance des retardataires */
function lateMembers(){ const all = listingsArr(); return memberIds().filter(u => all.some(l => !hasCompleted(u, l.id))); }
function fillTodo(){
  const el = $('#todo'); if (!el) return;
  let html = '';
  if (canVote() && dataReady() && !cfg().closed) {
    const todo = listingsArr().filter(l => !hasCompleted(S.myId, l.id)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const late = lateMembers().filter(u => u !== S.myId);
    if (todo.length || late.length) {
      html = `<section class="todo">${todo.length
        ? `<p class="todo-t">Il te reste ${todo.length > 1 ? todo.length + ' logements' : 'un logement'} à noter</p><ul class="todo-l">${todo.slice(0, 6).map(l => `<li><button type="button" data-open="${esc(l.id)}">${esc(l.title)}</button></li>`).join('')}${todo.length > 6 ? `<li><span>+ ${todo.length - 6}</span></li>` : ''}</ul>`
        : '<p class="todo-t">Tu as tout noté 👍</p>'}
        ${late.length ? `<div class="todo-r"><span class="small">${esc(late.map(nameOf).join(', '))} ${late.length > 1 ? 'n’ont' : 'n’a'} pas encore tout noté.</span><button type="button" class="btn btn-sm" data-act="nudge">Relancer</button></div>` : ''}</section>`;
    }
  }
  if (el._h !== html) { el.innerHTML = html; el._h = html; }
}
function setDispo(v){
  const l = S.listings[S.openId]; const w = (S.trip || {}).week; if (!l || !w || !canEdit()) return;
  const dispo = v ? {week:w, v, by:S.myId, at:Date.now()} : null;
  S.listings = Object.assign({}, S.listings, {[l.id]:Object.assign({}, l, {dispo})});
  const f = $('#dw-facts'); if (f) f.innerHTML = dwFacts(S.listings[l.id]);
  const b = $(`#dw-facts [data-dispo="${v}"]`); if (b) b.focus({preventScroll:true});
  patchDoc('listings/' + l.id, {dispo}).then(() => toast(v === 'oui' ? 'Noté : libre cette semaine-là' : v === 'non' ? 'Noté : pas libre cette semaine-là' : 'Disponibilité à vérifier'));
  schedule();
}
async function nudge(){
  const late = lateMembers().filter(u => u !== S.myId);
  const text = `Petit rappel pour ${cfg().title} : ${late.map(nameOf).join(', ')}, il vous reste des logements à noter 🙂`;
  const url = location.href.split('#')[0];
  try { if (navigator.share) { await navigator.share({title:cfg().title, text, url}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text + ' ' + url); toast('Message copié : colle-le dans votre conversation de famille.'); }
  catch (e) { toast(text); }
}
function fillGallery(changed){
  fillFilterSelects(); fillTodo();
  const list = galleryList();
  $('#g-count').textContent = countLabel(list.length, listingsArr().length);
  const grid = $('#grid');
  const html = list.length && dataReady() ? list.map(cardHTML).join('') : emptyHTML();
  if (grid._h !== html) {
    if (GM.killScroll) GM.killScroll('grid');
    const before = flipCapture(grid); grid.innerHTML = html; grid._h = html; flipPlay(grid, before, undefined, true);
    $$('.card', grid).forEach((c, i) => {
      const k = c.dataset.k; const s = st(k); const prev = S.prevMarks[k];
      if (!before.has(k)) {
        const sc = $('.score[data-v]', c);
        if (sc && M()) { const v = num(sc.dataset.v); sc.textContent = fmtScore(0); setTimeout(() => countUp(sc, v, 900), Math.min(i, 10) * 55 + 200); }
      } else if (prev) {
        if (s.hearts.length > prev[0]) anim($('.pas-heart', c), POP, {duration:460, easing:EASE_OUT});
        if (s.vetos.length > prev[1]) anim($('.pas-veto', c), POP, {duration:460, easing:EASE_OUT});
      }
      S.prevMarks[k] = [s.hearts.length, s.vetos.length];
    });
  }
  const mini = $('#mini-map'); const mm = mapSVG(true);
  if (mini._h !== mm) { mini.innerHTML = mm; mini._h = mm; if (changed) popPins(mini); }
  fillSidePodium();
}
/* Le podium se débloque quand on a tout noté, puis reste visible : un logement ajouté ensuite ne le recache plus. */
function podiumUnlocked(){
  const list = listingsArr();
  if (!wouldVote()) return true;
  if (votesOf(S.myId).podiumOpen) return list.length > 0;
  const ok = list.length > 0 && list.every(l => hasCompleted(S.myId, l.id));
  if (ok && canVote() && !S.podMarked) { S.podMarked = true; setTimeout(() => { editMyVote(v => { v.podiumOpen = true; }); flushVote(); }, 0); }
  return ok;
}
function fillSidePodium(){
  const el = $('#side-podium'); if (!el) return;
  const list = listingsArr();
  if (!dataReady()) { el.innerHTML = '<h3 class="side-t">Podium provisoire</h3><div class="sk sk-l sk-w90 sk-on-dark"></div><div class="sk sk-l sk-w70 sk-on-dark"></div><div class="sk sk-l sk-w80 sk-on-dark"></div>'; return; }
  if (!list.length) { el.innerHTML = '<h3 class="side-t">Podium provisoire</h3><p>Il apparaîtra quand les premiers logements seront notés.</p>'; return; }
  if (!podiumUnlocked()) {
    const done = list.filter(l => hasCompleted(S.myId, l.id)).length;
    el.innerHTML = `<h3 class="side-t">Podium provisoire</h3><p>Note les ${list.length} logements pour découvrir le podium. Tu en as noté ${done}.</p><div class="prog" aria-hidden="true"><span style="transform:scaleX(${done / list.length})"></span></div>`;
    return;
  }
  const top = ranking().filter(r => r.s.overall != null).slice(0, 3);
  el.innerHTML = '<h3 class="side-t">' + (cfg().closed ? 'Podium final' : 'Podium provisoire') + '</h3>' +
    (top.length ? top.map((r, i) => `<button type="button" class="pod-li" data-open="${esc(r.l.id)}"><span class="rk">${i + 1}</span><span class="tt">${esc(r.l.title)}</span><span class="sc">${fmtScore(r.s.overall)}</span></button>`).join('') : '<p>Pas encore assez de notes.</p>');
}

/* ---------- Carte ---------- */
function mapSVG(mini){
  const counts = {}; listingsArr().forEach(l => { if (l.dept) counts[l.dept] = (counts[l.dept] || 0) + 1; });
  const paths = DEP_LIST.map(d => {
    const n = counts[d.c] || 0;
    return `<path d="${d.d}" class="dep${n ? ' has' : ''}${!mini && S.mapSel === d.c ? ' sel' : ''}" data-dep="${d.c}"><title>${esc(d.n)} (${d.c})${n ? ' · ' + plural(n, 'logement') : ''}</title></path>`;
  }).join('');
  const r = mini ? 16 : 8;
  const pm = pinMap();
  const pins = listingsArr().map(l => {
    const p = pinPos(l, pm); if (!p) return '';
    return `<g class="pin${S.openId === l.id ? ' on' : ''}" ${mini ? 'data-open' : 'data-pinlid'}="${esc(l.id)}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})" tabindex="${mini ? -1 : 0}" role="button" aria-label="Ouvrir la fiche : ${esc(l.title)}"><g class="pin-s">${mini ? '' : `<circle r="${r * 2.6}" class="pin-hit"/>`}<circle r="${r * 1.4}" class="pin-halo"/><circle r="${r}" class="pin-dot"/></g></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${FR.w} ${FR.h}" class="fr ${mini ? 'fr-mini' : 'fr-big'}" role="group" aria-label="Carte de France des logements proposés"><g class="zoom"${mini ? '' : ' id="zoomg"'}>${paths}<g class="pins">${pins}</g></g></svg>`;
}
const mapDelay = el => { const d = DEP[el.dataset.dep]; return d ? Math.hypot(d.cx - FR.w / 2, d.cy - FR.h / 2) / Math.hypot(FR.w / 2, FR.h / 2) : 0; }; /* 0 au centre, 1 aux coins : l'onde part du milieu de la France */
function popPins(root){
  if (!M() || !root) return;
  if (GM.mapIn) GM.mapIn(root, mapDelay);
  if (GM.pins && GM.pins(root)) return;
  $$('.pin', root).forEach((p, i) => {
    const dl = 260 + Math.min(i, 14) * 70;
    anim($('.pin-dot', p), [{opacity:0, transform:'translateY(-44px)'}, {opacity:1, transform:'none'}], {duration:560, delay:dl, easing:EASE_BACK, fill:'backwards'});
    anim($('.pin-halo', p), [{opacity:.55, transform:'scale(.6)'}, {opacity:0, transform:'scale(2.5)'}], {duration:900, delay:dl + 440, easing:EASE_OUT});
  });
}
function applyZoom(animated){
  const g = $('#zoomg'); if (!g) return;
  let z = 1, tx = 0, ty = 0;
  if (S.mapSel) {
    const p = g.querySelector(`path[data-dep="${CSS.escape(S.mapSel)}"]`);
    if (p) {
      const b = p.getBBox();
      z = Math.max(1, Math.min(7, Math.min(FR.w / b.width, FR.h / b.height) * 0.5));
      tx = FR.w / 2 - (b.x + b.width / 2) * z; ty = FR.h / 2 - (b.y + b.height / 2) * z;
    }
  }
  g.style.transition = animated && M() ? `transform 700ms ${EASE_IO}, --inv 700ms ${EASE_IO}` : 'none';
  g.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  g.style.setProperty('--inv', String(1 / z));
  const rb = $('#map-reset'); if (rb) rb.hidden = !S.mapSel;
}
function fillMap(changed){
  const box = $('#big-map'); const html = mapSVG(false);
  if (box._h !== html) {
    box.innerHTML = html; box._h = html;
    if (changed && S.mapSel) {
      const sel = S.mapSel; S.mapSel = null; applyZoom(false); S.mapSel = sel;
      requestAnimationFrame(() => requestAnimationFrame(() => applyZoom(true)));
    } else applyZoom(false);
    if (changed) popPins(box);
  }
  fillMapSide();
}
/* Carte : un clic sur un point zoome d'abord sur son département ; une fois dedans, il ouvre la fiche. */
function pinGo(id){
  const l = S.listings[id]; if (!l) return;
  const big = !!$('#big-map .pin[data-pinlid="' + CSS.escape(id) + '"]');
  if (big && DEP[l.dept] && S.mapSel !== l.dept) { selectDep(l.dept); return; }
  S.clickSrc = null; openListing(id);
}
let tipPin = null;
function hidePinTip(){ const t = $('#map-tip'); tipPin = null; if (t) t.classList.remove('show'); }
function showPinTip(pin){
  const l = S.listings[pin.dataset.pinlid]; const wrap = pin.closest('.map-wrap'); if (!l || !wrap) return;
  let t = $('#map-tip'); if (!t) { t = document.createElement('div'); t.id = 'map-tip'; t.className = 'map-tip'; t.setAttribute('aria-hidden', 'true'); wrap.append(t); }
  const zoomed = S.mapSel === l.dept; const sc = st(l.id);
  t.innerHTML = `<span class="mt-ph">${photoHTML(l)}</span><span class="mt-b"><strong>${esc(l.title)}</strong><span>${esc([l.commune, fmtPrice(num(l.price))].filter(Boolean).join(' · '))}</span><em>${zoomed ? 'Ouvrir la fiche →' : 'Zoomer sur le département →'}</em></span>`;
  tipPin = pin; t.dataset.pinlid = l.id; t.classList.toggle('tap', S.ptype === 'touch');
  const wr = wrap.getBoundingClientRect(), dr = $('.pin-dot', pin).getBoundingClientRect();
  const tw = t.offsetWidth, th = t.offsetHeight;
  let x = dr.left + dr.width / 2 - wr.left; x = Math.max(tw / 2 + 8, Math.min(wr.width - tw / 2 - 8, x));
  let y = dr.top - wr.top - 12, below = y - th < 8; if (below) y = dr.bottom - wr.top + 12;
  t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.transform = below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
  t.classList.add('show');
}
function selectDep(c){
  hidePinTip();
  if (S.mapSel === c) return;
  S.mapSel = c;
  $$('#big-map .dep').forEach(p => p.classList.toggle('sel', p.dataset.dep === c));
  applyZoom(true); fillMapSide();
}
function mlItem(l){
  const s = st(l.id); const see = canSee(l.id);
  return `<li data-k="${esc(l.id)}"><button type="button" class="ml-item" data-open="${esc(l.id)}"><span class="thumb">${photoHTML(l)}</span><span class="grow"><span class="tt">${esc(l.title)}</span><br><span class="sub">${esc([l.commune, fmtPrice(num(l.price))].filter(Boolean).join(' · '))}</span></span>${see && s.overall != null ? `<span class="num big-num">${fmtScore(s.overall)}</span>` : ''}</button></li>`;
}
function fillMapSide(){
  const el = $('#map-side'); if (!el) return; let html = '';
  if (!dataReady()) { el.innerHTML = skWrap('<div class="sk sk-l sk-w45"></div><div class="sk sk-l sk-w70" style="height:26px"></div>' + skRows(3)); el._h = null; return; }
  const all = listingsArr();
  if (S.mapSel) {
    const d = DEP[S.mapSel]; const here = all.filter(l => l.dept === S.mapSel);
    html = `<div><p class="eyebrow">Département ${esc(S.mapSel)}</p><h2 class="h2">${esc(d ? d.n : S.mapSel)}</h2></div>` +
      (here.length ? `<ul class="ml">${here.map(mlItem).join('')}</ul>` : '<p class="muted">Aucun logement ici pour l’instant.</p>') +
      `<button type="button" class="btn btn-ghost" data-act="map-reset">Revenir à toute la France</button>`;
  } else {
    const by = {}; all.forEach(l => { const k = l.dept || '?'; (by[k] = by[k] || []).push(l); });
    const keys = Object.keys(by).sort((a, b) => by[b].length - by[a].length || a.localeCompare(b, 'fr', {numeric:true}));
    html = `<div><p class="eyebrow">Toute la France</p><h2 class="h2">${all.length ? plural(all.length, 'logement') + ' dans ' + plural(keys.length, 'département') : 'Aucun logement'}</h2></div>` +
      (keys.length ? `<ul class="ml">${keys.map(k => `<li><button type="button" class="ml-item" ${DEP[k] ? `data-pick-dep="${esc(k)}"` : 'disabled'}><span class="grow"><span class="tt">${esc(k === '?' ? 'Lieu à préciser' : depLabel(k))}</span><br><span class="sub">${esc(by[k].map(l => l.title).slice(0, 3).join(', '))}${by[k].length > 3 ? '…' : ''}</span></span><span class="num big-num">${by[k].length}</span></button></li>`).join('')}</ul>` : '<p class="muted">Les logements ajoutés apparaîtront ici et sur la carte.</p>');
  }
  if (el._h !== html) { el.innerHTML = html; el._h = html; }
}

/* ---------- Comparateur ---------- */
function sortTh(key, label, cls){
  const on = S.cmp.key === key;
  return `<th scope="col"${cls ? ` class="${cls}"` : ''} aria-sort="${on ? (S.cmp.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sort-btn" data-sort="${esc(key)}">${esc(label)}${IC.chev}</button></th>`;
}
/* Pour une ligne : le critère le mieux noté « s'allume », le plus bas « s'éteint » (s'ils diffèrent). */
function rank(s, cs, cid, see){
  if (!see) return '';
  const vals = cs.map(c => s.per[c.id]).filter(v => typeof v === 'number'); if (vals.length < 3) return '';
  const hi = Math.max.apply(null, vals), lo = Math.min.apply(null, vals); if (hi - lo < 1) return '';
  const v = s.per[cid]; return v === hi ? 'best' : v === lo ? 'low' : '';
}
function cellHTML(v, see, rk){
  if (!see) return `<span class="lock" title="Note ce logement pour voir">${IC.lock}</span>`;
  if (v == null) return '<span class="muted">–</span>';
  return `<div class="cell${rk ? ' ' + rk : ''}">${rk === 'best' ? '<span class="sr-only">meilleure note de ce logement : </span>' : rk === 'low' ? '<span class="sr-only">note la plus basse de ce logement : </span>' : ''}<span class="num">${fmtScore(v)}</span><span class="gauge"><span style="transform:scaleX(${(v / 10).toFixed(3)})"></span></span></div>`;
}
function fillCompare(changed){
  fillFilterSelects();
  const cs = crits(); const k = S.cmp.key, dir = S.cmp.dir;
  const all = listingsArr(); const arr = all.filter(fpass);
  $('#g-count').textContent = countLabel(arr.length, all.length);
  const val = l => {
    const s = st(l.id); const see = canSee(l.id);
    if (k === 'title') return String(l.title || '').toLowerCase();
    if (k === 'price') return num(l.price);
    if (k === 'ppn') return perPN(l);
    if (k === 'overall') return see ? s.overall : null;
    if (k === 'hearts') return s.hearts.length;
    if (k === 'voted') return s.voted;
    if (k.startsWith('c:')) return see ? s.per[k.slice(2)] : null;
    return null;
  };
  arr.sort((a, b) => { const va = val(a), vb = val(b); if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; if (typeof va === 'string') return dir * va.localeCompare(vb, 'fr'); return dir * (va - vb); });
  const wrap = $('#cmp-wrap');
  if (!dataReady()) { wrap.innerHTML = skWrap(skRows(6)); wrap._h = null; return; }
  if (!all.length) { wrap.innerHTML = `<div style="padding:24px">${emptyHTML()}</div>`; wrap._h = null; return; }
  let html = `<table class="cmp"><thead><tr>${sortTh('title', 'Logement', 'c-name')}${sortTh('price', 'Prix total')}${sortTh('ppn', 'Par nuit')}${cs.map(c => sortTh('c:' + c.id, c.label)).join('')}${sortTh('overall', 'Moyenne')}${sortTh('hearts', 'Cœurs et veto')}${sortTh('voted', 'Ont noté')}<th scope="col">Statut</th></tr></thead><tbody>` +
    arr.map(l => {
      const s = st(l.id); const see = canSee(l.id);
      return `<tr data-k="${esc(l.id)}"><td class="c-name"><button type="button" class="row-btn" data-open="${esc(l.id)}"><span class="thumb">${photoHTML(l)}</span><span><span class="tt">${esc(l.title)}</span><br><span class="sub">${esc(placeOf(l))}</span></span></button></td>
        <td class="num">${esc(num(l.price) == null ? '–' : fmtPrice(num(l.price)))}</td>
        <td class="num">${esc(fmtEur(perPN(l)))}</td>
        ${cs.map(c => `<td>${cellHTML(s.per[c.id], see, rank(s, cs, c.id, see))}</td>`).join('')}
        <td>${see ? (s.overall == null ? '<span class="muted">–</span>' : `<span class="num big-num">${fmtScore(s.overall)}</span>`) : `<span class="lock">${IC.lock}</span>`}</td>
        <td>${badgesHTML(l, s, true, true) || '<span class="muted">–</span>'}</td>
        <td class="num">${s.voted} / ${s.total}</td>
        <td>${chipHTML(l)}${dispoChip(l)}</td></tr>`;
    }).join('') + '</tbody></table>';
  const sortOpts = [['title', 'Nom'], ['price', 'Prix total'], ['ppn', 'Prix par nuit'], ['overall', 'Moyenne']].concat(cs.map(c => ['c:' + c.id, c.label]), [['hearts', 'Cœurs et veto'], ['voted', 'Ont noté']]);
  const cards = `<div class="cmp-cards"><div class="cc-bar"><label class="cc-sort"><span>Trier par</span><select id="cmp-sort" class="input">${sortOpts.map(o => `<option value="${esc(o[0])}"${o[0] === k ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label><button type="button" class="btn cc-dir" data-sortdir aria-label="${dir > 0 ? 'Ordre croissant' : 'Ordre décroissant'}">${dir > 0 ? '↑' : '↓'}</button></div>` +
    arr.map(l => {
      const s = st(l.id); const see = canSee(l.id);
      const crs = cs.map(c => `<li><span class="cc-l">${esc(c.label)}</span>${cellHTML(s.per[c.id], see, rank(s, cs, c.id, see))}</li>`).join('');
      return `<article class="cc" data-k="${esc(l.id)}"><button type="button" class="row-btn cc-top" data-open="${esc(l.id)}"><span class="thumb">${photoHTML(l)}</span><span class="grow"><span class="tt">${esc(l.title)}</span><br><span class="sub">${esc(placeOf(l))}</span></span><span class="cc-sc">${see ? (s.overall == null ? '<span class="muted">–</span>' : `<span class="num big-num">${fmtScore(s.overall)}</span><small>/ 10</small>`) : `<span class="lock">${IC.lock}</span>`}</span></button>
        <div class="cc-meta"><span class="num">${esc(num(l.price) == null ? '–' : fmtPrice(num(l.price)))}</span>${perPN(l) != null ? `<span class="small muted">${esc(fmtEur(perPN(l)))} / nuit</span>` : ''}${badgesHTML(l, s, true, true)}<span class="small muted">${s.voted} / ${s.total} ont noté</span>${chipHTML(l)}${dispoChip(l)}</div>
        ${crs ? `<ul class="cc-crit">${crs}</ul>` : ''}</article>`;
    }).join('') + '</div>';
  html += cards;
  if (!arr.length) html += '<p style="padding:16px" class="muted">Aucun logement ne correspond à ces filtres.</p>';
  if (wrap._h !== html) {
    const before = flipCapture(wrap); wrap.innerHTML = html; wrap._h = html; flipPlay(wrap, before, !changed);
    if (changed && M()) {
      if (!(GM.rows && GM.rows(wrap))) $$('tbody tr', wrap).forEach((tr, i) => anim(tr, [{opacity:0, transform:'translateY(10px)'}, {opacity:1, transform:'none'}], {duration:420, delay:80 + i * 50, easing:EASE_OUT, fill:'backwards'}));
      if (GM.lights) GM.lights(wrap);
      $$('.gauge>span', wrap).forEach((g, i) => { const fin = g.style.transform; anim(g, [{transform:'scaleX(0)'}, {transform:fin}], {duration:800, delay:220 + Math.floor(i / cs.length) * 50, easing:EASE_OUT, fill:'backwards'}); });
    }
  }
}

/* ---------- Podium ---------- */
function stepHTML(r, rank, forReveal){
  const l = r.l, s = r.s;
  return `<div class="step r${rank}"${forReveal ? '' : ` data-k="${esc(l.id)}"`}>
    <div class="step-card">${photoHTML(l)}<div class="step-b">
      <h3 class="step-t">${esc(l.title)}</h3><p class="step-p">${esc(placeOf(l))}</p>
      <div class="step-m"><span class="step-score" data-score="${s.overall}">${fmtScore(forReveal ? 0 : s.overall)}</span><span class="small muted">/ 10</span>${badgesHTML(l, s, !forReveal, true)}</div>
    </div></div>
    <div class="plinth" aria-hidden="true"><span class="pl-n">${rank}</span></div>
    ${forReveal ? '' : `<button type="button" class="card-hit" data-open="${esc(l.id)}" aria-label="${rank === 1 ? '1er' : rank + 'e'} : ${esc(l.title)}"></button>`}
  </div>`;
}
function whoHTML(){
  const ids = memberIds().sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr'));
  if (!ids.length) return '';
  const all = listingsArr(); const n = all.length;
  const lk = id => (id && S.listings[id]) ? `<button type="button" class="link-btn" style="color:var(--ink)" data-open="${esc(id)}">${esc(S.listings[id].title)}</button>` : '<span class="muted">–</span>';
  return `<section class="sec-gap"><h2 class="h2">Qui a voté quoi</h2><div class="tbl-wrap"><table class="who"><thead><tr><th scope="col">Personne</th><th scope="col">Logements notés</th><th scope="col">Coup de cœur</th><th scope="col">Veto</th></tr></thead><tbody>` +
    ids.map(u => { const v = votesOf(u); const done = all.filter(l => hasCompleted(u, l.id)).length;
      return `<tr><th scope="row"><span class="nm">${avatar(u, 'av-sm')}${esc(nameOf(u))}</span></th><td class="num">${done} / ${n}</td><td>${lk(v.heart)}</td><td>${lk(v.veto)}</td></tr>`; }).join('') +
    '</tbody></table></div></section>';
}
function fillPodium(changed){
  const el = $('#podium'); const c = cfg(); const all = listingsArr();
  if (!dataReady()) { const e = $('#podium'); e.innerHTML = '<div class="pod-head"><div><p class="eyebrow">Classement provisoire</p><h2 class="h2" style="font-size:34px">Le podium</h2></div></div>' + skWrap('<div class="sk-stage"><div class="sk sk-step s2"></div><div class="sk sk-step s1"></div><div class="sk sk-step s3"></div></div>'); e._h = null; return; }
  const unlocked = podiumUnlocked();
  let acts = '';
  if (S.isOwner && canEdit()) {
    if (!c.closed) acts += S.confirmClose
      ? `<div class="confirm"><span>Les votes seront figés pour tout le monde.${(() => { const nv = all.filter(l => st(l.id).vetos.length).length; const late = memberIds().filter(u => all.some(l => !hasCompleted(u, l.id))).length; return (nv ? ` ${nv > 1 ? nv + ' logements ont' : 'Un logement a'} un veto et ${nv > 1 ? 'passeront' : 'passera'} après les autres.` : '') + (late ? ` ${late > 1 ? late + ' personnes n’ont' : 'Une personne n’a'} pas encore tout noté.` : ''); })()}</span><button type="button" class="btn btn-sm btn-accent" data-act="close-confirm">Clore et révéler</button><button type="button" class="btn btn-sm" data-act="close-cancel">Annuler</button></div>`
      : `<button type="button" class="btn btn-olive" data-act="close-votes"${all.length ? '' : ' disabled'}>Clore les votes</button>`;
    else acts += '<button type="button" class="btn" data-act="reopen">Rouvrir les votes</button>';
  }
  if (c.closed && all.length) acts += '<button type="button" class="btn" data-act="replay">Revoir la révélation</button>';
  if (unlocked && all.length && S.downloads) acts += '<button type="button" class="btn" data-act="dl-md">Récap (.md)</button><button type="button" class="btn" data-act="dl-csv">Notes (.csv)</button>';
  const head = `<div class="pod-head"><div><p class="eyebrow">${c.closed ? 'Résultat final' : 'Classement provisoire'}</p><h2 class="h2" style="font-size:34px">${c.closed ? 'Votes clos le ' + esc(fmtLong(c.closedAt)) : 'Le podium'}</h2></div><div class="pod-actions">${acts}</div></div>`;
  if (!all.length) { el.innerHTML = head + '<div class="lock-card"><h3 class="h2">Pas encore de podium</h3><p class="muted">Il se remplira quand des logements auront été ajoutés et notés.</p></div>' + whoHTML(); el._h = null; return; }
  if (!unlocked) {
    const todo = all.filter(l => !hasCompleted(S.myId, l.id)); const done = all.length - todo.length;
    el.innerHTML = head + `<div class="lock-card">${IC.lock}<h3 class="h2">Note les ${all.length} logements pour découvrir le podium</h3>
      <p class="muted">Tu en as noté ${done}. Le classement reste caché tant que tu n’as pas tout noté, pour que chacun vote sans être influencé.</p>
      <div class="prog prog-ink" aria-hidden="true"><span style="transform:scaleX(${done / all.length})"></span></div>
      <ul class="ml">${todo.map(mlItem).join('')}</ul></div>` + whoHTML();
    el._h = null;
    return;
  }
  const ranked = ranking();
  const kept = ranked.filter(r => r.s.overall != null);
  const unrated = ranked.filter(r => r.s.overall == null);
  const vetoed = ranked.filter(r => r.s.vetos.length).length;
  const mine = wouldVote() ? all.filter(l => !hasCompleted(S.myId, l.id)) : [];
  const html = head +
    (kept.length ? `<div class="stage">${kept.slice(0, 3).map((r, i) => stepHTML(r, i + 1)).join('')}</div>` : '<div class="lock-card"><p class="muted">Pas encore assez de notes pour un podium.</p></div>') +
    (vetoed ? `<p class="pod-note">${IC.ban}<span>${vetoed > 1 ? vetoed + ' logements ont' : 'Un logement a'} reçu un veto : ${vetoed > 1 ? 'ils passent' : 'il passe'} après tous les autres dans le classement.</span></p>` : '') +
    (mine.length ? `<p class="pod-note">${IC.lock}<span>Tu n’as pas encore noté ${mine.length > 1 ? mine.length + ' logements' : '« ' + esc(mine[0].title) + ' »'} : pense à ${mine.length > 1 ? 'les' : 'le'} noter.</span></p>` : '') +
    (kept.length > 3 || unrated.length ? `<section class="sec-gap"><h2 class="h2">La suite du classement</h2><ul class="rest">${kept.slice(3).map((r, i) => `<li data-k="${esc(r.l.id)}"><button type="button" class="ml-item" data-open="${esc(r.l.id)}"><span class="rk">${i + 4}</span><span class="thumb">${photoHTML(r.l)}</span><span class="grow"><span class="tt">${esc(r.l.title)}</span><br><span class="sub">${esc(placeOf(r.l))}</span></span>${badgesHTML(r.l, r.s, false, true)}<span class="num big-num">${fmtScore(r.s.overall)}</span></button></li>`).join('')}${unrated.map(r => `<li data-k="${esc(r.l.id)}"><button type="button" class="ml-item" data-open="${esc(r.l.id)}"><span class="rk">·</span><span class="thumb">${photoHTML(r.l)}</span><span class="grow"><span class="tt">${esc(r.l.title)}</span><br><span class="sub">Pas encore noté</span></span></button></li>`).join('')}</ul></section>` : '') +
    whoHTML();
  if (el._h !== html) { if (GM.killScroll) GM.killScroll('sections'); const before = flipCapture(el); el.innerHTML = html; el._h = html; flipPlay(el, before, !changed); if (changed) podiumEntrance(el); }
}

/* ---------- Fiche ---------- */
const isCardEl = el => !!(el && el.matches && el.matches('.card'));
function srcCardOf(el){ return el && el.closest ? el.closest('.card') : null; }
function openListing(id){
  if (!S.listings[id]) return;
  const wasOpen = !!S.openId;
  S.openId = id; S.dwConfirm = false; S.highlight = null;
  if (!wasOpen) S.drawerTrigger = document.activeElement;
  const w = $('#drawer-wrap'), dw = $('#drawer');
  dw.innerHTML = drawerHTML(S.listings[id]);
  if (canSee(id)) S.unlockedSeen.add(id);
  let grown = false;
  if (!wasOpen) {
    const src = srcCardOf(S.clickSrc || S.drawerTrigger);
    w.hidden = false; void w.offsetWidth; w.classList.add('open'); $('#app').inert = true;
    grown = M() && GM.modalOpen && GM.modalOpen(dw, $('.dw-scrim', w), src);
    if (grown && isCardEl(src)) { S.awayId = id; src.classList.add('card-away'); }
  } else $('.dw-scroll', dw).scrollTop = 0;
  S.clickSrc = null;
  $('#dw-close').focus({preventScroll:true});
  markPins(); closePop();
  if (M() && !(GM.drawer && GM.drawer(dw))) {
    anim($('.dw-photo .ph > *', dw), [{transform:'scale(1.12)', opacity:.3}, {transform:'none', opacity:1}], {duration:900, easing:EASE_OUT});
    $$('.dw-pad > *', dw).forEach((el, i) => anim(el, [{opacity:0, transform:'translateY(18px)'}, {opacity:1, transform:'none'}], {duration:480, delay:150 + i * 70, easing:EASE_OUT, fill:'backwards'}));
  }
}
function closeDrawer(){
  if (!S.openId) return;
  const w = $('#drawer-wrap'), dw = $('#drawer'); w.classList.remove('open');
  const lastId = S.openId;
  S.openId = null; $('#app').inert = false;
  let t = S.drawerTrigger;
  if (!t || !document.contains(t)) t = $(`#app [data-open="${CSS.escape(lastId)}"]`);
  const fin = () => { if (!S.openId) { w.hidden = true; dw.innerHTML = ''; S.awayId = null; $$('.card-away').forEach(c => c.classList.remove('card-away')); } };
  if (M() && GM.modalClose) GM.modalClose(dw, $('.dw-scrim', w), srcCardOf($(`#panel .card[data-k="${CSS.escape(lastId)}"]`)), fin); else fin();
  if (t && S.kbd) t.focus({preventScroll:true}); else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  markPins();
}
function markPins(){ $$('.pin').forEach(p => p.classList.toggle('on', (p.dataset.open || p.dataset.pinlid) === S.openId)); }
function dwPhotoHTML(l){
  const ps = photosOf(l); if (ps.length < 2) return photoHTML(l);
  const tint = 'ph' + (hashN(l.id || 'x', 6) + 1);
  const ar = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  return `<div class="dw-track" id="dw-track" tabindex="0" role="group" aria-label="Photos du logement">${ps.map((p, i) => `<div class="ph ${tint}"><img src="${esc(photoUrl(p))}" alt="Photo ${i + 1} sur ${ps.length}"${i ? ' loading="lazy"' : ''} referrerpolicy="no-referrer" data-fb></div>`).join('')}</div>
    <button type="button" class="dw-nav dw-prev" data-pnav="-1" aria-label="Photo précédente">${ar('M15 5l-7 7 7 7')}</button>
    <button type="button" class="dw-nav dw-next" data-pnav="1" aria-label="Photo suivante">${ar('M9 5l7 7-7 7')}</button>
    <div class="dw-dots" aria-hidden="true">${ps.map((_, i) => `<span${i ? '' : ' class="on"'}></span>`).join('')}</div>`;
}
function drawerHTML(l){
  return `<button type="button" class="icon-btn dw-close" id="dw-close" aria-label="Fermer la fiche">${IC.x}</button>
  <div class="dw-scroll">
    <div class="dw-photo">${dwPhotoHTML(l)}${l.status === 'reserve' ? '<span class="stamp" aria-label="Retenu">Retenu</span>' : ''}</div>
    <div class="dw-pad">
      <div id="dw-head">${dwHead(l)}</div>
      <div id="dw-facts">${dwFacts(l)}</div>
      <section id="dw-vote" aria-label="Mon vote">${dwVote(l)}</section>
      <section id="dw-others" aria-label="Les notes du groupe">${dwOthers(l)}</section>
      <section id="dw-comments" aria-labelledby="dw-ct"><h3 class="sec-t" id="dw-ct">Commentaires</h3><div id="dw-clist">${dwComments(l)}</div>
        ${canEdit() ? `<form class="cform" id="dw-cform"><label for="dw-ctext" class="sr-only">Ton commentaire</label><textarea id="dw-ctext" class="input" rows="2" maxlength="1000" placeholder="Une remarque, une question pour le propriétaire…">${esc(store.get('gite-cdraft-' + l.id) || '')}</textarea><div class="row"><span class="hint">Ctrl + Entrée pour envoyer</span><button type="submit" class="btn btn-sm btn-accent">Envoyer</button></div></form>` : ''}
      </section>
    </div>
  </div>`;
}
function dwHead(l){
  const url = safeUrl(l.url);
  const ss = statuses(); const cur = statusOf(l).s.id;
  const canDel = S.isOwner && canEdit();
  return `<div class="sec-gap" style="gap:10px">
    <div class="chips">${canEdit() ? `<label for="dw-status" class="sr-only">Statut</label><select id="dw-status" style="min-height:36px;font-size:14px">${ss.map(s => `<option value="${esc(s.id)}"${s.id === cur ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>` : chipHTML(l)}${l.source ? `<span class="small muted">${esc(l.source)}</span>` : ''}</div>
    <h2 class="dw-title" id="dw-title">${esc(l.title || 'Sans titre')}</h2>
    <p class="muted">${esc(placeOf(l))}</p>
    <div class="dw-acts">
      ${url ? `<a class="btn btn-sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Voir l’annonce ${IC.ext}</a>` : ''}
      ${canEdit() ? `<button type="button" class="btn btn-sm" data-act="edit" data-id="${esc(l.id)}">Modifier</button>` : ''}
      ${canDel ? (S.dwConfirm ? `<span class="confirm"><span>Supprimer définitivement ?</span><button type="button" class="btn btn-sm btn-accent" data-act="del-confirm">Supprimer</button><button type="button" class="btn btn-sm" data-act="del-cancel">Annuler</button></span>` : `<button type="button" class="btn btn-sm btn-ghost" data-act="del">Supprimer</button>`) : ''}
    </div></div>`;
}
function dwFacts(l){
  const s = st(l.id);
  const nn = nightsOf(l), ppn = perPN(l);
  const items = [['Prix total', fmtPrice(num(l.price))], ['Prix vu pour', l.priceDates || (nn ? plural(nn, 'nuit') : '–')], ['Prix par nuit', ppn == null ? (num(l.price) != null && !nn ? 'Indique le nombre de nuits' : '–') : fmtEur(ppn)], ['Chambres', l.bedrooms != null && l.bedrooms !== '' ? l.bedrooms : '–'], ['Salles de bain', l.bathrooms != null && l.bathrooms !== '' ? l.bathrooms : '–'], ['Couchages', l.beds != null && l.beds !== '' ? l.beds : '–']];
  const eq = (l.equipments || []);
  const wk = (S.trip || {}).week && WEEKS.find(x => x.id === S.trip.week); const dv = dispoOf(l);
  const dispoBlock = wk ? `<div class="dispo"><span class="dispo-q">Libre la semaine retenue (${esc(weekLabel(wk))}) ?</span>${canEdit() ? `<div class="dispo-b" role="group" aria-label="Disponibilité">${[['oui', 'Oui'], ['non', 'Non'], ['', 'À vérifier']].map(([k, t]) => `<button type="button" class="btn btn-sm${(dv || '') === k ? ' on' : ''}" data-dispo="${k}" aria-pressed="${(dv || '') === k}">${t}</button>`).join('')}</div>` : `<strong>${dv === 'oui' ? 'Oui' : dv === 'non' ? 'Non' : 'À vérifier'}</strong>`}${l.dispo && l.dispo.week === wk.id && l.dispo.by ? `<span class="small muted">Vérifié par ${esc(nameOf(l.dispo.by))} ${esc(relTime(l.dispo.at))}</span>` : ''}</div>` : '';
  return `<div class="sec-gap" style="gap:16px">
    ${dispoBlock}
    <dl class="dl">${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${eq.length ? `<div class="eqs">${eq.map(e => `<span>${esc(e)}</span>`).join('')}</div>` : ''}
    ${l.note ? `<p class="quote">${esc(l.note)}</p>` : ''}
    <p class="small muted">Proposé par ${esc(nameOf(l.addedBy))}${l.createdAt ? ' le ' + esc(fmtDate(l.createdAt)) : ''}</p>
    ${marksHTML(s)}
  </div>`;
}
function dwVote(l){
  const head = '<div class="sec-h"><h3 class="sec-t">Mon vote</h3><span class="save-ind" id="dw-save" aria-live="polite"></span></div>';
  if (!S.myId || !S.db) return head + '<p class="muted" style="margin-top:8px">Connecte-toi pour voter.</p>';
  if (S.readOnly) return head + '<p class="muted" style="margin-top:8px">Ton accès permet de consulter, pas de voter.</p>';
  if (!S.members[S.myId]) return head + '<p class="muted" style="margin-top:8px">Choisis ton prénom pour voter. <button type="button" class="link-btn" data-act="profile">Choisir mon prénom</button></p>';
  const closed = cfg().closed; const v = votesOf(S.myId); const sc = (v.scores || {})[l.id] || {};
  const rows = crits().map(c => {
    return `<div class="vrow" data-crow="${esc(c.id)}" style="--dc:${heat(sc[c.id]) || 'var(--accent)'}">${voteRowInner(c, sc[c.id], closed)}</div>`;
  }).join('');
  const heartOn = v.heart === l.id, vetoOn = v.veto === l.id;
  const hints = [];
  if (v.heart && v.heart !== l.id && S.listings[v.heart]) hints.push('Ton coup de cœur actuel : ' + S.listings[v.heart].title + '.');
  if (v.veto && v.veto !== l.id && S.listings[v.veto]) hints.push('Ton veto actuel : ' + S.listings[v.veto].title + '.');
  if (v.heart && !S.listings[v.heart]) hints.push('Le logement de ton coup de cœur a été supprimé : tu peux le redonner.');
  if (v.veto && !S.listings[v.veto]) hints.push('Le logement de ton veto a été supprimé : tu peux le redonner.');
  hints.push('Un coup de cœur et un veto par personne : en choisir un autre le supprime d’ici.');
  return head + (closed ? '<p class="muted" style="margin-top:6px">Les votes sont clos.</p>' : '') +
    `<div class="vrows">${rows}</div>
    <div class="vtoggles">
      <button type="button" class="tgl tgl-heart${heartOn ? ' on' : ''}" data-heart="${esc(l.id)}" aria-pressed="${heartOn}"${closed ? ' disabled' : ''}>${IC.heart}<span>${heartOn ? 'Mon coup de cœur' : 'En faire mon coup de cœur'}</span></button>
      <button type="button" class="tgl tgl-veto${vetoOn ? ' on' : ''}" data-veto="${esc(l.id)}" aria-pressed="${vetoOn}"${closed ? ' disabled' : ''}>${IC.ban}<span>${vetoOn ? 'Mon veto' : 'Mettre mon veto'}</span></button>
    </div>
    ${heartOn ? `<div class="frow why-in"><label for="dw-hwhy">Pourquoi ce coup de cœur ? <span class="opt">facultatif</span></label><input id="dw-hwhy" class="input" maxlength="160" value="${esc(v.heartWhy || '')}" placeholder="La piscine, la vue, le calme…"${closed ? ' disabled' : ''}></div>` : ''}
    ${vetoOn ? `<div class="frow why-in"><label for="dw-vwhy">Pourquoi ce veto ? <span class="opt">facultatif</span></label><input id="dw-vwhy" class="input" maxlength="160" value="${esc(v.vetoWhy || '')}" placeholder="Trop loin, pas assez de chambres…"${closed ? ' disabled' : ''}></div>` : ''}
    <p class="small muted" style="margin-top:10px">${esc(hints.join(' '))}</p>`;
}
/* Couleur d'une note : du bleu froid (1) à l'orange chaud (10). */
const heat = n => typeof n === 'number' ? `hsl(${Math.round(208 - (n - 1) / 9 * 182)} 58% 46%)` : '';
function voteRowInner(c, cur, closed){
  let dots = '';
  for (let i = 1; i <= 10; i++) dots += `<button type="button" class="dot${cur >= i ? ' f' : ''}" style="--i:${i - 1}" data-score="${i}" data-c="${esc(c.id)}" aria-pressed="${cur === i}" aria-label="${i} sur 10"${closed ? ' disabled' : ''}></button>`;
  return `<span class="vl" id="vl-${esc(c.id)}">${esc(c.label)}</span><div class="dots" role="group" aria-labelledby="vl-${esc(c.id)}">${dots}</div><span class="vv">${cur == null ? '–' : cur}</span>`;
}
function paintVoteRow(cid, prev){
  const row = $(`[data-crow="${CSS.escape(cid)}"]`); if (!row) return;
  const cur = ((votesOf(S.myId).scores || {})[S.openId] || {})[cid];
  row.style.setProperty('--dc', heat(cur) || 'var(--accent)');
  $$('.dot', row).forEach(d => { const n = +d.dataset.score; d.classList.toggle('f', cur >= n); d.setAttribute('aria-pressed', String(cur === n)); });
  const vv = $('.vv', row); vv.textContent = cur == null ? '–' : cur;
  if (M() && GM.dots && GM.dots(row, prev, cur)) { if (typeof cur === 'number') GM.roll(vv, prev, cur); else anim(vv, [{transform:'scale(1.25)'}, {transform:'none'}], {duration:240, easing:EASE_OUT}); }
  else anim(vv, [{transform:'scale(1.25)'}, {transform:'none'}], {duration:240, easing:EASE_OUT});
}
function dwOthers(l){
  const s = st(l.id);
  const h = '<h3 class="sec-t">Les notes du groupe</h3>';
  if (!canSee(l.id)) {
    const sc = (votesOf(S.myId).scores || {})[l.id] || {};
    const left = applicable(S.myId).filter(c => typeof sc[c.id] !== 'number').length;
    const msg = !S.members[S.myId] ? 'Inscris-toi et note ce logement pour voir les notes des autres.' : (left > 1 ? `Note encore ${left} critères pour voir les notes des autres.` : 'Note le dernier critère pour voir les notes des autres.');
    return h + `<div class="locked">${IC.lock}<p>${msg} Ça évite de s’influencer.</p><p class="small muted">${s.voted} / ${s.total} ont déjà noté ce logement.</p></div>`;
  }
  const cs = crits();
  const voters = memberIds().filter(u => { const x = (votesOf(u).scores || {})[l.id]; return anyScore(x); }).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr'));
  if (!voters.length) return h + '<p class="muted" style="margin-top:8px">Personne n’a encore noté ce logement.</p>';
  return h + `<div class="ov"><span class="ov-n" id="dw-ov">${fmtScore(s.overall)}</span><span class="muted">/ 10 de moyenne · ${s.voted} / ${s.total} ont tout noté</span></div>
    <div class="tbl-wrap"><table class="mini-tbl"><thead><tr><th scope="col">Personne</th>${cs.map(c => `<th scope="col" title="${esc(c.label)}">${esc(c.label.split(' ')[0])}</th>`).join('')}</tr></thead><tbody>` +
    voters.map(u => { const x = (votesOf(u).scores || {})[l.id] || {}; const v = votesOf(u);
      return `<tr><td>${esc(nameOf(u))}${v.heart === l.id ? ' <span class="hearts" title="Coup de cœur">' + IC.heart + '</span>' : ''}${v.veto === l.id ? ' <span class="vetob">veto</span>' : ''}</td>${cs.map(c => `<td>${typeof x[c.id] === 'number' ? x[c.id] : '<span class="muted">–</span>'}</td>`).join('')}</tr>`; }).join('') +
    `</tbody><tfoot><tr><td>Moyenne</td>${cs.map(c => `<td>${fmtScore(s.per[c.id])}</td>`).join('')}</tr></tfoot></table></div>`;
}
function dwComments(l){
  const list = Object.values(S.comments).filter(c => c.lid === l.id).sort((a, b) => (a.at || 0) - (b.at || 0));
  if (!list.length) return '<p class="small muted" style="margin-top:8px">Pas encore de commentaire.</p>';
  return '<ul class="clist">' + list.map(c => `<li data-k="${esc(c.id)}">${avatar(c.by, 'av-sm')}<div class="cbody"><div class="cmeta"><strong>${esc(nameOf(c.by))}</strong><span>${esc(relTime(c.at))}</span>${canEdit() && (c.by === S.myId || S.isOwner) ? `<button type="button" class="link-btn" data-delc="${esc(c.id)}">Supprimer</button>` : ''}</div><p>${esc(c.text)}</p></div></li>`).join('') + '</ul>';
}
function updateDrawer(){
  const l = S.listings[S.openId];
  if (!l) { if (S.loaded.listings) { closeDrawer(); toast('Ce logement a été supprimé.'); } return; }
  const inside = el => el && el.contains(document.activeElement);
  const head = $('#dw-head'); if (head && !inside(head)) head.innerHTML = dwHead(l);
  const facts = $('#dw-facts'); if (facts) facts.innerHTML = dwFacts(l);
  const dph = $('.dw-photo'); if (dph) {
    const has = $('.stamp', dph);
    if (l.status === 'reserve' && !has) { dph.insertAdjacentHTML('beforeend', '<span class="stamp" aria-label="Retenu">Retenu</span>'); if (S.stampAnim === l.id) { S.stampAnim = null; if (M() && GM.stamp) GM.stamp($('.stamp', dph), .1); } }
    else if (l.status !== 'reserve' && has) has.remove();
  }
  const vote = $('#dw-vote'); if (vote && !inside(vote) && !S.myVoteDirty) { const save = $('#dw-save') ? $('#dw-save').textContent : ''; vote.innerHTML = dwVote(l); setSave(save); }
  const others = $('#dw-others'); if (others) {
    const wasLocked = !S.unlockedSeen.has(l.id);
    others.innerHTML = dwOthers(l);
    if (canSee(l.id) && wasLocked) { S.unlockedSeen.add(l.id); celebrateUnlock(); }
  }
  const cl = $('#dw-clist'); if (cl) { const b = flipCapture(cl); const had = new Set(b.keys()); cl.innerHTML = dwComments(l); if (had.size || $$('[data-k]', cl).length) flipPlay(cl, b, had.size > 0); }
}
function celebrateUnlock(){
  const ov = $('#dw-ov'); if (!ov) return;
  countUp(ov, st(S.openId).overall, 900);
  anim($('#dw-others .tbl-wrap'), [{opacity:0, transform:'translateY(8px)'}, {opacity:1, transform:'none'}], {duration:420, delay:120, easing:EASE_OUT, fill:'backwards'});
}
function setScore(cid, n){
  if (!canVote() || !S.openId) return;
  const lid = S.openId; const before = hasCompleted(S.myId, lid); const prevN = ((votesOf(S.myId).scores || {})[lid] || {})[cid];
  /* Au doigt, retoucher la même note ne l'efface pas (un double appui par erreur ferait tout recacher). */
  if (prevN === n && S.ptype === 'touch') return;
  editMyVote(v => { const cur = Object.assign({}, v.scores[lid] || {}); if (cur[cid] === n) delete cur[cid]; else cur[cid] = n; if (!cur._t0) cur._t0 = Date.now(); v.scores[lid] = cur; });
  paintVoteRow(cid, prevN); saveVote(false);
  if (before !== hasCompleted(S.myId, lid)) { S.st = computeStats(); updateOthersOnly(); }
  schedule();
}
function updateOthersOnly(){
  const l = S.listings[S.openId]; const o = $('#dw-others'); if (!l || !o) return;
  const wasLocked = !S.unlockedSeen.has(l.id);
  o.innerHTML = dwOthers(l);
  if (canSee(l.id) && wasLocked) { S.unlockedSeen.add(l.id); celebrateUnlock(); toast('Les notes du groupe sont visibles'); }
}
function toggleMark(lid, kind){
  if (!canVote()) return;
  const other = kind === 'heart' ? 'veto' : 'heart';
  editMyVote(v => {
    if (v[kind] === lid) { v[kind] = null; v[kind + 'Why'] = ''; }
    else { v[kind] = lid; v[kind + 'Why'] = ''; if (v[other] === lid) { v[other] = null; v[other + 'Why'] = ''; } }
  });
  saveVote(true);
  const factsEl = $('#dw-facts'), voteEl = $('#dw-vote'); const hF = factsEl ? factsEl.offsetHeight : null, hV = voteEl ? voteEl.offsetHeight : null;
  const sc = $('.dw-scroll'), sel = `#dw-vote [data-${kind}="${CSS.escape(lid)}"]`;
  const top0 = ($(sel) || {getBoundingClientRect:() => ({top:0})}).getBoundingClientRect().top;
  const hold = () => { const b = $(sel); if (sc && b) sc.scrollTop += b.getBoundingClientRect().top - top0; };
  $('#dw-vote').innerHTML = dwVote(S.listings[lid]); setSave('Enregistrement…');
  const btn = $(`[data-${kind}="${CSS.escape(lid)}"]`);
  const on = votesOf(S.myId)[kind] === lid;
  if (btn) {
    btn.focus({preventScroll:true});
    if (on && kind === 'heart') { anim($('svg', btn), [{transform:'scale(1)'}, {transform:'scale(1.6)'}, {transform:'scale(1)'}], {duration:420, easing:EASE_OUT}); burst(btn); }
    if (on && kind === 'veto') { anim(btn, [{transform:'translateX(0)'}, {transform:'translateX(-6px)'}, {transform:'translateX(6px)'}, {transform:'translateX(-3px)'}, {transform:'none'}], {duration:340, easing:'ease-out'}); anim($('svg', btn), [{transform:'rotate(0)'}, {transform:'rotate(-24deg)'}, {transform:'rotate(20deg)'}, {transform:'rotate(-12deg)'}, {transform:'none'}], {duration:420, easing:'ease-out'}); }
  }
  S.st = computeStats(); const f = $('#dw-facts'); if (f) f.innerHTML = dwFacts(S.listings[lid]);
  hold();
  if (M() && GM.heightFrom) {
    if (f) GM.heightFrom(f, hF, hold);
    GM.heightFrom($('#dw-vote'), hV, hold);
    GM.fadeIn($$('#dw-vote .why-in, #dw-facts .mk-block'));
  }
  schedule();
}

/* ---------- Ajouter / modifier un logement ---------- */
const ML = {shots:[], photos:[], editId:null, ai:false, lat:null, lng:null, ctl:null, touched:{}, ocrBusy:false, tTimer:0};
function openListingModal(id){
  if (!canEdit()) { toast('Ton accès ne permet pas d’ajouter de logement.'); return; }
  if (!S.members[S.myId]) { openSettings(true); return; }
  const l = id ? S.listings[id] : null;
  ML.shots = []; ML.editId = id || null; ML.ai = false; ML.touched = {}; ML.photos = photosOf(l || {}).map(id => ({type:'existing', id}));
  ML.lat = l ? num(l.lat) : null; ML.lng = l ? num(l.lng) : null;
  openModal(listingModalHTML(l || {}));
  renderShots(); renderPhotoZone(); checkDup();
}
function fieldHTML(id, label, input, opts){
  return `<div class="frow${opts && opts.full ? ' full' : ''}"><label for="${id}">${label}${opts && opts.opt ? ' <span class="opt">facultatif</span>' : ''}</label>${input}${opts && opts.hint ? `<span class="hint">${opts.hint}</span>` : ''}</div>`;
}
function listingModalHTML(l){
  const v = k => esc(l[k] == null ? '' : l[k]);
  const depOpts = '<option value="">Choisir…</option>' + DEP_LIST.map(d => `<option value="${d.c}"${l.dept === d.c ? ' selected' : ''}>${esc(d.c + ' · ' + d.n)}</option>`).join('') + `<option value="autre"${l.dept === 'autre' ? ' selected' : ''}>Hors métropole</option>`;
  const stOpts = statuses().map(s => `<option value="${esc(s.id)}"${statusOf(l).s.id === s.id ? ' selected' : ''}>${esc(s.label)}</option>`).join('');
  return `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="ml-title">
  <div class="mc-head"><h2 class="mc-t" id="ml-title">${ML.editId ? 'Modifier la fiche' : 'Ajouter un logement'}</h2><button type="button" class="icon-btn" data-close aria-label="Fermer">${IC.x}</button></div>
  <form id="f-listing" class="mc-body" novalidate>
    <section class="import" aria-labelledby="ml-s1">
      <h3 class="step-h" id="ml-s1">${ML.editId ? 'Recharger depuis l’annonce' : '1. Colle ce que tu as trouvé'}</h3>
      ${fieldHTML('li-url', 'Lien de l’annonce', `<input id="li-url" class="input" type="url" inputmode="url" placeholder="https://www.airbnb.fr/rooms/…" value="${v('url')}">`)}
      <div class="dup" id="li-dup" hidden role="status"></div>
      <div class="drop" id="li-drop"><input type="file" id="li-shots" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="sr-only"><label for="li-shots" class="btn btn-sm btn-accent">Ajouter des captures d’écran</label><span class="hint">ou glisse-les ici, ou colle-les avec Ctrl + V</span></div>
      <p class="hint">Description, équipements, prix, photos : le site lit le texte de tes captures et remplit la fiche tout seul. Une capture sans texte devient la photo de la fiche.</p>
      <div class="shots" id="li-shot-list"></div>
      <p class="ai-st" id="li-ai-st" role="status"></p>
      ${fieldHTML('li-text', 'Ou colle le texte de l’annonce', '<textarea id="li-text" class="input" rows="3" placeholder="Titre, prix, description, équipements…"></textarea>', {opt:true})}
    </section>
    <section class="sec-gap" aria-labelledby="ml-s2">
      <h3 class="step-h" id="ml-s2">${ML.editId ? 'La fiche' : '2. Vérifie la fiche'}</h3>
      <p class="hint">Les champs surlignés ont été remplis automatiquement : vérifie-les avant d’enregistrer.</p>
      <div class="fgrid">
        ${fieldHTML('li-title', 'Titre', `<input id="li-title" class="input" required maxlength="80" value="${v('title')}" placeholder="Longère avec piscine"><span class="err" id="li-title-err" hidden>Donne un titre au logement.</span>`, {full:true})}
        ${fieldHTML('li-source', 'Site', `<input id="li-source" class="input" maxlength="40" list="li-sources" value="${v('source')}" placeholder="Airbnb, Abritel…"><datalist id="li-sources">${SOURCES.map(s => `<option value="${esc(s[1])}"></option>`).join('')}</datalist>`)}
        ${fieldHTML('li-status', 'Statut', `<select id="li-status">${stOpts}</select>`)}
        ${fieldHTML('li-price', 'Prix total (€)', `<input id="li-price" class="input" inputmode="decimal" value="${v('price')}" placeholder="2480">`, {hint:'Le prix de tout le séjour, frais compris.'})}
        ${fieldHTML('li-dates', 'Prix vu pour', `<input id="li-dates" class="input" maxlength="60" value="${v('priceDates')}" placeholder="7 nuits du 12 au 19 juillet">`, {opt:true})}
        ${fieldHTML('li-commune', 'Commune', `<input id="li-commune" class="input" maxlength="60" value="${v('commune')}" placeholder="Sarlat-la-Canéda">`)}
        ${fieldHTML('li-dept', 'Département', `<select id="li-dept">${depOpts}</select>`)}
        ${fieldHTML('li-bedrooms', 'Chambres', `<input id="li-bedrooms" class="input" inputmode="numeric" value="${v('bedrooms')}" placeholder="5">`)}
        ${fieldHTML('li-bathrooms', 'Salles de bain', `<input id="li-bathrooms" class="input" inputmode="numeric" value="${v('bathrooms')}" placeholder="3">`, {opt:true})}
        ${fieldHTML('li-beds', 'Couchages', `<input id="li-beds" class="input" inputmode="numeric" value="${v('beds')}" placeholder="12">`)}
        ${fieldHTML('li-eq', 'Équipements', `<input id="li-eq" class="input" maxlength="300" value="${esc((l.equipments || []).join(', '))}" placeholder="Piscine, Clim, Barbecue">`, {full:true, hint:'Sépare-les par des virgules.'})}
        ${fieldHTML('li-note', 'Note', `<textarea id="li-note" class="input" rows="3" maxlength="600" placeholder="Ce qui t’a plu, ce qui coince…">${v('note')}</textarea>`, {full:true, opt:true})}
        <div class="frow full"><span class="lbl">Photo</span><div class="photo-zone" id="li-photo-zone"></div></div>
      </div>
    </section>
    <div class="mc-foot"><span class="err" id="li-save-err" role="alert"></span><button type="button" class="btn" data-close>Annuler</button><button type="submit" class="btn btn-accent" id="li-save">${ML.editId ? 'Enregistrer' : 'Ajouter au carnet'}</button></div>
  </form></div>`;
}
function renderShots(){
  const el = $('#li-shot-list'); if (!el) return;
  const ST = {wait:'En attente', busy:'Lecture…', text:'Texte lu', photo:'Photo', error:'Illisible'};
  el.innerHTML = ML.shots.map((s, i) => `<div class="shot"><img src="${s.url}" alt="Capture ${i + 1}"><div class="sa"><span class="shot-st shot-${s.state || 'wait'}">${ST[s.state] || ''}</span><label class="check-inline"><input type="checkbox" data-shotph="${i}"${ML.photos.some(p => p.shot === s) ? ' checked' : ''}>Photo de la fiche</label><button type="button" class="link-btn" data-rmshot="${i}">Retirer</button></div></div>`).join('');
}
function addPhotoUrls(){
  const inp = $('#li-photo-url'); if (!inp) return;
  const urls = inp.value.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
  if (!urls.length) { inp.focus(); return; }
  let ok = 0, bad = 0;
  urls.forEach(u => {
    if (!isExtPhoto(u) || ML.photos.some(p => p.type === 'existing' && p.id === u)) { bad++; return; }
    if (ML.photos.length >= MAX_PH) { bad++; return; }
    ML.photos.push({type:'existing', id:u}); ok++;
  });
  if (bad) toast(ok ? 'Certaines adresses ont été ignorées (déjà ajoutées, invalides ou limite de ' + MAX_PH + ' photos).' : 'Adresse invalide : elle doit commencer par https://');
  renderShots(); renderPhotoZone();
}
const phSrc = p =>p.type === 'existing' ? photoUrl(p.id) : p.type === 'shot' ? p.shot.url : p.url;
function renderPhotoZone(){
  const el = $('#li-photo-zone'); if (!el) return;
  const list = ML.photos.map((p, i) => `<div class="ph-item" data-pi="${i}"><img src="${esc(phSrc(p))}" alt="Photo ${i + 1}" draggable="false" referrerpolicy="no-referrer"${p.type === 'existing' ? ' data-fb' : ''}>${i === 0 ? '<span class="ph-cover">Couverture</span>' : ''}<button type="button" class="ph-rm" data-rmphoto="${i}" aria-label="Retirer la photo ${i + 1}">×</button></div>`).join('');
  const full = ML.photos.length >= MAX_PH;
  el.innerHTML = `${ML.photos.length ? `<div class="ph-list">${list}</div>` : `<div class="photo-prev"><div class="ph ph${hashN(ML.editId || 'new', 6) + 1}">${IC.house}</div></div>`}<div class="sec-gap" style="gap:8px">
    ${ML.photos.length ? `<span class="hint">${ML.photos.length} / ${MAX_PH} photos. Glisse-les pour changer l’ordre : la première sert de couverture.</span>` : '<span class="hint">Sans photo, la fiche affiche un dessin. Tu peux cocher « Photo de la fiche » sur tes captures ci-dessus, ou ajouter des photos.</span>'}
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input type="url" id="li-photo-url" class="input"placeholder="Adresse d’une photo (https://…)" aria-label="Adresse d’une photo" style="flex:1 1 220px;min-width:0"><button type="button" class="btn btn-sm${full ? ' is-off' : ''}" data-addphurl="1">Ajouter par adresse</button></div>
    ${S.assets ? `<div><input type="file" id="li-photo-file" accept="image/png,image/jpeg,image/webp" multiple class="sr-only"><label for="li-photo-file" class="btn btn-sm${full ? ' is-off' : ''}">${ML.photos.length ? 'Ajouter des photos' : 'Choisir des photos'}</label></div>` : '<span class="hint">L’ajout de photo n’est pas disponible avec ton accès.</span>'}</div>`;
}
function addShots(files){
  const imgs = Array.from(files || []).filter(f => /^image\//.test(f.type));
  for (const f of imgs) { if (ML.shots.length >= 6) { toast('6 captures au maximum.'); break; } ML.shots.push({file:f, url:URL.createObjectURL(f), state:'wait'}); }
  renderShots(); if (imgs.length) ocrQueue();
}
function autoSource(){
  const s = $('#li-source'), u = $('#li-url'); if (!s || !u || s.value.trim()) return;
  let host = ''; try { host = new URL(u.value.trim()).hostname; } catch (e) { return; }
  const hit = SOURCES.find(x => host.includes(x[0])); if (hit) s.value = hit[1];
}
function normDept(x){
  if (x == null) return null;
  let c = String(x).trim().toUpperCase();
  if (/^\d$/.test(c)) c = '0' + c;
  if (DEP[c]) return c;
  if (/^97\d$/.test(c)) return 'autre';
  return null;
}
/* ---------- Lecture des captures (OCR gratuit, dans le navigateur, sans IA) ---------- */
let tessP = null, workerP = null;
function loadTesseract(){
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tessP) tessP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = () => res(window.Tesseract); s.onerror = () => { tessP = null; rej(new Error('ocr')); };
    document.head.append(s);
  });
  return tessP;
}
function getWorker(){
  if (!workerP) { workerP = loadTesseract().then(T => T.createWorker('fra')); workerP.catch(() => { workerP = null; }); }
  return workerP;
}
function setAiSt(t, busy){ const el = $('#li-ai-st'); if (!el) return; el.textContent = t; el.classList.toggle('busy', !!busy); }
async function ocrQueue(){
  if (ML.ocrBusy) return; ML.ocrBusy = true;
  try {
    let w;
    try { setAiSt('Préparation de la lecture des captures (quelques secondes la première fois)', true); w = await getWorker(); }
    catch (e) { setAiSt('La lecture des captures n’a pas pu démarrer : vérifie ta connexion, ou remplis la fiche à la main.'); ML.shots.forEach(s => { if (s.state === 'wait') s.state = 'error'; }); renderShots(); return; }
    for (;;) {
      const i = ML.shots.findIndex(s => s.state === 'wait'); if (i < 0) break;
      const s = ML.shots[i]; s.state = 'busy'; renderShots();
      setAiSt('Lecture de la capture ' + (i + 1) + ' sur ' + ML.shots.length, true);
      try {
        const {data} = await w.recognize(s.file);
        s.text = data.text || '';
        s.lines = (data.lines || []).map(x => ({t:String(x.text || '').trim(), h:x.bbox ? x.bbox.y1 - x.bbox.y0 : 0}));
        s.state = s.text.replace(/[^A-Za-zÀ-ÿ0-9]/g, '').length < 40 ? 'photo' : 'text';
      } catch (e) { s.state = 'error'; }
      renderShots();
    }
    const n = runParse();
    setAiSt(n ? plural(n, 'champ rempli', 'champs remplis') + ' automatiquement et surligné' + (n > 1 ? 's' : '') + ' : vérifie-' + (n > 1 ? 'les' : 'le') + '.' : 'Rien de reconnaissable dans ces captures : complète la fiche à la main.');
  } finally {
    ML.ocrBusy = false;
    if ($('#f-listing') && ML.shots.some(s => s.state === 'wait')) ocrQueue();
  }
}
/* Commune saisie → département proposé (API officielle geo.api.gouv.fr), surligné comme les champs remplis automatiquement. */
let deptTimer = 0, deptSeq = 0;
function lookupDept(delay){
  clearTimeout(deptTimer);
  deptTimer = setTimeout(async () => {
    const c = $('#li-commune'), d = $('#li-dept'); if (!c || !d) return;
    const name = c.value.trim(); if (name.length < 3 || ML.touched['li-dept']) return;
    if (d.value && !d.classList.contains('auto-filled')) return;
    const seq = ++deptSeq;
    try {
      const r = await fetch('https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(name) + '&fields=nom,codeDepartement&boost=population&limit=5');
      if (!r.ok) return; const list = await r.json(); if (seq !== deptSeq || !Array.isArray(list) || !list.length) return;
      const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hit = list.find(x => norm(x.nom) === norm(name)) || list[0];
      const code = hit && hit.codeDepartement;
      const cur = $('#li-dept'); if (!cur || !code || ML.touched['li-dept'] || cur.value === code) return;
      if (!Array.from(cur.options).some(o => o.value === code)) return;
      cur.value = code; cur.classList.add('auto-filled'); cur.classList.remove('flash'); void cur.offsetWidth; if (M()) cur.classList.add('flash');
      ML.lat = null; ML.lng = null; ML.ai = true;
    } catch (e) { /* hors ligne : on laisse le choix à la main */ }
  }, delay);
}
function runParse(){
  if (!$('#f-listing')) return 0;
  const shots = ML.shots.filter(s => s.state === 'text');
  const text = [$('#li-text').value].concat(shots.map(s => s.text)).join('\n');
  const r = parseListing(text, shots.reduce((a, s) => a.concat(s.lines || []), []));
  let n = 0;
  const setF = (id, v) => {
    if (v == null || v === '') return;
    const el = $('#' + id); if (!el || ML.touched[id]) return;
    if (el.value && !el.classList.contains('auto-filled')) return;
    if (el.value === String(v)) return;
    el.value = String(v); el.classList.add('auto-filled');
    el.classList.remove('flash'); void el.offsetWidth; if (M()) el.classList.add('flash');
    n++;
  };
  setF('li-title', r.title); setF('li-price', r.price); setF('li-dates', r.priceDates);
  setF('li-commune', r.commune); setF('li-dept', r.dept);
  if (r.commune && !r.dept) lookupDept(0);
  setF('li-bedrooms', r.bedrooms); setF('li-bathrooms', r.bathrooms); setF('li-beds', r.beds);
  setF('li-eq', r.equipments && r.equipments.join(', '));
  autoSource();
  { let add = 0; ML.shots.forEach(sh => { if (sh.state === 'photo' && !sh.phSeen) { sh.phSeen = true; if (ML.photos.length < MAX_PH) { ML.photos.push({type:'shot', shot:sh}); add++; } } }); if (add) { renderShots(); renderPhotoZone(); } }
  if (n) ML.ai = true;
  return n;
}
const EQ = [
  ['Piscine', /piscine/], ['Jacuzzi', /jacuzzi|\bspa\b|bain à remous/], ['Climatisation', /climatis|\bclim\b/],
  ['Barbecue', /barbecue|plancha/], ['Jardin', /jardin/], ['Terrasse', /terrasse/], ['Wifi', /wi-?fi/],
  ['Parking', /parking|stationnement/], ['Lave-vaisselle', /lave-vaisselle/], ['Lave-linge', /lave-linge|machine à laver/],
  ['Cheminée', /chemin[ée]e/], ['Vue mer', /vue (sur (la )?)?mer/], ['Plage à proximité', /plage/],
  ['Animaux acceptés', /animaux (de compagnie )?(sont )?(acceptés|admis|autorisés)/], ['Ping-pong', /ping-?pong|tennis de table/],
  ['Babyfoot', /baby-?foot/], ['Salle de jeux', /salle de jeux/], ['Lit bébé', /lit (pour )?bébé/], ['Vélos', /vélos?\b/]
];
const MOIS = 'janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec';
const deaccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
function deptFromCp(cp){
  if (cp.startsWith('20')) return parseInt(cp, 10) < 20200 ? '2A' : '2B';
  const c = cp.slice(0, 2); return DEP[c] ? c : null;
}
function parseListing(text, lines){
  const r = {}; const t = String(text || '').replace(/[  ]/g, ' '); const low = t.toLowerCase();
  // Prix : le montant marqué « total », sinon le plus élevé qui n'est pas un prix par nuit
  const amounts = []; const re = /(\d{1,3}(?:[ .]\d{3})+|\d{2,6})(?:,\d{1,2})?\s?€|€\s?(\d{1,3}(?:[ .]\d{3})+|\d{2,6})/g; let m;
  while ((m = re.exec(t))) {
    const n = parseInt((m[1] || m[2]).replace(/[ .]/g, ''), 10);
    if (n >= 80 && n < 60000) {
      const ctx = low.slice(Math.max(0, m.index - 50), m.index + m[0].length + 30);
      amounts.push({n, total:/total/.test(ctx), night:/(par|\/|x)\s*nuit|nuitée|night/.test(ctx) && !/total/.test(ctx)});
    }
  }
  const tot = amounts.filter(a => a.total); const pool = tot.length ? tot : amounts.filter(a => !a.night);
  if (pool.length) r.price = Math.max.apply(null, pool.map(a => a.n));
  // Capacité et chambres
  const cap = t.match(/(\d{1,2})\s*(?:voyageurs?|personnes?|couchages?|adultes?|pers\b)/i); if (cap && +cap[1] > 0) r.beds = +cap[1];
  const ch = t.match(/(\d{1,2})\s*chambres?/i); if (ch && +ch[1] > 0) r.bedrooms = +ch[1];
  const sb = t.match(/(\d{1,2})\s*(?:salles?\s*(?:de\s*bains?|d['’]eau)|sdb)/i); if (sb && +sb[1] > 0) r.bathrooms = +sb[1];
  // Dates vues avec le prix
  const dr = t.match(new RegExp('(\\d{1,2})(?:er)?\\s*(?:(?:' + MOIS + ')[a-zéû]*\\.?)?\\s*(?:-|–|au|→)\\s*(\\d{1,2})\\s*(?:' + MOIS + ')[a-zéû]*\\.?(?:\\s*\\d{4})?', 'i'));
  const nights = t.match(/(\d{1,2})\s*nuits?/i);
  if (dr) r.priceDates = (dr[0].replace(/\s+/g, ' ').trim() + (nights ? ' (' + nights[1] + ' nuits)' : '')).slice(0, 60);
  else if (nights) r.priceDates = nights[1] + ' nuits';
  // Lieu : code postal, sinon « Commune, France », sinon nom de département
  const cpm = t.match(/\b((?:0[1-9]|[1-8]\d|9[0-5])\d{3})\b(?!\s?€)(?:\s+([A-ZÉÈÎÂ][A-Za-zÀ-ÿ'’-]+(?:[ -][A-Za-zÀ-ÿ'’-]+){0,3}))?/);
  if (cpm) { r.dept = deptFromCp(cpm[1]); if (cpm[2]) r.commune = cpm[2].trim(); }
  if (!r.commune) {
    const cm = t.match(/([A-ZÉÈÎÂ][A-Za-zÀ-ÿ'’-]+(?:[ -][A-Za-zÀ-ÿ'’-]+){0,3}),\s*(?:[A-ZÉÈÎÂ][A-Za-zÀ-ÿ'’ -]+,\s*)?France/);
    if (cm && !/^(logement|maison|villa|appartement|gîte|gite|chambre|location)\b/i.test(cm[1])) r.commune = cm[1].trim();
  }
  if (!r.dept) {
    const nt = ' ' + deaccent(t).replace(/[^A-Za-z0-9]+/g, ' ') + ' '; let best = null;
    DEP_LIST.forEach(d => { const k = ' ' + deaccent(d.n).replace(/[^A-Za-z0-9]+/g, ' ') + ' '; if (nt.includes(k) && (!best || k.length > best.k.length)) best = {c:d.c, k}; });
    if (best) r.dept = best.c;
  }
  // Équipements reconnus
  const eq = EQ.filter(e => e[1].test(low)).map(e => e[0]); if (eq.length) r.equipments = eq.slice(0, 10);
  // Titre : la ligne écrite le plus gros, hors boutons et chiffres
  const bad = /(partager|enregistrer|afficher|photos?\b|réserver|reserver|connexion|inscription|airbnb|abritel|booking|vrbo|€|voyageurs?|chambres?|\blits?\b|salles? de bain|avis|superhost|hôte|hote|rechercher|menu|traduction)/i;
  const okLine = s => s.length >= 8 && s.length <= 80 && !bad.test(s) && (s.replace(/[^A-Za-zÀ-ÿ]/g, '').length / s.length) > 0.6;
  const cand = (lines || []).filter(x => okLine(x.t));
  if (cand.length) r.title = cand.reduce((a, b) => (b.h > a.h ? b : a)).t.replace(/\s+/g, ' ');
  else { const first = t.split('\n').map(s => s.trim()).find(okLine); if (first) r.title = first; }
  return r;
}
async function shrink(file){
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.85));
    return blob || file;
  } catch (e) { return file; }
}
async function saveListing(){
  const title = $('#li-title').value.trim();
  const err = $('#li-title-err');
  if (!title) { err.hidden = false; $('#li-title').focus(); return; }
  err.hidden = true;
  const btn = $('#li-save'); btn.disabled = true; btn.textContent = 'Enregistrement…'; $('#li-save-err').textContent = '';
  const prev = ML.editId ? S.listings[ML.editId] : null;
  const photos = []; let failed = 0;
  for (const p of ML.photos) {
    if (p.type === 'existing') { photos.push(p.id); continue; }
    const src = p.type === 'shot' ? p.shot.file : p.file;
    if (!S.assets) { failed++; continue; }
    try { const blob = await shrink(src); const r = await S.assets.upload(blob, {type: blob.type && /^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : 'image/jpeg'}); photos.push(r.id); }
    catch (e) { failed++; if (e && e.code === 'too_large') toast('Une photo est trop lourde : elle n’a pas été ajoutée.'); }
  }
  if (failed) toast(S.assets ? (failed > 1 ? failed + ' photos n’ont pas pu être ajoutées.' : 'Une photo n’a pas pu être ajoutée.') : 'Les photos n’ont pas été ajoutées : ton accès ne le permet pas.');
  const photo = photos[0] || null;
  const data = {
    title, url:safeUrl($('#li-url').value), source:$('#li-source').value.trim(),
    price:num($('#li-price').value), priceDates:$('#li-dates').value.trim(),
    commune:$('#li-commune').value.trim(), dept:$('#li-dept').value, lat:ML.lat, lng:ML.lng,
    bedrooms:int($('#li-bedrooms').value), bathrooms:int($('#li-bathrooms').value), beds:int($('#li-beds').value),
    equipments:$('#li-eq').value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean).slice(0, 12).map(x => x.slice(0, 30)),
    note:$('#li-note').value.trim(), status:$('#li-status').value || statuses()[0].id, photo, photos,
    importedWith: ML.ai ? 'lecture-captures' : ((prev && prev.importedWith) || 'manuel'),
    addedBy: (prev && prev.addedBy) || S.myId, createdAt: (prev && prev.createdAt) || Date.now(),
    updatedAt: Date.now(), updatedBy: S.myId
  };
  const id = ML.editId || S.db.collection('listings').doc().id;
  try {
    await writeDoc('listings/' + id, data);
    if (prev && S.assets) storedOnly(photosOf(prev)).filter(id => !photos.includes(id)).forEach(id => S.assets.delete(id).catch(() => {}));
    closeModal();
    toast(prev ? 'Fiche mise à jour' : 'Logement ajouté au carnet');
    if (!prev) { S.highlight = id; if (S.view !== 'galerie') setView('galerie'); setTimeout(() => { S.highlight = null; schedule(); }, 2600); }
  } catch (e) {
    btn.disabled = false; btn.textContent = ML.editId ? 'Enregistrer' : 'Ajouter au carnet';
    $('#li-save-err').textContent = 'L’enregistrement a échoué. Réessaie.';
  }
}

/* ---------- Réglages et profil ---------- */
function openSettings(welcome){
  if (!canEdit()) return;
  const me = S.members[S.myId] || {}; const c = cfg(); const owner = S.isOwner && !welcome;
  const html = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="st-title">
    <div class="mc-head"><h2 class="mc-t" id="st-title">${welcome ? 'Bienvenue dans le carnet' : 'Réglages'}</h2>${welcome ? '' : `<button type="button" class="icon-btn" data-close aria-label="Fermer">${IC.x}</button>`}</div>
    <form id="f-settings" class="mc-body" data-welcome="${welcome ? 1 : ''}">
      ${welcome ? '<p class="lead">On choisit ensemble où partir cet été. Dis-nous comment t’appeler : les autres verront qui a proposé et noté quoi.</p>' : ''}
      <fieldset class="fs"><legend>Mon profil</legend>
        ${fieldHTML('st-name', 'Prénom', `<input id="st-name" class="input" required maxlength="30" autocomplete="given-name" value="${esc(me.name || firstName(S.meName))}"><span class="err" id="st-name-err" hidden>Indique ton prénom.</span>`)}
        ${welcome ? '' : `<label class="check"><input type="checkbox" id="st-motion"${motion ? ' checked' : ''}><span>Animations activées<small>Coupe-les si le mouvement te gêne. Ce réglage ne vaut que pour toi.</small></span></label>`}
      </fieldset>
      ${owner ? `<fieldset class="fs" id="st-pend-fs" hidden><legend>Demandes d’accès</legend><p class="hint">Ces personnes se sont connectées avec Google. Valide uniquement celles que tu connais.</p><div class="sec-gap" style="gap:10px" id="st-pend"></div></fieldset>
      <fieldset class="fs"><legend>Le carnet</legend>${fieldHTML('st-title-in', 'Titre', `<input id="st-title-in" class="input" maxlength="50" value="${esc(c.title)}">`)}</fieldset>
      <fieldset class="fs"><legend>Les critères</legend><p class="hint">Retirer un critère ne supprime pas les notes déjà données, mais elles ne comptent plus.</p><div class="sec-gap" style="gap:10px" id="st-crits">${c.criteria.map(critRow).join('')}</div><div><button type="button" class="btn btn-sm" data-act="add-crit">+ Ajouter un critère</button></div></fieldset>` : ''}
      <div class="mc-foot">${welcome ? '' : '<button type="button" class="btn btn-ghost" data-act="logout" style="margin-right:auto">Se déconnecter</button><button type="button" class="btn" data-close>Annuler</button>'}<button type="submit" class="btn btn-accent">${welcome ? 'C’est parti' : 'Enregistrer'}</button></div>
    </form></div>`;
  openModal(html, {locked:welcome});
  if (owner) loadPending();
}
async function loadPending(){
  const {data, error} = await SB.from('pending').select('user_id,email,name').order('created_at');
  const fs = $('#st-pend-fs'), box = $('#st-pend'); if (!fs || !box) return;
  if (error || !data || !data.length) { fs.hidden = true; return; }
  fs.hidden = false;
  box.innerHTML = data.map(p => `<div class="pend"><span><strong>${esc(p.name || '')}</strong> <small class="muted">${esc(p.email || '')}</small></span><span><button type="button" class="btn btn-sm btn-accent" data-act="approve" data-uid="${esc(p.user_id)}">Valider</button> <button type="button" class="btn btn-sm btn-ghost" data-act="reject" data-uid="${esc(p.user_id)}">Refuser</button></span></div>`).join('');
}
async function decide(uid, ok, btn){
  if (btn) btn.disabled = true;
  const {error} = await SB.rpc('approve_user', {uid, ok});
  if (error) { if (btn) btn.disabled = false; toast('Action impossible, réessaie'); return; }
  toast(ok ? 'Personne validée' : 'Demande refusée'); loadPending();
}
let critSeq = 0;
function critRow(c){
  const k = 'cr' + (critSeq++);
  return `<div class="crit-row" data-cid="${esc(c.id)}"><input class="input" id="${k}" maxlength="40" value="${esc(c.label)}" aria-label="Nom du critère"><button type="button" class="link-btn" data-rmcrit>Retirer</button></div>`;
}
async function saveSettings(form){
  const name = $('#st-name').value.trim();
  if (!name) { $('#st-name-err').hidden = false; $('#st-name').focus(); return; }
  const me = S.members[S.myId] || {};
  const welcome = !!form.dataset.welcome;
  const mine = Object.assign({}, me, {name, joinedAt: me.joinedAt || Date.now()}); delete mine.payer;
  S.members = Object.assign({}, S.members, {[S.myId]:mine});
  writeDoc('members/' + S.myId, mine);
  const mm = $('#st-motion'); if (mm) { motion = mm.checked; store.set('gite-motion', motion ? 'on' : 'off'); applyMotion(); }
  if (S.isOwner && !welcome) {
    const c = cfg();
    const criteria = $$('#st-crits .crit-row').map(r => { const lbl = $('input.input', r).value.trim(); if (!lbl) return null; const was = (c.criteria || []).find(x => x.id === r.dataset.cid); return was ? Object.assign({}, was, {label:lbl}) : {id:r.dataset.cid, label:lbl, addedAt:Date.now()}; }).filter(Boolean);
    const next = Object.assign({}, DEFAULT_CONFIG, S.config || {}, {title:($('#st-title-in').value.trim() || DEFAULT_CONFIG.title), criteria: criteria.length ? criteria : c.criteria});
    writeDoc('config/main', next);
  }
  closeModal(true);
  toast(welcome ? 'Bienvenue, ' + name + ' !' : 'Réglages enregistrés');
  schedule();
}

/* ---------- Fenêtre générique ---------- */
function openModal(html, opts){
  const m = $('#modal');
  S.modalTrigger = document.activeElement;
  m.innerHTML = html; m.dataset.locked = opts && opts.locked ? '1' : '';
  m.hidden = false; void m.offsetWidth; m.classList.add('open');
  $('#app').inert = true; $('#drawer-wrap').inert = true;
  setTimeout(() => { const f = m.querySelector('input:not(.sr-only),textarea,select,button:not([data-close])'); if (f) f.focus(); }, 40);
}
function closeModal(force){
  const m = $('#modal'); if (m.hidden) return;
  if (m.dataset.locked && !force) return;
  if (ML.ctl) ML.ctl.abort();
  ML.shots.forEach(s => URL.revokeObjectURL(s.url)); ML.photos.forEach(p => { if (p.type === 'file') URL.revokeObjectURL(p.url); });
  ML.shots = []; ML.photos = [];
  m.classList.remove('open');
  const fin = () => { if (!m.classList.contains('open')) { m.hidden = true; m.innerHTML = ''; } };
  if (M()) setTimeout(fin, 260); else fin();
  $('#drawer-wrap').inert = false; $('#app').inert = !!S.openId;
  const t = S.modalTrigger; if (t && document.contains(t)) t.focus();
}

/* ---------- Révélation ---------- */
function maybeReveal(){
  const c = cfg();
  if (!c.closed || !c.closedAt || S.revealPlayed || !S.loaded.listings || !S.loaded.votes || !S.loaded.members) return;
  const k = 'gite-reveal-' + c.closedAt;
  if (store.get(k)) { S.revealPlayed = true; return; }
  if (!ranking().some(r => r.s.overall != null)) return;
  S.revealPlayed = true; store.set(k, '1');
  playReveal();
}
let revealing = false, revealSkip = null;
async function playReveal(){
  if (revealing) return;
  const top = ranking().filter(r => r.s.overall != null).slice(0, 3);
  if (!top.length) return;
  revealing = true;
  if (S.openId) closeDrawer();
  const ov = $('#reveal'), slots = $('#rv-slots');
  $('#rv-sub').textContent = 'Les votes sont clos · ' + plural(memberIds().length, 'votant') + ' · ' + plural(listingsArr().length, 'logement') + ' comparés';
  $('#rv-title').textContent = 'Et notre gîte d’été est…';
  slots.innerHTML = top.map((r, i) => `<div class="rv-slot r${i + 1}" data-rank="${i + 1}">${stepHTML(r, i + 1, true)}</div>`).join('');
  $('#rv-done').hidden = true; $('#rv-skip').hidden = false;
  ov.hidden = false; void ov.offsetWidth; ov.classList.add('open');
  $('#app').inert = true;
  $('#rv-skip').focus();
  /* État final, posé de la même façon quand la séquence va au bout, quand on la passe ou quand les animations sont coupées */
  const finalState = () => {
    $$('.rv-slot', slots).forEach(s => { s.classList.add('in'); const n = s.querySelector('[data-score]'); if (n) n.textContent = fmtScore(num(n.dataset.score)); });
    const w = slots.querySelector('[data-rank="1"]'); if (w) w.classList.add('win');
    $('#rv-title').textContent = top[0].l.title;
    $('#rv-skip').hidden = true; $('#rv-done').hidden = false; $('#rv-done').focus();
    revealing = false; revealSkip = null;
  };
  if (M() && GM.reveal) {
    const ctl = GM.reveal({
      ov, inner:$('#rv-inner'), spot:$('#rv-spot'), sub:$('#rv-sub'), title:$('#rv-title'),
      slots:{1:slots.querySelector('[data-rank="1"]'), 2:slots.querySelector('[data-rank="2"]'), 3:slots.querySelector('[data-rank="3"]')},
      winnerText:top[0].l.title,
      countUp:(el, v, ms) => countUp(el, v, ms),
      confetti, markWinner:w => w.classList.add('win'),
      done:finalState
    });
    revealSkip = () => ctl.skip();
  } else { finalState(); if (M()) confetti(); }
}
function closeReveal(){
  if (revealSkip) revealSkip();
  const ov = $('#reveal'); ov.classList.remove('open');
  const fin = () => { ov.hidden = true; ov.classList.remove('gm-rv'); const cv = $('#confetti'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); };
  if (M()) setTimeout(fin, 380); else fin();
  $('#app').inert = !!S.openId;
  if (S.view !== 'podium') setView('podium');
}
/* Deux canons depuis les coins du bas, puis une pluie de papier. Mouvement indépendant de la fréquence de l'écran (pas de temps normalisé). */
function confetti(){
  const cv = $('#confetti'); const ctx = cv.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--accent', '--olive-bg', '--av3', '--av1', '--av4', '--av2'].map(v => cs.getPropertyValue(v).trim() || '#B8502D');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mk = o => Object.assign({w:rnd(6, 13), h:rnd(9, 19), r:rnd(0, 6.28), vr:rnd(-0.1, 0.1), sw:rnd(0, 6.28), c:cols[(Math.random() * cols.length) | 0], shape:['rect', 'rect', 'circle', 'tri'][(Math.random() * 4) | 0], gy:0, drag:1, cap:99}, o);
  const P = [];
  for (let i = 0; i < 70; i++) P.push(mk({x:rnd(0, W), y:-20 - rnd(0, H * 0.6), vy:rnd(2.2, 4.8), vx:rnd(-0.7, 0.7)}));
  const cannon = (x, y, dir, n) => { for (let i = 0; i < n; i++) { const a = (-90 + dir * rnd(18, 48)) * Math.PI / 180, sp = rnd(15, 29); P.push(mk({x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, gy:0.38, drag:0.985, cap:5.5})); } };
  cannon(W * 0.04, H * 0.92, 1, 60); cannon(W * 0.96, H * 0.92, -1, 60);
  const t0 = performance.now(); let last = t0;
  const frame = t => {
    const el = t - t0, k = Math.min(2.5, (t - last) / 16.67); last = t; ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = el > 4300 ? Math.max(0, 1 - (el - 4300) / 900) : 1;
    for (const p of P) {
      p.sw += 0.035 * k; p.vx *= Math.pow(p.drag, k); p.vy = Math.min(p.vy + p.gy * k, p.cap);
      p.x += (p.vx + Math.sin(p.sw) * 0.7) * k; p.y += p.vy * k; p.r += p.vr * k;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.sw * 1.6)); ctx.fillStyle = p.c;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.283); ctx.fill(); }
      else if (p.shape === 'tri') { ctx.beginPath(); ctx.moveTo(0, -p.h / 2); ctx.lineTo(p.w / 2, p.h / 2); ctx.lineTo(-p.w / 2, p.h / 2); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (el < 5200 && !$('#reveal').hidden) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}

/* ---------- Récapitulatif ---------- */
function mdCell(s){ return String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' '); }
function buildMD(){
  const c = cfg(), t = S.trip || {}, cs = crits(); const ranked = ranking(); const ids = memberIds();
  const L = [];
  L.push('# ' + (c.title || DEFAULT_CONFIG.title) + ' : récapitulatif', '');
  L.push('Exporté le ' + fmtLong(Date.now()) + (c.closed ? ' · votes clos le ' + fmtLong(c.closedAt) : ' · votes en cours'), '');
  L.push('- Destination : ' + (t.destination || 'France'), '- Période : ' + (t.periode || 'à définir'), '- Groupe : ' + plural(ids.length, 'inscrit'), '');
  L.push('## Classement', '');
  ranked.forEach((r, i) => {
    const l = r.l, s = r.s;
    L.push((i + 1) + '. **' + mdCell(l.title) + '** · ' + (s.overall == null ? 'pas noté' : fmtScore(s.overall) + ' / 10') + ' · ' + plural(s.hearts.length, 'coup de cœur', 'coups de cœur') + (s.vetos.length ? ' · veto de ' + s.vetos.map(nameOf).join(', ') : '') + ' · ' + fmtPrice(num(l.price)) + ' · ' + placeOf(l) + ' · ' + statusOf(l).s.label + (safeUrl(l.url) ? ' · ' + safeUrl(l.url) : ''));
  });
  L.push('', '## Notes moyennes par critère', '');
  L.push('| Logement | ' + cs.map(x => mdCell(x.label)).join(' | ') + ' | Moyenne |');
  L.push('|' + ' --- |'.repeat(cs.length + 2));
  ranked.forEach(r => L.push('| ' + mdCell(r.l.title) + ' | ' + cs.map(x => fmtScore(r.s.per[x.id])).join(' | ') + ' | ' + fmtScore(r.s.overall) + ' |'));
  L.push('', '## Qui a voté quoi', '');
  L.push('| Personne | Coup de cœur | Veto |', '| --- | --- | --- |');
  ids.forEach(u => { const v = votesOf(u); L.push('| ' + mdCell(nameOf(u)) + ' | ' + mdCell(v.heart && S.listings[v.heart] ? S.listings[v.heart].title : '–') + ' | ' + mdCell(v.veto && S.listings[v.veto] ? S.listings[v.veto].title : '–') + ' |'); });
  L.push('', '## Détail des notes', '');
  ranked.forEach(r => {
    L.push('### ' + mdCell(r.l.title), '');
    L.push('| Personne | ' + cs.map(x => mdCell(x.label)).join(' | ') + ' |', '|' + ' --- |'.repeat(cs.length + 1));
    ids.forEach(u => { const x = (votesOf(u).scores || {})[r.l.id]; if (anyScore(x)) L.push('| ' + mdCell(nameOf(u)) + ' | ' + cs.map(cc => typeof x[cc.id] === 'number' ? x[cc.id] : '–').join(' | ') + ' |'); });
    L.push('');
  });
  return L.join('\n');
}
function buildCSV(){
  const cs = crits(); const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const rows = [['Logement', 'Personne'].concat(cs.map(c => c.label), ['Coup de cœur', 'Veto']).map(q).join(';')];
  listingsArr().forEach(l => memberIds().forEach(u => {
    const x = (votesOf(u).scores || {})[l.id] || {}; const v = votesOf(u);
    if (!anyScore(x) && v.heart !== l.id && v.veto !== l.id) return;
    rows.push([l.title, nameOf(u)].concat(cs.map(c => typeof x[c.id] === 'number' ? x[c.id] : ''), [v.heart === l.id ? 'oui' : '', v.veto === l.id ? 'oui' : '']).map(q).join(';'));
  }));
  return '﻿' + rows.join('\r\n');
}
async function download(kind){
  if (!S.downloads) { toast('Le téléchargement n’est pas disponible ici.'); return; }
  try {
    await S.downloads.save(kind === 'csv' ? {filename:'notre-gite-ete-notes.csv', data:buildCSV()} : {filename:'notre-gite-ete-recap.md', data:buildMD()});
    toast('Fichier enregistré');
  } catch (e) { if (!e || e.code !== 'declined') toast('Le fichier n’a pas pu être enregistré.'); }
}

/* ---------- Messages ---------- */
function toast(msg){
  if (!msg) return;
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t);
  anim(t, [{opacity:0, transform:'translateY(16px) scale(.92)'}, {opacity:1, transform:'none'}], {duration:420, easing:EASE_BACK});
  setTimeout(() => { const a = anim(t, [{opacity:1}, {opacity:0, transform:'translateY(6px)'}], {duration:200, easing:EASE_OUT, fill:'forwards'}); if (a) a.finished.then(() => t.remove(), () => t.remove()); else t.remove(); }, 2800);
}

/* ---------- Évènements ---------- */
function bindStatic(){
  window.addEventListener('resize', () => { placeInd(false); closePop(); });
  window.addEventListener('scroll', () => { closePop(); closeGear(); }, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeInd(false));
  if (GM.bindTilt) GM.bindTilt($('#panel'));
  $('#gear-btn').addEventListener('click', openGear);
  const gp = $('#gear-pop');
  gp.addEventListener('click', e => {
    if (e.target.closest('[data-gear-close]')) { closeGear(true); return; }
    const sw = e.target.closest('[data-pref]'); if (!sw) return;
    setPref(sw.dataset.pref); renderGear(); const n = $(`[data-pref="${sw.dataset.pref}"]`, gp); if (n) n.focus({preventScroll:true});
  });
  gp.addEventListener('change', e => { if (e.target.id === 'gp-theme') setPref('theme', e.target.value); });
  $('#rv-skip').addEventListener('click', () => { if (revealSkip) revealSkip(); });
  $('#rv-done').addEventListener('click', closeReveal);

  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'li-photo-url') { e.preventDefault(); addPhotoUrls(); } });
  document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.hasAttribute('data-fb')) { const s = document.createElement('span'); s.innerHTML = IC.house; t.replaceWith(s.firstChild); } }, true);

  document.addEventListener('click', e => {
    if (!e.target.closest('#pop') && !e.target.closest('[data-pop]')) closePop();
    if (!e.target.closest('#gear-pop') && !e.target.closest('#gear-btn')) closeGear();
    const t = e.target.closest('[data-view],[data-flip],[data-open],[data-pinlid],[data-act],[data-trip],[data-dep],[data-pick-dep],[data-heart],[data-veto],[data-score],[data-sort],[data-sortdir],[data-dispo],[data-delc],[data-close],[data-close-drawer],[data-rmcrit],[data-rmshot],[data-rmphoto],[data-pnav],[data-pop],[data-week],[data-fixweek],[data-dupopen]');
    if (t && t.id === 'dw-close') { closeDrawer(); return; }
    if (!t) { if (e.target.id === 'modal') closeModal(); if (e.target.closest('#dw-close')) closeDrawer(); return; }
    const d = t.dataset;
    if (d.flip) return flipCard(d.flip, t.closest('.card'));
    if (d.pop) return openPop(t);
    if (d.week) return cycleWeek(d.week);
    if (d.fixweek) return fixWeek(d.fixweek);
    if (d.dupopen) { closeModal(true); return openListing(d.dupopen); }
    if (d.view) return setView(d.view);
    if (d.closeDrawer !== undefined) return closeDrawer();
    if (d.close !== undefined) return closeModal(true);
    if (d.score) return setScore(d.c, +d.score);
    if (d.heart) return toggleMark(d.heart, 'heart');
    if (d.veto) return toggleMark(d.veto, 'veto');
    if (d.pinlid) { const pl = S.listings[d.pinlid]; if (S.ptype === 'touch' && pl && t.id !== 'map-tip' && t.closest('#big-map') && S.mapSel === pl.dept && tipPin !== t) { showPinTip(t); return; } hidePinTip(); return pinGo(d.pinlid); }
    if (d.open) { if (t.closest('.modal')) return; S.clickSrc = t; return openListing(d.open); }
    if (d.trip) return editTrip(d.trip);
    if (d.pickDep) return selectDep(d.pickDep);
    if (d.dep) { if (t.closest('.fr-big')) return selectDep(d.dep); S.mapSel = d.dep; lastView = null; S.view = 'galerie'; setView('carte'); return; }
    if (d.dispo !== undefined) return setDispo(d.dispo);
    if (d.sortdir !== undefined) { S.cmp.dir *= -1; fillCompare(); return; }
    if (d.sort) { const k = d.sort; if (S.cmp.key === k) S.cmp.dir *= -1; else { S.cmp.key = k; S.cmp.dir = (k === 'title' || k === 'price' || k === 'ppn') ? 1 : -1; } fillCompare(); const nb = $(`[data-sort="${CSS.escape(k)}"]`); if (nb) nb.focus(); return; }
    if (d.delc) { S.db.doc('comments/' + d.delc).delete().then(() => toast('Commentaire supprimé'), onWriteError); return; }
    if (d.rmcrit !== undefined) { t.closest('.crit-row').remove(); return; }
    if (d.addphurl) { addPhotoUrls(); return; }
    if (d.rmphoto !== undefined) { const p = ML.photos[+d.rmphoto]; if (p && p.type === 'file') URL.revokeObjectURL(p.url); ML.photos.splice(+d.rmphoto, 1); renderShots(); renderPhotoZone(); return; }
    if (d.pnav !== undefined) { const tr = $('#dw-track'); if (tr) tr.scrollBy({left:+d.pnav * tr.clientWidth, behavior:M() ? 'smooth' : 'auto'}); return; }
    if (d.rmshot) { const i = +d.rmshot; const s = ML.shots[i]; if (s) URL.revokeObjectURL(s.url); ML.shots.splice(i, 1); if (s) ML.photos = ML.photos.filter(p => p.shot !== s); renderShots(); renderPhotoZone(); return; }
    switch (d.act) {
      case 'add': return openListingModal();
      case 'edit': return openListingModal(d.id);
      case 'profile': return openSettings(!S.members[S.myId]);
      case 'my-settings': closeGear(); return openSettings(false);
      case 'reset-filters': S.f.dept = ''; S.f.status = ''; return renderView();
      case 'map-reset': return selectDep(null);
      case 'del': S.dwConfirm = true; $('#dw-head').innerHTML = dwHead(S.listings[S.openId]); { const b = $('[data-act="del-cancel"]'); if (b) b.focus(); } return;
      case 'del-cancel': S.dwConfirm = false; $('#dw-head').innerHTML = dwHead(S.listings[S.openId]); return;
      case 'del-confirm': { const id = S.openId; const l = S.listings[id]; S.db.doc('listings/' + id).delete().then(() => { toast('Logement supprimé'); if (l && S.assets) storedOnly(photosOf(l)).forEach(pid => S.assets.delete(pid).catch(() => {})); Object.values(S.comments).filter(c => c.lid === id).forEach(c => S.db.doc('comments/' + c.id).delete().catch(() => {})); }, onWriteError); closeDrawer(); return; }
      case 'close-votes': S.confirmClose = true; return fillPodium();
      case 'close-cancel': S.confirmClose = false; return fillPodium();
      case 'close-confirm': S.confirmClose = false; writeDoc('config/main', Object.assign({}, cfg(), {closed:true, closedAt:Date.now()})); return;
      case 'reopen': S.revealPlayed = false; writeDoc('config/main', Object.assign({}, cfg(), {closed:false, closedAt:null})).then(() => toast('Les votes sont rouverts')); return;
      case 'replay': return playReveal();
      case 'google': return googleLogin();
      case 'recheck': return recheck();
      case 'approve': case 'reject': return decide(d.uid, d.act === 'approve', t);
      case 'logout': SB.auth.signOut().finally(() => location.reload()); return;
      case 'nudge': nudge(); return;
      case 'news-toggle': { S.newsOpen = !S.newsOpen; const n = $('#news'); n.classList.toggle('open', S.newsOpen); t.setAttribute('aria-expanded', String(S.newsOpen)); if (S.newsOpen) $$('li', n).forEach((li, i) => anim(li, [{opacity:0, transform:'translateY(-6px)'}, {opacity:1, transform:'none'}], {duration:260, delay:i * 30, easing:EASE_OUT, fill:'backwards'})); return; }
      case 'news-hide': { S.newsHidden = true; const n = $('#news'); const a = anim(n, [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(-8px)'}], {duration:220, easing:EASE_OUT, fill:'forwards'}); if (a) a.finished.then(renderNews, renderNews); else renderNews(); return; }
      case 'unfix-week': if (S.isOwner) { S.trip = Object.assign({}, S.trip, {week:null, periode:'Été ' + YEAR + ', dates à définir', updatedAt:Date.now()}); writeDoc('trip/main', S.trip); schedule(); } return;
      case 'dl-md': return download('md');
      case 'dl-csv': return download('csv');
      case 'add-crit': { const box = $('#st-crits'); box.insertAdjacentHTML('beforeend', critRow({id:'c' + Date.now().toString(36), label:''})); $('.crit-row:last-child input', box).focus(); return; }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.target.getAttribute && e.target.getAttribute('role') === 'tab' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const i = VIEWS.indexOf(S.view) + (e.key === 'ArrowRight' ? 1 : -1);
      const v = VIEWS[(i + VIEWS.length) % VIEWS.length]; setView(v); $('#tab-' + v).focus(); e.preventDefault(); return;
    }
    if (e.key === 'Escape') {
      if (!$('#gear-pop').hidden) { closeGear(true); return; }
      if (!$('#pop').hidden) { closePop(); if (S.popBtn && document.contains(S.popBtn)) S.popBtn.focus(); return; }
      if (!$('#reveal').hidden) { if (revealing && revealSkip) revealSkip(); else closeReveal(); return; }
      if (!$('#modal').hidden) { closeModal(); return; }
      if (S.openId) { closeDrawer(); return; }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pin')) { e.preventDefault(); pinGo(e.target.dataset.open || e.target.dataset.pinlid); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.id === 'dw-ctext') { e.preventDefault(); $('#dw-cform').requestSubmit(); }
  });
  /* Glisser-déposer des photos du formulaire (souris et doigt) */
  let PD = null;
  document.addEventListener('pointerdown', e => {
    const it = e.target.closest && e.target.closest('.ph-item'); if (!it || e.target.closest('button') || (e.button && e.button !== 0)) return;
    PD = {it, id:e.pointerId, x:e.clientX, y:e.clientY, on:false, from:+it.dataset.pi};
  });
  document.addEventListener('pointermove', e => {
    if (!PD || e.pointerId !== PD.id) return;
    const {it} = PD, list = it.parentElement; const dx = e.clientX - PD.x, dy = e.clientY - PD.y;
    if (!PD.on) {
      if (Math.hypot(dx, dy) < 6) return;
      PD.on = true; it.classList.add('drag'); try { it.setPointerCapture(e.pointerId); } catch (x) {}
      const r = it.getBoundingClientRect(); PD.gx = PD.x - r.left; PD.gy = PD.y - r.top;
    }
    e.preventDefault();
    const place = ev => { it.style.transform = ''; const r = it.getBoundingClientRect(); it.style.transform = `translate(${ev.clientX - PD.gx - r.left}px, ${ev.clientY - PD.gy - r.top}px) scale(1.06)`; };
    place(e);
    const others = $$('.ph-item', list).filter(x => x !== it);
    /* On n'échange que lorsque le pointeur a dépassé le centre de la voisine (et pas avant 180 ms après le dernier échange) : plus d'allers-retours rapides */
    const mine = PD.slot ? PD.slot : (PD.slot = it.getBoundingClientRect());
    const hit = performance.now() - (PD.t || 0) < 180 ? null : others.find(x => {
      const r = x.getBoundingClientRect(); if (!(e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom)) return false;
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, all = $$('.ph-item', list), fwd = all.indexOf(x) > all.indexOf(it);
      const sameRow = Math.abs(cy - (mine.top + mine.bottom) / 2) < r.height / 2;
      return sameRow ? (fwd ? e.clientX > cx : e.clientX < cx) : (fwd ? e.clientY > cy : e.clientY < cy);
    });
    if (hit) {
      PD.t = performance.now(); PD.slot = null;
      const before = new Map(others.map(x => [x, x.getBoundingClientRect()]));
      const all = $$('.ph-item', list); const hi = all.indexOf(hit), ci = all.indexOf(it);
      list.insertBefore(it, hi > ci ? hit.nextSibling : hit);
      others.forEach(x => { const a = before.get(x), b = x.getBoundingClientRect(); if (M() && (a.left !== b.left || a.top !== b.top)) anim(x, [{transform:`translate(${a.left - b.left}px, ${a.top - b.top}px)`}, {transform:'none'}], {duration:240, easing:EASE_OUT}); });
      place(e);
    }
  }, {passive:false});
  const endDrag = e => {
    if (!PD || (e.pointerId !== undefined && e.pointerId !== PD.id)) return;
    const {it, on} = PD; PD = null; if (!on) return;
    const order = $$('.ph-item', it.parentElement).map(x => +x.dataset.pi);
    if (e.type !== 'pointercancel') ML.photos = order.map(i => ML.photos[i]).filter(Boolean);
    const list = it.parentElement; const r0 = it.getBoundingClientRect();
    it.classList.remove('drag'); it.style.transform = '';
    const r1 = it.getBoundingClientRect();
    if (M()) anim(it, [{transform:`translate(${r0.left - r1.left}px, ${r0.top - r1.top}px) scale(1.06)`}, {transform:'none'}], {duration:260, easing:EASE_OUT});
    setTimeout(() => { if ($('#li-photo-zone')) renderPhotoZone(); }, M() ? 270 : 0);
  };
  document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);
  document.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const pin = e.target.closest && e.target.closest('#big-map .pin'); if (pin && pin !== tipPin) { const l = S.listings[pin.dataset.pinlid]; if (l && S.mapSel === l.dept) showPinTip(pin); } });
  document.addEventListener('pointerout', e => { const pin = e.target.closest && e.target.closest('#big-map .pin'); if (pin && !(e.relatedTarget && pin.contains(e.relatedTarget))) hidePinTip(); });
  document.addEventListener('focusin', e => { const pin = e.target.closest && e.target.closest('#big-map .pin'); if (pin && S.kbd) { const l = S.listings[pin.dataset.pinlid]; if (l && S.mapSel === l.dept) showPinTip(pin); } });
  document.addEventListener('focusout', e => { if (S.ptype === 'touch') return; if (e.target.closest && e.target.closest('#big-map .pin')) hidePinTip(); });
  let hiddenAt = 0;
  const resync = () => { if (S.db && S.db.refresh) S.db.refresh().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 3000) resync(); });
  addEventListener('online', resync);
  addEventListener('pageshow', e => { if (e.persisted) resync(); });
  document.addEventListener('keydown', () => { S.kbd = true; }, true);
  document.addEventListener('pointerdown', e => { S.kbd = false; S.ptype = e.pointerType; }, true);
  document.addEventListener('click', e => { if (S.ptype === 'touch' && !(e.target.closest && e.target.closest('#big-map .pin'))) hidePinTip(); });
  document.addEventListener('scroll', e => { const tr = e.target; if (!tr || tr.id !== 'dw-track') return; const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); $$('.dw-dots span').forEach((d, k) => d.classList.toggle('on', k === i)); }, true);
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.closest && t.closest('#f-listing .fgrid')) { ML.touched[t.id] = true; t.classList.remove('auto-filled'); }
    if (t.id === 'f-dept') { S.f.dept = t.value; renderView(); }
    else if (t.id === 'f-status') { S.f.status = t.value; renderView(); }
    else if (t.id === 'f-dispo') { S.f.dispo = t.value; renderView(); }
    else if (t.id === 'cmp-sort') { const k = t.value; S.cmp.key = k; S.cmp.dir = (k === 'title' || k === 'price' || k === 'ppn') ? 1 : -1; fillCompare(); }
    else if (t.id === 'f-sort') { S.f.sort = t.value; renderView(); }
    else if (t.id === 'dw-status') { const l = S.listings[S.openId]; if (l && t.value === 'reserve' && l.status !== 'reserve') S.stampAnim = l.id; if (l) patchDoc('listings/' + l.id, {status:t.value, updatedAt:Date.now(), updatedBy:S.myId}).then(() => toast('Statut : ' + (statuses().find(s => s.id === t.value) || {}).label)); }
    else if (t.id === 'li-shots') { addShots(t.files); t.value = ''; }
    else if (t.id === 'li-photo-file') { Array.from(t.files || []).filter(f => /^image\//.test(f.type)).forEach(f => { if (ML.photos.length < MAX_PH) ML.photos.push({type:'file', file:f, url:URL.createObjectURL(f)}); else toast(MAX_PH + ' photos au maximum.'); }); t.value = ''; renderShots(); renderPhotoZone(); }
    else if (t.dataset && t.dataset.shotph !== undefined) { const sh = ML.shots[+t.dataset.shotph]; if (sh) { sh.phSeen = true; if (t.checked) { if (ML.photos.length >= MAX_PH) { t.checked = false; toast(MAX_PH + ' photos au maximum.'); } else ML.photos.push({type:'shot', shot:sh}); } else ML.photos = ML.photos.filter(p => p.shot !== sh); } renderPhotoZone(); }
    else if (t.id === 'li-dept') { ML.lat = null; ML.lng = null; }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'li-url') { autoSource(); checkDup(); }
    if (e.target.id === 'li-text') { clearTimeout(ML.tTimer); ML.tTimer = setTimeout(() => { const n = runParse(); if (n) setAiSt(plural(n, 'champ rempli', 'champs remplis') + ' à partir du texte : vérifie.'); }, 700); }
    else if (e.target.closest && e.target.closest('#f-listing .fgrid')) { ML.touched[e.target.id] = true; e.target.classList.remove('auto-filled'); }
    if ((e.target.id === 'dw-hwhy' || e.target.id === 'dw-vwhy') && canVote()) {
      const k = e.target.id === 'dw-hwhy' ? 'heartWhy' : 'vetoWhy'; const val = e.target.value.slice(0, 160);
      editMyVote(v => { v[k] = val; }); saveVote(false);
    }
    if (e.target.id === 'li-commune') { ML.lat = null; ML.lng = null; lookupDept(500); }
  });
  document.addEventListener('submit', e => {
    const f = e.target; e.preventDefault();
    if (f.id === 'f-login') doLogin();
    else if (f.id === 'f-listing') saveListing();
    else if (f.id === 'f-settings') saveSettings(f);
    else if (f.id === 'dw-cform') {
      const ta = $('#dw-ctext'); const text = ta.value.trim(); if (!S.openId) return;
      if (!text) { ta.focus(); ta.classList.remove('shake'); void ta.offsetWidth; ta.classList.add('shake'); const h = $('#dw-cform .hint'); if (h) { h.textContent = 'Écris d’abord ton commentaire.'; h.classList.add('warn'); setTimeout(() => { h.textContent = 'Ctrl + Entrée pour envoyer'; h.classList.remove('warn'); }, 2200); } return; }
      if (!S.members[S.myId]) { openSettings(true); return; }
      const btn = $('button[type=submit]', f); if (btn.disabled) return;
      const ref = S.db.collection('comments').doc();
      const c = {lid:S.openId, by:S.myId, text:text.slice(0, 1000), at:Date.now()};
      S.comments = Object.assign({}, S.comments, {[ref.id]:Object.assign({id:ref.id}, c)});
      btn.disabled = true; btn.classList.add('sent'); btn.textContent = 'Envoyé ✓'; ta.value = '';
      updateDrawer();
      const li = $(`#dw-clist [data-k="${CSS.escape(ref.id)}"]`);
      if (li) {
        li.classList.add('c-new');
        const sc = $('.dw-scroll'); if (sc) { const r = li.getBoundingClientRect(), sr = sc.getBoundingClientRect(); if (r.bottom > sr.bottom - 80 || r.top < sr.top) sc.scrollTo({top:sc.scrollTop + r.top - sr.top - sr.height / 3, behavior:M() ? 'smooth' : 'auto'}); }
      }
      setTimeout(() => { const b = $('#dw-cform button[type=submit]'); if (b) { b.disabled = false; b.classList.remove('sent'); b.textContent = 'Envoyer'; } }, 1600);
      const lid = S.openId;
      writeDoc('comments/' + ref.id, c).then(() => { toast('Commentaire envoyé'); store.set('gite-cdraft-' + lid, ''); }, () => {
        /* Échec : on retire le commentaire affiché trop tôt et on rend le texte pour pouvoir renvoyer */
        const rest = Object.assign({}, S.comments); delete rest[ref.id]; S.comments = rest;
        store.set('gite-cdraft-' + lid, text);
        if (S.openId === lid) { updateDrawer(); const t2 = $('#dw-ctext'); if (t2 && !t2.value.trim()) t2.value = text; }
      });
    }
  });
  document.addEventListener('paste', e => {
    if (!$('#f-listing')) return;
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => /^image\//.test(f.type));
    if (files.length) { e.preventDefault(); addShots(files); }
  });
  document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#li-drop'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#li-drop'); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('#li-drop'); if (z) { e.preventDefault(); z.classList.remove('over'); addShots(e.dataTransfer.files); } });
}

boot();
})();
