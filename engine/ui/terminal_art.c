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

/**
 * Dorme o processo por um número de milissegundos (portável).
 * Usa Sleep() no Windows e usleep() em Unix/Linux.
 */
void ui_sleep_ms(int ms) {
#ifdef _WIN32
    Sleep(ms);
#else
    usleep(ms * 1000);
#endif
}

/**
 * Imprime uma string com cor ANSI especificada.
 * Aplica o código de cor no início e reseta ao final.
 */
/**
 * Imprime uma string com cor ANSI especificada.
 * Aplica o código de cor no início e reseta ao final.
 */
void ui_print_colored(const char *text, const char *color_code) {
    printf("%s%s%s", color_code, text, ANSI_COLOR_RESET);
}

/**
 * Limpa a tela do terminal de forma portável.
 * Detecta o SO e executa o comando apropriado (cls no Windows, clear no Unix).
 */
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
    /**
     * Imprime uma linha separadora horizontal de 76 caracteres.
     * Useful para dividir seções visuais na interface do terminal.
     * A cor é aplicada ao separador e ao reset.
     */
    printf("%s", color);
    printf("  ");
    for (int dash_index = 0; dash_index < 76; dash_index++) printf("─");
    printf("%s\n", ANSI_COLOR_RESET);
}

/**
 * Desenha uma caixa com bordas duplas (╔═╗║╚╝) ao redor de um texto.
 * Centraliza o texto horizontalmente com padding uniforme.
 */
void ui_print_box(const char *text, const char *color) {
    int len = strlen(text);
    int inner_width = len + 4;  // 2 padding each side
    if (inner_width < 40) inner_width = 40;
    int padding = (inner_width - len) / 2;

    // Top border
    printf("%s  ╔", color);
    for (int border_index = 0; border_index < inner_width; border_index++) printf("═");
    printf("╗%s\n", ANSI_COLOR_RESET);

    // Content line
    printf("%s  ║", color);
    for (int left_padding = 0; left_padding < padding; left_padding++) printf(" ");
    printf("%s%s%s", ANSI_STYLE_BOLD, text, ANSI_COLOR_RESET);
    printf("%s", color);
    for (int right_padding = 0; right_padding < inner_width - padding - len; right_padding++) printf(" ");
    printf("║%s\n", ANSI_COLOR_RESET);

    // Bottom border
    printf("%s  ╚", color);
    for (int border_index = 0; border_index < inner_width; border_index++) printf("═");
    printf("╝%s\n", ANSI_COLOR_RESET);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  HEADER
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Desenha um cabeçalho estilizado com bordas duplas e título centralizado.
 * Utiliza cores e estilos para criar uma presença visual forte.
 */
/**
 * Desenha um cabeçalho estilizado com bordas duplas e título centralizado.
 * Utiliza cores e estilos para criar uma presença visual forte.
 */
void ui_draw_header(const char *title) {
    int title_len = strlen(title);
    int line_len = 80;
    int padding = (line_len - title_len - 2) / 2;

    printf("\n");

    // Top border with gradient feel
    printf("%s  ", ANSI_BRIGHT_CYAN);
    for (int border_index = 0; border_index < 76; border_index++) printf("═");
    printf("%s\n", ANSI_COLOR_RESET);

    // Title line
    printf("%s  ║%s", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
    for (int left_padding = 0; left_padding < padding - 2; left_padding++) printf(" ");
    printf("%s%s%s", STYLE_HEADER, title, ANSI_COLOR_RESET);
    for (int right_padding = 0; right_padding < padding - 2; right_padding++) printf(" ");
    if ((line_len - title_len - 2) % 2 != 0) printf(" ");
    printf("%s  ║%s", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
    printf("\n");

    // Bottom border
    printf("%s  ", ANSI_BRIGHT_CYAN);
    for (int border_index = 0; border_index < 76; border_index++) printf("═");
    printf("%s\n\n", ANSI_COLOR_RESET);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MESA RENDER
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Renderiza o estado atual da mesa no terminal.
 * Exibe status dos jogadores, número de vivos, balas no tambor e cartas por jogador.
 */
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

    for (int player_index = 0; player_index < MAX_PLAYERS; player_index++) {
        Jogador *p = table->players[player_index];
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

/**
 * Renderiza a animação da roleta russa com spinner de cilindro.
 * Mostra o giro acelerado e depois o "puxar do gatilho" com efeito de pulsação.
 */
void ui_print_roulette_spin(const char *player_name, int balas) {
    // Cylinder frames for spinning animation
    const char **frames = ROULETTE_CYLINDER_FRAMES;
    int num_frames = ROULETTE_FRAMES_COUNT;

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

    for (int spin_iteration = 0; spin_iteration < total_spins; spin_iteration++) {
        int frame_idx = spin_iteration % num_frames;

        // Move cursor up to overwrite previous frame
        if (spin_iteration > 0) {
            printf(ANSI_CURSOR_UP_3); // Move up 3 lines
        }

        // Render the cylinder frame
        printf("  %s╭──────────────────────╮%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        printf("  %s│%s %s%s%s %s│%s\n",
               ANSI_STEEL_GRAY, ANSI_COLOR_RESET,
               spin_iteration < total_spins - 1 ? ANSI_BRIGHT_YELLOW : ANSI_BRIGHT_RED,
               frames[frame_idx],
               ANSI_COLOR_RESET,
               ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        printf("  %s╰──────────────────────╯%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);

        fflush(stdout);
        ui_sleep_ms(delays[spin_iteration]);
    }

    printf("\n");

    // Dramatic pause before result
    for (int pulse_iteration = 0; pulse_iteration < 3; pulse_iteration++) {
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

/**
 * Exibe a arte ASCII "BANG!" com efeito de impacto máximo.
 * Inclui flash vermelho, arte grande, som de morte e mensagem de eliminação.
 */
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
    const char **art = BANG_ASCII_ART;

    for (int art_line = 0; art_line < BANG_ASCII_LINES; art_line++) {
        printf("  %s%s%s\n", STYLE_BANG, art[art_line], ANSI_COLOR_RESET);
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

/**
 * Exibe a arte ASCII "CLICK... EMPTY" com efeito de alívio.
 * Mostra o tambor vazio com gradiente verde e confirmação de sobrevivência.
 */
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
    const char **art = CLICK_ASCII_ART;

    // Green gradient: start dim, end bright
    const char **gradient = CLICK_GRADIENT;

    for (int art_line = 0; art_line < CLICK_ASCII_LINES; art_line++) {
        printf("  %s%s%s%s\n", ANSI_STYLE_BOLD, gradient[art_line], art[art_line], ANSI_COLOR_RESET);
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
/**
 * Renderiza o copo de dados do jogador local (5 dados com faces visual).
 * Mostra a representação ASCII dos dados com números de índice para seleção.
 */
void ui_print_dice_hand(const int *dice, int count) {
    if (count == 0) {
        printf("  %s(Sem dados restantes)%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        return;
    }

    printf("  %sSEU COPO:%s\n\n  ", ANSI_BRIGHT_WHITE, ANSI_COLOR_RESET);
    for (int dice_index = 0; dice_index < 5; dice_index++) {
        if (dice_index < count) printf("%s┌─────┐%s ", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s┌─────┐%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");

    const char **d_top = DICE_FACE_TOP;
    const char **d_mid = DICE_FACE_MID;
    const char **d_bot = DICE_FACE_BOT;

    // Top
    for (int dice_index = 0; dice_index < 5; dice_index++) {
        int die_value = (dice_index < count) ? dice[dice_index] : 0;
        if (die_value < 0 || die_value > 6) die_value = 0;
        if (dice_index < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_top[die_value], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    // Mid
    for (int dice_index = 0; dice_index < 5; dice_index++) {
        int die_value = (dice_index < count) ? dice[dice_index] : 0;
        if (die_value < 0 || die_value > 6) die_value = 0;
        if (dice_index < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_mid[die_value], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    // Bot
    for (int dice_index = 0; dice_index < 5; dice_index++) {
        int die_value = (dice_index < count) ? dice[dice_index] : 0;
        if (die_value < 0 || die_value > 6) die_value = 0;
        if (dice_index < count) printf("%s│%s%s%s%s│%s ", ANSI_BRIGHT_CYAN, ANSI_BRIGHT_WHITE, d_bot[die_value], ANSI_COLOR_RESET, ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s│     │%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");

    for (int dice_index = 0; dice_index < 5; dice_index++) {
        if (dice_index < count) printf("%s└─────┘%s ", ANSI_BRIGHT_CYAN, ANSI_COLOR_RESET);
        else           printf("%s└─────┘%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n  ");
    
    for (int dice_index = 0; dice_index < 5; dice_index++) {
        if (dice_index < count) printf("%s  (%d)  %s ", ANSI_ASH_GRAY, dice_index+1, ANSI_COLOR_RESET);
        else           printf("%s(Vazio)%s ", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    printf("\n\n");
}

/**
 * Renderiza a mesa principal do modo Dados (Liar's Dice).
 * Exibe: estado da aposta, dados do jogador atual, lista de players e histórico de apostas.
 */
void ui_render_dice_board(Mesa *table) {
    if (!table) return;
    ui_clear_screen();
    
    int total_dice = 0;
    for (int player_index = 0; player_index < MAX_PLAYERS; player_index++) {
        if (table->players[player_index] && table->players[player_index]->estaVivo) {
            total_dice += table->players[player_index]->dice_count;
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
        for(int padding_index = 0; padding_index < 55 - len; padding_index++) printf(" ");
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
        
        Jogador *last = NULL;
        if (table->last_bet_player_id >= 0 && table->last_bet_player_id < MAX_PLAYERS) last = table->players[table->last_bet_player_id];
        const char *pname = last ? last->name : "Sistema";
        len = snprintf(NULL, 0, "POR: %s", pname);
        printf("  %s│%s POR: %s%s", ANSI_STEEL_GRAY, ANSI_ASH_GRAY, pname, ANSI_ASH_GRAY);
        for(int padding_index = 0; padding_index < 55 - len; padding_index++) printf(" ");
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
        for (int dice_index = 0; dice_index < 5; dice_index++) {
            if (dice_index < host->dice_count) {
                char temp[10];
                snprintf(temp, sizeof(temp), "[ %d ] ", host->dice[dice_index] ? host->dice[dice_index] : 0);
                strcat(dice_str, temp);
            }
        }
        int len = snprintf(NULL, 0, "SEUS DADOS:    %s", dice_str);
        printf("  %s│%s SEUS DADOS:    %s%s%s", ANSI_STEEL_GRAY, ANSI_ASH_GRAY, ANSI_BRIGHT_CYAN, dice_str, ANSI_ASH_GRAY);
        for(int padding_index = 0; padding_index < 55 - len; padding_index++) printf(" ");
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    } else {
        const char *m = "[ ELIMINADO DA MESA ]";
        printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_DARK_RED, m, ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    
    printf("  %s│%s %-55s %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET, "", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("  %s├─────────────────────────────────────────────────────────┤%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    // Header das Colunas (Esquerda 24 chars, Direita 31 chars)
    printf("  %s│%s JOGADORES NA MESA       HISTORICO DE APOSTAS            %s│%s\n", ANSI_STEEL_GRAY, ANSI_BRIGHT_WHITE, ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    
    for (int player_index = 0; player_index < MAX_PLAYERS; player_index++) {
        Jogador *p = table->players[player_index];
        if (!p) continue;
        
        char col_left[64];
        if (p->estaVivo) {
            snprintf(col_left, sizeof(col_left), "%d. %-6s [%d/5] %s", player_index+1, p->name, p->dice_count, player_index == table->current_player_index ? "< Vez" : "     ");
        } else {
            snprintf(col_left, sizeof(col_left), "%d. %-6s [ELIM ]      ", player_index+1, p->name);
        }
        
        const char *hist = " ";
        if (player_index == 0) hist = "> Joao: 4 faces [3]";
        if (player_index == 1) hist = "> Luiz: 5 faces [3]";
        if (player_index == 2) hist = "> Duda: 6 faces [5] !!";
        
        int lenL = strlen(col_left);
        int lenR = strlen(hist);
        
        // Print Left Column (cor dependente de status)
        printf("  %s│%s %s", ANSI_STEEL_GRAY, p->estaVivo ? ANSI_ASH_GRAY : ANSI_DARK_RED, col_left);
        for(int padding_index = 0; padding_index < 24 - lenL; padding_index++) printf(" "); // Pad until pos 24
        
        // Print Right Column (Histórico)
        printf("%s%s", ANSI_ASH_GRAY, hist);
        for(int padding_index = 0; padding_index < 30 - lenR; padding_index++) printf(" "); // Pad until end of inner 55
        
        printf(" %s│%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    }
    
    printf("  %s└─────────────────────────────────────────────────────────┘%s\n", ANSI_STEEL_GRAY, ANSI_COLOR_RESET);
    printf("\n    %s(A)umentar Aposta     (D)uvidar     (P)edir as Contas%s\n\n", ANSI_BRIGHT_YELLOW, ANSI_COLOR_RESET);
}