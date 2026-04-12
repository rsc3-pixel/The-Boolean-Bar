#include "input_handler.h"
#include <stdio.h>
#include <string.h>

void clear_input_buffer() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

int get_safe_int(const char *prompt, int min, int max) {
    int value;
    int success;
    do {
        printf("%s", prompt);
        success = scanf("%d", &value);
        clear_input_buffer(); // Limpa o restante do buffer

        if (success != 1) {
            printf("\nOpção incorreta. Por favor, insira um número numérico válido.\n\n");
        } else if (value < min || value > max) {
            printf("\nOpção incorreta. Insira um número entre %d e %d.\n\n", min, max);
            success = 0; // Força nova leitura
        }
    } while (success != 1);

    return value;
}

void get_safe_string(const char *prompt, char *buffer, int max_len) {
    printf("%s", prompt);
    if (fgets(buffer, max_len, stdin) != NULL) {
        // Remover trailing newline se existir
        size_t len = strlen(buffer);
        if (len > 0 && buffer[len-1] == '\n') {
            buffer[len-1] = '\0';
        } else {
            // Se o texto inserido excedeu o buffer, precisa limpar stdin
            clear_input_buffer();
        }
    }
}
