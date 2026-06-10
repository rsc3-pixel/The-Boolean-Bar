# Issues para o GitHub — Entrega 01

Rascunhos prontos pra colar no **Issues** do repositório. Cobrem o requisito "Issue/bug tracker atualizado". Sugestão de labels entre colchetes no título.

> Dica: crie as labels primeiro (Settings → Labels): `bug`, `enhancement`, `tech-debt`, `tests`, `done`.

---

## 1. [bug] Server cai com EPIPE não-tratado no stdin do engine sob carga ✅ RESOLVIDO

**Labels:** `bug`, `done`

**Descrição:**
Sob carga (muitas sessões simultâneas) ou quando uma sala fecha no meio de um turno, um processo de engine pode morrer com um `stdin.write()` ainda pendente. Isso emite um erro `EPIPE` no stream `engine.stdin`. Como não havia listener de `error` nesse stream, virava exceção não-tratada e **derrubava o processo Node inteiro, fechando todas as salas de uma vez**.

**Como foi encontrado:** rodando o novo `web/stress_test.js` com 100 sessões. Antes do fix: 66 erros + servidor morto. Depois: 0 erros, servidor de pé.

**Correção:** listener de `error` no `engine.stdin` em `spawnEngineForRoom` (`web/web_server.js`), que ignora o write pendente (o fim do engine já é tratado em `engine.on('close')`).

**Commit:** `2cda71c7`

---

## 2. [tests] Teste de carga com 100+ sessões simultâneas ✅ FEITO

**Labels:** `tests`, `done`

**Descrição:**
Criar um teste de sistema que suba 100+ sessões de jogo ao mesmo tempo contra o WS server, provando que ele aguenta dezenas de partidas (cada uma com seu engine) sem cair nem vazar processos.

**Entregue:** `web/stress_test.js` (`npm run stress`). Resultado: 100% das sessões com gameplay ativo, 0 erros, server vivo. Documentado em `docs/TESTING.md`.

**Commit:** `ca11df1a`

---

## 3. [enhancement] IA dos bots é aleatória (sem blefe consciente)

**Labels:** `enhancement`

**Descrição:**
Hoje o bot do modo Lógica escolhe carta + tipo aleatórios, e o do Dice sobe a aposta minimamente ou duvida em 30%. Não há inteligência estatística nem blefe consciente. Melhorar a heurística (ex: estimar probabilidade da aposta no Dice, blefar no Lógica conforme o histórico).

**Onde:** `web/web_server.js` (`sendLogicBotInput`, `sendDiceBotInput`).

---

## 4. [bug] Partida só com bots trava na fase "Pressione Enter"

**Labels:** `bug`

**Descrição:**
Quando uma sala tem apenas bots (sem humano), o jogo trava na pausa "Pressione Enter para continuar..." entre rodadas, porque o humano é quem envia o `\n` que destrava, e o bot não faz isso.

**Possível solução:** o server também gerar o `\n` automático quando o `expectedPlayerId` da pausa for um bot (ou quando não houver humanos na sala).

---

## 5. [tech-debt] GamePage (modo Lógica) usa hack de `zoom` no mobile

**Labels:** `tech-debt`

**Descrição:**
A `GamePage.tsx` usa `zoom: 0.65/0.75/0.85` pra caber as 6 cartas em arco em telas baixas. Funciona, mas é um workaround. Refazer sério exige abandonar o layout fixo de cartas em arco por um responsivo de verdade.

**Onde:** `web/src/pages/GamePage.tsx`.

---

## 6. [enhancement] Slider de volume da música (hoje é fixo em 50%)

**Labels:** `enhancement`

**Descrição:**
O toggle de música só liga/desliga, com volume fixo em 50%. Adicionar um slider de volume nas configurações.

**Onde:** controle de áudio em `web/src/App.tsx` + painel de settings.

---

## 7. [tech-debt] Engine encerra a sala quando um jogador sai no meio da partida

**Labels:** `tech-debt`

**Descrição:**
O engine em C não sabe pular um jogador que desconectou no meio do loop de turnos. Por isso, quando alguém sai mid-game, o server fecha a sala inteira (`reason: 'player_left_mid_game'`). Suportar continuação parcial exige refactor do loop do engine.

**Onde:** `engine/modules/game_flow.c` / `dice_flow.c` + tratamento no `web/web_server.js`.

---

> **Histórias da Entrega (≥6):** as 12 tasks de imersão em [TASKS_IMERSAO.md](TASKS_IMERSAO.md) também podem virar issues (uma por task), cobrindo o requisito "implementar pelo menos 6 histórias". Cada uma já tem descrição, arquivos impactados e critérios de aceite prontos.
