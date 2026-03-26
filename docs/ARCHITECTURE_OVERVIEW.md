# Visão Geral da Arquitetura (The Boolean Bar)

Este documento detalha a arquitetura modular do projeto "The Boolean Bar", complementando a visão geral fornecida no `README.md`. O objetivo é garantir manutenibilidade, escalabilidade e clareza na separação de responsabilidades.

## 1. Estrutura de Diretórios

A estrutura de diretórios é organizada em camadas lógicas:

```text
The-Boolean-Bar/
├── main.c                # Orquestração de alto nível, ponto de entrada.
├── Makefile              # Automação de build.
├── core/                 # Infraestrutura base e tipos globais.
│   ├── types.h           # Definições de TADs (Carta, Jogador, Mesa, etc.).
│   ├── memory.c/h        # Funções de alocação e desalocação dinâmica.
│   └── input_handler.c/h # Validação e sanitização de entradas do usuário.
├── modules/              # Lógica de negócio principal do jogo.
│   ├── logic_engine.c/h  # O "Juiz": avaliador de fórmulas lógicas (Tautologia/Contradição/Contingência).
│   ├── deck_manager.c/h  # Gerenciador de cartas: geração e manipulação de fórmulas.
│   └── game_flow.c/h     # Controle de turnos, regras do jogo e motor imperativo.
├── functional/           # Implementações de paradigmas funcionais.
│   └── predicates.c/h    # Funções de ordem superior e filtros (ex: para filtrar jogadores vivos).
├── ui/                   # Interface de Usuário e elementos visuais.
│   └── terminal_art.c/h  # Renderização ASCII, cores ANSI e elementos visuais do terminal.
└── docs/                 # Documentação do projeto.
    ├── LOGIC_SYNTAX.md   # Sintaxe das fórmulas lógicas.
    ├── GAME_RULES.md     # Regras detalhadas do jogo.
    └── ARCHITECTURE_OVERVIEW.md # Este documento.
```

## 2. Camadas e Responsabilidades

### 2.1. `core/` - Infraestrutura do Sistema

Esta camada contém os componentes fundamentais e de baixo nível que são utilizados por todo o sistema.

-   **`types.h`**: Define as estruturas de dados (TADs) que representam os objetos do jogo (Jogador, Carta, Mesa) e enums essenciais (FormulaType, PlayerStatus).
-   **`memory.c/h`**: Gerencia a alocação e desalocação de memória para as TADs, garantindo o uso eficiente dos recursos e prevenindo vazamentos.
-   **`input_handler.c/h`**: Responsável por ler e validar as entradas do usuário, protegendo o programa contra dados inválidos.

### 2.2. `modules/` - Lógica de Negócio

Esta camada implementa as regras e a lógica central do jogo.

-   **`logic_engine.c/h`**: O "cérebro" lógico. Analisa strings de fórmulas, constrói tabelas-verdade e classifica as fórmulas como Tautologia, Contradição ou Contingência.
-   **`deck_manager.c/h`**: Gerencia a criação, embaralhamento e distribuição das "cartas" (fórmulas lógicas). Inclui a lógica para gerar fórmulas aleatórias.
-   **`game_flow.c/h`**: Orquestra o fluxo do jogo, gerencia turnos, interações entre jogadores, aplicação de regras (como a Roleta Russa) e condições de vitória/derrota.

### 2.3. `functional/` - Programação Funcional

Esta camada explora o paradigma funcional, utilizando ponteiros de função para comportamentos genéricos.

-   **`predicates.c/h`**: Contém funções de ordem superior e predicados que podem ser usados para filtrar listas de jogadores ou outros elementos (ex: `filter_alive_players`).

### 2.4. `ui/` - Interface de Usuário

Responsável pela apresentação visual do jogo no terminal.

-   **`terminal_art.c/h`**: Implementa a renderização de elementos gráficos ASCII, uso de cores ANSI e formatação de texto para criar a experiência visual do jogo.

### 2.5. `docs/` - Documentação

Contém toda a documentação relevante do projeto, incluindo regras, sintaxe e visão geral da arquitetura.
