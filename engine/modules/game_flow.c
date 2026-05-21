/*
 * THE BOOLEAN BAR - MOTOR DE REGRAS E FLUXO DE JOGO
 * Autor: Matheus Larré
 * Sprint: 1 (Concluída)
 * Descrição: Implementação da Máquina de Estados Básica, ciclo de jogo 
 * e invocação da avaliação de Tautologia e punição da roleta russa.
 */
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

/**
 * @brief Distribui 5 cartas aleatórias para um jogador no início da partida.
 *
 * @param p Ponteiro para o Jogador que receberá as cartas.
 */
static void dar_cartas_iniciais(Jogador *p) {
    while (p->num_cards < 5) {
        char *fstr = deck_generate_random_formula_string();
        FormulaType type = CONTINGENCY; // Nao revelamos o real, so validado via engine dps
        p->hand[p->num_cards] = mem_new_carta(fstr, type);
        free(fstr); // string foi copiada pra dentro de carta
        p->num_cards++;
    }
}

/**
 * @brief Repõe uma carta na mão do jogador após ele descartar durante o turno.
 *
 * @param p Ponteiro para o Jogador que receberá a nova carta.
 */
static void repor_carta(Jogador *p) {
    char *fstr = deck_generate_random_formula_string();
    p->hand[p->num_cards] = mem_new_carta(fstr, CONTINGENCY);
    p->num_cards++;
}

/**
 * @brief Emite o estado atual da mesa como JSON via stdout para o frontend.
 *
 * Serializa jogadores, mão do jogador atual, turno e balas no tambor
 * no formato esperado pelo hook useGameEngine do frontend (JSON_STATE).
 *
 * @param m           Ponteiro para a mesa de jogo.
 * @param num_players Número total de jogadores na partida.
 */
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

/**
 * @brief Executa a mecânica da roleta russa para o jogador que perdeu o confronto.
 *
 * Sorteia um número de 1 a 6 e compara com as balas no tambor.
 * Se o número sorteado for <= balas, o jogador é eliminado.
 * Se sobreviver, perde uma vida e o tambor incrementa (+1 bala para a próxima vez).
 * Emite JSON_ROULETTE_RESULT via stdout para o frontend.
 *
 * @param m        Ponteiro para a mesa de jogo (atualiza balas e jogadores vivos).
 * @param perdedor Ponteiro para o Jogador que vai puxar o gatilho.
 */
static void roleta_russa(Mesa *m, Jogador *perdedor) {
    // ─── Animated roulette spin ───
    ui_print_roulette_spin(perdedor->name, m->balas_no_tambor);

    int tambor = (rand() % 6) + 1;
    if (tambor <= m->balas_no_tambor) { // Falhou (BANG!)
        ui_print_bang_art(perdedor->name);
        perdedor->estaVivo = false;
        perdedor->status = ELIMINATED;
        perdedor->score = 0;
        m->num_players_alive--;
        m->balas_no_tambor = 1; // Reseta risco na morte
    } else {
        ui_print_survival_art(perdedor->name);
        perdedor->score--;
        m->balas_no_tambor++; // Incrementa risco
        if (perdedor->score <= 0) {
            perdedor->estaVivo = false;
            perdedor->status = ELIMINATED;
            m->num_players_alive--;
            m->balas_no_tambor = 1; // Reseta se morreu pelas vidas

            printf("\n");
            char msg[128];
            snprintf(msg, sizeof(msg), "%s sucumbiu por falta de vidas.", perdedor->name);
            ui_print_box(msg, ANSI_BRIGHT_RED);
            printf("\n");
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


/**
 * @brief Ponto de entrada do modo Boolean Bar: inicializa e executa a partida.
 *
 * Lê número de jogadores e nomes via stdin, distribui cartas, gerencia o loop
 * de turnos (escolha de carta, blefe, dúvida, confronto lógico, roleta russa)
 * e emite eventos JSON via stdout até restar um único sobrevivente.
 *
 * @return 0 se a partida terminou com sucesso, ou 1 em caso de erro de alocação.
 */
int game_start() {
    srand(time(NULL));

    Mesa *game_table = mem_new_mesa();
    if (game_table == NULL) return 1;

    // Lê o número de jogadores
    char count_buf[16];
    int num_players = MAX_PLAYERS; // fallback
    printf("Quantos jogadores na mesa? (min 2, max %d): ", MAX_PLAYERS);
    fflush(stdout);
    if (fgets(count_buf, sizeof(count_buf), stdin) != NULL) {
        num_players = atoi(count_buf);
        if (num_players < 2)  num_players = 2;
        if (num_players > MAX_PLAYERS) num_players = MAX_PLAYERS;
    }

    // Lê os N nomes
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
            printf("\n");
            ui_print_box("CONFRONTO LOGICO", ANSI_BRIGHT_CYAN);
            printf("\n");
            // Sprint 1 do Matheus refatorou a API: agora vai por gerar_tabela_verdade.
            // Os enums FormulaType (types.h) e Classificacao (logic_engine.h) batem
            // por índice (TAUTOLOGY=TAUTOLOGIA=0, CONTRADICTION=CONTRADICAO=1, etc.).
            TabelaVerdade *tv = gerar_tabela_verdade(jogada->formula_str);
            FormulaType real_type = (FormulaType) tv->classificacao;
            liberar_tabela(tv);
            const char *type_names[] = {"TAUTOLOGIA", "CONTRADICAO", "CONTINGENCIA"};
            printf("  %sTipo Real:%s  %s%s%s\n",
                   ANSI_STEEL_GRAY, ANSI_COLOR_RESET,
                   ANSI_STYLE_BOLD ANSI_BRIGHT_CYAN,
                   type_names[(int)real_type],
                   ANSI_COLOR_RESET);
            bool mentiu = (real_type != afirmacao);

            Jogador *perdedor_confronto = mentiu ? atual : oponente;

            // Emite quem perdeu o confronto lógico para o frontend
            printf("\nJSON_DOUBT_RESULT: {\"loser\": \"%s\", \"bluffed\": %s, \"realType\": %d}\n",
                   perdedor_confronto->name,
                   mentiu ? "true" : "false",
                   (int)real_type);
            fflush(stdout);

            if (mentiu) {
               printf("\n  %s🚨 BLEFE DESMASCARADO!%s ", STYLE_BANG, ANSI_COLOR_RESET);
               printf("%s[%s] perde a aposta.%s\n", ANSI_BRIGHT_YELLOW, atual->name, ANSI_COLOR_RESET);
               ui_sleep_ms(800);
               roleta_russa(game_table, atual);
            } else {
               printf("\n  %s✓ ERA VERDADE!%s ", STYLE_SURVIVAL, ANSI_COLOR_RESET);
               printf("%s[%s] duvidou injustamente.%s\n", ANSI_BRIGHT_YELLOW, oponente->name, ANSI_COLOR_RESET);
               ui_sleep_ms(800);
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
       printf("\n");
       char win_msg[128];
       snprintf(win_msg, sizeof(win_msg), "🏆  %s  🏆", game_table->players[win_idx]->name);
       ui_print_box(win_msg, ANSI_TOXIC_GREEN);
       printf("\n  %sÚnico sobrevivente do Boolean Bar. A casa agradece!%s\n\n",
              STYLE_SURVIVAL, ANSI_COLOR_RESET);

       printf("\nJSON_VICTORY: {\"winner\": \"%s\", \"totalPlayers\": %d}\n",
              game_table->players[win_idx]->name, num_players);
       fflush(stdout);
    }

    mem_free_mesa(game_table);

    return 0;
}