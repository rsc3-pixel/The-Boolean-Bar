#include <stdio.h>
#include <stdlib.h>
#include "modules/game_flow.h"

int main(void) {
    // Quando stdout é pipe (não TTY), C usa block-buffering por padrão.
    // Força line-buffered pra garantir que cada printf sai imediato — necessário
    // pra IPC com o web_server.js (Node lê linha por linha) e pra debug em prod.
    setvbuf(stdout, NULL, _IOLBF, 0);
    setvbuf(stderr, NULL, _IOLBF, 0);

    int error = game_start();
    if (error) {
        fprintf(stderr, "Erro na execução do jogo.\n");
        return 1;
    }
    return 0;
}
