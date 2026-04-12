#include "logic_engine.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

// Parser recursivo simples para avaliar a fórmula
// Suporta: P, Q, R, AND, OR, NOT, (, )
typedef struct {
    const char *str;
    int pos;
    bool p_val, q_val, r_val;
} Parser;

static void skip_whitespace(Parser *p) {
    while (isspace(p->str[p->pos])) p->pos++;
}

static bool match(Parser *p, const char *word) {
    skip_whitespace(p);
    int len = strlen(word);
    if (strncmp(&p->str[p->pos], word, len) == 0) {
        // Verifica se é o fim da palavra
        char next = p->str[p->pos + len];
        if (!isalpha(next)) {
            p->pos += len;
            return true;
        }
    }
    return false;
}

static bool parse_expr(Parser *p);

static bool parse_factor(Parser *p) {
    skip_whitespace(p);
    if (match(p, "NOT")) {
        return !parse_factor(p);
    } else if (p->str[p->pos] == '(') {
        p->pos++;
        bool val = parse_expr(p);
        skip_whitespace(p);
        if (p->str[p->pos] == ')') p->pos++;
        return val;
    } else if (match(p, "P")) {
        return p->p_val;
    } else if (match(p, "Q")) {
        return p->q_val;
    } else if (match(p, "R")) {
        return p->r_val;
    }
    return false; // Error fallback
}

static bool parse_term(Parser *p) {
    bool val = parse_factor(p);
    skip_whitespace(p);
    while (match(p, "AND")) {
        bool right = parse_factor(p);
        val = val && right;
        skip_whitespace(p);
    }
    return val;
}

static bool parse_expr(Parser *p) {
    bool val = parse_term(p);
    skip_whitespace(p);
    while (match(p, "OR")) {
        bool right = parse_term(p);
        val = val || right;
        skip_whitespace(p);
    }
    return val;
}

FormulaType logic_evaluate_formula(const char *formula_str) {
    if (formula_str == NULL || strlen(formula_str) == 0) {
        return CONTINGENCY;
    }

    int true_count = 0;
    int false_count = 0;

    // Tabela verdade de 3 variaveis (P, Q, R) = 8 linhas
    for (int i = 0; i < 8; i++) {
        Parser p = {formula_str, 0, (i & 4) != 0, (i & 2) != 0, (i & 1) != 0};
        bool result = parse_expr(&p);
        
        if (result) true_count++;
        else false_count++;
    }

    if (true_count == 8) return TAUTOLOGY;
    if (false_count == 8) return CONTRADICTION;
    return CONTINGENCY;
}