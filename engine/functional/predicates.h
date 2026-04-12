#ifndef PREDICATES_H
#define PREDICATES_H

#include "../core/types.h"

/**
 * @brief Predicado que verifica se o jogador sobreviveu.
 * @param p Jogador.
 * @return True se isAlive.
 */
bool is_alive(Jogador *p);

/**
 * @brief Função de alta ordem (High-Order Function) que retorna o índice do próximo jogador
 * válido de acordo com o predicado passado.
 * @param mesa Estado da Mesa.
 * @param current_index Índice atual no vetor.
 * @param predicate Função booleana para filtrar.
 * @return O índice do próximo jogador válido ou -1 se nenhum for encontrado.
 */
int get_next_valid_player_index(Mesa *mesa, int current_index, bool (*predicate)(Jogador *));

#endif // PREDICATES_H
