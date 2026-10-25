// Notre gîte d'été : le décor dessiné en fond (montagnes, plage, animaux, mouettes, silhouettes)
// et le ciel qui suit l'heure (soleil, lune, étoiles, couleurs). Aucune dépendance.
// Réglages lus dans localStorage : gite-scene (on/off), gite-theme (time/light/dark/system).
// Pour tester une heure précise : ajouter ?h=14.5 (ou ?h=21) à l'adresse.
(function(){
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const root = document.documentElement;
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const SUNRISE = 6.5, SUNSET = 20.5;

/* ---------- Heure ---------- */
let forced = null;
try { const q = new URLSearchParams(location.search).get('h'); if (q !== null && q !== '' && !isNaN(+q)) forced = +q; } catch (e) {}
const hourNow = () => { if (forced !== null) return forced; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const isNight = h => h < SUNRISE || h >= SUNSET;

/* ---------- Palettes (clair = papier crème, sombre = nuit) ---------- */
const K = ['top','mid','bot','far','near','hill','hill2','sea','sand','cloud','line','snow','pine','wall','roof','cowW','cowK','ppl','gull','star','sun'];
const mk = s => { const o = {}; s.split(' ').forEach((v, i) => { o[K[i]] = v; }); return o; };
const LIGHT = [
  [0,    mk('#CFCBE6 #E3D9E6 #EFE2DD #B7B2CD #9C98B4 #AEB591 #98A27B #A3B6CB #E6D7BC #F6F1F6 #3A2F44 #F4F1FA #6D8A62 #F2E4CC #B8502D #FFFBF3 #3B2F25 #3B2F25 #FFFFFF #7E78A8 #FFE9A6')],
  [6,    mk('#F2D2C2 #F8E1CC #FBEBD2 #D8B9B2 #BDA3A2 #B9BE8C #A3AB78 #C6D0D2 #EBD7B8 #FFF2E6 #4A372E #FFF6EE #6F8B5E #F6E7CF #B8502D #FFFBF3 #3B2F25 #3B2F25 #FFFFFF #7E78A8 #FF9F5C')],
  [9,    mk('#CDE5EE #E4EEEA #F7F0E3 #B6CAD3 #94ADB1 #ABC27E #93AC66 #8CC2CF #F0DFB9 #FFFFFF #3B2F25 #FFFFFF #6F9560 #F6E9D0 #B8502D #FFFBF3 #3B2F25 #3B2F25 #FFFFFF #7E78A8 #FFD45E')],
  [13,   mk('#BCDFEC #DCEBE7 #F6EFE0 #AEC7D2 #8CA9AF #A2BF74 #8AA85C #7FBFD0 #F2E0B6 #FFFFFF #3B2F25 #FFFFFF #6A925A #F6E9D0 #B8502D #FFFBF3 #3B2F25 #3B2F25 #FFFFFF #7E78A8 #FFD04A')],
  [17,   mk('#D2E3E8 #EDEBDD #FBEBCB #BFC7C8 #A0A9A3 #B1BE7D #9AAA67 #86B8C5 #F0DDB0 #FFF8EB #3E3027 #FFFBF2 #6E8F5D #F6E8CE #B8502D #FFFBF3 #3B2F25 #3B2F25 #FFFFFF #7E78A8 #FFBE55')],
  [19.5, mk('#F1C3B0 #F8D8BF #FBE1B9 #CDA6A2 #AD8F8E #A5A872 #8F9460 #D7A9A2 #E9CBA4 #FFE0D0 #47322B #FFEFE6 #6C8559 #F3E0C6 #B8502D #FFF3E6 #3B2F25 #3B2F25 #FFF3EA #7E78A8 #FF8F4F')],
  [21,   mk('#B9B2D4 #D8C7D6 #F0D2CA #A89EBD #8E87A8 #98A07F #848C6C #A9B0CB #DDC9B0 #EFE6F0 #3A2F44 #F2EEF8 #637B58 #EBDCC6 #B8502D #FFFBF3 #3B2F25 #3B2F25 #F4F0FA #7E78A8 #FFB36A')]
];
const DARK = [
  [0,    mk('#0E1325 #1B1B34 #2B2036 #2A3251 #1E2641 #1D2A27 #17231F #15293E #3A3228 #2E3659 #05060F #7E88B5 #1B3027 #6E6258 #7A3A27 #8C8A92 #14121A #07070F #9AA0B8 #FFF6D8 #FFE9A6')],
  [6,    mk('#2A2849 #4A3C57 #7B5258 #4B4562 #35344F #303C2D #27332A #2B4358 #5A4A3B #7A5C68 #0A0710 #A89BB5 #28392B #7B6C5E #8A402C #B2A99C #1A1620 #0A0710 #B5A9B8 #FFF6D8 #FF9F5C')],
  [9,    mk('#1D3A50 #2B4A5D #3D5868 #3B566E #2B4358 #385231 #2D4328 #1F4E63 #6A5B43 #4C6B83 #07101A #A9BDD0 #2A4630 #8C7E6A #8A402C #B7B5B0 #1A1D26 #07101A #B7C4D0 #FFF6D8 #FFD45E')],
  [13,   mk('#22425A #315267 #44606F #3F5C75 #2F4B62 #3C5934 #30482B #225669 #6F6048 #567589 #07101A #B2C4D6 #2D4C33 #928470 #8A402C #BDBBB6 #1A1D26 #07101A #BDC9D4 #FFF6D8 #FFD04A')],
  [17,   mk('#1F3A52 #35495F #4D5C68 #3E566D #2D4559 #3A5232 #2E442A #1F5062 #6A5A44 #4F6C82 #07101A #ADBDCE #2B4731 #8D7F6B #8A402C #B9B6B0 #1A1D26 #07101A #B9C4CF #FFF6D8 #FFBE55')],
  [19.5, mk('#3A2B50 #6A3F4F #8E5448 #5B3F57 #3E2F4A #3A3A2B #2F3225 #5A3A4B #6B4E3B #9A5F5B #0A0710 #C2A9B4 #2D3B2C #7E6C5C #8A402C #BDAEA6 #1A1620 #0A0710 #CDB6B6 #FFF6D8 #FF8F4F')],
  [21,   mk('#1A1A3A #2E2445 #4A2F46 #3A3556 #2A2A48 #26332A #1F2A22 #1E3050 #4C3E31 #4A3F66 #05060F #8E8AB5 #213529 #6C6058 #7A3A27 #8E8C95 #14121A #07070F #A4A8C0 #FFF6D8 #FFB36A')]
];
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, f) => { const x = hex(a), y = hex(b); return toHex([x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f]); };
function paletteAt(table, h){
  const t = table.concat([[24, table[0][1]]]);
  let i = 0; while (i < t.length - 2 && h >= t[i + 1][0]) i++;
  const a = t[i], b = t[i + 1]; const f = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
  const o = {}; K.forEach(k => { o[k] = mix(a[1][k], b[1][k], f); }); return o;
}
const clamp01 = v => Math.max(0, Math.min(1, v));
/* 0 en plein jour, 1 en pleine nuit, avec une heure de crépuscule de chaque côté */
function nightAt(h){
  if (h >= SUNRISE && h < SUNSET - 0.0) return h > SUNSET - 1 ? clamp01((h - (SUNSET - 1)) * 0.5) : (h < SUNRISE + 1 ? clamp01((SUNRISE + 1 - h) * 0.5) : 0);
  return h >= SUNSET ? clamp01(0.5 + (h - SUNSET) * 0.5) : clamp01(0.5 + (SUNRISE - h) * 0.5);
}

/* ---------- Thème (clair / sombre) ---------- */
function applyTheme(){
  const mode = get('gite-theme') || 'time';
  if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
  else if (mode === 'time') root.dataset.theme = isNight(hourNow()) ? 'dark' : 'light';
  else delete root.dataset.theme;
}
const darkNow = () => root.dataset.theme ? root.dataset.theme === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);

/* ---------- Dessin ---------- */
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);
const f1 = n => Math.round(n * 10) / 10;
const L = 'stroke:var(--sc-line);stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round';

function cow(x, y, s, flip, delay){
  return `<g transform="translate(${x} ${y}) scale(${f1(s * flip)} ${s})"><g class="sc-body">
    <path d="M-27 -22 Q-26 -36 -8 -36 L12 -36 Q27 -35 27 -22 Q27 -10 14 -10 L-14 -10 Q-27 -10 -27 -22Z" fill="var(--sc-cowW)" style="${L}"/>
    <path d="M-12 -35 Q-2 -37 4 -31 Q2 -22 -8 -23 Q-15 -27 -12 -35Z M12 -24 Q20 -30 26 -22 Q24 -13 15 -12Z" fill="var(--sc-cowK)"/>
    <path d="M-14 -10 V4 M-5 -10 V4 M9 -10 V4 M18 -10 V4" style="${L};stroke-width:3.6"/>
    <path d="M-27 -30 Q-37 -26 -34 -12" fill="none" style="${L}"/>
    <g class="sc-head" style="animation-delay:${delay}s"><path d="M22 -34 L38 -28 Q42 -20 36 -14 L22 -17Z" fill="var(--sc-cowW)" style="${L}"/>
      <path d="M33 -19 L41 -21 L40 -15 L33 -14Z" fill="#E5A79A"/><path d="M24 -35 L21 -42 M29 -33 L30 -41" style="${L}"/><circle cx="31" cy="-26" r="1.6" fill="var(--sc-line)"/></g></g></g>`;
}
function sheep(x, y, s, flip){
  return `<g transform="translate(${x} ${y}) scale(${f1(s * flip)} ${s})">
    <path d="M-10 -8 V3 M6 -8 V3" style="${L};stroke-width:3"/>
    <path d="M-18 -16 Q-22 -26 -10 -27 Q-6 -34 4 -30 Q14 -34 17 -24 Q22 -16 14 -10 Q4 -6 -10 -8 Q-18 -8 -18 -16Z" fill="var(--sc-cowW)" style="${L}"/>
    <path d="M14 -24 Q24 -26 25 -17 Q22 -11 14 -14Z" fill="var(--sc-cowK)" style="${L}"/></g>`;
}
function pine(x, y, s){
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)})"><path d="M0 0 V-8" style="${L};stroke-width:4"/>
    <path d="M0 -62 L-15 -30 L15 -30Z M0 -44 L-19 -10 L19 -10Z" fill="var(--sc-pine)" style="${L}"/></g>`;
}
function walker(dir, kid){
  const h = kid ? 0.62 : 1; const C = 'stroke:var(--sc-ppl);stroke-linecap:round';
  return `<g class="sc-wk" transform="scale(${h})"><g class="sc-bob">
    <circle cx="0" cy="-42" r="6.4" fill="var(--sc-ppl)"/>
    <path d="M-6 -35 Q0 -38 6 -35 L5 -16 L-5 -16Z" fill="var(--sc-ppl)" style="stroke:var(--sc-ppl);stroke-width:2;stroke-linejoin:round"/>
    <g class="sc-leg a" style="transform-origin:0 -16px"><path d="M0 -16 L0 1" style="${C};stroke-width:4.4"/></g>
    <g class="sc-leg b" style="transform-origin:0 -16px"><path d="M0 -16 L0 1" style="${C};stroke-width:4.4"/></g>
    <g class="sc-leg b" style="transform-origin:0 -33px"><path d="M0 -33 L0 -18" style="${C};stroke-width:3.2"/></g>
    <g class="sc-leg a" style="transform-origin:0 -33px"><path d="M0 -33 L0 -18" style="${C};stroke-width:3.2"/></g></g></g>`;
}
function dog(){
  return `<g class="sc-wk"><g class="sc-bob fast"><path d="M-12 -12 Q-12 -19 -2 -19 L10 -19 Q15 -19 15 -13 L15 -9 L-11 -9Z" fill="var(--sc-ppl)"/>
    <path d="M13 -18 L21 -24 L24 -19 L21 -14 L14 -13Z" fill="var(--sc-ppl)"/>
    <path d="M-12 -17 Q-18 -23 -16 -27" style="stroke:var(--sc-ppl);stroke-width:2.6;fill:none;stroke-linecap:round" class="sc-tail"/>
    <g class="sc-leg a" style="transform-origin:-8px -9px"><path d="M-8 -9 V0" style="stroke:var(--sc-ppl);stroke-width:2.6;stroke-linecap:round"/></g>
    <g class="sc-leg b" style="transform-origin:10px -9px"><path d="M10 -9 V0" style="stroke:var(--sc-ppl);stroke-width:2.6;stroke-linecap:round"/></g>
    <g class="sc-leg b" style="transform-origin:-3px -9px"><path d="M-3 -9 V0" style="stroke:var(--sc-ppl);stroke-width:2.6;stroke-linecap:round"/></g>
    <g class="sc-leg a" style="transform-origin:5px -9px"><path d="M5 -9 V0" style="stroke:var(--sc-ppl);stroke-width:2.6;stroke-linecap:round"/></g></g></g>`;
}
/* un promeneur : va-et-vient sur la plage, se retourne au bout */
function walkRow(x0, span, y, s, dur, delay, parts){
  return `<g class="sc-mv sc-day" transform="translate(${x0} ${y}) scale(${s})"><g class="sc-go" style="--span:${span / s}px;--dur:${dur}s;animation-delay:-${delay}s"><g class="sc-turn" style="--dur:${dur}s;animation-delay:-${delay}s">${parts}</g></g></g>`;
}
function gull(x, y, s, dur, delay, dir){
  return `<g class="sc-mv sc-day" transform="translate(0 ${y})"><g class="sc-fly${dir < 0 ? ' rev' : ''}" style="--dur:${dur}s;animation-delay:-${delay}s"><g transform="translate(${x} 0) scale(${s})"><g class="sc-bob2">
    <g class="sc-flap"><path d="M-16 3 Q-8 -10 0 0 Q8 -10 16 3" fill="none" style="stroke:var(--sc-gull);stroke-width:6;stroke-linecap:round;stroke-linejoin:round"/><path d="M-16 3 Q-8 -10 0 0 Q8 -10 16 3" fill="none" style="stroke:var(--sc-line);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.85"/></g></g></g></g></g>`;
}
function cloud(topPct, scale, dur, delay, op){
  return `<svg class="sc-cloud" viewBox="0 0 200 80" style="top:${topPct}%;width:${f1(200 * scale)}px;animation-duration:${dur}s;animation-delay:-${delay}s;opacity:${op}" aria-hidden="true"><path d="M22 62 C4 62 4 38 26 38 C26 16 58 10 70 28 C82 6 120 8 124 32 C148 24 170 38 162 58 C178 58 182 72 162 72 L30 72 C14 72 10 64 22 62Z" fill="var(--sc-cloud)" style="stroke:var(--sc-line);stroke-width:1.6;stroke-linejoin:round;stroke-opacity:.35"/></svg>`;
}
function bird(x, y, s, d){ return `<g transform="translate(${x} ${y}) scale(${s})"><g class="sc-flap" style="animation-delay:${d}s"><path d="M-9 1 Q-4.5 -6 0 0 Q4.5 -6 9 1" fill="none" style="stroke:var(--sc-line);stroke-width:1.8;stroke-linecap:round;stroke-opacity:.75"/></g></g>`; }

function landSVG(){
  seed = 11;
  const trees = [];
  [[40,742,1.15],[78,736,.9],[112,748,1.3],[470,770,.95],[505,764,1.2],[545,772,.85],[590,784,1.05],[640,792,.8],[700,812,1.1],[745,820,.9],[790,832,.8],[560,700,.5],[610,708,.55],[236,664,.7],[262,660,.6]]
    .forEach(t => trees.push(pine(t[0], t[1], t[2] * 1.0)));
  const flowers = []; for (let i = 0; i < 46; i++) { const x = R(10, 900), y = R(790, 890); if (x > 800 && y < 830 + (x - 800) * .1) continue; const c = ['#F2C14E','#E57F5C','#FFFFFF','#E9A0B4'][Math.floor(R(0, 4))]; flowers.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R(2, 3.6))}" fill="${c}" style="stroke:var(--sc-line);stroke-width:.8;stroke-opacity:.5"/>`); }
  const tufts = []; for (let i = 0; i < 40; i++) { const x = R(0, 920), y = R(770, 900); tufts.push(`<path d="M${f1(x)} ${f1(y)} q2 -9 5 -12 M${f1(x)} ${f1(y)} q-1 -8 -4 -10" fill="none" style="${L};stroke-opacity:.5;stroke-width:1.4"/>`); }
  const stars = '';
  const ridge = 'M-2400 640 L-2400 500 L90 430 L150 470 L250 360 L330 440 L400 410 L520 500 L600 455 L700 330 L790 420 L850 380 L960 470 L1040 520 L1110 610 L1110 640Z';
  return `<svg id="sc-land" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax meet" style="overflow:visible" aria-hidden="true" focusable="false">
  <defs><linearGradient id="sc-bm" gradientUnits="userSpaceOnUse" x1="1528" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="#FFF3C0" stop-opacity=".42"/><stop offset="1" stop-color="#FFF3C0" stop-opacity="0"/></linearGradient><filter id="sc-wob" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="5"/></filter></defs>
  <g filter="url(#sc-wob)">
    <path d="${ridge}" fill="var(--sc-far)" style="${L}"/>
    <path d="M250 360 L222 396 L238 390 L250 408 L264 390 L282 398Z M700 330 L668 374 L684 366 L698 386 L712 366 L732 380Z M850 380 L830 404 L842 400 L852 410 L862 400 L874 406Z M150 470 L136 486 L148 482 L158 490Z" fill="var(--sc-snow)" style="${L};stroke-width:1.2"/>
    <path d="M300 430 L330 470 M690 400 L720 470 L700 520 M900 460 L930 500 M120 480 L100 530" fill="none" style="${L};stroke-width:1.2;stroke-opacity:.35"/>
    <path d="M880 600 H4200 V820 H880Z" fill="var(--sc-sea)"/>
    <path d="M880 600 H4200" fill="none" style="${L};stroke-width:1.4;stroke-opacity:.6"/>
    <path d="M-2400 700 L-2400 560 L80 520 L170 570 L260 530 L380 600 L470 560 L560 610 L660 560 L760 620 L860 590 L960 650 Q1040 690 1130 780 L1130 810Z" fill="var(--sc-near)" style="${L}"/>
    <g transform="translate(1528 604)"><ellipse cx="0" cy="2" rx="54" ry="13" fill="var(--sc-near)" style="${L}"/>
      <path d="M-11 0 L-8 -78 L8 -78 L11 0Z" fill="#FFFBF3" style="${L}"/><path d="M-9.8 -22 H9.8 L9 -36 H-9 Z M-8.6 -52 H8.6 L8 -64 H-8Z" fill="var(--sc-roof)"/>
      <rect x="-9" y="-92" width="18" height="14" rx="2" fill="#FFE9A6" style="${L}"/><path d="M-12 -92 L0 -104 L12 -92Z" fill="var(--sc-roof)" style="${L}"/></g>
    <path d="M-2400 899 H4200 V1900 H-2400Z" fill="var(--sc-near)"/><path d="M780 899 H4200 V1900 H780Z" fill="var(--sc-sand)"/>
    <path d="M780 900 L780 800 C 900 780 1090 762 1190 772 S 1470 764 4200 748 L4200 900Z" fill="var(--sc-sand)" style="${L};stroke-width:1.6"/>
    <path d="M900 880 C 1000 850 1150 840 1260 850 S 1500 846 4200 830" fill="none" style="${L};stroke-opacity:.18;stroke-width:1.4"/>
    <path d="M-2400 900 L-2400 690 C 150 640 300 650 450 690 S 700 706 900 770 L900 900Z" fill="var(--sc-hill2)" style="${L}"/>
    <path d="M-2400 900 L-2400 758 C 200 704 420 732 640 786 S 880 824 1010 880 L1010 900Z" fill="var(--sc-hill)" style="${L}"/>
    <path d="M60 790 C 200 770 330 790 470 840 M520 800 C 620 830 700 860 780 900" fill="none" style="${L};stroke-opacity:.22;stroke-width:1.6;stroke-dasharray:2 7"/>
    ${trees.join('')}
    <g transform="translate(330 664)"><path d="M-36 0 V-42 H36 V0Z" fill="var(--sc-wall)" style="${L}"/><path d="M-46 -40 L0 -80 L46 -40Z" fill="var(--sc-roof)" style="${L}"/>
      <rect x="18" y="-76" width="11" height="24" fill="var(--sc-wall)" style="${L}"/><rect x="-8" y="-24" width="16" height="24" fill="var(--sc-roof)" style="${L}" opacity=".85"/>
      <rect class="sc-win" x="-27" y="-34" width="12" height="12" rx="1.5" fill="#FFD27A" style="${L};stroke-width:1.4"/><rect class="sc-win" x="15" y="-34" width="12" height="12" rx="1.5" fill="#FFD27A" style="${L};stroke-width:1.4"/></g>
    <path d="M1020 872 L1030 856 L1036 872 M1060 880 L1066 862 L1072 880" fill="none" style="${L};stroke-width:1.4;stroke-opacity:.5"/>
    ${flowers.join('')}${tufts.join('')}
    <g transform="translate(1238 812)"><path d="M0 0 V-62" style="${L};stroke-width:3"/><path d="M-44 -58 Q0 -104 44 -58Z" fill="#E9684B" style="${L}"/><path d="M-15 -58 Q-6 -94 0 -91 Q6 -94 15 -58Z M16 -58 Q26 -88 30 -76 Q40 -66 44 -58Z" fill="#FFFBF3" style="stroke:none"/><path d="M-44 -58 Q0 -104 44 -58" fill="none" style="${L}"/></g>
    <path d="M1190 826 H1290 L1282 842 H1198Z" fill="#6FB6C8" style="${L}"/><path d="M1204 828 V840 M1218 828 V840 M1232 828 V840" style="${L};stroke-width:1;stroke:#FFFBF3"/>
    <g transform="translate(1394 826)"><path d="M-30 4 V-8 H-22 V-16 H-16 V-8 H-6 V-22 H0 V-8 H10 V-14 H16 V-8 H26 V4Z" fill="var(--sc-sand)" style="${L};stroke-width:1.5"/><path d="M-34 4 H30" style="${L}"/><path d="M0 -22 V-34 L10 -30 L0 -27" fill="#E9684B" style="${L};stroke-width:1.2"/></g>
  </g>
  <g class="sc-mv">${cow(150, 768, 1.1, 1, 0)}${cow(222, 794, 1.35, -1, 2.2)}${cow(86, 806, 1, 1, 4.1)}${sheep(540, 750, 1.05, 1)}${sheep(585, 762, .95, -1)}${sheep(695, 836, 1.25, 1)}</g>
  <g class="sc-mv sc-day"><g class="sc-smoke"><circle cx="353" cy="582" r="7"/><circle cx="353" cy="582" r="7" style="animation-delay:-2.2s"/><circle cx="353" cy="582" r="7" style="animation-delay:-4.4s"/></g></g>
  <g>${[0,1,2,3,4].map(i => `<path class="sc-wave" d="M${1010 + i * 24} ${626 + i * 34} q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" style="stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-opacity:${f1(.55 - i * .06)};animation-delay:-${i * 1.3}s"/>`).join('')}</g>
  <g class="sc-mv"><g transform="translate(1368 626)"><g class="sc-boat"><path d="M-30 0 H30 L20 12 H-20Z" fill="#FFFBF3" style="${L}"/><path d="M0 0 V-58" style="${L}"/><path d="M3 -56 L28 -6 H3Z" fill="#FFFBF3" style="${L}"/><path d="M-3 -48 L-22 -6 H-3Z" fill="var(--sc-roof)" style="${L}"/></g></g>
    <g transform="translate(1150 610) scale(.55)"><g class="sc-boat s2"><path d="M-30 0 H30 L20 12 H-20Z" fill="#FFFBF3" style="${L}"/><path d="M0 0 V-58" style="${L}"/><path d="M3 -56 L28 -6 H3Z" fill="#FFFBF3" style="${L}"/></g></g></g>
  <g class="sc-mv sc-day"><g class="sc-crab"><g transform="translate(1100 868)"><ellipse cx="0" cy="-6" rx="11" ry="7" fill="#E9684B" style="${L};stroke-width:1.4"/><path d="M-9 -9 q-8 -6 -4 -12 M9 -9 q8 -6 4 -12 M-9 -3 l-8 4 M9 -3 l8 4 M-6 0 l-5 6 M6 0 l5 6" fill="none" style="${L};stroke-width:1.4"/><circle cx="-4" cy="-12" r="1.6" fill="#fff"/><circle cx="4" cy="-12" r="1.6" fill="#fff"/></g></g></g>
  ${walkRow(980, 560, 818, 1.25, 46, 4, walker(1))}
  ${walkRow(1010, 560, 852, 1.7, 62, 22, walker(1) + `<g transform="translate(22 0)">${walker(1, true)}</g>`)}
  ${walkRow(1000, 520, 836, 1.15, 40, 13, walker(1) + `<g transform="translate(-40 0)">${dog()}</g>`)}
  ${gull(200, 330, 1.7, 70, 12, 1)}${gull(270, 365, 1.3, 70, 12.8, 1)}${gull(1000, 470, 2, 55, 30, -1)}${gull(700, 260, 1.2, 90, 40, 1)}${gull(1200, 560, 1.6, 48, 8, 1)}
  <g class="sc-night">${Array.from({length: 14}, (_, i) => `<circle class="sc-ff" cx="${f1(R(60, 700))}" cy="${f1(R(700, 850))}" r="2.6" style="animation-delay:-${f1(R(0, 9))}s;animation-duration:${f1(R(6, 11))}s"/>`).join('')}
    <path class="sc-beam" d="M1528 512 L1000 470 L1000 556Z" fill="url(#sc-bm)"/></g>
  </svg>`;
}
function skySVG(){
  seed = 29;
  let stars = ''; for (let i = 0; i < 70; i++) { const big = rnd() > .86; stars += `<i style="left:${f1(R(1, 99))}%;top:${f1(R(2, 58))}%;width:${big ? 3.4 : 2}px;height:${big ? 3.4 : 2}px;animation-delay:-${f1(R(0, 6))}s;animation-duration:${f1(R(3, 7))}s"></i>`; }
  const sunSVG = `<svg viewBox="-60 -60 120 120" width="116" height="116" aria-hidden="true"><g class="sc-rays" style="stroke:var(--sc-line);stroke-width:2.6;stroke-linecap:round;stroke-opacity:.8">${Array.from({length: 12}, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${f1(Math.cos(a) * 36)} ${f1(Math.sin(a) * 36)} L${f1(Math.cos(a) * (i % 2 ? 46 : 54))} ${f1(Math.sin(a) * (i % 2 ? 46 : 54))}" style="stroke:var(--sc-sun)"/>`; }).join('')}</g><circle r="28" fill="var(--sc-sun)" style="stroke:var(--sc-line);stroke-width:2;stroke-opacity:.7"/></svg>`;
  const moonSVG = `<svg viewBox="0 0 80 80" width="82" height="82" aria-hidden="true"><path d="M48 6 A34 34 0 1 0 74 52 A27 27 0 1 1 48 6Z" fill="#FFF1C2" style="stroke:var(--sc-line);stroke-width:2;stroke-opacity:.75;stroke-linejoin:round"/><circle cx="28" cy="46" r="3" fill="#E9D79B" opacity=".7"/><circle cx="40" cy="58" r="2" fill="#E9D79B" opacity=".7"/></svg>`;
  const flock = `<div class="sc-mv sc-day sc-flock"><svg viewBox="0 0 120 60" width="120" height="60" aria-hidden="true">${bird(60, 10, 1.2, 0)}${bird(42, 22, 1, .2)}${bird(78, 22, 1, .35)}${bird(24, 34, .9, .5)}${bird(96, 34, .9, .1)}</svg></div>`;
  const balloon = `<div class="sc-mv sc-day sc-balloon"><svg viewBox="0 0 70 100" width="64" height="92" aria-hidden="true"><path d="M35 4 C10 4 4 30 14 48 C20 58 26 62 28 66 H42 C44 62 50 58 56 48 C66 30 60 4 35 4Z" fill="#E9684B" style="${L}"/><path d="M35 4 C24 14 22 50 28 66 H42 C48 50 46 14 35 4Z" fill="#F2C14E" style="${L};stroke-width:1.4"/><path d="M28 66 L31 82 H39 L42 66" fill="none" style="${L}"/><rect x="30" y="82" width="10" height="8" rx="1.5" fill="#8A5A3C" style="${L};stroke-width:1.4"/></svg></div>`;
  return `<div id="sc-sky" aria-hidden="true"><div class="sc-stars">${stars}</div><div class="sc-glow" id="sc-glow"></div><div class="sc-sun" id="sc-sun">${sunSVG}</div><div class="sc-moon" id="sc-moon">${moonSVG}</div>
    ${cloud(9, 1.15, 210, 40, .85)}${cloud(20, .8, 260, 150, .7)}${cloud(30, 1.4, 320, 90, .75)}${cloud(14, .6, 180, 10, .6)}${cloud(40, .9, 290, 200, .6)}${flock}${balloon}</div>`;
}

const CSS = `
#scene{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;background:linear-gradient(180deg,var(--sc-top) 0%,var(--sc-mid) 48%,var(--sc-bot) 100%)}
#scene::after{content:"";position:absolute;inset:0;opacity:.07;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .15 0 0 0 1.4 -.4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")}
html[data-scene="off"] #scene{display:none}
html[data-scene="on"]{background:linear-gradient(180deg,var(--sc-top) 0,var(--sc-top) 120px,var(--sc-mid) 50%,var(--sc-near) calc(100% - 120px),var(--sc-near) 100%) var(--sc-mid)}html[data-scene="on"] body{background:transparent}
#sc-sky{position:absolute;inset:0;width:100%;height:100%}
#sc-land{position:absolute;bottom:0;left:0;overflow:visible}
#sc-sun,#sc-moon,.sc-glow{position:absolute;left:0;top:0;will-change:transform}
#sc-sun{width:116px;height:116px;margin:-58px 0 0 -58px}#sc-moon{width:82px;height:82px;margin:-41px 0 0 -41px}
.sc-glow{width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;background:radial-gradient(closest-side,var(--sc-sun),transparent);opacity:.32}
.sc-rays{transform-origin:0 0;animation:sc-spin 90s linear infinite}
.sc-stars{position:absolute;inset:0;opacity:var(--sc-night,0);transition:opacity 1.2s ease}
.sc-stars i{position:absolute;border-radius:50%;background:var(--sc-star);animation:sc-tw 4s ease-in-out infinite}
.sc-cloud{position:absolute;left:0;height:auto;animation:sc-drift 240s linear infinite;will-change:transform}
.sc-flock{position:absolute;left:0;top:17%;animation:sc-drift 120s linear infinite}
.sc-balloon{position:absolute;left:0;top:30%;animation:sc-drift 520s linear infinite;animation-delay:-180s}.sc-balloon svg{animation:sc-bobb 7s ease-in-out infinite;transform-origin:50% 0}
.sc-day{opacity:calc(1 - var(--sc-night,0));transition:opacity 1.2s ease}
.sc-night{opacity:var(--sc-night,0);transition:opacity 1.2s ease}
.sc-win{opacity:calc(.25 + var(--sc-night,0) * .75)}
.sc-flap{animation:sc-flap .55s ease-in-out infinite alternate;transform-origin:0 0}
.sc-fly{animation:sc-fly var(--dur) linear infinite}.sc-fly.rev{animation-name:sc-flyr}
.sc-bob2{animation:sc-bobb 3s ease-in-out infinite}
.sc-go{animation:sc-go var(--dur) ease-in-out infinite alternate}
.sc-turn{animation:sc-turn calc(var(--dur) * 2) steps(1,end) infinite}
.sc-leg{animation:sc-leg .9s ease-in-out infinite alternate}.sc-leg.b{animation-direction:alternate-reverse}
.sc-bob{animation:sc-step .45s ease-in-out infinite alternate}.sc-bob.fast{animation-duration:.3s}
.sc-tail{animation:sc-wag .25s ease-in-out infinite alternate;transform-origin:-12px -17px}
.sc-head{animation:sc-graze 7s ease-in-out infinite;transform-origin:22px -30px}
.sc-wave{animation:sc-wave 7s ease-in-out infinite alternate}
.sc-boat{animation:sc-rock 5s ease-in-out infinite alternate;transform-origin:0 12px}.sc-boat.s2{animation-delay:-2s}
.sc-crab{animation:sc-crab 9s ease-in-out infinite alternate}
.sc-smoke circle{fill:var(--sc-cloud);transform-box:fill-box;transform-origin:center;opacity:0;animation:sc-smoke 6.6s ease-out infinite}
.sc-ff{fill:#FFE98A;animation:sc-ff 8s ease-in-out infinite alternate}
.sc-beam{transform-origin:1528px 512px;animation:sc-beam 7s ease-in-out infinite alternate}
@keyframes sc-spin{to{transform:rotate(360deg)}}
@keyframes sc-tw{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes sc-drift{from{transform:translate3d(-320px,0,0)}to{transform:translate3d(calc(100vw + 60px),0,0)}}
@keyframes sc-bobb{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes sc-flap{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@keyframes sc-fly{from{transform:translateX(-300px)}to{transform:translateX(1900px)}}
@keyframes sc-flyr{from{transform:translateX(1900px) scaleX(-1)}to{transform:translateX(-300px) scaleX(-1)}}
@keyframes sc-go{from{transform:translateX(0)}to{transform:translateX(var(--span))}}
@keyframes sc-turn{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
@keyframes sc-leg{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
@keyframes sc-step{from{transform:translateY(0)}to{transform:translateY(-2.2px)}}
@keyframes sc-wag{from{transform:rotate(-14deg)}to{transform:rotate(18deg)}}
@keyframes sc-graze{0%,35%{transform:rotate(0)}50%,85%{transform:rotate(22deg)}100%{transform:rotate(0)}}
@keyframes sc-wave{from{transform:translateX(-26px)}to{transform:translateX(26px)}}
@keyframes sc-rock{from{transform:rotate(-2.5deg) translateY(0)}to{transform:rotate(2.5deg) translateY(-3px)}}
@keyframes sc-crab{0%{transform:translateX(-50px)}45%{transform:translateX(50px)}55%{transform:translateX(50px)}100%{transform:translateX(-50px)}}
@keyframes sc-smoke{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.7}100%{opacity:0;transform:translate(26px,-70px) scale(2.6)}}
@keyframes sc-ff{from{transform:translate(0,0);opacity:.2}50%{opacity:1}to{transform:translate(26px,-30px);opacity:.3}}
@keyframes sc-beam{from{transform:rotate(-4deg)}to{transform:rotate(4deg) scaleY(1.25)}}
html[data-motion="off"] #scene *{animation:none!important}
html[data-motion="off"] #scene .sc-mv{display:none}
html[data-motion="off"] #scene .sc-cloud{transform:translate3d(18vw,0,0)}
html[data-motion="off"] #scene .sc-stars i{opacity:.8}
@media (max-width:700px){#scene .sc-balloon,#scene .sc-flock{display:none}}
`;

/* ---------- Mise à jour du ciel ---------- */
let el = null, sunEl, moonEl, glowEl, landEl, lastGeo = '';
function geometry(){
  const w = innerWidth, h = innerHeight;
  const s = Math.min(w / 1600, (h * 0.62) / 620);      /* échelle du paysage : au moins 620 unités de haut visibles */
  if (landEl) { landEl.style.width = (1600 * s) + 'px'; landEl.style.height = (900 * s) + 'px'; landEl.style.left = ((w - 1600 * s) / 2) + 'px'; }
  const horizon = h - (900 - 604) * s;  /* ligne d'horizon de la mer */
  return {w, h, horizon};
}
function update(){
  if (!el) return;
  const h = hourNow(); const dark = darkNow();
  const p = paletteAt(dark ? DARK : LIGHT, h);
  const n = nightAt(h);
  K.forEach(k => root.style.setProperty('--sc-' + k, p[k]));
  root.style.setProperty('--sc-night', n.toFixed(3));
  const g = geometry();
  const topY = g.h * 0.1, span = Math.max(40, g.horizon - topY);
  let t, body;
  if (h >= SUNRISE && h <= SUNSET) { t = (h - SUNRISE) / (SUNSET - SUNRISE); body = 'sun'; }
  else { const u = h >= SUNSET ? h - SUNSET : h + 24 - SUNSET; t = u / (24 - SUNSET + SUNRISE); body = 'moon'; }
  const x = g.w * (0.09 + 0.82 * t), y = g.horizon - Math.sin(Math.PI * t) * span + (body === 'sun' ? 8 : 20);
  const low = 1 - Math.sin(Math.PI * t);               /* 1 près de l'horizon */
  if (body === 'sun') {
    sunEl.style.display = ''; moonEl.style.display = 'none';
    sunEl.style.transform = `translate3d(${x}px,${y}px,0)`;
    glowEl.style.transform = `translate3d(${x}px,${y}px,0)`; glowEl.style.opacity = (.3 + low * .12).toFixed(2);
    root.style.setProperty('--sc-sun', mix(p.sun, '#FF7A45', low * 0.55));
  } else {
    sunEl.style.display = 'none'; moonEl.style.display = '';
    moonEl.style.transform = `translate3d(${x}px,${y}px,0)`;
    glowEl.style.transform = `translate3d(${x}px,${y}px,0)`; glowEl.style.opacity = (dark ? .16 : .1).toFixed(2);
    root.style.setProperty('--sc-sun', '#FFF1C2');
  }
  let tc = document.querySelector('meta[name=theme-color]'); if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.append(tc); } tc.content = p.top;
  root.dataset.sky = n > 0.55 ? 'night' : (h < 9 || h > 18 ? 'dusk' : 'day');
}

function applyScene(){
  const on = get('gite-scene') !== 'off';
  root.dataset.scene = on ? 'on' : 'off';
  if (on && !el) build();
  if (on) update();
}
function build(){
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  el = document.createElement('div'); el.id = 'scene'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = skySVG() + landSVG();
  document.body.prepend(el);
  sunEl = el.querySelector('#sc-sun'); moonEl = el.querySelector('#sc-moon'); glowEl = el.querySelector('#sc-glow'); landEl = el.querySelector('#sc-land');
  let rz = 0; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(update); });
  setInterval(() => { if (!document.hidden) { if ((get('gite-theme') || 'time') === 'time') applyTheme(); update(); } }, 60000);
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(update); }
}

window.GiteScene = {
  /* à appeler après avoir changé un réglage (gite-scene ou gite-theme) */
  refresh(){ applyTheme(); applyScene(); },
  hour: hourNow
};
applyTheme();
const boot = () => applyScene();
if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
