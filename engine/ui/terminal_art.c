#include "terminal_art.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* ═══════════════════════════════════════════════════════════════════════════
 *  Portability includes for ui_sleep_ms
 * ═══════════════════════════════════════════════════════════════════════════ */
#ifdef _WIN32
    #include <windows.h>
#else
    #include <unistd.h>
#endif

/* ═══════════════════════════════════════════════════════════════════════════
 *  CORE UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_sleep_ms(int ms) {
#ifdef _WIN32
    Sleep(ms);
#else
    usleep(ms * 1000);
#endif
}

void ui_print_colored(const char *text, const char *color_code) {
    printf("%s%s%s", color_code, text, ANSI_COLOR_RESET);
}

void ui_clear_screen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  STYLED PRIMITIVES
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_print_separator(const char *color) {
    printf("%s", color);
    printf("  ");
    for (int i = 0; i < 76; i++) printf("─");
    printf("%s\n", ANSI_COLOR_RESET);
}

void ui_print_box(const char *text, const char *color) {
    int len = strlen(text);
    int inner_width = len + 4;  // 2 padding each side
    if (inner_width < 40) inner_width = 40;
    int padding = (inner_width - len) / 2;

    // Top border
    printf("%s  ╔", color);
    for (int i = 0; i < inner_width; i++) printf("═");
    printf("╗%s\n", ANSI_COLOR_RESET);

    // Content line
    printf("%s  ║", color);
    for (int i = 0; i < padding; i++) printf(" ");
    printf("%s%s%s", ANSI_STYLE_BOLD, text, ANSI_COLOR_RESET);
    printf("%s", color);
    for (int i = 0; i < inner_width - padding - len; i++) printf(" ");
    printf("║%s\n", ANSI_COLOR_RESET);

    // Bottom border
    printf("%s  ╚", color);
    for (int i = 0; i < inner_width; i++) printf("═");
    printf("╝%s\n", ANSI_COLOR_RESET);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  HEADER
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_draw_header(const char *title) {
    int title_len = strlen(title);
    int line_len = 80;
    int padding = (line_len - title_len - 2) / 2;

    printf("\n");

    // Top border with gradient feel
    printf("%s  ", ANSI_BRIGHT_CYAN);
    for (int i = 0; i < 76; i++) printf("═");
    printf("%s\n", ANSI_COLOR_RESET);

    // Title line
    printf("%s  ║%s", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
    for (int i = 0; i < padding - 2; i++) printf(" ");
    printf("%s%s%s", STYLE_HEADER, title, ANSI_COLOR_RESET);
    for (int i = 0; i < padding - 2; i++) printf(" ");
    if ((line_len - title_len - 2) % 2 != 0) printf(" ");
    printf("%s  ║%s", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
    printf("\n");

    // Bottom border
    printf("%s  ", ANSI_BRIGHT_CYAN);
    for (int i = 0; i < 76; i++) printf("═");
    printf("%s\n\n", ANSI_COLOR_RESET);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MESA RENDER
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_render_mesa(Mesa *table) {
    if (!table) return;

    ui_print_separator(ANSI_STEEL_GRAY);

    printf("  %s[STATUS DA MESA]%s  ", STYLE_HEADER, ANSI_COLOR_RESET);
    printf("%sVivos: %s%d%s  ", ANSI_ASH_GRAY, ANSI_BRIGHT_GREEN,
           table->num_players_alive, ANSI_COLOR_RESET);
    printf("%s│%s  ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("%sRisco: %s%d/6%s\n\n",
           ANSI_ASH_GRAY,
           table->balas_no_tambor >= 4 ? ANSI_BRIGHT_RED :
           table->balas_no_tambor >= 2 ? ANSI_BRIGHT_YELLOW : ANSI_BRIGHT_GREEN,
           table->balas_no_tambor, ANSI_COLOR_RESET);

    for (int i = 0; i < MAX_PLAYERS; i++) {
        Jogador *p = table->players[i];
        if (p == NULL) continue;

        if (p->estaVivo) {
            printf("  %s▸%s ", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
            printf("%s%-12s%s", ANSI_BRIGHT_WHITE, p->name, ANSI_COLOR_RESET);
            printf("  %s♥ %d%s", ANSI_BRIGHT_RED, p->score, ANSI_COLOR_RESET);
            printf("  %s│%s", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
            printf("  %s%d cartas%s\n", ANSI_ASH_GRAY, p->num_cards, ANSI_COLOR_RESET);
        } else {
            printf("  %s✖%s ", ANSI_DARK_RED, ANSI_COLOR_RESET);
            printf("%s%s%-12s%s", ANSI_STYLE_DIM, ANSI_COLOR_RED, p->name, ANSI_COLOR_RESET);
            printf("  %s%sELIMINADO%s\n",
                   ANSI_STYLE_DIM, ANSI_STYLE_STRIKETHROUGH, ANSI_COLOR_RESET);
        }
    }

    ui_print_separator(ANSI_STEEL_GRAY);
    printf("\n");
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  ROULETTE SPIN ANIMATION
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_print_roulette_spin(const char *player_name, int balas) {
    // Cylinder frames for spinning animation
    const char *frames[] = {
        "  [ ○ ○ ○ ○ ○ ● ]",
        "  [ ● ○ ○ ○ ○ ○ ]",
        "  [ ○ ● ○ ○ ○ ○ ]",
        "  [ ○ ○ ● ○ ○ ○ ]",
        "  [ ○ ○ ○ ● ○ ○ ]",
        "  [ ○ ○ ○ ○ ● ○ ]"
    };
    int num_frames = 6;

    printf("\n");
    ui_print_box("ROLETA RUSSA", ANSI_BRIGHT_RED);
    printf("\n");

    // Player in crosshairs
    printf("  %sNa mira:%s  %s%s%s\n",
           ANSI_STEEL_GRAY, ANSI_COLOR_RESET,
           STYLE_WARNING, player_name, ANSI_COLOR_RESET);
    printf("  %sBalas no tambor:%s  %s%d/6%s\n\n",
           ANSI_STEEL_GRAY, ANSI_COLOR_RESET,
           balas >= 4 ? ANSI_BRIGHT_RED : ANSI_BRIGHT_YELLOW,
           balas, ANSI_COLOR_RESET);

    // Spinning animation — 18 iterations with decelerating speed
    int delays[] = {40, 40, 50, 50, 60, 70, 80, 100, 120, 140, 170, 200, 250, 300, 350, 400, 500, 700};
    int total_spins = 18;

    for (int s = 0; s < total_spins; s++) {
        int frame_idx = s % num_frames;

        // Move cursor up to overwrite previous frame
        if (s > 0) {
            printf("\x1b[3A"); // Move up 3 lines
        }

        // Render the cylinder frame
        printf("  %s╭──────────────────────╮%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        printf("  %s│%s %s%s%s %s│%s\n",
               ANSI_STEEL_GRAY, ANSI_COLOR_RESET,
               s < total_spins - 1 ? ANSI_BRIGHT_YELLOW : ANSI_BRIGHT_RED,
               frames[frame_idx],
               ANSI_COLOR_RESET,
               ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        printf("  %s╰──────────────────────╯%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);

        fflush(stdout);
        ui_sleep_ms(delays[s]);
    }

    printf("\n");

    // Dramatic pause before result
    for (int i = 0; i < 3; i++) {
        printf("\r  %s▓▓▓ PUXANDO O GATILHO ▓▓▓%s", STYLE_BANG, ANSI_COLOR_RESET);
        fflush(stdout);
        ui_sleep_ms(300);
        printf("\r                              ");
        fflush(stdout);
        ui_sleep_ms(150);
    }
    printf("\r  %s▓▓▓ PUXANDO O GATILHO ▓▓▓%s\n\n", STYLE_BANG, ANSI_COLOR_RESET);
    fflush(stdout);
    ui_sleep_ms(500);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  BANG! — DEATH ASCII ART
 *  Maximum visual impact for player elimination.
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_print_bang_art(const char *player_name) {
    const char *danger_border =
        "  ▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░";

    // Flash effect — quick red bg flash
    printf("%s%s", ANSI_BG_RED, ANSI_BRIGHT_WHITE);
    printf("                                                                               ");
    printf("%s\n", ANSI_COLOR_RESET);
    fflush(stdout);
    ui_sleep_ms(80);

    printf("\n");
    ui_print_colored(danger_border, ANSI_BRIGHT_RED);
    printf("\n\n");

    // BANG ASCII art — each line printed with slight delay for dramatic reveal
    const char *art[] = {
        "       ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗",
        "       ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██║",
        "       ██████╔╝███████║██╔██╗ ██║██║  ███╗██║",
        "       ██╔══██╗██╔══██║██║╚██╗██║██║   ██║╚═╝",
        "       ██████╔╝██║  ██║██║ ╚████║╚██████╔╝██╗",
        "       ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝"
    };

    for (int i = 0; i < 6; i++) {
        printf("  %s%s%s\n", STYLE_BANG, art[i], ANSI_COLOR_RESET);
        fflush(stdout);
        ui_sleep_ms(60);
    }

    printf("\n");

    // Skull decoration
    printf("  %s", ANSI_BRIGHT_RED);
    printf("                    💀  O REVÓLVER DISPAROU!  💀\n");
    printf("%s", ANSI_COLOR_RESET);

    printf("\n");

    // Player death box
    char death_msg[128];
    snprintf(death_msg, sizeof(death_msg), "☠  %s FOI ELIMINADO  ☠", player_name);
    ui_print_box(death_msg, ANSI_BRIGHT_RED);

    printf("\n");
    ui_print_colored(danger_border, ANSI_DARK_RED);
    printf("\n\n");

    // Bottom warning text pulsing
    printf("  %s/// O BOOLEAN BAR COBRA SEU PREÇO ///%s\n\n",
           STYLE_MUTED, ANSI_COLOR_RESET);

    fflush(stdout);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  SURVIVAL — CLICK... EMPTY ASCII ART
 *  Relief moment: the chamber was empty.
 * ═══════════════════════════════════════════════════════════════════════════ */

void ui_print_survival_art(const char *player_name) {
    printf("\n");

    // Transition flash — green
    printf("%s%s", ANSI_BG_GREEN, ANSI_COLOR_BLACK);
    printf("                                                                               ");
    printf("%s\n", ANSI_COLOR_RESET);
    fflush(stdout);
    ui_sleep_ms(60);

    printf("\n");

    // CLICK ASCII art
    const char *art[] = {
        "      ██████╗██╗     ██╗ ██████╗██╗  ██╗",
        "     ██╔════╝██║     ██║██╔════╝██║ ██╔╝",
        "     ██║     ██║     ██║██║     █████╔╝ ",
        "     ██║     ██║     ██║██║     ██╔═██╗ ",
        "     ╚██████╗███████╗██║╚██████╗██║  ██╗",
        "      ╚═════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝"
    };

    // Green gradient: start dim, end bright
    const char *gradient[] = {
        ANSI_MATRIX_GREEN,
        ANSI_MATRIX_GREEN,
        ANSI_COLOR_GREEN,
        ANSI_BRIGHT_GREEN,
        ANSI_BRIGHT_GREEN,
        ANSI_TOXIC_GREEN
    };

    for (int i = 0; i < 6; i++) {
        printf("  %s%s%s%s\n", ANSI_STYLE_BOLD, gradient[i], art[i], ANSI_COLOR_RESET);
        fflush(stdout);
        ui_sleep_ms(50);
    }

    printf("\n");

    // Subtitle
    printf("  %s", ANSI_BRIGHT_CYAN);
    printf("              💨  O TAMBOR ESTAVA VAZIO...  💨\n");
    printf("%s", ANSI_COLOR_RESET);

    printf("\n");

    // Survival confirmation box
    char surv_msg[128];
    snprintf(surv_msg, sizeof(surv_msg), "♥  %s SOBREVIVEU  ♥", player_name);
    ui_print_box(surv_msg, ANSI_BRIGHT_GREEN);

    printf("\n");

    // Warning about increased risk
    printf("  %s⚠  RISCO GLOBAL AUMENTADO — mais uma bala no tambor!%s\n\n",
           STYLE_WARNING, ANSI_COLOR_RESET);

    // Under-text
    printf("  %s/// VOCÊ TEVE SORTE DESTA VEZ ///%s\n\n",
           STYLE_MUTED, ANSI_COLOR_RESET);

    fflush(stdout);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  DICE MODE RENDERERS
 * ═══════════════════════════════════════════════════════════════════════════ */

// Utilitário para o layout do copo isolado (Imagem 1)
void ui_print_dice_hand(const int *dice, int count) {
    if (count == 0) {
        printf("  %s(Sem dados restantes)%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        return;
    }

    printf("  %sSEU COPO:%s\n\n  ", ANSI_BRIGHT_WHITE, ANSI_COLOR_RESET);
    for (int i = 0; i < 5; i++) {
        if (i < count) printf("%s┌─────┐%s ", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s┌─────┐%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");

    const char* d_top[7] = {"     ", "     ", "  •  ", "  •  ", " • • ", " • • ", " ••• "};
    const char* d_mid[7] = {"     ", "  •  ", "     ", "  •  ", "     ", "  •  ", "     "};
    const char* d_bot[7] = {"     ", "     ", "  •  ", "  •  ", " • • ", " • • ", " ••• "};

    // Top
    for (int i = 0; i < 5; i++) {
        int v = (i < count) ? dice[i] : 0;
        if (v < 0 || v > 6) v = 0;
        if (i < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_top[v], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    // Mid
    for (int i = 0; i < 5; i++) {
        int v = (i < count) ? dice[i] : 0;
        if (v < 0 || v > 6) v = 0;
        if (i < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_mid[v], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    // Bot
    for (int i = 0; i < 5; i++) {
        int v = (i < count) ? dice[i] : 0;
        if (v < 0 || v > 6) v = 0;
        if (i < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_bot[v], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");

    for (int i = 0; i < 5; i++) {
        if (i < count) printf("%s└─────┘%s ", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s└─────┘%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    
    for (int i = 0; i < 5; i++) {
        if (i < count) printf("%s  (%d)  %s ", ANSI_ASH_GRAY, i+1, ANSI_COLOR_RESET);
        else           printf("%s(Vazio)%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n\n");
}

// O Painel Master (Imagem 3)
void ui_render_dice_board(Mesa *table) {
    if (!table) return;
    ui_clear_screen();
    
    int total_dice = 0;
    for (int i = 0; i < MAX_PLAYERS; i++) {
        if (table->players[i] && table->players[i]->estaVivo) {
            total_dice += table->players[i]->dice_count;
        }
    }
    
    printf("\n  %s┌─────────────────────────────────────────────────────────┐%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    char buf[128];
    snprintf(buf, sizeof(buf), "THE BOOLEAN BAR - MODO DADOS (LIAR'S DICE)    TOTAL: %02d", total_dice);
    printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_BRIGHT_CYAN, buf, ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    printf("  %s├─────────────────────────────────────────────────────────┤%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    if (table->current_bet_quantity > 0) {
        int len = snprintf(NULL, 0, "APOSTA ATUAL: [ %d ] Dados de Face [ %d ]", table->current_bet_quantity, table->current_bet_face);
        printf("  %s│%s APOSTA ATUAL: %s[ %d ] Dados de Face [ %d ]%s", ANSI_STEEL_GRAY, ANSI_BRIGHT_WHITE, ANSI_BRIGHT_YELLOW, table->current_bet_quantity, table->current_bet_face, ANSI_BRIGHT_WHITE);
        for(int i = 0; i < 55 - len; i++) printf(" ");
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        
        Jogador *last = NULL;
        if (table->last_bet_player_id >= 0 && table->last_bet_player_id < MAX_PLAYERS) last = table->players[table->last_bet_player_id];
        const char *pname = last ? last->name : "Sistema";
        len = snprintf(NULL, 0, "POR: %s", pname);
        printf("  %s│%s POR: %s%s", ANSI_STEEL_GRAY, ANSI_ASH_GRAY, pname, ANSI_ASH_GRAY);
        for(int i = 0; i < 55 - len; i++) printf(" ");
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    } else {
        printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_BRIGHT_GREEN, "A MESA ESTA ABERTA PARA A PRIMEIRA APOSTA", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET, "", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    
    printf("  %s├─────────────────────────────────────────────────────────┤%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET, "", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    Jogador *host = table->players[table->current_player_index]; 
    if (!host) host = table->players[0]; // Fallback if no specific viewer
    
    if (host && host->estaVivo) {
        // Build array string for "[ 2 ] [ 5 ]... "
        char dice_str[64] = "";
        for (int i = 0; i < 5; i++) {
            if (i < host->dice_count) {
                char temp[10];
                snprintf(temp, sizeof(temp), "[ %d ] ", host->dice[i] ? host->dice[i] : 0);
                strcat(dice_str, temp);
            }
        }
        int len = snprintf(NULL, 0, "SEUS DADOS:    %s", dice_str);
        printf("  %s│%s SEUS DADOS:    %s%s%s", ANSI_STEEL_GRAY, ANSI_ASH_GRAY, ANSI_BRIGHT_CYAN, dice_str, ANSI_ASH_GRAY);
        for(int i = 0; i < 55 - len; i++) printf(" ");
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    } else {
        const char *m = "[ ELIMINADO DA MESA ]";
        printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_DARK_RED, m, ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    
    printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET, "", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("  %s├─────────────────────────────────────────────────────────┤%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    // Header das Colunas (Esquerda 24 chars, Direita 31 chars)
    printf("  %s│%s JOGADORES NA MESA       HISTORICO DE APOSTAS            %s│%s\n", ANSI_STEEL_GRAY, ANSI_BRIGHT_WHITE, ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    for (int i = 0; i < MAX_PLAYERS; i++) {
        Jogador *p = table->players[i];
        if (!p) continue;
        
        char col_left[64];
        if (p->estaVivo) {
            snprintf(col_left, sizeof(col_left), "%d. %-6s [%d/5] %s", i+1, p->name, p->dice_count, i == table->current_player_index ? "< Vez" : "     ");
        } else {
            snprintf(col_left, sizeof(col_left), "%d. %-6s [ELIM ]      ", i+1, p->name);
        }
        
        const char *hist = " ";
        if (i == 0) hist = "> Joao: 4 faces [3]";
        if (i == 1) hist = "> Luiz: 5 faces [3]";
        if (i == 2) hist = "> Duda: 6 faces [5] !!";
        
        int lenL = strlen(col_left);
        int lenR = strlen(hist);
        
        // Print Left Column (cor dependente de status)
        printf("  %s│%s %s", ANSI_STEEL_GRAY, p->estaVivo ? ANSI_ASH_GRAY : ANSI_DARK_RED, col_left);
        for(int s = 0; s < 24 - lenL; s++) printf(" "); // Pad until pos 24
        
        // Print Right Column (Histórico)
        printf("%s%s", ANSI_ASH_GRAY, hist);
        for(int s = 0; s < 30 - lenR; s++) printf(" "); // Pad until end of inner 55
        
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    
    printf("  %s└─────────────────────────────────────────────────────────┘%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("\n    %s(A)umentar Aposta     (D)uvidar     (P)edir as Contas%s\n\n", ANSI_BRIGHT_YELLOW, ANSI_COLOR_RESET);
}