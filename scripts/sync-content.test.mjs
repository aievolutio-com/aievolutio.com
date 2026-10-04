import assert from 'node:assert/strict';
import test from 'node:test';

import {
  preferSmallerLocalJpegImages,
  transformContent,
} from './sync-content.mjs';

test('prefers caption values for meta rows and preserves quote images', () => {
  const content = {
    meta: {
      siteName: '',
      tagline: '',
      language: 'es',
    },
    sections: [
      {
        id: 'vision',
        title: 'Visión',
        kind: 'text',
        blocks: [],
      },
    ],
  };

  const rows = [
    {
      section: 'meta',
      blockType: 'meta',
      field: 'siteName',
      key: 'siteName',
      value: 'siteName',
      caption: 'AIEvolutio',
    },
    {
      section: 'vision',
      blockType: 'quote',
      title: 'Quote',
      body: 'Ganar tiempo para la vida.',
      author: 'AIVISIO',
      version: 'v1',
      img: 'images/aivisio-oficina.png',
      alt: 'Foto de oficina',
    },
  ];

  const nextContent = transformContent(content, rows);

  assert.equal(nextContent.meta.siteName, 'AIEvolutio');
  assert.equal(nextContent.sections[0].blocks[0].type, 'quote');
  assert.equal(nextContent.sections[0].blocks[0].img, 'images/aivisio-oficina.png');
});

test('maps worker rows with image and cta fields', () => {
  const content = {
    meta: {},
    sections: [{ id: 'aiworkers', title: 'AIWorkers', kind: 'text', blocks: [] }],
  };

  const rows = [{
    section: 'aiworkers',
    blockType: 'worker',
    title: 'AIVisio',
    body: 'Visión y estrategia',
    img: 'images/aivisio-perfil.png',
    alt: 'Foto AIVisio',
    href: 'https://example.com',
    label: 'Probar AIVisio',
  }];

  const nextContent = transformContent(content, rows);

  assert.equal(nextContent.sections[0].blocks[0].type, 'worker');
  assert.equal(nextContent.sections[0].blocks[0].img, 'images/aivisio-perfil.png');
  assert.equal(nextContent.sections[0].blocks[0].cta, 'Probar AIVisio');
});

test('keeps existing blog posts that are not present in the sheet', () => {
  const content = {
    meta: {},
    sections: [{
      id: 'blog',
      title: 'Blog',
      blocks: [
        { type: 'post', title: 'IA y personas', body: 'Old version' },
        { type: 'post', title: 'Artículo generado', body: 'Generated text' },
      ],
    }],
  };
  const rows = [{
    section: 'blog',
    blockType: 'post',
    title: 'IA y personas',
    body: 'Updated from Sheets',
    date: '2026-07-30',
  }];

  const nextContent = transformContent(content, rows);
  const posts = nextContent.sections[0].blocks;

  assert.equal(posts.length, 2);
  assert.equal(posts[0].body, 'Updated from Sheets');
  assert.equal(posts[1].title, 'Artículo generado');
});

test('uses a smaller local JPEG variant when syncing PNG image paths', async () => {
  const content = {
    sections: [{
      blocks: [{ type: 'quote', img: 'images/aivisio-oficina.png' }],
    }],
  };

  const nextContent = await preferSmallerLocalJpegImages(content);

  assert.equal(nextContent.sections[0].blocks[0].img, 'images/aivisio-oficina.jpg');
});
