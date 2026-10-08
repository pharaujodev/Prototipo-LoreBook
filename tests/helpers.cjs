const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const { createHash, randomBytes, randomUUID } = require('node:crypto');

// Substitui somente a ponte nativa; hashing, validações e repositories são de produção.
const cryptoPath = require.resolve('expo-crypto');
require.cache[cryptoPath] = { id: cryptoPath, filename: cryptoPath, loaded: true, exports: {
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytesAsync: async (size) => randomBytes(size),
  randomUUID,
  digestStringAsync: async (_algorithm, value) => createHash('sha256').update(value).digest('hex')
} };

// Mesmos repositories e migrações de produção, executados em SQLite real.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  });
  module._compile(outputText, filename);
};

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

module.exports = { database };
