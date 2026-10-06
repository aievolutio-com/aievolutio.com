import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCandidatePostDate,
  parseJsonResponse,
  validateAllowedPatch,
  validateSiteContent,
} from './autonomous-ai-team.mjs';

const originalPost = { type: 'post', title: 'Publicado', date: '2025-10-05', body: 'Texto existente.' };
const generatedPost = { type: 'post', title: 'Nuevo', date: '2026-07-20', author: 'AILitterae', body: 'Texto nuevo.' };
const profileNames = [
  'AIVisio',
  'AIDux',
  'AIUsus',
  'AIExperientia',
  'AIMercatus',
  'AIArchitectus',
  'AIMutatio',
  'AILitterae',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createContent() {
  return {
    sections: [
      {
        id: 'aiworkers',
        blocks: profileNames.map((title) => ({ type: 'worker', title })),
      },
      { id: 'blog', blocks: [originalPost, generatedPost] },
    ],
    navigation: [{ id: 'blog', href: '#blog' }],
  };
}

test('allows late scheduled retries but creates at most one post per Madrid date', () => {
  const content = {
    sections: [{ id: 'blog', blocks: [originalPost] }],
  };
  assert.equal(getCandidatePostDate(content, '2026-10-06'), '2026-10-06');
  assert.equal(getCandidatePostDate(content, '2025-10-05'), null);
  assert.equal(getCandidatePostDate({ sections: [] }, '2026-10-06'), '2026-10-06');
});

test('parses model JSON with unquoted keys, single quotes, and surrounding prose', () => {
  assert.deepEqual(parseJsonResponse("Respuesta:\n```json\n{decision: 'adelante', work: 'Criterio humano'}\n```"), {
    decision: 'adelante',
    work: 'Criterio humano',
  });
});

test('reports a bounded response sample when model output cannot be repaired', () => {
  assert.throws(
    () => parseJsonResponse('{decision: nope}'),
    /Vertex AI devolvió JSON no válido:.*Respuesta: \{decision: nope\}/,
  );
});

test('allows only the explicit website patch paths', () => {
  assert.doesNotThrow(() => validateAllowedPatch([
    'diff --git a/styles/main.css b/styles/main.css',
    '--- a/styles/main.css',
    '+++ b/styles/main.css',
  ].join('\n')));
  assert.doesNotThrow(() => validateAllowedPatch([
    'diff --git a/blog.html b/blog.html',
    '--- a/blog.html',
    '+++ b/blog.html',
  ].join('\n')));
  assert.throws(() => validateAllowedPatch([
    'diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml',
    '--- a/.github/workflows/ci.yml',
    '+++ b/.github/workflows/ci.yml',
  ].join('\n')), /rutas no autorizadas/);
  assert.throws(() => validateAllowedPatch([
    'diff --git a/scripts/app.js b/scripts/app.js',
    'old mode 100644',
    'new mode 100755',
  ].join('\n')), /no puede crear, borrar, renombrar/);
});

test('requires existing content, all AI profiles, navigation, and the daily post', () => {
  assert.ok(profileNames.every((name) => /^AI[A-Z][A-Za-z]+$/.test(name)));
  const content = createContent();
  const original = {
    sections: [
      { id: 'aiworkers', blocks: [] },
      { id: 'blog', blocks: [originalPost] },
    ],
    navigation: [{ id: 'blog', href: '#blog' }],
  };
  assert.doesNotThrow(() => validateSiteContent(content, original, generatedPost));

  const changedPost = clone(content);
  changedPost.sections[1].blocks[0].body = 'Reescrito.';
  assert.throws(() => validateSiteContent(changedPost, original, generatedPost), /No se puede eliminar ni reescribir/);

  const missingProfile = clone(content);
  missingProfile.sections[0].blocks.pop();
  assert.throws(() => validateSiteContent(missingProfile, original, generatedPost), /Falta conservar el perfil/);

  const missingNavigationTarget = clone(content);
  missingNavigationTarget.navigation[0].href = '#desaparecida';
  assert.throws(() => validateSiteContent(missingNavigationTarget, original, generatedPost), /no tiene sección/);

  const unsupportedNavigationPath = clone(content);
  unsupportedNavigationPath.navigation[0].href = '../otra-pagina.html';
  assert.throws(() => validateSiteContent(unsupportedNavigationPath, original, generatedPost), /página no permitida/);
});
