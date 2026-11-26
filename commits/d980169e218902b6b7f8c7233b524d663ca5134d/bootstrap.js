const error=document.querySelector('#error'),frame=document.querySelector('#app');
try{
  const version=await (await fetch('./version.json',{cache:'no-store'})).json();
  document.querySelector('#version').textContent='Stand '+version.commit.slice(0,12)+' · '+version.branch;
  const reg=await navigator.serviceWorker.register('./worker.js',{scope:'./',updateViaCache:'none'});
  await reg.update();
  const workerUrl=new URL('./worker.js',location.href).href;
  if(navigator.serviceWorker.controller?.scriptURL!==workerUrl)await new Promise(resolve=>{
    const changed=()=>{if(navigator.serviceWorker.controller?.scriptURL===workerUrl){navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();}};
    navigator.serviceWorker.addEventListener('controllerchange',changed);changed();
  });
  frame.src='./app.html';frame.hidden=false;
  document.querySelector('#reset').onclick=()=>{
    const channel=new MessageChannel();
    channel.port1.onmessage=()=>{frame.src='./app.html?reset='+Date.now();};
    navigator.serviceWorker.controller.postMessage('reset-preview',[channel.port2]);
  };
}catch(_err){error.hidden=false;error.textContent='Preview konnte nicht gestartet werden. Bitte HTTPS verwenden und normalen Browsermodus mit lokalem Speicher erlauben.';}
