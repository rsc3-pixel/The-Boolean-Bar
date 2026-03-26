# Makefile para o projeto The Boolean Bar

# Compilador C
CC = gcc

# Flags do compilador
# -Wall: Habilita todos os avisos
# -Wextra: Habilita avisos adicionais
# -std=c11: Usa o padrão C11
# -g: Inclui informações de debug
# -I.: Adiciona o diretório atual para busca de includes
# -Icore: Adiciona o diretório core para busca de includes
# -Imodules: Adiciona o diretório modules para busca de includes
# -Iui: Adiciona o diretório ui para busca de includes
# -Ifunctional: Adiciona o diretório functional para busca de includes
CFLAGS = -Wall -Wextra -std=c11 -g -I. -Icore -Imodules -Iui -Ifunctional

# Nome do executável final
TARGET = boolean_bar

# Arquivos fonte (todos os .c do projeto)
SRCS = \
	main.c \
	core/memory.c \
	core/input_handler.c \
	modules/logic_engine.c \
	modules/deck_manager.c \
	modules/game_flow.c \
	functional/predicates.c \
	ui/terminal_art.c

# Arquivos objeto (gerados a partir dos fontes)
OBJS = $(SRCS:.c=.o)

# Regra padrão: compila o executável
all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET)

# Regra genérica para compilar arquivos .c em .o
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Regra para limpar arquivos gerados
clean:
	rm -f $(OBJS) $(TARGET)

# Regra para compilar e rodar o programa
run: all
	./$(TARGET)

.PHONY: all clean run