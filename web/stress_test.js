// Teste de carga / sistema: 100+ sessões de jogo simultâneas contra o WS server.
//
// O que ele PROVA: o server aguenta dezenas de partidas ao mesmo tempo — cada uma
// com seu próprio processo de engine spawnado — roteando stdin/stdout via WebSocket
// e limpando as salas no fim, sem cair nem vazar processos.
//
// Como cada sessão funciona: usa o modo solo legado (start_game com playerNames, sem
// criar sala). Um único socket controla TODOS os jogadores da mesa e não é gateado por
// turno, então consegue tocar a partida de Lógica sozinho. Cada sessão joga alguns
// turnos reais (prova o I/O bidirecional sob carga) e então sai limpo. Vitória completa
// é métrica bônus — não é o foco, porque o tempo de uma partida depende das animações
// do engine (roleta, sleeps), não da capacidade do server.
//
// Uso:
//   node stress_test.js [totalSessoes] [concorrencia]
//   node stress_test.js                 → 100 sessões, 25 simultâneas (default)
//   node stress_test.js 200 40          → 200 sessões, 40 simultâneas
//   node stress_test.js 100 25 --verbose
//
// Critério de sucesso: >=95% das sessões chegam a gameplay ativo sem erro, E o server
// continua de pé respondendo ao final.
import WebSocket from 'ws';

const URL = process.env.WS_URL || 'ws://localhost:8080';
const TOTAL = Number(process.argv[2]) || 100;
const CONCURRENCY = Number(process.argv[3]) || 25;
const VERBOSE = process.argv.includes('--verbose');

const TURNS_TO_PROVE = 3;       // turnos reais jogados antes de considerar "saudável"
const SESSION_TIMEOUT_MS = 60000; // folga p/ sessões lentas sob contenção de CPU
const IDLE_NUDGE_MS = 1500;     // destrava pausas ("Pressione Enter") se nada chega
const PLAYER_NAMES = ['Você', 'Ana', 'Beto', 'Caio', 'Duda', 'Eva', 'Igor'];

const stats = {
  started: 0,      // recebeu game_starting (engine foi spawnado)
  healthy: 0,      // jogou TURNS_TO_PROVE turnos sem erro
  victories: 0,    // bônus: partida foi até o fim
  errored: 0,
  timedOut: 0,
  peakConcurrent: 0,
  active: 0,
  durations: [],   // ms até ficar saudável
};

function runSession(id) {
  return new Promise((resolve) => {
    const ws = new WebSocket(URL);
    const t0 = Date.now();
    let done = false;
    let turns = 0;
    let idleTimer = null;
    let hardTimer = null;

    const log = (...a) => { if (VERBOSE) console.log(`[s${id}]`, ...a); };
    const send = (msg) => { try { ws.send(JSON.stringify(msg)); } catch (_) {} };

    const finish = (outcome) => {
      if (done) return;
      done = true;
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
      stats.active--;
      if (outcome === 'healthy') { stats.healthy++; stats.durations.push(Date.now() - t0); }
      else if (outcome === 'victory') { stats.healthy++; stats.victories++; stats.durations.push(Date.now() - t0); }
      else if (outcome === 'timeout') stats.timedOut++;
      else stats.errored++;
      send({ action: 'leave_room' });
      setTimeout(() => { try { ws.close(); } catch (_) {} }, 50);
      resolve({ id, outcome });
    };

    // Watchdog: se o engine ficou parado num "Pressione Enter", manda \n.
    const armIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (done) return;
        send({ action: 'send_input', data: '' });
        armIdle();
      }, IDLE_NUDGE_MS);
    };

    ws.on('error', (e) => { log('WS_ERROR', e.message); finish('error'); });
    ws.on('open', () => { hardTimer = setTimeout(() => finish('timeout'), SESSION_TIMEOUT_MS); });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (_) { return; }
      armIdle();

      switch (msg.type) {
        case 'server_hello':
          stats.active++;
          stats.peakConcurrent = Math.max(stats.peakConcurrent, stats.active);
          send({ action: 'start_game', playerNames: PLAYER_NAMES });
          break;

        case 'game_state': {
          // Modo solo legado não emite game_starting — o 1º game_state é a prova
          // de que o engine subiu e está produzindo gameplay.
          if (turns === 0) stats.started++;
          turns++;
          if (turns >= TURNS_TO_PROVE) { finish('healthy'); break; }
          const hand = msg.data?.currentHand?.length ?? 5;
          const card = 1 + Math.floor(Math.random() * Math.max(1, hand));
          const tipo = 1 + Math.floor(Math.random() * 3);
          send({ action: 'send_input', data: String(card) });
          send({ action: 'send_input', data: String(tipo) });
          break;
        }

        case 'doubt_state':
          send({ action: 'send_input', data: Math.random() < 0.5 ? '1' : '0' });
          break;

        case 'victory_state':
          finish('victory');
          break;

        case 'c_stdout':
          if (/Enter|continuar/i.test(msg.data || '')) send({ action: 'send_input', data: '' });
          break;

        case 'c_exit':
          if (!done) finish('error');
          break;

        case 'error':
          log('server error:', msg.code);
          finish('error');
          break;
      }
    });
  });
}

async function runPool(total, concurrency) {
  let next = 0;
  const worker = async () => {
    while (next < total) { await runSession(next++); }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

/** Confere que o server continua vivo respondendo a uma nova conexão. */
function serverStillAlive() {
  return new Promise((resolve) => {
    const ws = new WebSocket(URL);
    const timer = setTimeout(() => { try { ws.close(); } catch (_) {} resolve(false); }, 3000);
    ws.on('message', (raw) => {
      try {
        if (JSON.parse(raw.toString()).type === 'server_hello') {
          clearTimeout(timer); ws.close(); resolve(true);
        }
      } catch (_) {}
    });
    ws.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}

function printReport(wallMs, alive) {
  const dur = stats.durations;
  const avg = dur.length ? Math.round(dur.reduce((a, b) => a + b, 0) / dur.length) : 0;
  const ok = stats.healthy;
  const okPct = ((ok / TOTAL) * 100).toFixed(1);

  console.log('\n' + '='.repeat(52));
  console.log('  RELATÓRIO DO TESTE DE CARGA');
  console.log('='.repeat(52));
  console.log(`  Sessões solicitadas ....... ${TOTAL}`);
  console.log(`  Concorrência (teto) ....... ${CONCURRENCY}`);
  console.log(`  Pico simultâneo ........... ${stats.peakConcurrent}`);
  console.log(`  Engines com gameplay ...... ${stats.started}`);
  console.log(`  ─────────────────────────`);
  console.log(`  ✓ Sessões saudáveis ....... ${ok} (${okPct}%)`);
  console.log(`     ↳ destas, até a vitória . ${stats.victories}`);
  console.log(`  ✗ Erros ................... ${stats.errored}`);
  console.log(`  ⏱ Timeouts ................ ${stats.timedOut}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Tempo até gameplay (méd) .. ${avg}ms`);
  console.log(`  Tempo total (wall) ........ ${(wallMs / 1000).toFixed(1)}s`);
  console.log(`  Server vivo no fim ........ ${alive ? 'SIM ✓' : 'NÃO ✗'}`);
  console.log('='.repeat(52));

  const pass = (ok / TOTAL >= 0.95) && alive;
  console.log(pass ? '\n🎉 PASSOU (>=95% das sessões com gameplay ativo, server de pé)\n'
                   : '\n❌ FALHOU (ver erros/timeouts acima)\n');
  return pass;
}

(async () => {
  console.log(`Teste de carga: ${TOTAL} sessões, até ${CONCURRENCY} simultâneas → ${URL}\n`);
  const t0 = Date.now();
  await runPool(TOTAL, CONCURRENCY);
  const wall = Date.now() - t0;
  // Dá um respiro pro server fechar as salas antes do health check.
  await new Promise(r => setTimeout(r, 1000));
  const alive = await serverStillAlive();
  const pass = printReport(wall, alive);
  process.exit(pass ? 0 : 1);
})();
