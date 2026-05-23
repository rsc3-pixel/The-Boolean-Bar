#ifndef TERMINAL_ART_H
#define TERMINAL_ART_H

#include "../core/types.h"

/* ═══════════════════════════════════════════════════════════════════════════
 *  THE BOOLEAN BAR — ANSI VISUAL LIBRARY
 *  Modular, reusable ANSI escape-code toolkit for the CLI experience.
 *  All macros use the \x1b (ESC) prefix for maximum terminal compatibility.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── RESET ────────────────────────────────────────────────────────────────
#define ANSI_COLOR_RESET   "\x1b[0m"

// ─── CURSOR CONTROL ──────────────────────────────────────────────────────
#define ANSI_CURSOR_UP_3   "\x1b[3A"    // Move cursor up 3 lines

// ─── STANDARD FOREGROUND COLORS (30–37) ──────────────────────────────────
#define ANSI_COLOR_BLACK   "\x1b[30m"
#define ANSI_COLOR_RED     "\x1b[31m"
#define ANSI_COLOR_GREEN   "\x1b[32m"
#define ANSI_COLOR_YELLOW  "\x1b[33m"
#define ANSI_COLOR_BLUE    "\x1b[34m"
#define ANSI_COLOR_MAGENTA "\x1b[35m"
#define ANSI_COLOR_CYAN    "\x1b[36m"
#define ANSI_COLOR_WHITE   "\x1b[37m"

// ─── BRIGHT / HIGH-INTENSITY FOREGROUND (90–97) ──────────────────────────
#define ANSI_BRIGHT_BLACK   "\x1b[90m"   // Dark gray
#define ANSI_BRIGHT_RED     "\x1b[91m"   // Vibrant red  — BANG!
#define ANSI_BRIGHT_GREEN   "\x1b[92m"   // Neon green   — Survival
#define ANSI_BRIGHT_YELLOW  "\x1b[93m"   // Warning gold
#define ANSI_BRIGHT_BLUE    "\x1b[94m"   // Ice blue
#define ANSI_BRIGHT_MAGENTA "\x1b[95m"   // Pink
#define ANSI_BRIGHT_CYAN    "\x1b[96m"   // Teal glow
#define ANSI_BRIGHT_WHITE   "\x1b[97m"   // Pure white

// ─── STANDARD BACKGROUND COLORS (40–47) ──────────────────────────────────
#define ANSI_BG_BLACK   "\x1b[40m"
#define ANSI_BG_RED     "\x1b[41m"
#define ANSI_BG_GREEN   "\x1b[42m"
#define ANSI_BG_YELLOW  "\x1b[43m"
#define ANSI_BG_BLUE    "\x1b[44m"
#define ANSI_BG_MAGENTA "\x1b[45m"
#define ANSI_BG_CYAN    "\x1b[46m"
#define ANSI_BG_WHITE   "\x1b[47m"

// ─── BRIGHT BACKGROUND COLORS (100–107) ──────────────────────────────────
#define ANSI_BG_BRIGHT_RED    "\x1b[101m"
#define ANSI_BG_BRIGHT_GREEN  "\x1b[102m"
#define ANSI_BG_BRIGHT_YELLOW "\x1b[103m"
#define ANSI_BG_BRIGHT_CYAN   "\x1b[106m"

// ─── TEXT STYLES ─────────────────────────────────────────────────────────
#define ANSI_STYLE_BOLD      "\x1b[1m"
#define ANSI_STYLE_DIM       "\x1b[2m"
#define ANSI_STYLE_ITALIC    "\x1b[3m"
#define ANSI_STYLE_UNDERLINE "\x1b[4m"
#define ANSI_STYLE_BLINK     "\x1b[5m"
#define ANSI_STYLE_REVERSE   "\x1b[7m"
#define ANSI_STYLE_STRIKETHROUGH "\x1b[9m"

// ─── 256-COLOR PALETTE (theme-specific presets) ──────────────────────────
// Usage: printf(ANSI_256_FG(196) "text" ANSI_COLOR_RESET);
#define ANSI_256_FG(n)  "\x1b[38;5;" #n "m"
#define ANSI_256_BG(n)  "\x1b[48;5;" #n "m"

// Theme-specific 256-color shortcuts
#define ANSI_BLOOD_RED    ANSI_256_FG(124)   // Deep blood red
#define ANSI_DARK_RED     ANSI_256_FG(52)    // Very dark red
#define ANSI_TOXIC_GREEN  ANSI_256_FG(46)    // Neon toxic green
#define ANSI_MATRIX_GREEN ANSI_256_FG(34)    // Matrix-style green
#define ANSI_ICE_BLUE     ANSI_256_FG(39)    // Ice/cyan blue
#define ANSI_STEEL_GRAY   ANSI_256_FG(240)   // Neutral steel
#define ANSI_ASH_GRAY     ANSI_256_FG(245)   // Lighter ash
#define ANSI_SMOKE        ANSI_256_FG(236)   // Dark smoke
#define ANSI_AMBER        ANSI_256_FG(214)   // Warm amber
#define ANSI_FIRE_ORANGE  ANSI_256_FG(202)   // Fire/danger

// ─── COMPOUND STYLE PRESETS ──────────────────────────────────────────────
// Ready-to-use combinations for common game states
#define STYLE_BANG      ANSI_STYLE_BOLD ANSI_BRIGHT_RED     // Death state
#define STYLE_SURVIVAL  ANSI_STYLE_BOLD ANSI_BRIGHT_GREEN   // Survival state
#define STYLE_WARNING   ANSI_STYLE_BOLD ANSI_BRIGHT_YELLOW  // Warning/tension
#define STYLE_NEUTRAL   ANSI_STYLE_DIM  ANSI_COLOR_CYAN     // Neutral/info
#define STYLE_HEADER    ANSI_STYLE_BOLD ANSI_BRIGHT_CYAN    // Headers
#define STYLE_MUTED     ANSI_STYLE_DIM  ANSI_BRIGHT_BLACK   // Background text
#define STYLE_DANGER_BG ANSI_STYLE_BOLD ANSI_BRIGHT_WHITE ANSI_BG_RED // Critical

// ─── ASCII ART ASSETS ────────────────────────────────────────────────────
// Roulette cylinder frames for spinning animation
#define ROULETTE_CYLINDER_FRAMES \
    (const char *[]) { \
        "  [ ○ ○ ○ ○ ○ ● ]", \
        "  [ ● ○ ○ ○ ○ ○ ]", \
        "  [ ○ ● ○ ○ ○ ○ ]", \
        "  [ ○ ○ ● ○ ○ ○ ]", \
        "  [ ○ ○ ○ ● ○ ○ ]", \
        "  [ ○ ○ ○ ○ ● ○ ]" \
    }
#define ROULETTE_FRAMES_COUNT 6

// BANG ASCII art — death animation
#define BANG_ASCII_ART \
    (const char *[]) { \
        "       ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗", \
        "       ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██║", \
        "       ██████╔╝███████║██╔██╗ ██║██║  ███╗██║", \
        "       ██╔══██╗██╔══██║██║╚██╗██║██║   ██║╚═╝", \
        "       ██████╔╝██║  ██║██║ ╚████║╚██████╔╝██╗", \
        "       ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝" \
    }
#define BANG_ASCII_LINES 6

// CLICK ASCII art — survival animation
#define CLICK_ASCII_ART \
    (const char *[]) { \
        "      ██████╗██╗     ██╗ ██████╗██╗  ██╗", \
        "     ██╔════╝██║     ██║██╔════╝██║ ██╔╝", \
        "     ██║     ██║     ██║██║     █████╔╝ ", \
        "     ██║     ██║     ██║██║     ██╔═██╗ ", \
        "     ╚██████╗███████╗██║╚██████╗██║  ██╗", \
        "      ╚═════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝" \
    }
#define CLICK_ASCII_LINES 6

// CLICK gradient colors
#define CLICK_GRADIENT \
    (const char *[]) { \
        ANSI_MATRIX_GREEN, \
        ANSI_MATRIX_GREEN, \
        ANSI_COLOR_GREEN, \
        ANSI_BRIGHT_GREEN, \
        ANSI_BRIGHT_GREEN, \
        ANSI_TOXIC_GREEN \
    }
#define CLICK_GRADIENT_COUNT 6

// Dice face dot patterns (per die value 0-6)
#define DICE_FACE_TOP \
    (const char *[]) { "     ", "     ", "  •  ", "  •  ", " • • ", " • • ", " ••• " }
#define DICE_FACE_MID \
    (const char *[]) { "     ", "  •  ", "     ", "  •  ", "     ", "  •  ", "     " }
#define DICE_FACE_BOT \
    (const char *[]) { "     ", "     ", "  •  ", "  •  ", " • • ", " • • ", " ••• " }
#define DICE_FACE_VALUES 7

/* ═══════════════════════════════════════════════════════════════════════════
 *  FUNCTION DECLARATIONS — Core Utilities
 * ═══════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════
 *  FUNCTION DECLARATIONS — Visual Effects
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @brief Sleep portável em milissegundos (Windows Sleep / Unix usleep).
 * @param ms Tempo em milissegundos.
 */
void ui_sleep_ms(int ms);

/**
 * @brief Imprime uma caixa com bordas duplas ao redor de um texto.
 * @param text Texto a ser exibido dentro da caixa.
 * @param color Código ANSI para a cor da borda.
 */
void ui_print_box(const char *text, const char *color);

/**
 * @brief Imprime um separador horizontal estilizado.
 * @param color Código ANSI para a cor.
 */
void ui_print_separator(const char *color);

/**
 * @brief Renderiza a arte ASCII de "BANG!" com cor vermelha vibrante.
 *        Representa o momento da morte do jogador — máximo impacto visual.
 * @param player_name Nome do jogador que foi eliminado.
 */
void ui_print_bang_art(const char *player_name);

/**
 * @brief Renderiza a arte ASCII de "CLICK... EMPTY" (sobrevivência).
 *        Representa o alívio de sobreviver à roleta russa.
 * @param player_name Nome do jogador que sobreviveu.
 */
void ui_print_survival_art(const char *player_name);

/**
 * @brief Renderiza a animação de giro da roleta russa no terminal.
 *        Mostra frames progressivos com delay decrescente para tensão.
 * @param player_name Nome do jogador na mira.
 * @param balas Número de balas no tambor.
 */
// Dice Mode Renderers
void ui_render_dice_board(Mesa *table);
void ui_print_dice_hand(const int *dice, int count);

// Logic Mode Renderers
void ui_print_roulette_spin(const char *player_name, int balas);

#endif // TERMINAL_ART_H