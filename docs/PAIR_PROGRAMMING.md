# Programação em Pares — Atualização (Entrega 01)

Atualização do relato de pareamento do squad, incrementando o relato da entrega anterior. As duplas abaixo são evidenciáveis no histórico do git (commits de 2+ integrantes no mesmo módulo/feature em datas próximas) e nos Pull Requests do repositório (25+ PRs com review antes do merge).

## Duplas do sprint de Ranking e Pontuação (21 a 27/05)

### Cauã Rêgo + Matheus Larré — pontuação no engine C
A dupla de C dividiu a feature de pontuação no engine: Matheus implementou o acúmulo de pontos e rodadas no modo Dados (`a24fca26`, 22/05) e Cauã a pontuação no modo Lógica com o `JSON_VICTORY` estendido (`df8cb2a6`, 25/05). Os dois trabalharam sobre os mesmos arquivos (`dice_flow.c`, `game_flow.c`, `types.h`), alternando quem dirigia conforme o modo de jogo.

### Renato Chong + Maria Eduarda — sistema de ranking
Eduarda abriu o caminho com o sistema de pontos no ranking (Task 4.1, `afd031c4`, 24/05) e a chamada de push no `recordWin` (Task 4.2, `42a00fcc`); Renato integrou a pontuação real do engine no leaderboard e a coluna PTS da TV (`8e5ea22e`, 25/05). A integração passou pelo PR #23 (`feature/task-4.2-push-ranking`), revisado e mergeado pelo Tech Lead.

### Renato Chong + Cauã Rêgo — modo TV
Cauã criou a rota `/tv` com ranking ao vivo e breakdown de vitória (`850b0da8`, 25/05); Renato complementou com o painel de salas ativas (`00a4254a`) e o QR code de entrada (`5fe2bca3`, 27/05). Feature única construída a quatro mãos em dois dias.

### Matheus Larré + Renato Chong — sprint de imersão
As 12 tasks de imersão ([KANBAN_IMERSAO.md](KANBAN_IMERSAO.md)) foram divididas na mesma sprint: Matheus entregou as tasks 1 a 4 (countdown `fbab39e5`, emojis `af69c580`, sons de roleta `2bb12eb1`, shake `f3153e8c`, todas em 26/05) e Renato as tasks 5 a 12 (`f2dbb992`, 26/05). O merge cruzado passou pelos PRs #25, #26 e #27, com review de quem não escreveu o código.

### Luís Nunes — revisão guiada sobre o código da dupla
Em 23/05, Luís fez uma série de 8 commits de refatoração e acessibilidade (`ec30cebe`, `52b52e98`, `3a65d3bf`, `6c1930fe`, `8e703858`, `c0701442`, `4de21118`, `89c265d6`) sobre código escrito por Renato e Matheus: extração de magic numbers, JSDoc, aria-labels e padronização. Na prática funcionou como navigator a posteriori, com a dupla original validando cada mudança no PR.

## Como pareamos

- Dupla por área de domínio, seguindo os papéis do squad: Lógica (João Pedro + Fernando), engine C (Cauã + Matheus), com o Tech Lead rotacionando como par de integração.
- Fluxo: branch por feature, commits pequenos, PR pra `main` com review de pelo menos 1 membro que não escreveu o código.
- O conceito de pronto ([TESTING.md](TESTING.md)) é verificado pelo revisor, não pelo autor.

## O que aprendemos desde o último relato

- Pareamento assíncrono (um abre a feature, o outro completa no dia seguinte) funcionou melhor pro squad do que sessões longas de tela compartilhada, por causa dos horários diferentes.
- Review de quem não escreveu pegou bugs reais antes do merge (ex: os 3 bugs da auditoria corrigidos em `2fca5d54`).
- O ponto fraco continua sendo a distribuição: o Tech Lead concentra a maior parte dos commits de integração. Meta pra próxima entrega: duplas tocarem a integração de ponta a ponta sem passar pelo TL.
