# LoreBook — Protótipo Mobile

O LoreBook é um protótipo de aplicativo mobile para escrever e organizar histórias. Ele reúne capítulos, personagens, informações sobre o universo da obra e notas de planejamento em um só lugar.

Desenvolvido com React Native, TypeScript e Expo, o projeto explora uma experiência de escrita no celular com armazenamento local. A identidade própria do LoreBook segue o conceito **códice editorial contemporâneo**: papel claro, tinta escura, ameixa, latão discreto e títulos serifados. O corpo usa fonte de sistema para leitura confortável, sem pacotes de fontes ou UI kits.

## Objetivos

- Explorar um fluxo simples de escrita e organização literária em telas pequenas.
- Manter o manuscrito e seu planejamento organizados por obra.
- Acompanhar a evolução dos capítulos, do rascunho à conclusão.
- Experimentar navegação, legibilidade e feedback antes de ampliar o aplicativo.
- Priorizar o uso local, com contas no próprio dispositivo e sem serviço de nuvem.

## Funcionalidades

### Conta e perfis

- Cadastro e login locais com nome, e-mail e senha.
- Perfil **Usuário (USER)**: cria, consulta, edita e exclui suas próprias obras e capítulos.
- Perfil **Administrador (ADMIN)**: escreve nas próprias obras e consulta usuários, suas obras e o diagnóstico SQLite em uma área administrativa separada.
- Sessão restaurada automaticamente ao reabrir o aplicativo.
- Dados da conta e saída com confirmação em **Configurações**.

Cada obra tem um proprietário. A lista pessoal mostra somente as obras da conta autenticada, inclusive para Administrador. O perfil não é escolhido no formulário: a primeira conta cadastrada recebe Administrador e todas as seguintes recebem Usuário. A atribuição é informada após o cadastro.

O painel administrativo mostra nome, e-mail, perfil, status e quantidade de obras das contas, sem credenciais. O detalhe permite consultar suas obras e ativar/desativar contas USER. Obras abertas por esse caminho exibem **Visualizando como administrador · somente consulta**, sem permitir alterações. Não há exclusão de contas, alteração de senha de terceiros ou edição de perfis. Contas ADMIN são preservadas: não é permitido desativar a própria conta nem o último Administrador ativo.

Contas desativadas não entram no aplicativo; suas obras permanecem salvas. A desativação remove a sessão da conta. A restauração também descarta sessões de contas inativas, e os repositórios revalidam o status antes de liberar dados ou alterações.

### Obras e manuscrito

- Duas obras de exemplo, atribuídas ao primeiro Administrador, com conteúdos independentes.
- CRUD de obras: criar, listar, editar título/gênero e excluir com confirmação.
- Visão geral com quantidade de capítulos, contagem de palavras e porcentagem de capítulos concluídos.
- CRUD de capítulos: criar, ler, editar título/texto/status e excluir com confirmação.
- Status: **Rascunho**, **Em revisão** ou **Concluído**.
- Salvamento manual de título, texto e status no dispositivo, com contagem real de palavras.
- Aviso ao sair do editor com alterações pendentes, com opções para salvar, continuar escrevendo ou descartar.
- Títulos obrigatórios de 1–80 caracteres após trim; gênero opcional de até 40 caracteres. Validação também nos repositórios.
- Exclusão de obra e capítulos associados na mesma transação, com rollback em caso de erro.

### Planejamento da história

- Fichas demonstrativas de personagens com perfil, objetivos e conflitos.
- Bíblia da obra com informações sobre mundo, locais e regras.
- Área de notas e ideias separada do manuscrito.

### Navegação e feedback

- Navegação entre obra, capítulos, personagens, bíblia e notas.
- Estados de carregamento, conteúdo vazio, erro e salvamento.
- Mensagens discretas de sucesso, dispensáveis e com fechamento automático.
- Confirmações consistentes para excluir, sair da conta, descartar alterações e desativar usuário.
- Labels visíveis, nomes acessíveis, botões com altura mínima de 48 px e navegação respeitando safe area.
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

- Node.js 22 ou superior e npm.
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
3. Em **Minhas obras**, toque em **Nova obra**, preencha título e gênero e crie. O primeiro Administrador também recebe as obras de exemplo.
4. Na home da obra, crie um capítulo, edite título e texto, selecione o status e toque em **Salvar capítulo**. Essa função está disponível aos dois perfis.
5. Em **Configurações**, consulte sua conta ou saia para entrar com outra conta.
6. Como Administrador, use **Configurações → Painel administrativo → Ver detalhes** para consultar o usuário e suas obras ou ativar/desativar uma conta USER. O diagnóstico fica no painel.

Para editar a obra, use **Editar título e gênero** na home. A opção **Excluir obra** fica no fim dessa tela. Para excluir um capítulo, abra o editor e use **Excluir capítulo**, abaixo do manuscrito. Confirme somente após revisar a mensagem: exclusões são definitivas no dispositivo. Excluir uma obra também remove seus capítulos.

Ao reabrir o aplicativo no mesmo dispositivo, a sessão é recuperada antes de mostrar o acervo. Para trocar de conta, use **Sair da conta → Confirmar saída**.

Use **Personagens** e **Bíblia da obra** como referência durante o planejamento. Registre ideias em **Notas**; elas permanecem apenas durante a sessão, para ambos os perfis.

**Painel administrativo → Banco local → Verificar banco** consulta as quantidades reais de obras, capítulos e usuários no SQLite. A consulta ocorre sob demanda, sem contadores fixos ou acesso ao banco a cada renderização. A lista de usuários é carregada ao entrar na tela e pode ser atualizada pelo botão. O acesso administrativo é protegido tanto na interface quanto nas ações e consultas; Usuário não tem acesso a essa área.

## Dados e limites do protótipo

| Recurso | Comportamento |
| --- | --- |
| Obras de exemplo | Duas obras adicionadas na primeira inicialização do banco |
| Obras | Criação, título, gênero, proprietário e exclusão no SQLite local (`lorebook.db`) |
| Capítulos | Título, conteúdo, status, palavras e exclusão persistidos |
| Salvamento | Manual no editor; título e status também exigem salvar |
| Contas e sessão | Persistidas localmente no SQLite; no máximo uma sessão ativa |
| Notas | Editáveis por ambos os perfis, mantidas apenas durante a sessão |
| Personagens e bíblia | Conteúdo demonstrativo, somente consulta |
| Novas fichas e registros da Bíblia | Ainda indisponíveis; obras novas mostram estados vazios |
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

O CRUD atual usa esse schema sem nova migração. Excluir obra remove explicitamente seus capítulos na mesma transação, inclusive em bancos antigos sem cascade. Os números dos capítulos restantes não são alterados após uma exclusão. Os IDs, vínculos e timestamps existentes são preservados; alterações atualizam `updated_at`.

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

## Arquitetura atual

```text
Presentation → Application
Application → Domain
Application → Data / Repositories → Infrastructure / SQLite
```

Telas apresentam e coletam dados; hooks/contexto coordenam estado; validações e permissões são regras puras; repositórios revalidam a conta e o proprietário antes de executar SQL. A arquitetura evolui por necessidade, sem introduzir navegação ou estado global externos.

- `presentation/screens/` e `presentation/components/`: telas, controles, feedback visual e composição dos fluxos `AuthFlow`, `AuthGate` e `DatabaseGate`.
- `application/contexts/`: `AuthContext` gerencia autenticação/sessão; `FeedbackContext` centraliza estado, confirmação e mensagens transitórias.
- `application/hooks/`: CRUD e rascunhos em `useProjects`/`useChapters`, autorização e acesso em `useAuthorization`/`useProjectAccess`, ciclo de inicialização do banco em `useDatabase`.
- `application/actions/chapterActions.ts`: verificação de permissão antes das operações de escrita.
- `domain/auth/`, `domain/permissions/`, `domain/validation/` e `domain/types/`: tipos, permissões, validações e regras puras, sem React ou SQLite.
- `data/repositories/authRepository.ts`: cadastro, credenciais, sessão e revalidação da conta ativa.
- `data/repositories/adminRepository.ts`: lista/detalhe de usuários, consulta administrativa das obras e mudança de status.
- `data/repositories/contentRepository.ts`: operações de obras e capítulos com proprietário obrigatório; `diagnosticsRepository.ts`: contagens administrativas.
- `infrastructure/database/database.ts` e `transactions.ts`: schema, migrações, inicialização e transações SQLite, inclusive na Web.
- `infrastructure/security/passwords.ts`: implementação do salt/hash com Expo Crypto.
- `data/mock.ts`: dados demonstrativos existentes; `theme.ts`: tema compartilhado.
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
| RN-11 | Toda nova obra pertence à conta autenticada |
| RN-12 | Somente proprietário modifica ou exclui a obra |
| RN-13 | Somente proprietário ativo cria, edita ou exclui seus capítulos |
| RN-14 | Excluir obra remove os capítulos associados de forma atômica |
| RN-15 | Título de obra não pode ser vazio |
| RN-16 | Título de capítulo não pode ser vazio |
| RN-17 | Obra inexistente não recebe novos capítulos |

A lista pessoal filtra por proprietário. Os repositórios validam conta ativa, propriedade e contexto antes de ler ou alterar conteúdo. A consulta administrativa exige ADMIN e não libera escrita em obras alheias. Os handlers e a interface também verificam as permissões. As transações mantêm cadastro/atribuição de legado e status/invalidação de sessão consistentes.

### Evolução prevista

Futuramente pode-se reutilizar IDs de usuário, vínculo de propriedade, perfis, status, regras puras e contratos dos repositórios. A tradução de `owner_user_id` (SQLite) para `ownerUserId` (TypeScript) fica na camada de dados. Não há backend, API ou sincronização implementados. Um backend futuro precisará validar identidade e autorização no servidor; o hash acadêmico e o contexto local não devem ser tratados como credenciais remotas.

Navegação ainda é coordenada por estado no App, notas são temporárias e personagens/Bíblia continuam demonstrativos. Backend, sincronização, autenticação online, colaboração, publicação e recuperação de senha não estão implementados. Futuramente será exigido decisões próprias de segurança, conflitos e propagação de exclusões.
