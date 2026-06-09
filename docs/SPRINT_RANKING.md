# 🏆 Sprint: Ranking & Pontuação

Planejamento da sprint definida na reunião de **21/05/2026**.

| | |
|---|---|
| **Período** | quinta 21/05 → domingo 24/05/2026 |
| **Deadline interno** | domingo 24/05 às **15h** |
| **Limite máximo** | segunda 25/05 (conforme reunião) |
| **Esforço estimado** | ~26h · caminho crítico ~10,5h |
| **Squad** | Squad 7 — Tech Lead: Renato |

> Terminar domingo 15h deixa a segunda livre pra revisão — atende a preocupação levantada na reunião sobre "tempo para revisar se entregue muito em cima da hora".

---

## 🎯 Objetivo

Transformar o leaderboard de vitórias num **sistema de ranking por pontuação**, com pontos por ação, bônus de performance e exibição **ao vivo numa TV**, suportando **várias salas simultâneas** de até **8 jogadores**.

---

## ✅ O que JÁ existe (não refazer)

- **Salas simultâneas isoladas** — o servidor já roda `Map<roomId, Room>`, cada sala com seu próprio engine. Múltiplos jogos em paralelo já funcionam.
- **Leaderboard persistido** — [web/leaderboard.json](../web/leaderboard.json) gravado por [web/web_server.js](../web/web_server.js), exibido na tela [LeaderboardPage.tsx](../web/src/pages/LeaderboardPage.tsx) ("HIGH SCORES"). Hoje conta **só vitórias (`wins`)**, agregadas por nome do jogador.

## ❌ O gap real (o que esta sprint entrega)

| Reunião pediu | Estado atual no código |
|---|---|
| 8 pessoas por sala | `MAX_PLAYERS=7` em [engine/core/types.h:80](../engine/core/types.h#L80) e `MAX_PLAYERS_PER_ROOM=7` em [web/web_server.js:30](../web/web_server.js#L30) |
| Dados variáveis por nº de jogadores | `dice_count = 5` **fixo** em [engine/modules/dice_flow.c:127](../engine/modules/dice_flow.c#L127) |
| Pontos por ação + bônus + penalidade | **Não existe** — engine não conta pontos nem rodadas |
| Ranking por pontuação | Leaderboard só soma `wins`, não pontos |
| "Puxa dados automaticamente quando alguém ganha" | É **pull manual** — `LeaderboardPage` carrega 1× ao abrir + botão "Atualizar". Não atualiza sozinho |
| Exibição numa TV ao vivo | Não existe modo TV |

> **Ponto-chave:** o engine hoje emite `JSON_VICTORY: {winner, totalPlayers}` — sem pontos, rodadas ou vidas. Estender esse evento é o eixo da sprint.

---

## 📋 Backlog

**Donos sugeridos:** Eng.C = Cauã/Matheus · Logic = João Pedro/Fernando · Server = Renato · UI = Luís · QA = Gabriel · PM = Renato

### ÉPICO 1 — Sala de até 8 jogadores

| ID | Funcionalidade | Pronto quando | Est. | Dono | Prioridade |
|---|---|---|---|---|---|
| 1.1 | `MAX_PLAYERS` 7→8 em [types.h:80](../engine/core/types.h#L80). **`make clean` obrigatório** (pegadinha: mudar `types.h` sem clean = segfault em runtime) | Cria 8 jogadores sem crash nos 2 modos | 0,5h | Eng.C | MUST |
| 1.2 | `MAX_PLAYERS_PER_ROOM` 7→8 em [web_server.js:30](../web/web_server.js#L30) | 8ª pessoa entra na sala; "sala cheia" só no 9º | 0,5h | Server | MUST |
| 1.3 | Ajustar telas para 8 players: [WaitingRoom](../web/src/pages/WaitingRoom.tsx), [GamePage](../web/src/pages/GamePage.tsx) (arco de cartas + zoom hack), [DiceGameOnline](../web/src/pages/DiceGameOnline.tsx) | 8 players visíveis sem overflow em desktop e mobile | 2h | UI | MUST |

> `dice[5]` e `hand[5]` são arrays por-jogador — **não mudam**. `BOT_NAMES` tem 7 nomes: cobre 1 humano + 7 bots = 8. OK.

### ÉPICO 2 — Dados dinâmicos por nº de jogadores

| ID | Funcionalidade | Pronto quando | Est. | Dono | Prioridade |
|---|---|---|---|---|---|
| 2.1 | Função `dados_iniciais(n)` em [dice_flow.c](../engine/modules/dice_flow.c#L127), substitui o `5` fixo. Escala proposta: **2-3→5, 4-5→4, 6-8→3** (bate com a reunião: 8=3, 4=4, máx 5) | Nº de dados muda conforme jogadores; `JSON_DICE_STATE` reflete | 1h | Eng.C | MUST |
| 2.2 | Mostrar a regra "N jogadores = M dados" no lobby | Texto visível antes de iniciar a partida | 0,5h | UI | STRETCH |

### ÉPICO 3 — Pontuação e bônus

| ID | Funcionalidade | Pronto quando | Est. | Dono | Prioridade |
|---|---|---|---|---|---|
| 3.1 | **Definir tabela de pontos** + fórmulas de bônus/penalidade (doc curto). 🔒 **Bloqueia 3.2 e 3.3** | Doc com valores numéricos aprovado pelo squad | 1h | PM + squad | MUST |
| 3.2 | Engine **dice**: contar rodadas + acumular pontos por ação + penalidade por erro/dado perdido | Partida soma pontos internamente, verificável em log | 3h | Eng.C | MUST |
| 3.3 | Engine **lógica** ([game_flow.c](../engine/modules/game_flow.c)): rodadas, pontos por ação, bônus "sem perder vidas" | Mesma mecânica no modo lógica | 3h | Logic | STRETCH |
| 3.4 | Estender `JSON_VICTORY` com pontuação final, rodadas e breakdown de bônus | Evento traz pontos por jogador | 1,5h | Eng.C | MUST |
| 3.5 | Tela de relatório final da partida com breakdown de pontos/bônus | Ao fim da partida, todos veem o detalhamento | 2h | UI | STRETCH |

> A reunião pede "relatório **só no final**" — simplifica: o engine apenas **acumula** durante o jogo e despeja tudo no `JSON_VICTORY`. Não precisa emitir pontos a cada turno.

#### Regras de bônus (da reunião — formalizar em 3.1)

- **Vitória rápida** — vencer em menos rodadas multiplica a pontuação (ex.: 6 rodadas × 2 = pontuação dobrada).
- **Vitória limpa** — vencer sem perder vidas (logic) / sem perder dados (dice) = pontos extras.
- **Penalização** — erros (blefe desmascarado, dúvida injusta, dado perdido) descontam pontos.

### ÉPICO 4 — Ranking em tempo real / TV

| ID | Funcionalidade | Pronto quando | Est. | Dono | Prioridade |
|---|---|---|---|---|---|
| 4.1 | `leaderboard.json` passa a guardar `points` (além de `wins`); `getTopWinners` ordena por pontos | `recordWin` soma pontos; ranking ordenado por pontuação | 1h | Server | MUST |
| 4.2 | **Push automático**: server faz broadcast do `leaderboard` quando qualquer partida termina (hoje é pull manual) | Toda tela de ranking aberta atualiza sozinha ao fim de qualquer sala | 1h | Server | MUST |
| 4.3 | **Modo TV**: layout de tela grande, auto-update, sem input, legível à distância | Rota TV mostra o ranking ao vivo | 3h | UI | MUST |
| 4.4 | Painel de salas/jogos ativos na TV (server expõe snapshot de `rooms`) | TV mostra nº de salas + status de cada jogo | 2h | Server + UI | STRETCH |

### ÉPICO 5 — QA, deploy e logística

| ID | Funcionalidade | Pronto quando | Est. | Dono | Prioridade |
|---|---|---|---|---|---|
| 5.1 | Teste de 2+ salas simultâneas — rankings independentes + leaderboard agrega certo | Partidas paralelas terminam e a TV reflete ambas | 1,5h | QA | MUST |
| 5.2 | Teste de sala cheia (8) nos 2 modos | 8 players (humanos + bots) jogam logic e dice sem crash | 1h | QA | MUST |
| 5.3 | Deploy na VM (`git pull` → `make clean` → build → `pm2 restart`) + teste da TV ao vivo | Produção no ar em rsc3-boolean.duckdns.org com tudo funcionando | 1h | Server | MUST |
| 5.4 | Confirmar TV física na sala + cabo/conexão (HDMI, navegador) | TV testada com a URL antes do dia da apresentação | 0,5h | PM | MUST |

---

## 🗓️ Cronograma

| Dia | Foco | Itens |
|---|---|---|
| **Qui 21/05** (hoje) | Fundação | **3.1 primeiro** (destrava o épico 3) → 1.1, 1.2, 2.1 em paralelo |
| **Sex 22/05** | Núcleo | 3.2, 3.3, 4.1, 1.3 |
| **Sáb 23/05** | Integração | 3.4, 4.2, 4.3, 3.5 + (2.2, 4.4 se sobrar) |
| **Dom 24/05 até 15h** | Fechamento | 5.1, 5.2, 5.3 + buffer de correção (5.4 a qualquer momento) |

### Caminho crítico

```
3.1 → 3.2 → 3.4 → 4.1 → 4.2 → 4.3   (~10,5h)
```

É a sequência que **não pode atrasar** — o resto é paralelizável. Total ≈ 26h; com 7 pessoas cabe no prazo, **desde que 3.1 saia ainda hoje**.

---

## ✂️ Corte de escopo (se atrasar)

- **MUST — compromisso de entrega:** 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4
- **STRETCH — corta primeiro:** 3.3 (pontuação no modo lógica — dice tem prioridade), 3.5 (relatório pode ir numa versão simples), 2.2, 4.4

---

## ⚠️ Riscos

| Risco | Mitigação |
|---|---|
| 3.1 atrasar trava o caminho crítico inteiro | Fazer **hoje**, sem exceção |
| Esquecer `make clean` ao mexer em `types.h` (1.1 / 3.2) → segfault em runtime | Incluir no checklist de cada build do engine |
| GamePage com 8 cartas em arco usa zoom hack — pode quebrar layout | 1.3 é o item com maior chance de estourar a estimativa; começar cedo |
| `JSON_DICE_STATE` precisa filtragem per-client — não quebrar ao mexer no engine dice | Manter o marker `perClient` do server intacto (ver CLAUDE.md) |

---

## ✔️ Definition of Done da sprint

- [ ] Sala aceita 8 jogadores nos 2 modos, sem crash
- [ ] Dice distribui dados conforme o nº de jogadores
- [ ] Tabela de pontos definida e aplicada no engine
- [ ] `JSON_VICTORY` carrega pontuação, rodadas e bônus
- [ ] Leaderboard ordena por pontos e atualiza sozinho ao fim de cada partida
- [ ] Modo TV exibe o ranking ao vivo, legível à distância
- [ ] Testado com salas simultâneas e sala cheia
- [ ] Deploy em produção e TV física validada

## 📌 Acompanhamento

```
ÉPICO 1 — Sala de 8        [ ] 1.1   [ ] 1.2   [ ] 1.3
ÉPICO 2 — Dados dinâmicos  [ ] 2.1   [ ] 2.2
ÉPICO 3 — Pontuação        [ ] 3.1   [ ] 3.2   [ ] 3.3   [ ] 3.4   [ ] 3.5
ÉPICO 4 — Ranking / TV     [ ] 4.1   [ ] 4.2   [ ] 4.3   [ ] 4.4
ÉPICO 5 — QA & Deploy      [ ] 5.1   [ ] 5.2   [ ] 5.3   [ ] 5.4
```
