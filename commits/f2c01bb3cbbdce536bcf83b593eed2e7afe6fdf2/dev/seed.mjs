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
  ],dokumente:[{id:'demo-lv',name:'DEMO Leistungsverzeichnis.txt',typ:'Leistungsverzeichnis',mime:'text/plain',kiFreigabe:true,ordnerId:'1.6',textInhalt:'Synthetisches LV: Abschnitt Nord. 1.1.10 Kanal herstellen, 100 m. 1.1.20 Bettung und Formstücke, Nebenleistungen. 1.2.10 Borde setzen, 80 m. 1.3.10 Asphalt einbauen, 500 m².'}],
  projektwissen:{version:1,erstellt:iso(0),geaendert:iso(0),quellen:[{dokumentId:'demo-lv',name:'DEMO Leistungsverzeichnis.txt'}],eintraege:[
    {id:'demo-kanal',bereich:'leistungen',bezeichnung:'Kanal herstellen mit Bettung und Formstücken',bauabschnitt:'Abschnitt Nord',gewerk:'Kanalbau',wert:'100',einheit:'m',text:'Synthetisches Beispiel',quellen:[{dokumentId:'demo-lv',name:'DEMO Leistungsverzeichnis.txt',oz:'1.1.10'}]},
    {id:'demo-borde',bereich:'leistungen',bezeichnung:'Borde setzen',bauabschnitt:'Abschnitt Nord',gewerk:'Straßenbau',wert:'80',einheit:'m',text:'Synthetisches Beispiel',quellen:[{dokumentId:'demo-lv',name:'DEMO Leistungsverzeichnis.txt',oz:'1.2.10'}]},
    {id:'demo-asphalt',bereich:'leistungen',bezeichnung:'Asphalt einbauen',bauabschnitt:'Abschnitt Nord',gewerk:'Asphaltbau',wert:'500',einheit:'m²',text:'Synthetisches Beispiel',quellen:[{dokumentId:'demo-lv',name:'DEMO Leistungsverzeichnis.txt',oz:'1.3.10'}]}
  ],konflikte:[],statistik:{eintraege:3,quellen:1}},
  notizen:[],aufgaben:[],schreiben:[],fotodokumentationen:[{id:'demo-fotos',titel:'DEMO – Fotodokumentation',ordnerId:'8',erstellt:iso(0),geaendert:iso(0),fotos:[],qualitaet:'standard'}]}],
  bauleiter:['Demo-Bauleitung'],portfolioLogo:null,portfolioQr:'',vorlage:'Synthetische Testvorlage – keine echten Daten eingeben.'};
}
