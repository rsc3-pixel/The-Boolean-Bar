#include "game_flow.h"
#include "../core/memory.h"      // Para mem_new_mesa, mem_new_jogador, mem_free_mesa, etc.
#include "deck_manager.h"    // Para deck_generate_random_formula_string
#include "logic_engine.h"    // Para logic_evaluate_formula (futuramente)
#include <stdio.h>           // Para printf, fprintf, stderr
#include <stdlib.h>          // Para exit, rand, srand
#include <time.h>            // Para time (para seed do srand)

// Implementação da função game_start
int game_start() {
    // Inicializa o gerador de números aleatórios uma única vez
    srand(time(NULL));

    // --- Tarefas para o Dev 5 (Backend - C Expert): ---
    // 1. Inicializar a Mesa:
    //    - Chamar mem_new_mesa() para criar a estrutura da mesa.
    //    - Verificar se a alocação foi bem-sucedida.
    Mesa *game_table = mem_new_mesa();
    if (game_table == NULL) {
        fprintf(stderr, "Erro: Falha ao inicializar a mesa de jogo.\n");
        return 1; // Código de erro
    }

    // 2. Inicializar Jogadores:
    //    - Criar MAX_PLAYERS jogadores usando mem_new_jogador().
    //    - Adicionar esses jogadores ao array `players` da `Mesa`.
    //    - Atualizar `num_players_alive`.
    printf("Inicializando jogadores...\n");
    for (int i = 0; i < MAX_PLAYERS; i++) {
        char player_name[20];
        sprintf(player_name, "Jogador %d", i + 1);
        Jogador *player = mem_new_jogador(i + 1, player_name);
        if (player == NULL) {
            fprintf(stderr, "Erro: Falha ao criar jogador %d.\n", i + 1);
            // Lógica para liberar recursos já alocados antes de sair
            mem_free_mesa(game_table); // Libera a mesa e jogadores já criados
            return 1;
        }
        game_table->players[i] = player;
        game_table->num_players_alive++;
        printf("  - %s (ID: %d) entrou no bar.\n", player->name, player->id);
    }

    // 3. Implementar o Loop Principal do Jogo:
    //    - Gerenciar os turnos dos jogadores.
    //    - Chamar deck_generate_random_formula_string() para obter uma nova carta.
    //    - Interagir com o jogador atual para obter a afirmação.
    //    - Chamar logic_evaluate_formula() para verificar a afirmação (quando Dev 2 terminar).
    //    - Aplicar as regras do jogo (Roleta Russa, eliminação de jogadores).
    //    - Atualizar o estado da `Mesa` e verificar `game_over`.
    printf("\nJogo iniciado com %d jogadores!\n", game_table->num_players_alive);
    while (!game_table->game_over) {
        // Lógica do turno aqui
        printf("Turno do %s (ID: %d)\n", game_table->players[game_table->current_player_index]->name, game_table->players[game_table->current_player_index]->id);

        // Exemplo de como obter uma carta (Dev 3)
        char *formula = deck_generate_random_formula_string();
        printf("  Carta jogada: %s\n", formula);
        // Lembre-se de liberar 'formula' quando não for mais necessário
        free(formula); // Temporário, será gerenciado por mem_free_carta depois

        // Lógica para avançar o turno ou terminar o jogo
        game_table->current_player_index = (game_table->current_player_index + 1) % MAX_PLAYERS;
        // Para evitar loop infinito no placeholder, vamos terminar o jogo após alguns turnos
        static int turns_played = 0;
        turns_played++;
        if (turns_played > 3) { // Apenas para demonstração
            game_table->game_over = true;
        }
    }

    printf("\nJogo encerrado.\n");

    // 4. Limpeza Final:
    //    - Chamar mem_free_mesa() para liberar toda a memória alocada.
    mem_free_mesa(game_table);

    return 0; // Sucesso
}