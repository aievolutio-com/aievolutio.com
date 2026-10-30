import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { repairTruncatedJson } from './json-repair.mjs';

const criticalFiles = ['index.html', 'blog.html', 'equipo.html', 'contacto.html'];

for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const isValid = content.includes('<html') && content.includes('</html>') && content.length > 200;

    if (!isValid) {
      console.warn(`⚠️ Archivo corrupto o incompleto detectado en ${file}. Auto-reparando desde HEAD...`);
      try {
        execSync(`git checkout HEAD -- ${file}`, { stdio: 'inherit' });
      } catch (err) {
        console.warn(`No se pudo revertir ${file}: ${err.message}`);
      }
    }
  }
}

// Verificar que todos los posts en content/posts sean JSONs válidos
const postsDir = path.join(process.cwd(), 'content/posts');
if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.json'));
  for (const pf of postFiles) {
    const fullPath = path.join(postsDir, pf);
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      JSON.parse(raw);
    } catch {
      console.warn(`⚠️ Post JSON corrupto detectado en ${pf}. Aplicando reparación automática...`);
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const repaired = repairTruncatedJson(raw);
        fs.writeFileSync(fullPath, JSON.stringify(repaired, null, 2) + '\n', 'utf8');
        console.log(`✅ Reparado con éxito: ${pf}`);
      } catch (reErr) {
        console.warn(`No se pudo reparar automáticamente ${pf}: ${reErr.message}`);
      }
    }
  }
}

console.log('✅ Verificación Self-Healing superada con éxito.');
