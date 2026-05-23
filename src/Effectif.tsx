import React, { useState } from 'react';

type Joueuse = {
  id: string;
  nom: string;
  prenom: string;
  postes: string[];
  dateNaissance: string;
  categorie: string;
  notes: string;
};

type Equipe = {
  id: string;
  nom: string;
  categorie: string;
  titulaires: {joueuseId: string; numero: number; poste: string}[];
  finisseurs: {joueuseId: string; numero: number; poste: string}[];
};

const POSTES_LISTE = ['Pilier gauche','Talonneur','Pilier droit','2ème ligne','Flanker','Numéro 8','Demi de mêlée','Demi d\'ouverture','Centre','Ailier','Arrière'];
const CATEGORIES = ['U6','U8','U10','U12','U14','U16','U18','Seniors','Vétérans'];

const POSTES_PAR_NUMERO: Record<number,string> = {
  1:'Pilier gauche',2:'Talonneur',3:'Pilier droit',4:'2ème ligne',5:'2ème ligne',
  6:'Flanker',7:'Flanker',8:'Numéro 8',9:'Demi de mêlée',10:'Demi d\'ouverture',
  11:'Ailier',12:'Centre',13:'Centre',14:'Ailier',15:'Arrière',
  16:'Finisseur',17:'Finisseur',18:'Finisseur',19:'Finisseur',20:'Finisseur',21:'Finisseur',22:'Finisseur'
};

const couleurPoste = (poste: string) => {
  if(['Pilier gauche','Talonneur','Pilier droit'].includes(poste)) return '#e74c3c';
  if(['2ème ligne','Flanker','Numéro 8'].includes(poste)) return '#e67e22';
  if(['Demi de mêlée','Demi d\'ouverture'].includes(poste)) return '#3498db';
  if(['Centre','Ailier','Arrière'].includes(poste)) return '#2ecc71';
  return '#95a5a6';
};

export default function Effectif({ onRetour }: { onRetour: () => void }) {
  const [joueuses, setJoueuses] = useState<Joueuse[]>(()=>{
    const s=localStorage.getItem('rugby-effectif');
    if(!s) return [];
    const data = JSON.parse(s);
    // Migration ancien format
    return data.map((j:any)=>({
      ...j,
      postes: j.postes || (j.poste ? [j.poste] : []),
    }));
  });
  const [equipes, setEquipes] = useState<Equipe[]>(()=>{
    const s=localStorage.getItem('rugby-equipes');return s?JSON.parse(s):[];
  });
  const [onglet, setOnglet] = useState<'effectif'|'equipes'>('effectif');
  const [vue, setVue] = useState<'liste'|'form'|'detail'|'equipe_form'|'equipe_detail'>('liste');
  const [sel, setSel] = useState<Joueuse|null>(null);
  const [selEquipe, setSelEquipe] = useState<Equipe|null>(null);
  const [edit, setEdit] = useState(false);
  const [filtre, setFiltre] = useState('');
  const [filtrePoste, setFiltrePoste] = useState('');
  const [form, setForm] = useState<Omit<Joueuse,'id'>>({
    nom:'', prenom:'', postes:[], dateNaissance:'', categorie:'U18', notes:''
  });
  const [formEquipe, setFormEquipe] = useState<Omit<Equipe,'id'>>({
    nom:'', categorie:'U18',
    titulaires: Array.from({length:15},(_,i)=>({joueuseId:'',numero:i+1,poste:POSTES_PAR_NUMERO[i+1]})),
    finisseurs: Array.from({length:7},(_,i)=>({joueuseId:'',numero:i+16,poste:'Finisseur'})),
  });

  const saveJoueuses = (js: Joueuse[]) => { setJoueuses(js); localStorage.setItem('rugby-effectif',JSON.stringify(js)); };
  const saveEquipes = (es: Equipe[]) => { setEquipes(es); localStorage.setItem('rugby-equipes',JSON.stringify(es)); };

  const submitJoueuse = () => {
    if(!form.nom.trim()||!form.prenom.trim()) return;
    if(edit&&sel) saveJoueuses(joueuses.map(j=>j.id===sel.id?{...form,id:j.id}:j));
    else saveJoueuses([...joueuses,{...form,id:Date.now().toString()}]);
    setVue('liste');setEdit(false);setSel(null);
    setForm({nom:'',prenom:'',postes:[],dateNaissance:'',categorie:'U18',notes:''});
  };

  const supprimerJoueuse = (id: string) => { saveJoueuses(joueuses.filter(j=>j.id!==id)); setVue('liste'); };

  const togglePoste = (poste: string) => {
    setForm(f=>({...f, postes: f.postes.includes(poste) ? f.postes.filter(p=>p!==poste) : [...f.postes, poste]}));
  };

  const submitEquipe = () => {
    if(!formEquipe.nom.trim()) return;
    if(edit&&selEquipe) saveEquipes(equipes.map(e=>e.id===selEquipe.id?{...formEquipe,id:e.id}:e));
    else saveEquipes([...equipes,{...formEquipe,id:Date.now().toString()}]);
    setVue('liste');setEdit(false);setSelEquipe(null);
    setFormEquipe({nom:'',categorie:'U18',
      titulaires:Array.from({length:15},(_,i)=>({joueuseId:'',numero:i+1,poste:POSTES_PAR_NUMERO[i+1]})),
      finisseurs:Array.from({length:7},(_,i)=>({joueuseId:'',numero:i+16,poste:'Finisseur'})),
    });
  };

  const age = (d: string) => { if(!d) return ''; return Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24*365))+' ans'; };

  const joueuseFiltrees = joueuses
    .filter(j=>filtre===''||j.nom.toLowerCase().includes(filtre.toLowerCase())||j.prenom.toLowerCase().includes(filtre.toLowerCase()))
    .filter(j=>filtrePoste===''||j.postes.includes(filtrePoste))
    .sort((a,b)=>a.nom.localeCompare(b.nom));

  const inp = {width:'100%',padding:10,borderRadius:8,border:'1px solid #ddd',marginBottom:10,fontSize:14,boxSizing:'border-box' as const};
  const lbl = {fontWeight:'bold',display:'block',marginBottom:4,color:'#333'} as React.CSSProperties;
  const btn = (c:string,sm=false)=>({backgroundColor:c,color:'white',border:'none',padding:sm?'6px 10px':'10px 16px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:sm?11:13} as React.CSSProperties);
  const card = {backgroundColor:'white',borderRadius:10,padding:16,marginBottom:10,boxShadow:'0 2px 6px rgba(0,0,0,0.08)'} as React.CSSProperties;
  const hdr = {backgroundColor:'#8e44ad',color:'white',padding:16,borderRadius:10,marginBottom:16,textAlign:'center' as const};
  const badge = (c:string)=>({backgroundColor:c,color:'white',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold'} as React.CSSProperties);

  // FORM JOUEUSE
  if(vue==='form') return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>👤 {edit?'Modifier':'Nouvelle'} joueuse</h2></div>
      <div style={card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Prénom</label>
            <input style={inp} value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Marie"/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Nom</label>
            <input style={inp} value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Dupont"/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Date de naissance</label>
            <input style={inp} type="date" value={form.dateNaissance} onChange={e=>setForm(f=>({...f,dateNaissance:e.target.value}))}/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Catégorie</label>
            <select style={inp} value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <label style={lbl}>Postes (sélection multiple)</label>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {POSTES_LISTE.map(p=>(
            <button key={p} onClick={()=>togglePoste(p)}
              style={{padding:'6px 12px',borderRadius:20,border:'2px solid '+couleurPoste(p),backgroundColor:form.postes.includes(p)?couleurPoste(p):'white',color:form.postes.includes(p)?'white':couleurPoste(p),cursor:'pointer',fontWeight:'bold',fontSize:12}}>
              {p}
            </button>
          ))}
        </div>
        {form.postes.length===0&&<p style={{color:'#e74c3c',fontSize:12,marginBottom:8}}>⚠️ Sélectionne au moins un poste</p>}
        <label style={lbl}>Notes</label>
        <textarea style={{...inp,height:80}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Points forts, blessures, observations..."/>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={btn('#8e44ad')} onClick={submitJoueuse}>✅ {edit?'Enregistrer':'Ajouter'}</button>
          <button style={btn('#555')} onClick={()=>{setVue('liste');setEdit(false);}}>✖ Annuler</button>
        </div>
      </div>
    </div>
  );

  // DETAIL JOUEUSE
  if(vue==='detail'&&sel) return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>👤 Fiche joueuse</h2></div>
      <div style={card}>
        <h2 style={{margin:'0 0 8px'}}>{sel.prenom} {sel.nom}</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {sel.postes.map(p=><span key={p} style={badge(couleurPoste(p))}>{p}</span>)}
          <span style={badge('#1a5276')}>{sel.categorie}</span>
          {sel.dateNaissance&&<span style={badge('#555')}>{age(sel.dateNaissance)}</span>}
        </div>
        {sel.notes&&<><strong>Notes :</strong><p style={{color:'#555',marginTop:4}}>{sel.notes}</p></>}
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <button style={btn('#f39c12')} onClick={()=>{setForm({nom:sel.nom,prenom:sel.prenom,postes:sel.postes,dateNaissance:sel.dateNaissance,categorie:sel.categorie,notes:sel.notes});setEdit(true);setVue('form');}}>✏️ Modifier</button>
          <button style={btn('#e74c3c')} onClick={()=>supprimerJoueuse(sel.id)}>🗑 Supprimer</button>
          <button style={btn('#555')} onClick={()=>setVue('liste')}>← Retour</button>
        </div>
      </div>
    </div>
  );

  // FORM EQUIPE
  if(vue==='equipe_form') return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>🏉 {edit?'Modifier':'Nouvelle'} équipe</h2></div>
      <div style={card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Nom de l'équipe</label>
            <input style={inp} value={formEquipe.nom} onChange={e=>setFormEquipe(f=>({...f,nom:e.target.value}))} placeholder="Ex: U18 Féminines A"/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Catégorie</label>
            <select style={inp} value={formEquipe.categorie} onChange={e=>setFormEquipe(f=>({...f,categorie:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <h4 style={{color:'#1a5276',borderBottom:'2px solid #1a5276',paddingBottom:4}}>Titulaires (1-15)</h4>
        {formEquipe.titulaires.map((t,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
            <div style={{width:28,height:28,borderRadius:'50%',backgroundColor:couleurPoste(t.poste),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:12,flexShrink:0}}>{t.numero}</div>
            <span style={{fontSize:12,color:'#555',minWidth:120}}>{t.poste}</span>
            <select style={{...inp,marginBottom:0,flex:1,minWidth:150}} value={t.joueuseId}
              onChange={e=>{const tit=[...formEquipe.titulaires];tit[i]={...tit[i],joueuseId:e.target.value};setFormEquipe(f=>({...f,titulaires:tit}));}}>
              <option value=''>-- Choisir --</option>
              {joueuses.filter(j=>j.postes.includes(t.poste)||j.postes.length===0).map(j=><option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
              <optgroup label="Autres joueuses">
                {joueuses.filter(j=>!j.postes.includes(t.poste)).map(j=><option key={j.id+'_'} value={j.id}>{j.prenom} {j.nom}</option>)}
              </optgroup>
            </select>
          </div>
        ))}
        <h4 style={{color:'#e67e22',borderBottom:'2px solid #e67e22',paddingBottom:4,marginTop:16}}>Finisseurs (16-22)</h4>
        {formEquipe.finisseurs.map((f,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
            <div style={{width:28,height:28,borderRadius:'50%',backgroundColor:'#e67e22',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:12,flexShrink:0}}>{f.numero}</div>
            <select style={{...inp,marginBottom:0,flex:1,minWidth:100,fontSize:12}} value={f.poste}
              onChange={e=>{const fin=[...formEquipe.finisseurs];fin[i]={...fin[i],poste:e.target.value};setFormEquipe(ff=>({...ff,finisseurs:fin}));}}>
              {POSTES_LISTE.map(p=><option key={p}>{p}</option>)}
            </select>
            <select style={{...inp,marginBottom:0,flex:1,minWidth:150}} value={f.joueuseId}
              onChange={e=>{const fin=[...formEquipe.finisseurs];fin[i]={...fin[i],joueuseId:e.target.value};setFormEquipe(ff=>({...ff,finisseurs:fin}));}}>
              <option value=''>-- Choisir --</option>
              {joueuses.map(j=><option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
            </select>
          </div>
        ))}
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <button style={btn('#1a5276')} onClick={submitEquipe}>✅ {edit?'Enregistrer':'Créer l\'équipe'}</button>
          <button style={btn('#555')} onClick={()=>{setVue('liste');setEdit(false);}}>✖ Annuler</button>
        </div>
      </div>
    </div>
  );

  // DETAIL EQUIPE
  if(vue==='equipe_detail'&&selEquipe) return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>🏉 {selEquipe.nom}</h2></div>
      <div style={card}>
        <span style={badge('#1a5276')}>{selEquipe.categorie}</span>
        <h4 style={{color:'#1a5276',marginTop:12}}>Titulaires</h4>
        {selEquipe.titulaires.map((t,i)=>{
          const j=joueuses.find(jj=>jj.id===t.joueuseId);
          return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,padding:'6px 10px',backgroundColor:'#f9f9f9',borderRadius:8}}>
              <div style={{width:28,height:28,borderRadius:'50%',backgroundColor:couleurPoste(t.poste),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:12}}>{t.numero}</div>
              <span style={{flex:1,fontWeight:'bold'}}>{j?`${j.prenom} ${j.nom}`:<span style={{color:'#aaa'}}>Non défini</span>}</span>
              <span style={badge(couleurPoste(t.poste))}>{t.poste}</span>
            </div>
          );
        })}
        <h4 style={{color:'#e67e22',marginTop:12}}>Finisseurs</h4>
        {selEquipe.finisseurs.map((f,i)=>{
          const j=joueuses.find(jj=>jj.id===f.joueuseId);
          return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,padding:'6px 10px',backgroundColor:'#fff8f0',borderRadius:8}}>
              <div style={{width:28,height:28,borderRadius:'50%',backgroundColor:'#e67e22',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:12}}>{f.numero}</div>
              <span style={{flex:1,fontWeight:'bold'}}>{j?`${j.prenom} ${j.nom}`:<span style={{color:'#aaa'}}>Non défini</span>}</span>
              <span style={badge(couleurPoste(f.poste))}>{f.poste}</span>
            </div>
          );
        })}
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <button style={btn('#f39c12')} onClick={()=>{setFormEquipe({nom:selEquipe.nom,categorie:selEquipe.categorie,titulaires:selEquipe.titulaires,finisseurs:selEquipe.finisseurs});setEdit(true);setVue('equipe_form');}}>✏️ Modifier</button>
          <button style={btn('#e74c3c')} onClick={()=>{saveEquipes(equipes.filter(e=>e.id!==selEquipe.id));setVue('liste');}}>🗑 Supprimer</button>
          <button style={btn('#555')} onClick={()=>setVue('liste')}>← Retour</button>
        </div>
      </div>
    </div>
  );

  // LISTE PRINCIPALE
  return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}>
        <h1 style={{margin:0,fontSize:22}}>👥 Effectif & Équipes</h1>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:16,backgroundColor:'white',borderRadius:10,overflow:'hidden',boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
        <button onClick={()=>setOnglet('effectif')} style={{flex:1,padding:12,border:'none',cursor:'pointer',fontWeight:'bold',fontSize:14,backgroundColor:onglet==='effectif'?'#8e44ad':'white',color:onglet==='effectif'?'white':'#333'}}>👤 Effectif ({joueuses.length})</button>
        <button onClick={()=>setOnglet('equipes')} style={{flex:1,padding:12,border:'none',cursor:'pointer',fontWeight:'bold',fontSize:14,backgroundColor:onglet==='equipes'?'#1a5276':'white',color:onglet==='equipes'?'white':'#333'}}>🏉 Équipes ({equipes.length})</button>
      </div>

      {onglet==='effectif'&&<>
        <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <button style={btn('#8e44ad')} onClick={()=>{setEdit(false);setVue('form');}}>+ Ajouter une joueuse</button>
          <button style={btn('#555')} onClick={onRetour}>← Retour</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <input style={{...inp,marginBottom:0,flex:1,minWidth:150}} placeholder="🔍 Rechercher..." value={filtre} onChange={e=>setFiltre(e.target.value)}/>
          <select style={{...inp,marginBottom:0,flex:1,minWidth:150}} value={filtrePoste} onChange={e=>setFiltrePoste(e.target.value)}>
            <option value=''>Tous les postes</option>
            {POSTES_LISTE.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        {joueuseFiltrees.length===0?(
          <div style={{...card,textAlign:'center',color:'#888',padding:40}}>
            <p style={{fontSize:40}}>👥</p>
            <p>Aucune joueuse.<br/>Ajoute ta première joueuse !</p>
          </div>
        ):joueuseFiltrees.map(j=>(
          <div key={j.id} style={{...card,cursor:'pointer',borderLeft:`5px solid ${couleurPoste(j.postes[0]||'')}`}} onClick={()=>{setSel(j);setVue('detail');}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{width:40,height:40,borderRadius:'50%',backgroundColor:couleurPoste(j.postes[0]||''),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:16,flexShrink:0}}>
                {j.prenom[0]}{j.nom[0]}
              </div>
              <div style={{flex:1}}>
                <strong style={{fontSize:16}}>{j.prenom} {j.nom}</strong>
                <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                  {j.postes.map(p=><span key={p} style={badge(couleurPoste(p))}>{p}</span>)}
                  <span style={badge('#1a5276')}>{j.categorie}</span>
                  {j.dateNaissance&&<span style={{color:'#777',fontSize:12}}>{age(j.dateNaissance)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </>}

      {onglet==='equipes'&&<>
        <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <button style={btn('#1a5276')} onClick={()=>{setEdit(false);setVue('equipe_form');}}>+ Créer une équipe</button>
          <button style={btn('#555')} onClick={onRetour}>← Retour</button>
        </div>
        {equipes.length===0?(
          <div style={{...card,textAlign:'center',color:'#888',padding:40}}>
            <p style={{fontSize:40}}>🏉</p>
            <p>Aucune équipe créée.<br/>Crée ta première équipe !</p>
          </div>
        ):equipes.map(e=>(
          <div key={e.id} style={{...card,cursor:'pointer',borderLeft:'5px solid #1a5276'}} onClick={()=>{setSelEquipe(e);setVue('equipe_detail');}}>
            <strong style={{fontSize:16}}>{e.nom}</strong>
            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <span style={badge('#1a5276')}>{e.categorie}</span>
              <span style={{color:'#777',fontSize:13}}>{e.titulaires.filter(t=>t.joueuseId).length}/15 titulaires</span>
              <span style={{color:'#777',fontSize:13}}>{e.finisseurs.filter(f=>f.joueuseId).length}/7 finisseurs</span>
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
