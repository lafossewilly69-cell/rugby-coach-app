import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exporterSeancePDF(seance: any, schemasVisuels: any[]) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = 210, marge = 15;
  let y = marge;

  // Couleurs
  const couleurs: Record<string, string> = {
    'Attaque': '#e74c3c', 'Défense': '#3498db', 'Touche': '#2ecc71',
    'Mêlée': '#9b59b6', 'Jeu au pied': '#f39c12', 'Condition physique': '#1abc9c', 'Jeu courant': '#e67e22'
  };

  const hex2rgb = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  };

  // Header
  const coul = couleurs[seance.objectif] || '#1a5276';
  const [r,g,b] = hex2rgb(coul);
  pdf.setFillColor(r,g,b);
  pdf.roundedRect(marge, y, W-2*marge, 20, 3, 3, 'F');
  pdf.setTextColor(255,255,255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica','bold');
  pdf.text('🏉 Rugby Coach — Séance d\'entraînement', marge+5, y+13);
  y += 26;

  // Infos séance
  pdf.setTextColor(50,50,50);
  pdf.setFontSize(11);
  pdf.setFont('helvetica','bold');
  pdf.text(`${seance.categorie} ${seance.genre}`, marge, y);
  pdf.setFont('helvetica','normal');
  pdf.text(`${seance.date} à ${seance.heure} — ${seance.duree} min`, marge+60, y);
  y += 7;
  pdf.setFont('helvetica','bold');
  pdf.text(`Objectif : `, marge, y);
  pdf.setFont('helvetica','normal');
  pdf.text(seance.objectif, marge+25, y);
  y += 10;

  // Ligne séparatrice
  pdf.setDrawColor(200,200,200);
  pdf.line(marge, y, W-marge, y);
  y += 6;

  // Exercices
  pdf.setFontSize(13);
  pdf.setFont('helvetica','bold');
  pdf.setTextColor(50,50,50);
  pdf.text('Exercices', marge, y);
  y += 7;

  for (let i = 0; i < seance.exercices.length; i++) {
    const ex = seance.exercices[i];

    // Vérifier saut de page
    if (y > 260) { pdf.addPage(); y = marge; }

    // Fond exercice
    pdf.setFillColor(245,245,245);
    pdf.roundedRect(marge, y, W-2*marge, 8, 2, 2, 'F');
    pdf.setFillColor(r,g,b);
    pdf.roundedRect(marge, y, 4, 8, 1, 1, 'F');

    pdf.setFontSize(11);
    pdf.setFont('helvetica','bold');
    pdf.setTextColor(50,50,50);
    pdf.text(`${i+1}. ${ex.titre||'(sans titre)'}`, marge+8, y+6);
    pdf.setFont('helvetica','normal');
    pdf.setTextColor(100,100,100);
    pdf.text(`${ex.duree} min`, W-marge-20, y+6);
    y += 11;

    if (ex.description) {
      const lines = pdf.splitTextToSize(ex.description, W-2*marge-10);
      pdf.setFontSize(10);
      pdf.setTextColor(80,80,80);
      lines.forEach((line: string) => {
        if (y > 270) { pdf.addPage(); y = marge; }
        pdf.text(line, marge+8, y);
        y += 5;
      });
    }

    // Schéma visuel associé à l'exercice
    if (ex.schemaVisuelId) {
      const sv = schemasVisuels.find((s: any) => s.id === ex.schemaVisuelId);
      if (sv) {
        if (y > 200) { pdf.addPage(); y = marge; }
        pdf.setFontSize(9);
        pdf.setTextColor(100,100,100);
        pdf.text(`Schéma : ${sv.nom}`, marge+8, y);
        y += 4;

        // Dessiner mini terrain dans un canvas temporaire
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 260;
        const ctx = canvas.getContext('2d')!;

        // Terrain
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = k%2===0?'#2d8a4e':'#277a45';
          ctx.fillRect(k*40,0,40,260);
        }
        ctx.strokeStyle='white'; ctx.lineWidth=1.5;
        ctx.strokeRect(20,10,360,240);
        ctx.strokeRect(20,10,28,240);
        ctx.strokeRect(352,10,28,240);
        ctx.beginPath();ctx.moveTo(200,10);ctx.lineTo(200,250);ctx.stroke();

        // Éléments
        const sx = 400/800, sy = 260/520;
        sv.elements.forEach((el: any) => {
          ctx.save();
          ctx.translate(el.x*sx, el.y*sy);
          if(el.type==='joueur'){
            ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);
            ctx.fillStyle='#1a5276';ctx.fill();
            ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
            ctx.fillStyle='white';ctx.font='bold 7px sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(String(el.numero||''),0,0);
          } else if(el.type==='adversaire'){
            ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);
            ctx.fillStyle='#e74c3c';ctx.fill();
            ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke();
            ctx.fillStyle='white';ctx.font='bold 7px sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(String(el.numero||''),0,0);
          } else if(el.type.startsWith('plot_')){
            const pc:Record<string,string>={'plot_orange':'#e67e22','plot_rouge':'#e74c3c','plot_jaune':'#f1c40f','plot_bleu':'#2980b9','plot_vert':'#27ae60','plot_blanc':'#ecf0f1'};
            ctx.fillStyle=pc[el.type]||'#e67e22';
            ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();
          } else if(el.type==='piquet'){
            ctx.fillStyle='#2c3e50';ctx.fillRect(-2,-12,4,24);
          } else if(el.type==='bouclier'){
            ctx.fillStyle='#2980b9';
            ctx.beginPath();ctx.roundRect(-6,-10,12,20,2);ctx.fill();
          } else if(el.type==='boudin'){
            ctx.fillStyle='#8B4513';ctx.fillRect(-5,-12,10,24);
          } else if(el.type==='ballon'){
            ctx.fillStyle='#c8860a';
            ctx.beginPath();ctx.ellipse(0,0,8,5,Math.PI/6,0,Math.PI*2);ctx.fill();
          }
          ctx.restore();
        });

        const imgData = canvas.toDataURL('image/png');
        const imgW = W-2*marge-10;
        const imgH = imgW * (260/400);
        if (y + imgH > 280) { pdf.addPage(); y = marge; }
        pdf.addImage(imgData, 'PNG', marge+8, y, imgW, imgH);
        y += imgH + 4;
      }
    }
    y += 4;
  }

  // Notes
  if (seance.notes) {
    if (y > 250) { pdf.addPage(); y = marge; }
    pdf.setFontSize(12);
    pdf.setFont('helvetica','bold');
    pdf.setTextColor(50,50,50);
    pdf.text('Notes du coach', marge, y);
    y += 6;
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(seance.notes, W-2*marge);
    lines.forEach((line: string) => {
      if (y > 280) { pdf.addPage(); y = marge; }
      pdf.text(line, marge, y);
      y += 5;
    });
  }

  // Schéma visuel global
  if (seance.schemaVisuelId) {
    const sv = schemasVisuels.find((s: any) => s.id === seance.schemaVisuelId);
    if (sv) {
      if (y > 200) { pdf.addPage(); y = marge; }
      pdf.setFontSize(12);
      pdf.setFont('helvetica','bold');
      pdf.setTextColor(50,50,50);
      pdf.text(`Schéma global : ${sv.nom}`, marge, y);
      y += 6;
    }
  }

  // Pied de page
  pdf.setFontSize(8);
  pdf.setTextColor(150,150,150);
  pdf.text(`Rugby Coach — Généré le ${new Date().toLocaleDateString('fr-FR')}`, marge, 290);

  pdf.save(`seance_${seance.date}_${seance.categorie}.pdf`);
}
