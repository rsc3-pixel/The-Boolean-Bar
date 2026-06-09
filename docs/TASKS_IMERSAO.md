# Tasks de Imersão — The Boolean Bar

Guia mastigado para o squad. Cada task tem: o que é, por que importa, o que mudar em cada arquivo (com trechos de código), e critérios de aceite.

> **Regra de ouro**: sempre rodar `npm run build` no `web/` depois de mexer no frontend pra garantir que compila. Se mexer no engine C, rodar `make clean && make` na raiz.

---

## [Imersão 1] Countdown Timer de 30s por Turno

**O que é:** Um relógio regressivo que aparece na tela quando é a vez de alguém jogar. Se o tempo acabar, o server joga automaticamente pelo jogador (carta aleatória no Logic, dúvida no Dice).

**Por que importa:** Evita que alguém trave o jogo por AFK e cria tensão natural.

### Passo a passo

#### 1. Server (`web/web_server.js`)

Quando o server sabe de quem é a vez (`room.expectedPlayerId` muda), ele inicia um timer de 30s. Se o timer estourar sem receber `send_input`, o server gera um input automático.

**Onde mexer — logo depois de atualizar `room.expectedPlayerId`:**

Procure por `room.expectedPlayerId =` (aparece em vários lugares, ex: linhas ~336, ~346). Depois de cada atualização, chame uma função nova:

```js
// Adicionar ANTES de handleCreateRoom (junto das helpers)
function startTurnTimer(room) {
  // Cancelar timer anterior se existir
  if (room.turnTimer) clearTimeout(room.turnTimer);

  const pid = room.expectedPlayerId;
  if (!pid) return;

  // Verificar se é bot — bot já joga sozinho, não precisa timer
  const player = room.players.get(pid);
  if (!player || player.isBot) return;

  room.turnTimer = setTimeout(() => {
    console.log(`[Timer] Tempo esgotado para ${pid} na sala ${room.roomId}`);

    // Gerar input automático conforme o modo
    if (room.gameMode === 'dice') {
      // No Dice, duvida automaticamente (se houver aposta) ou aposta mínima
      room.engine?.stdin?.write('D\n');
    } else {
      // No Logic, joga a primeira carta como TAUTOLOGY
      room.engine?.stdin?.write('0\nTAUTOLOGY\n');
    }
  }, 30000);
}
```

**Onde chamar `startTurnTimer(room)`:**
- Dentro de `onParse` do `JSON_STATE` (modo Logic) — logo depois de `room.expectedPlayerId = ...`
- Dentro de `onParse` do `JSON_DICE_STATE` (modo Dice) — logo depois de `room.expectedPlayerId = ...`
- Dentro de `onParse` do `JSON_DOUBT_STATE` — logo depois de `room.expectedPlayerId = ...`

**Cancelar o timer quando receber input:**
No `handleSendInput` (procure por `function handleSendInput`), adicionar no início:
```js
if (room.turnTimer) {
  clearTimeout(room.turnTimer);
  room.turnTimer = null;
}
```

**Cancelar quando a sala fechar:**
No `closeRoom`, adicionar:
```js
if (room.turnTimer) clearTimeout(room.turnTimer);
```

#### 2. Frontend — enviar deadline pro cliente

No mesmo `onParse` que chama `startTurnTimer`, o server pode incluir o timestamp limite no broadcast. **Alternativa mais simples**: o frontend calcula sozinho — quando recebe `game_state` ou `dice_state`, sabe que o turno acabou de começar e inicia 30s local.

#### 3. Hook (`web/src/hooks/useGameEngine.ts`)

Adicionar state:
```ts
const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
```

No handler de `game_state` e `dice_state`, resetar o timer:
```ts
setTurnDeadline(Date.now() + 30000);
```

No handler de `victory_state`, limpar:
```ts
setTurnDeadline(null);
```

Exportar `turnDeadline` no return do hook.

#### 4. GamePage.tsx e DiceGameOnline.tsx

Criar um componente simples de barra:

```tsx
function TurnTimer({ deadline }: { deadline: number | null }) {
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const left = Math.max(0, deadline - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || remaining <= 0) return null;

  const pct = (remaining / 30) * 100;
  const color = remaining > 10 ? "bg-cyan-500" : remaining > 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-100`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
```

Colocar `<TurnTimer deadline={turnDeadline} />` no topo da área de jogo, visível pra todos.

**Som nos últimos 5s:** No `useEffect` do timer, quando `remaining <= 5 && remaining > 0`, chamar `audioCues.click()` a cada segundo.

### Critérios de aceite
- [ ] Timer de 30s aparece quando é a vez de alguém
- [ ] Barra diminui de 100% a 0%, muda de cor (cyan → amarelo → vermelho)
- [ ] Jogada automática acontece se o tempo estourar
- [ ] Timer cancela quando o jogador envia input
- [ ] Bot não é afetado pelo timer
- [ ] Funciona em ambos os modos (Logic + Dice)

### Arquivos impactados
`web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

## [Imersão 2] Reações em Tempo Real

**O que é:** Botões de emoji que qualquer jogador pode clicar durante a partida. A reação aparece flutuando na tela de TODOS os jogadores da sala.

**Por que importa:** Dá vida à mesa sem precisar de chat texto. Cria interação social.

### Passo a passo

#### 1. Server (`web/web_server.js`)

**Adicionar no switch de actions (procure por `case 'get_leaderboard'`):**
```js
case 'send_reaction': return handleSendReaction(ws, msg);
```

**Adicionar a função handler:**
```js
const ALLOWED_REACTIONS = ['🤔', '😂', '😰', '🔥', '💀', '👏'];
const reactionCooldowns = new Map(); // playerId → timestamp

function handleSendReaction(ws, msg) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.roomId);
  if (!room) return;

  const emoji = msg.emoji;
  if (!ALLOWED_REACTIONS.includes(emoji)) return;

  // Rate limit: 1 reação a cada 2 segundos por jogador
  const now = Date.now();
  const lastTime = reactionCooldowns.get(ctx.playerId) ?? 0;
  if (now - lastTime < 2000) return;
  reactionCooldowns.set(ctx.playerId, now);

  const player = room.players.get(ctx.playerId);
  const playerName = player?.name ?? 'Anônimo';

  // Broadcast pra todos na sala
  broadcast(room, { type: 'reaction', playerName, emoji });
}
```

#### 2. Hook (`web/src/hooks/useGameEngine.ts`)

Adicionar state:
```ts
const [reactions, setReactions] = useState<{ id: string; playerName: string; emoji: string }[]>([]);
```

No handler de mensagens WS, adicionar:
```ts
if (resp.type === 'reaction') {
  const id = `react-${Date.now()}-${Math.random()}`;
  setReactions(prev => [...prev, { id, playerName: resp.playerName, emoji: resp.emoji }]);
  // Auto-remover depois de 2.5s
  setTimeout(() => {
    setReactions(prev => prev.filter(r => r.id !== id));
  }, 2500);
}
```

Adicionar action:
```ts
const sendReaction = useCallback((emoji: string) => {
  sendAction({ action: 'send_reaction', emoji });
}, [sendAction]);
```

Exportar `reactions` e `sendReaction` no return.

#### 3. GamePage.tsx e DiceGameOnline.tsx

**Barra de botões de reação (canto inferior):**
```tsx
const REACTIONS = ['🤔', '😂', '😰', '🔥', '💀', '👏'];

{/* Botões de reação */}
<div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2">
  {REACTIONS.map(emoji => (
    <button
      key={emoji}
      onClick={() => sendReaction(emoji)}
      className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-700 hover:border-cyan-500 hover:scale-110 transition-all text-lg"
    >
      {emoji}
    </button>
  ))}
</div>
```

**Reações flutuantes na tela:**
```tsx
{/* Reações flutuantes */}
{reactions.map(r => (
  <motion.div
    key={r.id}
    initial={{ opacity: 1, y: 0, x: Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2 }}
    animate={{ opacity: 0, y: -200 }}
    transition={{ duration: 2.5, ease: "easeOut" }}
    className="fixed bottom-1/3 z-50 pointer-events-none flex flex-col items-center"
  >
    <span className="text-4xl">{r.emoji}</span>
    <span className="text-xs text-white/60 font-mono">{r.playerName}</span>
  </motion.div>
))}
```

### Critérios de aceite
- [ ] 6 botões de emoji visíveis durante a partida
- [ ] Clicar envia pro server e aparece na tela de TODOS da sala
- [ ] Rate limit: máximo 1 reação a cada 2s por jogador
- [ ] Emoji flutua pra cima e desaparece em ~2.5s
- [ ] Nome de quem enviou aparece embaixo do emoji
- [ ] Spectators eliminados também podem reagir
- [ ] Funciona em mobile (botões com tamanho touch-friendly)

### Arquivos impactados
`web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

## [Imersão 3] Efeito Sonoro de Tambor na Roleta

**O que é:** Adicionar sons na fase de roleta russa: cilindro girando quando aparece a tela, click metálico quando sobrevive, e bang quando morre.

**Por que importa:** A roleta é o momento mais tenso do jogo e atualmente é silenciosa.

### Passo a passo

#### 1. Adicionar sons em `web/src/utils/audioCues.ts`

Adicionar 3 novos métodos na classe `AudioCues`, ANTES do fechamento da classe (antes da linha `}`):

```ts
  /** Som do cilindro da roleta girando (~2s) — ruído branco com sweep descendente. */
  rouletteSpin() {
    const ctx = this.getCtx();
    if (!ctx) return;
    // Tom grave girando
    this.tone({ freq: 200, duration: 1.5, type: "sawtooth", volume: 0.12, sweepTo: 80 });
    // Clicks rápidos simulando o cilindro passando pelas câmaras
    for (let i = 0; i < 8; i++) {
      this.tone({ freq: 800, duration: 0.03, type: "square", volume: 0.08, delayMs: i * 180 });
    }
  }

  /** Click metálico seco — sobreviveu à roleta. */
  rouletteClick() {
    this.tone({ freq: 1200, duration: 0.05, type: "square", volume: 0.25 });
    this.tone({ freq: 600, duration: 0.08, type: "square", volume: 0.15, delayMs: 50 });
  }

  /** Tiro de revólver — morreu na roleta. Som grave com decay. */
  rouletteBang() {
    const ctx = this.getCtx();
    if (!ctx) return;
    // Estalo agudo inicial
    this.tone({ freq: 2000, duration: 0.05, type: "sawtooth", volume: 0.3 });
    // Boom grave
    this.tone({ freq: 100, duration: 0.4, type: "sawtooth", volume: 0.3, delayMs: 30, sweepTo: 40 });
    // Eco
    this.tone({ freq: 60, duration: 0.6, type: "sine", volume: 0.15, delayMs: 200 });
  }
```

#### 2. Tocar os sons em `web/src/components/modals/RouletteScreen.tsx`

**Importar no topo:**
```ts
import { audioCues } from "../../utils/audioCues";
```

**Dentro de `handleTriggerPull` (linha ~46), adicionar o som de spin:**
```ts
const handleTriggerPull = () => {
  setIsSpinning(true);
  onTriggerPull();
  audioCues.rouletteSpin(); // ← ADICIONAR AQUI
```

**Dentro do `setTimeout` que revela o resultado (procure por `setSurvived(didSurvive)`), adicionar:**
```ts
setSurvived(didSurvive);
// ← ADICIONAR AQUI:
if (didSurvive) {
  audioCues.rouletteClick();
} else {
  audioCues.rouletteBang();
}
```

### Critérios de aceite
- [ ] Som de cilindro girando toca quando clica em "Puxar Gatilho"
- [ ] Click seco toca quando sobrevive
- [ ] Bang toca quando morre
- [ ] Sons respeitam o toggle de mute (verificar `audioCues.enabled`)
- [ ] Funciona no mobile (precisa de user gesture anterior — já garantido pelo fluxo do jogo)

### Arquivos impactados
`web/src/utils/audioCues.ts`, `web/src/components/modals/RouletteScreen.tsx`

---

## [Imersão 4] Shake na Tela Quando Alguém é Eliminado

**O que é:** Quando um jogador morre (roleta ou perde último dado), a tela de TODOS na sala treme por meio segundo. No celular, o aparelho vibra.

**Por que importa:** Feedback visceral que todo mundo sente, não só quem morreu.

### Passo a passo

#### 1. GamePage.tsx — modo Logic

Procure onde o `rouletteResult` é processado (por volta da linha 131: `if (rouletteResult)`).

Adicionar state no componente:
```ts
const [screenShake, setScreenShake] = useState(false);
```

Onde o resultado de morte é detectado (quando `rouletteResult.survived === false`), adicionar:
```ts
if (!rouletteResult.survived) {
  setScreenShake(true);
  navigator.vibrate?.(200);
  setTimeout(() => setScreenShake(false), 500);
}
```

No `div` principal do componente (o mais externo), adicionar a classe de shake:
```tsx
<div className={`... ${screenShake ? 'animate-shake' : ''}`}>
```

#### 2. DiceGameOnline.tsx — modo Dice

Mesmo approach. Detectar eliminação no handler de `diceReveal` (quando `diceReveal.eliminated === true`):
```ts
const [screenShake, setScreenShake] = useState(false);

// No useEffect que processa diceReveal:
if (diceReveal?.eliminated) {
  setScreenShake(true);
  navigator.vibrate?.(200);
  setTimeout(() => setScreenShake(false), 500);
}
```

#### 3. CSS — definir a animação

Adicionar no `web/src/index.css` (ou no Tailwind config):

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-4px) translateY(2px); }
  20% { transform: translateX(4px) translateY(-2px); }
  30% { transform: translateX(-3px) translateY(1px); }
  40% { transform: translateX(3px) translateY(-1px); }
  50% { transform: translateX(-2px); }
  60% { transform: translateX(2px); }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}
```

### Critérios de aceite
- [ ] Tela treme quando alguém morre na roleta (Logic)
- [ ] Tela treme quando alguém perde o último dado (Dice)
- [ ] Vibração funciona em Android
- [ ] Shake dura ~0.5s e para sozinho
- [ ] Não interfere com outros modais abertos

### Arquivos impactados
`GamePage.tsx`, `DiceGameOnline.tsx`, `web/src/index.css`

---

## [Imersão 5] Chat Rápido com Frases Prontas

**O que é:** Botões com frases pré-definidas (sem teclado livre). O jogador clica numa frase e ela aparece como balão na tela de todos da sala por 4 segundos.

**Por que importa:** Comunicação entre jogadores sem risco de abuso (texto livre) e sem tirar o foco do jogo.

### Passo a passo

#### 1. Server (`web/web_server.js`)

**Adicionar no switch de actions:**
```js
case 'send_chat': return handleSendChat(ws, msg);
```

**Adicionar a função:**
```js
const ALLOWED_PHRASES = [
  'Blefou!', 'Boa sorte!', 'Covarde!', 'Mentiroso!',
  'Tô suando...', 'GG', 'Fácil', 'Misericórdia!'
];
const chatCooldowns = new Map();

function handleSendChat(ws, msg) {
  const ctx = wsToRoom.get(ws);
  if (!ctx) return;
  const room = rooms.get(ctx.roomId);
  if (!room) return;

  const message = msg.message;
  if (!ALLOWED_PHRASES.includes(message)) return; // Só frases da whitelist

  // Rate limit: 1 mensagem a cada 3s
  const now = Date.now();
  const lastTime = chatCooldowns.get(ctx.playerId) ?? 0;
  if (now - lastTime < 3000) return;
  chatCooldowns.set(ctx.playerId, now);

  const player = room.players.get(ctx.playerId);
  broadcast(room, {
    type: 'chat_message',
    playerName: player?.name ?? 'Anônimo',
    message
  });
}
```

#### 2. Hook (`web/src/hooks/useGameEngine.ts`)

Adicionar state:
```ts
const [chatMessages, setChatMessages] = useState<{ id: string; playerName: string; message: string }[]>([]);
```

Handler:
```ts
if (resp.type === 'chat_message') {
  const id = `chat-${Date.now()}-${Math.random()}`;
  setChatMessages(prev => [...prev, { id, playerName: resp.playerName, message: resp.message }]);
  setTimeout(() => {
    setChatMessages(prev => prev.filter(m => m.id !== id));
  }, 4000);
}
```

Action:
```ts
const sendChat = useCallback((message: string) => {
  sendAction({ action: 'send_chat', message });
}, [sendAction]);
```

Exportar `chatMessages` e `sendChat` no return.

#### 3. GamePage.tsx e DiceGameOnline.tsx

**Botão que abre o painel de frases:**
```tsx
const [showChatPanel, setShowChatPanel] = useState(false);

const PHRASES = ['Blefou!', 'Boa sorte!', 'Covarde!', 'Mentiroso!', 'Tô suando...', 'GG', 'Fácil', 'Misericórdia!'];

{/* Botão flutuante de chat */}
<button
  onClick={() => setShowChatPanel(!showChatPanel)}
  className="fixed bottom-20 left-4 z-30 w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-700 hover:border-cyan-500 text-lg"
>
  💬
</button>

{/* Painel de frases */}
{showChatPanel && (
  <div className="fixed bottom-32 left-4 z-30 bg-zinc-900/95 border border-zinc-700 rounded-xl p-2 flex flex-col gap-1">
    {PHRASES.map(phrase => (
      <button
        key={phrase}
        onClick={() => { sendChat(phrase); setShowChatPanel(false); }}
        className="text-left px-3 py-1.5 text-sm text-cyan-200 hover:bg-cyan-950/50 rounded-lg font-mono"
      >
        {phrase}
      </button>
    ))}
  </div>
)}
```

**Balões de chat flutuantes:**
```tsx
{chatMessages.map(m => (
  <motion.div
    key={m.id}
    initial={{ opacity: 0, y: 20, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
  >
    <div className="bg-zinc-900/90 border border-cyan-500/40 rounded-xl px-4 py-2 text-center">
      <span className="text-xs text-cyan-400/60 font-mono">{m.playerName}</span>
      <p className="text-lg text-cyan-200 font-mono" style={{ fontWeight: 700 }}>{m.message}</p>
    </div>
  </motion.div>
))}
```

### Critérios de aceite
- [ ] 8 frases pré-definidas disponíveis via botão 💬
- [ ] Clicar numa frase envia pra todos na sala
- [ ] Rate limit de 3s funciona
- [ ] Balão aparece com nome do jogador e some em 4s
- [ ] Só frases da whitelist aceitas (server valida)
- [ ] Funciona em ambos os modos
- [ ] Spectators eliminados também podem enviar

### Arquivos impactados
`web_server.js`, `useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

## [Imersão 6] Animação de Dados 3D no Reveal

**O que é:** Quando os dados são revelados após uma dúvida no Dice, cada dado rola visualmente em 3D antes de parar na face correta.

**Por que importa:** O momento de reveal é o clímax da rodada — uma animação boa amplifica a tensão.

### Passo a passo

#### 1. DiceFace.tsx (`web/src/components/ui/DiceFace.tsx`)

Adicionar uma prop `rolling` ao componente. Quando `rolling=true`, o dado gira em 3D. Quando `rolling=false`, mostra a face normalmente.

```tsx
interface DiceFaceProps {
  value: number;
  size?: number;
  rolling?: boolean;  // ← ADICIONAR
}

export function DiceFace({ value, size = 48, rolling = false }: DiceFaceProps) {
  // Se rolling, aplicar animação CSS 3D
  if (rolling) {
    return (
      <div
        className="inline-block"
        style={{
          width: size, height: size,
          perspective: '200px',
        }}
      >
        <div
          className="w-full h-full bg-white rounded-lg animate-dice-roll"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          <span className="text-2xl">🎲</span>
        </div>
      </div>
    );
  }

  // Renderização normal da face (código existente continua aqui)
  // ...
}
```

#### 2. CSS — animação de rolamento

Adicionar no `web/src/index.css`:
```css
@keyframes dice-roll {
  0%   { transform: rotateX(0deg)   rotateY(0deg);   }
  25%  { transform: rotateX(90deg)  rotateY(180deg);  }
  50%  { transform: rotateX(180deg) rotateY(360deg);  }
  75%  { transform: rotateX(270deg) rotateY(540deg);  }
  100% { transform: rotateX(360deg) rotateY(720deg);  }
}
.animate-dice-roll {
  animation: dice-roll 0.8s ease-in-out infinite;
}
```

#### 3. DiceGameOnline.tsx — stagger no reveal

No overlay de reveal (procure por `diceReveal` na seção que mostra os dados revelados, ~linha 440), usar um state que controla quais dados já pararam de rolar:

```tsx
const [revealedDice, setRevealedDice] = useState<number[]>([]);

// Quando diceReveal chega, revelar dados um por um com delay de 300ms
useEffect(() => {
  if (!diceReveal) { setRevealedDice([]); return; }

  const allDice = diceReveal.allDice ?? [];
  // Flatten: array de arrays → array simples de { playerIdx, dieIdx, face }
  const flatDice = allDice.flatMap((playerDice, pIdx) =>
    playerDice.map((face, dIdx) => ({ key: pIdx * 10 + dIdx, face }))
  );

  setRevealedDice([]);
  flatDice.forEach((d, i) => {
    setTimeout(() => {
      setRevealedDice(prev => [...prev, d.key]);
    }, i * 300);
  });
}, [diceReveal]);
```

Ao renderizar cada dado: `<DiceFace value={face} rolling={!revealedDice.includes(key)} />`

### Critérios de aceite
- [ ] Dados rolam em 3D antes de revelar a face
- [ ] Cada dado para individualmente com delay de ~300ms entre eles
- [ ] Face final corresponde ao valor real do state
- [ ] Funciona em mobile sem lag
- [ ] Não quebra o layout existente do overlay

### Arquivos impactados
`web/src/components/ui/DiceFace.tsx`, `web/src/pages/DiceGameOnline.tsx`, `web/src/index.css`

---

## [Imersão 7] Streak/Combo Visual

**O que é:** Quando um jogador acerta 2+ dúvidas/confrontos seguidos, aparece um badge "🔥 STREAK x2!" na tela de todos.

**Por que importa:** Gamificação que destaca quem está dominando e cria narrativa natural.

### Passo a passo

#### 1. Hook (`web/src/hooks/useGameEngine.ts`)

Adicionar state de streaks:
```ts
const [streaks, setStreaks] = useState<Record<string, number>>({});
const [currentStreak, setCurrentStreak] = useState<{ name: string; count: number } | null>(null);
```

**No handler de `doubt_result` (modo Logic), procure por `pushLog('doubt', ...)` (~linha 418):**
```ts
// Identificar quem ganhou o confronto
const winner = resp.data?.bluffed ? resp.data.caller : resp.data.target;
const loser = resp.data?.bluffed ? resp.data.target : resp.data.caller;

setStreaks(prev => {
  const newStreaks = { ...prev };
  newStreaks[winner] = (prev[winner] ?? 0) + 1;
  newStreaks[loser] = 0; // reseta streak de quem perdeu
  const count = newStreaks[winner];
  if (count >= 2) {
    setCurrentStreak({ name: winner, count });
    setTimeout(() => setCurrentStreak(null), 2500); // some depois de 2.5s
  }
  return newStreaks;
});
```

**No handler de `dice_reveal` (modo Dice), procure por `pushLog('reveal', ...)` (~linha 469):**

Mesma lógica: identificar `winner` e `loser` do confronto via `diceReveal.betValid` e atualizar `streaks`.

Exportar `currentStreak` no return.

#### 2. GamePage.tsx e DiceGameOnline.tsx

Renderizar o badge de streak:
```tsx
{/* Streak overlay */}
<AnimatePresence>
  {currentStreak && (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="text-center">
        <div className="text-6xl">🔥</div>
        <p className="text-3xl text-orange-400 font-mono tracking-widest" style={{ fontWeight: 900 }}>
          STREAK x{currentStreak.count}!
        </p>
        <p className="text-lg text-orange-300/80 font-mono">{currentStreak.name}</p>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Critérios de aceite
- [ ] Streak conta acertos consecutivos do mesmo jogador
- [ ] Aparece a partir de 2 acertos seguidos (x2, x3, x4...)
- [ ] Reseta quando o jogador erra
- [ ] Overlay some em ~2.5s
- [ ] Funciona em Logic (dúvida acertada) e Dice (dúvida acertada)
- [ ] Visível pra todos na sala (client-side, cada um calcula)

### Arquivos impactados
`useGameEngine.ts`, `GamePage.tsx`, `DiceGameOnline.tsx`

---

## [Imersão 8] Entrada Dramática no Início do Jogo

**O que é:** Quando o host clica "Iniciar", antes do jogo começar, aparece uma tela de apresentação com os nomes dos jogadores aparecendo um por um.

**Por que importa:** Dá clima de evento, apresenta quem está na mesa, cria expectativa.

### Passo a passo

#### 1. Criar componente `web/src/components/screens/GameIntro.tsx`

```tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioCues } from "../../utils/audioCues";

interface GameIntroProps {
  players: { name: string; isBot?: boolean }[];
  gameMode: "logic" | "dice";
  onComplete: () => void;
}

export function GameIntro({ players, gameMode, onComplete }: GameIntroProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    // Revelar um jogador a cada 600ms
    const timers: ReturnType<typeof setTimeout>[] = [];
    players.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealedCount(i + 1);
        // Tom ascendente pra cada jogador
        audioCues.click();
      }, (i + 1) * 600));
    });

    // Depois de revelar todos, mostra "GO!" e chama onComplete
    const goTimer = setTimeout(() => setShowGo(true), (players.length + 1) * 600);
    const completeTimer = setTimeout(onComplete, (players.length + 2) * 600);

    timers.push(goTimer, completeTimer);
    return () => timers.forEach(clearTimeout);
  }, [players, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <p className="text-sm tracking-[0.5em] text-cyan-500/60 font-mono uppercase mb-8">
        {gameMode === "dice" ? "LIAR'S DICE" : "BOOLEAN BAR"}
      </p>

      <div className="space-y-3">
        {players.slice(0, revealedCount).map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex items-center gap-4"
          >
            <span className="text-cyan-500/50 font-mono w-8 text-right">{i + 1}.</span>
            <span className="text-3xl text-cyan-200 font-mono tracking-wider" style={{ fontWeight: 800 }}>
              {p.name}
            </span>
            {p.isBot && <span className="text-xs text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">BOT</span>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showGo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-12 text-6xl text-yellow-300 font-mono" style={{ fontWeight: 900 }}
          >
            GO!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 2. GamePage.tsx e DiceGameOnline.tsx

Usar o componente entre `gameStarting` e o primeiro state do jogo:

```tsx
const [introComplete, setIntroComplete] = useState(false);

// Mostrar intro quando jogo está começando mas ainda não veio game_state
const showIntro = gameStarting && !gameState && !introComplete;

// Resetar quando sai do jogo
useEffect(() => { setIntroComplete(false); }, [roomState?.roomId]);

{showIntro && (
  <GameIntro
    players={roomState?.players.map(p => ({ name: p.name, isBot: p.isBot })) ?? []}
    gameMode={roomState?.gameMode ?? "logic"}
    onComplete={() => setIntroComplete(true)}
  />
)}
```

### Critérios de aceite
- [ ] Nomes aparecem um por um com animação de slide-in
- [ ] Som curto acompanha cada nome
- [ ] Bots aparecem com badge "BOT"
- [ ] "GO!" aparece no final
- [ ] Duração total: ~3-4s (depende do nº de jogadores)
- [ ] Funciona em ambos os modos
- [ ] Todos na sala veem a mesma intro

### Arquivos impactados
Novo: `web/src/components/screens/GameIntro.tsx`. Modificar: `GamePage.tsx`, `DiceGameOnline.tsx`

---

## [Imersão 9] Narrador Automático com Frases Dramáticas

**O que é:** Substituir as mensagens secas do GameLog por frases narrativas aleatórias que descrevem o que aconteceu com tom dramático de cassino.

**Por que importa:** Transforma um log técnico num narrador que conta a história da partida.

### Passo a passo

#### 1. Criar `web/src/utils/narrator.ts`

```ts
// Banco de frases por tipo de evento. Cada array tem 3+ variações.
// Use {player}, {target}, {qty}, {face} como placeholders.

const TEMPLATES: Record<string, string[]> = {
  bet: [
    "{player} joga {qty}× face {face} na mesa. Será blefe?",
    "{player} dobra a aposta: {qty}× face {face}!",
    "{player} vai com tudo — {qty}× face {face}. Alguém duvida?",
  ],
  dice_doubt: [
    "{player} não engole essa! DUVIDA na mesa!",
    "{player} bate na mesa — 'DUVIDO!'",
    "Os olhos de {player} estreitam. Duvida.",
  ],
  reveal_valid: [
    "A mesa não mente. A aposta era boa — {target} paga o preço.",
    "Tinha dado de sobra! {player} duvidou e se queimou.",
    "Aposta válida. {target} perde um dado.",
  ],
  reveal_bluff: [
    "Blefe exposto! Faltaram dados — {player} viu na lata!",
    "A farofa não colou. {target} perde um dado.",
    "Não tinha dado suficiente. {player} desmascarou o blefe!",
  ],
  doubt_logic: [
    "{player} duvidou de {target}. A lógica dirá quem tem razão.",
    "{player} olha nos olhos de {target}: 'Prove.'",
    "Dúvida na mesa! {player} desafia {target}.",
  ],
  doubt_correct: [
    "A verdade aparece. {target} mentiu — roleta nele!",
    "Blefe flagrado! {target} vai encarar o tambor.",
    "{player} estava certo. {target} vai pra roleta.",
  ],
  doubt_wrong: [
    "{target} falou a verdade. {player} duvidou e agora paga.",
    "Dúvida injusta! {player} vai encarar o tambor.",
    "A lógica não perdoa. {player} errou a dúvida.",
  ],
  roulette_safe: [
    "Click. {player} respira. Dessa vez.",
    "O tambor girou... e poupou {player}.",
    "{player} sobrevive. Mas por quanto tempo?",
  ],
  roulette_dead: [
    "BANG. {player} não volta mais.",
    "O Boolean Bar cobra seu preço. Adeus, {player}.",
    "O tambor não perdoou. {player} cai.",
  ],
  eliminate_dice: [
    "{player} perdeu o último dado. Fora da mesa.",
    "Sem dados, sem jogo. {player} é eliminado.",
    "A mesa engoliu {player}. Zero dados.",
  ],
  victory: [
    "A poeira baixa. {player} é o último de pé.",
    "{player} dominou a mesa. A casa se curva.",
    "Sobrou apenas {player}. O Boolean Bar tem um vencedor.",
  ],
};

/** Escolhe uma frase aleatória e preenche os placeholders. */
export function narrate(event: string, vars: Record<string, string | number>): string {
  const templates = TEMPLATES[event];
  if (!templates || templates.length === 0) return `${event}: ${JSON.stringify(vars)}`;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key));
}
```

#### 2. Hook (`web/src/hooks/useGameEngine.ts`)

Importar:
```ts
import { narrate } from "../utils/narrator";
```

Substituir os `pushLog` existentes. Exemplo:

**ANTES:**
```ts
pushLog('bet', `${resp.data.caller} apostou ${resp.data.qt}× face ${resp.data.face}`);
```

**DEPOIS:**
```ts
pushLog('bet', narrate('bet', { player: resp.data.caller, qty: resp.data.qt, face: resp.data.face }));
```

**Lista de substituições:**

| Linha aprox. | Antes | Depois |
|---|---|---|
| ~452 | `${caller} apostou ${qt}× face ${face}` | `narrate('bet', { player: caller, qty, face })` |
| ~457 | `${caller} duvidou da aposta` | `narrate('dice_doubt', { player: caller })` |
| ~469 | `${verdict} → ${tail}` | `narrate(betValid ? 'reveal_valid' : 'reveal_bluff', { player: caller, target: ... })` |
| ~408 | `${caller} duvidou de ${target}` | `narrate('doubt_logic', { player: caller, target })` |
| ~418 | `bluffed ? ... : ...` | `narrate(bluffed ? 'doubt_correct' : 'doubt_wrong', { player: caller, target })` |
| ~433 | `${player} sobreviveu à roleta` | `narrate('roulette_safe', { player })` |
| ~435 | `${player} foi eliminado na roleta` | `narrate('roulette_dead', { player })` |
| ~442 | `${winner} venceu a partida` | `narrate('victory', { player: winner })` |

### Critérios de aceite
- [ ] Pelo menos 3 variações por tipo de evento
- [ ] Nomes dos jogadores inseridos dinamicamente
- [ ] Tom de cassino noir (dramático mas não exagerado)
- [ ] Funciona em ambos os modos (Logic + Dice)
- [ ] Frases diferentes a cada partida (random)

### Arquivos impactados
Novo: `web/src/utils/narrator.ts`. Modificar: `useGameEngine.ts`

---

## [Imersão 10] Pulsação do Avatar Quando é a Vez do Jogador

**O que é:** O card do jogador ativo (é a vez dele) recebe uma borda brilhante pulsando pra destacar visualmente.

**Por que importa:** Facilita saber de quem é a vez com um olhar rápido, especialmente na TV.

### Passo a passo

O `OpponentDiceCard` já tem isso implementado! Veja `web/src/components/ui/OpponentDiceCard.tsx` linhas 34-47 — quando `isCurrentTurn=true`, já tem um pulse ring e badge "TURNO".

**O que falta:** Verificar se o `GamePage.tsx` (modo Logic) faz o mesmo nos cards dos oponentes.

#### GamePage.tsx

Procurar onde os cards dos oponentes são renderizados (componente `OpponentCard` ou similar). Verificar se já recebem `isCurrentTurn`. Se não:

Adicionar prop `isCurrentTurn={gameState?.turn === oponenteSlot}` e aplicar o mesmo CSS:

```tsx
{isCurrentTurn && (
  <motion.div
    animate={{
      scale: [1, 1.08, 1],
      opacity: [0.6, 0.3, 0.6]
    }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    className="absolute inset-0 rounded-lg border-2 border-cyan-400/60"
  />
)}
```

### Critérios de aceite
- [ ] Card do jogador da vez pulsa no modo Dice (já funciona — verificar)
- [ ] Card do jogador da vez pulsa no modo Logic (verificar/implementar)
- [ ] Pulsação é sutil (não distrai)
- [ ] Funciona em mobile

### Arquivos impactados
`GamePage.tsx` (verificar `OpponentCard` ou equivalente)

---

## [Imersão 11] Confetti na Tela de Vitória

**O que é:** Quando a VictoryScreen aparece, confetti colorido cai pela tela.

**Por que importa:** Celebração visual que marca o fim da partida com impacto.

### Passo a passo

#### Opção A — Com biblioteca (mais fácil)

1. Instalar: `cd web && npm install canvas-confetti`
2. Em `web/src/components/screens/VictoryScreen.tsx`, importar e disparar:

```tsx
import confetti from 'canvas-confetti';

// Dentro do componente, adicionar useEffect:
useEffect(() => {
  if (!isVisible) return;

  // 3 rajadas de confetti com delay
  const timers = [
    setTimeout(() => confetti({ particleCount: 80, spread: 80, origin: { y: 0.6, x: 0.3 } }), 300),
    setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5, x: 0.5 } }), 700),
    setTimeout(() => confetti({ particleCount: 80, spread: 80, origin: { y: 0.6, x: 0.7 } }), 1100),
  ];

  return () => timers.forEach(clearTimeout);
}, [isVisible]);
```

#### Opção B — Sem biblioteca (CSS puro)

Adicionar partículas com `motion.div` no VictoryScreen (similar aos casino chips que já existem, mas retangulares e coloridos):

```tsx
{/* Confetti */}
{Array.from({ length: 30 }).map((_, i) => (
  <motion.div
    key={`confetti-${i}`}
    initial={{
      opacity: 1,
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
      y: -20,
      rotate: Math.random() * 360,
    }}
    animate={{
      y: window.innerHeight + 50,
      rotate: Math.random() * 720,
      opacity: [1, 1, 0],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay: 0.5 + i * 0.05,
      ease: "easeIn",
    }}
    className="absolute pointer-events-none"
    style={{
      width: 8 + Math.random() * 8,
      height: 4 + Math.random() * 4,
      backgroundColor: ['#06b6d4', '#facc15', '#ef4444', '#22c55e', '#a855f7', '#f97316'][i % 6],
      borderRadius: 2,
    }}
  />
))}
```

### Critérios de aceite
- [ ] Confetti aparece quando a tela de vitória surge
- [ ] Cores variadas (não só cyan)
- [ ] Não bloqueia cliques (pointer-events: none)
- [ ] Botão "BACK TO MAIN MENU" continua clicável
- [ ] Performance ok em mobile

### Arquivos impactados
`VictoryScreen.tsx`, `package.json` (se usar canvas-confetti)

---

## [Imersão 12] Sons Distintos por Evento

**O que é:** Adicionar sons diferenciados para cada tipo de evento do jogo, melhorando os tons sintetizados atuais.

**Por que importa:** Sons distintos criam identidade sonora pro jogo e ajudam o jogador a saber o que aconteceu sem olhar pra tela.

### Passo a passo

#### 1. Adicionar novos métodos em `web/src/utils/audioCues.ts`

Adicionar ANTES do fechamento da classe (antes da linha `}`):

```ts
  /** Som de eliminação: tom grave descendente dramático. */
  eliminate() {
    this.tone({ freq: 400, duration: 0.15, type: "sawtooth", volume: 0.25, sweepTo: 100 });
    this.tone({ freq: 100, duration: 0.5, type: "sine", volume: 0.2, delayMs: 150, sweepTo: 40 });
  }

  /** Fanfarra de vitória: 3 tons ascendentes rápidos. */
  victory() {
    this.tone({ freq: 523, duration: 0.15, type: "triangle", volume: 0.2 });           // C5
    this.tone({ freq: 659, duration: 0.15, type: "triangle", volume: 0.2, delayMs: 150 }); // E5
    this.tone({ freq: 784, duration: 0.3, type: "triangle", volume: 0.25, delayMs: 300 }); // G5
  }

  /** Som de aposta alta: moeda pesada caindo na mesa. */
  highBet() {
    this.tone({ freq: 300, duration: 0.1, type: "square", volume: 0.2 });
    this.tone({ freq: 200, duration: 0.15, type: "square", volume: 0.15, delayMs: 80 });
  }

  /** Som de dúvida dramática: acorde dissonante tenso. */
  dramaticDoubt() {
    this.tone({ freq: 200, duration: 0.3, type: "sawtooth", volume: 0.18 });
    this.tone({ freq: 250, duration: 0.3, type: "sawtooth", volume: 0.15 });
    this.tone({ freq: 150, duration: 0.4, type: "sawtooth", volume: 0.12, delayMs: 100 });
  }
```

#### 2. Chamar os sons nos lugares certos

**No hook (`useGameEngine.ts`):**

| Evento | Onde chamar | Método |
|---|---|---|
| Eliminação na roleta | Handler de `roulette_result` quando `survived === false` (~linha 435) | `audioCues.eliminate()` |
| Eliminação no dice | Handler de `dice_reveal` quando `eliminated === true` (~linha 466) | `audioCues.eliminate()` |
| Vitória | Handler de `victory_state` (~linha 442) | `audioCues.victory()` |
| Dúvida (dice) | Handler de `dice_doubt` (~linha 457) | `audioCues.dramaticDoubt()` |

**Exemplo:**
```ts
// ANTES (linha ~435):
pushLog('roulette_dead', `💀 ${resp.data.player} foi eliminado na roleta`);

// ADICIONAR LOGO DEPOIS:
audioCues.eliminate();
```

```ts
// ANTES (linha ~442):
pushLog('victory', `🏆 ${resp.data.winner} venceu a partida`);

// ADICIONAR LOGO DEPOIS:
audioCues.victory();
```

### Critérios de aceite
- [ ] Eliminação tem som grave dramático
- [ ] Vitória tem fanfarra ascendente
- [ ] Dúvida tem som tenso e dissonante
- [ ] Todos os sons respeitam o toggle de mute
- [ ] Volume consistente (não um muito alto e outro baixo)
- [ ] Funciona em mobile após primeiro gesture

### Arquivos impactados
`web/src/utils/audioCues.ts`, `web/src/hooks/useGameEngine.ts`

---

## Resumo rápido pra o kanban

| # | Task | Complexidade | Prioridade |
|---|---|---|---|
| 1 | Countdown timer 30s | Alta | Alta |
| 2 | Reações emoji | Média | Alta |
| 3 | Sons da roleta | Baixa | Alta |
| 4 | Shake na eliminação | Baixa | Alta |
| 5 | Chat frases prontas | Média | Média |
| 6 | Dados 3D no reveal | Alta | Média |
| 7 | Streak/combo | Média | Média |
| 8 | Entrada dramática | Média | Média |
| 9 | Narrador automático | Média | Média |
| 10 | Pulsação do avatar | Baixa | Baixa |
| 11 | Confetti na vitória | Baixa | Baixa |
| 12 | Sons por evento | Baixa | Média |

> **Sugestão de ordem**: começar pelas de baixa complexidade e alta prioridade (3, 4, 11, 12) pra ter quick wins, depois as médias (2, 5, 7, 8, 9, 10), e por fim as mais complexas (1, 6).
