# Makefile Profissional - The Boolean Bar
# Cross-platform: Windows (PowerShell) + Linux/macOS (POSIX shell)

# ─── Detecta plataforma ──────────────────────────────────────────────────────
ifeq ($(OS),Windows_NT)
    PLATFORM = windows
    EXE_EXT = .exe
    MKDIR = @powershell -Command "if (!(Test-Path '$(1)')) { New-Item -ItemType Directory -Path '$(1)' | Out-Null }"
    RMDIR = @powershell -Command "Remove-Item -Path '$(BUILD_DIR)' -Recurse -Force -ErrorAction SilentlyContinue"
    KILL_BIN = -@taskkill /F /IM boolean_bar$(EXE_EXT) >NUL 2>&1 || exit 0
    KILL_NODE = -@taskkill /F /IM node.exe 2>NUL || exit 0
    POST_BUILD = @powershell -NoProfile -ExecutionPolicy Bypass -File scripts/post_build.ps1 -Target "$(TARGET)"
else
    PLATFORM = linux
    EXE_EXT =
    MKDIR = @mkdir -p $(1)
    RMDIR = @rm -rf $(BUILD_DIR)
    KILL_BIN = -@pkill -f boolean_bar 2>/dev/null || true
    KILL_NODE = -@pkill node 2>/dev/null || true
    POST_BUILD = @chmod +x $(TARGET)
endif

# ─── Diretórios ──────────────────────────────────────────────────────────────
SRC_DIR = engine
BUILD_DIR = build
WEB_DIR = web

# ─── Compilador e Flags ──────────────────────────────────────────────────────
# _POSIX_C_SOURCE=200809L expõe strdup() em <string.h> na glibc (Linux). Sem isso,
# strdup é "implícito" → compilador assume retorno int → ponteiro 64-bit truncado
# pra 32-bit → segfault em runtime. Windows não precisa mas não atrapalha.
CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -g \
         -D_POSIX_C_SOURCE=200809L \
         -I$(SRC_DIR) \
         -I$(SRC_DIR)/core \
         -I$(SRC_DIR)/modules \
         -I$(SRC_DIR)/ui \
         -I$(SRC_DIR)/functional

# ─── Nome do executável (com .exe no Windows, sem extensão no Linux) ─────────
TARGET = $(BUILD_DIR)/boolean_bar$(EXE_EXT)

# ─── Arquivos fonte ──────────────────────────────────────────────────────────
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

# Mapeia .c → .o em build/
OBJS = $(patsubst $(SRC_DIR)/%.c, $(BUILD_DIR)/%.o, $(SRCS))

# ─── Regras ──────────────────────────────────────────────────────────────────
all: prepare $(TARGET)

# Cria estrutura de pastas
prepare:
	$(call MKDIR,$(BUILD_DIR))
	$(call MKDIR,$(BUILD_DIR)/core)
	$(call MKDIR,$(BUILD_DIR)/modules)
	$(call MKDIR,$(BUILD_DIR)/ui)
	$(call MKDIR,$(BUILD_DIR)/functional)

# Linkagem final
$(TARGET): $(OBJS)
	@echo "[Build] Linkando $(TARGET) ($(PLATFORM))..."
	$(KILL_BIN)
	$(CC) $(OBJS) -o $(TARGET)
	$(POST_BUILD)

# Compilação de objetos
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	@echo "[Compile] $<"
	$(CC) $(CFLAGS) -c $< -o $@

# Build de produção do frontend (Linux/CI)
web-build:
	@echo "[Web] Buildando frontend (vite build)..."
	cd $(WEB_DIR) && npm install --no-fund --no-audit && npm run build

# Roda em modo produção: engine + frontend buildado servido pelo node
prod: all web-build
	@echo "[Prod] Iniciando server único na porta $${PORT:-8080}..."
	cd $(WEB_DIR) && NODE_ENV=production node web_server.js

# ─── Modo terminal (sem web) ─────────────────────────────────────────────────
# Roda o engine direto no terminal. O binário pergunta o modo (0=Logica, 1=Dados)
# se chamado sem argumento.
run: all
	@echo "[Terminal] Rodando engine — escolha o modo (0=Boolean Bar, 1=Liar's Dice)..."
	./$(TARGET)

# Atalho pra cair direto no Boolean Bar (modo Lógica)
run-logic: all
	@echo "[Terminal] Boolean Bar (Lógica)..."
	./$(TARGET) 0

# Atalho pra cair direto no Liar's Dice
run-dice: all
	@echo "[Terminal] Liar's Dice (Dados)..."
	./$(TARGET) 1

# Modo desenvolvimento (Windows): abre 2 processos hidden + browser
ifeq ($(PLATFORM),windows)
dev: all
	@echo "[Launcher] Iniciando Interface e Servidor..."
	@powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd $(WEB_DIR) && node web_server.js' -WindowStyle Hidden"
	@powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd $(WEB_DIR) && npm run dev' -WindowStyle Hidden"
	@powershell -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173'"
else
dev: all
	@echo "[Launcher] Iniciando Interface (Vite) e Servidor (Node) em background..."
	@cd $(WEB_DIR) && nohup node web_server.js > /tmp/boolean_bar_ws.log 2>&1 &
	@cd $(WEB_DIR) && nohup npm run dev > /tmp/boolean_bar_vite.log 2>&1 &
	@echo "[Launcher] Acesse http://localhost:5173 (logs em /tmp/boolean_bar_*.log)"
endif

# Limpeza
clean:
	@echo "[Clean] Removendo artefatos de build..."
	$(RMDIR)

# Mata processos relacionados
kill:
	@echo "[System] Matando processos..."
	$(KILL_NODE)
	$(KILL_BIN)

restart: kill dev

.PHONY: all clean run run-logic run-dice dev prod web-build kill restart prepare
