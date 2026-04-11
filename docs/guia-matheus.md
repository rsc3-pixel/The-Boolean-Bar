# 🗄️ Guia Completo — Matheus Larré
## C Expert: Motor de Turnos e Fluxo Imperativo

> **Papel:** C Expert — Ciclo do Jogo, Motor de Regras, Predicados Funcionais  
> **Arquivos:** `modules/game_flow.c`, `modules/game_flow.h`, `functional/predicates.c`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Máquina de Estados Básica](#2-sprint-1)
3. [Sprint 2 — Pontes de Função e Filtros](#3-sprint-2)
4. [Sprint 3 (Expansão) — Orquestrando a Aposta Crescente (Liar's Dice)](#4-sprint-3)
5. [Checklist](#5-checklist)

---

## 1. Visão Geral

Você gerencia a máquina de estado principal de rodadas. No modo original, seu `game_loop` processa: Aposta -> Duvidar -> Avaliação -> Roleta Russa. No modo dados, a interação de players na mesa é maior.

---

## 2. Sprint 1 — Máquina de Estados Básica

Lógica para rodar o loop, pedir entrada na vez de cada um e invocar a avaliação de Tautologia. Caso haja mentira, invoca a punição na roleta russa randômica.

---

## 3. Sprint 2 — Ponteiros de Função e Lógica Funcional

Em `functional/predicates.c` defina abstrações como mapear e reduzir arrays do C apontando condições (quem tá vivo pra passar o turno ignorando os mortos).

---

## 4. Sprint 3 (Expansão) — Orquestrando a Aposta Crescente (Liar's Dice)

Aqui o Motor de Regras se torna imperioso! No Liar's Dice, o turno avança entre os "Apostadores".
A **Regra de Ouro** agora está em suas mãos.

**Sua missão em `game_flow.c`:**
- Manter registradas na mesa qual a aposta ALVO atual.
- Ao repassar a vez (o input do player N+1 no Liar's Dice), VOCÊ DEVE rejeitar qualquer lance que não seja MAIOR ou da MESMA QUANTIDADE com FACE MAIOR que o antigo. Exemplo: _"Se disseram que tem 5 quatros, o cara pode dizer 6 quatros ou 5 cincos"_.
- No momento em que um jogador invoca **LIAR** (Duvidal) com o botão, você paralisa a mesa e engatilha o juiz (João Pedro). 
- Caso o lance morra, perca o Dado lá na struct do Cauã! Se os dados zerarem, aplique `Morte Súbita` da Roleta.

---

## 5. Checklist

- [ ] Motor iterativo suporta a mudança lógica entre os modos Lógico vs Dados Baseado no toggle inicial.
- [ ] Validações rígidas no ciclo impedem jogadores de darem Downgrade na Aposta Curinga.
- [ ] Eliminação final correta mapeada via Array com programação funcional.
