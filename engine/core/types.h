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

// Enumeração para modo de jogo
typedef enum {
    MODE_LOGIC,     // Jogo de Roleta C/ Verdade (Cartas)
    MODE_DICE       // Liar's Dice
} GameMode;

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
    bool estaVivo;          // Campo para facilitar filtro booleano (UH7)
    int score;              // Pontuação ou número de "vidas" restantes
    
    // Pontuação e bônus (para relatório final)
    int final_score;        // Pontuação final ao término do jogo
    int bonus_survival;     // Bônus por sobrevivência
    int bonus_rounds;       // Bônus por rodadas jogadas
    int bonus_accuracy;     // Bônus por acertos (dúvidas/acusações corretas)
    
    // Logic Mode
    Carta *hand[5];         // Mão com até 5 cartas
    int num_cards;          // Número atual de cartas na mão
    int correct_doubts;     // Quantas dúvidas corretas fez

    // Dice Mode
    int dice[5];            // Faces dos dados: valores de 1 a 6
    int dice_count;         // Quantos dados sobraram a ele
    int correct_challenges; // Quantas dúvidas corretas fez no dice
} Jogador;

// --- Definições para o Jogo (Mesa) ---

// Constantes do jogo
#define MAX_PLAYERS 8
#define MAX_FORMULA_LENGTH 256 // Tamanho máximo para a string da fórmula

// Estrutura para representar o estado da mesa de jogo
typedef struct {
    GameMode mode;                 // Modo atual do jogo
    Jogador *players[MAX_PLAYERS]; // Array de ponteiros para jogadores
    int num_players_alive;         // Quantidade de jogadores ainda no jogo
    int current_player_index;      // Índice do jogador atual no turno
    bool game_over;                // Flag para indicar se o jogo terminou
    
    // Rastreamento de rodadas e pontuação
    int num_rounds;                // Contador de rodadas do jogo
    int num_players_initial;       // Total inicial de jogadores (para cálculos)

    // Logic Mode
    Carta *current_card;           // A carta (fórmula) atualmente em jogo
    int balas_no_tambor;           // Capacidade do tambor e probabilidade de tiro (UH9)

    // Dice Mode
    int current_bet_quantity;      // Aposta Atual: Quantidade
    int current_bet_face;          // Aposta Atual: Face do dado
    int last_bet_player_id;        // Quem mandou a aposta vigente
} Mesa;

#endif // TYPES_H