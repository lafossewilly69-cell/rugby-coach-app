import { useCloud, useTerrains } from './useCloud';
/* eslint-disable */
import React, { useState } from 'react';
import Tactique from './Tactique';
import Terrain from './Terrain';
import MiniTerrain from './MiniTerrain';
import Effectif from './Effectif';
import Cycle from './Cycle';
import Accueil from './Accueil';
import Reglages from './Reglages';
import { FicheExercice, DetailsFiche } from './Fiche';
import { useClub, texteSur, fondBande } from './club';
import { IC } from './icones';
import { exporterSeancePDF } from './ExportPDF';
const CATEGORIES = ['U6','U8','U10','U12','U14','U16','U18','Seniors','Vétérans'];
const GENRES = ['Féminines','Masculins','Mixte'];
const OBJECTIFS = ['Attaque','Défense','Touche','Mêlée','Jeu au pied','Condition physique','Jeu courant'];
type Exercice = {titre:string;duree:number;description:string;schemaVisuelId?:string;schemaVisuelNom?:string;sousTitre?:string;objectif?:string;materiel?:string;consignes?:string;attendus?:string;evolutions?:string[];pointsCles?:string};
type Seance = {id:string;date:string;heure:string;duree:number;categorie:string;genre:string;theme:string;exercices:Exercice[];notes:string;comportementAttendu?:string;evolution?:string;schemaVisuelId?:string;schemaVisuelNom?:string};
const C:Record<string,string>={'Attaque':'#e74c3c','Défense':'#3498db','Touche':'#2ecc71','Mêlée':'#9b59b6','Jeu au pied':'#f39c12','Condition physique':'#1abc9c','Jeu courant':'#e67e22'};
export default function App(){
const [seances,setSeances]=useCloud<Seance[]>('rugby-seances',[]);
const [vue,setVue]=useState<'planning'|'form'|'detail'|'tactique'|'terrain'|'effectif'|'cycle'|'reglages'>('planning');
const [sel,setSel]=useState<Seance|null>(null);
const [edit,setEdit]=useState(false);
  const [fiche,setFiche]=useState<number|null>(null);
const [form,setForm]=useState({date:'',heure:'18:00',duree:90,categorie:'U18',genre:'Féminines',theme:'Jeu courant',notes:'',comportementAttendu:'',evolution:'',exercices:[{titre:'',duree:15,description:''}] as Exercice[],schemaVisuelId:'',schemaVisuelNom:''});
const schemasVisuels=useTerrains();
const [_choixSchemaOuv,_setChoixSchemaOuv]=useState(false);
const save=(s:Seance[])=>{setSeances(s);};
const submit=()=>{if(edit&&sel){save(seances.map(s=>s.id===sel.id?{...form,id:s.id}:s))}else{save([...seances,{...form,id:Date.now().toString()}])};setVue('planning');setEdit(false);setSel(null);setForm({date:'',heure:'18:00',duree:90,categorie:'U18',genre:'Féminines',theme:'Jeu courant',notes:'',comportementAttendu:'',evolution:'',exercices:[{titre:'',duree:15,description:''}],schemaVisuelId:'',schemaVisuelNom:''})};
const del=(id:string)=>{save(seances.filter(s=>s.id!==id));setVue('planning')};
const startEdit=(sc:Seance)=>{setForm({date:sc.date,heure:sc.heure,duree:sc.duree,categorie:sc.categorie,genre:sc.genre,theme:sc.theme,notes:sc.notes,comportementAttendu:sc.comportementAttendu||'',evolution:sc.evolution||'',exercices:sc.exercices,schemaVisuelId:sc.schemaVisuelId||'',schemaVisuelNom:sc.schemaVisuelNom||''});setSel(sc);setEdit(true);setVue('form')};
const majEx=(i:number,k:keyof Exercice,v:string|number|undefined)=>{const e=[...form.exercices];e[i]={...e[i],[k]:v};setForm(f=>({...f,exercices:e}))};
const [club]=useClub();
  const inp={width:'100%',padding:'12px',borderRadius:12,border:'1px solid #d9e0dc',marginBottom:10,fontSize:16,boxSizing:'border-box' as const,fontFamily:'inherit',color:'#14211c',background:'#ffffff'};
const btn=(c:string)=>{const base:React.CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,minHeight:44,padding:'0 16px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:14,border:'1px solid #d9e0dc',backgroundColor:'#ffffff',color:'#14211c'};if(['#e74c3c','#c0392b'].includes(c))return {...base,color:'#b3261e',borderColor:'#e8b4b0'};if(['#555','#666','#777','#95a5a6','#7f8c8d'].includes(c))return base;return {...base,backgroundColor:club.couleur2,borderColor:club.couleur2,color:texteSur(club.couleur2)};};
const badge=(c:string)=>(c==='#1a5276'?{backgroundColor:club.couleur+'1f',color:club.couleur,padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:600}:{backgroundColor:c,color:texteSur(c),padding:'3px 10px',borderRadius:8,fontSize:12,fontWeight:600}) as React.CSSProperties;
const card={backgroundColor:'#ffffff',border:'1px solid #dde4ea',borderRadius:16,padding:16,marginBottom:12} as React.CSSProperties;
const lbl={fontWeight:600,display:'block',marginBottom:4,color:'#14211c',fontSize:14} as React.CSSProperties;
const hdr={background:fondBande(club),color:texteSur(club.couleur),padding:'16px 18px',borderRadius:16,marginBottom:16,textAlign:'left' as const};
if(vue==='tactique') return <Tactique onRetour={()=>setVue('planning')}/>;
if(vue==='terrain') return <Terrain onRetour={()=>setVue('planning')}/>;
if(vue==='effectif') return <Effectif onRetour={()=>setVue('planning')}/>;
if(vue==='cycle') return <Cycle onRetour={()=>setVue('planning')}/>;
if(vue==='reglages') return <Reglages onRetour={()=>setVue('planning')}/>;
if(vue==='detail'&&sel){return(<div style={{fontFamily:"'Barlow',system-ui,sans-serif",maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<div style={hdr}><h2 style={{margin:0,fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",fontWeight:700,fontSize:28}}>Détail de la séance</h2></div>{fiche!==null&&sel.exercices[fiche]&&<FicheExercice seance={sel} exercice={sel.exercices[fiche]} schema={schemasVisuels.find((s:any)=>s.id===sel.exercices[fiche].schemaVisuelId)} onFermer={()=>setFiche(null)}/>}
<div style={card}>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={badge(C[sel.theme]||'#888')}>{sel.theme}</span><span style={badge('#1a5276')}>{sel.categorie} {sel.genre}</span></div>
<h3>{sel.date} à {sel.heure} — {sel.duree} min</h3>
<h4>Exercices</h4>
{sel.exercices.map((ex,i)=>(<div key={i} style={{...card,borderLeft:`4px solid ${C[sel.theme]||'#888'}`}}><strong>{ex.titre||'(sans titre)'}</strong> — {ex.duree} min<p style={{margin:'6px 0 0',color:'#555'}}>{ex.description}</p>
{ex.schemaVisuelId&&(()=>{const sv=schemasVisuels.find((s:any)=>s.id===ex.schemaVisuelId);return sv?<MiniTerrain elements={sv.elements} onOuvrir={()=>setVue('terrain')}/>:null;})()}<button style={{...btn('#f39c12'),marginTop:10}} onClick={()=>setFiche(i)}>{IC.partager}Fiche de l'exercice</button></div>))}
{sel.notes&&<><h4>Notes</h4><p style={{color:'#555'}}>{sel.notes}</p></>}
{sel.schemaVisuelId&&(()=>{
  const sv=schemasVisuels.find((s:any)=>s.id===sel.schemaVisuelId);
  return sv?(<><h4>Schéma visuel : {sv.nom}</h4>
  <MiniTerrain elements={sv.elements} onOuvrir={()=>setVue('terrain')}/>
  </>):null;
})()}
<div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
<button style={btn('#f39c12')} onClick={()=>startEdit(sel)}>{IC.modifier}Modifier</button>
<button style={btn('#e74c3c')} onClick={()=>exporterSeancePDF(sel, schemasVisuels)}>📤 PDF</button>
<button style={btn('#e74c3c')} onClick={()=>del(sel.id)}>{IC.supprimer}Supprimer</button>
<button style={btn('#555')} onClick={()=>setVue('planning')}>{IC.retour}Retour</button>
</div></div></div>)}
if(vue==='form'){return(<div style={{fontFamily:"'Barlow',system-ui,sans-serif",maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<div style={hdr}><h2 style={{margin:0,fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",fontWeight:700,fontSize:28}}>{edit?'Modifier':'Nouvelle'} séance</h2></div>
<div style={card}>
<div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
<div style={{flex:1,minWidth:140}}><label style={lbl}>Catégorie</label><select style={inp} value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
<div style={{flex:1,minWidth:140}}><label style={lbl}>Genre</label><select style={inp} value={form.genre} onChange={e=>setForm(f=>({...f,genre:e.target.value}))}>{GENRES.map(g=><option key={g}>{g}</option>)}</select></div>
</div>
<div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
<div style={{flex:1,minWidth:140}}><label style={lbl}>Date</label><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
<div style={{flex:1,minWidth:140}}><label style={lbl}>Heure</label><input style={inp} type="time" value={form.heure} onChange={e=>setForm(f=>({...f,heure:e.target.value}))}/></div>
<div style={{flex:1,minWidth:140}}><label style={lbl}>Durée (min)</label><input style={inp} type="number" value={form.duree} onChange={e=>setForm(f=>({...f,duree:Number(e.target.value)}))}/></div>
</div>
<label style={lbl}>Thème</label><select style={inp} value={form.theme} onChange={e=>setForm(f=>({...f,theme:e.target.value}))}>{OBJECTIFS.map(o=><option key={o}>{o}</option>)}</select>
<h4>Exercices</h4>
{form.exercices.map((ex,i)=>(<div key={i} style={{...card,backgroundColor:'#f9f9f9'}}>
<div style={{display:'flex',justifyContent:'space-between'}}><strong>Exercice {i+1}</strong>{form.exercices.length>1&&<button style={{...btn('#e74c3c'),padding:'4px 10px'}} onClick={()=>setForm(f=>({...f,exercices:f.exercices.filter((_,j)=>j!==i)}))}>✕</button>}</div>
<label style={lbl}>Titre</label><input style={inp} value={ex.titre} onChange={e=>majEx(i,'titre',e.target.value)}/>
<label style={lbl}>Durée (min)</label><input style={inp} type="number" value={ex.duree} onChange={e=>majEx(i,'duree',Number(e.target.value))}/>
<label style={lbl}>Description</label><textarea style={{...inp,height:70}} value={ex.description} onChange={e=>majEx(i,'description',e.target.value)}/>
<label style={lbl}>Schéma visuel</label>
<select style={inp} value={ex.schemaVisuelId||''} onChange={e=>{
  const val=e.target.value;
  const s=schemasVisuels.find(sv=>sv.id===val);
  const ex2=[...form.exercices];
  ex2[i]={...ex2[i],schemaVisuelId:val,schemaVisuelNom:s?s.nom:''};
  setForm(f=>({...f,exercices:ex2}));
}}>
<option value=''>-- Aucun --</option>
{schemasVisuels.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}
</select>
{ex.schemaVisuelId&&<p style={{color:'#2ecc71',fontSize:12,margin:'0 0 8px'}}>✅ {ex.schemaVisuelNom}</p>}<DetailsFiche ex={ex} inp={inp} lbl={lbl} onChange={(p:any)=>setForm(f=>({...f,exercices:f.exercices.map((e,j)=>j===i?{...e,...p}:e)}))}/>
</div>))}
<button style={{...btn('#2ecc71'),marginBottom:12}} onClick={()=>setForm(f=>({...f,exercices:[...f.exercices,{titre:'',duree:15,description:''}]}))}>+ Exercice</button>
<label style={lbl}>Notes</label><textarea style={{...inp,height:80}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          <label style={lbl}>Comportement attendu</label><textarea style={{...inp,height:80}} value={form.comportementAttendu||''} onChange={e=>setForm(f=>({...f,comportementAttendu:e.target.value}))}/>
          <label style={lbl}>Évolution</label><textarea style={{...inp,height:80}} value={form.evolution||''} onChange={e=>setForm(f=>({...f,evolution:e.target.value}))}/>
<label style={lbl}>Schéma visuel associé</label>
<div style={{marginBottom:10}}>
{schemasVisuels.length===0?(<p style={{color:'#aaa',fontSize:13}}>Aucun schéma visuel sauvegardé. Crée-en un dans Séance visuelle !</p>):(
<select style={inp} value={form.schemaVisuelId} onChange={e=>{const s=schemasVisuels.find(sv=>sv.id===e.target.value);setForm(f=>({...f,schemaVisuelId:e.target.value,schemaVisuelNom:s?s.nom:''}));}}>
<option value=''>-- Aucun schéma --</option>
{schemasVisuels.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}
</select>
)}
{form.schemaVisuelId&&<p style={{color:'#2ecc71',fontSize:12}}>✅ Schéma associé : {form.schemaVisuelNom}</p>}
</div>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
<button style={btn('#1a5276')} onClick={submit}>{IC.ok}{edit?'Enregistrer les modifications':'Enregistrer'}</button>
<button style={btn('#555')} onClick={()=>{setVue(edit?'detail':'planning');setEdit(false)}}>{IC.fermer}Annuler</button>
</div></div></div>)}
return(<div style={{fontFamily:"'Barlow',system-ui,sans-serif",maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<Accueil seances={seances} C={C} onNav={(v)=>{setEdit(false);setVue(v);}} onOpen={(id)=>{const sc=seances.find(s=>s.id===id);if(sc){setSel(sc);setVue('detail');}}}/>
</div>)}
