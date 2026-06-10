# Roteiro — Screencast da execução dos testes

Vídeo curto (~2-3 min) mostrando os testes rodando, pra anexar nos cards da entrega. Grava a tela com OBS/Game Bar (`Win+G`).

## Antes de gravar

1. Compila o engine (1 vez): na raiz, `make`
2. Abre **2 terminais** lado a lado:
   - **Terminal A** (servidor): `cd web` e deixa pronto
   - **Terminal B** (testes): `cd web` e deixa pronto

## Roteiro (na ordem)

### Cena 1 — Subir o servidor (~15s)
No **Terminal A**:
```powershell
$env:PORT=8080; node web_server.js
```
Mostra a linha `Ponte WebSocket ativada na porta 8080`. Narra: "Este é o servidor que orquestra as partidas via WebSocket."

### Cena 2 — Smoke test (~30s)
No **Terminal B**:
```powershell
node test_rooms.js
```
Mostra os 5 cenários passando até `🎉 Todos os testes passaram`. Narra: "Testes de fluxo: criar/entrar em sala, validações de erro, modo solo, reconexão e transferência de host."

> No PowerShell, se a saída não aparecer ao vivo, rode `node test_rooms.js 2>&1 | Out-String` (evita o buffer do stdout).

### Cena 3 — Teste de carga 100+ sessões (~60s)
No **Terminal B**:
```powershell
node stress_test.js 100 25
```
Mostra o relatório final: **100 sessões, 100% saudáveis, 0 erros, server vivo**. Narra: "Teste de sistema: 100 partidas simultâneas, cada uma com seu próprio processo de engine. O servidor aguenta a carga e limpa tudo no final."

### Cena 4 — Fechamento (~20s)
Comenta o diferencial: "Esse teste de carga encontrou um bug real de crash (EPIPE) que derrubava o servidor inteiro sob carga. Identificado, corrigido e documentado." (Pode mostrar a issue #1 no GitHub.)

## Dicas
- Fonte do terminal grande (legível no vídeo).
- Se a máquina engasgar com 25 simultâneas, usa `node stress_test.js 100 15` (mais estável, mesma prova de 100 sessões).
- O `npm test` e `npm run stress` fazem a mesma coisa que os comandos `node` acima, se preferir mostrar via npm.
