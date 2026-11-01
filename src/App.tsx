import { useEffect, useState, type CSSProperties } from 'react'
import { chooseMove, getResult, type Board, type Mark } from './game'

type Mode = 'computer' | 'local'
type Scores = { X: number; O: number; draws: number }
const emptyBoard = (): Board => Array(9).fill(null)
const defaultScores: Scores = { X: 0, O: 0, draws: 0 }

function readScores(): Scores {
  try {
    const value = JSON.parse(localStorage.getItem('tic-tac-triad-scores') ?? localStorage.getItem('tictac-arena-scores') ?? 'null')
    if (value && ['X', 'O', 'draws'].every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0)) return value as Scores
  } catch { /* Persistence is optional. */ }
  return defaultScores
}

function App() {
  const [mode, setMode] = useState<Mode>('computer')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Hard')
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [turn, setTurn] = useState<Mark>('X')
  const [scores, setScores] = useState<Scores>(readScores)
  const result = getResult(board)
  const finished = Boolean(result.winner || result.draw)
  const computerTurn = mode === 'computer' && turn === 'O' && !finished

  useEffect(() => {
    try { localStorage.setItem('tic-tac-triad-scores', JSON.stringify(scores)) } catch { /* Keep playing without storage. */ }
  }, [scores])

  useEffect(() => {
    if (!computerTurn) return
    const timer = window.setTimeout(() => {
      if (getResult(board).winner || getResult(board).draw) return
      const next = [...board]; next[chooseMove(board, difficulty)] = 'O'
      setBoard(next)
      const outcome = getResult(next)
      if (outcome.winner) setScores((s) => ({ ...s, [outcome.winner as Mark]: s[outcome.winner as Mark] + 1 }))
      else if (outcome.draw) setScores((s) => ({ ...s, draws: s.draws + 1 }))
      setTurn('X')
    }, 460)
    return () => window.clearTimeout(timer)
  }, [computerTurn, difficulty, board])

  const newGame = () => { setBoard(emptyBoard()); setTurn('X') }
  const handleMode = (next: Mode) => { if (next !== mode) { setMode(next); newGame() } }
  const move = (index: number) => {
    if (board[index] || finished || computerTurn) return
    const next = [...board]; next[index] = turn
    setBoard(next)
    const outcome = getResult(next)
    if (outcome.winner) setScores((s) => ({ ...s, [outcome.winner as Mark]: s[outcome.winner as Mark] + 1 }))
    else if (outcome.draw) setScores((s) => ({ ...s, draws: s.draws + 1 }))
    setTurn(turn === 'X' ? 'O' : 'X')
  }
  const resetScores = () => {
    if (window.confirm('Reset all scores? This cannot be undone.')) setScores(defaultScores)
  }

  let status = finished
    ? result.winner ? (mode === 'computer' && result.winner === 'O' ? 'Computer wins' : `${result.winner} wins`) : 'Round drawn'
    : computerTurn ? 'Computer is thinking…' : mode === 'computer' && turn === 'X' ? 'Your move' : `${turn}’s turn`

  return <main className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Tic Tac Triad home"><span className="brand-mark"><i /><i /><i /></span><span>TIC TAC <span className="brand-light">TRIAD</span></span></a>
    </header>

    <section className="arena-layout" id="home">
      <aside className={`showcase ${finished ? result.draw ? 'showcase-draw' : 'showcase-won' : ''}`} aria-hidden="true">
        <div className="showcase-halo" />
        <div className="showcase-orbit orbit-one" /><div className="showcase-orbit orbit-two" />
        <div className="showcase-board">
          {(['X', '', 'O', '', 'X', '', 'O', '', 'X'] as const).map((mark, index) => <span key={index} className={`showcase-cell ${mark ? `showcase-${mark.toLowerCase()}` : ''}`} style={{ '--i': index } as CSSProperties}>{mark}</span>)}
        </div>
        <span className="showcase-node node-one" /><span className="showcase-node node-two" /><span className="showcase-node node-three" />
      </aside>

      <section className="game-panel" aria-label="Tic-Tac-Toe game">
        <div className="mode-control" aria-label="Game mode">
          <button className={mode === 'computer' ? 'selected' : ''} onClick={() => handleMode('computer')} aria-pressed={mode === 'computer'}><span className="mode-icon ai-icon">AI</span> PLAY VS COMPUTER</button>
          <button className={mode === 'local' ? 'selected' : ''} onClick={() => handleMode('local')} aria-pressed={mode === 'local'}><span className="mode-icon"><i /><i /></span> TWO PLAYERS</button>
        </div>
        {mode === 'computer' && <div className="difficulty-row"><span>DIFFICULTY</span><div className="difficulty-control">{(['Easy', 'Medium', 'Hard'] as const).map((level) => <button key={level} className={difficulty === level ? 'active' : ''} onClick={() => { setDifficulty(level); newGame() }} aria-pressed={difficulty === level}>{level}</button>)}</div></div>}
        <div className={`game-status ${finished ? 'ended' : ''}`} aria-live="polite"><span className="status-orb" />{status}<span className="status-line" /></div>
        <div className="board-stage">
          <div className="board-shadow" />
          <div className={`board ${result.draw ? 'board-draw' : ''}`} role="grid" aria-label="Tic-Tac-Toe board">
            {board.map((cell, index) => <button key={index} className={`cell ${cell ? `mark-${cell.toLowerCase()}` : ''} ${result.line?.includes(index) ? 'winner-cell' : ''}`} role="gridcell" aria-label={`Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}${cell ? `, ${cell}` : ', empty'}`} onClick={() => move(index)} disabled={Boolean(cell) || finished || computerTurn}>
              {cell && <span className={`symbol ${cell === 'X' ? 'symbol-x' : 'symbol-o'}`}>{cell === 'X' ? <><i /><i /></> : <i />}</span>}
            </button>)}
          </div>
          <span className="board-corner corner-tl" /><span className="board-corner corner-tr" /><span className="board-corner corner-bl" /><span className="board-corner corner-br" />
        </div>
        <div className="game-footer"><button className="new-game" onClick={newGame}>NEW GAME</button></div>
      </section>

      <aside className="score-panel">
        <div className="score-card score-x"><div className="score-player"><span className="score-symbol">X</span><strong>{mode === 'computer' ? 'YOU' : 'PLAYER ONE'}</strong></div><strong className="score-number">{scores.X.toString().padStart(2, '0')}</strong></div>
        <div className="score-card score-o"><div className="score-player"><span className="score-symbol">O</span><strong>{mode === 'computer' ? 'ARENA AI' : 'PLAYER TWO'}</strong></div><strong className="score-number">{scores.O.toString().padStart(2, '0')}</strong></div>
        <div className="score-card score-draw"><div className="score-player"><strong>DRAWS</strong></div><strong className="score-number">{scores.draws.toString().padStart(2, '0')}</strong></div>
        <button className="reset-button" onClick={resetScores}>RESET SCORES <span>↗</span></button>
      </aside>
    </section>

  </main>
}

export default App
