/*
 * dice_engine.c
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de avaliação de apostas para o jogo Liar's Dice (Perudo / Blefe).
 *
 * Regras implementadas:
 *   • Cada jogador possui N dados, cada um com face entre 1 e 6.
 *   • O valor 1 é um CURINGA UNIVERSAL: conta para qualquer face apostada,
 *     exceto quando a própria aposta for na face 1.
 *   • Contagem final = (dados == face_apostada) + (dados == 1, se face != 1)
 *   • A aposta é VERDADEIRA se  Total >= Quantidade_Apostada.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include "dice_engine.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ═══════════════════════════ API pública ════════════════════════════════ */

/**
 * @brief Aloca e inicializa um Jogador com cópia interna do vetor de dados.
 *
 * @param nome      Nome do jogador (copiado internamente, máx. 31 chars).
 * @param dados     Vetor com os valores das faces dos dados.
 * @param num_dados Quantidade de dados no vetor.
 * @return Ponteiro para o Jogador alocado, ou NULL em caso de falha.
 *         O chamador deve liberar com liberar_jogador().
 */
Jogador *criar_jogador(const char *nome, const int *dados, int num_dados)
{
    if (!nome || !dados || num_dados <= 0) return NULL;

    Jogador *j = (Jogador *)malloc(sizeof(Jogador));
    if (!j) return NULL;

    strncpy(j->nome, nome, sizeof(j->nome) - 1);
    j->nome[sizeof(j->nome) - 1] = '\0';

    j->num_dados = num_dados;
    j->dados     = (int *)malloc((size_t)num_dados * sizeof(int));
    if (!j->dados) {
        free(j);
        return NULL;
    }

    memcpy(j->dados, dados, (size_t)num_dados * sizeof(int));
    return j;
}

/**
 * @brief Libera toda a memória associada a um Jogador.
 *
 * @param j Ponteiro para o Jogador a ser liberado. NULL é tratado com segurança.
 */
void liberar_jogador(Jogador *j)
{
    if (!j) return;
    free(j->dados);
    free(j);
}

/**
 * @brief Avalia se uma aposta é verdadeira contando os dados de todos os jogadores.
 *
 * Aplica a regra do curinga: o valor 1 conta para qualquer face apostada,
 * exceto quando a aposta é na própria face 1 (evita dupla contagem).
 * A aposta é VERDADEIRA se total_contado >= aposta->quantidade.
 *
 * @param aposta        Ponteiro para a aposta a ser avaliada.
 * @param jogadores     Array de ponteiros para os jogadores participantes.
 * @param num_jogadores Número de jogadores no array.
 * @return ResultadoAvaliacao com contagens detalhadas e o veredicto final.
 */
ResultadoAvaliacao avaliar_aposta(const Aposta        *aposta,
                                  Jogador * const     *jogadores,
                                  int                  num_jogadores)
{
    ResultadoAvaliacao res = {0, 0, 0, false};

    if (!aposta || !jogadores || num_jogadores <= 0) return res;

    for (int p = 0; p < num_jogadores; p++) {
        if (!jogadores[p]) continue;

        for (int d = 0; d < jogadores[p]->num_dados; d++) {
            int face = jogadores[p]->dados[d];

            if (face == aposta->face) {
                /* Dado exatamente igual à face apostada */
                res.contagem_face++;
            } else if (face == 1 && aposta->face != 1) {
                /* Curinga: vale para qualquer face, exceto quando a aposta
                 * é na própria face 1 (evita dupla contagem). */
                res.contagem_curinga++;
            }
        }
    }

    res.total_contado    = res.contagem_face + res.contagem_curinga;
    res.aposta_verdadeira = (res.total_contado >= aposta->quantidade);
    return res;
}

/**
 * @brief Exibe no stdout um resumo detalhado da avaliação da aposta.
 *
 * @param res    Ponteiro para o resultado da avaliação.
 * @param aposta Ponteiro para a aposta que foi avaliada.
 */
void imprimir_resultado(const ResultadoAvaliacao *res, const Aposta *aposta)
{
    if (!res || !aposta) return;

    printf("\n╔══ Avaliação da Aposta ══╗\n");
    printf("  Aposta      : %d dado(s) com face %d\n",
           aposta->quantidade, aposta->face);
    printf("  Face exata  : %d dado(s)\n", res->contagem_face);

    if (aposta->face != 1)
        printf("  Curingas (1): %d dado(s)\n", res->contagem_curinga);
    else
        printf("  Curingas (1): N/A  (aposta na própria face 1)\n");

    printf("  ─────────────────────────\n");
    printf("  Total contado : %d\n", res->total_contado);
    printf("  Resultado     : %s\n\n",
           res->aposta_verdadeira
               ? "✔ VERDADE  (quem duvidou PERDE)"
               : "✘ MENTIRA  (quem apostou PERDE)");
}
