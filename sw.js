/* Queijinho service worker: saves the whole app, including the translator, so it works offline.
   Bump V when you change files so phones pick up the new version. */
const V="queijinho-v3";
const CORE=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png",
"./fonts/baloo-2-600.woff2","./fonts/baloo-2-700.woff2","./fonts/baloo-2-800.woff2","./fonts/nunito-600.woff2","./fonts/nunito-700.woff2","./fonts/nunito-800.woff2"];
const EXTRA=["./vendor/bergamot/translator.js","./vendor/bergamot/worker/translator-worker.js","./vendor/bergamot/worker/bergamot-translator-worker.js","./vendor/bergamot/worker/bergamot-translator-worker.wasm"];
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(V);
    await c.addAll(CORE);
    await Promise.allSettled(EXTRA.map(u=>c.add(u)));
    try{
      const r=await fetch("./models/registry.json");
      if(r.ok){
        const reg=await r.clone().json();
        await c.put("./models/registry.json",r);
        const urls=[];
        Object.values(reg).forEach(m=>Object.values(m).forEach(f=>{if(f&&f.name)urls.push("./"+f.name);}));
        await Promise.allSettled(urls.map(u=>c.add(u)));
      }
    }catch(err){}
    self.skipWaiting();
  })());
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return; /* the online translator is never touched */
  const heavy=/\/(models|vendor|fonts|icons)\//.test(u.pathname);
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    if(hit&&heavy)return hit; /* big files never change, so don't re-download them */
    const net=fetch(r).then(res=>{if(res&&res.ok&&res.status===200)c.put(r,res.clone());return res;}).catch(()=>null);
    return hit||(await net)||(await c.match("./index.html"));
  }));
});
