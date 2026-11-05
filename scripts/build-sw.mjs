import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(
    entries
      .filter((e) => !["sw.js", "_headers", "_redirects"].includes(e.name))
      .map((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : `${dir}/${e.name}`,
      ),
  );
  return paths.flat();
}
const files = await walk("dist");
// Host configuration files are consumed by Netlify, not served as public URLs.
// Include this generator in the version so worker changes also rotate the cache.
const hash = createHash("sha256");
hash.update(await readFile(new URL(import.meta.url)));
for (const file of files) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 12);
const urls = files.map((f) => "/" + f.replace(/^dist\//, ""));
// These are static, same-origin build artifacts. Ignore Vary: Origin from the preview
// server so cache.addAll requests also match module requests using crossorigin.
await writeFile(
  "dist/sw.js",
  `const CACHE='ainsworth-${version}';const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ainsworth-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(cache=>event.request.mode==='navigate'?cache.match('/index.html'):cache.match(event.request,{ignoreVary:true})).then(hit=>hit||fetch(event.request)));});
`,
);
console.log(`Offline cache ${version}: ${urls.length} files`);
