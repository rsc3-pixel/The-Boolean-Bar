# 📋 Guia Completo — Gabriel Brito
## Scrum Master & Product Owner: Gestão de Squad e Backlog

> **Papel:** Scrum Master + PO — Cerimônias, Backlog, Priorização e Mediação de Escopo
> **Arquivos:** `docs/SCRUM_MASTER_GABRIEL.md`, workspace no Flux (cycles, issues, labels)

---

## 📋 Índice

1. [Visão Geral](#1-visao-geral)
2. [Sprint 1 — Estruturação do Projeto e Workspace](#2-sprint-1)
3. [Sprint 2 — Cerimônias em Ritmo e Desbloqueio de Dependências](#3-sprint-2)
4. [Sprint 3 (Expansão) — Mediação do Escopo do "Liar's Dice"](#4-sprint-3)
5. [Sprint 4 — Fechamento, Revisão Final e Defesa](#5-sprint-4)
6. [Checklist](#6-checklist)

---

## 1. Visão Geral

Você é o dono do bar. Sem você na porta, a taverna não abre na hora certa, ninguém sabe quem senta em qual mesa, e o caixa fecha torto no fim da noite. Como **Scrum Master + Product Owner**, seu papel não é codar — é fazer a squad inteira correr no mesmo compasso.

A stack do time é híbrida (C11 + Node + React) e cada dev domina uma camada. **Você domina o processo:** quem entrega o quê, quando, em qual ordem, e o que entra ou sai do escopo quando o vento muda. Acumulou o PO porque já trabalhou com gestão de produto na empresa onde atua — ninguém mais na squad tinha bagagem para refinar backlog, priorizar issues e escrever critério de aceite.

---

## 2. Sprint 1 — Estruturação do Projeto e Workspace

Seu primeiro passo é **deixar a casa em ordem antes da squad sentar para programar**. Sem estrutura, todo mundo entrega na mesma hora e nada conversa.

**O que você domina:**
- Workspace no **Flux** (a plataforma que adotamos a partir de teste com a ferramenta de um amigo desenvolvedor): cycles, labels por camada, estados (`Backlog → Todo → In Progress → In Review → Done`).
- Definition of Done (DoD) negociada com a squad: compilação `-Wall -Wextra -Wpedantic` sem warnings, PR revisado, Valgrind clean em `core/`, smoke-test passando para WebSocket.

**Fluxo Esperado:**
1. Criar o projeto no Flux com 4 cycles de 2 semanas cada.
2. Conduzir a primeira **Sprint Planning** com a squad, fechando o escopo da Sprint 1.
3. Refinar as tasks técnicas junto com o **Tech Lead (Renato)** antes de fechar o backlog — calibrar estimativas onde a complexidade não é óbvia.
4. Estabelecer ritmo de daily 3×/semana assíncrona no Discord.

---

## 3. Sprint 2 — Cerimônias em Ritmo e Desbloqueio de Dependências

A taverna agora abre todo dia — sua função é **manter a porta funcionando sem rangido**. Cerimônia precisa virar hábito, e bloqueio entre devs precisa ser resolvido em horas, não em dias.

**O que implementar:**
- **Sprint Planning** no início e **Sprint Review** no fim da sprint, conduzidas por você.
- Daily assíncrona com formato fixo: *o que fiz / o que vou fazer / o que tá me bloqueando*.
- Tratamento de bloqueio em três níveis: marcar `Blocked` no Flux em <2h, chamar o owner da dependência em <24h, abrir reescopo em <48h.
- Mediação da primeira dependência crítica: o frontend do **Luís** depende do servidor WebSocket do **Renato** estar de pé. Coordene o handoff.

---

## 4. Sprint 3 (Expansão) — Mediação do Escopo do "Liar's Dice"

Aqui o jogo muda — literalmente. A proposta de adicionar o **Modo Tradicional (Liar's Dice)** entra no meio do projeto, e como PO você é quem decide se entra, sai, ou entra com corte de outra coisa.

**Sua missão na mediação:**
1. **Avaliar impacto:** ~25 pontos de trabalho extras cruzando 5 owners (Cauã, Fernando, João Pedro, Matheus, Luís).
2. **Discutir viabilidade técnica com o Tech Lead:** sentar com o Renato e validar se a integração C ↔ Node aguenta o novo payload `{"game_mode": "logical" | "dice"}` sem reescrever metade do servidor.
3. **Negociar trade-off:** cortar duas features de polimento da Sprint 4 (sistema de save/load e animações ANSI extras) para abrir espaço.
4. **Comunicar a decisão** em planning emergencial e registrar no canal `#decisions` do Discord para rastreabilidade.

> Como PO, esse tipo de decisão é diretamente seu papel: escutar a oportunidade, medir o impacto, negociar o que sai, e proteger o time da síndrome de "tudo cabe na sprint".

---

## 5. Sprint 4 — Fechamento, Revisão Final e Defesa

A taverna está fechando a noite. Sua função é **garantir que ninguém saia devendo** — toda issue tem que estar `Done` antes da defesa, ou ter sido oficialmente cortada com justificativa.

**Sua missão de fechamento:**
- Conduzir a **Planning final** com a squad para fechar as últimas tasks do Liar's Dice e o polimento.
- Conduzir a **Sprint Review** validando que cada owner entregou: dados rolando (Fernando), avaliador aritmético com coringa (João Pedro), monotonicidade da aposta (Matheus), struct expandida com `int dados[5]` (Cauã), toggle no Lobby + copo de dados (Luís), pipe do `game_mode` (Renato).
- Revisar o backlog inteiro no Flux: zero issue em `In Progress` ou `In Review` antes da defesa.
- Fechar o documento `SCRUM_MASTER_GABRIEL.md` cobrindo decisões metodológicas, escolha do Flux, cerimônias adotadas, lições aprendidas.

---

## 6. Checklist

- [ ] Workspace Flux configurado com 4 cycles de 2 semanas e labels por camada.
- [ ] Definition of Done escrita e acordada com a squad.
- [ ] Sprint Planning conduzida no início de cada cycle.
- [ ] Sprint Review conduzida no fim de cada cycle.
- [ ] Daily 3×/semana assíncrona acontecendo no Discord com formato fixo.
- [ ] Refinamento de tasks técnicas feito com o Tech Lead antes de cada planning.
- [ ] Nenhum bloqueio passou de 48h durante as 8 semanas.
- [ ] Reescopo do Liar's Dice mediado entre Sprints 2 e 3, com trade-off documentado.
- [ ] Backlog 100% limpo (sem issue pendente) antes da defesa.
- [ ] `docs/SCRUM_MASTER_GABRIEL.md` finalizado e versionado no GitHub.
