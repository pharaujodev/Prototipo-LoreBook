# LoreBook — Protótipo Mobile

O LoreBook é um protótipo de aplicativo mobile para escrever e organizar histórias. Ele reúne capítulos, personagens, informações sobre o universo da obra e notas de planejamento em um só lugar.

Desenvolvido com React Native, TypeScript e Expo, o projeto explora uma experiência de escrita no celular com armazenamento local. Sua identidade visual se inspira no Ateliê Desktop, combinando vinho, dourado, tons de papel e tipografia serifada. Os dois aplicativos são projetos separados, sem integração de dados.

## Objetivos

- Explorar um fluxo simples de escrita e organização literária em telas pequenas.
- Manter o manuscrito e seu planejamento organizados por obra.
- Acompanhar a evolução dos capítulos, do rascunho à conclusão.
- Experimentar navegação, legibilidade e feedback antes de ampliar o aplicativo.
- Priorizar o uso local, sem exigir conta ou serviço de nuvem para trabalhar nos capítulos.

## Funcionalidades

### Obras e manuscrito

- Duas obras de exemplo, com conteúdos independentes.
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

1. Escolha uma das obras de exemplo.
2. Entre em **Capítulos** e abra um capítulo existente ou crie um novo.
3. Escreva e selecione o status desejado.
4. Toque em **Salvar capítulo** para guardar o texto e o status.
5. Volte à lista ou à visão geral para acompanhar o manuscrito.

Use **Personagens** e **Bíblia da obra** como referência durante o planejamento. Em **Notas**, registre ideias que ainda não fazem parte do texto principal.

## Dados e limites do protótipo

| Recurso | Comportamento |
| --- | --- |
| Obras de exemplo | Duas obras adicionadas na primeira inicialização do banco |
| Capítulos | Criação, texto e status persistidos no SQLite local (`lorebook.db`) |
| Salvamento | Manual; selecionar status também exige salvar |
| Notas | Editáveis, mantidas apenas durante a sessão |
| Personagens e bíblia | Conteúdo demonstrativo, somente consulta |
| Nova obra e novas fichas | Ainda indisponíveis |
| Backup, conta e sincronização | Ainda indisponíveis |

Os capítulos salvos permanecem disponíveis ao reabrir o aplicativo no mesmo dispositivo. As notas são temporárias e não são recuperadas após encerrar a sessão. Não há backend nem compartilhamento automático de dados entre dispositivos.

Na web, os dados pertencem ao armazenamento do navegador e à origem usada. Limpar os dados do site remove esse armazenamento.

O aplicativo ainda é um protótipo: algumas áreas usam conteúdo fictício e recursos indisponíveis são identificados na interface.

## Desenvolvimento

```bash
npm run typecheck
npm test
npx expo export --platform web
```

- `npm run typecheck`: verifica a tipagem TypeScript.
- `npm test`: executa testes de persistência, migração, isolamento por obra, recuperação de falhas e identificação de alterações pendentes, usando SQLite via `node:sqlite`.
- `npx expo export --platform web`: gera a versão web na pasta `dist`.

O `metro.config.js` configura WebAssembly e os cabeçalhos necessários ao SQLite web no servidor de desenvolvimento. Uma hospedagem da versão exportada também precisa enviar os cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: credentialless`.

Os testes automatizados não substituem a conferência da interface, do teclado, da navegação e da persistência em dispositivos Android/iOS.
