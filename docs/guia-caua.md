# 🗄️ Guia Completo — Cauã Rego
## C Expert: Backend Core (Gestão de Memória e Tipos)

> **Papel:** C Expert — Structs, Alocação Dinâmica (`malloc`/`free`) e State  
> **Arquivos:** `core/memory.c`, `core/memory.h`, `core/types.h`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Tipos Fundamentais (TADs)](#2-sprint-1)
3. [Sprint 2 — Lifecicle & Memória Dinâmica](#3-sprint-2)
4. [Sprint 3 (Expansão) — Preparando as Tipologias Múltiplas](#4-sprint-3)
5. [Checklist](#5-checklist)

---

## 1. Visão Geral

Você gerencia a base de dados em memória do jogo. A Mesa, os Jogadores, As Cartas; tudo existe na memória Heap. O seu dever mais sério é garantir que não exista nenhum vazamento de memória (Memory Leak) no jogo.

---

## 2. Sprint 1 — Tipos Fundamentais (TADs)

Crie no `core/types.h` structs consistentes para `Carta` (ou string em Tautologia), `Jogador` e `Mesa`.

---

## 3. Sprint 2 — Lifecycle & Memória Dinâmica

O `mem_new_mesa()` inicializará toda essa alocação via `malloc`, instanciando todos os structs Jogador. O `mem_free_mesa()` lidará no loop principal pra limpar ponteiros perfeitamente usando Valgrind (estratégia Zero leaks).

---

## 4. Sprint 3 (Expansão) — Preparando as Tipologias Múltiplas

Com o Modo Tradicional (Liar's Dice) sendo uma bandeira paralela, seu controle das Structs vai se complicar, então mantenha rígido!

1. **Expansão do Jogador:** A struct principal do player tem que conter os 5 Dados D6! Atualize o `types.h` adicionando `int dados[5]` (ou ponteiro) no Jogador; adicione um contador passivo `int num_dados` (que começa em 5).
2. **Vida x Dados:** No Liar's Dice, se perder vida, perde dados. Mapeie uma função segura como `player_lose_die(Jogador* p)` para blindar contra corrupção.

---

## 5. Checklist

- [ ] Definir Enums e Structs em `types.h` (Agora híbridos pra cartas e pros array numéricos D6).
- [ ] Implementar `malloc` e `free` que aguentem os dois estilos em loop sem crash.
