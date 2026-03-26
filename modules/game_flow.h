#ifndef GAME_FLOW_H
#define GAME_FLOW_H

#include "../core/types.h" // Para Mesa e Jogador

/**
 * @brief Inicializa o ambiente de jogo e inicia o loop principal.
 *
 * Esta função é o ponto de entrada para a lógica do jogo. Ela deve
 * configurar a mesa, os jogadores e gerenciar os turnos até o fim do jogo.
 *
 * @return 0 se o jogo terminou com sucesso, ou um código de erro.
 */
int game_start();

#endif // GAME_FLOW_H