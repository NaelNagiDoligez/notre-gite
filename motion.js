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
    g.set(rise, {clearProps:'opacity,visibility'});
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
  const tl = introTl = g.timeline({defaults:{ease:OUT}, onComplete(){ if (introSplit) { introSplit.revert(); introSplit = null; } finish(); GM.spin(); }});
  introFinish = finish;
  tl.from('.hdr .eyebrow', {y:14, opacity:0, duration:.7}, 0);
  const sun = $$('.sun circle, .sun .rays path');
  if (sun.length && window.DrawSVGPlugin) tl.from(sun, {drawSVG:0, duration:.8, stagger:.045, ease:'power2.out'}, .3);
  if (introSplit) tl.from(introSplit.chars, {opacity:0, y:48, rotation:() => rnd(-9, 9), duration:1, stagger:.03}, .1);
  const sq = $('.hdr .squig path');
  if (sq) tl.fromTo(sq, {strokeDashoffset:1}, {strokeDashoffset:0, duration:1.2}, .65);
  tl.from($$('.hdr-r > *'), {opacity:0, y:14, duration:.6, stagger:.07}, .35);
  tl.from($$('#trip .tf'), {opacity:0, y:18, duration:.7, stagger:.08}, .55);
  tl.from($$('.bar .tab'), {opacity:0, y:12, duration:.55, stagger:.05}, .8);
  tl.from('#add-btn', {opacity:0, scale:.92, duration:.5}, 1.05);
};
function abortIntro(){
  if (!introTl) return;
  introTl.kill();
  if (introSplit) { introSplit.revert(); introSplit = null; }
  g.set($$('.hdr *, #trip .tf, .bar *'), {clearProps:'opacity,transform,strokeDashoffset'});
  if (introFinish) introFinish();
}
/* Le soleil du titre tourne très lentement : seule animation continue, toute petite. */
let spinTw = null;
GM.spin = function(){
  const r = $('.sun .rays');
  if (spinTw || !r || !on()) return;
  spinTw = g.to(r, {rotation:360, svgOrigin:'12 12', duration:70, ease:'none', repeat:-1});
};

/* Les pastilles des inscrits arrivent une à une. */
GM.avatars = function(root){
  if (!on() || !root) return;
  const a = $$('.av', root); if (!a.length) return;
  g.from(a, {opacity:0, y:10, scale:.5, duration:.7, stagger:.06, ease:'back.out(1.8)', clearProps:CLEAR});
};

/* ---------- Connexion ---------- */
GM.login = function(L){
  if (!on() || !L) return false;
  const card = $('.login-card', L); if (!card) return false;
  g.fromTo(card, {opacity:0, y:36, scale:.96}, {opacity:1, y:0, scale:1, duration:.9, ease:OUT, clearProps:CLEAR});
  g.from($$('.login-card > *', L), {opacity:0, y:14, duration:.6, stagger:.07, delay:.15, ease:OUT, clearProps:CLEAR});
  const sq = $('.squig path', L);
  if (sq) g.fromTo(sq, {strokeDashoffset:1}, {strokeDashoffset:0, duration:1.1, delay:.5, ease:OUT});
  return true;
};

/* ---------- Changement d'onglet : le contenu sort vite, le nouveau glisse depuis le côté ---------- */
GM.swap = function(panel, dir, apply){
  if (!on() || !panel) { apply(); return; }
  g.killTweensOf(panel);
  g.to(panel, {opacity:0, x:-dir * 14, duration:.13, ease:'power1.out', onComplete(){
    apply();
    g.fromTo(panel, {opacity:0, x:dir * 34, y:dir ? 0 : 10}, {opacity:1, x:0, y:0, duration:.55, ease:OUT, clearProps:'transform,opacity'});
  }});
};

/* ---------- Galerie : les cartes se posent comme des feuilles de papier ---------- */
GM.enterCards = function(cards){
  if (!on() || !cards.length) return false;
  const vh = innerHeight; const now = [], later = [];
  cards.forEach(c => (c.getBoundingClientRect().top < vh * .94 ? now : later).push(c));
  const play = (els, delay) => {
    els.forEach(e => { hidden.delete(e); e._enter = true; });
    return g.fromTo(els,
      {opacity:0, y:54, scale:.94, rotation:() => rnd(-2, 2), transformOrigin:'50% 100%'},
      {opacity:1, y:0, scale:1, rotation:0, duration:.9, ease:OUT, delay:delay || 0, stagger:.065, overwrite:true,
        onComplete(){ els.forEach(e => { e._enter = false; }); g.set(els, {clearProps:CLEAR}); }});
  };
  if (later.length) {
    if (window.ScrollTrigger) {
      g.set(later, {opacity:0, y:54, scale:.94, transformOrigin:'50% 100%'});
      later.forEach(e => hidden.add(e));
      triggers.grid.push.apply(triggers.grid, ScrollTrigger.batch(later, {start:'top 94%', once:true, interval:.08, onEnter:b => play(b)}));
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
  const photo = $('.dw-photo', dw), img = $('.dw-photo .ph > *', dw), pad = $$('.dw-pad > *', dw), title = $('.dw-title', dw);
  const tl = g.timeline({defaults:{ease:OUT}});
  if (photo) tl.fromTo(photo, {clipPath:'inset(0 0 100% 0)'}, {clipPath:'inset(0 0 0% 0)', duration:.7, clearProps:'clipPath'}, .05);
  if (img) tl.fromTo(img, {scale:1.25}, {scale:1, duration:1.3, clearProps:'transform'}, .05);
  tl.from(pad, {opacity:0, y:22, duration:.55, stagger:.06, clearProps:CLEAR}, .18);
  if (title && window.SplitText) {
    const sp = SplitText.create(title, {type:'words', aria:'auto'});
    tl.from(sp.words, {opacity:0, y:20, duration:.6, stagger:.045, onComplete:() => sp.revert()}, .3);
  }
  return true;
};

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
  if (spinTw) { spinTw.kill(); spinTw = null; g.set('.sun .rays', {clearProps:'all'}); }
  g.globalTimeline.getChildren(false, true, true).forEach(t => {
    try { if (t.repeat && t.repeat() === -1) t.kill(); else if (t.progress) t.progress(1); } catch (e) {}
  });
  $$('.card').forEach(c => { c._enter = false; c.classList.remove('tilting'); });
  g.set($$('.card'), {clearProps:'transform'});
  $$('.burst, .burst-ring, .shine').forEach(e => e.remove());
};
})();
