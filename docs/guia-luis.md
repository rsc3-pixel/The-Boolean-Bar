# 🎨 Guia Completo — Luís Nunes
## ASCII Designer: UI/UX (Frontend e C CLI)

> **Papel:** Designer UI — Interface, Terminal ANSI, Interface Gráfica React  
> **Arquivos:** `ui/terminal_art.c`, `ui/terminal_art.h`, `figma_export/src/`

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Cores ANSI e Tabelas](#2-sprint-1)
3. [Sprint 2 — Arte de Morte (Roleta Russa)](#3-sprint-2)
4. [Sprint 3 — O Frontend Moderno do Básico](#4-sprint-3)
5. [Sprint 4 (Expansão) — Toggle Mode e os 5 Dados Reais (Figma Web)](#5-sprint-4-expansao)
6. [Checklist](#6-checklist)

---

## 1. Visão Geral

Você é o rosto da taverna sombria do Boolean Bar. A UI, seja baseada fortemente em ASCII pelo Terminal ANSI, ou nas requisições ricas feitas em View React do Vite (no diretório final figma_export), é com você!

---

## 2. Sprint 1 & 2 — O Terminal Cru (Cores ANSI / ASCII)

Em `ui_render_mesa()` traga vida sombria com escapes \x1b de terminal em caso de game over na Roleta!

---

## 3. Sprint 3 — O Frontend Web (Integração Vue/React)

Consumir Websockets e renderizar os componentes estilizados modernos via Tailwind ou Vanilla.

---

## 4. Sprint 4 (Expansão) — Toggle Mode e os 5 Dados Reais

No modo recém aprovado, a visualização muda completamente as peças em cima da mesa. O React deixará de engolir Cartas Booleadas complexas para engolir **DADOS**.

**Seu dever como Front Designer Web:**
1. **O Botão Toggle (Início Padrão):** Coloque um switch claro que decida a partida inicial (Aba Home/Lobby).
2. **Copos de Dados:** Ao invés da cartinha, exiba no HUD 5 slots com pequenos dados aleatórios para VOCÊ MESMO (O React Client de fato só mostra as faces do dono).
3. **Mesa Apostadora Oculta:** Mostre oponentes ao invés de dados, ponha o "Quantidade Restante de Dados no Copo dele" sombreada (Ex: Márcio [4/5 Dados]). Desse jeito mantemos o blefe que o Liar's prevê.

---

## 5. Checklist

- [x] Biblioteca visual crua ANSI montada no `terminal_art.h`.
- [x] No FrontEnd React, a Home apresenta o Toggle Visível que despacha o JSON no modo certo.
- [x] O renderizador dos 5 dados (O próprio array de 1 a 6) funciona exibindo iconografia de matriz correspondente.
- [x] Interface de Aposta (Modal) e Ações (Duvidar/Acreditar) integradas.
- [x] Acessibilidade (aria-labels) e Refatoração de Animações concluídas.
