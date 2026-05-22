# 🎲 Tabela de Pontuação — Modo Dados (Liar's Dice)

> Item **3.1** do cronograma. Documento focado exclusivamente na mecânica de **Dados**, conforme decisão do squad.
> **Bloqueia 3.2** (implementação na engine de dados).

## Princípio

O engine **só acumula** pontos durante a partida e **despeja o resultado final no `JSON_VICTORY`** ao fim do jogo. 
A pontuação é baseada em performance individual e eficiência.
A pontuação de qualquer jogador **nunca será inferior a 0**.

---

## 1. Pontos por ação (durante a partida)

| Evento | Pontos | Descrição |
|---|---|---|
| **Pegar uma mentira** | **+20** | Você duvidou e a aposta do oponente era falsa. |
| **Aposta coberta** | **+20** | Duvidaram de você e sua aposta era válida (existiam os dados). |
| **Sobrevivência** | **+2** | Continuar com ao menos um dado no copo ao fim de uma rodada de dúvida. |
| ❌ **Perder um dado** | **−20** | Penalidade por aposta errada ou dúvida injusta. |

---

## 2. Bônus de fim de partida (só pro vencedor)

| Bônus | Valor Base | Quando |
|---|---|---|
| **Vitória Real** | **+50** | Concedido ao último jogador restante na mesa. |
| **Vitória Limpa** | **+40** | Venceu a partida sem perder nenhum dos seus dados iniciais. |

### Bônus de Eficiência (Multiplicador de Velocidade)
O multiplicador incide **apenas sobre os +50 pontos da Vitória Real**, recompensando quem finaliza a mesa rapidamente sem diluir o mérito das ações acumuladas.

| Rodadas até a vitória | Multiplicador (sobre os +50 base) | Bônus Final de Vitória |
|---|---|---|
| ≤ 6 (Blitz) | **×2** | **100 pts** |
| 7 – 12 (Padrão) | **×1,5** (arred. p/ baixo) | **75 pts** |
| 13 ou mais (Resistência) | **×1** | **50 pts** |

---

## 3. Cálculo Final

```
# Para TODOS os jogadores:
pontos_base = pontos_acumulados durante a partida
se (pontos_base < 0) pontos_base = 0

# Apenas para o Vencedor:
bonus_vitoria = (50 × multiplicador_velocidade)
bonus_limpo = (40 se vitória limpa, senão 0)

total_vencedor = pontos_base + bonus_vitoria + bonus_limpo
```

---

## 4. Definições Técnicas

1. **Rodada:** Um ciclo completo que se inicia com a primeira aposta e termina com um "Doubt" (Duvido) ou "Exact" (Exato).
2. **Piso Zero:** Se uma penalidade (-20) levar os pontos abaixo de zero no meio da partida, o valor é ajustado para 0 imediatamente para evitar saldos negativos.
3. **Persistência:** Os pontos devem ser acumulados em uma nova variável `int points` na estrutura do jogador para não interferir em lógicas existentes.

---

## 5. Notas de implementação (Task 3.2 e 3.4)

- ⚠️ **Engine:** Criar `int points;` na struct `Jogador` e `int total_rounds;` na struct `Mesa` em `types.h`.
- ⚠️ **Sincronização:** O acúmulo deve ocorrer no arquivo `engine/modules/dice_flow.c`.
- ⚠️ **Rebuild:** É obrigatório realizar a limpeza da build (`make clean` ou manual) ao alterar as structs no `types.h` para evitar segfaults.
