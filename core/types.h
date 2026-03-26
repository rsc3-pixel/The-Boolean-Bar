#ifndef TYPES_H
#define TYPES_H

#include <stdbool.h> // Para usar bool

// --- Definições para Lógica Proposicional ---

// Enumeração para classificar o tipo de uma fórmula lógica
typedef enum {
    TAUTOLOGY,      // Sempre verdadeira
    CONTRADICTION,  // Sempre falsa
    CONTINGENCY     // Pode ser verdadeira ou falsa dependendo da atribuição
} FormulaType;

// Estrutura para representar uma "carta" (fórmula lógica)
typedef struct {
    char *formula_str;  // A representação da fórmula como string (ex: "(P AND NOT P)")
    FormulaType type;   // O tipo da fórmula (Tautologia, Contradição, Contingência)
    // Adicionar outros campos se necessário, como uma representação interna da AST
} Carta;

// --- Definições para Jogadores ---

// Enumeração para o status de um jogador
typedef enum {
    ALIVE,
    ELIMINATED
} PlayerStatus;

// Estrutura para representar um jogador
typedef struct {
    int id;                 // ID único do jogador
    char *name;             // Nome do jogador
    PlayerStatus status;    // Status atual (vivo ou eliminado)
    int score;              // Pontuação ou número de "vidas" restantes
    // Outros atributos do jogador, se necessário
} Jogador;

// --- Definições para o Jogo (Mesa) ---

// Constantes do jogo
#define MAX_PLAYERS 7
#define MAX_FORMULA_LENGTH 256 // Tamanho máximo para a string da fórmula

// Estrutura para representar o estado da mesa de jogo
typedef struct {
    Jogador *players[MAX_PLAYERS]; // Array de ponteiros para jogadores
    int num_players_alive;         // Quantidade de jogadores ainda no jogo
    Carta *current_card;           // A carta (fórmula) atualmente em jogo
    // Poderíamos ter aqui um "baralho" e um "descarte"
    // Ex: Carta **deck; int deck_size;
    // Ex: Carta **discard_pile; int discard_size;
    int current_player_index;      // Índice do jogador atual no turno
    bool game_over;                // Flag para indicar se o jogo terminou
    // Outros estados globais do jogo
} Mesa;

#endif // TYPES_H