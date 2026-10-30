/**
 * json-repair.mjs
 * Módulo de auto-reparación de JSON truncado para garantizar tolerancia a fallos
 * absoluta en la comunicación con LLMs (Vertex AI / Gemini).
 */

export function repairTruncatedJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }

  // 1. Eliminar bloques de código markdown si existen
  let text = rawText.trim();
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  } else if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/```$/, '').trim();
  }

  // 2. Extraer desde la primera '{' o '['
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  text = text.slice(startIdx);

  // Intento directo
  try {
    return JSON.parse(text);
  } catch (initialErr) {
    // Continuar con reparación
  }

  // 3. Limpieza de caracteres de control ilegales dentro de strings
  // Reemplazar saltos de línea reales dentro de strings por \n si es necesario
  // Rastreamos estado sintáctico
  let inString = false;
  let escape = false;
  const stack = [];
  let cleanText = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
        cleanText += char;
      } else if (char === '\\') {
        escape = true;
        cleanText += char;
      } else if (char === '"') {
        inString = false;
        cleanText += char;
      } else if (char === '\n') {
        cleanText += '\\n';
      } else if (char === '\r') {
        cleanText += '\\r';
      } else if (char === '\t') {
        cleanText += '\\t';
      } else {
        cleanText += char;
      }
    } else {
      if (char === '"') {
        inString = true;
        cleanText += char;
      } else if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
        cleanText += char;
      } else if (char === '}' || char === ']') {
        if (stack.length && stack[stack.length - 1] === char) {
          stack.pop();
        }
        cleanText += char;
      } else {
        cleanText += char;
      }
    }
  }

  // 4. Si terminó dentro de un string, cerrar la comilla
  if (inString) {
    // Si la comilla estaba escapada o terminó abruptamente, cerramos la comilla
    cleanText += '"';
  }

  // 5. Eliminar comas huérfanas antes de cierres o al final
  cleanText = cleanText.replace(/,\s*([}\]])/g, '$1');
  cleanText = cleanText.replace(/,\s*$/, '');

  // 6. Cerrar todos los bloques pendientes en el stack
  while (stack.length > 0) {
    const closingChar = stack.pop();
    cleanText += closingChar;
  }

  // 7. Segundo intento de parseo
  try {
    return JSON.parse(cleanText);
  } catch (secondErr) {
    // 8. Si aún falla por comas o tokens a medio escribir al final (ej: "prop": val...)
    // recortar hacia atrás hasta la última coma o cierre válido
    let trimmed = cleanText;
    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma > 0) {
      const candidate = trimmed.slice(0, lastComma);
      // recalcular cierres necesarios para candidate
      let s2 = [];
      let inS2 = false;
      let esc2 = false;
      for (let i = 0; i < candidate.length; i++) {
        const c = candidate[i];
        if (inS2) {
          if (esc2) esc2 = false;
          else if (c === '\\') esc2 = true;
          else if (c === '"') inS2 = false;
        } else {
          if (c === '"') inS2 = true;
          else if (c === '{') s2.push('}');
          else if (c === '[') s2.push(']');
          else if (c === '}' || c === ']') s2.pop();
        }
      }
      let fixedCandidate = candidate + s2.reverse().join('');
      try {
        return JSON.parse(fixedCandidate);
      } catch (e3) {
        // Fallback final: extracción basada en Regex para objetos esperados
      }
    }
    throw new Error(`No se pudo reparar el JSON: ${secondErr.message}`);
  }
}

/**
 * Extrae campos seguros si la reparación completa fallara
 */
export function extractFieldsFallback(text) {
  const result = {};
  const titleMatch = text.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (titleMatch) result.title = titleMatch[1].replace(/\\"/g, '"');

  const slugMatch = text.match(/"slug"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (slugMatch) result.slug = slugMatch[1];

  const authorMatch = text.match(/"author"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (authorMatch) result.author = authorMatch[1];

  const categoryMatch = text.match(/"category"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (categoryMatch) result.category = categoryMatch[1];

  const excerptMatch = text.match(/"excerpt"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (excerptMatch) result.excerpt = excerptMatch[1].replace(/\\"/g, '"');

  const bodyMatch = text.match(/"body"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (bodyMatch) result.body = bodyMatch[1].replace(/\\"/g, '"');

  return result;
}
