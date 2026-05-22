#ifndef TYPES_H
#define TYPES_H

#include <stdbool.h>

/** @defgroup LogicMode Lógica Proposicional
 *  Tipos e estruturas usados no modo Boolean Bar (cartas + roleta).
 *  @{
 */

/**
 * @brief Classifica o tipo lógico de uma fórmula proposicional.
 *
 * Os valores são intencionalmente compatíveis por índice com o enum
 * Classificacao de logic_engine.h (TAUTOLOGY=0, CONTRADICTION=1, CONTINGENCY=2).
 */
typedef enum {
    TAUTOLOGY,     /**< Fórmula sempre verdadeira (tautologia). */
    CONTRADICTION, /**< Fórmula sempre falsa (contradição). */
    CONTINGENCY    /**< Fórmula que pode ser verdadeira ou falsa. */
} FormulaType;

/**
 * @brief Representa uma carta do jogo: uma fórmula lógica proposicional.
 */
typedef struct {
    char *formula_str; /**< Fórmula como string (ex: "p & ~q"). Alocada dinamicamente. */
    FormulaType type;  /**< Tipo real da fórmula, avaliado pelo logic_engine. */
} Carta;

/** @} */

/** @defgroup Players Jogadores e Modos
 *  Tipos relacionados a jogadores e ao modo de jogo ativo.
 *  @{
 */

/**
 * @brief Modo de jogo ativo na sessão.
 */
typedef enum {
    MODE_LOGIC, /**< Modo Boolean Bar: cartas lógicas + roleta russa. */
    MODE_DICE   /**< Modo Liar's Dice: apostas com dados. */
} GameMode;

/**
 * @brief Status atual de um jogador na partida.
 */
typedef enum {
    ALIVE,      /**< Jogador ainda está na partida. */
    ELIMINATED  /**< Jogador foi eliminado. */
} PlayerStatus;

/**
 * @brief Representa um jogador, compatível com os dois modos de jogo.
 */
typedef struct {
    int id;              /**< ID único do jogador (1-based). */
    char *name;          /**< Nome do jogador. Alocado dinamicamente. */
    PlayerStatus status; /**< Status atual: ALIVE ou ELIMINATED. */
    bool estaVivo;       /**< Atalho booleano para filtros de jogador vivo. */
    int score;           /**< Vidas restantes (Logic Mode). NÃO REUSAR PARA PONTOS. */
    int points;          /**< Pontuação acumulada do jogador (Modo Dados). */

    /* Logic Mode */
    Carta *hand[5];  /**< Mão do jogador: até 5 cartas lógicas. */
    int num_cards;   /**< Número de cartas atualmente na mão (0–5). */

    /* Dice Mode */
    int dice[5];     /**< Faces dos dados do jogador (valores 1–6). */
    int dice_count;  /**< Quantidade de dados ainda disponíveis. */
} Jogador;

/** @} */

/** @defgroup Table Mesa de Jogo
 *  Estruturas e constantes que representam o estado global da partida.
 *  @{
 */

#define MAX_PLAYERS       8   /**< Máximo de jogadores suportados por mesa. */
#define MAX_FORMULA_LENGTH 256 /**< Tamanho máximo da string de uma fórmula. */

/**
 * @brief Estado completo da mesa de jogo, compartilhado pelos dois modos.
 */
typedef struct {
    GameMode mode;                  /**< Modo de jogo ativo (Logic ou Dice). */
    Jogador *players[MAX_PLAYERS];  /**< Ponteiros para os jogadores; slots vazios são NULL. */
    int num_players_alive;          /**< Quantidade de jogadores ainda na partida. */
    int current_player_index;       /**< Índice do jogador cujo turno é o atual. */
    bool game_over;                 /**< true quando a partida foi encerrada. */
    int total_rounds;               /**< Contador de rodadas (Dice Mode). */

    /* Logic Mode */
    Carta *current_card;    /**< Carta em disputa no turno atual. */
    int balas_no_tambor;    /**< Balas no tambor: define a probabilidade da roleta (1–6). */

    /* Dice Mode */
    int current_bet_quantity; /**< Quantidade apostada na rodada atual. */
    int current_bet_face;     /**< Face apostada na rodada atual (1–6). */
    int last_bet_player_id;   /**< ID do jogador que fez a aposta vigente. */
} Mesa;

/** @} */

#endif // TYPES_H