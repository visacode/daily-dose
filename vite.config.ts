import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function serviceWorker(): Plugin {
  return {
    name: "daily-dose-service-worker",
    apply: "build",
    closeBundle() {
      const dist = path.resolve("dist");
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name !== "sw.js") files.push(full);
        }
      };
      walk(dist);
      const urls = files.map((file) => `/daily-dose/${path.relative(dist, file).split(path.sep).join("/")}`);
      const version = createHash("sha256").update(urls.join("\n")).digest("hex").slice(0, 12);
      const source = `const CACHE="daily-dose-${version}";
const SHELL=${JSON.stringify(urls)};
self.addEventListener("install",(event)=>{event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener("activate",(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
async function networkFirst(request){const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response&&response.ok)cache.put(request,response.clone());return response;}catch(error){const cached=await cache.match(request);if(cached)return cached;throw error;}}
self.addEventListener("fetch",(event)=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin||!url.pathname.startsWith("/daily-dose/"))return;if(url.pathname.includes("/data/")&&url.pathname.endsWith(".json")){event.respondWith(networkFirst(event.request));return;}if(event.request.mode==="navigate"){event.respondWith(networkFirst(event.request).catch(()=>caches.match("/daily-dose/index.html")));return;}event.respondWith(caches.match(event.request).then((hit)=>hit||fetch(event.request)));});
`;
      fs.writeFileSync(path.join(dist, "sw.js"), source);
    },
  };
}

// GitHub Pages project site: https://visacode.github.io/daily-dose/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: "/daily-dose/",
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
  build: { outDir: "dist", assetsDir: "assets", sourcemap: false },
});
