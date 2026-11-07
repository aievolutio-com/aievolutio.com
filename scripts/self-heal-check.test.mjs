import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const checkerPath = fileURLToPath(new URL("./self-heal-check.mjs", import.meta.url));
const criticalFiles = ["index.html", "blog.html", "equipo.html", "contacto.html", "archivo.html"];

function createRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), "aievolutio-self-heal-"));
  mkdirSync(path.join(root, "content/posts"), { recursive: true });
  for (const file of criticalFiles) {
    writeFileSync(
      path.join(root, file),
      `<html><body>${"Página válida ".repeat(30)}</body></html>`,
    );
  }
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "--quiet",
      "-m",
      "baseline",
    ],
    { cwd: root },
  );
  return root;
}

function runChecker(root) {
  return execFileSync(process.execPath, [checkerPath], { cwd: root, encoding: "utf8" });
}

function findArchivedFile(root, category) {
  const runDirectories = readdirSync(path.join(root, "docs/recovery"));
  return path.join(root, "docs/recovery", runDirectories[0], category);
}

test("restores damaged HTML from HEAD and archives the damaged version", () => {
  const root = createRepository();
  try {
    const damaged = "<html>incompleto";
    writeFileSync(path.join(root, "index.html"), damaged);

    runChecker(root);

    assert.match(readFileSync(path.join(root, "index.html"), "utf8"), /Página válida/);
    assert.equal(
      readFileSync(path.join(findArchivedFile(root, "html"), "index.html"), "utf8"),
      damaged,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("repairs truncated JSON and archives the original", () => {
  const root = createRepository();
  try {
    const original =
      '{"title": "Automatización con SLM", "body": "En este artículo explicamos cómo las PYMEs pueden usar modelos pequ';
    writeFileSync(path.join(root, "content/posts", "post.json"), original);

    runChecker(root);

    const repaired = JSON.parse(readFileSync(path.join(root, "content/posts/post.json"), "utf8"));
    assert.equal(repaired.title, "Automatización con SLM");
    assert.equal(
      readFileSync(path.join(findArchivedFile(root, "json-repaired"), "post.json"), "utf8"),
      original,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("quarantines duplicate posts while preserving the original JSON", () => {
  const root = createRepository();
  try {
    const canonical = { title: "Una guía práctica para automatizar", slug: "guia-automatizar" };
    const duplicate = { ...canonical, body: "Contenido duplicado" };
    writeFileSync(path.join(root, "content/posts", "01-canonical.json"), JSON.stringify(canonical));
    writeFileSync(path.join(root, "content/posts", "02-duplicate.json"), JSON.stringify(duplicate));

    runChecker(root);

    assert.deepEqual(readdirSync(path.join(root, "content/posts")), ["01-canonical.json"]);
    assert.deepEqual(
      JSON.parse(
        readFileSync(path.join(findArchivedFile(root, "duplicates"), "02-duplicate.json"), "utf8"),
      ),
      duplicate,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
