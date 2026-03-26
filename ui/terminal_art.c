#include "terminal_art.h"
#include <stdio.h>
#include <string.h> // Para strlen

// Implementação da função ui_print_colored
void ui_print_colored(const char *text, const char *color_code) {
    printf("%s%s%s", color_code, text, ANSI_COLOR_RESET);
}

// Implementação da função ui_draw_header
void ui_draw_header(const char *title) {
    int title_len = strlen(title);
    int line_len = 80; // Largura padrão do cabeçalho
    int padding = (line_len - title_len - 2) / 2; // -2 para os espaços antes e depois do título

    printf("\n");
    ui_print_colored("================================================================================\n", ANSI_COLOR_YELLOW);
    ui_print_colored("||", ANSI_COLOR_YELLOW);
    for (int i = 0; i < padding; i++) printf(" ");
    ui_print_colored(title, ANSI_STYLE_BOLD ANSI_COLOR_CYAN);
    for (int i = 0; i < padding; i++) printf(" ");
    if ((line_len - title_len - 2) % 2 != 0) printf(" "); // Ajuste para títulos de tamanho ímpar
    ui_print_colored("||", ANSI_COLOR_YELLOW);
    printf("\n");
    ui_print_colored("================================================================================\n", ANSI_COLOR_YELLOW);
    printf("\n");
}

// Implementação da função ui_clear_screen
void ui_clear_screen() {
    // Sequência ANSI para limpar a tela e mover o cursor para o canto superior esquerdo
    printf("\x1b[2J\x1b[H");
    fflush(stdout); // Garante que a saída seja enviada imediatamente
}