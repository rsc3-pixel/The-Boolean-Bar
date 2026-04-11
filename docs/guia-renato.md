# 🚀 Guia Completo — Renato Chong
## Tech Lead: DevOps & Integração Full-Stack

> **Papel:** Tech Lead — Arquitetura, Integração do C com Node.js/React, Code Review  
> **Arquivos:** `Makefile`, `sign_exe.ps1`, `web_server.js`, `figma_export/package.json`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Orquestrando o C e o Build](#2-sprint-1)
3. [Sprint 2 — Servidor WebSocket Node.js](#3-sprint-2)
4. [Sprint 3 — Integração com React](#4-sprint-3)
5. [Sprint 4 (Expansão) — Preparando o Terreno pro "Liar's Dice"](#5-sprint-4-expansao)
6. [Checklist do Tech Lead](#6-checklist)

---

## 1. Visão Geral

Como **Tech Lead**, seu papel não é apenas codar, mas estruturar como as peças se conversam. Nossa stack é híbrida: **C11 para a lógica bruta e React para a UI moderna**. O meio de campo é feito via um servidor WebSocket (`web_server.js`). 

Você garante que o jogo compila bem (via `Makefile`), que os executáveis passam por bypass do Defender no Windows (`sign_exe.ps1`) e que a ponte entre o terminal C e o React (via JSON/WebSocket) não pare de rodar.

---

## 2. Sprint 1 — Orquestrando o C e o Build

Seu primeiro passo é garantir uma build infalível do binário final.

**O que você domina:**
- `Makefile` (Regras `make` e `make dev` que sobrem simultaneamente o C, o Node e o Vite).
- `sign_exe.ps1` (Scripts de bypass local para evitar que o SmartScreen pegue o binário).

**Fluxo Esperado:**
1. Rodar `make` compila as pastas `core`, `modules`, `functional` e `ui`.
2. O binário `boolean_bar.exe` é gerado "limpo" no root.

---

## 3. Sprint 2 — Servidor WebSocket Node.js

Você precisa criar o barramento de eventos (`web_server.js`) onde o Frontend (do Luís) e a Engine em C (do Cauã e Matheus) trocam mensagens.

**O que implementar:**
- Iniciar `ws` Server na porta 8080.
- Servir arquivos estáticos do frontend em Express.
- Ouvir mensagens do React (ex: `ADD_PLAYER`) e traduzi-las.
- Lançar o processo `boolean_bar.exe` em *background* via `child_process`.
- Enviar as saídas do stdout do C em JSON para os clientes do WebSocket.

---

## 4. Sprint 3 — Code Review & Integração com React

O `web_server.js` precisa interpretar o JSON recebido pelo Frontend. Reveja obrigatoriamente todos os arquivos do **Cauã** (`mallocs`) para garantir que o seu servidor Node não quebre por causa de um `Segmentation Fault` na engine.

---

## 5. Sprint 4 (Expansão) — Preparando o Terreno pro "Liar's Dice"

O projeto ganhou a capacidade visual de um **Toggle (Modo Lógico / Modo Tradicional)** lá no Frontend. Para que a Engine em C mude, o intermédio tem que repassar essa ordem no momento de instanciar o game.

**Sua missão na integração:**
1. Processar o payload JSON do Lobby no Node onde haverá um novo _state_: `{"game_mode": "logical" | "dice"}`.
2. Formatar as trocas de mensagens na rodada conforme o modo. No modo lógico a Engine cospe `Proposicao`. No Tradicional (Dados), a Engine enviará lances como `{"action": "bet", "qnt": 5, "face": 4}`. Você precisará garantir que o Node repasse esses JSONs intactos para os painéis de aposta nas views do Luís e escute as apostas de incremento mandando de volta para a linguagem C.

---

## 6. Checklist

- [ ] `Makefile` com alvo `dev` que sobe C, Server e Frontend de uma vez.
- [ ] `web_server.js` criado usando `ws` e `express`.
- [ ] O backend C executa e envia logs que não quebram o parser JSON.
- [ ] Payload JSON consegue transitar a variável `game_mode=dice` sem travar a porta do Socket!
