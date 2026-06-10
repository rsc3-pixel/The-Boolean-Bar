# Contribuindo com o The Boolean Bar

Este guia leva qualquer pessoa do zero até rodar o projeto localmente e abrir o primeiro Pull Request. Se algo aqui não funcionar na sua máquina, abra uma issue descrevendo o erro: consertar este guia também é contribuição.

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Pra quê |
| :--- | :--- | :--- |
| GCC | C11 | Compilar o engine do jogo (`engine/`) |
| Make | qualquer recente | Orquestrar build e execução (Makefile na raiz) |
| Node.js | 20 LTS | Servidor WebSocket + frontend (`web/`) |
| Git | qualquer recente | Versionamento |

### Windows

1. Instale o [MSYS2](https://www.msys2.org/) e, no terminal do MSYS2, rode:
   ```bash
   pacman -S mingw-w64-ucrt-x86_64-gcc make
   ```
2. Adicione `C:\msys64\ucrt64\bin` (gcc) e `C:\msys64\usr\bin` (make) ao PATH do Windows.
3. Instale o [Node.js 20 LTS](https://nodejs.org/).
4. Confira no PowerShell: `gcc --version`, `make --version`, `node --version`.

> O LSP de algumas IDEs acusa `stdio.h not found` nos arquivos C. É falso positivo: o gcc compila normalmente. Ignore.

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install build-essential git
# Node 20 via nvm (recomendado):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
```

---

## 2. Clonando o repositório

O repositório é privado: você precisa ser membro do Squad 7 (peça acesso ao Tech Lead) e ter um [Personal Access Token](https://github.com/settings/tokens) configurado.

```bash
git clone https://github.com/rsc3-pixel/The-Boolean-Bar.git
cd The-Boolean-Bar
```

---

## 3. Compilando e rodando

### Engine no terminal (sem web)

```bash
make            # compila o engine em build/boolean_bar(.exe)
make run        # roda e pergunta o modo (0 = Lógica, 1 = Dados)
make run-logic  # direto no Boolean Bar (Lógica)
make run-dice   # direto no Liar's Dice (Dados)
```

> **Importante:** se você mudar qualquer arquivo de `engine/` (principalmente headers como `types.h`), rode `make clean && make`. O Makefile não rastreia dependência de headers, e um objeto velho com struct desatualizada causa segfault em runtime.

### Plataforma web completa (multiplayer)

```bash
make dev
```

Isso compila o engine, sobe o servidor WebSocket (porta 8080) e o frontend Vite (porta 5173), e abre o navegador. Pra subir manualmente:

```bash
cd web
npm install
node web_server.js     # servidor WS na porta 8080
# em outro terminal:
npm run dev            # frontend Vite em http://localhost:5173
```

---

## 4. Rodando os testes

Os testes conectam em `ws://localhost:8080`, então o servidor precisa estar de pé (use o `make dev` acima ou `node web_server.js`). Com o servidor rodando, em outro terminal:

```bash
make test                # smoke test: salas, reconnect, host transfer (5 cenários)
make stress              # carga: 100 sessões de jogo, 25 simultâneas
make stress N=100 C=10   # mesma carga com menos concorrência (máquinas modestas)
```

Os mesmos testes existem como scripts npm (`npm test` e `npm run stress` dentro de `web/`). Critérios de sucesso, calibração de concorrência e detalhes em [docs/TESTING.md](docs/TESTING.md).

---

## 5. Fluxo de contribuição

1. **Crie uma branch** a partir da `main` atualizada:
   ```bash
   git checkout main && git pull
   git checkout -b feat/nome-curto-da-feature
   ```
   Prefixos usados: `feat/`, `fix/`, `docs/`, `test/`, `chore/`.

2. **Commits em português**, no formato convencional já usado no projeto:
   ```
   feat(web): reações com emojis em tempo real
   fix(server): handler de error no stdin do engine
   docs: guia de testes
   ```

3. **Antes de abrir o PR**, confira o conceito de pronto:
   - `make clean && make` compila sem warning novo;
   - `npm test` (smoke) passa;
   - `npm run stress` passa se a mudança toca servidor ou engine;
   - testado manualmente nos 2 modos (Lógica + Dados) quando aplicável;
   - sem código morto, comentado ou duplicado.

4. **Abra o Pull Request** para a `main` e peça review de pelo menos 1 membro do squad. Descreva o que mudou e como testar.

---

## 6. Pegadinhas conhecidas (leia antes de mexer)

| Onde | Pegadinha |
| :--- | :--- |
| `engine/` | Mudou header? `make clean` obrigatório (ver seção 3). |
| `engine/main.c` | O `setvbuf(stdout, NULL, _IOLBF, 0)` é o que faz o output chegar ao servidor via pipe. Não remover. |
| `web/web_server.js` | O listener `engine.stdin.on('error')` evita que um EPIPE de engine morrendo derrube o servidor inteiro (bug real achado pelo stress test). Não remover. |
| `web/web_server.js` | O `JSON_DICE_STATE` carrega os dados de TODOS os jogadores; o servidor filtra por cliente antes do broadcast pra ninguém ver o copo alheio. Nunca fazer broadcast direto desse estado. |
| Makefile | `_POSIX_C_SOURCE=200809L` no CFLAGS é necessário pro `strdup` na glibc. Sem ele, segfault no Linux. |

---

## 7. Estrutura do projeto e documentação

A visão geral da arquitetura, diagramas e estrutura de pastas estão no [README.md](README.md). Documentos técnicos por tema ficam em [docs/](docs/): arquitetura, referência de API do engine, regras do jogo, sintaxe lógica, testes e deploy.

O deploy em produção (VM no GCP com PM2 + nginx) é responsabilidade do Tech Lead e está documentado em [docs/DEPLOY.md](docs/DEPLOY.md).
