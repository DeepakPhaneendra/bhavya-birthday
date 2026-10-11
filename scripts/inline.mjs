// Packs the Vite build into one self-contained HTML page (../bhavya.html) for sharing.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "dist", "assets");
const files = readdirSync(assets);
const js = files.filter(f => f.endsWith(".js")).map(f => readFileSync(join(assets, f), "utf8")).join("\n");
const css = files.filter(f => f.endsWith(".css")).map(f => readFileSync(join(assets, f), "utf8")).join("\n");

const page = `<title>Two Minutes, Bhavya</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Caveat:wght@500;700&family=VT323&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>
`;
const out = join(root, "..", "bhavya.html");
writeFileSync(out, page);
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`);
