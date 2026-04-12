#include "deck_manager.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

char* deck_generate_random_formula_string() {
    // Array de variaveis: P, Q, R
    // Operadores binários: AND, OR
    // Operador unário: NOT
    
    char buffer[256];
    
    int model = rand() % 5;
    const char *vars[] = {"P", "Q", "R"};
    const char *ops[] = {"AND", "OR"};
    
    const char *v1 = vars[rand() % 3];
    const char *v2 = vars[rand() % 3];
    const char *o = ops[rand() % 2];
    
    switch (model) {
        case 0: // Tautology garantida: P OR NOT P
            sprintf(buffer, "( %s OR NOT %s )", v1, v1);
            break;
        case 1: // Contradiction garantida: P AND NOT P
            sprintf(buffer, "( %s AND NOT %s )", v1, v1);
            break;
        case 2: // Expressao basica
            sprintf(buffer, "( %s %s %s )", v1, o, v2);
            break;
        case 3: // Expressao c/ not
            sprintf(buffer, "NOT ( %s %s %s )", v1, o, v2);
            break;
        case 4: { // 3 variaveis
            const char *v3 = vars[rand() % 3];
            const char *o2 = ops[rand() % 2];
            sprintf(buffer, "( ( %s %s %s ) %s %s )", v1, o, v2, o2, v3);
            break;
        }
    }
    
    return strdup(buffer);
}