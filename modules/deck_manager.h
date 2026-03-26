#ifndef DECK_MANAGER_H
#define DECK_MANAGER_H

#include "../core/types.h" // Para Carta e FormulaType, se necessário

/**
 * @brief Gera uma string de fórmula lógica proposicional aleatória.
 *
 * Esta função é responsável por construir uma fórmula lógica sintaticamente válida
 * usando variáveis proposicionais e conectivos lógicos de forma aleatória.
 * A string retornada deve ser alocada dinamicamente e o chamador é responsável por liberá-la.
 *
 * @return Uma string (char*) contendo a fórmula lógica gerada, ou NULL em caso de falha.
 */
char* deck_generate_random_formula_string();

#endif // DECK_MANAGER_H