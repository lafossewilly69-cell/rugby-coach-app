import React, { useState } from 'react';
import Tactique from './Tactique';
import Terrain from './Terrain';
import MiniTerrain from './MiniTerrain';
import Effectif from './Effectif';
import Cycle from './Cycle';
import { exporterSeancePDF } from './ExportPDF';
const CATEGORIES = ['U6','U8','U10','U12','U14','U16','U18','Seniors','Vétérans'];
const GENRES = ['Féminines','Masculins','Mixte'];
const OBJECTIFS = ['Attaque','Défense','Touche','Mêlée','Jeu au pied','Condition physique','Jeu courant'];
type Exercice = {titre:string;duree:number;description:string;schemaVisuelId?:string;schemaVisuelNom?:string};
type Seance = {id:string;date:string;heure:string;duree:number;categorie:string;genre:string;objectif:string;exercices:Exercice[];notes:string;schemaVisuelId?:string;schemaVisuelNom?:string};
const C:Record<string,string>={'Attaque':'#e74c3c','Défense':'#3498db','Touche':'#2ecc71','Mêlée':'#9b59b6','Jeu au pied':'#f39c12','Condition physique':'#1abc9c','Jeu courant':'#e67e22'};
export default function App(){
const [seances,setSeances]=useState<Seance[]>(()=>{const s=localStorage.getItem('rugby-seances');return s?JSON.parse(s):[]});
const [vue,setVue]=useState<'planning'|'form'|'detail'|'tactique'|'terrain'|'effectif'|'cycle'>('planning');
const [sel,setSel]=useState<Seance|null>(null);
const [edit,setEdit]=useState(false);
const [form,setForm]=useState({date:'',heure:'18:00',duree:90,categorie:'U18',genre:'Féminines',objectif:'Jeu courant',notes:'',exercices:[{titre:'',duree:15,description:''}] as Exercice[],schemaVisuelId:'',schemaVisuelNom:''});
const [schemasVisuels,setSchemasVisuels]=useState<{id:string,nom:string,elements:any[]}[]>(()=>{const s=localStorage.getItem('rugby-terrains');return s?JSON.parse(s):[];});
const [choixSchemaOuv,setChoixSchemaOuv]=useState(false);
const save=(s:Seance[])=>{setSeances(s);localStorage.setItem('rugby-seances',JSON.stringify(s))};
const submit=()=>{if(edit&&sel){save(seances.map(s=>s.id===sel.id?{...form,id:s.id}:s))}else{save([...seances,{...form,id:Date.now().toString()}])};setVue('planning');setEdit(false);setSel(null);setForm({date:'',heure:'18:00',duree:90,categorie:'U18',genre:'Féminines',objectif:'Jeu courant',notes:'',exercices:[{titre:'',duree:15,description:''}]})};
const del=(id:string)=>{save(seances.filter(s=>s.id!==id));setVue('planning')};
const startEdit=(sc:Seance)=>{setForm({date:sc.date,heure:sc.heure,duree:sc.duree,categorie:sc.categorie,genre:sc.genre,objectif:sc.objectif,notes:sc.notes,exercices:sc.exercices});setSel(sc);setEdit(true);setVue('form')};
const majEx=(i:number,k:keyof Exercice,v:string|number|undefined)=>{const e=[...form.exercices];e[i]={...e[i],[k]:v};setForm(f=>({...f,exercices:e}))};
const inp={width:'100%',padding:10,borderRadius:8,border:'1px solid #ddd',marginBottom:10,fontSize:14,boxSizing:'border-box' as const};
const btn=(c:string)=>({backgroundColor:c,color:'white',border:'none',padding:'10px 18px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:14} as React.CSSProperties);
const badge=(c:string)=>({backgroundColor:c,color:'white',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold'} as React.CSSProperties);
const card={backgroundColor:'white',borderRadius:10,padding:16,marginBottom:12,boxShadow:'0 2px 6px rgba(0,0,0,0.1)'} as React.CSSProperties;
const lbl={fontWeight:'bold',display:'block',marginBottom:4,color:'#333'} as React.CSSProperties;
const hdr={backgroundColor:'#1a5276',color:'white',padding:16,borderRadius:10,marginBottom:16,textAlign:'center' as const};
if(vue==='tactique') return <Tactique onRetour={()=>setVue('planning')}/>;
if(vue==='terrain') return <Terrain onRetour={()=>setVue('planning')}/>;
if(vue==='effectif') return <Effectif onRetour={()=>setVue('planning')}/>;
if(vue==='cycle') return <Cycle onRetour={()=>setVue('planning')}/>;
if(vue==='detail'&&sel){return(<div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<div style={hdr}><h2 style={{margin:0}}>🏉 Détail de la séance</h2></div>
<div style={card}>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span style={badge(C[sel.objectif]||'#888')}>{sel.objectif}</span><span style={badge('#1a5276')}>{sel.categorie} {sel.genre}</span></div>
<h3>{sel.date} à {sel.heure} — {sel.duree} min</h3>
<h4>Exercices</h4>
{sel.exercices.map((ex,i)=>(<div key={i} style={{...card,borderLeft:`4px solid ${C[sel.objectif]||'#888'}`}}><strong>{ex.titre||'(sans titre)'}</strong> — {ex.duree} min<p style={{margin:'6px 0 0',color:'#555'}}>{ex.description}</p>
{ex.schemaVisuelId&&(()=>{const sv=JSON.parse(localStorage.getItem('rugby-terrains')||'[]').find((s:any)=>s.id===ex.schemaVisuelId);return sv?<MiniTerrain elements={sv.elements} onOuvrir={()=>setVue('terrain')}/>:null;})()}</div>))}
{sel.notes&&<><h4>Notes</h4><p style={{color:'#555'}}>{sel.notes}</p></>}
{sel.schemaVisuelId&&(()=>{
  const sv=JSON.parse(localStorage.getItem('rugby-terrains')||'[]').find((s:any)=>s.id===sel.schemaVisuelId);
  return sv?(<><h4>Schéma visuel : {sv.nom}</h4>
  <MiniTerrain elements={sv.elements} onOuvrir={()=>setVue('terrain')}/>
  </>):null;
})()}
<div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
<button style={btn('#f39c12')} onClick={()=>startEdit(sel)}>✏️ Modifier</button>
<button style={btn('#e74c3c')} onClick={()=>exporterSeancePDF(sel, schemasVisuels)}>📤 PDF</button>
<button style={btn('#e74c3c')} onClick={()=>del(sel.id)}>🗑 Supprimer</button>
<button style={btn('#555')} onClick={()=>setVue('planning')}>← Retour</button>
</div></div></div>)}
if(vue==='form'){return(<div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<div style={hdr}><h2 style={{margin:0}}>🏉 {edit?'Modifier':'Nouvelle'} séance</h2></div>
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
<label style={lbl}>Objectif</label><select style={inp} value={form.objectif} onChange={e=>setForm(f=>({...f,objectif:e.target.value}))}>{OBJECTIFS.map(o=><option key={o}>{o}</option>)}</select>
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
{ex.schemaVisuelId&&<p style={{color:'#2ecc71',fontSize:12,margin:'0 0 8px'}}>✅ {ex.schemaVisuelNom}</p>}
</div>))}
<button style={{...btn('#2ecc71'),marginBottom:12}} onClick={()=>setForm(f=>({...f,exercices:[...f.exercices,{titre:'',duree:15,description:''}]}))}>+ Exercice</button>
<label style={lbl}>Notes</label><textarea style={{...inp,height:80}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
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
<button style={btn('#1a5276')} onClick={submit}>✅ {edit?'Enregistrer les modifications':'Enregistrer'}</button>
<button style={btn('#555')} onClick={()=>{setVue(edit?'detail':'planning');setEdit(false)}}>✖ Annuler</button>
</div></div></div>)}
return(<div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
<div style={hdr}><h1 style={{margin:0,fontSize:22}}>🏉 Rugby Coach</h1><p style={{margin:'4px 0 0',opacity:0.8,fontSize:13}}>Planning des séances</p></div>
<div style={{marginBottom:16,display:'flex',gap:8,flexWrap:'wrap'}}>
<button style={btn('#1a5276')} onClick={()=>{setEdit(false);setVue('form')}}>+ Nouvelle séance</button>
<button style={btn('#2d8a4e')} onClick={()=>setVue('tactique')}>🏟 Tactiques</button>
<button style={btn('#27ae60')} onClick={()=>setVue('terrain')}>🏋️ Séance visuelle</button>
<button style={btn('#8e44ad')} onClick={()=>setVue('effectif')}>👥 Effectif</button>
<button style={btn('#16a085')} onClick={()=>setVue('cycle')}>📅 Cycles</button>
</div>
{seances.length===0?(<div style={{...card,textAlign:'center',color:'#888',padding:40}}><p style={{fontSize:40}}>📋</p><p>Aucune séance planifiée.<br/>Crée ta première séance !</p></div>):
[...seances].sort((a,b)=>a.date.localeCompare(b.date)).map(sc=>(<div key={sc.id} style={{...card,borderLeft:`5px solid ${C[sc.objectif]||'#888'}`,cursor:'pointer'}} onClick={()=>{setSel(sc);setVue('detail')}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
<div><strong style={{fontSize:16}}>{sc.date} à {sc.heure}</strong><span style={{color:'#777',marginLeft:8}}>{sc.duree} min</span></div>
<span style={badge(C[sc.objectif]||'#888')}>{sc.objectif}</span></div>
<div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}><span style={badge('#1a5276')}>{sc.categorie} {sc.genre}</span><span style={{color:'#777',fontSize:13}}>{sc.exercices.length} exercice(s)</span></div>
</div>))}
</div>)}
