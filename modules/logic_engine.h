#ifndef LOGIC_ENGINE_H
#define LOGIC_ENGINE_H

#include "../core/types.h" // Inclui as definições de FormulaType

/**
 * @brief Avalia uma fórmula lógica proposicional e determina seu tipo.
 *
 * Esta função é o coração do "Juiz" do jogo. Ela deve analisar a string da fórmula,
 * construir sua tabela-verdade e, a partir dela, classificar a fórmula como
 * Tautologia, Contradição ou Contingência.
 *
 * @param formula_str A string contendo a fórmula lógica a ser avaliada (ex: "P AND NOT P").
 * @return O FormulaType correspondente (TAUTOLOGY, CONTRADICTION, ou CONTINGENCY).
 */
FormulaType logic_evaluate_formula(const char *formula_str);

#endif // LOGIC_ENGINE_H