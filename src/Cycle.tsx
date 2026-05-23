import React, { useState } from 'react';

type Semaine = { numero: number; theme: string; notes: string; };
type Cycle = { id: string; nom: string; dateDebut: string; nbSemaines: number; categorie: string; semaines: Semaine[]; };

const THEMES_DEFAUT = ['Défense','Attaque','Ruck','Mêlée','Touche','Jeu au pied','Condition physique','Jeu courant','Plaquage','Soutien','Alignement','Match amical','Tournoi','Repos'];
const CATEGORIES = ['U6','U8','U10','U12','U14','U16','U18','Seniors','Vétérans'];
const COULEURS: Record<string,string> = {
  'Défense':'#3498db','Attaque':'#e74c3c','Ruck':'#8e44ad','Mêlée':'#e67e22',
  'Touche':'#2ecc71','Jeu au pied':'#f1c40f','Condition physique':'#1abc9c',
  'Jeu courant':'#e67e22','Plaquage':'#c0392b','Soutien':'#27ae60',
  'Alignement':'#2980b9','Match amical':'#f39c12','Tournoi':'#d35400','Repos':'#95a5a6'
};

function couleur(theme: string) { return COULEURS[theme] || '#16a085'; }

function dateS(dateDebut: string, num: number) {
  if(!dateDebut) return '';
  const d = new Date(dateDebut);
  d.setDate(d.getDate()+(num-1)*7);
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
}

export default function Cycle({ onRetour }: { onRetour: () => void }) {
  const [cycles, setCycles] = useState<Cycle[]>(()=>{ const s=localStorage.getItem('rugby-cycles'); return s?JSON.parse(s):[]; });
  const [themes, setThemes] = useState<string[]>(()=>{ const s=localStorage.getItem('rugby-themes'); return s?JSON.parse(s):THEMES_DEFAUT; });
  const [vue, setVue] = useState<'liste'|'form'|'detail'|'planifier'|'themes'>('liste');
  const [sel, setSel] = useState<Cycle|null>(null);
  const [form, setForm] = useState({nom:'',dateDebut:'',nbSemaines:4,categorie:'U18'});
  const [nouveauTheme, setNouveauTheme] = useState('');

  const saveCycles = (cs: Cycle[]) => { setCycles(cs); localStorage.setItem('rugby-cycles',JSON.stringify(cs)); };
  const saveThemes = (ts: string[]) => { setThemes(ts); localStorage.setItem('rugby-themes',JSON.stringify(ts)); };

  const creerCycle = () => {
    if(!form.nom.trim()||!form.dateDebut) return;
    const semaines: Semaine[] = Array.from({length:form.nbSemaines},(_,i)=>({numero:i+1,theme:'',notes:''}));
    const nouveau: Cycle = {...form,id:Date.now().toString(),semaines};
    const updated = [...cycles,nouveau];
    saveCycles(updated);
    setSel(nouveau);
    setVue('planifier');
    setForm({nom:'',dateDebut:'',nbSemaines:4,categorie:'U18'});
  };

  const majSemaine = (numSemaine: number, champ: keyof Semaine, val: string) => {
    if(!sel) return;
    const nouvSemaines = sel.semaines.map(s=>s.numero===numSemaine?{...s,[champ]:val}:s);
    const nouvCycle = {...sel,semaines:nouvSemaines};
    const updated = cycles.map(c=>c.id===sel.id?nouvCycle:c);
    saveCycles(updated);
    setSel(nouvCycle);
  };

  const ajouterTheme = () => {
    if(!nouveauTheme.trim()||themes.includes(nouveauTheme.trim())) return;
    saveThemes([...themes,nouveauTheme.trim()]);
    setNouveauTheme('');
  };

  const inp = {width:'100%',padding:10,borderRadius:8,border:'1px solid #ddd',marginBottom:10,fontSize:14,boxSizing:'border-box' as const};
  const lbl = {fontWeight:'bold',display:'block',marginBottom:4,color:'#333'} as React.CSSProperties;
  const btn = (c:string)=>({backgroundColor:c,color:'white',border:'none',padding:'10px 16px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:13} as React.CSSProperties);
  const card = {backgroundColor:'white',borderRadius:10,padding:16,marginBottom:10,boxShadow:'0 2px 6px rgba(0,0,0,0.08)'} as React.CSSProperties;
  const hdr = {backgroundColor:'#16a085',color:'white',padding:16,borderRadius:10,marginBottom:16,textAlign:'center' as const};
  const badge = (c:string)=>({backgroundColor:c,color:'white',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold',display:'inline-block'} as React.CSSProperties);

  // GESTION THEMES
  if(vue==='themes') return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>🎨 Gestion des thèmes</h2></div>
      <div style={card}>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input value={nouveauTheme} onChange={e=>setNouveauTheme(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&ajouterTheme()}
            placeholder="Nouveau thème (ex: Lineout, Sprint...)"
            style={{...inp,marginBottom:0,flex:1}}/>
          <button style={btn('#2ecc71')} onClick={ajouterTheme}>+ Ajouter</button>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {themes.map(t=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:6,backgroundColor:couleur(t),borderRadius:20,padding:'6px 12px'}}>
              <span style={{color:'white',fontWeight:'bold',fontSize:13}}>{t}</span>
              <button onClick={()=>saveThemes(themes.filter(th=>th!==t))}
                style={{backgroundColor:'rgba(0,0,0,0.2)',border:'none',color:'white',cursor:'pointer',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:14,padding:0}}>×</button>
            </div>
          ))}
        </div>
      </div>
      <button style={btn('#555')} onClick={()=>setVue('liste')}>← Retour</button>
    </div>
  );

  // FORM CREATION
  if(vue==='form') return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>📅 Nouveau cycle</h2></div>
      <div style={card}>
        <label style={lbl}>Nom du cycle</label>
        <input style={inp} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Préparation championnat 2025"/>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Date de début</label>
            <input style={inp} type="date" value={form.dateDebut} onChange={e=>setForm(f=>({...f,dateDebut:e.target.value}))}/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Catégorie</label>
            <select style={inp} value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Nombre de semaines</label>
            <input style={inp} type="number" min="1" max="52" value={form.nbSemaines} onChange={e=>setForm(f=>({...f,nbSemaines:Number(e.target.value)}))}/>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={btn('#16a085')} onClick={creerCycle}>✅ Créer et planifier</button>
          <button style={btn('#555')} onClick={()=>setVue('liste')}>✖ Annuler</button>
        </div>
      </div>
    </div>
  );

  // PLANIFICATION SEMAINES
  if(vue==='planifier'&&sel) return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}>
        <h2 style={{margin:0}}>📅 {sel.nom}</h2>
        <p style={{margin:'4px 0 0',opacity:0.8,fontSize:13}}>{sel.nbSemaines} semaines — {sel.categorie}</p>
      </div>
      <div style={card}>
        <h3 style={{margin:'0 0 10px',color:'#16a085'}}>Vue d'ensemble</h3>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {sel.semaines.map(s=>(
            <div key={s.numero} style={{width:65,minHeight:65,borderRadius:8,backgroundColor:s.theme?couleur(s.theme):'#ecf0f1',padding:6,textAlign:'center' as const}}>
              <div style={{color:s.theme?'white':'#999',fontWeight:'bold',fontSize:11}}>S{s.numero}</div>
              <div style={{color:s.theme?'white':'#bbb',fontSize:9,lineHeight:1.3,marginTop:2}}>{s.theme||'—'}</div>
              {sel.dateDebut&&<div style={{color:s.theme?'rgba(255,255,255,0.8)':'#ccc',fontSize:8,marginTop:2}}>{dateS(sel.dateDebut,s.numero)}</div>}
            </div>
          ))}
        </div>
      </div>
      {sel.semaines.map(s=>(
        <div key={s.numero} style={{...card,borderLeft:`5px solid ${s.theme?couleur(s.theme):'#ecf0f1'}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
            <div style={{width:32,height:32,borderRadius:'50%',backgroundColor:s.theme?couleur(s.theme):'#ecf0f1',display:'flex',alignItems:'center',justifyContent:'center',color:s.theme?'white':'#999',fontWeight:'bold',fontSize:13}}>
              {s.numero}
            </div>
            <strong>Semaine {s.numero}</strong>
            {sel.dateDebut&&<span style={{color:'#777',fontSize:12}}>— {dateS(sel.dateDebut,s.numero)}</span>}
            {s.theme&&<span style={badge(couleur(s.theme))}>{s.theme}</span>}
          </div>
          <label style={lbl}>Thème</label>
          <input style={inp} value={s.theme} placeholder="Écris ou choisis un thème..."
            onChange={e=>majSemaine(s.numero,'theme',e.target.value)}/>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10,marginTop:-6}}>
            {themes.map(t=>(
              <button key={t} onClick={()=>majSemaine(s.numero,'theme',t)}
                style={{padding:'4px 8px',borderRadius:12,border:'none',backgroundColor:couleur(t),color:'white',cursor:'pointer',fontSize:10,fontWeight:'bold',opacity:s.theme===t?1:0.6}}>
                {t}
              </button>
            ))}
          </div>
          <label style={lbl}>Notes</label>
          <textarea style={{...inp,height:55,marginBottom:0}} value={s.notes}
            placeholder="Objectifs, points d'attention..."
            onChange={e=>majSemaine(s.numero,'notes',e.target.value)}/>
        </div>
      ))}
      <button style={btn('#16a085')} onClick={()=>setVue('liste')}>✅ Terminer</button>
    </div>
  );

  // DETAIL
  if(vue==='detail'&&sel) return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}>
        <h2 style={{margin:0}}>📅 {sel.nom}</h2>
        <p style={{margin:'4px 0 0',opacity:0.8,fontSize:13}}>{sel.nbSemaines} semaines — {sel.categorie}</p>
      </div>
      <div style={card}>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {sel.semaines.map(s=>(
            <div key={s.numero} style={{width:65,minHeight:65,borderRadius:8,backgroundColor:s.theme?couleur(s.theme):'#ecf0f1',padding:6,textAlign:'center' as const}}>
              <div style={{color:s.theme?'white':'#999',fontWeight:'bold',fontSize:11}}>S{s.numero}</div>
              <div style={{color:s.theme?'white':'#bbb',fontSize:9,lineHeight:1.3,marginTop:2}}>{s.theme||'—'}</div>
              {sel.dateDebut&&<div style={{color:s.theme?'rgba(255,255,255,0.8)':'#ccc',fontSize:8,marginTop:2}}>{dateS(sel.dateDebut,s.numero)}</div>}
            </div>
          ))}
        </div>
      </div>
      {sel.semaines.filter(s=>s.theme||s.notes).map(s=>(
        <div key={s.numero} style={{...card,borderLeft:`5px solid ${s.theme?couleur(s.theme):'#ecf0f1'}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <strong>Semaine {s.numero}</strong>
            {sel.dateDebut&&<span style={{color:'#777',fontSize:12}}>{dateS(sel.dateDebut,s.numero)}</span>}
            {s.theme&&<span style={badge(couleur(s.theme))}>{s.theme}</span>}
          </div>
          {s.notes&&<p style={{margin:'6px 0 0',color:'#555',fontSize:13}}>{s.notes}</p>}
        </div>
      ))}
      <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
        <button style={btn('#f39c12')} onClick={()=>setVue('planifier')}>✏️ Modifier</button>
        <button style={btn('#e74c3c')} onClick={()=>{saveCycles(cycles.filter(c=>c.id!==sel.id));setVue('liste');}}>🗑 Supprimer</button>
        <button style={btn('#555')} onClick={()=>setVue('liste')}>← Retour</button>
      </div>
    </div>
  );

  // LISTE
  return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}>
        <h1 style={{margin:0,fontSize:22}}>📅 Cycles d'entraînement</h1>
        <p style={{margin:'4px 0 0',opacity:0.8,fontSize:13}}>Planifie tes thèmes sur plusieurs semaines</p>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <button style={btn('#16a085')} onClick={()=>setVue('form')}>+ Nouveau cycle</button>
        <button style={btn('#8e44ad')} onClick={()=>setVue('themes')}>🎨 Gérer les thèmes</button>
        <button style={btn('#555')} onClick={onRetour}>← Retour</button>
      </div>
      {cycles.length===0?(
        <div style={{...card,textAlign:'center',color:'#888',padding:40}}>
          <p style={{fontSize:40}}>📅</p>
          <p>Aucun cycle planifié.<br/>Crée ton premier cycle !</p>
        </div>
      ):cycles.map(c=>(
        <div key={c.id} style={{...card,cursor:'pointer',borderLeft:'5px solid #16a085'}} onClick={()=>{setSel(c);setVue('detail');}}>
          <strong style={{fontSize:16}}>{c.nom}</strong>
          <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
            <span style={badge('#16a085')}>{c.categorie}</span>
            <span style={{color:'#777',fontSize:13}}>{c.nbSemaines} semaines</span>
            {c.dateDebut&&<span style={{color:'#777',fontSize:13}}>Début : {new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>}
          </div>
          <div style={{display:'flex',gap:3,marginTop:8,flexWrap:'wrap'}}>
            {c.semaines.map(s=>(
              <div key={s.numero} title={`S${s.numero}: ${s.theme||'Non défini'}`}
                style={{width:20,height:20,borderRadius:4,backgroundColor:s.theme?couleur(s.theme):'#ecf0f1'}}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
