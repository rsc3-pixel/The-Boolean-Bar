# 🐍 Guia Completo — Fernando Andrade
## Logic Master: Gerador (Fórmulas e Roleplay)

> **Papel:** Logic Master — Baralho Lógico e Gerador Aleatório de Recursos  
> **Arquivos:** `modules/deck_manager.c`, `modules/deck_manager.h`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Sorteador Aleatório e Sementes](#2-sprint-1)
3. [Sprint 2 — Gramática Logica](#3-sprint-2)
4. [Sprint 3 (Expansão) — O Sorteador de Dados Físicos](#4-sprint-3)
5. [Checklist](#5-checklist)

---

## 1. Visão Geral

Você cria os desafios! No modo Bar Booleano, você emite premissas como `(~P ^ Q)`. Já se o toggle do jogo estiver em Liar's Dice, você joga os dados virtuais no copo de cada jogador.

---

## 2. Sprint 1 — Sorteador Aleatório e Sementes

Como C utiliza `rand()` baseado num gerador semente comum `srand()`, precisamos instânciá-lo uma única vez via `clock`/`time` para os sorteios funcionarem. Fixe isso.

---

## 3. Sprint 2 — Gramática Lógica

Não podemos gerar fórmulas lógicas "bugadas" do tipo `(P && || ~P)`. Crie moldes/templates prontos que são sorteados dinamicamente:
* Exemplo Molde: `(~X OP Y)` - Podendo colocar sub-expressões no lugar de X e Y.

---

## 4. Sprint 3 (Expansão) — O Sorteador de Dados Físicos

Com o novo **Modo Tradicional (Liar's Dice)** ativado, os proposicionais que você criou dão espaço para dados reais. Logo no Início (e no começo de cada "Pós-Tiro" de roleta), todos devem rolar seus dados simultaneamente.

**Sua missão:**
- Implementar a função `deck_roll_dice(Jogador* player)`. Ela itera nos dados disponíveis na estrutura daquele player (de 1 a 5 na mão dele) e executa um simples `rand() % 6 + 1` de maneira balanceada (se certifique de que o randomizador de entropia não jogue sequências perfeitas 1, 2, 3, 4, 5).
- Como todos olham apenas os seus próprios copos (escondido dos oponentes), seu gerenciador simplesmente grava isso no player sem printar pras janelas inimigas.

---

## 5. Checklist

- [ ] RNG testado contra repetição por tempo rápido do loop em C.
- [ ] Moldes fixos e escaláveis pra Tabela-verdade.
- [ ] Rolador de dados capaz de suportar um "Copo Perfeito" e alocar faces de 1-6 para D6.
