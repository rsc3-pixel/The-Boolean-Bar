# 🧪 Testes do The Boolean Bar

Guia de como rodar os testes do projeto. Tudo roda contra o servidor WebSocket (`web/web_server.js`).

## Pré-requisitos

1. Engine compilado: na raiz, `make` (gera `build/boolean_bar.exe` no Windows ou `build/boolean_bar` no Linux).
2. Servidor no ar numa porta conhecida (default 8080):
   ```bash
   cd web
   PORT=8080 node web_server.js        # Linux/macOS
   ```
   ```powershell
   $env:PORT=8080; node web_server.js  # Windows PowerShell
   ```

> Os testes conectam em `ws://localhost:8080`. Pra mirar outra URL: `WS_URL=ws://host:porta node <teste>.js`.

---

## 1. Smoke test — `web/test_rooms.js`

Testa o protocolo de salas (Phase 1-4): criar/entrar, validações de erro, modo solo legado, reconnect e host transfer. São 5 cenários sequenciais com 1-2 conexões cada.

```bash
cd web
npm test            # = node test_rooms.js
node test_rooms.js --verbose   # loga cada mensagem WS
```

Saída esperada: `🎉 Todos os testes passaram` (exit 0). Qualquer falha sai com exit 1 e a mensagem do cenário que quebrou.

---

## 2. Teste de carga / sistema — `web/stress_test.js`

Sobe **100+ sessões de jogo simultâneas** contra o servidor pra provar que ele aguenta dezenas de partidas ao mesmo tempo (cada uma com seu próprio processo de engine) sem cair nem vazar processos.

```bash
cd web
npm run stress                      # 100 sessões, 25 simultâneas (default)
node stress_test.js 200 40          # 200 sessões, até 40 simultâneas
node stress_test.js 100 25 --verbose
```

**Como funciona:** cada sessão usa o modo solo legado (`start_game` com `playerNames`, sem criar sala). Um socket controla todos os jogadores da mesa, joga alguns turnos reais (prova o I/O bidirecional sob carga) e sai limpo. O foco é estressar o **servidor** — não cronometrar as animações do engine (roleta, sleeps), por isso o sucesso é "chegou a gameplay ativo", com vitória completa como métrica bônus.

**Critério de sucesso:** ≥95% das sessões chegam a gameplay ativo sem erro **e** o servidor continua de pé respondendo ao final. Exit 0 = passou, exit 1 = falhou.

**O relatório mostra:** pico de sessões simultâneas, engines com gameplay, sessões saudáveis, erros, timeouts, tempo médio até gameplay e tempo total.

> **Nota de calibração:** a concorrência ideal depende da máquina. Cada sessão spawna um processo de engine que roda animações em tempo real, então muitas sessões simultâneas competem por CPU. Em máquina modesta, use concorrência menor (ex: 15). Timeouts (não erros) sob concorrência alta indicam saturação de CPU local, não bug de servidor.

### Bug encontrado por este teste

A primeira rodada sob carga derrubou o servidor inteiro com um `EPIPE` não-tratado: quando um engine morria (sessão saindo) com um `stdin.write()` pendente, o erro era emitido no stream `engine.stdin` sem listener → crash do processo Node, levando junto **todas** as outras salas. Corrigido em `spawnEngineForRoom` com um listener de `error` no `engine.stdin` que ignora o write pendente (o fim do engine já é tratado em `engine.on('close')`).

---

## Conceito de "Pronto" (Definition of Done) para testes

Antes de marcar uma história como pronta:

- [ ] `make clean && make` compila sem warning novo
- [ ] `npm test` (smoke) passa
- [ ] `npm run stress` passa (≥95%, server vivo) se a mudança toca o servidor ou o engine
- [ ] Testado manualmente nos 2 modos (Logic + Dice) quando aplicável
