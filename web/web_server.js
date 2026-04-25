import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Exclusão permanente do Windows Defender ──────────────────────────────────
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

// ─── Configuração ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8080;
const MAX_PLAYERS_PER_ROOM = 7;
const MIN_PLAYERS_PER_ROOM = 2;
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos (0/O, 1/I/L)

// ─── Estado em memória ────────────────────────────────────────────────────────
/**
 * @typedef {Object} Player
 * @property {string} playerId
 * @property {string} name
 * @property {WebSocket} ws
 *
 * @typedef {Object} Room
 * @property {string} roomId
 * @property {string} hostId
 * @property {Map<string, Player>} players  insertion order = ordem de turno do engine
 * @property {import('child_process').ChildProcess|null} engine
 * @property {number} currentTurn  índice do jogador atual segundo o último JSON_STATE
 * @property {boolean} gameStarted
 * @property {boolean} isSoloMode  true = modo legado (1 cliente controla tudo)
 * @property {string[]} legacyPlayerNames  só usado em soloMode
 * @property {string} stdoutBuffer  buffer parcial entre chunks do engine
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
    send(player.ws, msg);
  }
}

function getRoomSnapshot(room) {
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    isSoloMode: room.isSoloMode,
    players: Array.from(room.players.values()).map((p, idx) => ({
      playerId: p.playerId,
      name: p.name,
      slot: idx,
      isHost: p.playerId === room.hostId,
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
    send(player.ws, { type: 'room_closed', reason });
    wsToRoom.delete(player.ws);
  }
  rooms.delete(roomId);
  console.log(`[Server] Sala ${roomId} fechada (${reason})`);
}

// ─── Engine spawn + output handling ───────────────────────────────────────────
function spawnEngineForRoom(room) {
  const exePathAbs = path.resolve(__dirname, '..', 'build', 'boolean_bar.exe');
  if (!existsSync(exePathAbs)) {
    broadcast(room, {
      type: 'c_stderr',
      data: `ERRO: boolean_bar.exe não encontrado em ${exePathAbs}. Rode "make" primeiro.`,
    });
    return false;
  }

  // Unblock-File é Windows-only; na Linux falha silenciosamente
  try {
    execSync(`powershell -Command "Unblock-File -Path '${exePathAbs}'"`, { stdio: 'ignore' });
  } catch (_) {}

  const engine = spawn(path.join(__dirname, '..', 'build', 'boolean_bar.exe'), [], { windowsHide: true });
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
      { tag: 'JSON_STATE:',           type: 'game_state',      onParse: (data) => { room.currentTurn = data.turn; } },
      { tag: 'JSON_DOUBT_STATE:',     type: 'doubt_state' },
      { tag: 'JSON_DOUBT_RESULT:',    type: 'doubt_result' },
      { tag: 'JSON_ROULETTE_RESULT:', type: 'roulette_result' },
      { tag: 'JSON_VICTORY:',         type: 'victory_state' },
    ];

    let handled = false;
    for (const m of markers) {
      const idx = line.indexOf(m.tag);
      if (idx === -1) continue;
      const jsonPart = line.substring(idx + m.tag.length).trim();
      try {
        const parsed = JSON.parse(jsonPart);
        if (m.onParse) m.onParse(parsed);
        broadcast(room, { type: m.type, data: parsed });
      } catch (e) {
        console.error(`[Server/${room.roomId}] Falha ao parsear ${m.tag}:`, e.message);
      }
      handled = true;
      break;
    }

    if (!handled) {
      console.log(`[ENGINE/${room.roomId}]: ${line.trim()}`);
      broadcast(room, { type: 'c_stdout', data: line });
      if (line.includes('você DUVIDA')) {
        broadcast(room, { type: 'trigger', event: 'show_doubt' });
      }
      if (line.includes('BANG!')) {
        broadcast(room, { type: 'trigger', event: 'player_death' });
      }
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

  const room = {
    roomId,
    hostId: playerId,
    players: new Map([[playerId, { playerId, name: playerName, ws }]]),
    engine: null,
    currentTurn: -1,
    gameStarted: false,
    isSoloMode: false,
    legacyPlayerNames: [],
    stdoutBuffer: '',
  };
  rooms.set(roomId, room);
  wsToRoom.set(ws, { roomId, playerId });

  send(ws, { type: 'room_created', roomId, playerId, room: getRoomSnapshot(room) });
  console.log(`[Server] Sala ${roomId} criada por ${playerName} (${playerId})`);
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
  room.players.set(playerId, { playerId, name: playerName, ws });
  wsToRoom.set(ws, { roomId, playerId });

  send(ws, { type: 'room_joined', roomId, playerId, room: getRoomSnapshot(room) });
  broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
  console.log(`[Server/${roomId}] ${playerName} (${playerId}) entrou. Total: ${room.players.size}`);
}

function handleLeaveRoom(ws) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.roomId);
  if (!room) {
    wsToRoom.delete(ws);
    return;
  }

  room.players.delete(ctx.playerId);
  wsToRoom.delete(ws);
  console.log(`[Server/${ctx.roomId}] ${ctx.playerId} saiu. Restam: ${room.players.size}`);

  if (room.players.size === 0) {
    closeRoom(ctx.roomId, 'empty');
  } else if (ctx.playerId === room.hostId) {
    closeRoom(ctx.roomId, 'host_left');
  } else {
    broadcast(room, { type: 'room_state', room: getRoomSnapshot(room) });
  }
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
      players: new Map([[playerId, { playerId, name: playerNames[0], ws }]]),
      engine: null,
      currentTurn: -1,
      gameStarted: true,
      isSoloMode: true,
      legacyPlayerNames: playerNames,
      stdoutBuffer: '',
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
  if (room.players.size < MIN_PLAYERS_PER_ROOM) {
    return send(ws, { type: 'error', code: 'not_enough_players',
                     message: `Mínimo de ${MIN_PLAYERS_PER_ROOM} jogadores pra começar` });
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

  // Phase 1: sem validação de turno. Phase 3 vai gatekeep aqui.
  // Em soloMode, qualquer input do único cliente é forwarded.
  // Em multiplayer, qualquer player pode mandar input por ora (UI vai gatekeep no Phase 3).
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

// ─── WS Server ────────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });
console.log(`[Node Server] Ponte WebSocket ativada na porta ${PORT}`);
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
      case 'start_game':  return handleStartGame(ws, msg);
      case 'send_input':  return handleSendInput(ws, msg);
      case 'shutdown':    return handleShutdown(ws);
      default:
        return send(ws, { type: 'error', code: 'unknown_action', message: `Ação desconhecida: ${msg.action}` });
    }
  });

  ws.on('close', () => {
    console.log('=> Frontend desconectado');
    handleLeaveRoom(ws);
  });

  ws.on('error', (e) => {
    console.warn('[Server] WS error:', e.message);
  });
});
