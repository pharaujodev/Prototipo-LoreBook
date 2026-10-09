const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { database } = require('./helpers.cjs');
const { initializeDatabase } = require('../src/infrastructure/database/database.ts');
const { registerUser, authenticateUser, saveSession, restoreSession, clearSession } = require('../src/data/repositories/authRepository.ts');
const { listProjects, getProjectForUser, getChapter, createProject, listChapters, createChapter, saveChapter } = require('../src/data/repositories/contentRepository.ts');
const { listUsers, getUserDetail, updateUserStatus } = require('../src/data/repositories/adminRepository.ts');
const { assertStatusChange } = require('../src/domain/permissions/permissions.ts');
const { createChapterForUser, saveChapterForUser } = require('../src/application/actions/chapterActions.ts');
const valid = { name: 'Pessoa', email: 'admin@example.test', password: 'Senha123', confirmPassword: 'Senha123' };
async function accounts(db) {
  await initializeDatabase(db);
  const admin = await registerUser(db, valid);
  const user = await registerUser(db, { ...valid, email: 'user@example.test' });
  const other = await registerUser(db, { ...valid, email: 'other@example.test' });
  return { admin, user, other };
}
async function withAccounts(action) {
  const db = database();
  try { await action(db, await accounts(db)); } finally { db.close(); }
}

test('RN-04/05: novas obras usam conta autenticada; listas pessoais isolam todos os perfis', () => withAccounts(async (db, { admin, user, other }) => {
  assert.deepEqual(await listProjects(db, user), []);
  const project = await createProject(db, user, { title: ' Minha obra ', ownerUserId: admin.id });
  assert.equal(project.ownerUserId, user.id); assert.equal(project.title, 'Minha obra');
  assert.deepEqual(await listProjects(db, user), [project]);
  assert.deepEqual(await listProjects(db, other), []);
  assert.equal((await listProjects(db, admin)).length, 2);
  await assert.rejects(getProjectForUser(db, project.id, other), /acesso/);
  await assert.rejects(getProjectForUser(db, project.id, admin), /acesso/);
  await assert.rejects(listProjects(db, null));
  await assert.rejects(createProject(db, null, { title: 'Proibida' }));
  await assert.rejects(db.runAsync("INSERT INTO projects (id, title, updated_at) VALUES ('sem-dono', 'Inválido', 'hoje')"), /proprietário/);
  await assert.rejects(db.runAsync('UPDATE projects SET owner_user_id = NULL WHERE id = ?', project.id), /proprietário/);
  await assert.rejects(db.runAsync('UPDATE projects SET owner_user_id = ? WHERE id = ?', 'ausente', project.id), /FOREIGN KEY/);
}));

test('RN-06: ADMIN lista usuários e somente metadados e agregados das obras', () => withAccounts(async (db, { admin, user, other }) => {
  const project = await createProject(db, user, { title: 'Obra USER', genre: 'Fantasia' });
  const empty = await createProject(db, user, { title: 'Obra sem capítulos' });
  for (const status of ['Concluído', 'Concluído', 'Revisão']) {
    const chapter = await createChapter(db, project.id, 'Título confidencial', user);
    await saveChapter(db, project.id, chapter.id, { content: 'Manuscrito confidencial', status }, user);
  }
  const users = await listUsers(db, admin);
  assert.deepEqual(users.map((row) => ({ ...row })), [
    { ...admin, projectCount: 2 }, { ...user, projectCount: 2 }, { ...other, projectCount: 0 }
  ]);
  const detail = await getUserDetail(db, admin, user.id);
  assert.deepEqual({ ...detail.user }, { ...user, projectCount: 2 });
  const updated = await getProjectForUser(db, project.id, user);
  assert.deepEqual(detail.projects.map((row) => ({ ...row })), [
    { id: project.id, title: project.title, genre: 'Fantasia', chapters: 3, progress: 67, updatedAt: updated.updatedAt },
    { id: empty.id, title: empty.title, genre: '', chapters: 0, progress: 0, updatedAt: empty.updatedAt }
  ]);
  assert.doesNotMatch(JSON.stringify(detail), /confidencial|password|content/);
  assert.deepEqual((await getUserDetail(db, admin, other.id)).projects, []);
  await assert.rejects(getUserDetail(db, admin, 'ausente'), /indisponível/);
  for (const actor of [user, other, null]) {
    await assert.rejects(listUsers(db, actor));
    await assert.rejects(getUserDetail(db, actor, user.id));
  }
}));

test('RN-05/06/10: chamadas diretas e flag administrativa antiga não liberam manuscrito alheio', () => withAccounts(async (db, { admin, user, other }) => {
  const project = await createProject(db, user, { title: 'Obra privada' });
  const chapter = await createChapter(db, project.id, 'Título privado', user);
  for (const actor of [admin, other, { ...other, role: 'ADMIN' }, null]) {
    await assert.rejects(getProjectForUser(db, project.id, actor), /acesso|Entre/);
    await assert.rejects(getChapter(db, project.id, chapter.id, actor), /acesso|Entre/);
    await assert.rejects(listChapters(db, project.id, actor), /acesso|Entre/);
    // JavaScript ainda pode enviar argumentos extras a APIs sem esse parâmetro.
    await assert.rejects(getProjectForUser(db, project.id, actor, true), /acesso|Entre/);
    await assert.rejects(listChapters(db, project.id, actor, true), /acesso|Entre/);
  }
  const adminRepository = require('../src/data/repositories/adminRepository.ts');
  assert.equal(adminRepository.getProjectAsAdmin, undefined);
  assert.equal(adminRepository.listChaptersAsAdmin, undefined);
  assert.deepEqual(await getChapter(db, project.id, chapter.id, user), chapter);
}));

test('RN-06: metadados revalidam ADMIN ativo no banco e rejeitam perfil forjado ou antigo', () => withAccounts(async (db, { admin, user }) => {
  await assert.rejects(getUserDetail(db, { ...user, role: 'ADMIN' }, user.id), /não possui acesso/);
  await db.runAsync('UPDATE users SET role = ? WHERE id = ?', 'USER', admin.id);
  await assert.rejects(listUsers(db, admin), /não possui acesso/);
  await assert.rejects(getUserDetail(db, admin, user.id), /não possui acesso/);
  await db.runAsync('UPDATE users SET role = ?, status = ? WHERE id = ?', 'ADMIN', 'DISABLED', admin.id);
  await assert.rejects(listUsers(db, admin), /desativada/);
  await assert.rejects(getUserDetail(db, admin, user.id), /desativada/);
}));

test('RN-10: criação, leitura e salvamento validam ownership mesmo em chamadas diretas', () => withAccounts(async (db, { admin, user, other }) => {
  const project = await createProject(db, user, { title: 'Obra pessoal' });
  const chapter = await createChapterForUser(db, user, project.id, 'Capítulo USER');
  await saveChapterForUser(db, user, project.id, chapter.id, { content: 'Texto do proprietário', status: 'Revisão' });
  for (const actor of [other, admin, null]) {
    await assert.rejects(listChapters(db, project.id, actor));
    await assert.rejects(createChapter(db, project.id, 'Intruso', actor));
    await assert.rejects(saveChapter(db, project.id, chapter.id, { content: 'Intruso', status: 'Concluído' }, actor));
  }
  await assert.rejects(saveChapter(db, 'p1', chapter.id, { content: 'Outra obra', status: 'Rascunho' }, admin));
  const saved = await listChapters(db, project.id, user);
  assert.equal(saved.length, 1); assert.equal(saved[0].content, 'Texto do proprietário');
  assert.equal(saved[0].status, 'Revisão');
  assert.throws(() => createChapterForUser(db, null, project.id, 'Proibido'));
}));

test('RN-07: desativação impede login, invalida sessão e bloqueia contextos antigos', () => withAccounts(async (db, { admin, user, other }) => {
  const project = await createProject(db, user, { title: 'Obra persistente' });
  const chapter = await createChapter(db, project.id, 'Capítulo', user);
  await saveSession(db, user.id);
  await updateUserStatus(db, admin, user.id, 'DISABLED');
  assert.equal(await restoreSession(db), null);
  await assert.rejects(authenticateUser(db, { email: user.email, password: valid.password }), /Esta conta está desativada/);
  await assert.rejects(authenticateUser(db, { email: user.email, password: 'errada' }), /E-mail ou senha inválidos/);
  await assert.rejects(saveSession(db, user.id), /desativada/);
  await assert.rejects(listProjects(db, user), /desativada/);
  await assert.rejects(createChapter(db, project.id, 'Bloqueado', user), /desativada/);
  await assert.rejects(saveChapter(db, project.id, chapter.id, { content: 'Bloqueado', status: 'Revisão' }, user), /desativada/);
  // Simula sessão anterior à desativação, vinda de uma versão antiga do aplicativo.
  await db.runAsync('INSERT INTO app_session VALUES (1, ?)', user.id);
  assert.equal(await restoreSession(db), null);
  assert.equal((await db.getAllAsync('SELECT * FROM app_session')).length, 0);
  await assert.rejects(updateUserStatus(db, other, user.id, 'ACTIVE'), /não possui acesso/);
  await updateUserStatus(db, admin, user.id, 'ACTIVE');
  const restored = await authenticateUser(db, { email: user.email, password: valid.password });
  assert.equal(restored.status, 'ACTIVE');
  assert.equal((await listProjects(db, restored))[0].id, project.id);
}));

test('RN-08/09: política central preserva própria conta e último ADMIN; só USER muda status', () => withAccounts(async (db, { admin, user }) => {
  await assert.rejects(updateUserStatus(db, admin, admin.id, 'DISABLED'), /própria conta/);
  const anotherAdmin = { ...admin, id: 'outro-admin' };
  assert.throws(() => assertStatusChange(anotherAdmin, admin, 'DISABLED', 1), /pelo menos um Administrador ativo/);
  assert.throws(() => assertStatusChange(anotherAdmin, admin, 'DISABLED', 2), /apenas contas de Usuário/);
  await assert.rejects(updateUserStatus(db, admin, user.id, 'INVALID'), /Status inválido/);
  await assert.rejects(updateUserStatus(db, { ...user, role: 'ADMIN' }, admin.id, 'DISABLED'), /não possui acesso/);
  assert.equal((await db.getFirstAsync('SELECT status FROM users WHERE id = ?', admin.id)).status, 'ACTIVE');
  // Erro ao limpar sessão reverte status junto: não há atualização parcial.
  await saveSession(db, user.id);
  await db.execAsync("CREATE TRIGGER fail_logout BEFORE DELETE ON app_session BEGIN SELECT RAISE(ABORT, 'falha sessão'); END;");
  await assert.rejects(updateUserStatus(db, admin, user.id, 'DISABLED'), /falha sessão/);
  assert.equal((await db.getFirstAsync('SELECT status FROM users WHERE id = ?', user.id)).status, 'ACTIVE');
}));

test('sessão, ownership e capítulos persistem ao fechar/reabrir SQLite; logout também persiste', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lorebook-ownership-'));
  const filename = path.join(directory, 'test.db');
  let db = database(filename);
  try {
    const { admin, user } = await accounts(db);
    const project = await createProject(db, user, { title: 'Obra USER' });
    const chapter = await createChapter(db, project.id, 'Persistente', user);
    await saveChapter(db, project.id, chapter.id, { content: 'Meu texto salvo', status: 'Concluído' }, user);
    await saveSession(db, user.id);
    db.close(); db = database(filename); await initializeDatabase(db);
    assert.deepEqual(await restoreSession(db), user);
    assert.equal((await listProjects(db, user))[0].ownerUserId, user.id);
    assert.equal((await listChapters(db, project.id, user))[0].content, 'Meu texto salvo');
    await saveSession(db, admin.id);
    db.close(); db = database(filename); await initializeDatabase(db);
    assert.deepEqual(await restoreSession(db), admin);
    await clearSession(db);
    db.close(); db = database(filename);
    assert.equal(await restoreSession(db), null);
  } finally {
    db.close();
    for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(filename + suffix)) fs.unlinkSync(filename + suffix);
    fs.rmdirSync(directory);
  }
});

test('schema 4 existente recebe status e proprietário sem trocar IDs, sessão ou conteúdo', async () => {
  const db = database();
  try {
    await db.execAsync(`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT CHECK(role IN ('ADMIN','USER')), password_hash TEXT, password_salt TEXT, created_at TEXT);
      CREATE TABLE app_session (singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1), user_id TEXT REFERENCES users(id));
      CREATE TABLE projects (id TEXT PRIMARY KEY, title TEXT, genre TEXT, progress INTEGER, updated_at TEXT);
      CREATE TABLE chapters (id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id), number INTEGER, title TEXT, status TEXT, words INTEGER, content TEXT, updated_at TEXT);
      INSERT INTO users VALUES ('a', 'Admin', 'a@example.test', 'ADMIN', 'hash', 'salt', '2026-01-01');
      INSERT INTO users VALUES ('u', 'User', 'u@example.test', 'USER', 'hash2', 'salt2', '2026-01-02');
      INSERT INTO app_session VALUES (1, 'u');
      INSERT INTO projects VALUES ('p', 'Minha obra', 'Conto', 0, 'original');
      INSERT INTO chapters VALUES ('c', 'p', 1, 'Meu capítulo', 'Revisão', 2, 'Meu conteúdo', 'original');
      PRAGMA user_version = 4;`);
    const before = await db.getAllAsync('SELECT * FROM chapters');
    await initializeDatabase(db); await initializeDatabase(db);
    assert.equal((await db.getFirstAsync('SELECT owner_user_id FROM projects')).owner_user_id, 'a');
    assert.deepEqual(await db.getAllAsync('SELECT * FROM chapters'), before);
    assert.equal((await restoreSession(db)).id, 'u');
    assert.equal((await restoreSession(db)).status, 'ACTIVE');
    assert.equal((await db.getFirstAsync('SELECT password_hash FROM users WHERE id = ?', 'a')).password_hash, 'hash');
    assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  } finally { db.close(); }
});
