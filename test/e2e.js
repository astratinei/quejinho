const {chromium}=require('playwright');
const MODE=process.env.MODE||'sw';
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext(MODE==='nosw'?{serviceWorkers:'block'}:{});
  const p=await ctx.newPage();
  const t0=Date.now(),ts=()=>((Date.now()-t0)/1000).toFixed(1)+'s';
  p.on('console',m=>console.log(ts(),'[console]',m.type(),m.text().slice(0,300)));
  p.on('pageerror',e=>console.log(ts(),'[pageerror]',e.message));
  p.on('requestfailed',r=>console.log(ts(),'[reqfailed]',r.url(),r.failure()&&r.failure().errorText));
  p.on('worker',w=>{console.log(ts(),'[worker]',w.url());});
  p.on('response',r=>{if(/models|vendor/.test(r.url()))console.log(ts(),'[resp]',r.status(),r.url().replace('http://localhost:8080',''),r.fromServiceWorker()?'(sw)':'');});
  console.log('MODE',MODE);
  await p.goto('http://localhost:8080/');
  await p.waitForTimeout(3000);
  await p.click('.nav [data-act=translate]');
  await p.fill('#trq','I do not want it');
  const s=Date.now();
  await p.click('form[data-form=tr] button[type=submit]');
  try{
    await p.waitForSelector('.res .big, .res .gloss, .res b',{timeout:150000});
    console.log('RESULT after',Date.now()-s,'ms:',(await p.textContent('.res')).replace(/\s+/g,' '));
  }catch(e){
    console.log('TIMEOUT. Page says:',(await p.textContent('.res').catch(()=>'?')));
  }
  await b.close();
})();
