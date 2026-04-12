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

#include <stdlib.h> // Para system

// Implementação da função ui_clear_screen
void ui_clear_screen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

// Implementação da nova função de render da Mesa
void ui_render_mesa(Mesa *table) {
    if(!table) return;

    ui_print_colored("\n[STATUS DA MESA] ", ANSI_COLOR_CYAN);
    printf("Jogadores Vivos: %d | Falhas Acumuladas: %d/6\n", table->num_players_alive, table->balas_no_tambor-1);
    
    for (int i = 0; i < MAX_PLAYERS; i++) {
        Jogador *p = table->players[i];
        if (p == NULL) continue;

        if (p->estaVivo) {
            printf("  -> [%s] (Vidas: %d) Mão: %d cartas\n", p->name, p->score, p->num_cards);
        } else {
            ui_print_colored("  -> [", ANSI_COLOR_RED);
            ui_print_colored(p->name, ANSI_COLOR_RED);
            ui_print_colored("] (ELIMINADO)\n", ANSI_COLOR_RED);
        }
    }
    printf("\n");
}