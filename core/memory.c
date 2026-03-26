#include "memory.h"
#include <stdlib.h> // Para malloc, free, NULL
#include <string.h> // Para strdup
#include <stdio.h>  // Para fprintf, stderr

// --- Funções de Alocação (Criação) ---

Carta* mem_new_carta(const char *formula_str, FormulaType type) {
    if (!formula_str) {
        fprintf(stderr, "Erro: formula_str não pode ser NULL ao criar Carta.\n");
        return NULL;
    }

    Carta *new_card = (Carta *)malloc(sizeof(Carta));
    if (new_card == NULL) {
        fprintf(stderr, "Erro: Falha ao alocar memória para Carta.\n");
        return NULL;
    }

    new_card->formula_str = strdup(formula_str); // Duplica a string
    if (new_card->formula_str == NULL) {
        fprintf(stderr, "Erro: Falha ao alocar memória para formula_str da Carta.\n");
        free(new_card);
        return NULL;
    }

    new_card->type = type;
    return new_card;
}

Jogador* mem_new_jogador(int id, const char *name) {
    if (!name) {
        fprintf(stderr, "Erro: name não pode ser NULL ao criar Jogador.\n");
        return NULL;
    }

    Jogador *new_player = (Jogador *)malloc(sizeof(Jogador));
    if (new_player == NULL) {
        fprintf(stderr, "Erro: Falha ao alocar memória para Jogador.\n");
        return NULL;
    }

    new_player->name = strdup(name); // Duplica a string
    if (new_player->name == NULL) {
        fprintf(stderr, "Erro: Falha ao alocar memória para name do Jogador.\n");
        free(new_player);
        return NULL;
    }

    new_player->id = id;
    new_player->status = ALIVE; // Jogador começa vivo
    new_player->score = 3;      // Exemplo: 3 vidas iniciais
    return new_player;
}

// --- Funções de Alocação (Criação) para Mesa ---

Mesa* mem_new_mesa() {
    Mesa *new_table = (Mesa *)malloc(sizeof(Mesa));
    if (new_table == NULL) {
        fprintf(stderr, "Erro: Falha ao alocar memória para Mesa.\n");
        return NULL;
    }

    // Inicializar todos os campos da Mesa
    for (int i = 0; i < MAX_PLAYERS; i++) {
        new_table->players[i] = NULL; // Inicializa ponteiros de jogadores como NULL
    }
    new_table->num_players_alive = 0;
    new_table->current_card = NULL;
    new_table->current_player_index = 0;
    new_table->game_over = false;

    // O Dev 4 pode adicionar mais inicializações aqui, se necessário.

    return new_table;
}

// --- Funções de Desalocação (Liberação) ---

void mem_free_carta(Carta *card) {
    if (card == NULL) {
        return; // Nada para liberar
    }
    // O Dev 4 deve implementar a liberação da string da fórmula
    // e depois a própria estrutura Carta.
    // Exemplo:
    // free(card->formula_str);
    // free(card);
}

void mem_free_jogador(Jogador *player) {
    if (player == NULL) {
        return; // Nada para liberar
    }
    // O Dev 4 deve implementar a liberação da string do nome
    // e depois a própria estrutura Jogador.
    // Exemplo:
    // free(player->name);
    // free(player);
}

void mem_free_mesa(Mesa *table) {
    if (table == NULL) {
        return; // Nada para liberar
    }
    // O Dev 4 deve implementar a liberação de todos os jogadores no array 'players',
    // a carta atual 'current_card', e depois a própria estrutura Mesa.
    // Lembre-se de verificar se os ponteiros não são NULL antes de liberar.
    // Exemplo:
    // for (int i = 0; i < MAX_PLAYERS; i++) { if (table->players[i]) mem_free_jogador(table->players[i]); }
    // if (table->current_card) mem_free_carta(table->current_card);
    // free(table);
}