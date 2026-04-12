#ifndef TERMINAL_ART_H
#define TERMINAL_ART_H

#include "../core/types.h"

// --- Códigos ANSI para Cores e Estilos ---
// Resetar todas as formatações
#define ANSI_COLOR_RESET   "\x1b[0m"

// Cores de texto
#define ANSI_COLOR_BLACK   "\x1b[30m"
#define ANSI_COLOR_RED     "\x1b[31m"
#define ANSI_COLOR_GREEN   "\x1b[32m"
#define ANSI_COLOR_YELLOW  "\x1b[33m"
#define ANSI_COLOR_BLUE    "\x1b[34m"
#define ANSI_COLOR_MAGENTA "\x1b[35m"
#define ANSI_COLOR_CYAN    "\x1b[36m"
#define ANSI_COLOR_WHITE   "\x1b[37m"

// Estilos
#define ANSI_STYLE_BOLD    "\x1b[1m"
#define ANSI_STYLE_ITALIC  "\x1b[3m"
#define ANSI_STYLE_UNDERLINE "\x1b[4m"

/**
 * @brief Imprime uma string com uma cor ANSI específica.
 * @param text A string a ser impressa.
 * @param color_code O código ANSI da cor (ex: ANSI_COLOR_RED).
 */
void ui_print_colored(const char *text, const char *color_code);

/**
 * @brief Desenha um cabeçalho estilizado para o jogo.
 * @param title O título a ser exibido no cabeçalho.
 */
void ui_draw_header(const char *title);

/**
 * @brief Limpa a tela do terminal.
 */
void ui_clear_screen();

/**
 * @brief Desenha a mesa de jogo atual e os status de jogadores
 * @param table Estado da mesa.
 */
void ui_render_mesa(Mesa *table);

#endif // TERMINAL_ART_H