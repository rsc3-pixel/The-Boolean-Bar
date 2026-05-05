// Avaliador de fórmulas proposicionais — espelha o `logic_engine.c` do engine C
// usando recursive descent parser. Sintaxe aceita:
//   - Variáveis: P, Q, R, S, A-Z (uma letra)
//   - Operadores: AND, OR, NOT, XOR, IMPLIES, IFF
//   - Parênteses: (
//   - Espaços ignorados
// Exemplos válidos:
//   "P AND Q"
//   "NOT P"
//   "( P OR Q ) AND R"
//   "NOT ( P AND NOT Q )"

export type Classificacao = "TAUTOLOGIA" | "CONTRADICAO" | "CONTINGENCIA";

export interface TruthTable {
  variaveis: string[];          // ["P", "Q"]
  linhas: { atribuicao: Record<string, boolean>; resultado: boolean }[];
  classificacao: Classificacao;
  formulaNormalizada: string;   // só pra debug
}

// ─── Lexer ─────────────────────────────────────────────────────────────────
type Token =
  | { kind: "var"; name: string }
  | { kind: "op"; name: "AND" | "OR" | "NOT" | "XOR" | "IMPLIES" | "IFF" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  // Normaliza alguns símbolos comuns
  const src = input
    .replace(/∧|&&|&/gi, " AND ")
    .replace(/∨|\|\||\|/gi, " OR ")
    .replace(/¬|~|!/gi, " NOT ")
    .replace(/⊕|\^/gi, " XOR ")
    .replace(/→|->|=>/gi, " IMPLIES ")
    .replace(/↔|<->|<=>/gi, " IFF ")
    .toUpperCase();
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(") { tokens.push({ kind: "lparen" }); i++; continue; }
    if (c === ")") { tokens.push({ kind: "rparen" }); i++; continue; }
    // Tenta operador palavra-chave
    const slice = src.substring(i);
    if (slice.startsWith("IMPLIES")) { tokens.push({ kind: "op", name: "IMPLIES" }); i += 7; continue; }
    if (slice.startsWith("IFF"))     { tokens.push({ kind: "op", name: "IFF" });     i += 3; continue; }
    if (slice.startsWith("AND"))     { tokens.push({ kind: "op", name: "AND" });     i += 3; continue; }
    if (slice.startsWith("XOR"))     { tokens.push({ kind: "op", name: "XOR" });     i += 3; continue; }
    if (slice.startsWith("NOT"))     { tokens.push({ kind: "op", name: "NOT" });     i += 3; continue; }
    if (slice.startsWith("OR"))      { tokens.push({ kind: "op", name: "OR" });      i += 2; continue; }
    if (/[A-Z]/.test(c)) {
      // Variável de 1 letra (consistente com o engine)
      tokens.push({ kind: "var", name: c });
      i++;
      continue;
    }
    throw new Error(`Caractere inesperado em posição ${i}: '${c}'`);
  }
  return tokens;
}

// ─── AST ──────────────────────────────────────────────────────────────────
type AST =
  | { type: "var"; name: string }
  | { type: "not"; child: AST }
  | { type: "binop"; op: "AND" | "OR" | "XOR" | "IMPLIES" | "IFF"; left: AST; right: AST };

// ─── Parser (precedência: NOT > AND > XOR > OR > IMPLIES > IFF) ────────────
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): AST {
    const node = this.parseIff();
    if (this.pos < this.tokens.length) {
      throw new Error(`Token extra após fórmula completa (posição ${this.pos})`);
    }
    return node;
  }

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  private parseIff(): AST {
    let left = this.parseImplies();
    while (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "IFF") {
      this.consume();
      const right = this.parseImplies();
      left = { type: "binop", op: "IFF", left, right };
    }
    return left;
  }
  private parseImplies(): AST {
    let left = this.parseOr();
    while (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "IMPLIES") {
      this.consume();
      const right = this.parseOr();
      left = { type: "binop", op: "IMPLIES", left, right };
    }
    return left;
  }
  private parseOr(): AST {
    let left = this.parseXor();
    while (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "OR") {
      this.consume();
      const right = this.parseXor();
      left = { type: "binop", op: "OR", left, right };
    }
    return left;
  }
  private parseXor(): AST {
    let left = this.parseAnd();
    while (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "XOR") {
      this.consume();
      const right = this.parseAnd();
      left = { type: "binop", op: "XOR", left, right };
    }
    return left;
  }
  private parseAnd(): AST {
    let left = this.parseNot();
    while (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "AND") {
      this.consume();
      const right = this.parseNot();
      left = { type: "binop", op: "AND", left, right };
    }
    return left;
  }
  private parseNot(): AST {
    if (this.peek()?.kind === "op" && (this.peek() as { kind: "op"; name: string }).name === "NOT") {
      this.consume();
      return { type: "not", child: this.parseNot() };  // permite NOT NOT P
    }
    return this.parseAtom();
  }
  private parseAtom(): AST {
    const tok = this.peek();
    if (!tok) throw new Error("Fim de fórmula inesperado");
    if (tok.kind === "lparen") {
      this.consume();
      const inner = this.parseIff();
      const next = this.peek();
      if (!next || next.kind !== "rparen") throw new Error("Parêntese de fechamento esperado");
      this.consume();
      return inner;
    }
    if (tok.kind === "var") {
      this.consume();
      return { type: "var", name: tok.name };
    }
    throw new Error(`Token inesperado: ${JSON.stringify(tok)}`);
  }
}

function evaluate(ast: AST, env: Record<string, boolean>): boolean {
  switch (ast.type) {
    case "var": return env[ast.name] ?? false;
    case "not": return !evaluate(ast.child, env);
    case "binop": {
      const l = evaluate(ast.left, env);
      const r = evaluate(ast.right, env);
      switch (ast.op) {
        case "AND":     return l && r;
        case "OR":      return l || r;
        case "XOR":     return l !== r;
        case "IMPLIES": return !l || r;
        case "IFF":     return l === r;
      }
    }
  }
}

function collectVars(ast: AST, set: Set<string>): void {
  switch (ast.type) {
    case "var":   set.add(ast.name); break;
    case "not":   collectVars(ast.child, set); break;
    case "binop": collectVars(ast.left, set); collectVars(ast.right, set); break;
  }
}

// ─── API pública ──────────────────────────────────────────────────────────
export function gerarTabelaVerdade(formula: string): TruthTable {
  const tokens = tokenize(formula);
  if (tokens.length === 0) throw new Error("Fórmula vazia");
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const varsSet = new Set<string>();
  collectVars(ast, varsSet);
  const variaveis = Array.from(varsSet).sort();
  if (variaveis.length === 0) throw new Error("Fórmula precisa de pelo menos 1 variável");
  if (variaveis.length > 5) throw new Error("Limite de 5 variáveis (2^5 = 32 linhas máximo)");

  const numLinhas = 2 ** variaveis.length;
  const linhas: TruthTable["linhas"] = [];
  let trues = 0;
  for (let i = 0; i < numLinhas; i++) {
    const atribuicao: Record<string, boolean> = {};
    // i é tratado como bitmask. Convenção: variável mais à esquerda = bit mais alto
    variaveis.forEach((v, idx) => {
      atribuicao[v] = ((i >> (variaveis.length - 1 - idx)) & 1) === 1;
    });
    const resultado = evaluate(ast, atribuicao);
    if (resultado) trues++;
    linhas.push({ atribuicao, resultado });
  }

  const classificacao: Classificacao =
    trues === numLinhas ? "TAUTOLOGIA" :
    trues === 0         ? "CONTRADICAO" :
                          "CONTINGENCIA";

  return { variaveis, linhas, classificacao, formulaNormalizada: formula.trim() };
}
