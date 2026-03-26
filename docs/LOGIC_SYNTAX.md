# Sintaxe das Fórmulas Lógicas (The Boolean Bar)

Este documento define a sintaxe padrão para as fórmulas lógicas proposicionais utilizadas no jogo "The Boolean Bar". Esta sintaxe deve ser seguida tanto pelo gerador de fórmulas (`deck_manager` - Dev 3) quanto pelo avaliador de fórmulas (`logic_engine` - Dev 2).

## 1. Variáveis Proposicionais

As variáveis proposicionais são representadas por letras maiúsculas simples.

- `P`, `Q`, `R`, `S`, `T`
- Outras letras maiúsculas podem ser usadas conforme necessário.

## 2. Conectivos Lógicos

Os seguintes conectivos lógicos são suportados, com suas respectivas representações textuais:

- **Negação (NOT)**: `NOT` (operador unário)
- **Conjunção (AND)**: `AND` (operador binário)
- **Disjunção (OR)**: `OR` (operador binário)
- **Implicação (IMPLIES)**: `IMPLIES` (operador binário)
- **Bi-implicação (IFF)**: `IFF` (operador binário)

## 3. Precedência de Operadores

A precedência dos operadores (da maior para a menor) é a seguinte:

1.  `NOT`
2.  `AND`
3.  `OR`
4.  `IMPLIES`
5.  `IFF`

## 4. Uso de Parênteses

Parênteses `()` devem ser usados para agrupar subfórmulas e para alterar a precedência padrão dos operadores.

**Exemplos de Fórmulas Válidas:**

- `P`
- `NOT P`
- `P AND Q`
- `(P OR Q) AND R`
- `P IMPLIES (Q OR R)`
- `(NOT P) IFF Q`
- `P AND NOT Q`

## 5. Espaços em Branco

Espaços em branco são permitidos entre variáveis, conectivos e parênteses, e devem ser ignorados pelo parser.

---

**Nota:** Este documento é um rascunho inicial e pode ser atualizado conforme a equipe de desenvolvimento (especialmente Dev 2 e Dev 3) refina a implementação do parser e do gerador de fórmulas.
