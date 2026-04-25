# Makefile Profissional - The Boolean Bar
# Arquiteto: Senior AI Auditor

# Diretorios
SRC_DIR = engine
BUILD_DIR = build
WEB_DIR = web

# Compilador e Flags
CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -g \
         -I$(SRC_DIR) \
         -I$(SRC_DIR)/core \
         -I$(SRC_DIR)/modules \
         -I$(SRC_DIR)/ui \
         -I$(SRC_DIR)/functional

# Nome do executável final
TARGET = $(BUILD_DIR)/boolean_bar.exe

# Arquivos fonte
SRCS = \
	$(SRC_DIR)/main.c \
	$(SRC_DIR)/core/memory.c \
	$(SRC_DIR)/core/input_handler.c \
	$(SRC_DIR)/modules/logic_engine.c \
	$(SRC_DIR)/modules/deck_manager.c \
	$(SRC_DIR)/modules/game_flow.c \
	$(SRC_DIR)/modules/dice_flow.c \
	$(SRC_DIR)/functional/predicates.c \
	$(SRC_DIR)/ui/terminal_art.c

# Mapeia arquivos .c para .o dentro da pasta build
OBJS = $(patsubst $(SRC_DIR)/%.c, $(BUILD_DIR)/%.o, $(SRCS))

# Regra padrão
all: prepare $(TARGET)

# Cria a estrutura de pastas no build se não existir
prepare:
	@powershell -Command "if (!(Test-Path $(BUILD_DIR))) { New-Item -ItemType Directory -Path $(BUILD_DIR) | Out-Null }"
	@powershell -Command "if (!(Test-Path $(BUILD_DIR)/core)) { New-Item -ItemType Directory -Path $(BUILD_DIR)/core | Out-Null }"
	@powershell -Command "if (!(Test-Path $(BUILD_DIR)/modules)) { New-Item -ItemType Directory -Path $(BUILD_DIR)/modules | Out-Null }"
	@powershell -Command "if (!(Test-Path $(BUILD_DIR)/ui)) { New-Item -ItemType Directory -Path $(BUILD_DIR)/ui | Out-Null }"
	@powershell -Command "if (!(Test-Path $(BUILD_DIR)/functional)) { New-Item -ItemType Directory -Path $(BUILD_DIR)/functional | Out-Null }"

# Linkagem final
$(TARGET): $(OBJS)
	@echo "[Build] Linkando $(TARGET)..."
	-@taskkill /F /IM boolean_bar.exe >NUL 2>&1 || exit 0
	$(CC) $(OBJS) -o $(TARGET)
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/post_build.ps1 -Target "$(TARGET)"

# Compilação de objetos
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	@echo "[Compile] $<"
	$(CC) $(CFLAGS) -c $< -o $@

# Regra de Desenvolvimento Web
dev: all
	@echo "[Launcher] Iniciando Interface e Servidor..."
	@powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd $(WEB_DIR) && node web_server.js' -WindowStyle Hidden"
	@powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd $(WEB_DIR) && npm run dev' -WindowStyle Hidden"
	@powershell -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173'"

# Limpeza total
clean:
	@echo "[Clean] Removendo artefatos de build..."
	@powershell -Command "Remove-Item -Path $(BUILD_DIR) -Recurse -Force -ErrorAction SilentlyContinue"

kill:
	@echo "[System] Matando processos..."
	-@taskkill /F /IM node.exe 2>NUL || exit 0
	-@taskkill /F /IM boolean_bar.exe 2>NUL || exit 0

restart: kill dev

.PHONY: all clean run dev kill restart prepare