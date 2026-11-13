import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { repairTruncatedJson } from "./json-repair.mjs";

const criticalFiles = [
  "index.html",
  "diagnostico.html",
  "calculadora.html",
  "blog.html",
  "equipo.html",
  "contacto.html",
  "archivo.html",
];
const recoveryRoot = path.join(process.cwd(), "docs/recovery");
const recoveryRun = new Date().toISOString().replaceAll(":", "-");
const recoveryCounts = { restored: 0, repaired: 0, quarantined: 0 };
let unresolvedIssues = false;

function archiveFile(filePath, category) {
  const archiveDirectory = path.join(recoveryRoot, recoveryRun, category);
  fs.mkdirSync(archiveDirectory, { recursive: true });

  const parsedPath = path.parse(path.basename(filePath));
  let destination = path.join(archiveDirectory, parsedPath.base);
  let suffix = 1;
  while (fs.existsSync(destination)) {
    destination = path.join(archiveDirectory, `${parsedPath.name}-${suffix}${parsedPath.ext}`);
    suffix++;
  }

  fs.copyFileSync(filePath, destination);
  return destination;
}

function quarantineFile(filePath, category) {
  const archivePath = archiveFile(filePath, category);
  fs.unlinkSync(filePath);
  recoveryCounts.quarantined++;
  console.warn(`Archivo apartado en ${path.relative(process.cwd(), archivePath)}`);
}

function isValidHtml(content) {
  return Boolean(
    content && content.includes("<html") && content.includes("</html>") && content.length > 200,
  );
}

for (const file of criticalFiles) {
  const currentContent = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (!isValidHtml(currentContent)) {
    try {
      const restoredContent = execFileSync("git", ["show", `HEAD:${file}`], {
        encoding: "utf8",
      });
      if (!isValidHtml(restoredContent)) {
        throw new Error(`la versión de HEAD de ${file} tampoco es válida`);
      }
      if (currentContent !== null) archiveFile(file, "html");
      fs.writeFileSync(file, restoredContent, "utf8");
      recoveryCounts.restored++;
      console.warn(`HTML restaurado desde HEAD: ${file}`);
    } catch (err) {
      console.error(`No se pudo restaurar ${file}: ${err.message}`);
      unresolvedIssues = true;
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
    const raw = fs.readFileSync(fullPath, "utf8");
    try {
      post = JSON.parse(raw);
    } catch {
      try {
        post = repairTruncatedJson(raw);
        if (!post || !post.title)
          throw new Error("la reparación no produjo un artículo con título");
        const archivePath = archiveFile(fullPath, "json-repaired");
        fs.writeFileSync(fullPath, JSON.stringify(post, null, 2) + "\n", "utf8");
        recoveryCounts.repaired++;
        console.warn(
          `JSON reparado en ${pf}; original conservado en ${path.relative(process.cwd(), archivePath)}`,
        );
      } catch (repairError) {
        try {
          quarantineFile(fullPath, "json-unrecoverable");
          console.warn(`JSON irrecuperable apartado (${pf}): ${repairError.message}`);
        } catch (archiveError) {
          console.error(`No se pudo recuperar ni apartar ${pf}: ${archiveError.message}`);
          unresolvedIssues = true;
        }
        continue;
      }
    }

    if (!post || !post.title) {
      try {
        quarantineFile(fullPath, "json-invalid");
      } catch (err) {
        console.error(`No se pudo apartar ${pf}: ${err.message}`);
        unresolvedIssues = true;
      }
      continue;
    }

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
      try {
        quarantineFile(fullPath, "duplicates");
        console.warn(`Artículo duplicado apartado ${pf}: ${duplicateReason}`);
      } catch (err) {
        console.error(`No se pudo apartar el duplicado ${pf}: ${err.message}`);
        unresolvedIssues = true;
      }
      continue;
    }

    if (slug) seenSlugs.set(slug, pf);
    seenTitles.push({ file: pf, title: post.title, normTitle });
  }
}

if (unresolvedIssues) {
  console.error("La reparación automática no pudo resolver todos los problemas.");
  process.exitCode = 1;
} else {
  console.log(
    `Autorreparación completada: ${recoveryCounts.restored} HTML restaurados, ${recoveryCounts.repaired} JSON reparados, ${recoveryCounts.quarantined} archivos apartados.`,
  );
}
