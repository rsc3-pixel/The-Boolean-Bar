# 🐍 Guia Completo — João Pedro
## Logic Master: Avaliador de Fórmulas e Tabela-Verdade

> **Papel:** Logic Master — Lógica de Programação, Tabelas-Verdade (Avaliador) e Algoritmo  
> **Arquivos:** `modules/logic_engine.c`, `modules/logic_engine.h`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Tipos e Conectivos (Modo Lógico)](#2-sprint-1)
3. [Sprint 2 — O Avaliador Booleano](#3-sprint-2)
4. [Sprint 3 (Expansão) — O Avaliador Matemático (Liar's Dice)](#4-sprint-3)
5. [Checklist](#5-checklist)

---

## 1. Visão Geral

Você atua como um juiz cego e infalível e avalia o que os jogadores jogam na mesa. No modo clássico, valida as fórmulas usando Lógica Computacional. No modo Liar's Dice, você varre os arrays pra contar estatística e curingas.

---

## 2. Sprint 1 — Tipos e Conectivos (Modo Lógico)

Você precisa abstrair as portas lógicas booleanas.
**O que implementar (`logic_engine.c`):**
- Conectivo AND (`&` ou `^`), OR (`|` ou `v`), Implicação (`->`), Bicondicional (`<->`) e Negação (`~` ou `¬`).

---

## 3. Sprint 2 — O Avaliador Booleano

Para o modo raiz:
1. Mapeie quantas variáveis únicas a proposição tem (p, q, r).
2. Gere $2^n$ combinações.
3. Se avalia `TRUE` em todas = `TAUTOLOGIA`. `FALSE` em todas = `CONTRADIÇÃO`. Caso não = `CONTINGÊNCIA`.

---

## 4. Sprint 3 (Expansão) — O Avaliador Matemático (Liar's Dice)

Se a chave da mesa apontar que é Modo Dados, a engine polinomial é desligada e ligamos um Avaliador Aritmético.

O Matheus, gerenciador de turnos, vai bater na sua porta e perguntar: _"João, Fulano duvidou da aposta (Ex: Apostaram 6 dados de face 4). É verdade ou mentira?"_

**Sua missão:**
1. Acessar a Struct de todo mundo e extrair a matriz inteira de dados (via Cauã).
2. Rastrear o valor `Face Apostada` por toda a mesa.
3. **Bônus (Regra do Curinga):** O valor `1` é um curinga universal (Ás). Sua engine deve somar a ocorrência de dados de valor `1` com os de valor `Face Apostada`!
4. **Resolução:** Se `#FaceApostada + #Curingas >= Quantidade_Apostada` -> A POSTA DEU VERDADEIRA, QUEM DUVIDOU TOMA O TIRO. Senão, mentira!

---

## 5. Checklist

- [ ] Avaliador de tabela-verdade com precisão absoluta nas matrizes.
- [ ] Conectivos implementados sem vazar pilha.
- [ ] Avaliador de Dados faz varredura completa da matriz com contagem matemática exata, abraçando a regra de inclusão dos curingas `1`.
