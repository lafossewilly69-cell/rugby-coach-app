/* eslint-disable */
import { useEffect, useRef, useState, CSSProperties } from 'react';
import jsPDF from 'jspdf';
import { useClub, texteSur, Club } from './club';
import { IC } from './icones';
import { dessinerTerrain, dessinerElement, DIM_TERRAIN } from './Terrain';

const LW = 1800;
const LH = 1200;
const NIVEAUX = ['Débutants', 'Intermédiaires', 'Confirmés', 'Situation réelle'];
const TITRE = "'Barlow Condensed','Arial Narrow',sans-serif";
const CORPS = "'Barlow',system-ui,sans-serif";

type Ctx = CanvasRenderingContext2D;
type Opts = { club: Club; seance: any; exercice: any; schema: any };
type St = { texte: string; prim: string; numTexte: string; checkFond: string; checkTrait: string };
type Bloc = (x: number, w: number, y: number, hm: number) => number;

const rgbDe = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const p = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(p, 16);
  return isNaN(n) ? [15, 47, 102] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const assombrir = (hex: string, k: number) => {
  const [r, g, b] = rgbDe(hex);
  const m = (c: number) => Math.round(c * (1 - k));
  return '#' + [m(r), m(g), m(b)].map(c => c.toString(16).padStart(2, '0')).join('');
};
const hexA = (hex: string, a: number) => {
  const [r, g, b] = rgbDe(hex);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};
const lignesDe = (t?: string): string[] => (t || '').split('\n').map(s => s.trim()).filter(Boolean);

function wrap(ctx: Ctx, texte: string, max: number): string[] {
  const mots = texte.split(/\s+/);
  const out: string[] = [];
  let cur = '';
  mots.forEach(m => {
    const t = cur ? cur + ' ' + m : m;
    if (ctx.measureText(t).width > max && cur) { out.push(cur); cur = m; } else { cur = t; }
  });
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function coche(ctx: Ctx, cx: number, cy: number, r: number, fond: string, trait: string) {
  ctx.fillStyle = fond;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = trait; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.stroke();
}

function liste(ctx: Ctx, items: string[], type: 'para' | 'point' | 'num' | 'check', x: number, y: number, w: number, k: number, d: boolean, st: St): number {
  const fs = 28 * k;
  const lh = fs * 1.32;
  const ind = type === 'para' ? 0 : 50 * k;
  const px = 24 * k;
  const police = '400 ' + fs + 'px ' + CORPS;
  ctx.font = police;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let cy = y + 16 * k;
  items.forEach((it, i) => {
    const lines = wrap(ctx, it, w - 2 * px - ind);
    if (d) {
      const mx = x + px;
      const my = cy + lh / 2;
      if (type === 'point') {
        ctx.fillStyle = st.prim;
        ctx.beginPath(); ctx.arc(mx + 9 * k, my, 6.5 * k, 0, Math.PI * 2); ctx.fill();
      }
      if (type === 'num') {
        ctx.fillStyle = st.prim;
        ctx.beginPath(); ctx.arc(mx + 19 * k, my, 19 * k, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = st.numTexte;
        ctx.font = '700 ' + fs * 0.85 + 'px ' + CORPS;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), mx + 19 * k, my + k);
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = police;
      }
      if (type === 'check') coche(ctx, mx + 19 * k, my, 17 * k, st.checkFond, st.checkTrait);
      ctx.fillStyle = st.texte;
      lines.forEach((l, j) => ctx.fillText(l, mx + ind, cy + j * lh));
    }
    cy += lines.length * lh + 12 * k;
  });
  return cy - y + 6 * k;
}

function boite(ctx: Ctx, x: number, y: number, w: number, titre: string, k: number, c: { prim: string; acc: string }, hMin: number, sombre: boolean, corps: (d: boolean, cx: number, cy: number, cw: number) => number): number {
  const hb = sombre ? 58 * k : 64 * k;
  const hc = corps(false, x, y + hb, w);
  const h = Math.max(hb + hc + 8 * k, hMin);
  ctx.save();
  rr(ctx, x, y, w, h, 18 * k);
  ctx.fillStyle = sombre ? assombrir(c.prim, 0.62) : '#ffffff';
  ctx.fill();
  if (!sombre) { ctx.lineWidth = 2; ctx.strokeStyle = hexA(c.prim, 0.35); ctx.stroke(); }
  ctx.save();
  rr(ctx, x, y, w, h, 18 * k);
  ctx.clip();
  if (!sombre) { ctx.fillStyle = c.prim; ctx.fillRect(x, y, w, hb); }
  ctx.restore();
  ctx.fillStyle = sombre ? c.acc : texteSur(c.prim);
  ctx.font = 'italic 700 ' + 38 * k + 'px ' + TITRE;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(titre, x + 24 * k, y + hb / 2 + 2 * k);
  ctx.restore();
  corps(true, x, y + hb, w);
  return h;
}

function dessinerFleches(ctx: Ctx, fleches: any[], elements: any[]) {
  fleches.forEach((f: any) => {
    const bal = !!f.estBallon || elements.some((e: any) => e.id === f.cibleId && e.type === 'ballon');
    const col = bal ? '#ff9800' : '#ffeb3b';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
    const a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(f.x2, f.y2);
    ctx.lineTo(f.x2 - 12 * Math.cos(a - 0.4), f.y2 - 12 * Math.sin(a - 0.4));
    ctx.lineTo(f.x2 - 12 * Math.cos(a + 0.4), f.y2 - 12 * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
    const mx = f.x1 * 0.3 + f.x2 * 0.7;
    const my = f.y1 * 0.3 + f.y2 * 0.7;
    ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.fillStyle = bal ? '#e67e22' : '#b7950b'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(f.ordre), mx, my);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function schemaCanvas(schema: any): HTMLCanvasElement | null {
  if (!schema) return null;
  const { W, H } = DIM_TERRAIN;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  dessinerTerrain(ctx);
  dessinerFleches(ctx, schema.fleches || [], schema.elements || []);
  (schema.elements || []).forEach((el: any) => dessinerElement(ctx, el));
  return c;
}

const chargerImage = (src: string): Promise<HTMLImageElement | null> => new Promise(res => {
  if (!src) { res(null); return; }
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => res(null);
  im.src = src;
});

function rendre(cv: HTMLCanvasElement, o: Opts, logo: HTMLImageElement | null, ban: HTMLImageElement | null, sch: HTMLCanvasElement | null, k: number): number {
  const ctx = cv.getContext('2d');
  if (!ctx) return 0;
  const { club, seance, exercice: ex } = o;
  const prim = club.couleur;
  const acc = club.couleur2;
  const surPrim = texteSur(prim);
  const M = 36, G = 26, HB = 200;
  const bas = LH - M;
  ctx.clearRect(0, 0, LW, LH);
  ctx.fillStyle = '#f1f3f6';
  ctx.fillRect(0, 0, LW, LH);

  // Bandeau
  if (ban) {
    const s = Math.max(LW / ban.width, HB / ban.height);
    const dw = ban.width * s, dh = ban.height * s;
    ctx.drawImage(ban, (LW - dw) / 2, (HB - dh) / 2, dw, dh);
    const g = ctx.createLinearGradient(0, 0, LW, 0);
    g.addColorStop(0, hexA(prim, 0.95)); g.addColorStop(0.6, hexA(prim, 0.78)); g.addColorStop(1, hexA(prim, 0.55));
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, HB);
  } else {
    const g = ctx.createLinearGradient(0, 0, LW, HB);
    g.addColorStop(0, assombrir(prim, 0.35)); g.addColorStop(1, prim);
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, HB);
  }
  ctx.fillStyle = acc;
  ctx.fillRect(0, HB - 8, LW, 8);

  // Emblème
  const E = 150, ex0 = M, ey0 = (HB - 8 - E) / 2;
  rr(ctx, ex0, ey0, E, E, 34);
  ctx.fillStyle = logo ? '#ffffff' : 'rgba(255,255,255,0.18)';
  ctx.fill();
  if (logo) {
    const s = Math.min((E - 24) / logo.width, (E - 24) / logo.height);
    const w = logo.width * s, h = logo.height * s;
    ctx.drawImage(logo, ex0 + (E - w) / 2, ey0 + (E - h) / 2, w, h);
  } else {
    const ini = club.nom.trim().split(/\s+/).slice(0, 2).map(m => m.charAt(0).toUpperCase()).join('') || 'RC';
    ctx.fillStyle = surPrim; ctx.font = '700 70px ' + TITRE;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ini, ex0 + E / 2, ey0 + E / 2 + 3);
  }

  // Titre, sous-titre, devise
  const devise = (club.devise || '').trim();
  const wDev = devise ? 400 : 0;
  const xT = ex0 + E + 40;
  const maxT = LW - M - wDev - (devise ? 40 : 0) - xT;
  const titre = (ex.titre || 'Exercice').toUpperCase();
  let ts = 108;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  while (ts > 48) {
    ctx.font = 'italic 700 ' + ts + 'px ' + TITRE;
    if (ctx.measureText(titre).width <= maxT) break;
    ts -= 4;
  }
  ctx.fillStyle = surPrim;
  ctx.fillText(titre, xT, 100);
  ctx.font = '600 42px ' + CORPS;
  const sous = (ex.sousTitre || '').trim() || (seance.categorie + ' ' + seance.genre + ' · ' + ex.duree + ' min');
  ctx.fillText(sous, xT, 152);
  if (devise) {
    ctx.font = 'italic 600 46px ' + CORPS;
    const ls = wrap(ctx, devise, wDev).slice(0, 3);
    const lh = 56;
    const y0 = (HB - 8) / 2 - (ls.length * lh) / 2 + lh * 0.8 - 8;
    ctx.textAlign = 'right'; ctx.fillStyle = surPrim;
    ls.forEach((l, i) => ctx.fillText(l, LW - M, y0 + i * lh));
    const yb = y0 + (ls.length - 1) * lh + 24;
    ctx.strokeStyle = acc; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(LW - M - wDev * 0.8, yb + 4); ctx.lineTo(LW - M, yb - 6); ctx.stroke();
    ctx.textAlign = 'left';
  }

  // Contenu
  const objectif = lignesDe((ex.objectif || '').trim() || (ex.description || '').trim());
  const materiel = lignesDe(ex.materiel);
  const consignes = lignesDe(ex.consignes);
  const attendus = lignesDe(ex.attendus).length ? lignesDe(ex.attendus) : lignesDe(seance.comportementAttendu);
  const points = lignesDe(ex.pointsCles);
  const evo = [0, 1, 2, 3].map(i => lignesDe((ex.evolutions || [])[i]));
  const idx = [0, 1, 2, 3].filter(i => evo[i].length > 0);

  const coul = { prim, acc };
  const stNormal: St = { texte: '#1c2530', prim, numTexte: surPrim, checkFond: '#2e9e5b', checkTrait: '#ffffff' };
  const stSombre: St = { texte: '#ffffff', prim: acc, numTexte: texteSur(acc), checkFond: acc, checkTrait: assombrir(prim, 0.7) };

  const L: Bloc[] = [], Mi: Bloc[] = [], R: Bloc[] = [];
  if (objectif.length) L.push((x, w, y, hm) => boite(ctx, x, y, w, 'Objectif', k, coul, hm, false, (d, cx, cy, cw) => liste(ctx, objectif, 'para', cx, cy, cw, k, d, stNormal)));
  if (materiel.length) L.push((x, w, y, hm) => boite(ctx, x, y, w, 'Matériel', k, coul, hm, false, (d, cx, cy, cw) => liste(ctx, materiel, 'point', cx, cy, cw, k, d, stNormal)));
  if (sch) L.push((x, w, y, hm) => {
    const hc = Math.max(220 * k, hm - 72 * k);
    return boite(ctx, x, y, w, 'Schéma de principe', k, coul, hm, false, (d, cx, cy, cw) => {
      if (d) {
        const s = Math.min((cw - 30 * k) / DIM_TERRAIN.W, (hc - 24 * k) / DIM_TERRAIN.H);
        const iw = DIM_TERRAIN.W * s, ih = DIM_TERRAIN.H * s;
        const ix = cx + (cw - iw) / 2, iy = cy + (hc - ih) / 2;
        ctx.save(); rr(ctx, ix, iy, iw, ih, 14 * k); ctx.clip(); ctx.drawImage(sch, ix, iy, iw, ih); ctx.restore();
        rr(ctx, ix, iy, iw, ih, 14 * k); ctx.lineWidth = 2; ctx.strokeStyle = hexA(prim, 0.5); ctx.stroke();
      }
      return hc;
    });
  });
  if (consignes.length) Mi.push((x, w, y, hm) => boite(ctx, x, y, w, 'Consignes', k, coul, hm, false, (d, cx, cy, cw) => liste(ctx, consignes, 'num', cx, cy, cw, k, d, stNormal)));
  if (idx.length) Mi.push((x, w, y, hm) => boite(ctx, x, y, w, 'Évolution', k, coul, hm, false, (d, cx, cy, cw) => {
    const cwi = cw / 2;
    let yy = cy;
    for (let r = 0; r < idx.length; r += 2) {
      let hr = 0;
      for (let col = 0; col < 2; col++) {
        const i = idx[r + col];
        if (i === undefined) continue;
        const lx = cx + col * cwi;
        if (d) {
          ctx.fillStyle = prim; ctx.font = '600 ' + 28 * k + 'px ' + CORPS;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(NIVEAUX[i], lx + 24 * k, yy + 14 * k);
        }
        const h = 32 * k + liste(ctx, evo[i], 'point', lx, yy + 32 * k, cwi, k * 0.9, d, stNormal);
        hr = Math.max(hr, h);
      }
      yy += hr;
    }
    return yy - cy + 8 * k;
  }));
  if (attendus.length) R.push((x, w, y, hm) => boite(ctx, x, y, w, 'Les attendus', k, coul, hm, false, (d, cx, cy, cw) => liste(ctx, attendus, 'check', cx, cy, cw, k, d, stNormal)));
  if (points.length) R.push((x, w, y, hm) => boite(ctx, x, y, w, 'Points clés', k, coul, hm, true, (d, cx, cy, cw) => liste(ctx, points, 'check', cx, cy, cw, k, d, stSombre)));

  const cols = [{ base: 560, blocs: L }, { base: 690, blocs: Mi }, { base: 426, blocs: R }].filter(c => c.blocs.length > 0);
  if (!cols.length) return 0;
  const total = LW - 2 * M - (cols.length - 1) * G;
  const somme = cols.reduce((s, c) => s + c.base, 0);
  let x = M;
  let bottomMax = 0;
  cols.forEach(col => {
    const w = (total * col.base) / somme;
    let y = HB + G;
    col.blocs.forEach((b, i) => {
      const dernier = i === col.blocs.length - 1;
      const h = b(x, w, y, dernier ? Math.max(0, bas - y) : 0);
      y += h + G;
    });
    bottomMax = Math.max(bottomMax, y - G);
    x += w + G;
  });
  return bottomMax;
}

async function construireFiche(o: Opts): Promise<HTMLCanvasElement> {
  try {
    const f = (document as any).fonts;
    if (f && f.load) {
      await Promise.all([
        f.load("italic 700 60px 'Barlow Condensed'"), f.load("700 60px 'Barlow Condensed'"),
        f.load("400 30px 'Barlow'"), f.load("600 30px 'Barlow'"),
      ]);
    }
  } catch (e) { /* police par défaut */ }
  const [logo, ban] = await Promise.all([chargerImage(o.club.logo), chargerImage(o.club.banniere)]);
  const sch = schemaCanvas(o.schema);
  const cv = document.createElement('canvas');
  cv.width = LW; cv.height = LH;
  let k = 1;
  for (let i = 0; i < 8; i++) {
    const bas = rendre(cv, o, logo, ban, sch, k);
    if (bas <= LH - 36 + 1) break;
    k -= 0.06;
  }
  return cv;
}

export function DetailsFiche({ ex, onChange, inp, lbl }: { ex: any; onChange: (p: any) => void; inp: CSSProperties; lbl: CSSProperties }) {
  const evo: string[] = [0, 1, 2, 3].map(i => (ex.evolutions && ex.evolutions[i]) || '');
  const ta: CSSProperties = { ...inp, height: 84, fontFamily: 'inherit' };
  const majEvo = (i: number, v: string) => { const e = [...evo]; e[i] = v; onChange({ evolutions: e }); };
  return (
    <details style={{ margin: '8px 0 12px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '10px 0' }}>Détails de la fiche (facultatif)</summary>
      <label style={lbl}>Sous-titre</label>
      <input style={inp} value={ex.sousTitre || ''} placeholder="Ex. Déclenchée par le levé de ballon" onChange={e => onChange({ sousTitre: e.target.value })} />
      <label style={lbl}>Objectif</label>
      <textarea style={ta} value={ex.objectif || ''} onChange={e => onChange({ objectif: e.target.value })} />
      <label style={lbl}>Matériel (une ligne par élément)</label>
      <textarea style={ta} value={ex.materiel || ''} onChange={e => onChange({ materiel: e.target.value })} />
      <label style={lbl}>Consignes (une ligne par consigne)</label>
      <textarea style={ta} value={ex.consignes || ''} onChange={e => onChange({ consignes: e.target.value })} />
      <label style={lbl}>Les attendus (une ligne par attendu)</label>
      <textarea style={ta} value={ex.attendus || ''} onChange={e => onChange({ attendus: e.target.value })} />
      {NIVEAUX.map((n, i) => (
        <div key={n}>
          <label style={lbl}>Évolution : {n}</label>
          <textarea style={{ ...ta, height: 60 }} value={evo[i]} onChange={e => majEvo(i, e.target.value)} />
        </div>
      ))}
      <label style={lbl}>Points clés (une ligne par point)</label>
      <textarea style={ta} value={ex.pointsCles || ''} onChange={e => onChange({ pointsCles: e.target.value })} />
    </details>
  );
}

export function FicheExercice({ seance, exercice, schema, onFermer }: { seance: any; exercice: any; schema: any; onFermer: () => void }) {
  const [club] = useClub();
  const [url, setUrl] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [erreur, setErreur] = useState('');
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const nom = 'fiche-' + ((exercice.titre || 'exercice') as string).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

  useEffect(() => {
    let vivant = true;
    setUrl(''); setBlob(null); setErreur('');
    construireFiche({ club, seance, exercice, schema }).then(cv => {
      if (!vivant) return;
      cvRef.current = cv;
      setUrl(cv.toDataURL('image/png'));
      cv.toBlob(b => { if (vivant) setBlob(b); }, 'image/png');
    }).catch((e: any) => { if (vivant) setErreur('Impossible de créer la fiche : ' + (e && e.message ? e.message : e)); });
    return () => { vivant = false; };
  }, [club, seance, exercice, schema]);

  const telecharger = (b: Blob, fichier: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = fichier;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const partager = async () => {
    if (!blob) return;
    const file = new File([blob], nom + '.png', { type: 'image/png' });
    const nav: any = navigator;
    try {
      if (nav.canShare && nav.canShare({ files: [file] })) { await nav.share({ files: [file], title: exercice.titre || 'Fiche' }); return; }
    } catch (e: any) { if (e && e.name === 'AbortError') return; }
    telecharger(blob, nom + '.png');
  };
  const pdf = () => {
    const c = cvRef.current;
    if (!c) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 6, 297, 198);
    doc.save(nom + '.pdf');
  };

  const bt = (accent: boolean): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, padding: '0 16px', borderRadius: 12,
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 15, border: '1px solid ' + (accent ? club.couleur2 : '#d9e0dc'),
    background: accent ? club.couleur2 : '#ffffff', color: accent ? texteSur(club.couleur2) : '#14211c',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,20,15,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }} onClick={onFermer}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 16, padding: 14, width: 'min(96vw,1000px)', maxHeight: '94vh', overflow: 'auto', fontFamily: CORPS, color: '#14211c' }}>
        <h3 style={{ margin: '0 0 10px', fontFamily: TITRE, fontWeight: 700, fontSize: 26 }}>Fiche de l'exercice</h3>
        {erreur ? <p style={{ color: '#b3261e' }}>{erreur}</p>
          : url ? <img src={url} alt="Fiche de l'exercice" style={{ width: '100%', borderRadius: 10, border: '1px solid #dde4ea' }} />
          : <p>Création de la fiche…</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button type="button" style={bt(true)} onClick={partager} disabled={!blob}>{IC.partager}Partager</button>
          <button type="button" style={bt(false)} onClick={() => blob && telecharger(blob, nom + '.png')} disabled={!blob}>{IC.sauver}Image</button>
          <button type="button" style={bt(false)} onClick={pdf} disabled={!url}>{IC.sauver}PDF</button>
          <button type="button" style={bt(false)} onClick={onFermer}>{IC.fermer}Fermer</button>
        </div>
      </div>
    </div>
  );
}
