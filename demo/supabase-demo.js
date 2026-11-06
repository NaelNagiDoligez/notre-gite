/* Faux supabase-js pour faire tourner le site hors ligne avec des données fictives (démonstration, captures, vidéo).
   Aucune donnée réelle, aucune connexion à la vraie base. Réglages dans l'adresse :
   ?sc=full|partial|empty|closed|login   scénario (full = carnet complet, partial = il reste des logements à noter,
                                          empty = carnet vide, closed = votes clos, login = écran de connexion)
   ?h=21                                 heure forcée pour le décor (0 à 24 : 21 = soir, 14 = plein jour)
   ?pend=1                               écran « en attente de validation »
   ?slow=800                             ralentit le chargement (en ms) */
(function(){
  const q = new URLSearchParams(location.search); const sc = q.get('sc') || 'full';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rint = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const ME = 'u1';
  const names = {u1:'Alex', u2:'Léa', u3:'Jean-Marc', u4:'Camille', u5:'Sofia', u6:'Hugo'};
  const L = [
    ['Mas provençal avec piscine', 'Gordes', '84', 2150, 10, 5], ['Longère bretonne vue mer', 'Plougrescant', '22', 1890, 9, 4],
    ['Gîte du Périgord Noir', 'Sarlat-la-Canéda', '24', 1640, 10, 5], ['Villa des calanques', 'Cassis', '13', 2890, 8, 4],
    ['Chalet des Pyrénées', 'Cauterets', '65', 1490, 8, 3], ['Maison de pêcheur', 'Quiberon', '56', 2210, 9, 4],
    ['Domaine viticole', 'Saint-Émilion', '33', 2480, 12, 6], ['Ferme ardéchoise', 'Vallon-Pont-d’Arc', '07', 1350, 10, 5],
    ['Bastide cévenole', 'Anduze', '30', 1720, 10, 5]
  ];
  const rows = {};
  const put = (p, d) => { rows[p] = d; };
  const now = Date.now();
  put('config/main', sc === 'closed' ? {closed:true, closedAt:now - 3600e3, title:"Notre gîte d'été"} : {title:"Notre gîte d'été"});
  put('trip/main', {destination:'Ardèche et alentours', periode:'Dates à définir', budget:'Autour de 2 000 €'});
  Object.keys(names).forEach((u, i) => put('members/' + u, {name:names[u], joinedAt:now - (i + 3) * 86400e3, seenAt:now - 86400e3}));
  const listings = sc === 'empty' ? [] : L;
  listings.forEach((l, i) => put('listings/l' + (i + 1), {title:l[0], commune:l[1], dept:l[2], price:l[3], beds:l[4], bedrooms:l[5], equipments:['Piscine', 'Wifi', 'Barbecue', 'Lave-vaisselle', 'Jardin'].slice(0, 2 + (i % 4)), status:['propose', 'discussion', 'preselection', 'reserve'][i % 4], addedBy:names[ME] && ['u1', 'u2', 'u3'][i % 3], createdAt:now - (20 - i) * 3600e3, photo:i === 8 ? null : 'u1/p' + (i + 1) + '.jpg', url:'https://example.com/annonce/' + (i + 1)}));
  const crit = ['prix', 'lieu', 'confort', 'ambiance', 'couchages', 'activites'];
  Object.keys(names).forEach(u => {
    const v = {scores:{}, heart:null, veto:null, avail:{}, updatedAt:now - 7200e3};
    listings.forEach((l, i) => {
      if (sc === 'partial' && u === ME && i >= 6) return;
      const base = 5 + (i * 7 % 4) + (i === 2 ? 2 : 0); const s = {};
      crit.forEach(c => { s[c] = Math.max(1, Math.min(10, base + rint(-1, 2))); });
      v.scores['l' + (i + 1)] = s;
    });
    put('votes/' + u, v);
  });
  if (listings.length) { put('votes/u2', Object.assign(rows['votes/u2'], {heart:'l3', heartWhy:'Le calme et la rivière', veto:'l4'})); put('votes/u3', Object.assign(rows['votes/u3'], {heart:'l3', veto:'l5'})); put('votes/u4', Object.assign(rows['votes/u4'], {heart:'l1'})); }
  if (listings.length) { put('comments/c1', {lid:'l3', by:'u2', text:'On y était il y a deux ans, très calme !', at:now - 5400e3}); }
  const colOf = p => p.split('/').slice(0, -1).join('/');
  const art = id => { const h = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7); const hue = Math.abs(h) % 360;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,78%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},80%,92%)"/></linearGradient></defs><rect width="400" height="260" fill="url(#s)"/><circle cx="300" cy="70" r="30" fill="hsl(${(hue + 180) % 360},90%,70%)"/><path d="M0 200 Q100 120 200 190 T400 170 V260 H0Z" fill="hsl(${(hue + 100) % 360},40%,40%)"/><rect x="150" y="150" width="90" height="60" fill="#fffbf3"/><path d="M140 152 L195 110 L250 152Z" fill="hsl(${hue},60%,35%)"/></svg>`); };
  class B {
    constructor(table){ this.table = table; this.f = {}; this.cols = ''; this.op = 'select'; this.payload = null; }
    select(c){ this.cols = c; return this; }
    eq(k, v){ this.f[k] = v; return this; }
    maybeSingle(){ return this.run(true); }
    upsert(d){ this.op = 'upsert'; this.payload = d; return this.run(); }
    delete(){ this.op = 'delete'; return this; }
    then(a, b){ return this.run().then(a, b); }
    run(single){
      return new Promise(res => setTimeout(() => {
        if ((this.table === 'admins' || this.table === 'approved') && location.search.includes('pend=1')) return res({data:null, error:null});
        if (this.table === 'admins') return res({data:single ? {user_id:ME} : [{user_id:ME}], error:null});
        if (this.op === 'upsert') { rows[this.payload.path] = this.payload.data; return res({data:null, error:null}); }
        if (this.op === 'delete') { delete rows[this.f.path]; return res({data:null, error:null}); }
        if (this.f.path !== undefined) { const d = rows[this.f.path]; return res({data:d === undefined ? null : {data:d}, error:null}); }
        const c = this.f.collection; const data = Object.keys(rows).filter(p => colOf(p) === c).map(p => ({path:p, data:rows[p]}));
        const delay = ({members:20, votes:90, listings:50, comments:130}[c] || 10) + (+new URLSearchParams(location.search).get('slow') || 0);
        setTimeout(() => res({data, error:null}), delay);
      }, 15));
    }
  }
  const session = {user:{id:ME, email:'alex@notre-gite.example.com', user_metadata:{prenom:'Alex'}}};
  window.__rows = rows;
  window.supabase = {createClient(){
    return {
      auth:{ getSession: async () => ({data:{session: sc === 'login' ? null : session}}),
             signInWithOAuth: async () => { await new Promise(r => setTimeout(r, 700)); const u = new URL(location.href); u.searchParams.set('sc', 'full'); location.href = u.toString(); return {data:{}, error:null}; },
             signInWithPassword: async () => { await new Promise(r => setTimeout(r, 300)); return {data:{session}, error:null}; } },
      from: t => new B(t),
      rpc: async (fn, a) => { await new Promise(r => setTimeout(r, 15)); if (window.__offline) return {data:null, error:{message:'TypeError: Failed to fetch'}};
        if (fn === 'patch_doc') { if (!(a.p in rows)) return {data:null, error:null}; rows[a.p] = Object.assign({}, rows[a.p], a.patch); return {data:rows[a.p], error:null}; }
        return {data:null, error:null}; },
      channel: () => ({on(){ return this; }, subscribe(){ return this; }}),
      storage:{from:() => ({getPublicUrl: id => ({data:{publicUrl:art(id)}}), upload: async () => ({error:null}), remove: async () => ({})})}
    };
  }};
})();
