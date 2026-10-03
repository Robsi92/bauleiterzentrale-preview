// Ausschließlich frei erfundene Beispiele. Keine Kopie realer Projekte.
export function createSeed(now=new Date()){
  const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const iso=days=>{const d=new Date(start);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const row=(id,name,offset,days,extra={})=>({id,nr:String(id).padStart(2,'0'),name,ag:'Demo Tiefbau',start:iso(offset),dauer:days/7,ist:0,soll:0,status:'Geplant',kommentar:'Synthetischer Testvorgang',vorgaenger:[],parentId:null,...extra});
  return {appVersion:'synthetic',projects:[{id:'demo-nord',name:'DEMO – Musterbaustelle Nord',projName:'DEMO – Musterbaustelle Nord',bauleiter:'Demo-Bauleitung',polier:'Demo-Team',kostenstelle:'000000001',wert:100000,agColors:{'Demo Tiefbau':'#236fd1'},vorgaenge:[
    row(1,'Baustelleneinrichtung',0,3),
    row(2,'Erdarbeiten',3,7,{vorgaenger:[{id:1,typ:'EA',lag:0}]}),
    row(3,'Leitungsbau',12,8,{vorgaenger:[{id:2,typ:'EA',lag:2}],portfolio:true,farbe:'#d4af37'}),
    row(4,'Oberfläche',20,5,{segments:[{start:iso(20),dauer:2/7},{start:iso(25),dauer:3/7}]}),
  ],dokumente:[],notizen:[],aufgaben:[],schreiben:[],fotodokumentationen:[{id:'demo-fotos',titel:'DEMO – Fotodokumentation',ordnerId:'8',erstellt:iso(0),geaendert:iso(0),fotos:[],qualitaet:'standard'}]}],
  bauleiter:['Demo-Bauleitung'],portfolioLogo:null,portfolioQr:'',vorlage:'Synthetische Testvorlage – keine echten Daten eingeben.'};
}
