import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';
import { existsSync, appendFileSync, readFileSync, writeFileSync } from 'fs';
import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const IS_WIN = process.platform === 'win32';
const ENGINE_BIN = IS_WIN ? 'boolean_bar.exe' : 'boolean_bar';

// ─── Exclusão do Windows Defender (só Windows, dev) ──────────────────────────
if (IS_WIN && !IS_PROD) {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    execSync(
      `powershell -Command "Add-MpPreference -ExclusionPath '${projectRoot}' -ErrorAction SilentlyContinue"`,
      { stdio: 'ignore' }
    );
    console.log('[Node Server] ✅ Exclusão do Windows Defender aplicada para:', projectRoot);
  } catch (e) {
    console.warn('[Node Server] ⚠️ Não foi possível adicionar exclusão do Defender (normal sem admin).');
  }
}

// ─── Configuração ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8080;
const MAX_PLAYERS_PER_ROOM = 7;
const MIN_PLAYERS_PER_ROOM = 2;
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos (0/O, 1/I/L)
const DISCONNECT_GRACE_MS = 60_000;       // Phase 4: 60s pra reconectar antes de remover
const HEARTBEAT_INTERVAL_MS = 30_000;     // Phase 4: ping a cada 30s
const HEARTBEAT_TIMEOUT_MS = 10_000;      // se sem pong em 10s após ping → terminate
const LEADERBOARD_FILE = path.resolve(__dirname, '..', 'leaderboard.json');  // ranking de vencedores
const LEADERBOARD_TOP = 20;               // top N retornado pra UI

// ─── Estado em memória ────────────────────────────────────────────────────────
/**
 * @typedef {Object} Player
 * @property {string} playerId
 * @property {string} name
 * @property {WebSocket|null} ws  null quando desconectado OU quando é bot
 * @property {boolean} connected   Phase 4: false durante grace window. Bots sempre true.
 * @property {NodeJS.Timeout|null} disconnectTimer  Phase 4: pra hard-remove após grace
 * @property {boolean} isBot   Phase 6: true se for jogador automatizado pelo server
 *
 * @typedef {Object} Room
 * @property {string} roomId
 * @property {string} hostId
 * @property {Map<string, Player>} players  insertion order = ordem de turno do engine
 * @property {import('child_process').ChildProcess|null} engine
 * @property {number} currentTurn  índice do jogador atual segundo o último JSON_STATE
 * @property {string|null} expectedPlayerId  Phase 3: quem o engine está esperando input
 * @property {boolean} gameStarted
 * @property {boolean} isSoloMode  true = modo legado (1 cliente controla tudo)
 * @property {string[]} legacyPlayerNames  só usado em soloMode
 * @property {string} stdoutBuffer  buffer parcial entre chunks do engine
 * @property {object|null} lastGameState  Phase 4: cache do último JSON_STATE pra sync no reconnect
 * @property {object|null} lastDoubtState
 */

/** @type {Map<string, Room>} */
const rooms = new Map();
/** @type {Map<WebSocket, { roomId: string, playerId: string }>} */
const wsToRoom = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateRoomCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
  } while (rooms.has(code));
  return code;
}

function generatePlayerId() {
  return Math.random().toString(36).slice(2, 10);
}

function send(ws, msg) {
  if (ws.readyState !== 1) return;
  try { ws.send(JSON.stringify(msg)); } catch (_) {}
}

function broadcast(room, msg) {
  for (const player of room.players.values()) {
    if (player.ws) send(player.ws, msg);  // pula players com ws null (desconectados)
  }
}

// ─── Leaderboard de vencedores (Capstone) ─────────────────────────────────────
// Persiste em ../leaderboard.json. Estrutura: { [name]: { wins, lastWin, modes } }.
// Bots NÃO são contabilizados — só vitórias humanas entram no ranking.
function readLeaderboard() {
  try {
    if (!existsSync(LEADERBOARD_FILE)) return {};
    const raw = readFileSync(LEADERBOARD_FILE, 'utf-8');
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (e) {
    console.warn('[Leaderboard] Falha ao ler:', e.message);
    return {};
  }
}

function recordWin(winnerName, gameMode) {
  if (!winnerName || typeof winnerName !== 'string') return;
  try {
    const data = readLeaderboard();
    const key = winnerName.trim();
    if (!key) return;
    const entry = data[key] ?? { wins: 0, lastWin: null, modes: { logic: 0, dice: 0 } };
    entry.wins = (entry.wins ?? 0) + 1;
    entry.lastWin = new Date().toISOString();
    entry.modes = entry.modes ?? { logic: 0, dice: 0 };
    if (gameMode === 'logic' || gameMode === 'dice') {
      entry.modes[gameMode] = (entry.modes[gameMode] ?? 0) + 1;
    }
    data[key] = entry;
    writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Leaderboard] +1 win → ${key} (total: ${entry.wins}, modo: ${gameMode})`);
  } catch (e) {
    console.warn('[Leaderboard] Falha ao gravar:', e.message);
  }
}

function getTopWinners(limit = LEADERBOARD_TOP) {
  const data = readLeaderboard();
  const entries = Object.entries(data).map(([name, v]) => ({
    name,
    wins: v.wins ?? 0,
    lastWin: v.lastWin ?? null,
    modes: v.modes ?? { logic: 0, dice: 0 },
  }));
  // Ordena por wins desc, desempata por lastWin mais recente
  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (b.lastWin ?? '').localeCompare(a.lastWin ?? '');
  });
  return entries.slice(0, limit);
}

function handleGetLeaderboard(ws) {
  send(ws, { type: 'leaderboard', entries: getTopWinners() });
}

function getRoomSnapshot(room) {
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    isSoloMode: room.isSoloMode,
    gameMode: room.gameMode,
    players: Array.from(room.players.values()).map((p, idx) => ({
      playerId: p.playerId,
      name: p.name,
      slot: idx,
      isHost: p.playerId === room.hostId,
      connected: p.connected,
      isBot: p.isBot ?? false,
    })),
  };
}

function closeRoom(roomId, reason) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.engine) {
    try { room.engine.kill(); } catch (_) {}
    room.engine = null;
  }
  for (const player of room.players.values()) {
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    if (player.ws) {
      send(player.ws, { type: 'room_closed', reason });
      wsToRoom.delete(player.ws);
    }
  }
  rooms.delete(roomId);
  console.log(`[Server] Sala ${roomId} fechada (${reason})`);
}

// ─── Engine spawn + output handling ───────────────────────────────────────────
function spawnEngineForRoom(room) {
  const exePathAbs = path.resolve(__dirname, '..', 'build', ENGINE_BIN);
  if (!existsSync(exePathAbs)) {
    broadcast(room, {
      type: 'c_stderr',
      data: `ERRO: ${ENGINE_BIN} não encontrado em ${exePathAbs}. Rode "make" primeiro.`,
    });
    return false;
  }

  // Unblock-File é Windows-only
  if (IS_WIN) {
    try {
      execSync(`powershell -Command "Unblock-File -Path '${exePathAbs}'"`, { stdio: 'ignore' });
    } catch (_) { /* graceful */ }
  }

  // Passa "0" (Boolean Bar) ou "1" (Liar's Dice) como argv[1] pra pular o prompt
  // de seleção de modo. Modo definido na criação da sala (ver handleCreateRoom).
  const modeArg = room.gameMode === 'dice' ? '1' : '0';
  const engine = spawn(exePathAbs, [modeArg], { windowsHide: true });
  room.engine = engine;
  room.stdoutBuffer = '';

  const names = room.isSoloMode
    ? room.legacyPlayerNames
    : Array.from(room.players.values()).map(p => p.name);

  // Engine espera: linha 1 = quantidade, depois 1 nome por linha
  setTimeout(() => {
    if (engine.stdin.writable) {
      let input = `${names.length}\n`;
      for (const n of names) input += `${n}\n`;
      console.log(`[Server/${room.roomId}] Engine iniciado, ${names.length} jogadores: ${names.join(', ')}`);
      engine.stdin.write(input);
    }
  }, 100);

  engine.stdout.on('data', (d) => handleEngineStdout(room, d));
  engine.stderr.on('data', (d) => broadcast(room, { type: 'c_stderr', data: d.toString() }));
  engine.on('close', (code) => {
    console.log(`[Server/${room.roomId}] Engine finalizou com status ${code}`);
    broadcast(room, { type: 'c_exit', code });
    room.engine = null;
  });

  return true;
}

function handleEngineStdout(room, chunk) {
  room.stdoutBuffer += chunk.toString();
  const lines = room.stdoutBuffer.split('\n');
  room.stdoutBuffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    const markers = [
      {
        tag: 'JSON_STATE:',
        type: 'game_state',
        onParse: (data) => {
          room.currentTurn = data.turn;
          room.lastGameState = data;     // Phase 4: cache pra sync no reconnect
          room.lastDoubtState = null;    // novo turno → fase de dúvida resetou
          // Espera input do jogador da vez (Phase 3)
          const playersArr = Array.from(room.players.values());
          room.expectedPlayerId = playersArr[data.turn]?.playerId ?? null;
        },
      },
      {
        tag: 'JSON_DOUBT_STATE:',
        type: 'doubt_state',
        onParse: (data) => {
          room.lastDoubtState = data;    // Phase 4: cache
          // Durante a fase de dúvida, quem responde é o caller (oponente sendo perguntado)
          const playersArr = Array.from(room.players.values());
          const caller = playersArr.find(p => p.name === data.caller);
          room.expectedPlayerId = caller?.playerId ?? room.expectedPlayerId;
        },
      },
      { tag: 'JSON_DOUBT_RESULT:',    type: 'doubt_result' },
      { tag: 'JSON_ROULETTE_RESULT:', type: 'roulette_result' },
      {
        tag: 'JSON_VICTORY:',
        type: 'victory_state',
        onParse: (data) => {
          // Capstone: persiste vitória no leaderboard, ignorando bots
          const winner = Array.from(room.players.values()).find(p => p.name === data.winner);
          if (winner && !winner.isBot) {
            recordWin(data.winner, room.gameMode);
          } else if (winner && winner.isBot) {
            console.log(`[Leaderboard] Skip bot win: ${data.winner}`);
          }
        },
      },
      // ─── Liar's Dice (modo dados) ──
      {
        tag: 'JSON_DICE_STATE:',
        type: 'dice_state',
        // Filtragem per-client: cada cliente recebe só os PRÓPRIOS dados.
        // O array allDice é removido do payload, e myDice (dos próprios) é
        // injetado. Sem isso, todo mundo veria os dados de todos.
        perClient: (data, _player, slot) => {
          const myDice = Array.isArray(data.allDice) ? (data.allDice[slot] ?? []) : [];
          const { allDice: _drop, ...rest } = data;
          return { type: 'dice_state', data: { ...rest, myDice } };
        },
        onParse: (data) => {
          room.currentTurn = data.turn;
          room.lastDiceState = data;
          // Em dice mode, o jogador da vez é quem decide (apostar/duvidar/sair)
          const playersArr = Array.from(room.players.values());
          room.expectedPlayerId = playersArr[data.turn]?.playerId ?? null;
        },
      },
      { tag: 'JSON_DICE_BET:',    type: 'dice_bet' },
      { tag: 'JSON_DICE_DOUBT:',  type: 'dice_doubt' },
      { tag: 'JSON_DICE_REVEAL:', type: 'dice_reveal' },
    ];

    let handled = false;
    for (const m of markers) {
      const idx = line.indexOf(m.tag);
      if (idx === -1) continue;
      const jsonPart = line.substring(idx + m.tag.length).trim();
      try {
        const parsed = JSON.parse(jsonPart);
        if (m.onParse) m.onParse(parsed);
        if (m.perClient) {
          // Send personalizado por cliente (ex: dice_state filtra allDice)
          const playersArr = Array.from(room.players.values());
          for (let slot = 0; slot < playersArr.length; slot++) {
            const player = playersArr[slot];
            if (!player.ws) continue;
            send(player.ws, m.perClient(parsed, player, slot));
          }
        } else {
          broadcast(room, { type: m.type, data: parsed });
        }
        // Phase 6: se a vez é de um bot, agenda input automatizado
        maybeTriggerBot(room, m.type, parsed);
      } catch (e) {
        console.error(`[Server/${room.roomId}] Falha ao parsear ${m.tag}:`, e.message);
      }
      handled = true;
      break;
    }

    if (!handled) {
      console.log(`[ENGINE/${room.roomId}]: ${line.trim()}`);
      broadcast(room, { type: 'c_stdout', data: line });
      // Removidos triggers 'show_doubt' (textmatch de "você DUVIDA") e
      // 'player_death' (textmatch de "BANG!") — eram resíduos do modo demo
      // que disparavam overlays no frontend antes do tempo. Agora a cascata
      // vem só pelos eventos JSON estruturados (doubt_result, roulette_result).
    }
  }
}

// ─── Action handlers ──────────────────────────────────────────────────────────
function handleCreateRoom(ws, msg) {
  if (wsToRoom.has(ws)) {
    return send(ws, { type: 'error', code: 'already_in_room', message: 'Você já está em uma sala' });
  }
  const playerName = (msg.playerName || 'Host').toString().slice(0, 32);
  const roomId = generateRoomCode();
  const playerId = generatePlayerId();
  const gameMode = msg.gameMode === 'dice' ? 'dice' : 'logic';   // default = logic

  const room = {
    roomId,
    hostId: playerId,
    players: new Map([[playerId, { playerId, name: playerName, ws, connected: true, disconnectTimer: null, isBot: false }]]),
    engine: null,
    currentTurn: -1,
    expectedPlayerId: null,
    gameStarted: false,
    isSoloMode: false,
    gameMode,
    legacyPlayerNames: [],
    stdoutBuffer: '',
    lastGameState: null,
    lastDoubtState: null,
  };
  rooms.set(roomId, room);
  wsToRoom.set(ws, { roomId, playerId });

  send(ws, { type: 'room_created', roomId, playerId, room: getRoomSnapshot(room) });
  console.log(`[Server] Sala ${roomId} criada por ${playerName} (${playerId}) — modo ${gameMode}`);
}

function handleJoinRoom(ws, msg) {
  if (wsToRoom.has(ws)) {
    return send(ws, { type: 'error', code: 'already_in_room', message: 'Você já está em uma sala' });
  }
  const roomId = (msg.roomId || '').toString().toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    return send(ws, { type: 'error', code: 'room_not_found', message: 'Sala não encontrada' });
  }
  if (room.gameStarted) {
    return send(ws, { type: 'error', code: 'game_in_progress', message: 'Jogo já começou' });
  }
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    return send(ws, { type: 'error', code: 'room_full', message: 'Sala cheia' });
  }

  const playerId = generatePlayerId();
  const playerName = (msg.playerName || `Player${room.players.size + 1}`).toString().slice(0, 32);
  room.players.set(playerId, { playerId, name: playerName, ws, connected: true, disconnectTimer: null, isBot: false });
  wsToRoom.set(ws, { roomId, playerId });

  send(ws, { type: 'room_joined', roomId, playerId, room: getRoomSnapshot(room) });
  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
  console.log(`[Server/${roomId}] ${playerName} (${playerId}) entrou. Total: ${room.players.size}`);
}

// Saída intencional: remove já. Se for host, transfere se houver alguém conectado, senão fecha.
// ─── Bots (Phase 6) ──────────────────────────────────────────────────────────
const BOT_NAMES = ['BotZeta', 'BotKappa', 'BotOmega', 'BotPsi', 'BotDelta', 'BotSigma', 'BotEpsilon'];

function handleAddBot(ws) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return send(ws, { type: 'error', code: 'no_room', message: 'Você não está em uma sala' });
  const room = rooms.get(ctx.roomId);
  if (!room) return send(ws, { type: 'error', code: 'no_room', message: 'Sala não encontrada' });
  if (ctx.playerId !== room.hostId) {
    return send(ws, { type: 'error', code: 'not_host', message: 'Só o host pode adicionar bots' });
  }
  if (room.gameStarted) {
    return send(ws, { type: 'error', code: 'game_in_progress', message: 'Não dá pra adicionar bot com partida em andamento' });
  }
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    return send(ws, { type: 'error', code: 'room_full', message: `Sala cheia (máx ${MAX_PLAYERS_PER_ROOM})` });
  }

  // Escolhe um nome de bot que ainda não está na sala
  const usedNames = new Set(Array.from(room.players.values()).map(p => p.name));
  const baseName = BOT_NAMES.find(n => !usedNames.has(n)) ?? `Bot${room.players.size}`;
  const botId = generatePlayerId();
  room.players.set(botId, {
    playerId: botId,
    name: baseName,
    ws: null,
    connected: true,    // bot está sempre "conectado"
    disconnectTimer: null,
    isBot: true,
  });
  console.log(`[Server/${room.roomId}] Bot ${baseName} adicionado (${botId})`);
  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
}

function handleRemoveBot(ws, msg) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return send(ws, { type: 'error', code: 'no_room', message: 'Você não está em uma sala' });
  const room = rooms.get(ctx.roomId);
  if (!room) return send(ws, { type: 'error', code: 'no_room', message: 'Sala não encontrada' });
  if (ctx.playerId !== room.hostId) {
    return send(ws, { type: 'error', code: 'not_host', message: 'Só o host pode remover bots' });
  }
  if (room.gameStarted) {
    return send(ws, { type: 'error', code: 'game_in_progress', message: 'Não dá pra remover bot com partida em andamento' });
  }
  const botId = (msg.botId || '').toString();
  const bot = room.players.get(botId);
  if (!bot || !bot.isBot) {
    return send(ws, { type: 'error', code: 'invalid_bot', message: 'Bot não encontrado' });
  }
  room.players.delete(botId);
  console.log(`[Server/${room.roomId}] Bot ${bot.name} removido (${botId})`);
  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
}

// ─── IA do Bot ───────────────────────────────────────────────────────────────
// Quando é a vez de um bot agir, server gera os inputs automaticamente e
// escreve no stdin do engine. Delay pra parecer "pensando".
const BOT_THINK_MS = 1200;

function maybeTriggerBot(room, msgType, parsed) {
  if (!room.engine || !room.expectedPlayerId) return;
  const player = room.players.get(room.expectedPlayerId);
  if (!player?.isBot) return;
  // Captura snapshot da expectativa pra evitar race se turno muda no meio
  const expectedAtScheduling = room.expectedPlayerId;
  setTimeout(() => {
    if (!room.engine?.stdin?.writable) return;
    if (room.expectedPlayerId !== expectedAtScheduling) return; // turno mudou, abort
    if (room.gameMode === 'dice') {
      sendDiceBotInput(room, parsed, msgType);
    } else {
      sendLogicBotInput(room, parsed, msgType);
    }
  }, BOT_THINK_MS);
}

function writeStdin(room, str, delay = 100) {
  setTimeout(() => {
    if (room.engine?.stdin?.writable) room.engine.stdin.write(str);
  }, delay);
}

function sendLogicBotInput(room, data, msgType) {
  if (msgType === 'game_state') {
    // Escolhe carta aleatória + tipo aleatório
    const numCards = data.currentHand?.length ?? 1;
    const card = 1 + Math.floor(Math.random() * Math.max(1, numCards));
    const type = 1 + Math.floor(Math.random() * 3);
    console.log(`[Server/${room.roomId}] 🤖 bot joga carta ${card} declarando tipo ${type}`);
    writeStdin(room, `${card}\n`, 0);
    writeStdin(room, `${type}\n`, 200);
  } else if (msgType === 'doubt_state') {
    // 50/50 duvidar ou acreditar
    const choice = Math.random() < 0.5 ? '1' : '0';
    console.log(`[Server/${room.roomId}] 🤖 bot ${choice === '1' ? 'DUVIDOU' : 'acreditou'}`);
    writeStdin(room, `${choice}\n`, 0);
  }
}

function sendDiceBotInput(room, data, msgType) {
  if (msgType !== 'dice_state') return;
  const curQty = data.currentBetQty ?? 0;
  const curFace = data.currentBetFace ?? 0;

  if (curQty === 0) {
    // Mesa vazia: aposta inicial conservadora
    const initFace = 1 + Math.floor(Math.random() * 6); // 1-6
    console.log(`[Server/${room.roomId}] 🤖 bot abre mesa: 2 × face ${initFace}`);
    writeStdin(room, 'A\n', 0);
    writeStdin(room, '2\n', 150);
    writeStdin(room, `${initFace}\n`, 300);
    return;
  }

  // 30% duvida, 70% sobe a aposta minimamente
  if (Math.random() < 0.3) {
    console.log(`[Server/${room.roomId}] 🤖 bot DUVIDOU`);
    writeStdin(room, 'D\n', 0);
  } else {
    let newQty = curQty;
    let newFace = curFace + 1;
    if (newFace > 6) {
      newQty = curQty + 1;
      newFace = 1;
    }
    console.log(`[Server/${room.roomId}] 🤖 bot aposta: ${newQty} × face ${newFace}`);
    writeStdin(room, 'A\n', 0);
    writeStdin(room, `${newQty}\n`, 150);
    writeStdin(room, `${newFace}\n`, 300);
  }
}

function handleLeaveRoom(ws) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.roomId);
  if (!room) {
    wsToRoom.delete(ws);
    return;
  }
  const player = room.players.get(ctx.playerId);
  if (player?.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
  }
  removePlayerHard(room, ctx.playerId);
  wsToRoom.delete(ws);
}

// Disconnect involuntário (WS close sem leave_room antes): grace window de 60s.
function handleDisconnect(ws) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) {
    wsToRoom.delete(ws);
    return;
  }
  const room = rooms.get(ctx.roomId);
  if (!room) {
    wsToRoom.delete(ws);
    return;
  }
  const player = room.players.get(ctx.playerId);
  if (!player) {
    wsToRoom.delete(ws);
    return;
  }

  // Marca como desconectado, agenda hard-remove
  player.connected = false;
  player.ws = null;
  wsToRoom.delete(ws);

  if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
  player.disconnectTimer = setTimeout(() => {
    const stillThere = room.players.get(ctx.playerId);
    if (stillThere && !stillThere.connected) {
      console.log(`[Server/${ctx.roomId}] ${stillThere.name} timeout (${DISCONNECT_GRACE_MS}ms) — removendo`);
      removePlayerHard(room, ctx.playerId);
    }
  }, DISCONNECT_GRACE_MS);

  console.log(`[Server/${ctx.roomId}] ${player.name} desconectado (grace ${DISCONNECT_GRACE_MS / 1000}s)`);
  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
}

function removePlayerHard(room, playerId) {
  if (!room.players.has(playerId)) return;
  const wasGameStarted = room.gameStarted;
  room.players.delete(playerId);
  console.log(`[Server/${room.roomId}] ${playerId} removido. Restam: ${room.players.size}`);

  if (room.players.size === 0) {
    closeRoom(room.roomId, 'empty');
    return;
  }

  // Phase 5 fix: se a partida estava rolando, encerra a sala. O engine não
  // sabe lidar com player ausente — fica zumbi esperando input. Mais simples
  // e previsível: avisa todo mundo, mata engine, todos voltam pro lobby.
  if (wasGameStarted) {
    closeRoom(room.roomId, 'player_left_mid_game');
    return;
  }

  // Host transfer (Phase 4) — só faz sentido enquanto ainda tá no lobby
  if (playerId === room.hostId) {
    const players = Array.from(room.players.values());
    // Phase 6: preferir humano conectado; bot só pode ser host se for o único
    const humanConnected = players.find(p => p.connected && !p.isBot);
    if (!humanConnected) {
      // Sobrou só bots → fecha a sala
      closeRoom(room.roomId, 'no_humans');
      return;
    }
    room.hostId = humanConnected.playerId;
    console.log(`[Server/${room.roomId}] Host transferido pra ${humanConnected.name} (${humanConnected.playerId})`);
  }

  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
}

function handleReconnect(ws, msg) {
  const playerId = (msg.playerId || '').toString();
  const roomId = (msg.roomId || '').toString().toUpperCase();
  if (!playerId || !roomId) {
    return send(ws, { type: 'reconnect_failed', code: 'invalid_args', message: 'playerId e roomId obrigatórios' });
  }
  if (wsToRoom.has(ws)) {
    return send(ws, { type: 'reconnect_failed', code: 'already_in_room', message: 'WS já tá vinculado a uma sala' });
  }
  const room = rooms.get(roomId);
  if (!room) {
    return send(ws, { type: 'reconnect_failed', code: 'room_not_found', message: 'Sala não existe mais' });
  }
  const player = room.players.get(playerId);
  if (!player) {
    return send(ws, { type: 'reconnect_failed', code: 'player_gone', message: 'Você foi removido da sala' });
  }

  // Re-bind
  player.ws = ws;
  player.connected = true;
  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
  }
  wsToRoom.set(ws, { roomId, playerId });

  console.log(`[Server/${roomId}] ${player.name} reconectou`);

  // Sync completo: snapshot da sala + último game state se game já tá rolando
  // Phase 7 fix: pra modo dice, reenvia lastDiceState filtrado per-client
  // (server precisa filtrar pra não vazar dados alheios). Pra logic, lastGameState.
  let lastDiceStateForClient = null;
  if (room.lastDiceState && Array.isArray(room.lastDiceState.allDice)) {
    const playersArr = Array.from(room.players.values());
    const slot = playersArr.findIndex(p => p.playerId === playerId);
    const myDice = slot >= 0 ? (room.lastDiceState.allDice[slot] ?? []) : [];
    const { allDice: _drop, ...rest } = room.lastDiceState;
    lastDiceStateForClient = { ...rest, myDice };
  }

  send(ws, {
    type: 'reconnect_success',
    roomId,
    playerId,
    room: getRoomSnapshot(room),
    lastGameState: room.lastGameState,
    lastDoubtState: room.lastDoubtState,
    lastDiceState: lastDiceStateForClient,
    expectedPlayerId: room.expectedPlayerId,
  });

  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
}

function handleStartGame(ws, msg) {
  const ctx = wsToRoom.get(ws);

  // ─── Modo legado (backwards compat com `make dev` antigo) ───
  if (!ctx) {
    const playerNames = Array.isArray(msg.playerNames) ? msg.playerNames : [];
    if (playerNames.length === 0) {
      return send(ws, { type: 'error', code: 'no_players', message: 'Nenhum nome de jogador fornecido' });
    }
    const roomId = generateRoomCode();
    const playerId = generatePlayerId();
    const room = {
      roomId,
      hostId: playerId,
      players: new Map([[playerId, { playerId, name: playerNames[0], ws, connected: true, disconnectTimer: null, isBot: false }]]),
      engine: null,
      currentTurn: -1,
      expectedPlayerId: null,
      gameStarted: true,
      isSoloMode: true,
      gameMode: 'logic',   // legacy solo é sempre Boolean Bar
      legacyPlayerNames: playerNames,
      stdoutBuffer: '',
      lastGameState: null,
      lastDoubtState: null,
    };
    rooms.set(roomId, room);
    wsToRoom.set(ws, { roomId, playerId });
    console.log(`[Server] Modo solo (legado): sala ${roomId} auto-criada com ${playerNames.length} jogadores`);
    if (!spawnEngineForRoom(room)) {
      closeRoom(roomId, 'engine_spawn_failed');
    }
    return;
  }

  // ─── Modo multiplayer (sala já existe) ───
  const room = rooms.get(ctx.roomId);
  if (!room) return send(ws, { type: 'error', code: 'no_room', message: 'Sala não encontrada' });
  if (room.hostId !== ctx.playerId) {
    return send(ws, { type: 'error', code: 'not_host', message: 'Apenas o host pode iniciar o jogo' });
  }
  if (room.gameStarted) {
    return send(ws, { type: 'error', code: 'already_started', message: 'Jogo já começou' });
  }
  const connectedCount = Array.from(room.players.values()).filter(p => p.connected).length;
  if (connectedCount < MIN_PLAYERS_PER_ROOM) {
    return send(ws, { type: 'error', code: 'not_enough_players',
                     message: `Mínimo de ${MIN_PLAYERS_PER_ROOM} jogadores conectados pra começar` });
  }

  room.gameStarted = true;
  broadcast(room, { type: 'game_starting', room: getRoomSnapshot(room) });
  if (!spawnEngineForRoom(room)) {
    room.gameStarted = false;
    broadcast(room, { type: 'error', code: 'engine_failed', message: 'Falha ao iniciar engine' });
  }
}

function handleSendInput(ws, msg) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return send(ws, { type: 'error', code: 'no_room', message: 'Não está em uma sala' });
  const room = rooms.get(ctx.roomId);
  if (!room || !room.engine) {
    return send(ws, { type: 'error', code: 'no_engine', message: 'Jogo não iniciado' });
  }

  // Phase 3: validação de turno. Solo mode passa direto (1 cliente controla tudo).
  if (!room.isSoloMode && room.expectedPlayerId && ctx.playerId !== room.expectedPlayerId) {
    console.log(`[Server/${ctx.roomId}] input REJEITADO de ${ctx.playerId} (esperava ${room.expectedPlayerId})`);
    return send(ws, {
      type: 'input_rejected',
      reason: 'not_your_turn',
      expectedPlayerId: room.expectedPlayerId,
    });
  }

  if (room.engine.stdin.writable) {
    console.log(`[Server/${ctx.roomId}] input de ${ctx.playerId}: ${msg.data}`);
    room.engine.stdin.write(msg.data + '\n');
  }
}

function handleShutdown(ws) {
  console.log('[Server] Shutdown solicitado');
  for (const room of rooms.values()) {
    if (room.engine) {
      try { room.engine.kill(); } catch (_) {}
    }
  }
  send(ws, { type: 'shutdown_ack' });
  setTimeout(() => {
    wss.close(() => process.exit(0));
  }, 400);
}

// ─── HTTP estático em produção (Phase 5) ─────────────────────────────────────
// Em prod, o mesmo servidor serve os arquivos do `web/dist` E o WebSocket.
// Em dev, o Vite serve o frontend (porta 5173) e este arquivo só atende WS.
const DIST_DIR = path.resolve(__dirname, 'dist');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
  '.map':  'application/json',
};

async function serveStatic(req, res) {
  const urlPath = (req.url || '/').split('?')[0];
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  // Path traversal guard
  const safeRel = path.normalize(requested).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safeRel);
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    const content = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    return res.end(content);
  } catch (_) {
    // SPA fallback: rotas não encontradas devolvem index.html
    try {
      const fallback = await fsp.readFile(path.join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'], 'Cache-Control': 'no-cache' });
      return res.end(fallback);
    } catch (_) {
      res.writeHead(404); res.end('Not Found');
    }
  }
}

// ─── WS Server (atrelado ao HTTP em prod, standalone em dev) ─────────────────
let wss;
if (IS_PROD) {
  if (!existsSync(DIST_DIR)) {
    console.error(`[Node Server] ❌ ${DIST_DIR} não existe. Rode 'npm run build' antes.`);
    process.exit(1);
  }
  const httpServer = http.createServer(serveStatic);
  wss = new WebSocketServer({ server: httpServer });
  httpServer.listen(PORT, () => {
    console.log(`[Node Server] HTTP + WS na porta ${PORT} — servindo ${DIST_DIR}`);
  });
} else {
  wss = new WebSocketServer({ port: PORT });
  console.log(`[Node Server] Ponte WebSocket ativada na porta ${PORT} (dev mode — Vite serve o frontend)`);
}
console.log('Aguardando frontend(s) conectarem...');

wss.on('connection', (ws) => {
  console.log('=> Frontend Conectado');
  send(ws, { type: 'server_hello', message: '[SERVER] Conexão Aceita' });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      return send(ws, { type: 'error', code: 'invalid_json', message: 'JSON inválido' });
    }

    switch (msg.action) {
      case 'create_room': return handleCreateRoom(ws, msg);
      case 'join_room':   return handleJoinRoom(ws, msg);
      case 'leave_room':  return handleLeaveRoom(ws);
      case 'reconnect':   return handleReconnect(ws, msg);
      case 'start_game':  return handleStartGame(ws, msg);
      case 'send_input':  return handleSendInput(ws, msg);
      case 'add_bot':     return handleAddBot(ws);
      case 'remove_bot':       return handleRemoveBot(ws, msg);
      case 'get_leaderboard':  return handleGetLeaderboard(ws);
      case 'shutdown':         return handleShutdown(ws);
      default:
        return send(ws, { type: 'error', code: 'unknown_action', message: `Ação desconhecida: ${msg.action}` });
    }
  });

  ws.on('close', () => {
    console.log('=> Frontend desconectado');
    handleDisconnect(ws);  // Phase 4: grace window, não kicka direto
  });

  ws.on('error', (e) => {
    console.warn('[Server] WS error:', e.message);
  });
});

// ─── Heartbeat ping/pong (Phase 4) ───────────────────────────────────────────
// Detecta WS zumbi (conexão morta sem FIN). A cada HEARTBEAT_INTERVAL_MS, manda
// ping. Se a conexão não responder com pong até a próxima rodada, terminate.
const heartbeatInterval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      console.log('[Server] WS zumbi detectado, terminate');
      ws.terminate();  // dispara handleDisconnect via 'close'
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch (_) { /* WS já morreu */ }
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

wss.on('close', () => clearInterval(heartbeatInterval));
