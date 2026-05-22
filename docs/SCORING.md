# 🎲 Tabela de Pontuação — Sprint Ranking & Pontuação

> Item **3.1** do [SPRINT_RANKING.md](SPRINT_RANKING.md). É uma **proposta** do PM pra
> o squad ratificar — os números são chute inicial calibrável, ajustar após playtest.
> **Bloqueia 3.2** (engine dados) **e 3.3** (engine lógica).

## Princípio

O engine **só acumula** pontos durante a partida e **despeja tudo no `JSON_VICTORY`**
(item 3.4). Não emite pontos por turno. Toda aritmética é inteira — sem `float` no C.

---

## 1. Pontos por ação (durante a partida)

### Modo Lógica (Boolean Bar)

| Evento | Pontos |
|---|---|
| Pegar um blefe — você duvidou e o oponente tinha mentido | **+15** |
| Defender sua jogada — você foi honesto e o oponente duvidou injustamente | **+15** |
| Sobreviver a um giro de roleta russa | **+10** |
| Continuar vivo ao fim de uma rodada | **+2** |
| ❌ Blefe desmascarado — mentiu e foi pego | **−20** |
| ❌ Dúvida injusta — duvidou de quem falou a verdade | **−20** |

### Modo Dados (Liar's Dice)

| Evento | Pontos |
|---|---|
| Pegar uma mentira — você duvidou e a aposta era falsa | **+15** |
| Aposta coberta — duvidaram de você e sua aposta era válida | **+15** |
| Continuar com dados no copo ao fim de uma rodada | **+2** |
| ❌ Perder um dado (qualquer motivo) | **−20** |

> Em ambos os modos, **cada confronto (dúvida) gera exatamente um +15** (quem venceu)
> **e um −20** (quem perdeu). A simetria deixa 3.2 e 3.3 com a mesma estrutura.

---

## 2. Bônus de fim de partida (só pro vencedor)

| Bônus | Valor | Quando |
|---|---|---|
| Base de vitória | **+50** | sempre, pro vencedor |
| Vitória limpa | **+40** | venceu sem perder nenhuma vida (Lógica) / nenhum dado (Dados) |
| Vitória rápida | **multiplicador** ↓ | conforme nº de rodadas |

**Multiplicador de velocidade** — aplicado sobre o total final do vencedor:

| Rodadas até a vitória | Multiplicador |
|---|---|
| ≤ 6 | **×2** |
| 7 – 12 | **×1,5** (`×3/2` em inteiro) |
| 13 ou mais | **×1** |

---

## 3. Fórmula final

```
# Não-vencedores:
pontos_finais = max(0, pontos_acumulados)

# Vencedor:
subtotal      = pontos_acumulados + 50 + (40 se vitória limpa)
pontos_finais = subtotal × multiplicador_de_velocidade
```

---

## 4. Decisões em aberto (squad bate o martelo)

1. **O multiplicador aplica no total do vencedor ou só no bônus de vitória?**
   → proposta: no total.
2. **Pontuação pode ficar negativa?** → proposta: piso em 0.
3. **O que conta como "1 rodada" no modo Lógica?** No Dados a rodada é clara (cada
   ciclo até uma dúvida). No Lógica proponho: 1 rodada = 1 volta completa na mesa
   (todos jogaram 1 turno). 3.3 confirma na implementação.
4. Todos os números são calibráveis — rodar 2–3 playtests antes de travar.

---

## 5. Notas de implementação (pra 3.2 / 3.3)

- ⚠️ O campo `score` do `Jogador` ([types.h:62](../engine/core/types.h#L62)) **é a vida
  no modo Lógica** (a roleta russa decrementa ele). **Não reusar pra pontuação.**
  Adicionar campo novo `int points;` no struct `Jogador` + `int rounds;` na `Mesa`.
- ⚠️ Mexer em `types.h` exige **`make clean`** antes de rebuildar — pegadinha conhecida
  (struct stale em runtime = segfault).
- O engine acumula em silêncio; o breakdown completo (pontos, rodadas e bônus por
  jogador) sai só no `JSON_VICTORY` estendido (item 3.4).
