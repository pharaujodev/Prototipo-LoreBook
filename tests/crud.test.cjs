const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { database } = require('./helpers.cjs');
const { initializeDatabase } = require('../src/infrastructure/database/database.ts');
const { registerUser } = require('../src/data/repositories/authRepository.ts');
const { createProject, updateProject, deleteProject, getProjectForUser, listProjects, createChapter, saveChapter, deleteChapter, getChapter, listChapters } = require('../src/data/repositories/contentRepository.ts');
const { hasUnsavedChanges } = require('../src/domain/validation/chapterDraft.ts');
const { TITLE_MAX_LENGTH, GENRE_MAX_LENGTH } = require('../src/domain/validation/contentValidation.ts');

async function setup(db) {
  await initializeDatabase(db);
  const input = { name: 'Teste', email: 'admin@test.local', password: 'Senha123', confirmPassword: 'Senha123' };
  const admin = await registerUser(db, input);
  const user = await registerUser(db, { ...input, email: 'user@test.local' });
  return { admin, user };
}
async function fixture(action) { const db = database(); try { await action(db, await setup(db)); } finally { db.close(); } }

for (const role of ['admin', 'user']) {
  test(`${role.toUpperCase()}: proprietário mantém todo o CRUD de obras e capítulos`, () => fixture(async (db, accounts) => {
    const actor = accounts[role];
    const project = await createProject(db, actor, { title: 'Obra própria', genre: 'Conto' });
    assert.equal(project.ownerUserId, actor.id);
    assert.deepEqual(await getProjectForUser(db, project.id, actor), project);
    assert.ok((await listProjects(db, actor)).some((item) => item.id === project.id));
    const updated = await updateProject(db, actor, project.id, { title: 'Obra revisada', genre: 'Fantasia' });
    assert.equal(updated.title, 'Obra revisada'); assert.equal(updated.genre, 'Fantasia');
    const chapter = await createChapter(db, project.id, 'Capítulo próprio', actor);
    assert.deepEqual(await getChapter(db, project.id, chapter.id, actor), chapter);
    assert.deepEqual(await listChapters(db, project.id, actor), [chapter]);
    await saveChapter(db, project.id, chapter.id, { title: 'Título revisado', content: 'Texto próprio preservado', status: 'Concluído' }, actor);
    const saved = await getChapter(db, project.id, chapter.id, actor);
    assert.equal(saved.title, 'Título revisado'); assert.equal(saved.content, 'Texto próprio preservado');
    assert.equal(saved.status, 'Concluído'); assert.equal(saved.words, 3);
    assert.equal((await getProjectForUser(db, project.id, actor)).progress, 100);
    await deleteChapter(db, project.id, chapter.id, actor);
    assert.deepEqual(await listChapters(db, project.id, actor), []);
    const child = await createChapter(db, project.id, 'Excluir junto', actor);
    await deleteProject(db, actor, project.id);
    assert.ok(!(await listProjects(db, actor)).some((item) => item.id === project.id));
    await assert.rejects(getProjectForUser(db, project.id, actor));
    await assert.rejects(getChapter(db, project.id, child.id, actor));
    assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM chapters WHERE project_id = ?', project.id)).count, 0);
  }));
}

test('RN-11/12: cria e atualiza título/gênero sem alterar proprietário ou IDs', () => fixture(async (db, { user }) => {
  const project = await createProject(db, user, { title: '  A biblioteca  ', genre: '  Fantasia  ' });
  assert.equal(project.title, 'A biblioteca'); assert.equal(project.genre, 'Fantasia'); assert.equal(project.ownerUserId, user.id);
  const updated = await updateProject(db, user, project.id, { title: 'Outra história', genre: '', ownerUserId: 'forjado' });
  assert.equal(updated.id, project.id); assert.equal(updated.title, 'Outra história'); assert.equal(updated.genre, ''); assert.equal(updated.ownerUserId, user.id);
  assert.ok(Number.isFinite(Date.parse(updated.updatedAt)));
  assert.deepEqual(await listProjects(db, user), [updated]);
}));

test('RN-12/13: ADMIN e outro USER não podem atualizar ou excluir conteúdo alheio', () => fixture(async (db, { admin, user }) => {
  const project = await createProject(db, user, { title: 'Privada' });
  const chapter = await createChapter(db, project.id, 'Capítulo', user);
  for (const actor of [admin, null]) {
    await assert.rejects(updateProject(db, actor, project.id, { title: 'Invadida' }));
    await assert.rejects(deleteProject(db, actor, project.id));
    await assert.rejects(saveChapter(db, project.id, chapter.id, { title: 'Invadido', content: 'x', status: 'Revisão' }, actor));
    await assert.rejects(deleteChapter(db, project.id, chapter.id, actor));
    await assert.rejects(getChapter(db, project.id, chapter.id, actor));
  }
  await assert.rejects(updateProject(db, user, 'p1', { title: 'Do ADMIN' }));
  await assert.rejects(deleteProject(db, user, 'p1'));
  assert.equal((await getProjectForUser(db, project.id, user)).title, 'Privada');
  assert.equal((await getChapter(db, project.id, chapter.id, user)).title, 'Capítulo');
}));

test('RN-15/16: títulos vazios/longos e gênero longo são rejeitados no repository', () => fixture(async (db, { user }) => {
  const project = await createProject(db, user, { title: 'A' });
  const chapter = await createChapter(db, project.id, 'B', user);
  for (const title of ['', '   ', 'x'.repeat(TITLE_MAX_LENGTH + 1)]) {
    await assert.rejects(createProject(db, user, { title }));
    await assert.rejects(updateProject(db, user, project.id, { title }));
    await assert.rejects(createChapter(db, project.id, title, user));
    await assert.rejects(saveChapter(db, project.id, chapter.id, { title, content: 'Não salvar', status: 'Rascunho' }, user));
  }
  await assert.rejects(updateProject(db, user, project.id, { title: 'Válido', genre: 'x'.repeat(GENRE_MAX_LENGTH + 1) }));
  assert.equal((await getChapter(db, project.id, chapter.id, user)).content, '');
  assert.equal((await listProjects(db, user)).length, 1);
}));

test('capítulo salva título/texto/status juntos, com trim e contagem de palavras', () => fixture(async (db, { user }) => {
  const project = await createProject(db, user, { title: 'História' });
  const chapter = await createChapter(db, project.id, 'Original', user);
  assert.equal(hasUnsavedChanges(chapter, { title: 'Outro', content: '', status: 'Rascunho' }), true);
  assert.equal(hasUnsavedChanges(chapter, { title: 'Original', content: '', status: 'Rascunho' }), false);
  await saveChapter(db, project.id, chapter.id, { title: '  Revisado  ', content: 'Uma nova página.', status: 'Concluído' }, user);
  const saved = await getChapter(db, project.id, chapter.id, user);
  assert.equal(saved.title, 'Revisado'); assert.equal(saved.words, 3); assert.equal(saved.status, 'Concluído');
  assert.equal((await getProjectForUser(db, project.id, user)).progress, 100);
}));

test('exclusão de capítulo atualiza progresso e não renumera os restantes', () => fixture(async (db, { user }) => {
  const project = await createProject(db, user, { title: 'História' });
  const first = await createChapter(db, project.id, 'Primeiro', user);
  const second = await createChapter(db, project.id, 'Segundo', user);
  await saveChapter(db, project.id, first.id, { content: 'Fim', status: 'Concluído' }, user);
  await deleteChapter(db, project.id, first.id, user);
  assert.deepEqual(await listChapters(db, project.id, user), [second]);
  assert.equal((await getProjectForUser(db, project.id, user)).progress, 0);
  assert.equal((await createChapter(db, project.id, 'Terceiro', user)).number, 3);
  await assert.rejects(deleteChapter(db, project.id, first.id, user));
}));

test('RN-14: exclusões revertem por inteiro se o banco falhar após remover filhos', () => fixture(async (db, { user }) => {
  const project = await createProject(db, user, { title: 'Preservar' });
  const chapter = await createChapter(db, project.id, 'Preservar', user);
  await db.execAsync("CREATE TRIGGER fail_delete BEFORE DELETE ON projects BEGIN SELECT RAISE(ABORT, 'falha simulada'); END;");
  await assert.rejects(deleteProject(db, user, project.id), /falha simulada/);
  assert.equal((await getChapter(db, project.id, chapter.id, user)).title, 'Preservar');
  await db.execAsync("DROP TRIGGER fail_delete; CREATE TRIGGER fail_update BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT, 'falha atualização'); END;");
  await assert.rejects(deleteChapter(db, project.id, chapter.id, user));
  assert.equal((await listChapters(db, project.id, user)).length, 1);
}));

test('RN-14/17: obra e capítulos excluídos continuam removidos após reiniciar', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lorebook-hf3-'));
  const file = path.join(dir, 'test.db'); let db = database(file);
  try {
    const { user } = await setup(db);
    const project = await createProject(db, user, { title: 'Persistente' });
    const chapter = await createChapter(db, project.id, 'Título', user);
    await saveChapter(db, project.id, chapter.id, { title: 'Novo título', content: 'Texto N1', status: 'Revisão' }, user);
    db.close(); db = database(file); await initializeDatabase(db);
    assert.equal((await getChapter(db, project.id, chapter.id, user)).title, 'Novo título');
    await deleteChapter(db, project.id, chapter.id, user);
    db.close(); db = database(file); await initializeDatabase(db);
    assert.deepEqual(await listChapters(db, project.id, user), []);
    await createChapter(db, project.id, 'Remover com a obra', user);
    await deleteProject(db, user, project.id);
    db.close(); db = database(file); await initializeDatabase(db);
    assert.deepEqual(await listProjects(db, user), []);
    assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM chapters WHERE project_id = ?', project.id)).count, 0);
    await assert.rejects(createChapter(db, project.id, 'Órfão', user));
    assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  } finally {
    db.close(); for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(file + suffix)) fs.unlinkSync(file + suffix); fs.rmdirSync(dir);
  }
});

test('banco HF1 sem CASCADE preserva dados na migração e exclui filhos explicitamente', async () => {
  const db = database();
  try {
    await db.execAsync(`CREATE TABLE projects (id TEXT PRIMARY KEY, title TEXT, genre TEXT, progress INTEGER DEFAULT 0, updated_at TEXT);
      CREATE TABLE chapters (id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id), number INTEGER, title TEXT, status TEXT, words INTEGER, content TEXT, updated_at TEXT);
      INSERT INTO projects VALUES ('legado', 'Legado', '', 0, 'data');
      INSERT INTO chapters VALUES ('cap', 'legado', 1, 'Capítulo', 'Rascunho', 1, 'Original', 'data'); PRAGMA user_version = 2;`);
    const { admin } = await setup(db);
    assert.equal((await getChapter(db, 'legado', 'cap', admin)).content, 'Original');
    await deleteProject(db, admin, 'legado');
    assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM chapters')).count, 0);
    assert.deepEqual(await listProjects(db, admin), []);
  } finally { db.close(); }
});
