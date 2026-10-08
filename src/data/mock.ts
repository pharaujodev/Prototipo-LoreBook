import { ProjectWorkspace } from '../domain/types/content';

export const workspaces: ProjectWorkspace[] = [
  {
    project: {
      id: 'p1',
      title: 'O Soberano Além dos Mundos',
      genre: 'Fantasia • Aventura',
      progress: 42,
      chapters: 3,
      updatedAt: 'Hoje, 08:42'
    },
    chapters: [
      {
        id: 'p1-c1',
        number: 1,
        title: 'O nome que ficou',
        status: 'Concluído',
        words: 2418,
        content:
          'A chuva tinha parado antes do amanhecer, mas o cheiro de terra molhada ainda entrava pelas frestas da forja. Alaric acordou antes de Rodrick, como quase sempre fazia.\n\nEle ficou alguns segundos olhando o teto baixo, ouvindo o vento bater nas telhas. Depois se levantou, vestiu a camisa de trabalho e foi até a bancada. Havia muito a fazer antes que a vila despertasse.'
      },
      {
        id: 'p1-c2',
        number: 2,
        title: 'Cinzas na forja',
        status: 'Revisão',
        words: 1987,
        content:
          'Rodrick ensinava mais pelo que fazia do que pelo que dizia. Alaric aprendeu cedo a observar o peso do martelo, o tempo do fogo e o momento exato em que o metal deixava de resistir.'
      },
      {
        id: 'p1-c3',
        number: 3,
        title: 'A trilha ao norte',
        status: 'Rascunho',
        words: 812,
        content:
          'A floresta parecia diferente quando se entrava nela sozinho. Os sons eram os mesmos, mas sem a conversa de Rodrick cada galho quebrado parecia mais próximo.'
      }
    ],
    characters: [
      {
        id: 'p1-ch1',
        name: 'Alaric Varen',
        role: 'Protagonista',
        age: '7 anos',
        summary: 'Observador, disciplinado e desconfiado. Trabalha na forja e deseja conquistar um futuro por mérito próprio.',
        goal: 'Preparar-se para a Torre do Despertar e conquistar independência.',
        conflict: 'Aprender a confiar em outras pessoas sem abrir mão do próprio caminho.'
      },
      {
        id: 'p1-ch2',
        name: 'Edric Halvern',
        role: 'Mentor',
        age: 'Adulto',
        summary: 'Ex-duque conhecido por sua habilidade marcial. Seco, prático e paciente quando a situação exige.',
        goal: 'Entender o potencial de Alaric e decidir até onde deve se envolver.',
        conflict: 'Seu passado político ainda influencia suas decisões.'
      },
      {
        id: 'p1-ch3',
        name: 'Serena Halvern',
        role: 'Aliada',
        age: 'Jovem',
        summary: 'Reservada com desconhecidos, estrategista e muito mais expansiva quando se sente segura.',
        goal: 'Construir sua própria competência em estratégia e comando.',
        conflict: 'Precisa encontrar espaço próprio dentro do peso do nome Halvern.'
      }
    ],
    bibleEntries: [
      {
        id: 'p1-b1',
        category: 'Mundo',
        title: 'Eryndor',
        text: 'Mundo de fantasia dividido entre diferentes povos, reinos e continentes, com sistemas próprios de poder e política.'
      },
      {
        id: 'p1-b2',
        category: 'Local',
        title: 'Ducado Halvern',
        text: 'Território conhecido por tradição militar, rotas estratégicas e pela influência histórica da Casa Halvern.'
      },
      {
        id: 'p1-b3',
        category: 'Regra',
        title: 'Torre do Despertar',
        text: 'A Torre é uma prova decisiva para jovens que buscam despertar capacidades e definir caminhos futuros.'
      }
    ],
    notes: '• Rever a motivação do antagonista no capítulo 4.\n• Plantar uma pista sobre a Torre antes da viagem.\n• Decidir o nome definitivo da capital.'
  },
  {
    project: {
      id: 'p2',
      title: 'Cidade de Vidro',
      genre: 'Fantasia urbana',
      progress: 18,
      chapters: 3,
      updatedAt: '12 set.'
    },
    chapters: [
      {
        id: 'p2-c1',
        number: 1,
        title: 'Reflexos na chuva',
        status: 'Concluído',
        words: 1735,
        content: 'A chuva riscava as vitrines da avenida quando Lia percebeu que seu reflexo havia piscado um instante depois dela.'
      },
      {
        id: 'p2-c2',
        number: 2,
        title: 'A estação vazia',
        status: 'Revisão',
        words: 1264,
        content: 'A plataforma deveria estar cheia àquela hora, mas o último trem passou sem reduzir a velocidade e sem ninguém nas janelas.'
      },
      {
        id: 'p2-c3',
        number: 3,
        title: 'O outro lado do vidro',
        status: 'Rascunho',
        words: 604,
        content: 'O espelho do corredor não refletia mais o apartamento. Do outro lado havia uma rua que Lia nunca tinha visto.'
      }
    ],
    characters: [
      {
        id: 'p2-ch1',
        name: 'Lia Monteiro',
        role: 'Protagonista',
        age: '24 anos',
        summary: 'Restauradora de vitrais que começa a perceber falhas impossíveis nos reflexos da cidade.',
        goal: 'Descobrir por que determinados espelhos mostram lugares que não existem.',
        conflict: 'Quanto mais investiga, menos consegue confiar no que vê.'
      },
      {
        id: 'p2-ch2',
        name: 'Tomás Vale',
        role: 'Aliado',
        age: '27 anos',
        summary: 'Fotógrafo noturno que documenta regiões da cidade que parecem mudar depois da meia-noite.',
        goal: 'Provar que as alterações urbanas não são coincidência.',
        conflict: 'Seu desejo de registrar tudo frequentemente o coloca em risco.'
      }
    ],
    bibleEntries: [
      {
        id: 'p2-b1',
        category: 'Mundo',
        title: 'A cidade refletida',
        text: 'Alguns reflexos exibem uma versão paralela da cidade, semelhante à real, mas com ruas e edifícios deslocados.'
      },
      {
        id: 'p2-b2',
        category: 'Local',
        title: 'Estação Central',
        text: 'Uma estação antiga que aparece repetidamente em fotografias e reflexos, mesmo quando não está próxima.'
      },
      {
        id: 'p2-b3',
        category: 'Regra',
        title: 'Reflexos atrasados',
        text: 'Quando um reflexo se move fora de sincronia, a fronteira entre as duas cidades está temporariamente enfraquecida.'
      }
    ],
    notes: '• Definir o motivo de a estação aparecer nos reflexos.\n• Introduzir Tomás antes do terceiro capítulo.\n• Escolher o bairro onde fica o ateliê de Lia.'
  }
];

export const projects = workspaces.map((workspace) => workspace.project);
