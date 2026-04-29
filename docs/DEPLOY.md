# 🚀 Deploy & Atualização da VM

Guia rápido pra aplicar mudanças do `main` no servidor de produção.

**URL pública**: https://rsc3-boolean.duckdns.org
**Infra**: VM `flux` no GCP Compute Engine (`e2-micro`, zona `us-west1-a`).

---

## TL;DR — comando de deploy

Depende do que foi alterado:

| Tipo de mudança | Comando único na VM |
|---|---|
| **Só frontend** (web/src/**) | `cd ~/boolean-bar && git pull origin main && make web-build && pm2 restart boolean-bar` |
| **Só servidor Node** (web_server.js) | `cd ~/boolean-bar && git pull origin main && pm2 restart boolean-bar` |
| **Engine C** (engine/**) | `cd ~/boolean-bar && git pull origin main && make clean && make && make web-build && pm2 restart boolean-bar` |
| **Áudio/imagem** (web/public/**) | `cd ~/boolean-bar && git pull origin main && make web-build && pm2 restart boolean-bar` |

> ⚠️ **`make clean` é obrigatório quando o engine C muda**. O Makefile não rastreia dependências de headers (`types.h`, etc) automaticamente, então `.o` antigos podem ficar incompatíveis com `.h` novos → segfault em runtime.

---

## Acesso à VM

```bash
gcloud compute ssh flux --zone=us-west1-a
```

> Pré-requisitos: ter o gcloud SDK instalado e autenticado (`gcloud auth login`) com o projeto setado (`gcloud config set project <ID>`).

A primeira vez você precisa de uma chave SSH local — o gcloud cria automaticamente em `~/.ssh/google_compute_engine`.

---

## Setup inicial (já feito, só pra histórico)

Se algum dia precisar reprovisionar a VM:

```bash
# Dentro da VM:
sudo apt update && sudo apt install -y build-essential git curl gdb
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Swap pra evitar OOM
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Clone + build
git config --global credential.helper store
cd ~ && git clone https://github.com/rsc3-pixel/The-Boolean-Bar.git boolean-bar
cd boolean-bar
make
make web-build

# PM2
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup       # roda o comando que ele cuspir
```

E o nginx (já configurado em `/etc/nginx/sites-available/boolean-bar`) roteia `rsc3-boolean.duckdns.org` → `localhost:4000` com upgrade WebSocket. Cert HTTPS via certbot.

---

## Comandos úteis na VM

```bash
# Ver status do serviço
pm2 status

# Logs em tempo real (Ctrl+C pra sair, o serviço continua)
pm2 logs boolean-bar

# Logs sem seguir
pm2 logs boolean-bar --lines 50 --nostream

# Reiniciar (mantém PM2 daemon)
pm2 restart boolean-bar

# Parar (não restart automático)
pm2 stop boolean-bar

# Ver uso de memória/CPU
pm2 monit

# Verificar nginx
sudo nginx -t                      # valida config
sudo systemctl reload nginx        # aplica sem dropar conexões
sudo journalctl -u nginx -n 50     # logs do nginx

# Ver swap/RAM
free -h

# Ver portas em uso
sudo netstat -tulpn | grep -E ':(80|443|4000)\s'
```

---

## Workflow comum (mudança no código)

1. **Local**: editar, commitar, pushar pro `main`
   ```bash
   git add <arquivos>
   git commit -m "..."
   git push origin main
   ```

2. **VM**: SSH + comando de deploy correspondente (ver tabela TL;DR no topo)

3. **Browser**: hard refresh (`Ctrl+Shift+R`) na URL pra invalidar cache do `index.html`

4. Verificar no `pm2 logs` que o serviço subiu sem erros.

---

## Troubleshooting

### Build do engine falha com "implicit declaration"

Algum header foi refatorado mas o caller continua usando a API antiga. Rode `make clean && make` pra ver o erro real (sem usar `.o` cacheados).

### `make clean` falha com "Permission denied"

Algum processo prendeu o `.exe`/binário. Mate antes:
```bash
pm2 stop boolean-bar
sudo pkill -f boolean_bar
make clean && make
pm2 start boolean-bar
```

### Heap corruption ao iniciar partida (mode dice/logic)

Quase sempre é `.o` stale após mudança de struct em `types.h`. Sempre rodar `make clean && make` quando o engine mudar.

### `git pull` pede senha

As credenciais GitHub não estão salvas. Roda 1x:
```bash
git config --global credential.helper store
git pull origin main
# username: rsc3-pixel
# password: <Personal Access Token>  (gerar em github.com/settings/tokens)
```
Próximas vezes não pede mais.

### PM2 não inicia automaticamente após reboot

Re-executa o startup:
```bash
pm2 save
pm2 startup       # copia o comando que ele cuspir e roda com sudo
```

### nginx falha após mudança de config

```bash
sudo nginx -t      # mostra erro de sintaxe se houver
sudo nginx -s reload
```

### Certificado HTTPS expirou

Certbot renova automaticamente via cron. Se não, renovar manual:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Onde estão as coisas na VM

| Caminho | Conteúdo |
|---|---|
| `~/boolean-bar/` | Repo clonado |
| `~/boolean-bar/build/boolean_bar` | Binário do engine compilado (Linux) |
| `~/boolean-bar/web/dist/` | Frontend buildado (Vite output) |
| `~/boolean-bar/ecosystem.config.cjs` | Config do PM2 |
| `~/.pm2/logs/boolean-bar-*.log` | Logs do app (também via `pm2 logs`) |
| `/etc/nginx/sites-available/boolean-bar` | Reverse proxy + SSL |
| `/etc/letsencrypt/live/rsc3-boolean.duckdns.org/` | Certificados HTTPS |
| `/swapfile` | 1 GB de swap (anti-OOM) |
| `/home/CHONGRENATOO/.git-credentials` | Token GitHub salvo |

---

## Atalhos no Makefile

```bash
make              # builda só o engine
make web-build    # builda só o frontend (npm install + vite build)
make clean        # limpa build/
make kill         # mata processos do node + boolean_bar
make run          # roda engine no terminal interativo (modo selecionável)
make run-logic    # engine modo Boolean Bar (lógica)
make run-dice     # engine modo Liar's Dice
make dev          # sobe servidor WS + Vite local em background (Linux usa nohup)
```

---

## Rollback

Se um deploy quebrou em prod:

```bash
cd ~/boolean-bar
git log --oneline -5         # ver os últimos commits
git reset --hard <SHA_anterior>
make clean && make && make web-build
pm2 restart boolean-bar
```

E avisar o squad pra alguém pushar um revert no `main` (senão o próximo `git pull` reintroduz o bug).
