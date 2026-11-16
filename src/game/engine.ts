import {
  ADJACENCY,
  BOARD_NODES,
  INITIAL_TIGER_NODES,
  JUMPS,
  TIGERS_WIN_CAPTURES,
  TOTAL_GOATS,
} from './board.ts';
import type {
  CellValue,
  GamePhase,
  GameSnapshot,
  GameState,
  Move,
  PlayerSide,
  SimState,
} from './types.ts';

export function createInitialState(): GameState {
  const board: CellValue[] = Array(BOARD_NODES.length).fill(null);
  const pieceIds: (string | null)[] = Array(BOARD_NODES.length).fill(null);

  INITIAL_TIGER_NODES.forEach((nodeId, idx) => {
    board[nodeId] = 'TIGER';
    pieceIds[nodeId] = `tiger-${idx}`;
  });

  return {
    board,
    pieceIds,
    turn: 'GOAT',
    goatsToPlace: TOTAL_GOATS,
    capturedGoats: 0,
    winner: null,
    winReason: null,
    lastMove: null,
    moveCount: 0,
    nextGoatSeq: 1,
    history: [],
  };
}

export function getGamePhase(goatsToPlace: number): GamePhase {
  return goatsToPlace > 0 ? 'PLACEMENT' : 'MOVEMENT';
}

export function countGoatsOnBoard(board: CellValue[]): number {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 'GOAT') count++;
  }
  return count;
}

export function getTigerPositions(board: CellValue[]): number[] {
  const positions: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 'TIGER') positions.push(i);
  }
  return positions;
}

export function getLegalMovesForTigerAt(board: CellValue[], nodeId: number): Move[] {
  if (board[nodeId] !== 'TIGER') return [];
  const moves: Move[] = [];

  for (const neighbor of ADJACENCY[nodeId]) {
    if (board[neighbor] === null) {
      moves.push({ type: 'MOVE', from: nodeId, to: neighbor });
    }
  }

  for (const jump of JUMPS[nodeId]) {
    if (board[jump.over] === 'GOAT' && board[jump.to] === null) {
      moves.push({ type: 'CAPTURE', from: nodeId, over: jump.over, to: jump.to });
    }
  }

  return moves;
}

export function getBlockedTigersCount(board: CellValue[]): number {
  let blocked = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 'TIGER' && getLegalMovesForTigerAt(board, i).length === 0) {
      blocked++;
    }
  }
  return blocked;
}

export function getLegalMovesSim(state: Pick<SimState, 'board' | 'turn' | 'goatsToPlace' | 'winner'>): Move[] {
  if (state.winner !== null) return [];

  const moves: Move[] = [];
  if (state.turn === 'GOAT') {
    if (state.goatsToPlace > 0) {
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] === null) {
          moves.push({ type: 'PLACE', to: i });
        }
      }
    } else {
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] === 'GOAT') {
          for (const neighbor of ADJACENCY[i]) {
            if (state.board[neighbor] === null) {
              moves.push({ type: 'MOVE', from: i, to: neighbor });
            }
          }
        }
      }
    }
  } else {
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === 'TIGER') {
        const tigerMoves = getLegalMovesForTigerAt(state.board, i);
        for (const m of tigerMoves) moves.push(m);
      }
    }
  }
  return moves;
}

export function getLegalMovesForNode(state: GameState, nodeId: number): Move[] {
  if (state.winner !== null) return [];

  if (state.turn === 'GOAT') {
    if (state.goatsToPlace > 0) {
      return state.board[nodeId] === null ? [{ type: 'PLACE', to: nodeId }] : [];
    }
    if (state.board[nodeId] !== 'GOAT') return [];
    const moves: Move[] = [];
    for (const neighbor of ADJACENCY[nodeId]) {
      if (state.board[neighbor] === null) {
        moves.push({ type: 'MOVE', from: nodeId, to: neighbor });
      }
    }
    return moves;
  }

  return getLegalMovesForTigerAt(state.board, nodeId);
}

export function isMoveLegal(
  state: Pick<SimState, 'board' | 'turn' | 'goatsToPlace' | 'winner'>,
  move: Move
): boolean {
  if (state.winner !== null) return false;

  if (move.type === 'PLACE') {
    return (
      state.turn === 'GOAT' &&
      state.goatsToPlace > 0 &&
      move.to >= 0 &&
      move.to < state.board.length &&
      state.board[move.to] === null
    );
  }

  if (move.type === 'MOVE') {
    if (move.from < 0 || move.from >= state.board.length) return false;
    if (move.to < 0 || move.to >= state.board.length) return false;
    if (state.board[move.to] !== null) return false;
    if (!ADJACENCY[move.from].includes(move.to)) return false;

    if (state.turn === 'GOAT') {
      return state.goatsToPlace === 0 && state.board[move.from] === 'GOAT';
    }
    return state.board[move.from] === 'TIGER';
  }

  if (move.type === 'CAPTURE') {
    if (state.turn !== 'TIGER') return false;
    if (move.from < 0 || move.from >= state.board.length) return false;
    if (state.board[move.from] !== 'TIGER') return false;
    return JUMPS[move.from].some(
      (j) =>
        j.over === move.over &&
        j.to === move.to &&
        state.board[j.over] === 'GOAT' &&
        state.board[j.to] === null
    );
  }

  return false;
}

export function applyMoveSim(state: SimState, move: Move): SimState {
  const board = state.board.slice();
  let goatsToPlace = state.goatsToPlace;
  let capturedGoats = state.capturedGoats;

  if (move.type === 'PLACE') {
    board[move.to] = 'GOAT';
    goatsToPlace -= 1;
  } else if (move.type === 'MOVE') {
    board[move.to] = board[move.from];
    board[move.from] = null;
  } else {
    board[move.to] = board[move.from];
    board[move.from] = null;
    board[move.over] = null;
    capturedGoats += 1;
  }

  const nextTurn: PlayerSide = state.turn === 'GOAT' ? 'TIGER' : 'GOAT';
  let winner: PlayerSide | null = null;

  if (capturedGoats >= TIGERS_WIN_CAPTURES) {
    winner = 'TIGER';
  } else {
    const nextLegal = getLegalMovesSim({
      board,
      turn: nextTurn,
      goatsToPlace,
      winner: null,
    });
    if (nextLegal.length === 0) {
      winner = nextTurn === 'TIGER' ? 'GOAT' : 'TIGER';
    }
  }

  return {
    board,
    turn: nextTurn,
    goatsToPlace,
    capturedGoats,
    winner,
  };
}

function takeSnapshot(state: GameState): GameSnapshot {
  return {
    board: state.board.slice(),
    pieceIds: state.pieceIds.slice(),
    turn: state.turn,
    goatsToPlace: state.goatsToPlace,
    capturedGoats: state.capturedGoats,
    winner: state.winner,
    winReason: state.winReason,
    lastMove: state.lastMove,
    moveCount: state.moveCount,
    nextGoatSeq: state.nextGoatSeq,
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  if (!isMoveLegal(state, move)) {
    throw new Error(`Illegal move attempted: ${JSON.stringify(move)}`);
  }

  const snapshot = takeSnapshot(state);
  const board = state.board.slice();
  const pieceIds = state.pieceIds.slice();
  let goatsToPlace = state.goatsToPlace;
  let capturedGoats = state.capturedGoats;
  let nextGoatSeq = state.nextGoatSeq;

  if (move.type === 'PLACE') {
    board[move.to] = 'GOAT';
    pieceIds[move.to] = `goat-${nextGoatSeq}`;
    nextGoatSeq += 1;
    goatsToPlace -= 1;
  } else if (move.type === 'MOVE') {
    board[move.to] = board[move.from];
    board[move.from] = null;
    pieceIds[move.to] = pieceIds[move.from];
    pieceIds[move.from] = null;
  } else {
    board[move.to] = board[move.from];
    board[move.from] = null;
    board[move.over] = null;
    pieceIds[move.to] = pieceIds[move.from];
    pieceIds[move.from] = null;
    pieceIds[move.over] = null;
    capturedGoats += 1;
  }

  const nextTurn: PlayerSide = state.turn === 'GOAT' ? 'TIGER' : 'GOAT';
  let winner: PlayerSide | null = null;
  let winReason: string | null = null;

  if (capturedGoats >= TIGERS_WIN_CAPTURES) {
    winner = 'TIGER';
    winReason = `Tigers captured ${TIGERS_WIN_CAPTURES} goats.`;
  } else {
    const nextMoves = getLegalMovesSim({
      board,
      turn: nextTurn,
      goatsToPlace,
      winner: null,
    });
    if (nextMoves.length === 0) {
      if (nextTurn === 'TIGER') {
        winner = 'GOAT';
        winReason = 'All 3 tigers are completely trapped with no legal moves.';
      } else {
        winner = 'TIGER';
        winReason = 'Goats have no legal moves remaining.';
      }
    }
  }

  return {
    board,
    pieceIds,
    turn: nextTurn,
    goatsToPlace,
    capturedGoats,
    winner,
    winReason,
    lastMove: move,
    moveCount: state.moveCount + 1,
    nextGoatSeq,
    history: [...state.history, snapshot],
  };
}

export function undoMoves(state: GameState, steps: number): GameState {
  if (state.history.length === 0 || steps <= 0) return state;
  const actualSteps = Math.min(steps, state.history.length);
  const targetIndex = state.history.length - actualSteps;
  const restored = state.history[targetIndex];
  return {
    ...restored,
    board: restored.board.slice(),
    pieceIds: restored.pieceIds.slice(),
    history: state.history.slice(0, targetIndex),
  };
}
