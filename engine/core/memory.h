#ifndef MEMORY_H
#define MEMORY_H

#include "types.h" // Inclui as definições das estruturas

// Funções de alocação (criação)

/**
 * @brief Aloca e inicializa uma nova estrutura Carta.
 * @param formula_str A string da fórmula lógica. Será copiada.
 * @param type O tipo da fórmula (TAUTOLOGY, CONTRADICTION, CONTINGENCY).
 * @return Um ponteiro para a nova Carta alocada, ou NULL em caso de falha.
 */
Carta* mem_new_carta(const char *formula_str, FormulaType type);

/**
 * @brief Aloca e inicializa uma nova estrutura Jogador.
 * @param id O ID único do jogador.
 * @param name O nome do jogador. Será copiado.
 * @return Um ponteiro para o novo Jogador alocado, ou NULL em caso de falha.
 */
Jogador* mem_new_jogador(int id, const char *name);

// Funções de alocação (criação) para Mesa

/**
 * @brief Aloca e inicializa uma nova estrutura Mesa.
 * @return Um ponteiro para a nova Mesa alocada, ou NULL em caso de falha.
 */
Mesa* mem_new_mesa();

// Funções de desalocação (liberação)

/**
 * @brief Libera a memória alocada para uma Carta.
 * @param card O ponteiro para a Carta a ser liberada.
 */
void mem_free_carta(Carta *card);

/**
 * @brief Libera a memória alocada para um Jogador.
 * @param player O ponteiro para o Jogador a ser liberado.
 */
void mem_free_jogador(Jogador *player);

/**
 * @brief Libera a memória alocada para uma Mesa e seus componentes.
 * @param table O ponteiro para a Mesa a ser liberada.
 */
void mem_free_mesa(Mesa *table);

#endif // MEMORY_H