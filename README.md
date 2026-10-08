# LoreBook — Protótipo Mobile

O LoreBook é um protótipo de aplicativo mobile para escrever e organizar histórias. Ele reúne capítulos, personagens, informações sobre o universo da obra e notas de planejamento em um só lugar.

Desenvolvido com React Native, TypeScript e Expo, o projeto explora uma experiência de escrita no celular com armazenamento local. Sua identidade visual se inspira no Ateliê Desktop, combinando vinho, dourado, tons de papel e tipografia serifada. Os dois aplicativos são projetos separados, sem integração de dados.

## Objetivos

- Explorar um fluxo simples de escrita e organização literária em telas pequenas.
- Manter o manuscrito e seu planejamento organizados por obra.
- Acompanhar a evolução dos capítulos, do rascunho à conclusão.
- Experimentar navegação, legibilidade e feedback antes de ampliar o aplicativo.
- Priorizar o uso local, com contas no próprio dispositivo e sem serviço de nuvem.

## Funcionalidades

### Conta e perfis

- Cadastro e login locais com nome, e-mail e senha.
- Perfil **Usuário (USER)**: acessa suas próprias obras, cria capítulos, edita texto e status e salva alterações.
- Perfil **Administrador (ADMIN)**: escreve nas próprias obras e consulta usuários, suas obras e o diagnóstico SQLite em uma área administrativa separada.
- Sessão restaurada automaticamente ao reabrir o aplicativo.
- Dados da conta e saída com confirmação em **Configurações**.

Cada obra tem um proprietário. A lista pessoal mostra somente as obras da conta autenticada, inclusive para Administrador. O perfil não é escolhido no formulário: a primeira conta cadastrada recebe Administrador e todas as seguintes recebem Usuário. A atribuição é informada após o cadastro.

O painel administrativo mostra nome, e-mail, perfil, status e quantidade de obras das contas, sem credenciais. O detalhe permite consultar suas obras e ativar/desativar contas USER. Obras abertas por esse caminho exibem **Visualizando como administrador · somente consulta**, sem permitir alterações. Não há exclusão de contas, alteração de senha de terceiros ou edição de perfis. Contas ADMIN são preservadas: não é permitido desativar a própria conta nem o último Administrador ativo.

Contas desativadas não entram no aplicativo; suas obras permanecem salvas. A desativação remove a sessão da conta. A restauração também descarta sessões de contas inativas, e os repositórios revalidam o status antes de liberar dados ou alterações.

### Obras e manuscrito

- Duas obras de exemplo, atribuídas ao primeiro Administrador, com conteúdos independentes.
- Visão geral com quantidade de capítulos, contagem de palavras e porcentagem de capítulos concluídos.
- Criação de capítulos com título e abertura no editor.
- Edição de texto e seleção de status: **Rascunho**, **Em revisão** ou **Concluído**.
- Salvamento manual do texto e do status no dispositivo.
- Aviso ao sair do editor com alterações pendentes, com opções para salvar, continuar escrevendo ou descartar.

### Planejamento da história

- Fichas demonstrativas de personagens com perfil, objetivos e conflitos.
- Bíblia da obra com informações sobre mundo, locais e regras.
- Área de notas e ideias separada do manuscrito.

### Navegação e feedback

- Navegação entre obra, capítulos, personagens, bíblia e notas.
- Estados de carregamento, conteúdo vazio, erro e salvamento.
- Ações para tentar novamente quando uma operação falha.
- Prévia visual dos estados em **Obra → Configurações → Prévia dos estados**, sem alterar os dados da obra.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| React Native e Expo | Interface mobile e execução do aplicativo |
| TypeScript | Tipagem do código |
| Expo SQLite | Persistência local das obras e dos capítulos |
| Expo Crypto | Salt aleatório e hash das senhas locais |
| React Native Web | Execução da interface no navegador |
| React Native Safe Area Context | Respeito às áreas seguras da tela |

## Como rodar

### Pré-requisitos

- Node.js 24 e npm.
- Terminal aberto na pasta do projeto.
- Para Android: emulador configurado ou dispositivo com ambiente Expo compatível com o projeto.
- Para o simulador iOS: macOS e Xcode.
- Para web: navegador com suporte a WebAssembly e SharedArrayBuffer.

### Instalação e início

```bash
npm ci
npm start
```

O Expo inicia o servidor de desenvolvimento e apresenta as opções para abrir o aplicativo. Para escolher a plataforma diretamente:

| Comando | Plataforma |
| --- | --- |
| `npm run android` | Android |
| `npm run ios` | Simulador iOS, no macOS |
| `npm run web` | Navegador |

No Windows, use Android ou web. As versões das dependências estão definidas em `package.json` e `package-lock.json`.

## Como usar

1. Toque em **Criar conta** e preencha nome, e-mail, senha e confirmação. A senha deve ter pelo menos seis caracteres.
2. Após cadastrar, entre com seu e-mail e senha.
3. Escolha uma obra da sua conta e abra **Capítulos**. O primeiro Administrador recebe as obras de exemplo; contas posteriores começam sem obras.
4. Abra ou crie um capítulo, escreva, selecione o status e toque em **Salvar capítulo**. Essa função está disponível aos dois perfis.
5. Em **Configurações**, consulte sua conta ou saia para entrar com outra conta.
6. Como Administrador, use **Configurações → Painel administrativo → Ver detalhes** para consultar o usuário e suas obras ou ativar/desativar uma conta USER. O diagnóstico fica no painel.

A tela de criação de obras ainda não está disponível. O repositório já permite criar uma obra vinculada automaticamente à conta autenticada; o formulário será consolidado em um próximo hotfix funcional. Por isso, uma conta USER recém-criada permanece com a lista vazia na interface atual.

Ao reabrir o aplicativo no mesmo dispositivo, a sessão é recuperada antes de mostrar o acervo. Para trocar de conta, use **Sair da conta → Confirmar saída**.

Use **Personagens** e **Bíblia da obra** como referência durante o planejamento. Registre ideias em **Notas**; elas permanecem apenas durante a sessão, para ambos os perfis.

**Painel administrativo → Banco local → Verificar banco** consulta as quantidades reais de obras, capítulos e usuários no SQLite. A consulta ocorre sob demanda, sem contadores fixos ou acesso ao banco a cada renderização. A lista de usuários é carregada ao entrar na tela e pode ser atualizada pelo botão. O acesso administrativo é protegido tanto na interface quanto nas ações e consultas; Usuário não tem acesso a essa área.

## Dados e limites do protótipo

| Recurso | Comportamento |
| --- | --- |
| Obras de exemplo | Duas obras adicionadas na primeira inicialização do banco |
| Capítulos | Criação, texto e status persistidos no SQLite local (`lorebook.db`) |
| Salvamento | Manual; selecionar status também exige salvar |
| Contas e sessão | Persistidas localmente no SQLite; no máximo uma sessão ativa |
| Notas | Editáveis por ambos os perfis, mantidas apenas durante a sessão |
| Personagens e bíblia | Conteúdo demonstrativo, somente consulta |
| Nova obra e novas fichas | Ainda indisponíveis |
| Backup, recuperação de senha e sincronização | Ainda indisponíveis |

Os capítulos salvos permanecem disponíveis ao reabrir o aplicativo no mesmo dispositivo. As notas são temporárias e não são recuperadas após encerrar a sessão ou sair da conta. Não há backend nem compartilhamento automático de dados entre dispositivos. A migração do banco adiciona as tabelas de autenticação sem apagar obras ou capítulos existentes.

O schema atual é **5**. A atualização é transacional, sem apagar tabelas, obras ou capítulos:

- `users.status` é adicionado com padrão ACTIVE e constraint ACTIVE/DISABLED.
- `projects.owner_user_id` é adicionado com chave estrangeira para `users.id` e índice. Não existe `user_id` redundante em capítulos: a autorização vem da obra.
- O SQLite permite adicionar essa coluna inicialmente nullable. Obras antigas podem ficar sem proprietário somente enquanto não há contas. O primeiro cadastro ADMIN e a atribuição dessas obras acontecem na mesma transação; uma falha reverte ambos.
- Se já houver contas ADMIN no schema anterior, a migração atribui obras sem proprietário ao ADMIN mais antigo (data de criação, com desempate pela ordem de inserção).
- Triggers impedem novas obras sem proprietário ou a remoção do vínculo existente. A FK impede referência a usuário inexistente. O repositório obtém o proprietário da conta autenticada, sem aceitar um proprietário informado no formulário.
- Para o schema intermediário 3 (AUTHOR/READER), a conta mais antiga passa a ADMIN e as demais a USER. IDs, hashes, salts e sessão são preservados. Como o CHECK antigo não aceita os novos perfis, as tabelas antigas são renomeadas para `users_legacy_v3` e `app_session_legacy_v3` e mantidas como arquivo de compatibilidade; as tabelas ativas recebem os registros convertidos. Nenhuma tabela é descartada. Esse arquivo mantém credenciais antigas e não é usado pelo aplicativo.
- Schemas 4 → 5 usam apenas ALTER TABLE, preenchimento de propriedade, índice e triggers. Inicializações repetidas não duplicam ou sobrescrevem conteúdo.

As senhas não são guardadas em texto puro: cada conta usa salt aleatório individual de 16 bytes e hash SHA-256 via `expo-crypto`. **Esta solução é adequada ao protótipo acadêmico local, mas em produção seria recomendado backend com KDF apropriado, como Argon2, scrypt ou bcrypt.** O banco não é criptografado, e a autorização do aplicativo não protege contra adulteração direta do arquivo SQLite.

Na web, os dados pertencem ao armazenamento do navegador e à origem usada. Limpar os dados do site remove esse armazenamento.

O aplicativo ainda é um protótipo: algumas áreas usam conteúdo fictício e recursos indisponíveis são identificados na interface.

## Desenvolvimento

```bash
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform web
```

- `npm run typecheck`: verifica a tipagem TypeScript.
- `npm test`: executa testes de autenticação, sessão, permissões, persistência e migração, usando SQLite via `node:sqlite`. Nos testes, a ponte nativa do Expo Crypto é substituída pelas primitivas equivalentes do Node; a integração nativa precisa ser conferida no dispositivo.
- `npx expo-doctor`: verifica configuração e compatibilidade do projeto Expo.
- `npx expo export --platform web`: gera a versão web na pasta `dist`.

O `metro.config.js` configura WebAssembly e os cabeçalhos necessários ao SQLite web no servidor de desenvolvimento. Uma hospedagem da versão exportada também precisa enviar os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: credentialless`.

Os testes automatizados não substituem a conferência da interface, do teclado, da navegação e da persistência em dispositivos Android/iOS.

### Organização do código

- `screens/` e `components/`: apresentação e interação.
- `auth/AuthContext.tsx`: estado da autenticação, operações e restauração da sessão.
- `auth/AuthFlow.tsx` e `auth/AuthGate.tsx`: fluxo de entrada e seleção entre autenticação e acervo.
- `auth/permissions.ts` e `auth/validation.ts`: regras puras de autorização e validação.
- `auth/chapterActions.ts`: verificação de permissão antes das operações de escrita.
- `auth/useProjectAccess.ts`: abertura autorizada da obra, contexto pessoal/administrativo e feedback de acesso.
- `auth/authRepository.ts`: cadastro, credenciais, sessão e revalidação da conta ativa.
- `admin/adminRepository.ts`: lista/detalhe de usuários, consulta administrativa das obras e mudança de status.
- `db/repositories.ts`: contratos de obras e capítulos com proprietário obrigatório nas operações; `db/diagnosticsRepository.ts`: contagens administrativas.
- `db/transactions.ts`: serializa transações de escrita na conexão compartilhada do SQLite, inclusive na Web.
- `db/database.ts` e `db/DatabaseGate.tsx`: migrações e inicialização do SQLite.
- `App.tsx`: composição dos fluxos e navegação existente, controlada por estado.

### Regras de negócio

| Regra | Comportamento |
| --- | --- |
| RN-01 | A primeira conta cadastrada localmente recebe ADMIN |
| RN-02 | Contas posteriores recebem USER; o cadastro não aceita escolha de perfil |
| RN-03 | E-mail normalizado com trim/lowercase e único no SQLite |
| RN-04 | Toda obra recebe proprietário; legado é vinculado ao primeiro ADMIN |
| RN-05 | USER só acessa suas próprias obras |
| RN-06 | ADMIN consulta usuários e suas obras em contexto administrativo explícito |
| RN-07 | DISABLED não autentica nem mantém sessão válida |
| RN-08 | ADMIN não desativa a própria conta |
| RN-09 | Pelo menos um ADMIN ativo deve ser preservado; alteração de status limitada a USER |
| RN-10 | Capítulos herdam a autorização da obra |

A lista pessoal filtra por proprietário. Os repositórios validam conta ativa, propriedade e contexto antes de ler ou alterar conteúdo. A consulta administrativa exige ADMIN e não libera escrita em obras alheias. Os handlers e a interface também verificam as permissões. As transações mantêm cadastro/atribuição de legado e status/invalidação de sessão consistentes.

### Evolução prevista

A N2 pode reutilizar IDs de usuário, vínculo de propriedade, perfis, status, regras puras e contratos dos repositórios. A tradução de `owner_user_id` (SQLite) para `ownerUserId` (TypeScript) fica na camada de dados. Não há backend, API ou sincronização implementados. Um backend futuro precisará validar identidade e autorização no servidor; o hash acadêmico e o contexto local não devem ser tratados como credenciais remotas.

O HF3 fica reservado à consistência visual, feedback, acessibilidade e usabilidade. Navegação ainda é coordenada por estado no App, notas são temporárias e personagens/bíblia continuam demonstrativos. A criação de obras pela interface fica para uma evolução funcional própria.
