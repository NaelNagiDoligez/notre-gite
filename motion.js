// Notre gîte d'été : couche de mouvement (GSAP + plugins). Voir README.md.
// Tout est facultatif : si GSAP n'est pas chargé, window.GiteMotion.ready reste faux
// et app.js garde ses animations de base (WAAPI). L'interrupteur « Animations » est lu
// dans <html data-motion="on|off">, posé par app.js.
(function(){
'use strict';
const GM = window.GiteMotion = {ready:false, titleLocked:false};
const g = window.gsap;
if (!g) return;
g.registerPlugin.apply(g, [window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin, window.CustomEase, window.Physics2DPlugin].filter(Boolean));
g.config({nullTargetWarn:false});

/* Les mêmes courbes que les variables CSS --ease-out et --ease-io : une seule langue de mouvement. */
if (window.CustomEase) { CustomEase.create('gite-out', '.23,1,.32,1'); CustomEase.create('gite-io', '.77,0,.175,1'); }
const OUT = window.CustomEase ? 'gite-out' : 'power4.out';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const html = document.documentElement;
const on = () => html.dataset.motion === 'on';
const fine = () => !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);
const rnd = (a, b) => a + Math.random() * (b - a);
const hidden = new Set();              /* éléments cachés en attendant d'entrer à l'écran */
const triggers = {grid:[], sections:[]};
const CLEAR = 'transform,opacity,transformOrigin';

GM.ready = true;
html.classList.add('gm');

/* ---------- Défilement : nettoyage ---------- */
GM.killScroll = function(key){
  const list = key ? [key] : Object.keys(triggers);
  list.forEach(k => { (triggers[k] || []).splice(0).forEach(t => t.kill()); });
};
function revealHidden(){
  const els = Array.from(hidden); hidden.clear();
  if (els.length) g.set(els, {clearProps:CLEAR});
}

/* ---------- Ouverture du carnet (rare : une fois par visite) ---------- */
let introTl = null, introSplit = null, introFinish = null;
GM.intro = function(done){
  const rise = $$('.rise');
  const finish = () => {
    html.classList.add('gm-intro-done'); html.classList.remove('js-motion');
    g.set(rise, {clearProps:'opacity,visibility'}); g.set('#panel', {clearProps:'opacity,visibility,transform'});
    GM.titleLocked = false;
    introTl = null; introFinish = null;
    if (done) done();
  };
  if (!on() || !rise.length) { finish(); return; }
  const title = $('#title');
  if (title && window.SplitText) {
    GM.titleLocked = true;
    introSplit = SplitText.create(title, {type:'words,chars', charsClass:'ch', aria:'auto'});
  }
  g.set(rise, {opacity:1});
  const tl = introTl = g.timeline({defaults:{ease:OUT}, onComplete(){ if (introSplit) { introSplit.revert(); introSplit = null; } finish(); }});
  introFinish = finish;
  if (introSplit) tl.from(introSplit.chars, {opacity:0, y:48, rotation:() => rnd(-9, 9), duration:1, stagger:.03}, .1);
  const sq = $('.hdr .squig path');
  if (sq) tl.fromTo(sq, {strokeDashoffset:1}, {strokeDashoffset:0, duration:1.2}, .65);
  tl.from($$('.hdr-r > *'), {opacity:0, y:14, duration:.6, stagger:.07, clearProps:'opacity,transform'}, .35);
  tl.from('#trip', {opacity:0, y:16, duration:.6, clearProps:'opacity,transform'}, .3);
  tl.from($$('.bar .tab, #tab-ind'), {opacity:0, y:10, duration:.45, stagger:.04, clearProps:'opacity,transform'}, .45);
  tl.fromTo($$('#add-btn, #add-fab'), {opacity:0, scale:.92}, {opacity:1, scale:1, duration:.45, clearProps:'opacity,transform'}, .65);
  tl.fromTo('#panel', {autoAlpha:0, y:14}, {autoAlpha:1, y:0, duration:.55, clearProps:'opacity,visibility,transform'}, .55);
};
function abortIntro(){
  if (!introTl) return;
  introTl.kill();
  if (introSplit) { introSplit.revert(); introSplit = null; }
  g.set($$('.hdr *, #trip, #trip .tf, .bar *, #panel, #add-fab'), {clearProps:'opacity,visibility,transform,strokeDashoffset'});
  if (introFinish) introFinish();
}
/* Les pastilles des inscrits arrivent une à une. */
GM.avatars = function(root){
  if (!on() || !root) return;
  const a = $$('.av', root); if (!a.length) return;
  g.from(a, {opacity:0, y:10, scale:.5, duration:.7, stagger:.06, ease:'back.out(1.8)', clearProps:CLEAR});
};

/* ---------- Connexion ---------- */
GM.login = function(L, sel){
  if (!on() || !L) return false;
  const card = $(sel || '.login-card', L); if (!card) return false;
  g.fromTo(card, {opacity:0, y:30, scale:.97}, {opacity:1, y:0, scale:1, duration:.85, delay:.08, ease:OUT, clearProps:CLEAR});
  g.from(Array.from(card.children).filter(c => !c.hidden), {opacity:0, y:12, duration:.6, stagger:.06, delay:.28, ease:OUT, clearProps:CLEAR});
  const sq = $('.squig path', card);
  if (sq) g.fromTo(sq, {strokeDashoffset:1}, {strokeDashoffset:0, duration:1.1, delay:.55, ease:OUT});
  return true;
};

/* ---------- Changement d'onglet : le contenu sort vite, le nouveau glisse depuis le côté ---------- */
GM.swap = function(panel, dir, apply){
  if (!on() || !panel) { apply(); return; }
  g.killTweensOf(panel);
  /* La hauteur du panneau est gardée le temps du changement : la page ne saute plus vers le haut,
     puis elle se resserre doucement si le nouvel onglet est plus court. */
  const h0 = panel.offsetHeight; panel.style.minHeight = h0 + 'px';
  g.to(panel, {opacity:0, x:-dir * 10, duration:.12, ease:'power1.out', onComplete(){
    apply();
    /* hauteur naturelle mesurée sans lâcher le verrou (sinon le navigateur recale le scroll d'un coup) */
    const kids = Array.from(panel.children), pr = panel.getBoundingClientRect(), cs = getComputedStyle(panel), last = kids[kids.length - 1];
    const h1 = last ? Math.ceil(last.getBoundingClientRect().bottom - pr.top + (parseFloat(getComputedStyle(last).marginBottom) || 0) + (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0)) : 0;
    panel.style.minHeight = h0 + 'px';
    if (h1 < h0) g.to(panel, {minHeight:h1, duration:.4, ease:'power2.inOut', onComplete(){ panel.style.minHeight = ''; }});
    else panel.style.minHeight = '';
    g.fromTo(panel, {opacity:0, x:dir * 18, y:dir ? 0 : 8}, {opacity:1, x:0, y:0, duration:.32, ease:OUT, clearProps:'transform,opacity'});
  }});
};

/* ---------- Tampon « Retenu » : il claque sur sa cible, l'encre s'écrase ---------- */
GM.stamp = function(el, delay){
  if (!on() || !el) return false;
  g.killTweensOf(el);
  const host = el.parentElement;
  const tl = g.timeline({delay:delay || 0});
  tl.fromTo(el, {opacity:0, scale:2.7, rotation:-26, y:-34}, {opacity:1, scale:1, rotation:-8, y:0, duration:.26, ease:'power4.in', clearProps:'transform,opacity'});
  if (host) {
    const ring = document.createElement('span'); ring.className = 'stamp-ring'; ring.setAttribute('aria-hidden', 'true'); host.append(ring);
    tl.add(() => { const hr = host.getBoundingClientRect(), er = el.getBoundingClientRect(); ring.style.left = (er.left - hr.left + er.width / 2) + 'px'; ring.style.top = (er.top - hr.top + er.height / 2) + 'px'; g.fromTo(ring, {scale:.55, opacity:.55}, {scale:1.5, opacity:0, duration:.55, ease:OUT, onComplete:() => ring.remove()}); })
      .to(host, {y:3, scaleY:.992, duration:.07, ease:'power2.out'}, '<')
      .to(host, {y:0, scaleY:1, duration:.55, ease:'elastic.out(1,.35)', clearProps:'transform'}, '>');
  }
  return true;
};

/* ---------- Carte qui se retourne ---------- */
GM.flip = function(card, mid){
  if (!on() || !card) { mid(); return; }
  card._enter = true; card.classList.add('flipping'); g.killTweensOf(card);
  g.set(card, {transformPerspective:900, scaleX:1});
  /* Vrai demi-tour : 0 → 90° (tranche), puis 90° → 180° avec un miroir pour que le contenu reste lisible.
     Le côté qui s'éloigne continue de s'éloigner, il n'y a plus de « retour » parasite. */
  g.timeline({onComplete(){ card._enter = false; card.classList.remove('flipping'); g.set(card, {clearProps:'transform'}); }})
    .to(card, {rotationY:90, duration:.22, ease:'power2.in'})
    .add(mid)
    .set(card, {scaleX:-1})
    .to(card, {rotationY:180, duration:.36, ease:'power3.out'});
};

/* ---------- Gestes courants ---------- */
/* Notes : les pastilles se remplissent en vague (vers le haut en montant, vers le bas en descendant). */
GM.dots = function(row, from, to){
  if (!on() || !row) return false;
  const dots = $$('.dot', row); const a = from || 0, b = to || 0; if (a === b) return false;
  const grow = b > a; const set = dots.slice(Math.min(a, b), Math.max(a, b));
  g.fromTo(set, {y:grow ? 7 : -5, scale:grow ? .55 : 1.14}, {y:0, scale:1, duration:.44, stagger:{each:.03, from:grow ? 'start' : 'end'}, ease:'back.out(2.8)', overwrite:true, clearProps:'transform'});
  return true;
};
/* La valeur « roule » d'un nombre à l'autre. */
GM.roll = function(el, from, to){
  if (!on() || !el || from === to || typeof to !== 'number') return false;
  const o = {v: typeof from === 'number' ? from : Math.max(0, to - 2)};
  g.killTweensOf(o);
  g.to(o, {v:to, duration:.4, ease:'power2.out', onUpdate(){ el.textContent = Math.round(o.v); }, onComplete(){ el.textContent = to; }});
  g.fromTo(el, {y:to > (typeof from === 'number' ? from : 0) ? 8 : -8, scale:1.3}, {y:0, scale:1, duration:.5, ease:'back.out(2.4)', overwrite:'auto', clearProps:'transform'});
  return true;
};
/* La photo de la fiche défile plus lentement que le texte. */
GM.parallax = function(dw){
  const sc = $('.dw-scroll', dw), ph = $('.dw-photo', dw); if (!sc || !ph) return;
  let raf = 0;
  const upd = () => { raf = 0; ph.style.setProperty('--py', on() ? Math.min(sc.scrollTop * .32, 24).toFixed(1) + 'px' : '0px'); };
  sc.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, {passive:true});
};
/* Dates : la case touchée envoie une onde le long de la ligne, la colonne du total se rééquilibre. */
GM.wave = function(row, idx){
  if (!on() || !row) return false;
  const c = $$('.dc', row)[idx]; if (!c) return false;
  g.fromTo(c, {scale:.82}, {scale:1, duration:.5, ease:'back.out(2.4)', overwrite:'auto', clearProps:'transform'});
  return true;
};
GM.bars = function(bars, prevs){
  if (!on() || !bars.length) return false;
  const val = t => { const m = /scaleY\(([-\d.]+)\)/.exec(t || ''); return m ? +m[1] : null; };
  bars.forEach((b, i) => {
    const from = val(prevs[i]), fin = b.style.transform, to = val(fin);
    if (from === null || to === null || from === to) return;
    g.killTweensOf(b);
    g.fromTo(b, {scaleY:from}, {scaleY:to, duration:.6, ease:'power3.out', onComplete(){ b.style.transform = fin; }});
  });
  return true;
};
/* Comparateur : la meilleure note de chaque ligne s'allume, la plus basse s'éteint. */
GM.lights = function(wrap){
  if (!on() || !wrap) return false;
  const best = $$('.cell.best', wrap), low = $$('.cell.low', wrap);
  if (best.length) g.fromTo(best, {scale:.86, filter:'brightness(.7)'}, {scale:1, filter:'brightness(1)', duration:.7, delay:.9, stagger:.05, ease:'back.out(2.2)', clearProps:'transform,filter'});
  return true;
};

/* ---------- Galerie : les cartes se posent comme des feuilles de papier ---------- */
GM.enterCards = function(cards){
  if (!on() || !cards.length) return false;
  const vh = innerHeight; const now = [], later = [];
  cards.forEach(c => (c.getBoundingClientRect().top < vh * .94 ? now : later).push(c));
  const play = (els, delay) => {
    els.forEach(e => { hidden.delete(e); e._enter = true; });
    return g.fromTo(els,
      {opacity:0, y:28, scale:.97, rotation:() => rnd(-1.2, 1.2), transformOrigin:'50% 100%'},
      {opacity:1, y:0, scale:1, rotation:0, duration:.55, ease:OUT, delay:delay || 0, stagger:.05, overwrite:true,
        onComplete(){ els.forEach(e => { e._enter = false; }); g.set(els, {clearProps:CLEAR}); }});
  };
  if (later.length) {
    if (window.ScrollTrigger) {
      g.set(later, {opacity:0, y:28, scale:.97, transformOrigin:'50% 100%'});
      later.forEach(e => hidden.add(e));
      triggers.grid.push.apply(triggers.grid, ScrollTrigger.batch(later, {start:'top 102%', once:true, interval:.05, onEnter:b => play(b)}));
    } else now.push.apply(now, later);
  }
  if (now.length) play(now, .05);
  return true;
};

/* Inclinaison douce des cartes sous la souris (souris seulement : jamais au toucher). */
const tilts = new WeakMap();
GM.bindTilt = function(root){
  if (!root || root._tilt) return; root._tilt = true;
  let cur = null;
  const leave = c => { if (!c) return; c.classList.remove('tilting'); const t = tilts.get(c); if (t) { t.rx(0); t.ry(0); t.y(0); } };
  root.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !on() || !fine()) return;
    const c = e.target.closest ? e.target.closest('.card') : null;
    if (c !== cur) { leave(cur); cur = c; }
    if (!c || c._enter) return;
    let t = tilts.get(c);
    if (!t) {
      g.set(c, {transformPerspective:900});
      t = {rx:g.quickTo(c, 'rotationX', {duration:.6, ease:'power3.out'}), ry:g.quickTo(c, 'rotationY', {duration:.6, ease:'power3.out'}), y:g.quickTo(c, 'y', {duration:.5, ease:'power3.out'})};
      tilts.set(c, t);
    }
    const r = c.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - .5) * 2, ny = ((e.clientY - r.top) / r.height - .5) * 2;
    c.classList.add('tilting');
    t.ry(nx * 3.5); t.rx(-ny * 3.5); t.y(-4);
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive:true});
  root.addEventListener('pointerleave', () => { leave(cur); cur = null; }, {passive:true});
  addEventListener('scroll', () => { if (cur) { leave(cur); cur = null; } }, {passive:true});
};

/* ---------- Comparateur ---------- */
GM.rows = function(wrap){
  if (!on() || !wrap) return false;
  const rows = $$('tbody tr', wrap); if (!rows.length) return false;
  g.from(rows, {opacity:0, y:16, duration:.65, ease:OUT, stagger:.045, delay:.1, clearProps:CLEAR});
  return true;
};

/* ---------- Podium : socles qui montent, cartes qui tombent, numéros tamponnés ---------- */
GM.podium = function(el){
  if (!on() || !el) return null;
  const stage = $('.stage', el); if (!stage) return null;
  const tl = g.timeline({defaults:{ease:OUT}});
  const out = {};
  [['r3', 0, 3.5], ['r2', .24, -3], ['r1', .52, 0]].forEach(([k, d, rot]) => {
    const s = $('.step.' + k, stage); if (!s) return;
    const pl = $('.plinth', s), card = $('.step-card', s), num = $('.pl-n', s); const win = k === 'r1';
    tl.fromTo(pl, {scaleY:0, transformOrigin:'50% 100%'}, {scaleY:1, duration:.8, ease:'back.out(1.4)'}, d)
      .fromTo(card, {opacity:0, y:win ? -110 : -70, rotation:rot}, {opacity:1, y:0, rotation:0, duration:win ? 1.1 : .85, ease:win ? 'bounce.out' : 'back.out(1.2)', clearProps:'transform,opacity'}, d + .32);
    if (num) tl.fromTo(num, {scale:2.6, rotation:-16, opacity:0}, {scale:1, rotation:0, opacity:1, duration:.55, ease:'back.out(2.2)'}, d + .7);
    out[k] = Math.round((d + .35) * 1000);
  });
  const w = $('.step.r1 .step-card', stage);
  if (w) {
    const sh = document.createElement('span'); sh.className = 'shine'; sh.setAttribute('aria-hidden', 'true'); w.append(sh);
    tl.fromTo(sh, {xPercent:-140, skewX:-18}, {xPercent:340, duration:1.1, ease:'power2.inOut', onComplete:() => sh.remove()}, 1.7);
  }
  const vh = innerHeight;
  const rest = $$('.rest li', el).filter(li => li.getBoundingClientRect().top < vh);
  if (rest.length) tl.from(rest, {opacity:0, x:-22, duration:.6, stagger:.055, clearProps:CLEAR}, 1.1);
  return out;
};
/* Les sections plus bas dans la page apparaissent quand on y arrive. */
GM.sections = function(root){
  GM.killScroll('sections');
  if (!on() || !root || !window.ScrollTrigger) return;
  const later = $$(':scope > section', root).filter(s => s.getBoundingClientRect().top > innerHeight * .9);
  if (!later.length) return;
  g.set(later, {opacity:0, y:36}); later.forEach(s => hidden.add(s));
  triggers.sections.push.apply(triggers.sections, ScrollTrigger.batch(later, {start:'top 92%', once:true, onEnter:b => {
    b.forEach(s => hidden.delete(s));
    g.to(b, {opacity:1, y:0, duration:.9, ease:OUT, stagger:.12, clearProps:'transform,opacity'});
    g.from(b.reduce((a, s) => a.concat($$('li, tbody tr', s)), []), {opacity:0, x:-18, duration:.55, ease:OUT, stagger:.05, delay:.12, clearProps:CLEAR});
  }}));
};

/* ---------- Carte : les départements apparaissent en onde depuis le centre, puis les épingles tombent ---------- */
GM.mapIn = function(box, delayOf){
  if (!on() || !box) return false;
  const deps = $$('.dep', box); if (!deps.length) return false;
  g.fromTo(deps, {opacity:0}, {opacity:1, duration:.55, ease:'power1.out', overwrite:true, clearProps:'opacity', delay:(i, el) => (delayOf ? delayOf(el) : 0) * 1});
  return true;
};
GM.pins = function(root){
  if (!on() || !root) return false;
  const pins = $$('.pin', root); if (!pins.length) return false;
  pins.forEach((p, i) => {
    const dl = .45 + Math.min(i, 14) * .08;
    const dot = $('.pin-dot', p), halo = $('.pin-halo', p);
    if (dot) g.fromTo(dot, {y:-90, opacity:0}, {y:0, opacity:1, duration:.95, delay:dl, ease:'bounce.out', overwrite:true});
    if (halo) g.fromTo(halo, {opacity:.55, scale:.6}, {opacity:0, scale:2.6, duration:1, delay:dl + .38, ease:OUT, overwrite:true});
  });
  return true;
};

/* ---------- Fiche (tiroir) ---------- */
GM.drawer = function(dw){
  if (!on() || !dw) return false;
  GM.parallax(dw);
  const photo = $('.dw-photo', dw), img = $('.dw-photo .ph > img', dw), pad = $$('.dw-pad > *', dw), title = $('.dw-title', dw);
  const tl = g.timeline({defaults:{ease:OUT}});
  if (img) tl.fromTo(img, {scale:1.28}, {scale:1.22, duration:.7, clearProps:'transform'}, .05);
  tl.from(pad, {opacity:0, y:10, duration:.35, stagger:.03, clearProps:CLEAR}, .18);
  return true;
};


/* ---------- Fiche : la vraie carte s'agrandit depuis sa place jusqu'au centre ---------- */
const MODAL_PROPS = ['left','top','width','height','inset','margin','maxHeight','borderRadius','overflow'];
function modalClean(dw){
  MODAL_PROPS.forEach(k => { dw.style[k] = ''; });
  $$('.dw-ghost', dw).forEach(n => n.remove());
  const body = $('.dw-scroll', dw); if (body) { body.style.width = ''; body.style.flex = ''; body.style.opacity = ''; }
  const close = $('.dw-close', dw); if (close) close.style.opacity = '';
  if (dw._src) { dw._src.style.opacity = ''; dw._src.style.visibility = ''; dw._src = null; }
}
function ghost(card){
  const c = card.cloneNode(true);
  c.classList.remove('flipping', 'hl', 'card-away'); c.removeAttribute('data-k');
  c.setAttribute('aria-hidden', 'true'); c.inert = true;
  c.classList.add('dw-ghost');
  c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;margin:0;transform:none;z-index:6;pointer-events:none;border:0;border-radius:inherit;box-shadow:none';
  return c;
}
const isCard = el => !!(el && el.matches && el.matches('.card') && el.getBoundingClientRect().width > 8);
GM.modalOpen = function(dw, scrim, src, done){
  if (!on() || !dw) return false;
  g.killTweensOf([dw, scrim]); modalClean(dw);
  g.fromTo(scrim, {opacity:0}, {opacity:1, duration:.35, ease:'power2.out'});
  const body = $('.dw-scroll', dw), close = $('.dw-close', dw);
  if (!isCard(src)) {
    g.fromTo(dw, {opacity:0, scale:.94, y:16}, {opacity:1, scale:1, y:0, duration:.4, ease:OUT, clearProps:'transform,opacity', onComplete(){ done && done(); }});
    return true;
  }
  const r1 = dw.getBoundingClientRect(), r0 = src.getBoundingClientRect();
  const gh = ghost(src); dw._src = src;
  Object.assign(dw.style, {inset:'auto', margin:'0', maxHeight:'none', overflow:'hidden', left:r0.left + 'px', top:r0.top + 'px', width:r0.width + 'px', height:r0.height + 'px', borderRadius:'16px'});
  body.style.width = r1.width + 'px'; body.style.flex = '0 0 auto'; body.style.opacity = '0'; close.style.opacity = '0';
  dw.append(gh);
  const tl = g.timeline({onComplete(){ modalClean(dw); done && done(); }});
  tl.to(dw, {left:r1.left, top:r1.top, width:r1.width, height:r1.height, borderRadius:22, duration:.4, ease:'power3.inOut'}, 0)
    .to(gh, {opacity:0, duration:.15, ease:'power1.out'}, .04)
    .to([body, close], {opacity:1, duration:.2, ease:'power1.out'}, .12);
  return true;
};
GM.modalClose = function(dw, scrim, src, done){
  if (!on() || !dw) { done(); return; }
  g.killTweensOf([dw, scrim]);
  const body = $('.dw-scroll', dw), close = $('.dw-close', dw);
  g.to(scrim, {opacity:0, duration:.32, ease:'power2.out'});
  const r0 = isCard(src) ? src.getBoundingClientRect() : null;
  const inView = r0 && r0.bottom > 0 && r0.top < innerHeight;
  if (!inView) { modalClean(dw); g.to(dw, {opacity:0, scale:.95, y:10, duration:.24, ease:OUT, onComplete(){ g.set(dw, {clearProps:'transform,opacity'}); done(); }}); return; }
  modalClean(dw);
  const r1 = dw.getBoundingClientRect(), gh = ghost(src); dw._src = src;
  Object.assign(dw.style, {inset:'auto', margin:'0', maxHeight:'none', overflow:'hidden', left:r1.left + 'px', top:r1.top + 'px', width:r1.width + 'px', height:r1.height + 'px'});
  body.style.width = r1.width + 'px'; body.style.flex = '0 0 auto';
  gh.style.opacity = '0'; dw.append(gh);
  const tl = g.timeline({onComplete(){ modalClean(dw); done(); }});
  tl.to([body, close], {opacity:0, duration:.16, ease:'power1.out'}, 0)
    .to(gh, {opacity:1, duration:.22, ease:'power1.out'}, 0)
    .to(dw, {left:r0.left, top:r0.top, width:r0.width, height:r0.height, borderRadius:16, duration:.42, ease:'power3.inOut'}, 0);
};

/* Hauteur qui se joue en douceur quand un bloc grandit ou rétrécit (onUpdate : garder un repère immobile). */
GM.heightFrom = function(el, from, onUpdate, dur){
  if (!on() || !el || from == null) return false;
  const to = el.offsetHeight; if (Math.abs(to - from) < 2) return false;
  g.killTweensOf(el);
  el.style.overflow = 'hidden';
  g.fromTo(el, {height:from}, {height:to, duration:dur || .42, ease:OUT, onUpdate, onComplete(){ el.style.height = ''; el.style.overflow = ''; onUpdate && onUpdate(); }});
  return true;
};
GM.fadeIn = function(els){ if (on() && els && (els.length === undefined || els.length)) g.from(els, {opacity:0, y:6, duration:.35, delay:.08, ease:OUT, clearProps:'opacity,transform'}); };

/* ---------- Coup de cœur : pluie de cœurs avec de la gravité ---------- */
GM.burst = function(el, heartSVG){
  if (!on() || !el || !window.Physics2DPlugin) return false;
  const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span'); s.className = 'burst'; s.innerHTML = heartSVG;
    s.style.left = (cx - 8) + 'px'; s.style.top = (cy - 8) + 'px'; document.body.append(s);
    g.set(s, {scale:.3});
    const life = rnd(1.1, 1.6);
    g.to(s, {duration:life, physics2D:{velocity:rnd(180, 420), angle:rnd(-150, -30), gravity:700}, rotation:rnd(-60, 60), scale:rnd(.6, 1.5), ease:'none', onComplete:() => s.remove()});
    g.to(s, {opacity:0, duration:.45, delay:life - .5, ease:'power1.in'});
  }
  const ring = document.createElement('span'); ring.className = 'burst-ring';
  ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; document.body.append(ring);
  g.fromTo(ring, {scale:.3, opacity:.8}, {scale:2.8, opacity:0, duration:.7, ease:OUT, onComplete:() => ring.remove()});
  return true;
};

/* ---------- Révélation du podium (le grand moment) ----------
   o : {ov, inner, spot, sub, title, slots:{1,2,3}, winnerText, countUp(el, valeur, ms), confetti(), done()}
   Retourne {skip()}. Aucun état final n'est posé ici : app.js le fait dans done(). */
GM.reveal = function(o){
  const tl = g.timeline({defaults:{ease:OUT}});
  const slots = [1, 2, 3].map(r => o.slots[r]).filter(Boolean);
  const others = [o.slots[2], o.slots[3]].filter(Boolean);
  let split = null, over = false;
  const rings = [];
  o.ov.classList.add('gm-rv');
  g.set(slots, {opacity:0});
  if (window.SplitText) split = SplitText.create(o.title, {type:'words,chars', aria:'auto'});

  tl.fromTo(o.spot, {opacity:0, scale:.5}, {opacity:1, scale:1, duration:2, ease:'power2.out'}, 0)
    .from(o.sub, {opacity:0, y:10, duration:.7}, .1);
  if (split) tl.from(split.chars, {opacity:0, y:70, rotationX:-80, transformOrigin:'50% 100%', duration:1, stagger:.028, ease:'back.out(1.5)'}, .25);

  /* 3e et 2e : le socle monte, puis la carte tombe dessus et la note se compte */
  const place = (rank, t, rot) => {
    const s = o.slots[rank]; if (!s) return;
    const pl = $('.plinth', s), card = $('.step-card', s), n = $('[data-score]', s);
    tl.set(s, {opacity:1}, t)
      .fromTo(pl, {scaleY:0, transformOrigin:'50% 100%'}, {scaleY:1, duration:.85, ease:'back.out(1.3)'}, t)
      .fromTo(card, {opacity:0, y:-120, rotation:rot}, {opacity:1, y:0, rotation:0, duration:.9, ease:'back.out(1.15)'}, t + .35)
      .add(() => o.countUp(n, Number(n.dataset.score), 1100), t + .8);
  };
  place(3, 1.7, -4); place(2, 3.1, 3.5);

  /* Suspense : les deux autres s'effacent un peu, la lumière monte */
  const tW = 4.9, impact = tW + .75;
  if (others.length) tl.to(others, {opacity:.5, scale:.97, duration:.7, ease:'power2.out'}, tW - .9);
  const w = o.slots[1];
  if (w) {
    tl.set(w, {opacity:1}, tW)
      .fromTo($('.plinth', w), {scaleY:0, transformOrigin:'50% 100%'}, {scaleY:1, duration:.9, ease:'back.out(1.3)'}, tW)
      .fromTo($('.step-card', w), {opacity:0, y:-320, scale:1.08}, {opacity:1, y:0, scale:1, duration:1.15, ease:'bounce.out'}, tW + .35)
      .add(() => o.countUp($('[data-score]', w), Number($('[data-score]', w).dataset.score), 1200), tW + .8);
  }
  /* Impact : tremblement, ondes, confettis, le titre devient le nom du gagnant */
  tl.fromTo(o.inner, {y:0}, {keyframes:{y:[0, -9, 6, -3, 0]}, duration:.5, ease:'none'}, impact)
    .add(() => {
      if (w) o.markWinner(w);
      if (w) {
        const ir = o.inner.getBoundingClientRect(), wr = $('.step-card', w).getBoundingClientRect();
        [0, .18].forEach(d => {
          const ring = document.createElement('span'); ring.className = 'rv-ring';
          ring.style.cssText = `left:${wr.left - ir.left}px;top:${wr.top - ir.top}px;width:${wr.width}px;height:${wr.height}px`;
          o.inner.append(ring); rings.push(ring);
          g.fromTo(ring, {opacity:.75, scale:1}, {opacity:0, scale:1.55, duration:1, delay:d, ease:OUT, onComplete:() => ring.remove()});
        });
      }
      o.confetti();
    }, impact)
    .add(() => {
      if (!split) return;
      g.to(split.chars, {opacity:0, y:-60, duration:.3, stagger:.01, ease:'power2.out', onComplete(){
        split.revert(); o.title.textContent = o.winnerText;
        split = SplitText.create(o.title, {type:'words,chars', aria:'auto'});
        g.fromTo(split.chars, {opacity:0, y:70, rotationX:-80, transformOrigin:'50% 100%'}, {opacity:1, y:0, rotationX:0, duration:.9, stagger:.022, ease:'back.out(1.6)', onComplete(){ if (split) { split.revert(); split = null; } }});
      }});
    }, impact + .1);
  if (others.length) tl.to(others, {opacity:1, scale:1, duration:.8, ease:'power2.out'}, impact + 1.2);
  tl.add(() => { if (!over) { over = true; o.done(); } }, impact + 2);

  return {
    skip(){
      if (over) return; over = true;
      tl.kill(); g.killTweensOf(o.title);
      if (split) { g.killTweensOf(split.chars); split.revert(); split = null; }
      rings.forEach(r => r.remove());
      o.done(true);
      /* app.js a posé l'état final (.in, .win, titre) : on retire les styles en ligne de l'animation */
      g.set(slots.concat($$('.step-card, .plinth', o.ov), [o.inner, o.sub, o.spot]), {clearProps:'all'});
    }
  };
};

/* ---------- Animations coupées en route : tout se pose immédiatement ---------- */
GM.disable = function(){
  abortIntro();
  GM.killScroll(); revealHidden();
  g.globalTimeline.getChildren(false, true, true).forEach(t => {
    try { if (t.repeat && t.repeat() === -1) t.kill(); else if (t.progress) t.progress(1); } catch (e) {}
  });
  $$('.card').forEach(c => { c._enter = false; c.classList.remove('tilting'); });
  g.set($$('.card'), {clearProps:'transform'});
  $$('.burst, .burst-ring, .shine').forEach(e => e.remove());
};
})();
