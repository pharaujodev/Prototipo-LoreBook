// Smoke opcional: npm exec --yes --package=playwright -- node tests/web-smoke.cjs
// Requer Expo rodando em localhost:8082 e Edge instalado. Não altera o perfil pessoal.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const runtime = process.env.PATH.split(path.delimiter).map((entry) => path.resolve(entry, '..', 'playwright')).find((entry) => fs.existsSync(path.join(entry, 'package.json')));
const { chromium } = require(runtime || 'playwright');
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'lorebook-hf3-smoke-'));
const profile = path.join(artifacts, 'profile');
const url = process.env.SMOKE_URL || 'http://localhost:8082';
let context;
const errors = [];
async function start() {
  context = await chromium.launchPersistentContext(profile, { channel: 'msedge', headless: true, viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 });
  const page = context.pages()[0];
  page.setDefaultTimeout(20000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  return page;
}
async function visible(locator) { await locator.first().waitFor({ state: 'visible' }); }
async function register(page, name, email, expectedRole) {
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill(name);
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('TesteN1!');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('TesteN1!');
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await visible(page.getByText('Conta criada como ' + expectedRole + '.', { exact: false }));
}
async function login(page, email) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('TesteN1!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await visible(page.getByRole('heading', { name: 'Minhas obras', exact: true }));
}
async function logout(page) {
  await page.getByRole('button', { name: 'Abrir conta e configurações', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await visible(page.getByRole('heading', { name: 'Sair da conta?', exact: true }));
  // React Native Web deixa elementos ocultos da árvore anterior no DOM durante o modal.
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).last().click();
  await visible(page.getByRole('button', { name: 'Entrar', exact: true }));
}
async function newProject(page, title) {
  await page.getByRole('button', { name: '＋ Nova obra', exact: true }).click();
  await page.getByLabel('Título da obra', { exact: true }).fill(title);
  await page.getByLabel('Gênero (opcional)', { exact: true }).fill('Conto');
  await page.getByRole('button', { name: 'Criar obra', exact: true }).click();
  await visible(page.getByText('Obra criada com sucesso.', { exact: false }));
  await visible(page.getByRole('button', { name: 'Editar título e gênero', exact: true }));
}
async function newChapter(page, title) {
  await page.getByRole('button', { name: 'Criar primeiro capítulo', exact: true }).click();
  await page.getByLabel('Título do capítulo', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Criar e começar a escrever', exact: true }).click();
  await visible(page.getByLabel('Conteúdo do capítulo', { exact: true }));
}
async function back(page, count = 1) { for (let i = 0; i < count; i++) await page.getByRole('button', { name: 'Voltar', exact: true }).click(); }
(async () => {
  try {
    let page = await start();
    await visible(page.getByRole('button', { name: 'Entrar', exact: true }));
    await page.screenshot({ path: path.join(artifacts, '01-login-360.png'), fullPage: true });
    await register(page, 'Admin N1', 'admin@n1.test', 'Administrador'); await login(page, 'admin@n1.test');
    await page.screenshot({ path: path.join(artifacts, '02-library-360.png'), fullPage: true });
    await newProject(page, 'Caderno ADMIN');
    await page.getByRole('button', { name: 'Editar título e gênero', exact: true }).click();
    await page.getByLabel('Título da obra', { exact: true }).fill('Caderno revisado');
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await visible(page.getByRole('button', { name: 'Criar primeiro capítulo', exact: true }));
    await page.getByRole('tab', { name: 'Fichas', exact: true }).click();
    await visible(page.getByText('Quem habita sua história?', { exact: true }));
    assert.equal(await page.getByText('Alaric Varen', { exact: true }).count(), 0);
    await page.getByRole('tab', { name: 'Bíblia', exact: true }).click();
    await visible(page.getByText('Um mundo por descobrir', { exact: true }));
    await page.getByRole('tab', { name: 'Notas', exact: true }).click();
    assert.equal(await page.getByLabel('Notas da obra', { exact: true }).inputValue(), '');
    await page.getByRole('tab', { name: 'Obra', exact: true }).click();
    await page.screenshot({ path: path.join(artifacts, '03-work-360.png'), fullPage: true });
    await newChapter(page, 'A primeira página');
    await page.getByLabel('Título do capítulo', { exact: true }).fill('A página revisada');
    await page.getByLabel('Conteúdo do capítulo', { exact: true }).fill('Uma história guardada neste dispositivo.');
    await page.getByRole('radio', { name: 'Em revisão', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar capítulo', exact: true }).click();
    await visible(page.getByText('Salvo neste dispositivo', { exact: true }));
    await page.screenshot({ path: path.join(artifacts, '04-editor-360.png'), fullPage: true });
    await context.close(); page = await start();
    await visible(page.getByRole('heading', { name: 'Minhas obras', exact: true }));
    await page.getByRole('button', { name: /Abrir obra Caderno revisado/ }).click();
    await page.getByRole('tab', { name: 'Capítulos', exact: true }).click();
    await page.getByRole('button', { name: /Abrir capítulo 1, A página revisada/ }).click();
    assert.equal(await page.getByLabel('Conteúdo do capítulo', { exact: true }).inputValue(), 'Uma história guardada neste dispositivo.');
    // Confirma que título também participa do aviso de alterações não salvas.
    await page.getByLabel('Título do capítulo', { exact: true }).fill('Não guardar'); await back(page);
    await page.getByRole('button', { name: 'Continuar escrevendo', exact: true }).click();
    await back(page); await page.getByRole('button', { name: 'Descartar alterações e sair', exact: true }).click();
    await back(page, 2); await logout(page);
    await register(page, 'User N1', 'user@n1.test', 'Usuário'); await login(page, 'user@n1.test');
    await visible(page.getByText('A primeira história é sua.', { exact: true }));
    assert.equal(await page.getByRole('button', { name: /Abrir obra Caderno/ }).count(), 0);
    await newProject(page, 'Acervo USER'); await newChapter(page, 'Capítulo USER');
    await page.getByLabel('Conteúdo do capítulo', { exact: true }).fill('Texto exclusivo do USER.');
    await page.getByRole('button', { name: 'Salvar capítulo', exact: true }).click();
    await visible(page.getByText('Salvo neste dispositivo', { exact: true })); await back(page, 3); await logout(page);
    await login(page, 'admin@n1.test');
    assert.equal(await page.getByRole('button', { name: /Abrir obra Acervo USER/ }).count(), 0);
    await page.getByRole('button', { name: 'Abrir conta e configurações', exact: true }).click();
    await page.getByRole('button', { name: 'Painel administrativo', exact: true }).click();
    await page.getByRole('button', { name: 'Verificar banco', exact: true }).click();
    await visible(page.getByText('Obras sem proprietário: 0', { exact: true }));
    await page.getByRole('button', { name: 'Ver detalhes de User N1', exact: true }).click();
    await page.getByRole('button', { name: 'Consultar Acervo USER', exact: true }).click();
    await visible(page.getByText('Visualizando como administrador · somente consulta', { exact: true }));
    assert.equal(await page.getByRole('button', { name: 'Editar título e gênero', exact: true }).count(), 0);
    await page.getByRole('tab', { name: 'Capítulos', exact: true }).click();
    await page.getByRole('button', { name: /Abrir capítulo 1, Capítulo USER/ }).click();
    assert.equal(await page.getByLabel('Conteúdo do capítulo', { exact: true }).isEditable(), false);
    assert.equal(await page.getByRole('button', { name: 'Salvar capítulo', exact: true }).count(), 0);
    await back(page, 3);
    await page.getByRole('button', { name: 'Desativar conta', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Desativar conta', exact: true }).click();
    await page.getByRole('button', { name: 'Desativar conta', exact: true }).last().click();
    await visible(page.getByText('Status: Desativado', { exact: true }));
    await back(page, 3); await logout(page);
    await page.getByLabel('E-mail', { exact: true }).fill('user@n1.test');
    await page.getByLabel('Senha', { exact: true }).fill('TesteN1!');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await visible(page.getByText('Esta conta está desativada.', { exact: true }));
    await login(page, 'admin@n1.test');
    await page.getByRole('button', { name: /Abrir obra Caderno revisado/ }).click();
    await page.getByRole('tab', { name: 'Capítulos', exact: true }).click();
    await page.getByRole('button', { name: /Abrir capítulo 1, A página revisada/ }).click();
    await page.getByRole('button', { name: 'Excluir capítulo', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir capítulo', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir capítulo', exact: true }).last().click();
    await visible(page.getByText('Sua primeira página espera', { exact: true }));
    await back(page);
    await page.getByRole('button', { name: 'Excluir obra', exact: true }).click();
    await page.getByRole('button', { name: 'Excluir obra', exact: true }).last().click();
    await visible(page.getByRole('heading', { name: 'Minhas obras', exact: true }));
    await context.close(); page = await start();
    await visible(page.getByRole('heading', { name: 'Minhas obras', exact: true }));
    assert.equal(await page.getByRole('button', { name: /Abrir obra Caderno revisado/ }).count(), 0);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.screenshot({ path: path.join(artifacts, '05-library-320.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Overflow horizontal em 320 px');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'PASS', artifacts, checks: 'CRUD, persistência após fechar navegador, sessão, perfis, isolamento, admin read-only, desativação, confirmações, 320px' }));
  } catch (error) {
    if (context) { const page = context.pages()[0]; if (page) { await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }); console.error((await page.locator('body').innerText()).slice(0, 5000)); } }
    console.error('Artefatos: ' + artifacts); console.error(error); process.exitCode = 1;
  } finally { if (context) await context.close(); }
})();
