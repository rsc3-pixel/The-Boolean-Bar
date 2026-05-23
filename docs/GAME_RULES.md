# Regras do Jogo (The Boolean Bar)

Este documento detalha as regras do jogo "The Boolean Bar".

## 1. Objetivo do Jogo

O objetivo principal é ser o último jogador a permanecer "vivo" na mesa. Os jogadores devem blefar sobre a classificação das fórmulas lógicas para evitar a Roleta Russa.

## 2. Número de Jogadores

O jogo é projetado para 7 jogadores.

## 3. Configuração Inicial

-   **Mesa:** É inicializada com 7 jogadores.
-   **Jogadores:** Cada jogador começa com um nome, um ID e um número de "vidas" (pontuação). Por padrão, cada jogador começa com 3 vidas.
-   **Baralho:** O "baralho" é composto por fórmulas de lógica proposicional geradas aleatoriamente.

## 4. Fluxo de Turno

O jogo procede em turnos, seguindo a ordem dos jogadores na mesa.

1.  **Carta Jogada:** Uma nova fórmula lógica é "jogada" na mesa (gerada aleatoriamente).
2.  **Afirmação do Jogador:** O jogador da vez deve fazer uma afirmação sobre a classificação da fórmula jogada:
    -   "Isso é uma Tautologia!"
    -   "Isso é uma Contradição!"
    -   "Isso é uma Contingência!"
3.  **Dúvida dos Oponentes:** Após a afirmação, os outros jogadores têm a oportunidade de "duvidar" da afirmação.
    -   Se ninguém duvidar, a afirmação é aceita e o jogo prossegue para o próximo turno.
    -   Se um ou mais jogadores duvidarem, a veracidade da afirmação é verificada.
4.  **Verificação da Afirmação:**
    -   A fórmula é avaliada pelo "Juiz" (logic_engine) para determinar sua verdadeira classificação.
    -   **Se a afirmação do jogador estava CORRETA:** Os oponentes que duvidaram perdem 1 vida.
    -   **Se a afirmação do jogador estava INCORRETA (blefe):** O jogador que fez a afirmação incorreta é submetido à Roleta Russa.

### Tabela de Confronto

| Ação do Jogador | Reação do Oponente | Resultado da Verificação | Consequência |
| :--- | :--- | :--- | :--- |
| Afirma Classificação | Aceita (Silêncio) | Não verificado | Próximo turno (sem punição) |
| Afirma Classificação | **Duvida** | **Fórmula == Afirmação** | Oponente perde 1 vida |
| Afirma Classificação | **Duvida** | **Fórmula != Afirmação** | Jogador vai para Roleta Russa |

## 5. Roleta Russa

Quando um jogador é submetido à Roleta Russa:

-   Uma "bala" é sorteada em um tambor de 6 câmaras.
-   A probabilidade de disparo é de 1 em 6.
-   **Se a arma disparar:** O jogador perde 1 vida.
-   **Se a arma não disparar:** O jogador não perde vidas neste turno.

## 6. Condições de Eliminação

Um jogador é eliminado do jogo se suas vidas chegarem a 0.

## 7. Condições de Vitória

O jogo termina quando apenas um jogador permanece "vivo" na mesa. Este jogador é declarado o vencedor.
