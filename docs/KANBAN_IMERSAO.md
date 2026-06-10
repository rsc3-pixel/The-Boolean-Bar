# Tasks de Imersao — Kanban

> Guia tecnico detalhado com codigo: [TASKS_IMERSAO.md](TASKS_IMERSAO.md)

## Status da entrega (atualizado em 10/06/2026)

Todas as 12 tasks foram implementadas e estao em producao. Rastreabilidade:

| Task | Status | Commit(s) | Autor |
|---|---|---|---|
| 1. Countdown 30s | ✅ Done | `fbab39e5` | Matheus |
| 2. Reacoes (emojis) | ✅ Done | `af69c580` | Matheus |
| 3. Sons de roleta | ✅ Done | `2bb12eb1` | Matheus |
| 4. Shake + vibracao | ✅ Done | `f3153e8c` | Matheus |
| 5. Chat rapido | ✅ Done | `f2dbb992` | Renato |
| 6. Dados 3D no reveal | ✅ Done | `f2dbb992` | Renato |
| 7. Streak/combo | ✅ Done | `f2dbb992` | Renato |
| 8. Entrada dramatica | ✅ Done | `f2dbb992` (desativada em `185401c5` por bug de tela preta; codigo mantido) | Renato |
| 9. Narrador automatico | ✅ Done | `f2dbb992` | Renato |
| 10. Pulsacao do card ativo | ✅ Done | `f2dbb992` | Renato |
| 11. Confetti na vitoria | ✅ Done | `f2dbb992` | Renato |
| 12. Sons por evento | ✅ Done | `f2dbb992` | Renato |

---

### [Imersao 1] Countdown timer de 30s por turno

**Descricao:** Relogio regressivo visual de 30 segundos no turno de cada jogador. Barra que diminui e muda de cor (cyan > amarelo > vermelho). Se o tempo esgotar, o server joga automaticamente (carta aleatoria no Logic, duvida no Dice).

**Complexidade:** Alta | **Prioridade:** Alta

**Arquivos:** `web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

### [Imersao 2] Reacoes em tempo real

**Descricao:** 6 botoes de emoji (pensativo, risada, suor, fogo, caveira, aplausos) que qualquer jogador pode clicar durante a partida. A reacao aparece flutuando na tela de TODOS os jogadores da sala por 2.5s com o nome de quem enviou. Rate limit de 2s por jogador. Spectators tambem podem reagir.

**Complexidade:** Media | **Prioridade:** Alta

**Arquivos:** `web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

### [Imersao 3] Efeito sonoro de tambor na roleta

**Descricao:** Sons sintetizados via Web Audio na fase de roleta russa: cilindro girando quando clica em "Puxar Gatilho", click metalico seco quando sobrevive, bang de revolver quando morre. Respeita o toggle de mute global.

**Complexidade:** Baixa | **Prioridade:** Alta

**Arquivos:** `audioCues.ts`, `RouletteScreen.tsx`

---

### [Imersao 4] Shake na tela quando alguem e eliminado

**Descricao:** Quando um jogador morre (roleta ou perde ultimo dado), a tela de TODOS na sala treme por 0.5s (CSS keyframe shake). No celular Android, o aparelho vibra via `navigator.vibrate(200)`.

**Complexidade:** Baixa | **Prioridade:** Alta

**Arquivos:** `GamePage.tsx`, `DiceGameOnline.tsx`, `index.css`

---

### [Imersao 5] Chat rapido com frases prontas

**Descricao:** Botao flutuante que abre painel com 8 frases pre-definidas ("Blefou!", "Boa sorte!", "Covarde!", "Mentiroso!", "To suando...", "GG", "Facil", "Misericordia!"). Clicar numa frase envia pra todos na sala como balao temporario de 4s. Whitelist no server (sem texto livre). Rate limit de 3s.

**Complexidade:** Media | **Prioridade:** Media

**Arquivos:** `web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

### [Imersao 6] Animacao de dados 3D no reveal

**Descricao:** Quando os dados sao revelados apos uma duvida no Dice, cada dado rola visualmente em 3D (CSS rotateX/rotateY) antes de parar na face correta. Stagger de 300ms entre dados (nao todos ao mesmo tempo).

**Complexidade:** Alta | **Prioridade:** Media

**Arquivos:** `DiceFace.tsx`, `DiceGameOnline.tsx`, `index.css`

---

### [Imersao 7] Streak/combo visual

**Descricao:** Quando um jogador acerta 2+ duvidas/confrontos seguidos, aparece overlay temporario (2.5s) com "STREAK x2!" (x3, x4...) e icone de fogo na tela de todos. Reseta quando o jogador erra ou e eliminado. Funciona em ambos os modos.

**Complexidade:** Media | **Prioridade:** Media

**Arquivos:** `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

### [Imersao 8] Entrada dramatica no inicio do jogo

**Descricao:** Quando o host clica "Iniciar", antes do jogo comecar, tela fullscreen preta apresenta os nomes dos jogadores um por um com animacao slide-in e som curto por nome. Bots aparecem com badge "BOT". Finaliza com "GO!" e transiciona pro jogo. Duracao total ~3-4s.

**Complexidade:** Media | **Prioridade:** Media

**Arquivos:** Novo `GameIntro.tsx`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

### [Imersao 9] Narrador automatico com frases dramaticas no GameLog

**Descricao:** Substituir as mensagens secas do GameLog por frases narrativas aleatorias com tom de cassino noir. Minimo 3 variacoes por tipo de evento (aposta, duvida, reveal, eliminacao, sobrevivencia, vitoria). Nomes dos jogadores inseridos dinamicamente. Tudo client-side, sem mudanca no server.

**Complexidade:** Media | **Prioridade:** Media

**Arquivos:** Novo `narrator.ts`, `useGameEngine.ts`

---

### [Imersao 10] Pulsacao do avatar/card quando e a vez do jogador

**Descricao:** Card do jogador ativo recebe borda brilhante pulsando (box-shadow cyan oscilando). O modo Dice ja tem isso no `OpponentDiceCard` — verificar se o modo Logic (GamePage) tambem tem e implementar se faltar.

**Complexidade:** Baixa | **Prioridade:** Baixa

**Arquivos:** `GamePage.tsx` (verificar `OpponentCard` ou equivalente)

---

### [Imersao 11] Confetti/particulas na tela de vitoria

**Descricao:** Quando a VictoryScreen aparece, confetti colorido (cyan, amarelo, vermelho, verde, roxo, laranja) cai pela tela em 3 rajadas com delay. Pode usar biblioteca `canvas-confetti` (3KB) ou particulas CSS com motion.div. Nao bloqueia cliques (pointer-events: none).

**Complexidade:** Baixa | **Prioridade:** Baixa

**Arquivos:** `VictoryScreen.tsx`, `package.json` (se usar canvas-confetti)

---

### [Imersao 12] Sons distintos por evento

**Descricao:** Adicionar novos sons sintetizados via Web Audio para cada tipo de evento: eliminacao (tom grave descendente), vitoria (fanfarra 3 tons ascendentes), duvida dramatica (acorde dissonante tenso), aposta alta (moeda caindo). Respeita toggle de mute. Volume consistente entre sons.

**Complexidade:** Baixa | **Prioridade:** Media

**Arquivos:** `audioCues.ts`, `useGameEngine.ts`

---

## Sugestao de ordem

**Quick wins (comecar por essas):** 3, 4, 11, 12

**Depois:** 2, 5, 7, 8, 9, 10

**Por ultimo (mais complexas):** 1, 6
