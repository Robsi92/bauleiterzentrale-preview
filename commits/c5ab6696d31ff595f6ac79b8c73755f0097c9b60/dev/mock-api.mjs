import {createSeed} from './seed.mjs';
export function createSession(){return {state:createSeed(),revision:1,documents:[],links:[]};}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const error=(code,message,status)=>json({ok:false,code,message},status);
function schemaExample(schema={},key=''){
  if(schema.enum)return schema.enum[0];
  if(schema.type==='object')return Object.fromEntries(Object.entries(schema.properties||{}).map(([k,v])=>[k,schemaExample(v,k)]));
  if(schema.type==='array')return [];
  if(schema.type==='boolean')return false;
  if(schema.type==='number'||schema.type==='integer')return schema.minimum||0;
  if(/datum|start|ende/i.test(key))return new Date().toISOString().slice(0,10);
  return 'Simulierte Testantwort';
}
// Festes, frei erfundenes LV-Beispiel zum Durchspielen des Planungsdialogs.
// Es analysiert keine hochgeladenen Unterlagen und nutzt keine externe KI.
function demoPlanResponse(body){
  const name=body.text?.format?.name;
  if(!['plan_bauvorgaenge','plan_zeitplan'].includes(name))return null;
  const grob=String(body.instructions||'').includes('Grob:');
  const rows=grob
    ? [['Tief- und Straßenbau',7,'100 m Kanal + 80 m Borde, getrennte Leistungsansätze', '1.1.10'],['Asphalt einbauen',1,'Annahme: 500 m² / 500 m² pro AT = 1 AT','1.3.10']]
    : [['Kanal herstellen',4,'Annahme: 100 m / 25 m pro AT = 4 AT','1.1.10'],['Borde setzen',3,'Annahme: 80 m / 30 m pro AT, aufgerundet 3 AT','1.2.10'],['Asphalt einbauen',1,'Annahme: 500 m² / 500 m² pro AT = 1 AT','1.3.10']];
  const bauvorgaenge=rows.map(([name,dauerArbeitstage,dauerAnsatz,oz],i)=>({name,gewerk:i===rows.length-1?'Asphaltbau':'Tief- und Straßenbau',bauabschnitt:'Abschnitt Nord',menge:'',einheit:'',dauerArbeitstage,dauerAnsatz,bauzeitRelevant:true,leistungen:[name],vorgaenger:i?[rows[i-1][0]]:[],positionen:[oz]}));
  if(name==='plan_bauvorgaenge')return {bauvorgaenge};
  const start=JSON.stringify(body.input||[]).match(/Frühester Start: (\d{4}-\d{2}-\d{2})/)?.[1]||new Date().toISOString().slice(0,10);
  return {vorgaenge:bauvorgaenge.map((v,i)=>({name:v.name,gewerk:v.gewerk,bauabschnitt:v.bauabschnitt,start,dauerArbeitstage:v.dauerArbeitstage,dauerAnsatz:v.dauerAnsatz,parentIndex:-1,vorgaengerIndices:i?[i-1]:[],leistungen:v.leistungen}))};
}
export async function handleMock(request,session){
  const url=new URL(request.url),action=url.searchParams.get('action')||'state',method=request.method;
  const write=method==='POST';
  if(write&&request.headers.get('X-BZ-Request')!=='1')return error('REQUEST_HEADER_REQUIRED','Ungültige Test-Schreibanfrage',403);
  if(action==='state'){
    if(!write)return json({ok:true,exists:true,state:session.state,revision:session.revision});
    const body=await request.json();
    if(body.baseRevision!==session.revision)return json({ok:false,code:'REVISION_CONFLICT',message:'Der Teststand wurde geändert.',revision:session.revision},409);
    if(!body.state||!Array.isArray(body.state.projects))return error('INVALID_STATE','Ungültiger Teststand',422);
    session.state=body.state;session.revision++;
    const used=new Set(body.state.projects.flatMap(p=>(p.dokumente||[]).map(d=>String(d.id))));
    for(const document of session.documents)if(used.has(document.id))document.pending=false;
    session.documents=session.documents.filter(d=>used.has(d.id)||d.pending);
    return json({ok:true,revision:session.revision});
  }
  if(action==='revision')return json({ok:true,revision:session.revision});
  if(action==='openai-key-status')return json({ok:true,present:true,mock:true});
  if(action==='openai-key-set'||action==='openai-key-clear')return error('PREVIEW_NO_SECRETS','In dieser Testumgebung werden keine API-Schlüssel gespeichert.',403);
  if(action==='openai-test')return json({id:'simulated',mock:true});
  if(action==='openai-response'){
    const body=await request.json(),schema=body.text?.format?.schema;
    const text=schema?JSON.stringify(demoPlanResponse(body)||schemaExample(schema)):'Simulierte Testantwort: Diese Preview nutzt keine echte KI und überträgt keine Inhalte an OpenAI.';
    return json({id:'mock-response',mock:true,output_text:text,output:[{type:'message',content:[{type:'output_text',text}]}],usage:{input_tokens:0,output_tokens:0}});
  }
  if(action==='document-upload'&&write){
    const form=await request.formData(),file=form.get('file'),projectId=String(form.get('projectId')||'');
    if(!session.state.projects.some(p=>String(p.id)===projectId))return error('PROJECT_NOT_FOUND','Testprojekt fehlt',404);
    if(!file||typeof file.arrayBuffer!=='function')return error('FILE_REQUIRED','Datei fehlt',400);
    if(file.size>26214400)return error('FILE_TOO_LARGE','Datei größer als 25 MB',413);
    const id='doc_'+crypto.randomUUID().replaceAll('-','').slice(0,24);
    const document={id,fileId:crypto.randomUUID().replaceAll('-',''),name:file.name,mime:file.type||'application/octet-stream',groesse:file.size,hochgeladen:new Date().toISOString(),storage:'server',kiFreigabe:true};
    // ArrayBuffer is reliably cloneable into IndexedDB in Safari service workers.
    session.documents.push({id,projectId,bytes:await file.arrayBuffer(),document,pending:true});
    return json({ok:true,document},201);
  }
  if(action==='document'){
    const id=url.searchParams.get('id'),pid=url.searchParams.get('projectId');
    const doc=session.documents.find(d=>d.id===id&&d.projectId===pid);
    const referenced=session.state.projects.some(p=>String(p.id)===pid&&(p.dokumente||[]).some(d=>String(d.id)===id));
    if(!doc||!referenced)return error('DOCUMENT_NOT_FOUND','Testdokument nicht gefunden',404);
    doc.pending=false;
    return new Response(method==='HEAD'?null:doc.bytes,{headers:{'Content-Type':doc.document.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(action==='access-list')return json({ok:true,links:[],items:[],mock:true});
  return error('PREVIEW_UNSUPPORTED','Diese Funktion benötigt einen gesonderten Backendtest und ist in der statischen Preview nicht verfügbar.',501);
}
