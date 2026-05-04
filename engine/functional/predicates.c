#include "predicates.h"
#include <stddef.h>

bool is_alive(const Jogador *p) {
    if (p == NULL) return false;
    return p->estaVivo && p->status == ALIVE;
}

int get_next_valid_player_index(const Mesa *mesa, int current_index, bool (*predicate)(const Jogador *)) {
    if (mesa == NULL || predicate == NULL) return -1;
    
    // Verifica circulamente até MAX_PLAYERS
    for (int i = 1; i <= MAX_PLAYERS; i++) {
        int check_idx = (current_index + i) % MAX_PLAYERS;
        if (mesa->players[check_idx] != NULL && predicate(mesa->players[check_idx])) {
            return check_idx;
        }
    }
    
    return -1; // Caso de fallback extremo (por ex: todo mundo morreu)
}
