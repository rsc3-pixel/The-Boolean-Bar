#include "dice_flow.h"
#include "../core/memory.h"
#include "../core/input_handler.h"
#include "../functional/predicates.h"
#include "../ui/terminal_art.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>
#include <string.h>

// ─── LÓGICAS INTERNAS ───────────────────────────────────────────────────────

static void rolar_dados(Mesa *m) {
    for (int i = 0; i < MAX_PLAYERS; i++) {
        Jogador *p = m->players[i];
        if (p && p->estaVivo) {
            for (int k = 0; k < p->dice_count; k++) {
                p->dice[k] = (rand() % 6) + 1;
            }
        }
    }
}

static int contar_dados_mesa(Mesa *m, int face_buscada) {
    int total = 0;
    for (int i = 0; i < MAX_PLAYERS; i++) {
        Jogador *p = m->players[i];
        if (p && p->estaVivo) {
            for (int k = 0; k < p->dice_count; k++) {
                if (p->dice[k] == face_buscada || p->dice[k] == 1) { // '1' é curinga na casa!
                    total++;
                }
            }
        }
    }
    return total;
}

static void print_json_dice_state(Mesa *m, int num_players) {
    printf("\nJSON_DICE_STATE: {");
    printf("\"players\": [");
    int first = 1;
    for (int i = 0; i < num_players; i++) {
        Jogador *p = m->players[i];
        if (!p) continue;
        if (!first) printf(",");
        first = 0;
        printf("{\"name\": \"%s\", \"alive\": %s, \"dice_count\": %d}",
               p->name, p->estaVivo ? "true" : "false", p->dice_count);
    }
    printf("],");
    // Emitimos a mão de dados só pro front (assumimos current = local/focado)
    Jogador *atual = m->players[m->current_player_index];
    printf("\"currentDice\": [");
    for (int j = 0; j < atual->dice_count; j++) {
        if (j > 0) printf(",");
        printf("%d", atual->dice[j]);
    }
    printf("],");

    printf("\"currentBetQty\": %d,", m->current_bet_quantity);
    printf("\"currentBetFace\": %d,", m->current_bet_face);
    printf("\"lastBetPlayerId\": %d,", m->last_bet_player_id);
    printf("\"turn\": %d,", m->current_player_index);
    printf("\"totalPlayers\": %d", num_players);
    printf("}\n");
    fflush(stdout);
}

// ─── LOOP PRINCIPAL ─────────────────────────────────────────────────────────

int dice_game_start() {
    srand(time(NULL));

    Mesa *game_table = mem_new_mesa();
    if (game_table == NULL) return 1;
    game_table->mode = MODE_DICE;

    // Lê a configuração via Stdin (Quantidade e Nomes)
    char count_buf[16];
    int num_players = MAX_PLAYERS; 
    
    printf("Quantos jogadores na mesa? (min 2, max %d): ", MAX_PLAYERS);
    fflush(stdout);
    if (fgets(count_buf, sizeof(count_buf), stdin) != NULL) {
        num_players = atoi(count_buf);
        if (num_players < 2)  num_players = 2;
        if (num_players > MAX_PLAYERS) num_players = MAX_PLAYERS;
    }

    char player_names[MAX_PLAYERS][64];
    for (int i = 0; i < num_players; i++) {
        printf("Digite o nome do jogador %d: ", i + 1);
        fflush(stdout);
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

    // Instancia Jogadores
    for (int i = 0; i < num_players; i++) {
        game_table->players[i] = mem_new_jogador(i + 1, player_names[i]);
        if (game_table->players[i] == NULL) {
            mem_free_mesa(game_table);
            return 1;
        }
        game_table->players[i]->dice_count = 3; 
        game_table->num_players_alive++;
    }

    game_table->current_player_index = 0;
    
    // Loop de Partida
    while (!game_table->game_over && game_table->num_players_alive > 1) {
        
        // Setup de Rodada
        game_table->current_bet_quantity = 0;
        game_table->current_bet_face = 0;
        game_table->last_bet_player_id = -1;
        rolar_dados(game_table);

        int rodada_ativa = 1;
        
        while (rodada_ativa) {
            ui_render_dice_board(game_table);
            print_json_dice_state(game_table, num_players);

            Jogador *atual = game_table->players[game_table->current_player_index];
            
            // Loop de input do turno
            int entrada_valida = 0;
            while (!entrada_valida) {
                printf("\n[%s] Escolha sua Ação (A/D/P): ", atual->name);
                
                char acao[10];
                get_safe_string("", acao, 5);
                char op = acao[0];
                if (op >= 'a' && op <= 'z') op -= 32; // Maiuscula

                // APOSTAR
                if (op == 'A') {
                    int qt = get_safe_int("Nova Quantidade de Dados (> 0): ", 1, 99);
                    int face = get_safe_int("Nova Face do Dado (2 a 6): ", 2, 6);
                    
                    if (qt > game_table->current_bet_quantity || 
                       (qt == game_table->current_bet_quantity && face > game_table->current_bet_face)) {
                           
                        game_table->current_bet_quantity = qt;
                        game_table->current_bet_face = face;
                        game_table->last_bet_player_id = game_table->current_player_index;
                        
                        printf("\nJSON_DICE_BET: {\"caller\": \"%s\", \"qt\": %d, \"face\": %d}\n", atual->name, qt, face);
                        fflush(stdout);
                        entrada_valida = 1;
                    } else {
                        printf("Aposta invalida! Deve subir a quantidade ou manter quantidade e subir a face.\n");
                    }
                } 
                // DUVIDAR
                else if (op == 'D') {
                    if (game_table->current_bet_quantity == 0) {
                        printf("A mesa esta vazia, voce deve abrir a primeira aposta!\n");
                    } else {
                        printf("\nJSON_DVICE_DOUBT: {\"caller\": \"%s\", \"target_id\": %d}\n", atual->name, game_table->last_bet_player_id);
                        fflush(stdout);
                        
                        printf("\n>>> [%s] DUVIDOU DA APOSTA NA MESA! <<<\n", atual->name);
                        int total_reais = contar_dados_mesa(game_table, game_table->current_bet_face);
                        
                        printf("Abrindo os copos... havia %d dados de face [%d] (contando curingas '1')\n", total_reais, game_table->current_bet_face);
                        
                        Jogador *alvo = game_table->players[game_table->last_bet_player_id];
                        
                        if (total_reais >= game_table->current_bet_quantity) {
                            // Aposta era verdadeira ou maior. Duvidador perde!
                            printf("-> A aposta de %s cobriu! O desafiante [%s] perde um dado.\n", alvo->name, atual->name);
                            atual->dice_count--;
                            if (atual->dice_count <= 0) {
                                atual->estaVivo = false;
                                atual->status = ELIMINATED;
                                game_table->num_players_alive--;
                                printf("\n*** [%s] FOI ELIMINADO DA MESA! ***\n", atual->name);
                            }
                            // O perdedor começa a proxima aposta
                        } else {
                            // Aposta era falsa. Bettor perde!
                            printf("-> Faltaram dados!! A aposta de [%s] ruiu e ele perde um dado.\n", alvo->name);
                            alvo->dice_count--;
                            if (alvo->dice_count <= 0) {
                                alvo->estaVivo = false;
                                alvo->status = ELIMINATED;
                                game_table->num_players_alive--;
                                printf("\n*** [%s] FOI ELIMINADO DA MESA! ***\n", alvo->name);
                            }
                            game_table->current_player_index = game_table->last_bet_player_id; // Perdedor começa proxima
                        }
                        
                        ui_sleep_ms(4000);
                        
                        rodada_ativa = 0; // Finaliza loop pra reseta dados
                        entrada_valida = 1;
                    }
                }
                // PEDIR AS CONTAS (Sair)
                else if (op == 'P') {
                    atual->estaVivo = false;
                    atual->status = ELIMINATED;
                    game_table->num_players_alive--;
                    entrada_valida = 1;
                    if(game_table->last_bet_player_id == game_table->current_player_index) {
                        rodada_ativa = 0; // se o cara que fez a ultima aposta saiu, mesa derrete.
                    }
                } else {
                    printf("Opcao invalida.\n");
                }
            } // end loop entrada
            
            // Avança turno garantidamente para um vivo apenas se NINGUEM dubidou (continua circulando a mesa)
            if (rodada_ativa) {
                game_table->current_player_index = get_next_valid_player_index(game_table, game_table->current_player_index, is_alive);
            }
            
        } // end loop rodada_ativa
        
        // Verifica se quem deveria ditar o ritmo está morto. Se sim avança.
        if (!game_table->players[game_table->current_player_index]->estaVivo) {
             game_table->current_player_index = get_next_valid_player_index(game_table, game_table->current_player_index, is_alive);
        }

    } // end loop partida

    ui_clear_screen();
    int win_idx = get_next_valid_player_index(game_table, 0, is_alive);
    if (win_idx != -1) {
       printf("\n");
       char win_msg[128];
       snprintf(win_msg, sizeof(win_msg), "🏆  %s GANHOU NA SINUCA DOS DADOS  🏆", game_table->players[win_idx]->name);
       ui_print_box(win_msg, ANSI_BRIGHT_CYAN);
       printf("\nJSON_VICTORY: {\"winner\": \"%s\", \"totalPlayers\": %d}\n", game_table->players[win_idx]->name, num_players);
       fflush(stdout);
    }

    mem_free_mesa(game_table);
    return 0;
}
