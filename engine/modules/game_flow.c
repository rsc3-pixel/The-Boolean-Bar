#include "game_flow.h"
#include "../core/memory.h"
#include "../core/input_handler.h"
#include "../functional/predicates.h"
#include "../ui/terminal_art.h"
#include "deck_manager.h"
#include "logic_engine.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

static void dar_cartas_iniciais(Jogador *p) {
    while (p->num_cards < 5) {
        char *fstr = deck_generate_random_formula_string();
        FormulaType type = CONTINGENCY; // Nao revelamos o real, so validado via engine dps
        p->hand[p->num_cards] = mem_new_carta(fstr, type);
        free(fstr); // string foi copiada pra dentro de carta
        p->num_cards++;
    }
}

static void repor_carta(Jogador *p) {
    char *fstr = deck_generate_random_formula_string();
    p->hand[p->num_cards] = mem_new_carta(fstr, CONTINGENCY);
    p->num_cards++;
}

static void print_json_state(Mesa *m, int num_players) {
    printf("\nJSON_STATE: {");
    printf("\"players\": [");
    int first = 1;
    for (int i = 0; i < num_players; i++) {
        Jogador *p = m->players[i];
        if (!p) continue;
        if (!first) printf(",");
        first = 0;
        printf("{\"name\": \"%s\", \"alive\": %s, \"cards\": %d, \"lives\": %d}",
               p->name, p->estaVivo ? "true" : "false", p->num_cards, p->score);
    }
    printf("],");

    // Envia a mão atual do jogador da vez
    Jogador *atual = m->players[m->current_player_index];
    printf("\"currentHand\": [");
    for (int j = 0; j < atual->num_cards; j++) {
        if (j > 0) printf(",");
        printf("\"%s\"", atual->hand[j]->formula_str);
    }
    printf("],");

    printf("\"turn\": %d,", m->current_player_index);
    printf("\"totalPlayers\": %d,", num_players);
    printf("\"bullets\": %d", m->balas_no_tambor);
    printf("}\n");
    fflush(stdout);
}

static void roleta_russa(Mesa *m, Jogador *perdedor) {
    ui_print_colored("\n===== ROLETA RUSSA =====\n", ANSI_COLOR_RED);
    printf("O jogador %s pega o revolver! Probabilidade: %d/6\n", perdedor->name, m->balas_no_tambor);
    
    int tambor = (rand() % 6) + 1;
    if (tambor <= m->balas_no_tambor) { // Falhou (BANG!)
        ui_print_colored("\n   💥 BANG! 💥\n\n", ANSI_STYLE_BOLD ANSI_COLOR_RED);
        perdedor->estaVivo = false;
        perdedor->status = ELIMINATED;
        perdedor->score = 0;
        m->num_players_alive--;
        m->balas_no_tambor = 1; // Reseta risco na morte
    } else {
        ui_print_colored("\n   💨 CLIQUE... O tambor estava vazio!\n\n", ANSI_STYLE_BOLD ANSI_COLOR_YELLOW);
        perdedor->score--;
        m->balas_no_tambor++; // Incrementa risco
        if (perdedor->score <= 0) {
            perdedor->estaVivo = false;
            perdedor->status = ELIMINATED;
            m->num_players_alive--;
            m->balas_no_tambor = 1; // Reseta se morreu pelas vidas
            printf("%s sucumbiu por falta de vidas.\n", perdedor->name);
        }
    }

    // Emite resultado da roleta para o frontend
    printf("\nJSON_ROULETTE_RESULT: {\"player\": \"%s\", \"survived\": %s, \"lives\": %d, \"bullets\": %d}\n",
           perdedor->name,
           perdedor->estaVivo ? "true" : "false",
           perdedor->score,
           m->balas_no_tambor);
    fflush(stdout);
}


int game_start() {
    srand(time(NULL));

    Mesa *game_table = mem_new_mesa();
    if (game_table == NULL) return 1;

    // Lê o número de jogadores na primeira linha
    char count_buf[16];
    int num_players = MAX_PLAYERS; // fallback
    if (fgets(count_buf, sizeof(count_buf), stdin) != NULL) {
        num_players = atoi(count_buf);
        if (num_players < 2)  num_players = 2;
        if (num_players > MAX_PLAYERS) num_players = MAX_PLAYERS;
    }

    // Lê os N nomes enviados pelo servidor Node via stdin
    char player_names[MAX_PLAYERS][64];
    for (int i = 0; i < num_players; i++) {
        if (fgets(player_names[i], sizeof(player_names[i]), stdin) != NULL) {
            int len = strlen(player_names[i]);
            while (len > 0 && (player_names[i][len-1] == '\n' || player_names[i][len-1] == '\r')) {
                player_names[i][--len] = '\0';
            }
            if (len == 0) sprintf(player_names[i], "Jogador %d", i + 1);
        } else {
            sprintf(player_names[i], "Jogador %d", i + 1);
        }
    }

    // Cria apenas os N jogadores — slots restantes ficam NULL
    for (int i = 0; i < num_players; i++) {
        game_table->players[i] = mem_new_jogador(i + 1, player_names[i]);
        if (game_table->players[i] == NULL) {
            mem_free_mesa(game_table);
            return 1;
        }
        dar_cartas_iniciais(game_table->players[i]);
        game_table->num_players_alive++;
    }

    game_table->current_player_index = 0;

    // Loop principal
    while (!game_table->game_over && game_table->num_players_alive > 1) {
        ui_clear_screen();
        ui_draw_header("THE BOOLEAN BAR");
        ui_render_mesa(game_table);

        print_json_state(game_table, num_players);

        Jogador *atual = game_table->players[game_table->current_player_index];
        printf("\n=> É o turno do [%s]!\n", atual->name);

        printf("Sua Mão de Cartas:\n");
        for (int i = 0; i < atual->num_cards; i++) {
            printf("  %d. %s\n", i+1, atual->hand[i]->formula_str);
        }

        int escolha_carta = get_safe_int("\nEscolha qual carta descartar (1-5): ", 1, atual->num_cards);
        escolha_carta--; // Indice array

        Carta *jogada = atual->hand[escolha_carta];
        
        printf("\nQual é do seu blefe na carta?\n");
        printf("1. TAUTOLOGIA\n");
        printf("2. CONTRADIÇÃO\n");
        printf("3. CONTINGÊNCIA\n");
        int escolha_tipo = get_safe_int(">>> ", 1, 3);
        
        FormulaType afirmacao;
        if(escolha_tipo == 1) afirmacao = TAUTOLOGY;
        else if(escolha_tipo == 2) afirmacao = CONTRADICTION;
        else afirmacao = CONTINGENCY;

        // Tira carta da mao
        for (int k = escolha_carta; k < atual->num_cards - 1; k++) {
            atual->hand[k] = atual->hand[k+1];
        }
        atual->num_cards--;
        
        // Passar turno pra proximo
        int index_oponente = get_next_valid_player_index(game_table, game_table->current_player_index, is_alive);
        if (index_oponente == -1) break; // Acabou
        
        Jogador *oponente = game_table->players[index_oponente];

        ui_clear_screen();
        ui_draw_header("A MESA ESTÁ TENSA");
        printf("\n[%s] descartou a carta:\n>> %s\n\n", atual->name, jogada->formula_str);
        printf("[%s] diz que é uma: %d (1=TAUTOLOGIA, 2=CONTRADIÇÃO, 3=CONTINGÊNCIA)\n", atual->name, escolha_tipo);
        
        // Emite Estado da mesa centralizado
        printf("\nJSON_DOUBT_STATE: {\"caller\": \"%s\", \"target\": \"%s\", \"card\": \"%s\", \"bluff\": %d}\n",
                oponente->name, atual->name, jogada->formula_str, escolha_tipo);
        fflush(stdout);

        printf("\n[%s], você DUVIDA?\n", oponente->name);
        int duvida = get_safe_int("1 para DUVIDAR, 0 para ACREDITAR: ", 0, 1);

        if (duvida == 1) {
            ui_print_colored("\n-- CONFRONTO LÓGICO! --\n", ANSI_STYLE_BOLD ANSI_COLOR_CYAN);
            FormulaType real_type = logic_evaluate_formula(jogada->formula_str);
            printf("Tipo Real da Expressão: %d\n", (int)real_type);
            bool mentiu = (real_type != afirmacao);

            Jogador *perdedor_confronto = mentiu ? atual : oponente;

            // Emite quem perdeu o confronto lógico para o frontend
            printf("\nJSON_DOUBT_RESULT: {\"loser\": \"%s\", \"bluffed\": %s, \"realType\": %d}\n",
                   perdedor_confronto->name,
                   mentiu ? "true" : "false",
                   (int)real_type);
            fflush(stdout);

            if (mentiu) {
               ui_print_colored("O BLEFE FOI DESMASCARADO! ", ANSI_COLOR_YELLOW);
               printf("[%s] perde a aposta.\n", atual->name);
               roleta_russa(game_table, atual);
            } else {
               ui_print_colored("ERA VERDADE! ", ANSI_COLOR_GREEN);
               printf("[%s] duvidou injustamente.\n", oponente->name);
               roleta_russa(game_table, oponente);
            }
            
            // Pausa antes de continuar — front envia \n para destravar
            printf("Pressione Enter para continuar...\n");
            char buffer[10];
            get_safe_string("", buffer, 9);
        }

        mem_free_carta(jogada);
        repor_carta(atual);

        // Avança turno garantidamente para um vivo caso o proximo era oponente e continuou
        game_table->current_player_index = get_next_valid_player_index(game_table, game_table->current_player_index, is_alive);
    }

    ui_clear_screen();
    ui_draw_header("CONTA FECHADA");
    int win_idx = get_next_valid_player_index(game_table, 0, is_alive);
    if(win_idx != -1) {
       ui_print_colored(game_table->players[win_idx]->name, ANSI_COLOR_GREEN);
       printf(" é o único sobrevivente do Boolean Bar. A casa agradece!\n\n");

       printf("\nJSON_VICTORY: {\"winner\": \"%s\", \"totalPlayers\": %d}\n",
              game_table->players[win_idx]->name, num_players);
       fflush(stdout);
    }

    mem_free_mesa(game_table);

    return 0;
}