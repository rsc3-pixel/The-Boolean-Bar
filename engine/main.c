#include <stdio.h>
#include <stdlib.h>
#include "modules/game_flow.h"
#include "modules/dice_flow.h"

int main(int argc, char *argv[]) {
    // Quando stdout é pipe (não TTY), C usa block-buffering por padrão.
    // Força line-buffered pra garantir que cada printf sai imediato — necessário
    // pra IPC com o web_server.js (Node lê linha por linha) e pra debug em prod.
    setvbuf(stdout, NULL, _IOLBF, 0);
    setvbuf(stderr, NULL, _IOLBF, 0);

    int mode = 0;
    int error = 0;

    if (argc > 1) {
        // Se chamado via script Node com argumento: ex: ./boolean_bar.exe 1
        mode = atoi(argv[1]);
    } else {
        char mode_buf[16];
        printf("Escolha o Modo do Jogo:\n0 = The Boolean Bar (Logica)\n1 = Liar's Dice (Dados)\n>>> ");
        fflush(stdout);
        if (!fgets(mode_buf, sizeof(mode_buf), stdin)) return 1;
        mode = atoi(mode_buf);
    }

    if (mode == 1) {
        error = dice_game_start();
    } else {
        error = game_start();
    }

    if (error) {
        fprintf(stderr, "Erro na execucao do jogo.\n");
        return 1;
    }
    return 0;
}
