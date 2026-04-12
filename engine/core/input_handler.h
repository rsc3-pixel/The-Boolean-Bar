#ifndef INPUT_HANDLER_H
#define INPUT_HANDLER_H

/**
 * @brief Obtém um inteiro do usuário de forma segura.
 * Limpa o buffer ('\n') e avisa caso haja falha.
 * @param prompt Mensagem exibida.
 * @param min Valor mínimo aceito.
 * @param max Valor máximo aceito.
 * @return O valor inteiro inserido que é válido.
 */
int get_safe_int(const char *prompt, int min, int max);

/**
 * @brief Obtém uma string de forma segura.
 * @param prompt Mensagem exibida.
 * @param buffer Buffer de destino.
 * @param max_len Tamanho máximo.
 */
void get_safe_string(const char *prompt, char *buffer, int max_len);

#endif // INPUT_HANDLER_H
