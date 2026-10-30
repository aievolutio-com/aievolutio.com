import fs from 'fs';
import { execSync } from 'child_process';

const criticalFiles = ['index.html', 'blog.html', 'equipo.html', 'contacto.html'];

for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const isValid = content.includes('<html') && content.includes('</html>') && content.length > 200;
    
    if (!isValid) {
      console.warn(`⚠️ Archivo corrupto o incompleto detectado en ${file}. Auto-reparando desde HEAD...`);
      execSync(`git checkout HEAD -- ${file}`);
    }
  }
}
console.log("🛡️ Verificación Self-Healing superada.");