# 📄 Guia Completo — Gabriel Brito
## QA, Testes de Integração & Documentação Técnica

> **Papel:** QA & Docs — Segurança em Input, Estresse de CLI, Testes WS e Repositório  
> **Arquivos:** `core/input_handler.c`, `test_ws.js`, `docs/*.md`, `DEFESA_TECNICA.md`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Prevenção de Segfaults e Input Seguro](#2-sprint-1)
3. [Sprint 2 — Testes na Integração do Servidor](#3-sprint-2)
4. [Sprint 3 (Expansão) — A Matemática da Mentira Física (Liar's Dice)](#4-sprint-3)
5. [Checklist](#5-checklist)

---

## 1. Visão Geral

Você garante que o bar clandestino não desmorone se um jogador bêbado chutar uma cadeira. O QA varre os erros pra manter o uptime. Além disso, as regras acadêmicas da Engine são você que escreve.

---

## 2. Sprint 1 — Prevenção de Segfaults

Lide com inputs absurdos! Não deixe um `fgets()` vazar `Segmentation Fault` caso o usuário mande pacotes de bytes ilógicos no C terminal.

---

## 3. Sprint 2 — Testes Websocket Mock

Configure um gerador de pacotes JSON falhos via Node/JS em `test_ws.js` para metralhar (flood test) a ponte WebSocket criada pelo Renato, verificando se ela sobrevive com graça.

---

## 4. Sprint 3 (Expansão) — A Matemática da Mentira Física (Liar's Dice)

Com a injeção do botão **Modo Tradicional**, o jogo virou uma aposta híbrida entre dados e programação limpa. E como QA / Analista acadêmico, você tem o dever de modelar as explicações do que as lógicas da IA e de Validação estão fazendo (*"Por que diabos $1/3$ de chance e não $1/6$?"*).

**Sua Missão com Documentação & Testes de Curinga:**
- Escrever na pasta *docs/* qual a lógica real por trás desse novo tipo de BLEFE.
- Validando Estatísticas: A face '1' como wildcard significa que em cada lançamento o Dado que tem 6 faces apresenta na verdade '2 faces' favoráveis pro lance da rodada (A face desejada E a face curinga). Portanto isso quebra a chance $1/6$ para as novas chances base ($2/6 = 1/3$).
- O seu banco de testes `test_ws.js` precisa disparar inputs forjados no WebSocket, validando pro Matheus testar o motor dele, simulando Apostar BAIXO, DEPOIS ALTO, e depois BAIXO novamente sem ele deixar.

---

## 5. Checklist

- [ ] Lixo Binário rejeitado nas strings alocadas.
- [ ] Regras e Teoria Estatística descrita formalmente na doc para defesa.
- [ ] Script Node testando flood messages.
