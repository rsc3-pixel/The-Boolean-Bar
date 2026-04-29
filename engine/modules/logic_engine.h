#ifndef LOGIC_ENGINE_H
#define LOGIC_ENGINE_H

#include <stdbool.h>

/* Classificação da proposição lógica */
typedef enum {
    TAUTOLOGIA,
    CONTRADICAO,
    CONTINGENCIA
} Classificacao;

/* Tabela verdade gerada */
typedef struct {
    int     num_vars;           /* número de variáveis únicas */
    char    vars[26];           /* identificadores das variáveis */
    int     num_linhas;         /* 2^num_vars */
    bool  **combinacoes;        /* matriz [num_linhas][num_vars] */
    bool   *resultados;         /* vetor de resultados */
    Classificacao classificacao;
} TabelaVerdade;

/* API pública */
int          extrair_variaveis(const char *expr, char *vars_out);
TabelaVerdade *gerar_tabela_verdade(const char *expr);
void          imprimir_tabela(const TabelaVerdade *tv, const char *expr);
void          liberar_tabela(TabelaVerdade *tv);
const char   *classificacao_str(Classificacao c);

#endif /* LOGIC_ENGINE_H */
