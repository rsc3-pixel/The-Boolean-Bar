#ifndef DICE_ENGINE_H
#define DICE_ENGINE_H

#include <stdbool.h>

/**
 * @brief Representa um jogador no modo Liar's Dice.
 */
typedef struct {
    char nome[32]; /**< Nome do jogador (máx. 31 chars + terminador). */
    int *dados;    /**< Vetor com os valores das faces dos dados (1–6). */
    int  num_dados; /**< Quantidade de dados que o jogador possui. */
} Jogador;

/**
 * @brief Representa uma aposta feita durante uma rodada.
 */
typedef struct {
    int quantidade; /**< Quantidade apostada de dados com a face informada. */
    int face;       /**< Face apostada (1–6). O valor 1 é curinga universal. */
} Aposta;

/**
 * @brief Resultado detalhado da avaliação de uma aposta.
 */
typedef struct {
    int  total_contado;      /**< Total de dados válidos: face exata + curingas. */
    int  contagem_face;      /**< Dados cujo valor é exatamente a face apostada. */
    int  contagem_curinga;   /**< Dados com valor 1 que contam como curinga. */
    bool aposta_verdadeira;  /**< true = aposta válida (total >= quantidade); false = mentira. */
} ResultadoAvaliacao;

/**
 * @brief Aloca e inicializa um Jogador com cópia interna do vetor de dados.
 *
 * @param nome      Nome do jogador (copiado internamente).
 * @param dados     Vetor com os valores das faces dos dados.
 * @param num_dados Quantidade de dados no vetor.
 * @return Ponteiro para o Jogador alocado, ou NULL em caso de falha.
 *         O chamador deve liberar com liberar_jogador().
 */
Jogador *criar_jogador(const char *nome, const int *dados, int num_dados);

/**
 * @brief Libera toda a memória associada a um Jogador.
 *
 * @param j Ponteiro para o Jogador a ser liberado. NULL é tratado com segurança.
 */
void liberar_jogador(Jogador *j);

/**
 * @brief Avalia se uma aposta é verdadeira contando dados de todos os jogadores.
 *
 * Aplica a regra do curinga: o valor 1 conta para qualquer face apostada,
 * exceto quando a própria aposta é na face 1 (evita dupla contagem).
 *
 * @param aposta        Ponteiro para a aposta a ser avaliada.
 * @param jogadores     Array de ponteiros para os jogadores participantes.
 * @param num_jogadores Número de jogadores no array.
 * @return ResultadoAvaliacao com contagens detalhadas e o veredicto final.
 */
ResultadoAvaliacao avaliar_aposta(const Aposta *aposta,
                                  Jogador * const *jogadores,
                                  int num_jogadores);

/**
 * @brief Exibe no stdout um resumo detalhado da avaliação da aposta.
 *
 * @param res   Ponteiro para o resultado da avaliação.
 * @param aposta Ponteiro para a aposta avaliada.
 */
void imprimir_resultado(const ResultadoAvaliacao *res, const Aposta *aposta);

#endif /* DICE_ENGINE_H */
