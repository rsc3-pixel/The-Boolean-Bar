const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log("Conectado ao Node. Mandando start_game...");
  ws.send(JSON.stringify({ action: "start_game" }));
});

ws.on('message', function message(data) {
  console.log("RECEBIDO: ", data.toString());
});

setTimeout(() => {
  console.log("Timeout. Fechando.");
  process.exit(0);
}, 3000);
