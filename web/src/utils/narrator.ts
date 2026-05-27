/** Narrador automatico — frases dramaticas pra substituir logs secos (Imersao 9). */

const TEMPLATES: Record<string, string[]> = {
  bet: [
    "{player} joga {qty}x face {face} na mesa. Sera blefe?",
    "{player} dobra a aposta: {qty}x face {face}!",
    "{player} vai com tudo — {qty}x face {face}. Alguem duvida?",
  ],
  dice_doubt: [
    "{player} nao engole essa! DUVIDA na mesa!",
    "{player} bate na mesa — 'DUVIDO!'",
    "Os olhos de {player} estreitam. Duvida.",
  ],
  reveal_valid: [
    "A mesa nao mente. A aposta era boa — {loser} paga o preco.",
    "Tinha dado de sobra! {loser} duvidou e se queimou.",
    "Aposta valida. {loser} perde um dado.",
  ],
  reveal_bluff: [
    "Blefe exposto! Faltaram dados — desmascarado!",
    "A farofa nao colou. {loser} perde um dado.",
    "Nao tinha dado suficiente. Blefe na lata!",
  ],
  doubt_logic: [
    "{caller} duvidou de {target}. A logica dira quem tem razao.",
    "{caller} olha nos olhos de {target}: 'Prove.'",
    "Duvida na mesa! {caller} desafia {target}.",
  ],
  doubt_correct: [
    "A verdade aparece. {loser} blefou — roleta nele!",
    "Blefe flagrado! {loser} vai encarar o tambor.",
    "Mentira exposta. {loser} vai pra roleta.",
  ],
  doubt_wrong: [
    "Falou a verdade. {loser} duvidou em vao — roleta nele!",
    "Duvida injusta! {loser} vai encarar o tambor.",
    "A logica nao perdoa. {loser} errou a duvida.",
  ],
  roulette_safe: [
    "Click. {player} respira. Dessa vez.",
    "O tambor girou... e poupou {player}.",
    "{player} sobrevive. Mas por quanto tempo?",
  ],
  roulette_dead: [
    "BANG. {player} nao volta mais.",
    "O Boolean Bar cobra seu preco. Adeus, {player}.",
    "O tambor nao perdoou. {player} cai.",
  ],
  eliminate_dice: [
    "{loser} perdeu o ultimo dado. Fora da mesa.",
    "Sem dados, sem jogo. {loser} e eliminado.",
    "A mesa engoliu {loser}. Zero dados.",
  ],
  victory: [
    "A poeira baixa. {winner} e o ultimo de pe.",
    "{winner} dominou a mesa. A casa se curva.",
    "Sobrou apenas {winner}. O Boolean Bar tem um vencedor.",
  ],
};

export function narrate(event: string, vars: Record<string, string | number>): string {
  const templates = TEMPLATES[event];
  if (!templates || templates.length === 0) return `${event}: ${JSON.stringify(vars)}`;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key));
}
