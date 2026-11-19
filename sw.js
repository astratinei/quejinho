/* Queijinho service worker: caches the app so it works offline. Bump V when you change files. */
const V="queijinho-v2";
const FILES=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png",
"./fonts/baloo-2-600.woff2","./fonts/baloo-2-700.woff2","./fonts/baloo-2-800.woff2","./fonts/nunito-600.woff2","./fonts/nunito-700.woff2","./fonts/nunito-800.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return; /* the online translator is never touched */
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;}).catch(()=>null);
    return hit||(await net)||(await c.match("./index.html"));
  }));
});
