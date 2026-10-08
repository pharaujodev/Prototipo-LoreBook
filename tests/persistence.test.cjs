const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

// Executa o código de produção sobre SQLite real; substitui somente a ponte nativa do Expo.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  });
  module._compile(outputText, filename);
};
const { initializeDatabase } = require('../src/db/database.ts');
const { createChapter, saveChapter, listProjects, listChapters } = require('../src/db/repositories.ts');
const { hasUnsavedChanges } = require('../src/data/chapterDraft.ts');

function database(filename = ':memory:') {
  const sqlite = new DatabaseSync(filename);
  return {
    close: () => sqlite.close(),
    execAsync: async (sql) => sqlite.exec(sql),
    getAllAsync: async (sql, ...params) => sqlite.prepare(sql).all(...params),
    getFirstAsync: async (sql, ...params) => sqlite.prepare(sql).get(...params),
    runAsync: async (sql, ...params) => sqlite.prepare(sql).run(...params),
    async withTransactionAsync(action) {
      sqlite.exec('BEGIN');
      try { await action(); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}

test('inicialização idempotente, contagens reais e isolamento entre obras', async () => {
  const db = database();
  try {
    await initializeDatabase(db);
    await initializeDatabase(db);
    const projects = await listProjects(db);
    assert.equal(projects.length, 2);
    assert.equal(projects[0].chapters, 3);
    assert.equal(projects[0].progress, 33);
    const chapters = await listChapters(db, 'p1');
    assert.equal(chapters.length, 3);
    assert.equal(chapters[0].words, chapters[0].content.trim().split(/\s+/).length);
    assert.ok((await listChapters(db, 'p2')).every((chapter) => chapter.id.startsWith('p2-')));
  } finally { db.close(); }
});

test('texto e os três status persistem após fechar e reabrir o banco', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorebook-test-'));
  const filename = path.join(dir, 'test.db');
  let db = database(filename);
  try {
    await initializeDatabase(db);
    const chapter = await createChapter(db, 'p1', '  Novo capítulo  ');
    assert.equal(chapter.title, 'Novo capítulo');
    assert.equal(chapter.number, 4);
    assert.equal(chapter.status, 'Rascunho');
    for (const status of ['Revisão', 'Concluído', 'Rascunho']) {
      await saveChapter(db, 'p1', chapter.id, { content: 'Uma nova página.\nOutra linha.', status });
      db.close();
      db = database(filename);
      await initializeDatabase(db);
      const saved = (await listChapters(db, 'p1')).find((item) => item.id === chapter.id);
      assert.equal(saved.status, status);
      assert.equal(saved.content, 'Uma nova página.\nOutra linha.');
      assert.equal(saved.words, 5);
      assert.equal((await listProjects(db))[0].progress, status === 'Concluído' ? 50 : 25);
    }
  } finally {
    db.close();
    for (const name of ['test.db', 'test.db-wal', 'test.db-shm']) {
      const file = path.join(dir, name);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    fs.rmdirSync(dir);
  }
});

test('migração da v1 preserva texto, título e status existentes', async () => {
  const db = database();
  try {
    await initializeDatabase(db);
    await db.runAsync("UPDATE chapters SET title = ?, content = ?, status = ?, words = 9000 WHERE id = ?", 'Título local', 'Texto do usuário', 'Revisão', 'p1-c1');
    await db.execAsync('PRAGMA user_version = 1');
    await initializeDatabase(db);
    const chapter = (await listChapters(db, 'p1'))[0];
    assert.equal(chapter.title, 'Título local');
    assert.equal(chapter.content, 'Texto do usuário');
    assert.equal(chapter.status, 'Revisão');
    assert.equal(chapter.words, 3);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 2);
  } finally { db.close(); }
});

test('banco vazio permanece vazio após reinicialização', async () => {
  const db = database();
  try {
    await initializeDatabase(db);
    await db.execAsync('DELETE FROM chapters WHERE project_id = \'p1\'');
    await initializeDatabase(db);
    assert.deepEqual(await listChapters(db, 'p1'), []);
    assert.equal((await listProjects(db))[0].progress, 0);
    await db.execAsync('DELETE FROM projects');
    await initializeDatabase(db);
    assert.deepEqual(await listProjects(db), []);
  } finally { db.close(); }
});

test('falhas revertem a gravação inteira e não criam capítulos duplicados ao tentar novamente', async () => {
  const db = database();
  try {
    await initializeDatabase(db);
    const original = (await listChapters(db, 'p1'))[0];
    await db.execAsync("CREATE TRIGGER fail_project BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT, 'falha simulada'); END;");
    await assert.rejects(saveChapter(db, 'p1', original.id, { content: 'Não gravar parcialmente', status: 'Rascunho' }));
    assert.deepEqual((await listChapters(db, 'p1'))[0], original);
    await assert.rejects(createChapter(db, 'p1', 'Tentativa'));
    assert.equal((await listChapters(db, 'p1')).length, 3);
    await db.execAsync('DROP TRIGGER fail_project');
    assert.equal((await createChapter(db, 'p1', 'Tentativa')).number, 4);
  } finally { db.close(); }
});

test('rejeita título vazio, status inválido, capítulo de outra obra e versão futura', async () => {
  const db = database();
  try {
    await initializeDatabase(db);
    await assert.rejects(createChapter(db, 'p1', '   '));
    await assert.rejects(saveChapter(db, 'p1', 'p1-c1', { content: '', status: 'Inválido' }));
    await assert.rejects(saveChapter(db, 'p2', 'p1-c1', { content: '', status: 'Rascunho' }));
    await db.execAsync('PRAGMA user_version = 99');
    await assert.rejects(initializeDatabase(db));
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 99);
  } finally { db.close(); }
});

test('alterações pendentes incluem status e voltam a salvo ao restaurar os valores', () => {
  const chapter = { content: 'Texto', status: 'Rascunho' };
  assert.equal(hasUnsavedChanges(chapter), false);
  assert.equal(hasUnsavedChanges(chapter, { ...chapter }), false);
  assert.equal(hasUnsavedChanges(chapter, { ...chapter, status: 'Revisão' }), true);
  assert.equal(hasUnsavedChanges(chapter, { ...chapter, content: 'Texto editado' }), true);
});
