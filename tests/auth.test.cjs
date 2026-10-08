const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { database } = require('./helpers.cjs');
const { initializeDatabase } = require('../src/db/database.ts');
const { registerUser, authenticateUser, saveSession, restoreSession, clearSession } = require('../src/auth/authRepository.ts');
const { validateRegistration, validateLogin, isUserRole } = require('../src/auth/validation.ts');
const permissions = require('../src/auth/permissions.ts');
const { listUsers } = require('../src/admin/adminRepository.ts');
const { getDatabaseDiagnostics } = require('../src/db/diagnosticsRepository.ts');
const valid = { name: 'Pessoa de teste', email: 'autor@example.test', password: 'Senha123', confirmPassword: 'Senha123' };
async function withDatabase(action) {
  const db = database();
  try { await initializeDatabase(db); await action(db); } finally { db.close(); }
}

test('RN-01/02: primeiro cadastro ADMIN e demais USER, inclusive concorrência e role forjada', () => withDatabase(async (db) => {
  const users = await Promise.all(['primeiro', 'segundo', 'terceiro'].map((name) => registerUser(db, { ...valid, email: name + '@example.test', role: 'ADMIN' })));
  assert.deepEqual(users.map((u) => u.role), ['ADMIN', 'USER', 'USER']);
  assert.ok(users.every((u) => u.status === 'ACTIVE'));
  await assert.rejects(registerUser(db, { ...valid, email: users[0].email }), /já está cadastrado/);
  assert.equal((await registerUser(db, valid)).role, 'USER');
}));

test('RN-03: normaliza e-mail, rejeita duplicados e armazena somente hash com salt individual', () => withDatabase(async (db) => {
  const user = await registerUser(db, { ...valid, email: ' AUTOR@EXAMPLE.TEST ' });
  await registerUser(db, { ...valid, email: 'outro@example.test' });
  assert.equal(user.email, valid.email);
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name', 'role', 'status']);
  await assert.rejects(registerUser(db, valid), /já está cadastrado/);
  const rows = await db.getAllAsync('SELECT * FROM users');
  for (const row of rows) {
    assert.match(row.password_salt, /^[a-f0-9]{32}$/);
    assert.match(row.password_hash, /^[a-f0-9]{64}$/);
    assert.equal(row.password_hash, createHash('sha256').update(row.password_salt + ':' + valid.password).digest('hex'));
    assert.equal(row.password, undefined);
  }
  assert.notEqual(rows[0].password_salt, rows[1].password_salt);
  assert.notEqual(rows[0].password_hash, rows[1].password_hash);
  assert.equal(await restoreSession(db), null);
}));

test('validações puras cobrem campos, e-mail, senha e confirmação', () => {
  assert.equal(validateRegistration(valid), null);
  for (const [change, message] of [
    [{ name: ' ' }, /nome/], [{ email: '' }, /obrigatórios/], [{ email: 'invalido' }, /e-mail válido/],
    [{ password: '' }, /obrigatórios/], [{ password: '12345', confirmPassword: '12345' }, /6 caracteres/],
    [{ confirmPassword: 'diferente' }, /não coincidem/]
  ]) assert.match(validateRegistration({ ...valid, ...change }), message);
  assert.match(validateLogin({ email: '', password: '' }), /obrigatórios/);
  assert.equal(isUserRole('ADMIN'), true); assert.equal(isUserRole('USER'), true); assert.equal(isUserRole('INVALID'), false);
});

test('login confirma credenciais sem expor segredos nem alterar sessão em falha', () => withDatabase(async (db) => {
  const user = await registerUser(db, valid);
  await saveSession(db, user.id);
  await assert.rejects(authenticateUser(db, { ...valid, password: 'errada' }), /E-mail ou senha inválidos/);
  await assert.rejects(authenticateUser(db, { ...valid, email: 'ausente@example.test' }), /E-mail ou senha inválidos/);
  assert.deepEqual(await authenticateUser(db, { ...valid, email: ' AUTOR@EXAMPLE.TEST ' }), user);
  assert.deepEqual(await restoreSession(db), user);
}));

test('sessão única, restauração, logout e constraints de role/status', () => withDatabase(async (db) => {
  const admin = await registerUser(db, valid);
  const user = await registerUser(db, { ...valid, email: 'user@example.test' });
  for (const column of ['role', 'status']) await assert.rejects(db.runAsync('UPDATE users SET ' + column + ' = ? WHERE id = ?', 'INVALID', admin.id));
  await saveSession(db, admin.id); await saveSession(db, user.id);
  assert.equal((await db.getAllAsync('SELECT * FROM app_session')).length, 1);
  assert.deepEqual(await restoreSession(db), user);
  await assert.rejects(db.runAsync('INSERT INTO app_session VALUES (2, ?)', admin.id));
  await assert.rejects(saveSession(db, 'ausente'));
  assert.deepEqual(await restoreSession(db), user);
  await clearSession(db); assert.equal(await restoreSession(db), null);
}));

test('permissões são puras; ambos escrevem e apenas ADMIN ativo administra', () => {
  const admin = { id: 'a', role: 'ADMIN', status: 'ACTIVE' };
  const user = { id: 'u', role: 'USER', status: 'ACTIVE' };
  for (const rule of [permissions.canWriteContent, permissions.canCreateChapter, permissions.canEditChapter, permissions.canDeleteContent]) {
    assert.equal(rule(admin), true); assert.equal(rule(user), true); assert.equal(rule(null), false);
    assert.equal(rule({ ...user, status: 'DISABLED' }), false); assert.equal(rule({ ...user, role: 'INVALID' }), false);
  }
  for (const rule of [permissions.canAccessAdminPanel, permissions.canViewUsers, permissions.canAccessDatabaseDiagnostics]) {
    assert.equal(rule(admin), true); assert.equal(rule(user), false); assert.equal(rule(null), false);
    assert.equal(rule({ ...admin, status: 'DISABLED' }), false);
  }
  assert.equal(permissions.canAccessProject(admin, user.id), true);
  assert.equal(permissions.canAccessProject(user, user.id), true);
  assert.equal(permissions.canAccessProject(user, admin.id), false);
  assert.equal(permissions.canEditProject(admin, user.id), false);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../src/auth/permissions.ts'), 'utf8'), /from ['"](?:react|expo-sqlite)/);
});

test('consultas administrativas usam contagens reais e negam USER antes do SQL', () => withDatabase(async (db) => {
  const admin = await registerUser(db, valid);
  const user = await registerUser(db, { ...valid, email: 'user@example.test' });
  assert.deepEqual((await listUsers(db, admin)).map((row) => ({ ...row })), [{ ...admin, projectCount: 2 }, { ...user, projectCount: 0 }]);
  assert.deepEqual({ ...await getDatabaseDiagnostics(db, admin) }, { projects: 2, chapters: 6, users: 2, unownedProjects: 0 });
  let queries = 0;
  const blocked = { getFirstAsync: async () => { queries++; }, getAllAsync: async () => { queries++; } };
  for (const actor of [user, null]) {
    await assert.rejects(listUsers(blocked, actor), /não possui acesso/);
    await assert.rejects(getDatabaseDiagnostics(blocked, actor), /não possui acesso/);
  }
  assert.equal(queries, 0);
  await assert.rejects(listUsers(db, { ...user, role: 'ADMIN' }), /não possui acesso/);
}));

async function legacyDatabase(db, version = 2) {
  await db.execAsync("CREATE TABLE projects (id TEXT PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL DEFAULT '', progress INTEGER DEFAULT 0, updated_at TEXT NOT NULL); CREATE TABLE chapters (id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id), number INTEGER, title TEXT, status TEXT, words INTEGER, content TEXT, updated_at TEXT, UNIQUE(project_id, number)); INSERT INTO projects VALUES ('legado', 'Obra preservada', 'Conto', 0, 'data original'); INSERT INTO chapters VALUES ('cap', 'legado', 1, 'Título original', 'Revisão', 3, 'Meu texto original', 'data original'); PRAGMA user_version = " + version);
  if (version === 3) await db.execAsync("CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('AUTHOR','READER')), created_at TEXT NOT NULL); CREATE TABLE app_session (singleton_id INTEGER PRIMARY KEY CHECK(singleton_id=1), user_id TEXT NOT NULL REFERENCES users(id));");
}

test('HF1: migração preserva obras/capítulos e legado é atribuído ao primeiro ADMIN', async () => {
  const db = database();
  try {
    await legacyDatabase(db);
    const projects = await db.getAllAsync('SELECT * FROM projects');
    const chapters = await db.getAllAsync('SELECT * FROM chapters');
    await initializeDatabase(db); await initializeDatabase(db);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM chapters'), chapters);
    assert.deepEqual((await db.getAllAsync('SELECT * FROM projects')).map(({ owner_user_id, ...row }) => row), projects.map((row) => ({ ...row })));
    assert.equal((await db.getFirstAsync('SELECT owner_user_id FROM projects')).owner_user_id, null);
    const admin = await registerUser(db, valid);
    assert.equal((await db.getFirstAsync('SELECT owner_user_id FROM projects')).owner_user_id, admin.id);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 5);
    assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
  } finally { db.close(); }
});

test('cadastro e atribuição do legado revertem juntos se a migração de propriedade falhar', () => withDatabase(async (db) => {
  await db.execAsync("CREATE TRIGGER fail_owner BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT, 'falha simulada'); END;");
  await assert.rejects(registerUser(db, valid), /falha simulada/);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM users')).count, 0);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM projects WHERE owner_user_id IS NULL')).count, 2);
  await db.execAsync('DROP TRIGGER fail_owner');
  assert.equal((await registerUser(db, valid)).role, 'ADMIN');
}));

test('schema 3: preserva contas, hashes, sessão e conteúdo sem apagar tabelas antigas', async () => {
  const db = database();
  try {
    await legacyDatabase(db, 3);
    const salt = 'salt-legado', hash = createHash('sha256').update(salt + ':' + valid.password).digest('hex');
    for (const [id, role] of [['u1', 'READER'], ['u2', 'AUTHOR']]) await db.runAsync('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)', id, id, id + '@example.test', hash, salt, role, '2026-01-01');
    await db.runAsync('INSERT INTO app_session VALUES (1, ?)', 'u2');
    const chapters = await db.getAllAsync('SELECT * FROM chapters');
    await initializeDatabase(db); await initializeDatabase(db);
    assert.equal((await authenticateUser(db, { email: 'u1@example.test', password: valid.password })).role, 'ADMIN');
    assert.equal((await restoreSession(db)).id, 'u2');
    assert.equal((await restoreSession(db)).status, 'ACTIVE');
    assert.equal((await db.getFirstAsync('SELECT owner_user_id FROM projects')).owner_user_id, 'u1');
    assert.equal((await db.getFirstAsync('SELECT password_hash FROM users WHERE id = ?', 'u1')).password_hash, hash);
    assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM users_legacy_v3')).count, 2);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM chapters'), chapters);
    assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
    await assert.rejects(db.runAsync('UPDATE users SET role = ?', 'AUTHOR'));
  } finally { db.close(); }
});

test('migração inconsistente faz rollback e mantém schema e dados originais', async () => {
  const db = database();
  try {
    await legacyDatabase(db, 3);
    await db.execAsync("PRAGMA foreign_keys = OFF; INSERT INTO app_session VALUES (1, 'ausente'); PRAGMA foreign_keys = ON;");
    await assert.rejects(initializeDatabase(db));
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 3);
    assert.equal((await db.getFirstAsync('SELECT user_id FROM app_session')).user_id, 'ausente');
    assert.equal((await db.getFirstAsync('SELECT content FROM chapters')).content, 'Meu texto original');
    assert.equal(await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'users_legacy_v3'"), undefined);
  } finally { db.close(); }
});
