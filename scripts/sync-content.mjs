#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const contentFilePath = path.join(repoRoot, 'content/content.es.json');
const defaultInputPath = path.join(repoRoot, 'content/sync.example.csv');

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function getFirstNonEmpty(row, ...keys) {
  for (const key of keys) {
    const value = String(row[key] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function getMetaValue(row, fieldName) {
  const field = String(fieldName ?? '').trim();
  const candidates = [
    getFirstNonEmpty(row, 'value', 'caption', 'body', 'title', 'label'),
    getFirstNonEmpty(row, 'caption', 'value', 'body', 'title', 'label'),
  ];

  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim();
    if (!text) continue;
    if (normalize(text) === normalize(field)) continue;
    if (normalize(text) === normalize(row.key)) continue;
    if (normalize(text) === normalize(row.title)) continue;
    return text;
  }

  return '';
}

function isImagePath(value = '') {
  const text = String(value ?? '').trim();
  if (!text) return false;
  return /\.(png|jpe?g|svg|webp|gif|avif)(\?.*)?$/i.test(text)
    || text.startsWith('images/')
    || text.startsWith('/images/')
    || text.startsWith('assets/')
    || text.startsWith('/assets/');
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record = {};
      header.forEach((key, index) => {
        record[key.trim()] = (row[index] ?? '').trim();
      });
      return record;
    });
}

function buildBlock(row) {
  const blockType = normalize(row.blockType || row.type || 'card');
  const title = getFirstNonEmpty(row, 'title', 'label', 'body');
  const imageCandidate = getFirstNonEmpty(row, 'img', 'src', 'alt');
  const imagePath = isImagePath(imageCandidate) ? imageCandidate : '';
  const altText = getFirstNonEmpty(row, 'alt', 'title', 'label');
  const payload = {
    type: blockType,
    title,
    body: row.body || '',
  };

  if (blockType === 'card') {
    return {
      type: 'card',
      title,
      body: row.body || '',
      img: imagePath,
      alt: altText || title || '',
    };
  }

  if (blockType === 'worker') {
    return {
      type: 'worker',
      title,
      body: row.body || '',
      img: imagePath,
      alt: altText || title || '',
      href: getFirstNonEmpty(row, 'href', 'src', 'link'),
      cta: getFirstNonEmpty(row, 'label', 'field', 'title'),
    };
  }

  if (blockType === 'post') {
    return {
      type: 'post',
      title,
      date: row.date || '',
      body: row.body || '',
    };
  }

  if (blockType === 'event') {
    return {
      type: 'event',
      title,
      date: row.date || '',
      body: row.body || '',
    };
  }

  if (blockType === 'p') {
    return {
      type: 'p',
      body: row.body || '',
    };
  }

  if (blockType === 'quote') {
    return {
      type: 'quote',
      body: row.body || '',
      author: getFirstNonEmpty(row, 'author', 'alt', 'href', 'label', 'title'),
      version: row.version || '',
      img: imagePath,
      alt: altText || '',
    };
  }

  if (blockType === 'link') {
    return {
      type: 'link',
      title,
      href: getFirstNonEmpty(row, 'href', 'src', 'link'),
    };
  }

  if (blockType === 'image') {
    return {
      type: 'image',
      src: getFirstNonEmpty(row, 'src', 'img', 'alt'),
      alt: altText || '',
      caption: getFirstNonEmpty(row, 'caption', 'body', 'title'),
    };
  }

  return payload;
}

export function transformContent(content, rows) {
  const nextContent = JSON.parse(JSON.stringify(content));

  const metaRows = rows.filter((row) => normalize(row.section) === 'meta');
  metaRows.forEach((row) => {
    const field = getFirstNonEmpty(row, 'field', 'key', 'metaField', 'title').trim();
    const value = getMetaValue(row, field).trim();
    if (field && nextContent.meta && Object.prototype.hasOwnProperty.call(nextContent.meta, field)) {
      nextContent.meta[field] = value || nextContent.meta[field];
    }
  });

  const sectionRows = rows.filter((row) => normalize(row.section) !== 'meta');
  const groupedBySection = Object.groupBy(sectionRows, (row) => normalize(row.section));

  Object.entries(groupedBySection).forEach(([sectionName, entries]) => {
    const section = nextContent.sections.find((item) => normalize(item.id) === sectionName || normalize(item.title) === sectionName);
    if (!section) return;
    section.blocks = (entries || []).map((entry) => buildBlock(entry));
  });

  return nextContent;
}

async function readInput(source) {
  if (!source) {
    throw new Error('No source provided. Set SHEET_CSV_URL or pass --source.');
  }

  const isUrl = /^https?:\/\//i.test(source);
  if (isUrl) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  const inputPath = path.isAbsolute(source) ? source : path.join(repoRoot, source);
  return readFile(inputPath, 'utf8');
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const args = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === '--source' && rawArgs[index + 1]) {
      args['--source'] = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--source=')) {
      args['--source'] = arg.slice('--source='.length);
    } else if (arg === '--output' && rawArgs[index + 1]) {
      args['--output'] = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--output=')) {
      args['--output'] = arg.slice('--output='.length);
    } else if (!arg.startsWith('--')) {
      args['--source'] = arg;
    }
  }

  const source = args['--source'] || process.env.SHEET_CSV_URL || process.env.SYNC_CSV_URL || defaultInputPath;
  const outputPath = args['--output'] || contentFilePath;

  let contentText;
  try {
    contentText = await readInput(source);
  } catch (error) {
    if (source === defaultInputPath) {
      console.warn(`Using fallback content file because no source was provided: ${error.message}`);
      return;
    }
    throw error;
  }

  const currentContent = JSON.parse(await readFile(contentFilePath, 'utf8'));
  const rows = parseCsv(contentText);
  const nextContent = transformContent(currentContent, rows);

  const output = JSON.stringify(nextContent, null, 2) + '\n';
  const outputFilePath = path.isAbsolute(outputPath) ? outputPath : path.join(repoRoot, outputPath);
  await writeFile(outputFilePath, output, 'utf8');
  console.log(`Updated ${path.relative(repoRoot, outputFilePath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
