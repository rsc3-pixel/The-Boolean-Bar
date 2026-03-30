# 🥃 The Boolean Bar

<p align="center"><em>Onde a única verdade absoluta é a sua sobrevivência.</em></p>

<p align="center">
  <img src="./assets/boolean_bar_logo.png" alt="The Boolean Bar Logo" width="250"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Language-C11-00599C?style=for-the-badge&logo=c&logoColor=white" alt="C Language"/>
  <img src="https://img.shields.io/badge/Paradigm-Imperative_%26_Functional-green?style=for-the-badge" alt="Paradigms"/>
  <img src="https://img.shields.io/badge/Logic-Propositional_Calculus-orange?style=for-the-badge" alt="Logic"/>
  <img src="https://img.shields.io/badge/Status-In_Development-blueviolet?style=for-the-badge" alt="Status"/>
</p>

---

## 🎯 Sobre o Projeto

The Boolean Bar é um simulador de mesa de apostas clandestina desenvolvido em C. O jogo desafia 7 jogadores em um ambiente de alta tensão, onde o "baralho" é composto por fórmulas de lógica proposicional. Para vencer, o jogador deve dominar a arte do blefe e a velocidade do raciocínio lógico, pois cada falha de verificação leva o personagem à Roleta Russa.

O projeto foi concebido para as cadeiras de Programação Imperativa e Funcional (PIF) e Lógica para Computação no CESAR School.

## 🔥 O Desafio Lógico

No bar, as cartas não têm números, mas proposições. O jogador deve afirmar a classificação da fórmula descartada:

```text
┌─────────────────────────────────────────────────────────────┐
│ Carta Jogada: (P ∧ ¬P)                                      │
│ Afirmação: "Isso é uma Tautologia!"                         │
│                                                             │
│ 🚨 OPONENTE DUVIDA!                                         │
│                                                             │
│ Resultado: (P ∧ ¬P) é uma CONTRADIÇÃO.                      │
│ Ação: O mentiroso puxa o gatilho.                           │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Funcionalidades do Épico (The Boolean Bar v1.0)

As funcionalidades seguem rigorosamente os requisitos de funções de ação (ar, er, ir):

1.  **Inicializar Ambiente**: Alocar memória para jogadores e configurar o estado inicial da mesa.
2.  **Gerar Proposições**: Sortear conectivos e variáveis para compor fórmulas lógicas aleatórias.
3.  **Avaliar Veracidade**: Computar o valor de verdade (Tautologia/Contradição) para validar o blefe.
4.  **Executar "Duvidar"**: Confrontar a afirmação com o valor real e aplicar a punição lógica.
5.  **Operar Roleta**: Sortear a bala e verificar se o disparo ocorre conforme a probabilidade.
6.  **Filtrar Sobreviventes**: Percorrer a lista de jogadores usando Ponteiros de Função (Paradigma Funcional).

## 🏗️ Arquitetura Modular (C Enterprise)

O projeto é dividido em camadas desacopladas para garantir manutenibilidade e nota máxima em organização:

```text
The-Boolean-Bar/
├── main.c
├── Makefile
├── core/
│   ├── types.h
│   ├── memory.c
│   ├── memory.h
│   ├── input_handler.c
│   └── input_handler.h
├── modules/
│   ├── logic_engine.c
│   ├── logic_engine.h
│   ├── deck_manager.c
│   ├── deck_manager.h
│   ├── game_flow.c
│   └── game_flow.h
├── functional/
│   ├── predicates.c
│   └── predicates.h
└── ui/
    ├── terminal_art.c
    └── terminal_art.h
├── docs/                 # Documentação do projeto
│   ├── LOGIC_SYNTAX.md
│   ├── GAME_RULES.md
│   ├── ARCHITECTURE_OVERVIEW.md
│   ├── DATA_STRUCTURES.md
│   ├── API_REFERENCE.md
│   └── DEVELOPMENT_STATUS.md
```

## 🛠️ Tech Stack & Conceitos Aplicados

| Camada         | Tecnologia / Conceito         | Justificativa                                        |
| :------------- | :---------------------------- | :--------------------------------------------------- |
| Linguagem      | C (Padrão C11)                | Requisito da cadeira de PIF.                         |
| Memória        | Alocação Dinâmica             | Uso de `malloc` e `free` para gerenciar a mesa e baralho. |
| Funcional      | Ponteiros de Função           | Implementação de comportamentos genéricos e filtros. |
| Lógica         | Cálculo Proposicional         | Validação automática de fórmulas via Tabelas-Verdade. |
| Interface      | CLI (ASCII Art)               | Estética sombria e imersiva via terminal.            |

## 📊 Diagramas Técnicos

### Arquitetura em Camadas

```mermaid
graph TB
    subgraph "Camada de Apresentação"
        UI["🎨 ui/terminal_art<br/>ASCII Art + Cores ANSI"]
    end

    subgraph "Camada de Lógica de Negócio"
        GF["🎮 modules/game_flow<br/>Motor de Turnos"]
        LE["🧠 modules/logic_engine<br/>Tabela-Verdade"]
        DM["🃏 modules/deck_manager<br/>Gerador de Fórmulas"]
    end

    subgraph "Camada Funcional"
        PRED["λ functional/predicates<br/>Ponteiros de Função"]
    end

    subgraph "Camada de Infraestrutura"
        MEM["💾 core/memory<br/>malloc / free"]
        IH["⌨️ core/input_handler<br/>Validação de Input"]
        TYPES["📦 core/types<br/>TADs: Carta, Jogador, Mesa"]
    end

    UI --> GF
    GF --> LE
    GF --> DM
    GF --> PRED
    GF --> MEM
    GF --> IH
    LE --> TYPES
    DM --> TYPES
    MEM --> TYPES
```

### Modelo de Dados (Entidade-Relacionamento)

```mermaid
erDiagram
    Mesa ||--o{ Jogador : "players[7]"
    Mesa ||--o| Carta : "current_card"
    Carta }o--|| FormulaType : "type"
    Jogador }o--|| PlayerStatus : "status"

    Mesa {
        int num_players_alive
        int current_player_index
        bool game_over
    }

    Jogador {
        int id
        string name
        int score
    }

    Carta {
        string formula_str
    }
```

### Fluxo do Jogo (Máquina de Estados)

```mermaid
stateDiagram-v2
    [*] --> Inicializacao: game_start()
    Inicializacao --> CriarMesa: mem_new_mesa()
    CriarMesa --> CriarJogadores: Loop x7

    CriarJogadores --> TurnoAtivo: Jogo Iniciado

    state TurnoAtivo {
        [*] --> GerarCarta: deck_generate_random_formula_string()
        GerarCarta --> JogadorAfirma: Exibir carta
        JogadorAfirma --> Duvida: Oponente duvida?
        Duvida --> Verificar: logic_evaluate_formula()
        Verificar --> AcertoJogador: Afirmação correta
        Verificar --> ErroJogador: Afirmação incorreta
        AcertoJogador --> ProximoTurno: Oponentes perdem vida
        ErroJogador --> RoletaRussa: Punição
        RoletaRussa --> ProximoTurno: Sobreviveu
        RoletaRussa --> Eliminacao: Perdeu vida
        Eliminacao --> ProximoTurno: Vidas > 0
        Eliminacao --> JogadorEliminado: Vidas = 0
        JogadorEliminado --> ProximoTurno
        Duvida --> ProximoTurno: Ninguém duvidou
    }

    TurnoAtivo --> FimDeJogo: 1 jogador restante
    FimDeJogo --> Limpeza: mem_free_mesa()
    Limpeza --> [*]
```

### Dependência entre Módulos

```mermaid
graph LR
    A["main.c"] -->|"chama"| B["game_flow"]
    B -->|"aloca/libera"| C["core/memory"]
    B -->|"gera carta"| D["deck_manager"]
    B -->|"verifica"| E["logic_engine"]
    B -->|"filtra"| F["predicates"]
    B -->|"renderiza"| G["terminal_art"]
    B -->|"lê input"| H["input_handler"]
    C -->|"usa"| I["core/types"]
    D -->|"usa"| I
    E -->|"usa"| I
```

## 📚 Documentação Completa

| Documento | Descrição |
| :-------- | :-------- |
| [ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md) | Visão geral da arquitetura modular |
| [DATA_STRUCTURES.md](docs/DATA_STRUCTURES.md) | Referência de TAD's com diagrama ER |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | Referência completa de funções com diagramas de fluxo |
| [GAME_RULES.md](docs/GAME_RULES.md) | Regras detalhadas do jogo |
| [LOGIC_SYNTAX.md](docs/LOGIC_SYNTAX.md) | Sintaxe das fórmulas lógicas |
| [DEVELOPMENT_STATUS.md](docs/DEVELOPMENT_STATUS.md) | Status de implementação por módulo |



## 👥 A Equipe (Squad 7)

| Membro        | Papel               | Responsabilidade Principal                                   |
| :------------ | :------------------ | :----------------------------------------------------------- |
| Renato Chong  | 🚀 Tech Lead        | Arquitetura, Integração de módulos e Code Review.            |
| João Pedro         | 🐍 Lógica (Logic Master) | Construir o avaliador de fórmulas proposicionais.            |
| Fernando Andrade  | 🐍 Lógica (Logic Master) | Gerador aleatório de strings lógicas estáveis.               |
| Cauã Rêgo         | 🗄️ Backend (C Expert) | Gestão de memória (`malloc`/`free`) e TADs principais.       |
| Matheus Larré | 🗄️ Backend (C Expert) | Controle de fluxo imperativo e motor de turnos.              |
| Luís Nunes    | 🎨 UI/UX (ASCII Designer) | Interface visual no terminal e sistema de cores ANSI.        |
| Gabriel Brito | 📄 QA & Docs        | Testes de estresse (inputs errados) e documentação lógica.   |

## 🚀 Como Rodar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/the-boolean-bar.git

# Navegue até o diretório do projeto
cd the-boolean-bar

# Compile via Makefile
make build

# Inicie o jogo
make run
```

<p align="center">Desenvolvido com <strong>C</strong> e <strong>Lógica Pura</strong> por estudantes de ADS.</p>
