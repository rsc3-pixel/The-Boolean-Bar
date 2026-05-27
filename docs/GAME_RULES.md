# Regras do Jogo — The Boolean Bar

## Visao Geral

The Boolean Bar e um simulador de mesa de apostas com 2 modos de jogo:
- **Boolean Bar (Logica)** — cartas com formulas proposicionais + roleta russa
- **Liar's Dice (Dados)** — dados escondidos + apostas de blefe

Partidas multiplayer online com ate 8 jogadores (humanos + bots). Ultimo jogador vivo vence.

---

## Modo 1: Boolean Bar (Logica)

### Configuracao
- Ate **8 jogadores** na mesa
- Cada jogador comeca com **3 vidas** e **5 cartas** na mao
- Cada carta contem uma formula logica (ex: `P OR NOT P`, `P AND Q`)
- O revolver da mesa comeca com **1 bala em 6 camaras**

### Fluxo de Turno
1. **Jogar carta**: escolha uma carta da sua mao
2. **Declarar tipo**: diga se a formula e TAUTOLOGIA, CONTRADICAO ou CONTINGENCIA (voce pode BLEFAR)
3. **Momento da duvida**: o proximo jogador decide: ACREDITAR (passa) ou DUVIDAR (confronto)
4. **Se acreditar**: turno passa sem consequencia
5. **Se duvidar**: o engine avalia a formula. O perdedor vai pra Roleta Russa

### Tabela de Confronto

| Jogador Declara | Oponente | Resultado Real | Consequencia |
|---|---|---|---|
| Qualquer tipo | Acredita | Nao verificado | Proximo turno |
| Tipo correto | **Duvida** | Declaracao = Real | **Duvidador** vai pra roleta |
| Tipo errado (blefe) | **Duvida** | Declaracao != Real | **Blefador** vai pra roleta |

### Roleta Russa
- Quem perde o confronto puxa o gatilho
- **BANG** (bala na camara): perde 1 vida. Se vidas = 0 → ELIMINADO. Tambor reseta pra 1 bala
- **CLICK** (camara vazia): sobrevive, mas +1 bala no tambor (risco acumula)
- Sons: cilindro girando, click metalico ou bang de revolver

### Tipos de Formulas Logicas
| Tipo | Descricao | Exemplo |
|---|---|---|
| **Tautologia** | Sempre verdadeira | `P OR NOT P` |
| **Contradicao** | Sempre falsa | `P AND NOT P` |
| **Contingencia** | Depende dos valores | `P AND Q` |

### Conectivos
| No Jogo | Simbolo | Significado |
|---|---|---|
| NOT P | ¬P | Negacao |
| P AND Q | P ∧ Q | Conjuncao (ambos verdadeiros) |
| P OR Q | P ∨ Q | Disjuncao (ao menos um) |
| P IMPLIES Q | P → Q | Implicacao (falso so se P=V e Q=F) |
| P IFF Q | P ↔ Q | Bicondicional (ambos iguais) |

---

## Modo 2: Liar's Dice (Dados)

### Configuracao
- Ate **8 jogadores** na mesa
- Cada jogador comeca com **3 dados** escondidos em um copo
- Voce so ve seus proprios dados. Os dos outros ficam escondidos

### Acoes do Turno
No seu turno, escolha UMA acao:

1. **APOSTAR**: declare quantos dados de uma face existem na mesa (somando todos os jogadores). A aposta precisa **subir** a anterior:
   - Subir a quantidade (ex: 3→4 dados), com qualquer face
   - Manter quantidade e subir a face (ex: 3x face 4 → 3x face 5)
2. **DUVIDAR**: acuse que a aposta atual e blefe. Todos abrem os copos e contam

### Resolucao da Duvida
- Se a aposta **cobriu** (dados reais >= quantidade apostada): **duvidador** perde 1 dado
- Se **faltou dado** (dados reais < quantidade apostada): **apostador** perde 1 dado
- Quem ficar com **0 dados** e eliminado

### Faces Aceitas
- Apostas aceitam faces de **1 a 6** (todas as faces do dado)
- **Nao ha regra de curinga** — face 1 nao vale como qualquer face

---

## Pontuacao (ambos os modos)

### Durante a Partida
| Evento | Pontos |
|---|---|
| Ganhar confronto (duvida certa ou aposta defendida) | **+20** |
| Perder confronto | **-20** (piso zero: nunca fica negativo) |
| Sobreviver a rodada (ter vidas/dados no fim) | **+2** |

### Bonus de Vitoria (so pro vencedor)
| Bonus | Valor |
|---|---|
| Vitoria Real | **+50** × multiplicador de velocidade |
| Vitoria Limpa (sem perder vida/dado) | **+40** |

### Multiplicador de Velocidade
| Rodadas | Multiplicador | Bonus Final |
|---|---|---|
| ≤ 6 (Blitz) | ×2 | 100 pts |
| 7-12 (Padrao) | ×1.5 | 75 pts |
| 13+ (Resistencia) | ×1 | 50 pts |

### Ranking Global
- Pontos acumulam entre partidas no **leaderboard** persistido no servidor
- Ordenado por **pontos totais** (desempate: vitoria mais recente)
- Visivel na pagina **HIGH SCORES** e na tela de **TV ao vivo** (`/tv`)

---

## Funcionalidades Multiplayer

### Salas
- Criar sala: gera codigo de 4 letras (ex: AXKM)
- Entrar: digitar o codigo
- Maximo **8 jogadores** por sala (humanos + bots)
- Host pode adicionar/remover **bots** antes de iniciar
- Host inicia a partida (minimo 2 jogadores)

### Timer de Turno
- Cada turno tem **30 segundos** de tempo
- Barra visual diminui e muda de cor (cyan → amarelo → vermelho)
- Se o tempo esgotar, o server joga automaticamente pelo jogador
- Bots jogam automaticamente em ~1.2s

### Reacoes
- 6 emojis rapidos disponiveis durante a partida (pensativo, risada, suor, fogo, caveira, aplausos)
- Aparecem flutuando na tela de todos na sala
- Rate limit: 1 reacao a cada 2 segundos

### Chat Rapido
- 8 frases pre-definidas: "Blefou!", "Boa sorte!", "Covarde!", "Mentiroso!", "To suando...", "GG", "Facil", "Misericordia!"
- Balao aparece na tela de todos por 4 segundos
- Rate limit: 1 mensagem a cada 3 segundos
- Sem texto livre (whitelist no server)

### Streak/Combo
- Acertar 2+ duvidas/confrontos seguidos exibe "STREAK x2!" (x3, x4...)
- Visivel pra todos na sala
- Reseta quando o jogador erra

### Reconnect
- Se cair a conexao, reconecta automaticamente em ate 60 segundos
- sessionStorage guarda playerId + roomId
- Host transfer automatico se o host sair

### Spectator
- Jogadores eliminados viram spectators (veem o jogo mas nao jogam)
- Spectators podem enviar reacoes e chat

---

## Tela de TV (`/tv`)

Ranking ao vivo para exibir em televisao/projetor durante campeonatos:
- **Ranking da Casa**: top 10 jogadores por pontos, com modos jogados e vitorias
- **Salas Ativas**: cards com codigo, modo (Logic/Dice), numero de jogadores e status (JOGANDO/AGUARDANDO)
- Atualiza automaticamente via WebSocket (sem refresh)
- Indicador "AO VIVO" com bolinha vermelha pulsando
- Acessivel via link na pagina HIGH SCORES

---

## Relatorio Final (Tela de Vitoria)

Ao fim de cada partida, a tela de vitoria mostra:
- Nome do vencedor com animacao de trofeu
- **Relatorio por jogador**: posicao, pontos totais, bonus vitoria, bonus limpo, vidas/dados restantes
- Modo e numero de rodadas
- Multiplicador de velocidade aplicado
- Confetti colorido na tela

---

## Entrada Dramatica

Quando o host inicia a partida, antes do jogo comecar:
- Tela preta com nomes dos jogadores aparecendo um a um
- Som curto acompanha cada nome
- Bots aparecem com badge "BOT"
- Finaliza com "GO!" e transiciona pro jogo

---

## Sons do Jogo

| Evento | Som |
|---|---|
| Sua vez | 2 beeps agudos |
| Aposta | Tom ascendente |
| Duvida | Acorde dissonante tenso |
| Roleta (giro) | Ticks rapidos descendentes |
| Roleta (sobreviveu) | Click metalico seco |
| Roleta (morreu) | Bang de revolver (ruido + graves) |
| Eliminacao | Tom grave descendente |
| Vitoria | Fanfarra de 3 tons ascendentes |

Todos os sons sao sintetizados via Web Audio API (sem arquivos externos). Toggle de mute no canto inferior esquerdo controla musica + efeitos.
