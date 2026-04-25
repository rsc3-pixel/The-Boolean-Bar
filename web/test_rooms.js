// Smoke test do servidor Phase 1 (rooms).
// Roda: cd web && node test_rooms.js
import WebSocket from 'ws';

const URL = 'ws://localhost:8080';
const VERBOSE = process.argv.includes('--verbose');

function client(label) {
  const ws = new WebSocket(URL);
  const log = (...args) => console.log(`[${label}]`, ...args);
  const buffer = [];
  const waiters = [];
  ws.on('error', (e) => log('WS_ERROR:', e.message));
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (VERBOSE && msg.type !== 'c_stdout') log('RECV:', JSON.stringify(msg).slice(0, 150));
    // Resolve waiters em ordem
    const idx = waiters.findIndex(w => w.matcher(msg));
    if (idx !== -1) {
      const [w] = waiters.splice(idx, 1);
      clearTimeout(w.timer);
      w.resolve(msg);
    } else {
      buffer.push(msg);
    }
  });
  return {
    ws, label, log,
    open: () => new Promise((res, rej) => {
      ws.once('open', res);
      ws.once('error', rej);
    }),
    send: (msg) => {
      if (VERBOSE) log('SEND:', JSON.stringify(msg));
      ws.send(JSON.stringify(msg));
    },
    waitFor: (typeOrMatch, timeout = 5000) => new Promise((res, rej) => {
      const matcher = typeof typeOrMatch === 'string'
        ? (m) => m.type === typeOrMatch
        : typeOrMatch;
      const idx = buffer.findIndex(matcher);
      if (idx !== -1) {
        const [msg] = buffer.splice(idx, 1);
        return res(msg);
      }
      const w = { matcher, resolve: res };
      w.timer = setTimeout(() => {
        const i = waiters.indexOf(w);
        if (i !== -1) waiters.splice(i, 1);
        rej(new Error(`[${label}] Timeout waiting for ${typeof typeOrMatch === 'string' ? typeOrMatch : 'matcher'}`));
      }, timeout);
      waiters.push(w);
    }),
    close: () => { try { ws.close(); } catch (_) {} },
  };
}

async function testMultiplayer() {
  console.log('\n=== TESTE 1: fluxo multiplayer ===');
  const host = client('HOST');
  const p2 = client('P2');
  await host.open();
  await p2.open();

  await host.waitFor('server_hello', 1000);
  await p2.waitFor('server_hello', 1000);

  host.send({ action: 'create_room', playerName: 'Alice' });
  const created = await host.waitFor('room_created');
  const roomId = created.roomId;
  console.log(`  ✓ Sala criada: ${roomId}`);
  if (created.room.players.length !== 1) throw new Error('Esperava 1 player na sala recém-criada');
  if (!created.room.players[0].isHost) throw new Error('Host flag faltando');

  p2.send({ action: 'join_room', roomId, playerName: 'Bob' });
  const joined = await p2.waitFor('room_joined');
  if (joined.room.players.length !== 2) throw new Error('Esperava 2 players após join');
  console.log(`  ✓ P2 entrou (${joined.room.players.length} players)`);

  await host.waitFor('room_state', 1000);
  console.log('  ✓ host recebeu broadcast room_state');

  host.send({ action: 'start_game' });
  await host.waitFor('game_starting');
  await p2.waitFor('game_starting', 1000);
  console.log('  ✓ game_starting broadcast nos 2 clientes');

  const hostState = await host.waitFor('game_state', 5000);
  await p2.waitFor('game_state', 1000);
  console.log(`  ✓ game_state em ambos: turn=${hostState.data.turn} totalPlayers=${hostState.data.totalPlayers}`);
  if (hostState.data.totalPlayers !== 2) throw new Error('totalPlayers deveria ser 2');

  // Cleanup: host leave → fecha sala → mata engine
  host.send({ action: 'leave_room' });
  await new Promise(r => setTimeout(r, 300));
  host.close(); p2.close();
}

async function testJoinErrors() {
  console.log('\n=== TESTE 2: validações ===');
  const c = client('TEST');
  await c.open();
  await c.waitFor('server_hello', 1000);

  c.send({ action: 'join_room', roomId: 'ZZZZ', playerName: 'Ghost' });
  const err1 = await c.waitFor((m) => m.type === 'error');
  if (err1.code !== 'room_not_found') throw new Error(`Esperava room_not_found, veio ${err1.code}`);
  console.log(`  ✓ join em sala inexistente → error.code=${err1.code}`);

  c.send({ action: 'create_room', playerName: 'A' });
  await c.waitFor('room_created');
  c.send({ action: 'create_room', playerName: 'A' });
  const err2 = await c.waitFor((m) => m.type === 'error');
  if (err2.code !== 'already_in_room') throw new Error(`Esperava already_in_room, veio ${err2.code}`);
  console.log(`  ✓ create_room duplo → error.code=${err2.code}`);

  c.send({ action: 'start_game' });
  const err3 = await c.waitFor((m) => m.type === 'error');
  if (err3.code !== 'not_enough_players') throw new Error(`Esperava not_enough_players, veio ${err3.code}`);
  console.log(`  ✓ start sozinho → error.code=${err3.code}`);

  c.send({ action: 'leave_room' });
  await new Promise(r => setTimeout(r, 100));
  c.close();
}

async function testLegacySolo() {
  console.log('\n=== TESTE 3: backwards-compat (start_game sem create_room) ===');
  const c = client('SOLO');
  await c.open();
  await c.waitFor('server_hello', 1000);

  c.send({ action: 'start_game', playerNames: ['Eu', 'Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5', 'Bot6'] });
  const state = await c.waitFor('game_state', 5000);
  console.log(`  ✓ Solo: game_state turn=${state.data.turn} totalPlayers=${state.data.totalPlayers}`);
  if (state.data.totalPlayers !== 7) throw new Error('Esperava 7 players em solo');

  c.send({ action: 'leave_room' });
  await new Promise(r => setTimeout(r, 300));
  c.close();
}

(async () => {
  try {
    await testMultiplayer();
    await testJoinErrors();
    await testLegacySolo();
    console.log('\n🎉 Todos os testes passaram');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Teste falhou:', e.message);
    process.exit(1);
  }
})();
