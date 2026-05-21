/*
 * logic_engine.c
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de avaliação de proposições lógicas booleanas.
 *
 * Suporta os conectivos:
 *   ~        Negação        (unário,  precedência 4)
 *   &        Conjunção      (binário, precedência 3)
 *   |        Disjunção      (binário, precedência 2)
 *   ->       Implicação     (binário, precedência 1)
 *   <->      Bicondicional  (binário, precedência 0)
 *
 * Algoritmo:
 *   1. Tokenização da string de entrada.
 *   2. Conversão infixa → RPN (Shunting-Yard de Dijkstra).
 *   3. Avaliação da RPN em pilha para cada linha da tabela verdade.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include "logic_engine.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>

/* ═══════════════════════════ Tipos internos ═══════════════════════════════ */

typedef enum {
    TOK_VAR,    /* variável proposicional: p, q, r … */
    TOK_NEG,    /* ~  */
    TOK_AND,    /* &  */
    TOK_OR,     /* |  */
    TOK_IMPL,   /* -> */
    TOK_BICOND, /* <-> */
    TOK_LPAREN, /* (  */
    TOK_RPAREN  /* )  */
} TipoToken;

typedef struct {
    TipoToken tipo;
    char      var; /* preenchido apenas quando tipo == TOK_VAR */
} Token;

/* ═══════════════════════════ Funções auxiliares ══════════════════════════ */

/**
 * @brief Retorna a precedência de um operador lógico.
 * Maior valor = maior prioridade de avaliação.
 * Ordem: ~ (4) > & (3) > | (2) > -> (1) > <-> (0).
 *
 * @param op Tipo do token operador.
 * @return Inteiro representando a precedência, ou -1 se não for operador.
 */
static int precedencia(TipoToken op)
{
    switch (op) {
        case TOK_NEG:    return 4;
        case TOK_AND:    return 3;
        case TOK_OR:     return 2;
        case TOK_IMPL:   return 1;
        case TOK_BICOND: return 0;
        default:         return -1;
    }
}

/**
 * @brief Verifica se um operador é associativo à direita.
 * Apenas a negação (~) é associativa à direita neste motor.
 *
 * @param op Tipo do token operador.
 * @return true se associativo à direita; false caso contrário.
 */
static bool assoc_direita(TipoToken op)
{
    return op == TOK_NEG;
}

/* ═══════════════════════════ Tokenizador ═════════════════════════════════ */

/**
 * @brief Converte a string de expressão em um vetor de tokens.
 *
 * Reconhece variáveis (letras), operadores (~, &, |, ->, <->)
 * e parênteses. Ignora espaços. O vetor retornado cresce dinamicamente.
 *
 * @param expr       String da expressão lógica.
 * @param num_tokens Saída: número de tokens gerados.
 * @return Vetor de Token alocado dinamicamente, ou NULL em caso de erro.
 *         O chamador deve liberar com free().
 */
static Token *tokenizar(const char *expr, int *num_tokens)
{
    int capacidade = 64;
    Token *tokens  = (Token *)malloc((size_t)capacidade * sizeof(Token));
    if (!tokens) return NULL;

    int n   = 0;
    int len = (int)strlen(expr);

    for (int i = 0; i < len; i++) {
        char c = expr[i];

        /* Ignora espaços */
        if (isspace((unsigned char)c)) continue;

        /* Verifica necessidade de redimensionamento */
        if (n >= capacidade - 1) {
            capacidade *= 2;
            Token *tmp = (Token *)realloc(tokens,
                                          (size_t)capacidade * sizeof(Token));
            if (!tmp) { free(tokens); return NULL; }
            tokens = tmp;
        }

        if (isalpha((unsigned char)c)) {
            /* Variável proposicional (letra minúscula ou maiúscula) */
            tokens[n].tipo = TOK_VAR;
            tokens[n].var  = (char)tolower((unsigned char)c);
            n++;
        } else if (c == '~') {
            tokens[n++].tipo = TOK_NEG;
        } else if (c == '&') {
            tokens[n++].tipo = TOK_AND;
        } else if (c == '|') {
            tokens[n++].tipo = TOK_OR;
        } else if (c == '-' && i + 1 < len && expr[i + 1] == '>') {
            tokens[n++].tipo = TOK_IMPL;
            i++; /* consome '>' */
        } else if (c == '<' && i + 2 < len &&
                   expr[i + 1] == '-' && expr[i + 2] == '>') {
            tokens[n++].tipo = TOK_BICOND;
            i += 2; /* consome '->' */
        } else if (c == '(') {
            tokens[n++].tipo = TOK_LPAREN;
        } else if (c == ')') {
            tokens[n++].tipo = TOK_RPAREN;
        } else {
            fprintf(stderr, "[logic_engine] Caractere inválido: '%c'\n", c);
            free(tokens);
            return NULL;
        }
    }

    *num_tokens = n;
    return tokens;
}

/* ═══════════════════════════ Shunting-Yard ══════════════════════════════ */

/**
 * @brief Converte tokens em ordem infixa para Notação Polonesa Reversa (RPN).
 *
 * Implementa o algoritmo de Shunting-Yard de Dijkstra, respeitando
 * precedência e associatividade dos operadores lógicos.
 *
 * @param tokens     Vetor de tokens em ordem infixa.
 * @param num_tokens Quantidade de tokens no vetor.
 * @param rpn_out    Buffer de saída (capacidade >= num_tokens).
 * @return Número de tokens escritos em rpn_out, ou -1 em caso de erro
 *         (parêntese desbalanceado ou falha de alocação).
 */
static int infix_para_rpn(const Token *tokens, int num_tokens,
                           Token *rpn_out)
{
    /* Pilha de operadores (máx. igual ao total de tokens) */
    Token *pilha    = (Token *)malloc((size_t)num_tokens * sizeof(Token));
    if (!pilha) return -1;

    int topo  = -1;   /* índice do topo da pilha */
    int n_rpn = 0;    /* quantidade de tokens na saída */

    for (int i = 0; i < num_tokens; i++) {
        Token t = tokens[i];

        if (t.tipo == TOK_VAR) {
            /* Operando → vai direto para a saída */
            rpn_out[n_rpn++] = t;
        } else if (t.tipo == TOK_LPAREN) {
            pilha[++topo] = t;
        } else if (t.tipo == TOK_RPAREN) {
            /* Desempilha até encontrar o '(' correspondente */
            while (topo >= 0 && pilha[topo].tipo != TOK_LPAREN) {
                rpn_out[n_rpn++] = pilha[topo--];
            }
            if (topo < 0) {
                fprintf(stderr, "[logic_engine] Parêntese desbalanceado.\n");
                free(pilha);
                return -1;
            }
            topo--; /* descarta o '(' */
        } else {
            /* Operador: desempilha enquanto houver operador de maior/igual
             * precedência no topo (respeitando associatividade). */
            while (topo >= 0 &&
                   pilha[topo].tipo != TOK_LPAREN &&
                   (precedencia(pilha[topo].tipo) > precedencia(t.tipo) ||
                    (precedencia(pilha[topo].tipo) == precedencia(t.tipo) &&
                     !assoc_direita(t.tipo)))) {
                rpn_out[n_rpn++] = pilha[topo--];
            }
            pilha[++topo] = t;
        }
    }

    /* Esvazia o restante da pilha */
    while (topo >= 0) {
        if (pilha[topo].tipo == TOK_LPAREN) {
            fprintf(stderr, "[logic_engine] Parêntese desbalanceado.\n");
            free(pilha);
            return -1;
        }
        rpn_out[n_rpn++] = pilha[topo--];
    }

    free(pilha);
    return n_rpn;
}

/* ═══════════════════════════ Avaliador de RPN ════════════════════════════ */

/**
 * @brief Avalia uma expressão em RPN para uma atribuição de variáveis.
 *
 * Usa uma pilha de booleanos. Variáveis são substituídas pelo valor em
 * @p valores; operadores consomem operandos e empilham o resultado.
 *
 * @param rpn      Vetor de tokens em ordem RPN.
 * @param n_rpn    Quantidade de tokens em @p rpn.
 * @param vars     Vetor com os identificadores das variáveis (ex: "pq").
 * @param valores  Vetor de valores booleanos para cada variável.
 * @param num_vars Número de variáveis em @p vars / @p valores.
 * @return Resultado booleano da expressão, ou false em caso de erro interno.
 */
static bool avaliar_rpn(const Token *rpn, int n_rpn,
                         const char *vars, const bool *valores, int num_vars)
{
    bool *pilha = (bool *)malloc((size_t)n_rpn * sizeof(bool));
    if (!pilha) return false;

    int topo = -1;

    for (int i = 0; i < n_rpn; i++) {
        Token t = rpn[i];

        if (t.tipo == TOK_VAR) {
            /* Busca o valor atribuído à variável */
            bool val = false;
            for (int v = 0; v < num_vars; v++) {
                if (vars[v] == t.var) { val = valores[v]; break; }
            }
            pilha[++topo] = val;
        } else if (t.tipo == TOK_NEG) {
            if (topo < 0) { free(pilha); return false; }
            pilha[topo] = !pilha[topo];
        } else {
            /* Operador binário: consome dois operandos */
            if (topo < 1) { free(pilha); return false; }
            bool b = pilha[topo--];
            bool a = pilha[topo--];
            bool res = false;

            switch (t.tipo) {
                case TOK_AND:    res = a && b;              break;
                case TOK_OR:     res = a || b;              break;
                case TOK_IMPL:   res = (!a) || b;           break;
                case TOK_BICOND: res = (a && b) || (!a && !b); break;
                default: break;
            }
            pilha[++topo] = res;
        }
    }

    bool resultado = (topo >= 0) ? pilha[topo] : false;
    free(pilha);
    return resultado;
}

/* ═══════════════════════════ API pública ════════════════════════════════ */

/**
 * @brief Extrai as variáveis únicas de uma expressão lógica.
 *
 * Varre @p expr e preenche @p vars_out com as variáveis únicas
 * em ordem de primeira aparição, normalizadas para minúsculas.
 *
 * @param expr     String da expressão lógica.
 * @param vars_out Buffer de saída (capacidade mínima: 26 chars).
 * @return Número de variáveis únicas encontradas (0–26).
 */
int extrair_variaveis(const char *expr, char *vars_out)
{
    int count = 0;
    for (int i = 0; expr[i] != '\0'; i++) {
        char c = (char)tolower((unsigned char)expr[i]);
        if (!isalpha((unsigned char)c)) continue;

        /* Verifica se já foi registrada */
        bool encontrada = false;
        for (int v = 0; v < count; v++) {
            if (vars_out[v] == c) { encontrada = true; break; }
        }
        if (!encontrada && count < 26) {
            vars_out[count++] = c;
        }
    }
    return count;
}

/**
 * @brief Cria e preenche a tabela verdade completa para uma expressão lógica.
 *
 * Pipeline interno: tokenização → Shunting-Yard (infix→RPN) → avaliação
 * por linha → classificação final (TAUTOLOGIA / CONTRADICAO / CONTINGENCIA).
 *
 * @param expr String da expressão proposicional.
 * @return Ponteiro para TabelaVerdade alocada, ou NULL em caso de erro.
 *         O chamador deve liberar com liberar_tabela().
 */
TabelaVerdade *gerar_tabela_verdade(const char *expr)
{
    TabelaVerdade *tv = (TabelaVerdade *)calloc(1, sizeof(TabelaVerdade));
    if (!tv) return NULL;

    /* 1. Extrai variáveis */
    tv->num_vars = extrair_variaveis(expr, tv->vars);
    if (tv->num_vars == 0) {
        fprintf(stderr, "[logic_engine] Nenhuma variável encontrada.\n");
        free(tv);
        return NULL;
    }

    tv->num_linhas = 1 << tv->num_vars; /* 2^n */

    /* 2. Tokeniza a expressão */
    int    num_tokens = 0;
    Token *tokens     = tokenizar(expr, &num_tokens);
    if (!tokens) { free(tv); return NULL; }

    /* 3. Converte para RPN */
    Token *rpn    = (Token *)malloc((size_t)num_tokens * sizeof(Token));
    if (!rpn) { free(tokens); free(tv); return NULL; }

    int n_rpn = infix_para_rpn(tokens, num_tokens, rpn);
    free(tokens);

    if (n_rpn < 0) { free(rpn); free(tv); return NULL; }

    /* 4. Aloca matriz de combinações e vetor de resultados */
    tv->combinacoes = (bool **)malloc((size_t)tv->num_linhas * sizeof(bool *));
    tv->resultados  = (bool  *)malloc((size_t)tv->num_linhas * sizeof(bool));

    if (!tv->combinacoes || !tv->resultados) {
        free(rpn);
        liberar_tabela(tv);
        return NULL;
    }

    for (int i = 0; i < tv->num_linhas; i++) {
        tv->combinacoes[i] = (bool *)malloc((size_t)tv->num_vars * sizeof(bool));
        if (!tv->combinacoes[i]) {
            /* Marca as linhas não alocadas como NULL para liberar_tabela */
            for (int j = i + 1; j < tv->num_linhas; j++)
                tv->combinacoes[j] = NULL;
            free(rpn);
            liberar_tabela(tv);
            return NULL;
        }
    }

    /* 5. Preenche combinações (ordem lexicográfica: F…F até T…T) */
    for (int linha = 0; linha < tv->num_linhas; linha++) {
        for (int v = 0; v < tv->num_vars; v++) {
            /* O bit correspondente à variável v na linha */
            int bit = tv->num_vars - 1 - v;
            tv->combinacoes[linha][v] = (bool)((linha >> bit) & 1);
        }
        tv->resultados[linha] = avaliar_rpn(rpn, n_rpn,
                                             tv->vars,
                                             tv->combinacoes[linha],
                                             tv->num_vars);
    }

    free(rpn);

    /* 6. Classifica */
    bool tem_true  = false;
    bool tem_false = false;
    for (int i = 0; i < tv->num_linhas; i++) {
        if (tv->resultados[i]) tem_true  = true;
        else                   tem_false = true;
    }

    if (tem_true && !tem_false)       tv->classificacao = TAUTOLOGIA;
    else if (!tem_true && tem_false)  tv->classificacao = CONTRADICAO;
    else                              tv->classificacao = CONTINGENCIA;

    return tv;
}

/**
 * @brief Converte um valor de Classificacao para string legível.
 *
 * @param c Classificação a converter.
 * @return String estática: "TAUTOLOGIA", "CONTRADIÇÃO" ou "CONTINGÊNCIA".
 */
const char *classificacao_str(Classificacao c)
{
    switch (c) {
        case TAUTOLOGIA:  return "TAUTOLOGIA";
        case CONTRADICAO: return "CONTRADIÇÃO";
        default:          return "CONTINGÊNCIA";
    }
}

/**
 * @brief Imprime a tabela verdade formatada no stdout.
 *
 * @param tv   Ponteiro para a tabela a ser impressa.
 * @param expr String original da expressão (usada no cabeçalho).
 */
void imprimir_tabela(const TabelaVerdade *tv, const char *expr)
{
    if (!tv) return;

    /* Cabeçalho */
    printf("\n╔══ Tabela Verdade: %s ══╗\n", expr);
    printf("  ");
    for (int v = 0; v < tv->num_vars; v++)
        printf(" %c ", tv->vars[v]);
    printf("│ Resultado\n");

    /* Separador */
    printf("  ");
    for (int v = 0; v < tv->num_vars; v++) printf("───");
    printf("┼──────────\n");

    /* Linhas */
    for (int linha = 0; linha < tv->num_linhas; linha++) {
        printf("  ");
        for (int v = 0; v < tv->num_vars; v++)
            printf(" %c ", tv->combinacoes[linha][v] ? 'V' : 'F');
        printf("│    %c\n", tv->resultados[linha] ? 'V' : 'F');
    }

    printf("\n  Classificação: %s\n\n", classificacao_str(tv->classificacao));
}

/**
 * @brief Libera todos os recursos alocados por uma TabelaVerdade.
 *
 * @param tv Ponteiro para a tabela a ser liberada. NULL é tratado com segurança.
 */
void liberar_tabela(TabelaVerdade *tv)
{
    if (!tv) return;
    if (tv->combinacoes) {
        for (int i = 0; i < tv->num_linhas; i++)
            free(tv->combinacoes[i]);
        free(tv->combinacoes);
    }
    free(tv->resultados);
    free(tv);
}
