// Assembles src/*.html with the shared header and footer into public/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, cpSync } from "node:fs";

const head = readFileSync("partials/head.html", "utf8");
const foot = readFileSync("partials/foot.html", "utf8");
rmSync("public", { recursive: true, force: true });
mkdirSync("public/assets", { recursive: true });

cpSync("assets", "public/assets", { recursive: true, filter: src => !src.endsWith("credits.json") });

for (const f of readdirSync("src")) {
  if (f.endsWith(".js")) { copyFileSync("src/" + f, "public/assets/" + f); continue; }
  if (!f.endsWith(".html")) continue;
  const body = readFileSync("src/" + f, "utf8");
  const m = body.match(/^<!-- title: (.*?) \| nav:\s*(.*?)\s*\| scripts:\s*(.*?)\s*-->\n/);
  if (!m) throw new Error("Missing header comment in " + f);
  const [, title, nav, scripts] = m;
  const page = f.replace(".html", "");
  const fullTitle = page === "index" ? "Riverbend Fall Classic — 12U & 14U baseball, Nov 7–8 (demo)" : title + " — Riverbend Fall Classic (demo)";
  const preload = page === "index" ? '<link rel="preload" as="image" href="/assets/img/park-dusk-1200.webp" imagesrcset="/assets/img/park-dusk-1200.webp 1200w, /assets/img/park-dusk-2400.webp 2400w" imagesizes="100vw">\n' : "";
  let h = head.replace("{{TITLE}}", fullTitle).replace("{{PAGE}}", page).replace("{{SUB}}", page === "index" ? "" : " page-sub").replace("{{PRELOAD}}", preload);
  for (const n of ["register", "bracket", "fields", "admin"]) {
    h = h.replace("{{NAV_" + n + "}}", n === nav ? ' aria-current="page"' : "");
  }
  const tags = scripts.split(",").map(s => s.trim()).filter(Boolean)
    .map(s => '<script src="/assets/' + s + '"></script>').join("\n");
  const map = readFileSync("partials/map.svg", "utf8");
  writeFileSync("public/" + f, h + body.slice(m[0].length).replaceAll("{{MAP}}", map) + foot.replace("{{SCRIPTS}}", tags));
}
// Version every asset URL so a new deploy is never served from a stale browser cache.
const ver = Date.now().toString(36);
const stamp = t => t.replace(/\/assets\/[A-Za-z0-9_./-]+\.(?:webp|mp4|webm|woff2|jpg|png|css|js)/g, m => m + "?v=" + ver);
for (const f of readdirSync("public")) if (f.endsWith(".html")) writeFileSync("public/" + f, stamp(readFileSync("public/" + f, "utf8")));
writeFileSync("public/assets/style.css", stamp(readFileSync("public/assets/style.css", "utf8")));
console.log("built public/ (assets v=" + ver + ")");
