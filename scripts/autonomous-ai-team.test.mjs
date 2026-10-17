import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCandidatePostDate,
  parseJsonResponse,
  buildArchitectPatchPrompt,
  stripHtmlTags,
  validateAllowedPatch,
  validateCiWorkflow,
  validateSiteContent,
  transientRetryDelayMs,
  remoteRefExists,
} from './autonomous-ai-team.mjs';

const originalPost = {
  type: 'post',
  title: 'Publicado',
  date: '2025-10-05',
  body: 'Texto existente.',
};
const generatedPost = {
  type: 'post',
  title: 'Nuevo',
  date: '2026-07-20',
  author: 'AILitterae',
  body: 'Texto nuevo.',
};
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
    navigation: [
      { id: 'blog', href: '#blog' },
      { id: 'contact', href: 'contacto.html' },
    ],
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
  assert.throws(() => parseJsonResponse('{'), /Vertex AI devolvió JSON no válido:.*Respuesta: \{/);
});

test('removes HTML tags while preserving the article text', () => {
  assert.equal(stripHtmlTags('<p>Una idea <strong>útil</strong>.</p>'), 'Una idea útil.');
});

test('allows only the explicit website patch paths', () => {
  assert.doesNotThrow(() =>
    validateAllowedPatch(
      ['diff --git a/styles/main.css b/styles/main.css', '--- a/styles/main.css', '+++ b/styles/main.css'].join('\n'),
    ),
  );
  assert.throws(
    () => validateAllowedPatch(['diff --git a/blog.html b/blog.html', '--- a/blog.html', '+++ b/blog.html'].join('\n')),
    /rutas no autorizadas/,
  );
  assert.throws(
    () =>
      validateAllowedPatch(
        [
          'diff --git a/.github/workflows/autonomous-ai-team.yml b/.github/workflows/autonomous-ai-team.yml',
          '--- a/.github/workflows/autonomous-ai-team.yml',
          '+++ b/.github/workflows/autonomous-ai-team.yml',
        ].join('\n'),
      ),
    /rutas no autorizadas/,
  );
  assert.throws(
    () => validateAllowedPatch(['diff --git a/scripts/prerender-site.mjs b/scripts/prerender-site.mjs'].join('\n')),
    /rutas no autorizadas/,
  );
  assert.throws(
    () => validateAllowedPatch(['diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml'].join('\n')),
    /rutas no autorizadas/,
  );
  assert.throws(
    () =>
      validateAllowedPatch(
        ['diff --git a/scripts/app.js b/scripts/app.js', 'old mode 100644', 'new mode 100755'].join('\n'),
      ),
    /no puede crear, borrar, renombrar/,
  );
  assert.throws(
    () =>
      validateAllowedPatch(
        [
          'diff --git a/content/content.es.json b/content/content.es.json',
          '--- a/content/content.es.json',
          '+++ b/content/content.es.json',
        ].join('\n'),
      ),
    /rutas no autorizadas/,
  );
});

test('keeps architect prompts compact and limits patches to CSS and navigation', () => {
  const longArticleBody = 'Contenido privado al prompt '.repeat(1000);
  const content = createContent();
  content.sections[1].blocks[0].body = longArticleBody;
  const prompt = buildArchitectPatchPrompt(
    {
      'styles/main.css': 'body { color: black; }',
      'content/navigation.json': '[]',
    },
    content,
    {
      title: generatedPost.title,
      date: generatedPost.date,
      body: longArticleBody,
    },
    [],
  );

  assert.match(prompt, /styles\/main\.css, content\/navigation\.json/);
  assert.doesNotMatch(prompt, /Contenido privado al prompt/);
  assert.doesNotMatch(prompt, /content\/content\.es\.json/);
  assert.match(prompt, /menos de 50 líneas/);
  assert.match(prompt, /patch vacío/);
});

test('recognizes only the exact remote candidate branch ref', () => {
  assert.equal(remoteRefExists(`abc123\trefs/heads/ai/daily-evolution/test`, 'ai/daily-evolution/test'), true);
  assert.equal(remoteRefExists(`abc123\trefs/heads/ai/daily-evolution/test-extra`, 'ai/daily-evolution/test'), false);
  assert.equal(remoteRefExists('', 'ai/daily-evolution/test'), false);
});

test('backs off for transient Vertex errors and honors Retry-After', () => {
  const response = (retryAfter) => ({
    headers: { get: () => retryAfter },
  });
  assert.equal(transientRetryDelayMs(response(null), 0), 10_000);
  assert.equal(transientRetryDelayMs(response(null), 1), 20_000);
  assert.equal(transientRetryDelayMs(response('3'), 0), 3_000);
  assert.equal(transientRetryDelayMs(response('120'), 0), 60_000);
});

test('preserves required CI validation, deploy, and promotion steps', () => {
  const validWorkflow = [
    'run: npm run build:site',
    'run: bash scripts/validate-filenames.sh',
    'run: npm run lint:js',
    'run: node --test scripts/*.test.mjs',
    'run: npm run lint:css',
    'run: npm run lint:html',
    'uses: lycheeverse/lychee-action@v2',
    'args: --verbose .',
    'run: npm ci',
    'run: npm run a11y',
    'run: npm run lhci:ci',
    '  deploy-validated:',
    'name: Verify main commit was merged through a pull request',
    'listPullRequestsAssociatedWithCommit',
    'persist-credentials: false',
    '  publish-ai-evolution:',
    'needs: check',
    'uses: peaceiris/actions-gh-pages@v4',
    'name: Promote deployed candidate to pre',
    'force: false',
  ].join('\n');
  assert.doesNotThrow(() => validateCiWorkflow(validWorkflow));
  assert.throws(
    () => validateCiWorkflow(validWorkflow.replace('run: npm run a11y', 'run: echo skipped')),
    /controles obligatorios/,
  );
  assert.throws(
    () => validateCiWorkflow(validWorkflow.replace('listPullRequestsAssociatedWithCommit', '')),
    /controles obligatorios/,
  );
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
