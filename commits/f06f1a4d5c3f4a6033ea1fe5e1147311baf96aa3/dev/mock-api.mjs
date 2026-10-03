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
    session.documents=session.documents.filter(d=>used.has(d.id)||d.pending);
    return json({ok:true,revision:session.revision});
  }
  if(action==='revision')return json({ok:true,revision:session.revision});
  if(action==='openai-key-status')return json({ok:true,present:true,mock:true});
  if(action==='openai-key-set'||action==='openai-key-clear')return error('PREVIEW_NO_SECRETS','In dieser Testumgebung werden keine API-Schlüssel gespeichert.',403);
  if(action==='openai-test')return json({id:'simulated',mock:true});
  if(action==='openai-response'){
    const body=await request.json(),schema=body.text?.format?.schema;
    const text=schema?JSON.stringify(schemaExample(schema)):'Simulierte Testantwort: Diese Preview nutzt keine echte KI und überträgt keine Inhalte an OpenAI.';
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
