import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { repairTruncatedJson } from "./json-repair.mjs";

const criticalFiles = ["index.html", "blog.html", "equipo.html", "contacto.html", "archivo.html"];

for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf8");
    const isValid =
      content.includes("<html") && content.includes("</html>") && content.length > 200;

    if (!isValid) {
      console.warn(
        `⚠️ Archivo corrupto o incompleto detectado en ${file}. Auto-reparando desde HEAD...`,
      );
      try {
        execSync(`git checkout HEAD -- ${file}`, { stdio: "inherit" });
      } catch (err) {
        console.warn(`No se pudo revertir ${file}: ${err.message}`);
      }
    }
  }
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a, b) {
  const stopWords = new Set([
    "de",
    "la",
    "el",
    "en",
    "y",
    "a",
    "los",
    "las",
    "un",
    "una",
    "para",
    "con",
    "por",
    "como",
    "tu",
    "su",
    "del",
    "al",
    "que",
    "mas",
    "sin",
  ]);
  const tokensA = new Set(
    normalizeText(a)
      .split(" ")
      .filter((w) => w.length > 2 && !stopWords.has(w)),
  );
  const tokensB = new Set(
    normalizeText(b)
      .split(" ")
      .filter((w) => w.length > 2 && !stopWords.has(w)),
  );
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Verificar que todos los posts en content/posts sean JSONs válidos y SIN DUPLICADOS
const postsDir = path.join(process.cwd(), "content/posts");
if (fs.existsSync(postsDir)) {
  const postFiles = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".json"))
    .sort(); // Orden cronológico ascendente (el más antiguo primero es el canónico)

  const seenSlugs = new Map();
  const seenTitles = [];

  for (const pf of postFiles) {
    const fullPath = path.join(postsDir, pf);
    let post = null;
    try {
      const raw = fs.readFileSync(fullPath, "utf8");
      post = JSON.parse(raw);
    } catch {
      console.warn(`⚠️ Post JSON corrupto detectado en ${pf}. Aplicando reparación automática...`);
      try {
        const raw = fs.readFileSync(fullPath, "utf8");
        post = repairTruncatedJson(raw);
        fs.writeFileSync(fullPath, JSON.stringify(post, null, 2) + "\n", "utf8");
        console.log(`✅ Reparado con éxito: ${pf}`);
      } catch (reErr) {
        console.warn(`No se pudo reparar automáticamente ${pf}: ${reErr.message}`);
        continue;
      }
    }

    if (!post || !post.title) continue;

    const slug = String(post.slug || "")
      .trim()
      .toLowerCase();
    const normTitle = normalizeText(post.title);

    let duplicateReason = null;
    if (slug && seenSlugs.has(slug)) {
      duplicateReason = `slug duplicado "${slug}" (original en ${seenSlugs.get(slug)})`;
    } else {
      for (const prev of seenTitles) {
        const sim = titleSimilarity(post.title, prev.title);
        if (normTitle === prev.normTitle || sim >= 0.65) {
          duplicateReason = `título duplicado/clonado (similitud ${(sim * 100).toFixed(0)}% con ${prev.file})`;
          break;
        }
      }
    }

    if (duplicateReason) {
      console.warn(
        `🛑 [Guardián Adversarial] Eliminando artículo duplicado ${pf}: ${duplicateReason}`,
      );
      fs.unlinkSync(fullPath);
      continue;
    }

    if (slug) seenSlugs.set(slug, pf);
    seenTitles.push({ file: pf, title: post.title, normTitle });
  }
}

console.log("✅ Verificación Self-Healing y Guardián Adversarial superados con éxito.");
