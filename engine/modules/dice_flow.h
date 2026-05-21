#ifndef DICE_FLOW_H
#define DICE_FLOW_H

#include "../core/types.h"

/**
 * @brief Inicializa a mesa para o modo Liar's Dice e inicia o loop interativo.
 *
 * Lê o número de jogadores e seus nomes via stdin, distribui os dados iniciais,
 * gerencia rodadas (apostas e confrontos) e emite eventos JSON para o frontend
 * via stdout até restar apenas um jogador.
 *
 * @return 0 se o jogo terminou com sucesso, ou 1 em caso de erro de alocação.
 */
int dice_game_start(void);

#endif // DICE_FLOW_H
