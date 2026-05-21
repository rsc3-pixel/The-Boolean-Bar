#ifndef LOGIC_ENGINE_H
#define LOGIC_ENGINE_H

#include <stdbool.h>

/**
 * @brief Classifica o resultado lógico de uma proposição.
 *
 * - TAUTOLOGIA  : verdadeira em todas as linhas da tabela verdade.
 * - CONTRADICAO : falsa em todas as linhas da tabela verdade.
 * - CONTINGENCIA: pode ser verdadeira ou falsa dependendo dos valores.
 */
typedef enum {
    TAUTOLOGIA,
    CONTRADICAO,
    CONTINGENCIA
} Classificacao;

/**
 * @brief Tabela verdade completa de uma expressão lógica.
 *
 * Gerada por gerar_tabela_verdade() e liberada com liberar_tabela().
 */
typedef struct {
    int     num_vars;            /**< Número de variáveis únicas na expressão. */
    char    vars[26];            /**< Identificadores das variáveis (ex: 'p', 'q'). */
    int     num_linhas;          /**< Total de linhas da tabela: 2^num_vars. */
    bool  **combinacoes;         /**< Matriz [num_linhas][num_vars] com as combinações. */
    bool   *resultados;          /**< Vetor de resultados booleanos, um por linha. */
    Classificacao classificacao; /**< Classificação final da expressão. */
} TabelaVerdade;

/**
 * @brief Extrai as variáveis únicas presentes em uma expressão lógica.
 *
 * Varre @p expr e preenche @p vars_out com as variáveis únicas em ordem
 * de primeira aparição, normalizadas para minúsculas.
 *
 * @param expr     String da expressão lógica (ex: "p & ~q").
 * @param vars_out Buffer de saída com capacidade para ao menos 26 chars.
 * @return Número de variáveis únicas encontradas (0–26).
 */
int extrair_variaveis(const char *expr, char *vars_out);

/**
 * @brief Gera a tabela verdade completa de uma expressão lógica.
 *
 * Suporta os conectivos: ~ (negação), & (conjunção), | (disjunção),
 * -> (implicação) e <-> (bicondicional). Usa o algoritmo Shunting-Yard
 * para converter a expressão infixa em RPN antes de avaliar cada linha.
 *
 * @param expr String da expressão proposicional.
 * @return Ponteiro para TabelaVerdade alocada, ou NULL em caso de erro.
 *         O chamador é responsável por liberar com liberar_tabela().
 */
TabelaVerdade *gerar_tabela_verdade(const char *expr);

/**
 * @brief Imprime a tabela verdade formatada no stdout.
 *
 * @param tv   Ponteiro para a tabela a ser impressa.
 * @param expr String original da expressão (usada no cabeçalho).
 */
void imprimir_tabela(const TabelaVerdade *tv, const char *expr);

/**
 * @brief Libera todos os recursos alocados por uma TabelaVerdade.
 *
 * @param tv Ponteiro para a tabela a ser liberada. NULL é tratado com segurança.
 */
void liberar_tabela(TabelaVerdade *tv);

/**
 * @brief Converte um valor de Classificacao para string legível.
 *
 * @param c Classificação a converter.
 * @return String estática: "TAUTOLOGIA", "CONTRADIÇÃO" ou "CONTINGÊNCIA".
 */
const char *classificacao_str(Classificacao c);

#endif /* LOGIC_ENGINE_H */
