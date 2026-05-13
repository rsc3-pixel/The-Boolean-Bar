#ifndef DICE_ENGINE_H
#define DICE_ENGINE_H

#include <stdbool.h>

/* Representa um jogador no Liar's Dice */
typedef struct {
    char nome[32];   /* nome do jogador             */
    int *dados;      /* vetor com os valores dos dados */
    int  num_dados;  /* quantidade de dados          */
} Jogador;

/* Representa uma aposta feita na rodada */
typedef struct {
    int quantidade;  /* quantos dados com aquela face */
    int face;        /* face apostada (1–6)           */
} Aposta;

/* Resultado detalhado da avaliação */
typedef struct {
    int  total_contado;      /* dados com a face apostada          */
    int  contagem_face;      /* idêntico a total_contado (sem curinga) */
    bool aposta_verdadeira;  /* true = aposta válida; false = mentira  */
} ResultadoAvaliacao;

/* API pública */
Jogador          *criar_jogador(const char *nome, const int *dados, int num_dados);
void              liberar_jogador(Jogador *j);
ResultadoAvaliacao avaliar_aposta(const Aposta *aposta,
                                  Jogador * const *jogadores,
                                  int num_jogadores);
void              imprimir_resultado(const ResultadoAvaliacao *res,
                                     const Aposta *aposta);

#endif /* DICE_ENGINE_H */
