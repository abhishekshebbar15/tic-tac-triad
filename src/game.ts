export type Mark = 'X' | 'O'
export type Cell = Mark | null
export type Board = Cell[]
export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const

export function getResult(board: Board): { winner: Mark | null; line: number[] | null; draw: boolean } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line: [...line], draw: false }
  }
  return { winner: null, line: null, draw: board.every(Boolean) }
}

const available = (board: Board) => board.flatMap((cell, index) => cell ? [] : [index])
const other = (mark: Mark): Mark => mark === 'X' ? 'O' : 'X'

export function chooseMove(board: Board, difficulty: 'Easy' | 'Medium' | 'Hard'): number {
  const moves = available(board)
  if (difficulty === 'Easy') return moves[Math.floor(Math.random() * moves.length)]
  const immediate = (mark: Mark) => moves.find((index) => {
    const next = [...board]; next[index] = mark
    return Boolean(getResult(next).winner)
  })
  const winning = immediate('O')
  if (winning !== undefined) return winning
  if (difficulty === 'Medium') return immediate('X') ?? (moves.includes(4) ? 4 : moves[Math.floor(Math.random() * moves.length)])

  const minimax = (state: Board, turn: Mark, depth: number): number => {
    const result = getResult(state)
    if (result.winner === 'O') return 10 - depth
    if (result.winner === 'X') return depth - 10
    if (result.draw) return 0
    const scores = available(state).map((index) => {
      const next = [...state]; next[index] = turn
      return minimax(next, other(turn), depth + 1)
    })
    return turn === 'O' ? Math.max(...scores) : Math.min(...scores)
  }
  return moves.reduce((best, index) => {
    const next = [...board]; next[index] = 'O'
    const score = minimax(next, 'X', 1)
    return score > best.score ? { index, score } : best
  }, { index: moves[0], score: -Infinity }).index
}
