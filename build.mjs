// Assembles src/*.html with the shared header and footer into public/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "node:fs";

const head = readFileSync("partials/head.html", "utf8");
const foot = readFileSync("partials/foot.html", "utf8");
rmSync("public", { recursive: true, force: true });
mkdirSync("public/assets", { recursive: true });

for (const f of readdirSync("assets")) copyFileSync("assets/" + f, "public/assets/" + f);

for (const f of readdirSync("src")) {
  if (f.endsWith(".js")) { copyFileSync("src/" + f, "public/assets/" + f); continue; }
  if (!f.endsWith(".html")) continue;
  const body = readFileSync("src/" + f, "utf8");
  const m = body.match(/^<!-- title: (.*?) \| nav:\s*(.*?)\s*\| scripts:\s*(.*?)\s*-->\n/);
  if (!m) throw new Error("Missing header comment in " + f);
  const [, title, nav, scripts] = m;
  let h = head.replace("{{TITLE}}", title);
  for (const n of ["register", "bracket", "fields", "admin"]) {
    h = h.replace("{{NAV_" + n + "}}", n === nav ? ' aria-current="page"' : "");
  }
  const tags = scripts.split(",").map(s => s.trim()).filter(Boolean)
    .map(s => '<script src="/assets/' + s + '"></script>').join("\n");
  writeFileSync("public/" + f, h + body.slice(m[0].length) + foot.replace("{{SCRIPTS}}", tags));
}
console.log("built public/");
