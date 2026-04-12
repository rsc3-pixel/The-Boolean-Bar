#include "modules/game_flow.h"
#include <stdio.h>

int main(void) {
    int error = game_start();
    if (error) {
        fprintf(stderr, "Erro na execução do jogo.\n");
        return 1;
    }
    return 0;
}
