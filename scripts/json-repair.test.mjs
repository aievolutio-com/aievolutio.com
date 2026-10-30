import test from 'node:test';
import assert from 'node:assert/strict';
import { repairTruncatedJson, extractFieldsFallback } from './json-repair.mjs';

test('repairTruncatedJson repara JSON válido intacto', () => {
  const input = '{"title": "Hola mundo", "active": true}';
  const parsed = repairTruncatedJson(input);
  assert.equal(parsed.title, 'Hola mundo');
  assert.equal(parsed.active, true);
});

test('repairTruncatedJson repara JSON envuelto en markdown', () => {
  const input = '```json\n{"title": "En markdown", "list": [1, 2]}\n```';
  const parsed = repairTruncatedJson(input);
  assert.equal(parsed.title, 'En markdown');
  assert.deepEqual(parsed.list, [1, 2]);
});

test('repairTruncatedJson repara JSON truncado dentro de un string', () => {
  // Caso típico de Vertex AI truncado por límite de tokens
  const input = '{"title": "Automatización con SLM", "body": "En este artículo explicamos cómo las PYMEs pueden usar modelos pequ';
  const parsed = repairTruncatedJson(input);
  assert.equal(parsed.title, 'Automatización con SLM');
  assert.ok(parsed.body.startsWith('En este artículo'));
});

test('repairTruncatedJson repara JSON truncado con comas colgantes y arrays anidados', () => {
  const input = '{"title": "Guía", "tags": ["ia", "pyme",';
  const parsed = repairTruncatedJson(input);
  assert.equal(parsed.title, 'Guía');
  assert.ok(Array.isArray(parsed.tags));
});

test('extractFieldsFallback extrae campos por regex si todo falla', () => {
  const input = 'random text before {"title": "Título Seguro", "slug": "titulo-seguro", "author": "AIDux"} junk after';
  const extracted = extractFieldsFallback(input);
  assert.equal(extracted.title, 'Título Seguro');
  assert.equal(extracted.slug, 'titulo-seguro');
  assert.equal(extracted.author, 'AIDux');
});
