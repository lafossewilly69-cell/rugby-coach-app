import React, { useState } from 'react';

type Joueuse = {
  id: string;
  nom: string;
  prenom: string;
  numero: number;
  poste: string;
  dateNaissance: string;
  categorie: string;
  notes: string;
};

const POSTES = ['Pilier gauche','Talonneur','Pilier droit','2ème ligne','2ème ligne','Flanker','Flanker','Numéro 8','Demi de mêlée','Demi d\'ouverture','Centre','Centre','Ailier','Ailier','Arrière'];
const POSTES_LISTE = ['Pilier gauche','Talonneur','Pilier droit','2ème ligne','Flanker','Numéro 8','Demi de mêlée','Demi d\'ouverture','Centre','Ailier','Arrière'];
const CATEGORIES = ['U6','U8','U10','U12','U14','U16','U18','Seniors','Vétérans'];

export default function Effectif({ onRetour }: { onRetour: () => void }) {
  const [joueuses, setJoueuses] = useState<Joueuse[]>(()=>{
    const s=localStorage.getItem('rugby-effectif');return s?JSON.parse(s):[];
  });
  const [vue, setVue] = useState<'liste'|'form'|'detail'>('liste');
  const [sel, setSel] = useState<Joueuse|null>(null);
  const [edit, setEdit] = useState(false);
  const [filtre, setFiltre] = useState('');
  const [filtrePoste, setFiltrePoste] = useState('');
  const [form, setForm] = useState<Omit<Joueuse,'id'>>({
    nom:'', prenom:'', numero:1, poste:'Pilier gauche',
    dateNaissance:'', categorie:'U18', notes:''
  });

  const save = (js: Joueuse[]) => {
    setJoueuses(js);
    localStorage.setItem('rugby-effectif', JSON.stringify(js));
  };

  const submit = () => {
    if(!form.nom.trim()||!form.prenom.trim()) return;
    if(edit && sel) {
      save(joueuses.map(j=>j.id===sel.id?{...form,id:j.id}:j));
    } else {
      save([...joueuses,{...form,id:Date.now().toString()}]);
    }
    setVue('liste');setEdit(false);setSel(null);
    setForm({nom:'',prenom:'',numero:1,poste:'Pilier gauche',dateNaissance:'',categorie:'U18',notes:''});
  };

  const supprimer = (id: string) => {
    save(joueuses.filter(j=>j.id!==id));
    setVue('liste');
  };

  const age = (dateNaissance: string) => {
    if(!dateNaissance) return '';
    const diff = Date.now() - new Date(dateNaissance).getTime();
    return Math.floor(diff/(1000*60*60*24*365)) + ' ans';
  };

  const joueuseFiltrees = joueuses
    .filter(j=> filtre==='' || j.nom.toLowerCase().includes(filtre.toLowerCase()) || j.prenom.toLowerCase().includes(filtre.toLowerCase()))
    .filter(j=> filtrePoste==='' || j.poste===filtrePoste)
    .sort((a,b)=>a.numero-b.numero);

  const inp = {width:'100%',padding:10,borderRadius:8,border:'1px solid #ddd',marginBottom:10,fontSize:14,boxSizing:'border-box' as const};
  const lbl = {fontWeight:'bold',display:'block',marginBottom:4,color:'#333'} as React.CSSProperties;
  const btn = (c:string)=>({backgroundColor:c,color:'white',border:'none',padding:'10px 16px',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:13} as React.CSSProperties);
  const card = {backgroundColor:'white',borderRadius:10,padding:16,marginBottom:10,boxShadow:'0 2px 6px rgba(0,0,0,0.08)'} as React.CSSProperties;
  const hdr = {backgroundColor:'#8e44ad',color:'white',padding:16,borderRadius:10,marginBottom:16,textAlign:'center' as const};
  const badge = (c:string)=>({backgroundColor:c,color:'white',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold'} as React.CSSProperties);

  const couleurPoste = (poste:string) => {
    if(['Pilier gauche','Talonneur','Pilier droit'].includes(poste)) return '#e74c3c';
    if(['2ème ligne','Flanker','Numéro 8'].includes(poste)) return '#e67e22';
    if(['Demi de mêlée','Demi d\'ouverture'].includes(poste)) return '#3498db';
    if(['Centre','Ailier','Arrière'].includes(poste)) return '#2ecc71';
    return '#95a5a6';
  };

  if(vue==='detail' && sel) return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}><h2 style={{margin:0}}>👤 Fiche joueuse</h2></div>
      <div style={card}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{width:64,height:64,borderRadius:'50%',backgroundColor:couleurPoste(sel.poste),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:24,fontWeight:'bold'}}>
            {sel.numero}
          </div>
          <div>
            <h2 style={{margin:0}}>{sel.prenom} {sel.nom}</h2>
            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <span style={badge(couleurPoste(sel.poste))}>{sel.poste}</span>
              <span style={badge('#1a5276')}>{sel.categorie}</span>
              {sel.dateNaissance&&<span style={badge('#555')}>{age(sel.dateNaissance)}</span>}
            </div>
          </div>
        </div>
        {sel.dateNaissance&&<p><strong>Date de naissance :</strong> {sel.dateNaissance}</p>}
        {sel.notes&&<><strong>Notes :</strong><p style={{color:'#555',marginTop:4}}>{sel.notes}</p></>}
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          <button style={btn('#f39c12')} onClick={()=>{setForm({nom:sel.nom,prenom:sel.prenom,numero:sel.numero,poste:sel.poste,dateNaissance:sel.dateNaissance,categorie:sel.categorie,notes:sel.notes});setEdit(true);setVue('form');}}>✏️ Modifier</button>
          <button style={btn('#e74c3c')} onClick={()=>supprimer(sel.id)}>🗑 Supprimer</button>
          <button style={btn('#555')} onClick={()=>setVue('liste')}>← Retour</button>
        </div>
      </div>
    </div>
  );

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
            <label style={lbl}>Numéro</label>
            <input style={inp} type="number" min="1" max="99" value={form.numero} onChange={e=>setForm(f=>({...f,numero:Number(e.target.value)}))}/>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Date de naissance</label>
            <input style={inp} type="date" value={form.dateNaissance} onChange={e=>setForm(f=>({...f,dateNaissance:e.target.value}))}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Poste</label>
            <select style={inp} value={form.poste} onChange={e=>setForm(f=>({...f,poste:e.target.value}))}>
              {POSTES_LISTE.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <label style={lbl}>Catégorie</label>
            <select style={inp} value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <label style={lbl}>Notes</label>
        <textarea style={{...inp,height:80}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Points forts, blessures, observations..."/>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={btn('#8e44ad')} onClick={submit}>✅ {edit?'Enregistrer':'Ajouter'}</button>
          <button style={btn('#555')} onClick={()=>{setVue('liste');setEdit(false);}}>✖ Annuler</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:'sans-serif',maxWidth:800,margin:'0 auto',padding:12,backgroundColor:'#f5f5f5',minHeight:'100vh'}}>
      <div style={hdr}>
        <h1 style={{margin:0,fontSize:22}}>👥 Effectif</h1>
        <p style={{margin:'4px 0 0',opacity:0.8,fontSize:13}}>{joueuses.length} joueuse{joueuses.length>1?'s':''}</p>
      </div>
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
          <p>Aucune joueuse dans l'effectif.<br/>Ajoute ta première joueuse !</p>
        </div>
      ):joueuseFiltrees.map(j=>(
        <div key={j.id} style={{...card,cursor:'pointer',borderLeft:`5px solid ${couleurPoste(j.poste)}`}}
          onClick={()=>{setSel(j);setVue('detail');}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div style={{width:40,height:40,borderRadius:'50%',backgroundColor:couleurPoste(j.poste),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',fontSize:16,flexShrink:0}}>
              {j.numero}
            </div>
            <div style={{flex:1}}>
              <strong style={{fontSize:16}}>{j.prenom} {j.nom}</strong>
              <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
                <span style={badge(couleurPoste(j.poste))}>{j.poste}</span>
                <span style={badge('#1a5276')}>{j.categorie}</span>
                {j.dateNaissance&&<span style={{color:'#777',fontSize:12}}>{age(j.dateNaissance)}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
