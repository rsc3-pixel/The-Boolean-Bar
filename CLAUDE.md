# CLAUDE.md — Contexto pro próximo agente

Esse arquivo te orienta entre sessões. Lê primeiro antes de começar qualquer task.

---

## O projeto em 1 linha

**The Boolean Bar** é um simulador de mesa de apostas em C com 2 modos de jogo:

1. **Boolean Bar (Lógica)** — jogador descarta uma carta com fórmula proposicional declarando se é Tautologia/Contradição/Contingência. Adversário pode duvidar. Quem mente ou duvida injustamente vai pra **Roleta Russa** (1-6 balas no tambor). Última pessoa viva vence.
2. **Liar's Dice (Dados)** — cada jogador tem 5 dados em copo escondido. Apostas são sobre quantidade total de uma face na mesa. Quem duvida e errar perde 1 dado; quem fizer aposta inflada e for descoberto também perde 1. Zero dados = eliminado. Último com dados vence.

Projeto integrado de 6 cadeiras no CESAR School: **Lógica para Computação**, **PIF**, **Projeto 2**, **IHC**, **Fundamentos de Desenvolvimento de Software** e **Gestão de Projetos**. Squad 7. Tech Lead: Renato Chong (`rsc3-pixel`). Repo privado.

---

## Stack

| Camada | O que é |
|---|---|
| Engine de jogo | C11 (`engine/`), compilado com gcc. Roda standalone via terminal OU spawned por Node |
| Servidor ponte | Node.js + `ws` (WebSocketServer) em `web/web_server.js`. Reverse-proxy via nginx em prod |
| Frontend | React + TypeScript + Vite + Tailwind + Radix UI + Motion. Em `web/src/` |
| Build | Makefile cross-platform (Windows + Linux) na raiz |
| Deploy | VM `flux` no GCP (`e2-micro`, us-west1-a), PM2 + nginx + certbot |

URL pública: **https://rsc3-boolean.duckdns.org**

---

## Estrutura essencial

```
The-Boolean-Bar/
├── engine/                      # Engine C
│   ├── main.c                   # entry: argv[1]=0 (logic) ou 1 (dice), senão prompt
│   ├── core/
│   │   ├── memory.c             # mem_new_jogador, mem_new_mesa, etc
│   │   ├── input_handler.c      # get_safe_int, get_safe_string
│   │   └── types.h              # Jogador, Mesa, Carta, FormulaType (struct definitions)
│   ├── modules/
│   │   ├── game_flow.c          # game_start() — loop do modo Lógica
│   │   ├── dice_flow.c          # dice_game_start() — loop do modo Dados
│   │   ├── deck_manager.c       # gera fórmulas aleatórias
│   │   ├── logic_engine.c       # avalia fórmulas (tabela-verdade) — API do Matheus Sprint 1
│   │   └── (dice_engine.c removido — era dead code fora do Makefile)
│   ├── functional/predicates.c  # ponteiros de função (filtro de jogadores vivos)
│   └── ui/terminal_art.c        # ASCII art + ANSI colors
├── web/
│   ├── web_server.js            # WS server + HTTP estático (em prod). PORT=4000.
│   ├── public/audio/            # casino-ambience.mp3 (música de fundo)
│   ├── src/
│   │   ├── App.tsx              # router de telas + state global (gameMode, music)
│   │   ├── hooks/
│   │   │   ├── useGameEngine.ts # hook único — WS + state de sala/jogo
│   │   │   └── useDiceGame.ts   # legacy (modo dice offline) — não usado em multiplayer
│   │   ├── utils/
│   │   │   └── audioCues.ts     # tons sintetizados via Web Audio (sua vez / bet / doubt)
│   │   ├── pages/
│   │   │   ├── MainMenu.tsx     # menu, botão grande "MULTIPLAYER" cyan + heartbeat neon
│   │   │   ├── OnlineLobby.tsx  # criar/entrar sala + toggle de modo (dice/logic)
│   │   │   ├── WaitingRoom.tsx  # lobby da sala, lista de players, +bot, iniciar
│   │   │   ├── GamePage.tsx     # MODO LÓGICA — partida ativa
│   │   │   ├── DiceGameOnline.tsx # MODO DICE — partida ativa multiplayer
│   │   │   ├── DiceGamePage.tsx # legacy offline (não usado em multiplayer)
│   │   │   └── DiceLobby.tsx    # legacy
│   │   └── components/
│   │       ├── modals/SettingsInstructionsPanel.tsx  # manuais (toggle Dice/Logic) + toggle música
│   │       ├── ui/DiceFace.tsx, OpponentDiceCard.tsx (componentes dice)
│   │       └── ...
│   ├── test_rooms.js            # smoke test do server (`npm test`)
│   └── stress_test.js           # teste de carga: 100+ sessões simultâneas (`npm run stress`)
├── docs/
│   ├── DEPLOY.md                # ⭐ guia de atualização da VM (LER se for fazer deploy)
│   └── ...
├── Makefile                     # cross-platform (detecta OS), inclui targets run/run-dice/web-build/etc
└── ecosystem.config.cjs         # config do PM2 na VM
```

---

## Como o multiplayer funciona

5 fases já implementadas e em prod:

1. **Phase 1 — Salas no servidor**: `Map<roomId, Room>`. Cada sala = 1 engine spawned, várias conexões WS. Output do engine é broadcast pra todos.
2. **Phase 2 — Lobby UI**: `OnlineLobby` (criar/entrar com código de 4 letras) → `WaitingRoom` (lista de players, host inicia).
3. **Phase 3 — Turn-aware**: server tracka `expectedPlayerId`. UI gateia controles por turno. Banner "AGUARDANDO X" pros não-da-vez.
4. **Phase 4 — Reconnect**: refresh da aba ou queda de internet por <60s reconecta na sala. sessionStorage guarda `playerId`+`roomId`. Heartbeat ping/pong detecta zumbis. Host transfer se host sair (prefere humano).
5. **Phase 5 — Deploy**: Linux Makefile, frontend servido pela mesma porta do WS em prod, nginx reverse-proxy com upgrade de WS, HTTPS via certbot.
6. **Extras**: ranking final no fim, spectator mode pra eliminados, bots controlados pelo server, modo Dice end-to-end, mobile responsive, manual com toggle Dice/Logic, sem regra do '1' como curinga (removida a pedido do user), face 1 apostável no Dice (1-6, não mais 2-6).
7. **Áudio (Phase 7)**: música de cassino em loop (volume 50%), sons sintetizados via Web Audio (sua vez / bet / doubt), botão flutuante mute no canto inferior esquerdo (sempre visível), localStorage `booleanbar_music`. Audio context só ativa após user gesture (browser policy) — listener fica até `play()` resolver.
8. **UX polish**: crossfade 250ms entre telas (`AnimatePresence` no `App.tsx`), flash overlay verde/cyan + 2 beeps quando vira sua vez, ritmo de coração (lub-dub) nos elementos neon do MainMenu (título + botão MULTIPLAYER + linhas decorativas).

### Protocolo WS (cliente ↔ server)

**Client → Server (actions):**
- `create_room` `{playerName, gameMode: "logic"|"dice"}` (default logic)
- `join_room` `{roomId, playerName}` (modo herda da sala)
- `leave_room`
- `reconnect` `{playerId, roomId}` (auto-disparado no `ws.onopen` se sessionStorage tem)
- `start_game` (host only quando há sala; OU sem sala → modo solo legado)
- `add_bot` / `remove_bot` `{botId}` (host only, antes do start)
- `send_input` `{data}` (vai pro stdin do engine se for sua vez)
- `shutdown` (mata o servidor — **só usar em dev**! FLEE no menu NÃO manda mais isso desde o fix de Phase 7)

**Server → Client:**
- `server_hello`, `room_created`, `room_joined`, `room_state`, `room_closed` (com reason: `empty | host_left | player_left_mid_game | all_disconnected | engine_spawn_failed | no_humans`)
- `game_starting`, `game_state` (logic), `dice_state` (com myDice filtrado per-client!), `doubt_state`, `doubt_result`, `dice_bet`, `dice_doubt`, `dice_reveal`, `roulette_result`, `victory_state`
- `c_stdout`, `c_stderr`, `c_exit`
- `error` (com code), `input_rejected`, `reconnect_success`, `reconnect_failed`

### Eventos do engine (stdout)

Engine printa linhas tipo `JSON_STATE: {...}`, `JSON_DICE_STATE: {...}`, etc. Server parseia e broadcast.

**Logic mode**: `JSON_STATE`, `JSON_DOUBT_STATE`, `JSON_DOUBT_RESULT`, `JSON_ROULETTE_RESULT`, `JSON_VICTORY`.

**Dice mode**: `JSON_DICE_STATE` (com `allDice` array de todos — server FILTRA per-client antes do broadcast pra cada um receber só `myDice`!), `JSON_DICE_BET`, `JSON_DICE_DOUBT`, `JSON_DICE_REVEAL`, `JSON_VICTORY`.

### Bots

Adicionados no lobby pelo host (`add_bot` action). Têm `isBot: true`, `ws: null`, `connected: true`. Quando engine espera input deles (`expectedPlayerId === bot.playerId`), server gera input automatizado em `maybeTriggerBot()` com delay de 1.2s. Logic bot escolhe carta+tipo aleatórios; dice bot sobe aposta minimamente OU duvida (30%).

---

## Pegadinhas conhecidas

⚠️ Lê estas antes de mexer no código:

| Pegadinha | Detalhe |
|---|---|
| **`make clean` é obrigatório se engine C muda** | Makefile não rastreia deps de headers. Mudar `types.h` sem clean → segfault em runtime (struct stale) |
| **`strdup` na glibc precisa `_POSIX_C_SOURCE=200809L`** | Já tá no CFLAGS do Makefile. Sem ele, gcc trata strdup como int (32-bit) → trunca ponteiro 64-bit → SIGSEGV |
| **`setvbuf(stdout, NULL, _IOLBF, 0)` no main.c** | Stdout em pipe é block-buffered por default. Sem isso, output some no crash. NÃO REMOVER |
| **`spawn(... { windowsHide: true })`** (não shell:true) | shell:true faz `cmd.exe` ser o filho direto e `engine.kill()` mata só o cmd, deixando boolean_bar zumbi |
| **`engine.stdin.on('error')` é obrigatório** | Sob carga (ou sala fechando mid-turno), um engine pode morrer com um `stdin.write()` pendente → EPIPE emitido no stream do stdin. SEM listener de error, vira exceção não-tratada e DERRUBA o server inteiro (todas as salas juntas). Achado pelo `stress_test.js`. NÃO REMOVER o handler em `spawnEngineForRoom` |
| **JSON_DICE_STATE precisa filtragem per-client** | `allDice` vaza dados de todos. Server tem marker.perClient que substitui `allDice` por `myDice` (do destinatário) e remove o original. NÃO usar broadcast direto pra dice_state |
| **Nginx + WebSocket** | Config em `/etc/nginx/sites-available/boolean-bar` na VM. Tem `proxy_set_header Upgrade $http_upgrade; Connection "upgrade"` — necessário pro WS funcionar |
| **GamePage usa `zoom: 0.65/0.75/0.85`** | Hack pra caber em telas baixas. Mobile responsivo já feito mas zoom é dirty workaround. Pra refazer sério precisa abandonar layout fixo de 6 cartas em arco |
| **LSP da IDE local mostra "stdio.h not found"** | Falso positivo. gcc compila normal. Ignora |
| **`isSoloMode === true`** | Modo legado quando `start_game` chega sem sala antes — auto-cria sala "solo" pro client legado. Mantém `make dev` funcionando como single-player |
| **Bot não pode ser host** | Em host transfer, `removePlayerHard` busca `find(p => p.connected && !p.isBot)`. Se só sobram bots → fecha a sala (`reason: 'no_humans'`) |
| **Engine não sabe lidar com player ausente mid-loop** | Por isso quando alguém sai mid-game, server fecha a sala inteira (`reason: 'player_left_mid_game'`). Continuação parcial seria refactor maior do engine |
| **Repo privado** | `git clone` precisa de PAT. Na VM o token tá salvo em `~/.git-credentials`. Se sumir, `git config --global credential.helper store` + clone novo |
| **FLEE não derruba mais o servidor** | Antes `sendShutdown` mandava `action: 'shutdown'` que fazia `process.exit(0)` no server — em prod multiplayer derrubava o jogo de TODOS. Fix: agora só envia `leave_room` + fecha WS local + tenta `window.close()` (browser bloqueia em abas normais) e fallback redireciona pra `about:blank` |
| **`reconnect_success` deve incluir `lastDiceState`** | No fix de Phase 7 do dice mode: server cacheia `room.lastDiceState` em cada `JSON_DICE_STATE` e re-filtra per-client no reconnect (extrai `myDice` do slot, remove `allDice`). Sem isso, refresh mid-game em modo dice = tela preta |
| **Audio precisa user gesture pra começar** | Browsers (especialmente iOS Safari) bloqueiam autoplay de `<audio>` E criação de `AudioContext` antes do 1º clique/touch/keydown. Solução em `App.tsx`: listener fica registrado até `audio.play()` resolver com sucesso (não usa `{ once: true }`). Ao primeiro gesture aceito, também faz `audioCues.resume()` pra liberar o contexto dos efeitos |
| **Flag `audioCues.enabled`** | O toggle global de música também controla os efeitos sonoros (sua vez / bet / doubt). `audioCues.setEnabled(musicEnabled)` é chamado no useEffect que reage ao toggle. Um único switch pra tudo |

---

## Convenções de comunicação

O usuário fala português. Responde em português.

Estilo do dono do projeto (Renato):
- Direto, sem bajulação
- Confirma antes de operações destrutivas (force-push, rm, drop)
- Mostra o que vai fazer, faz, reporta o que aconteceu
- Quando dá erro, diagnostica antes de tentar fix random
- Avisa pegadinhas e tradeoffs

Mensagens de commit em PT, formato convencional (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `chore: ...`). Co-author do Claude no fim.

---

## Workflow padrão

1. **Local** (PowerShell/cmd/git bash): editar → `git add` → `git commit` → `git push origin main`
2. **VM** (gcloud SSH): `git pull` + build apropriado + `pm2 restart boolean-bar`
3. **Browser**: hard refresh (`Ctrl+Shift+R`)

Veja [docs/DEPLOY.md](docs/DEPLOY.md) pro guia completo (qual comando rodar onde, troubleshooting, etc).

---

## Limitações conhecidas (escopo futuro)

- IA do bot é simples (random pra logic, escala mínima pra dice). Sem inteligência estatística, sem blefe consciente.
- Modo Dice **não tem mais '1' como curinga** (removido a pedido do user). Aposta agora aceita face 1-6 (UI mostra 6 faces).
- Mobile na GamePage (lógica) usa zoom hack — funciona mas não é ideal.
- Volume da música fixo em 50% (toggle on/off só, sem slider). Pode adicionar slider depois se pedido.
- Engine não sabe pular jogador desconectado mid-loop (sala encerra).
- Em multi com só bots, jogo trava na fase de "Pressione Enter" (humano envia "\n", bot não).
- `window.close()` do FLEE só funciona em PWA ou aba aberta via script. Em aba normal, fallback redireciona pra `about:blank`.
- Sons sintetizados podem soar "8-bit" demais — se quiser samples mais realistas, precisa adicionar `.mp3`/`.wav` em `web/public/audio/` e importar no `audioCues.ts`.

---

## Memória do agente

Tem memórias persistentes em `C:\Users\CHONGRENATOO\.claude\projects\c--Users-CHONGRENATOO-Documents-GitHub-The-Boolean-Bar\memory\`. Lê elas no começo se forem relevantes (especialmente `deploy_status.md`).

---

## Início rápido

Se a sessão começa do zero:
1. Lê esse arquivo + memórias persistentes (são auto-carregadas)
2. `git log --oneline -10` pra ver onde paramos
3. `git status` pra ver se tem trabalho pendente local
4. Pergunta o que o user quer fazer
