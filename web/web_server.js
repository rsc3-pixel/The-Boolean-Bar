import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Exclusão permanente do Windows Defender ──────────────────────────────────
// Roda uma vez ao iniciar o servidor para evitar o popup do SmartScreen
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

// Iniciando Servidor Ponte na porta 8080
const wss = new WebSocketServer({ port: 8080 });
console.log("[Node Server] Ponte WebSocket ativada na porta 8080.");
console.log("Aguardando Figma (React) se conectar...");

wss.on('connection', function connection(ws) {
  console.log("=> Frontend Conectado com sucesso!");
  let gameProcess = null;

  ws.send(JSON.stringify({ type: 'server_hello', message: "[SERVER] Conexão C-Web Protegida Aceita" }));

  ws.on('message', function message(data) {
    const msg = JSON.parse(data.toString());
    
    if (msg.action === 'start_game') {
      console.log("Iniciando a Engine em C (boolean_bar.exe)...");
      if (gameProcess) gameProcess.kill();

      // 🛡️ Desbloqueia o .exe antes de executar (evita pop-up do Windows SmartScreen)
      const exePath = path.resolve('..', 'build', 'boolean_bar.exe');
      if (!existsSync(exePath)) {
        console.error(`[Node Server] ❌ boolean_bar.exe NÃO encontrado em: ${exePath}`);
        ws.send(JSON.stringify({ type: 'c_stderr', data: `ERRO: boolean_bar.exe não encontrado em ${exePath}. Rode "make" primeiro.` }));
        return;
      }
      try {
        execSync(`powershell -Command "Unblock-File -Path '${exePath}'"`, { stdio: 'ignore' });
        console.log(`[Node Server] ✅ Unblock-File aplicado em: ${exePath}`);
      } catch (e) {
        console.warn(`[Node Server] ⚠️ Unblock-File falhou (pode ser normal): ${e.message}`);
      }
      
      // Mágica para rodar o C escondido
      gameProcess = spawn(path.join('..', 'build', 'boolean_bar.exe'), [], { shell: true });
      
      // Envia ao C: primeira linha = quantidade, depois um nome por linha
      const playerNames = msg.playerNames || [];
      const count = playerNames.length;

      setTimeout(() => {
        if (gameProcess && gameProcess.stdin.writable) {
          // Linha 1: número de jogadores
          let input = `${count}\n`;
          // Linhas 2..N: nomes
          for (const name of playerNames) {
            input += `${name}\n`;
          }
          console.log(`[Node Server] Enviando ao C: ${count} jogadores\n${input}`);
          gameProcess.stdin.write(input);
        }
      }, 100);

      let stdoutBuffer = '';

      // Lidando com a saida de texto (printf) do C
      gameProcess.stdout.on('data', (d) => {
        stdoutBuffer += d.toString();
        
        // Separa por linhas caso o C cuspa tudo de uma vez
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || ''; // O último item é o resto que sobrou

        
        lines.forEach(line => {
          if (!line.trim()) return;
          
          if (line.includes("JSON_STATE:")) {
             // Extrai apenas o JSON
             const jsonPart = line.substring(line.indexOf("JSON_STATE:") + 11).trim();
             try {
                const parsed = JSON.parse(jsonPart);
                ws.send(JSON.stringify({ type: 'game_state', data: parsed }));
             } catch(e) {
                console.error("Falha ao parsear JSON_STATE", e);
             }
          } else if (line.includes("JSON_DOUBT_STATE:")) {
             const jsonPart = line.substring(line.indexOf("JSON_DOUBT_STATE:") + 17).trim();
             try {
                const parsed = JSON.parse(jsonPart);
                ws.send(JSON.stringify({ type: 'doubt_state', data: parsed }));
             } catch(e) {
                console.error("Falha ao parsear JSON_DOUBT_STATE", e);
             }
          } else if (line.includes("JSON_DOUBT_RESULT:")) {
             // Quem perdeu o confronto lógico (quem vai para a roleta)
             const jsonPart = line.substring(line.indexOf("JSON_DOUBT_RESULT:") + 18).trim();
             try {
                const parsed = JSON.parse(jsonPart);
                console.log("[Node Server] ⚖️ Resultado do confronto:", parsed);
                ws.send(JSON.stringify({ type: 'doubt_result', data: parsed }));
             } catch(e) {
                console.error("Falha ao parsear JSON_DOUBT_RESULT", e);
             }
          } else if (line.includes("JSON_ROULETTE_RESULT:")) {
             // Resultado real da roleta russa (sobreviveu ou morreu)
             const jsonPart = line.substring(line.indexOf("JSON_ROULETTE_RESULT:") + 21).trim();
             try {
                const parsed = JSON.parse(jsonPart);
                console.log("[Node Server] 🎰 Resultado da roleta:", parsed);
                ws.send(JSON.stringify({ type: 'roulette_result', data: parsed }));
             } catch(e) {
                console.error("Falha ao parsear JSON_ROULETTE_RESULT", e);
             }
          } else if (line.includes("JSON_VICTORY:")) {
             // Estado de vitória final
             const jsonPart = line.substring(line.indexOf("JSON_VICTORY:") + 13).trim();
             try {
                const parsed = JSON.parse(jsonPart);
                console.log("[Node Server] 🏆 Vitória detectada:", parsed);
                ws.send(JSON.stringify({ type: 'victory_state', data: parsed }));
             } catch(e) {
                console.error("Falha ao parsear JSON_VICTORY", e);
             }
          } else {
             console.log(`[C_ENGINE]: ${line.trim()}`);
             // Repassando em texto limpo pro Javascript FrontEnd (Logs)
             ws.send(JSON.stringify({ type: 'c_stdout', data: line }));
             
             // Adaptação: Se a tela precisa que o front exiba dúvida genérica
             if (line.includes("você DUVIDA")) {
                  ws.send(JSON.stringify({ type: 'trigger', event: 'show_doubt' }));
             }
             if (line.includes("BANG!")) {
                  ws.send(JSON.stringify({ type: 'trigger', event: 'player_death' }));
             }
          }
        });
      });

      gameProcess.stderr.on('data', (d) => {
        ws.send(JSON.stringify({ type: 'c_stderr', data: d.toString() }));
      });
      
      gameProcess.on('close', (code) => {
        console.log(`C Engine finalizou com status ${code}`);
        ws.send(JSON.stringify({ type: 'c_exit', code }));
      });
    }

    if (msg.action === 'send_input' && gameProcess) {
       console.log(`Interceptando UI Click e enviando pro C: ${msg.data}`);
       gameProcess.stdin.write(msg.data + '\n');
    }

    if (msg.action === 'shutdown') {
      console.log('[Node Server] 🚪 Shutdown solicitado pelo frontend. Encerrando...');
      if (gameProcess) { try { gameProcess.kill(); } catch(_) {} }
      try { ws.send(JSON.stringify({ type: 'shutdown_ack' })); } catch(_) {}
      setTimeout(() => {
        wss.close(() => { process.exit(0); });
      }, 400);
    }
  });
});
