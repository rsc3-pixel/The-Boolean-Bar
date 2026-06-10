# Demandas - The Boolean Bar (Liar's Dice)

Aqui estão as 10 Histórias de Usuário (UHs) reescritas para se alinharem perfeitamente à mecânica de **Liar's Dice (Dados D6)**, mantendo a atmosfera cyberpunk/bar e os requisitos técnicos em C.

## Status da implementação (atualizado em 10/06/2026)

As 10 UHs estão implementadas e em produção (https://rsc3-boolean.duckdns.org). Onde cada uma vive no código:

| UH | Status | Evidência no código / commits |
|---|---|---|
| UH1 Setup de partida | ✅ | `engine/core/memory.c` (alocação dinâmica dos jogadores); sala de até 8 em `e7b6a8d4` |
| UH2 Sorteio oculto de dados | ✅ | `engine/modules/dice_flow.c`; 3 dados iniciais em `798482a4`; servidor filtra `myDice` por cliente |
| UH3 Aposta com escalada | ✅ | `dice_flow.c` (validação de escalada); face 1-6 apostável |
| UH4 Duvido + contagem | ✅ | `dice_flow.c` (`JSON_DICE_REVEAL` com contagem real e perdedor automático) |
| UH5 Roleta Russa | ✅ | Roleta no modo Lógica (`game_flow.c`); no modo Dados a punição é perder 1 dado, conforme regra oficial |
| UH6 Interface imersiva | ✅ | `engine/ui/terminal_art.c` (ASCII + ANSI) e frontend React completo |
| UH7 Filtro funcional de vivos | ✅ | `engine/functional/predicates.c` (ponteiros de função) |
| UH8 Sanitização de input | ✅ | `engine/core/input_handler.c` (`get_safe_int`, `get_safe_string`) |
| UH9 Risco progressivo | ✅ | Balas incrementais a cada clique seco no modo Lógica (`game_flow.c`) |
| UH10 Vitória + cleanup | ✅ | `JSON_VICTORY` + `free()` de todos os ponteiros; ranking final com pontuação (`8e5ea22e`, `df8cb2a6`) |

---

### UH1: Entrada no Bar (Setup de Partida)
**Descrição:** Como jogador, quero entrar em uma mesa com meus amigos para que possamos iniciar uma partida de apostas baseada em dados (Liar's Dice).
**Conversa:** O sistema deve preparar o ambiente, alocando memória para os 7 jogadores e configurando seus status iniciais de dados no copo e munição.
**Critérios de Confirmação:**
- [ ] Executar a alocação dinâmica (`malloc`) para o vetor de jogadores.
- [ ] Atribuir o status `vivo = true` para todos os participantes.
- [ ] Iniciar cada jogador com sua quantidade máxima de dados (ex: 5 dados).
- [ ] Garantir que o contador de balas da roleta comece zerado para todos.

### UH2: O Chacoalhar dos Copos (Sorteio de Dados)
**Descrição:** Como jogador, quero que meus dados (D6) sejam rolados e ocultos sob o copo no início de cada rodada para que eu possa planejar meus blefes.
**Conversa:** A função deve gerar valores aleatórios (1 a 6) para cada dado e armazenar no vetor de cada jogador, mantendo o resultado secreto para os outros.
**Critérios de Confirmação:**
- [ ] Sortear números inteiros entre 1 e 6 correspondentes ao número de dados de cada jogador.
- [ ] Armazenar as faces geradas no vetor de dados (struct) de cada jogador.
- [ ] Garantir que a seed (`srand`) de geração randômica esteja funcional.

### UH3: A Aposta na Mesa (O Blefe)
**Descrição:** Como jogador, quero fazer uma aposta (ex: "Afirmo que há cinco dados de face 4 na mesa") para pressionar os oponentes.
**Conversa:** O sistema deve coletar a aposta (quantidade de dados e a face). A aposta atual deve ser **estritamente maior** que a anterior (escalada de valor ou de face).
**Critérios de Confirmação:**
- [ ] Receber e armazenar a aposta do jogador no centro da mesa.
- [ ] Validar a regra de escalada (A nova aposta aumenta o número de dados ou a face do dado).
- [ ] Passar o turno (controle do buffer) para o próximo jogador válido.

### UH4: O Confronto (Gritar "Duvido!")
**Descrição:** Como jogador, quero gritar "Duvido!" após uma aposta suspeita para desmascarar o mentiroso.
**Conversa:** Ao acionar o "Duvido", o Motor conta todos os dados com aquela face na mesa e decide quem perdeu.
**Critérios de Confirmação:**
- [ ] Revelar as structs de dados de todos os jogadores vivos.
- [ ] Contar o total real da face apostada em toda a mesa.
- [ ] Comparar o total real com a aposta. Se real < aposta: O apostador perde. Se real >= aposta: Quem duvidou perde.
- [ ] Identificar o perdedor de forma automática.

### UH5: Tensão da Roleta Russa
**Descrição:** Como jogador, quero sentir a tensão de puxar o gatilho após perder um "Duvido", encarando o risco físico no bar.
**Conversa:** A função deve sortear a posição da bala no tambor; se o jogador sobreviver ao "clique", ele perde 1 dado para a próxima rodada em vez de morrer direto (trazendo a mecânica de dano progressivo). Se o tambor disparar, é game over para ele.
**Critérios de Confirmação:**
- [ ] Gerar um número aleatório (1 a 6) para o tambor do revólver.
- [ ] Mudar o status para `morto` se o número coincidir com a bala.
- [ ] Se o número não coincidir (CLIQUE), subtrair 1 do número total de dados daquele jogador.
- [ ] Imprimir a mensagem "BANG!" (vermelho) ou "CLIQUE" (ciano).

### UH6: Visualização do Bar (Interface)
**Descrição:** Como jogador, quero ver o status da mesa e meus próprios dados de forma imersiva.
**Conversa:** A interface deve imprimir em ASCII a quantidade de copos na mesa, o número de dados sob o copo de cada oponente (sem mostrar os valores) e os valores apenas dos meus dados.
**Critérios de Confirmação:**
- [ ] Renderizar ações com cores ANSI.
- [ ] Limpar a tela (`system("clear")` ou equivalente) a cada turno para manter a imersão.
- [ ] Exibir a arte ASCII de um dado D6 (com os pontinhos das faces) para os dados revelados.

### UH7: Filtro de Sobreviventes (Paradigma Funcional)
**Descrição:** Como sistema, preciso pular o turno de quem já morreu no bar, para manter o fluxo ininterrupto da rodada.
**Conversa:** Aplicar Ponteiros de Função em C para percorrer a lista circular de jogadores e encontrar o próximo ativo.
**Critérios de Confirmação:**
- [ ] Implementar uma *High-Order Function* de filtro em C.
- [ ] Usar o predicado para testar `jogador->estaVivo == true` e `jogador->numDados > 0`.
- [ ] Retornar o índice correto do próximo da fila.

### UH8: Segurança de Jogada (Anti-Erro e Imersão)
**Descrição:** Como jogador, não quero que uma tecla errada quebre o jogo (ex: digitar uma letra em vez do número da aposta).
**Conversa:** Funções de sanitização de buffer para que o programa não entre num loop infinito se alguém apostar uma string "A" em vez de "5".
**Critérios de Confirmação:**
- [ ] Limpar o buffer do `stdin` (tratamento do enter/newline).
- [ ] Tratar retornos incorretos do `scanf`.
- [ ] Rejeitar entradas inválidas no menu de apostas e pedir novamente.

### UH9: Gerenciamento de Probabilidades Sombrias
**Descrição:** Como jogador, quero que o risco na Roleta Russa aumente coletivamente a cada "CLIQUE" vazio no bar.
**Conversa:** O sistema incrementa o perigo. Se alguém puxou o gatilho e nada aconteceu, a próxima bala inserida faz o tambor ter 2 balas.
**Critérios de Confirmação:**
- [ ] Incrementar `balas_no_tambor++` após roletas vazias.
- [ ] Resetar a variável de risco (ex: para 1) somente após o revólver ser disparado ("BANG") e matar alguém.

### UH10: Fechamento da Conta (Fim de Jogo)
**Descrição:** Como último a ficar em pé, quero minha vitória anunciada e liberar meu espaço no bar.
**Conversa:** Quando resta apenas 1 jogador, o loop principal é quebrado, anuncia-se o campeão e o programa faz o cleanup de memória.
**Critérios de Confirmação:**
- [ ] Função `free()` disparada para todos os ponteiros criados (vetores de dados e de jogadores).
- [ ] Imprimir mensagem de vitória em ASCII art.
- [ ] Sair com código de sucesso (`return 0`).
