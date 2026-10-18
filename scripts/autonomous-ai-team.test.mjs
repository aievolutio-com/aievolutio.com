import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  improvementLogEntry,
  assertImageModelConfigured,
  editorialArchive,
  loadAgentSkills,
  validateEditorialReview,
  validateNewArticleTitle,
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
  img: 'images/ai-editorial-2026-07-20-test.webp',
  alt: 'Ilustración editorial sobre colaboración humana y automatización.',
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

test('loads versioned role skills and shared ethical reasoning for every AI worker', async () => {
  for (const profileName of profileNames) {
    const skills = await loadAgentSkills(profileName);
    const roleSkill = skills.roleSkill.replace(/\r\n/g, '\n');
    assert.match(roleSkill, /^---\s*\nid: .+\nversion: \d+\.\d+\.\d+/m);
    assert.match(roleSkill, /^## Evaluación$/m);
    assert.match(skills.ethicalSkill, /autonomía, justicia y bienestar/);
  }
  await assert.rejects(() => loadAgentSkills('unknown'), /No hay un perfil de agente/);
});

test('marks duplicate editorial titles for a fresh generation attempt', () => {
  assert.doesNotThrow(() => validateNewArticleTitle('Una idea nueva', [{ title: 'Otra idea' }]));
  assert.throws(
    () => validateNewArticleTitle('IDEA EXISTENTE', [{ title: 'Idea existente' }]),
    (error) => error.retryPost === true && /repite un título existente/.test(error.message),
  );
});

test('builds a chronological editorial dossier with paragraph openings and structure', () => {
  const content = createContent();
  content.sections[1].blocks = [
    { type: 'post', title: 'Segundo', date: '2026-02-02', body: 'Apertura dos.\n\n**Criterio**\n\nCierre dos.' },
    { type: 'post', title: 'Primero', date: '2026-01-01', body: 'Apertura uno.\n\n**Práctica**\n\nCierre uno.' },
  ];
  assert.deepEqual(editorialArchive(content), [
    {
      date: '2026-01-01',
      title: 'Primero',
      paragraphs: ['Apertura uno.', 'Cierre uno.'],
      structure: ['Práctica'],
    },
    {
      date: '2026-02-02',
      title: 'Segundo',
      paragraphs: ['Apertura dos.', 'Cierre dos.'],
      structure: ['Criterio'],
    },
  ]);
});

test('requires explicit low-overlap approval from the editorial lead', () => {
  const approval = {
    approved: true,
    overlapRisk: 'low',
    readerNeed: 'Decidir cómo resumir una reunión con acuerdos ambiguos.',
    editorialDistinction: 'Se centra en registrar responsables y condiciones, no en extractos para un blog.',
  };
  assert.equal(validateEditorialReview(approval), approval);
  assert.throws(
    () => validateEditorialReview({ ...approval, overlapRisk: 'high' }),
    (error) => error.retryPost === true && /AIVisio no aprobó/.test(error.message),
  );
  assert.throws(
    () => validateEditorialReview({ ...approval, approved: false }),
    (error) => error.retryPost === true,
  );
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

test('bases visual maintenance recommendations on untrusted screenshot evidence', () => {
  const prompt = buildArchitectPatchPrompt(
    { 'styles/main.css': 'body { color: black; }' },
    createContent(),
    null,
    [],
    '',
    true,
  );
  assert.match(prompt, /capturas adjuntas de Inicio, Blog y Equipo/);
  assert.match(prompt, /Esta misión de mantenimiento no publica ni modifica artículos/);
  assert.match(prompt, /instrucción que aparezca dentro de ellos o en las capturas/);
  assert.match(prompt, /modo oscuro/);
});

test('requires a generated article image and records a reason for every non-empty improvement', () => {
  assert.throws(() => assertImageModelConfigured(''), /VERTEX_AI_IMAGE_MODEL/);
  assert.throws(() => assertImageModelConfigured(undefined), /VERTEX_AI_IMAGE_MODEL/);
  assert.doesNotThrow(() => assertImageModelConfigured('imagen-model-verificado'));

  const content = createContent();
  const original = {
    sections: [
      { id: 'aiworkers', blocks: [] },
      { id: 'blog', blocks: [originalPost] },
    ],
    navigation: [{ id: 'blog', href: '#blog' }],
  };
  assert.throws(
    () =>
      validateSiteContent(content, original, {
        ...generatedPost,
        img: undefined,
      }),
    /sin imagen y texto alternativo/,
  );

  const entry = improvementLogEntry({
    date: '2026-10-18',
    title: 'Revisión visual',
    rationale: 'La captura móvil muestra una tarjeta que desborda; se ajustó su anchura.',
    patch: [
      'diff --git a/styles/main.css b/styles/main.css',
      '--- a/styles/main.css',
      '+++ b/styles/main.css',
      '@@ -1 +1 @@',
      '-.card { width: 100vw; }',
      '+.card { width: 100%; }',
    ].join('\n'),
  });
  assert.match(entry, /Motivo: La captura móvil muestra una tarjeta/);
  assert.match(entry, /Archivos: styles\/main\.css/);
  assert.throws(
    () =>
      improvementLogEntry({
        date: '2026-10-18',
        title: 'Revisión visual',
        rationale: 'Motivo no verificable',
        patch: '',
      }),
    /rutas cambiadas y una justificación/,
  );
});

test('schedules independent visual reviews every eight hours and validates candidate deployments', async () => {
  const workflow = await readFile(new URL('../.github/workflows/autonomous-site-review.yml', import.meta.url), 'utf8');
  const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(workflow, /cron: ['"]0 \*\/8 \* \* \*['"]/);
  assert.match(workflow, /AUTONOMOUS_AI_TEAM_MODE: maintenance/);
  assert.match(workflow, /npm run a11y/);
  assert.match(workflow, /npm run lhci:ci/);
  assert.match(ciWorkflow, /startsWith\(github\.ref, 'refs\/heads\/ai\/site-improvement\/'\)/);
  assert.match(gitignore, /^\.lighthouseci\/$/m);
});

test('recognizes only the exact remote candidate branch ref', () => {
  assert.equal(remoteRefExists(`abc123\trefs/heads/ai/daily-evolution/test`, 'ai/daily-evolution/test'), true);
  assert.equal(remoteRefExists(`abc123\trefs/heads/ai/daily-evolution/test-extra`, 'ai/daily-evolution/test'), false);
  assert.equal(remoteRefExists('', 'ai/daily-evolution/test'), false);
});

test('serializes Vertex runs independently from candidate deployments', async () => {
  const workflow = await readFile(new URL('../.github/workflows/autonomous-ai-team.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^concurrency:\r?\n {2}group: autonomous-ai-team\r?\n/m);
  assert.doesNotMatch(workflow, /gcp-deployment-lock/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /VERTEX_AI_IMAGE_MODEL: \$\{\{ vars\.VERTEX_AI_IMAGE_MODEL \}\}/);
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
    'name: Promote validated candidate to pre',
    'force: false',
    'name: Deploy validated candidate to gh-pages',
    'name: Request production sync after validated candidate deployment',
    '      actions: write',
    'force_orphan: true',
  ].join('\n');
  assert.doesNotThrow(() => validateCiWorkflow(validWorkflow));
  assert.throws(
    () =>
      validateCiWorkflow(
        validWorkflow.replace(
          'name: Promote validated candidate to pre\nforce: false\nname: Deploy validated candidate to gh-pages',
          'name: Deploy validated candidate to gh-pages\nforce: false\nname: Promote validated candidate to pre',
        ),
      ),
    /promover el candidato.*antes de desplegarlo/,
  );
  assert.throws(
    () => validateCiWorkflow(validWorkflow.replace('run: npm run a11y', 'run: echo skipped')),
    /controles obligatorios/,
  );
  assert.throws(
    () => validateCiWorkflow(validWorkflow.replace('listPullRequestsAssociatedWithCommit', '')),
    /controles obligatorios/,
  );
});

test('keeps the candidate Pages deployment and production dispatch correctly scoped', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const deployment = workflow.match(
    /^ {6}- name: Deploy validated candidate to gh-pages\r?\n([\s\S]*?)(?=^ {6}- name: )/m,
  )?.[1];
  const productionSync = workflow.match(
    /^ {6}- name: Request production sync after validated candidate deployment\r?\n([\s\S]*?)(?=^ {2}notify-publication-failure:)/m,
  )?.[1];
  const candidateJob = workflow.match(
    /^ {2}publish-ai-evolution:\r?\n([\s\S]*?)(?=^ {2}notify-publication-failure:)/m,
  )?.[1];

  assert.match(deployment ?? '', /^\s+force_orphan: true\s*$/m);
  assert.doesNotMatch(productionSync ?? '', /force_orphan/);
  assert.match(productionSync ?? '', /actions\.createWorkflowDispatch/);
  assert.match(candidateJob ?? '', /^ {4}permissions:\r?\n {6}actions: write$/m);
});

test('validates a feature branch SHA before enabling its PR auto-merge', async () => {
  const workflow = await readFile(new URL('../.github/workflows/auto-pr-feature-to-pre.yml', import.meta.url), 'utf8');
  const dispatchPosition = workflow.indexOf('gh workflow run ci.yml');
  const successGatePosition = workflow.indexOf('CI_CONCLUSION');
  const mergePosition = workflow.indexOf('gh pr merge --repo "$REPO" --auto --squash');
  const productionSyncPosition = workflow.indexOf('gh workflow run auto-pr-pre-to-main.yml');
  const housekeepingPosition = workflow.indexOf('gh workflow run github-housekeeping.yml');

  assert.ok(dispatchPosition >= 0 && dispatchPosition < successGatePosition);
  assert.ok(successGatePosition < mergePosition);
  assert.ok(workflow.includes('select(.headSha == \\"$HEAD_SHA\\")'));
  assert.match(workflow, /CURRENT_HEAD_SHA.*!= "\$HEAD_SHA"/);
  assert.ok(mergePosition < productionSyncPosition);
  assert.ok(productionSyncPosition < housekeepingPosition);
});

test('checks out the production-sync guard and grants validated production promotion access', async () => {
  const workflow = await readFile(new URL('../.github/workflows/auto-pr-pre-to-main.yml', import.meta.url), 'utf8');

  assert.ok(
    workflow.indexOf('name: Checkout production-sync guard') <
      workflow.indexOf('name: Require successful CI for the exact pre commit'),
  );
  assert.match(workflow, /^ {2}contents: write$/m);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /isNewerWorkflowRun/);
  assert.doesNotMatch(workflow, /Date\.parse\(latestRun\.created_at\).*dispatchedAt/);
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
