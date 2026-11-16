import { ADJACENCY, JUMPS, TIGERS_WIN_CAPTURES } from './board.ts';
import {
  applyMoveSim,
  getLegalMovesForTigerAt,
  getLegalMovesSim,
} from './engine.ts';
import type { Difficulty, Move, PlayerSide, SimState } from './types.ts';

/**
 * Node centrality weight: nodes with higher degree and key triangle control are stronger
 * for both tigers (mobility/forks) and goats (blocking central arteries).
 */
const NODE_CONTROL_WEIGHTS = [
  14, // 0: Apex (critical hub)
  5, 11, 13, 13, 11, 5, // 1..6: Row 1
  7, 12, 14, 14, 12, 7, // 7..12: Row 2
  5, 10, 12, 12, 10, 5, // 13..18: Row 3
  6, 8, 8, 6, // 19..22: Base
];

const WIN_SCORE = 100000;

function countTigerCaptureThreats(board: SimState['board']): number {
  let threats = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 'TIGER') {
      for (const j of JUMPS[i]) {
        if (board[j.over] === 'GOAT' && board[j.to] === null) {
          threats++;
        }
      }
    }
  }
  return threats;
}

function countGoatProtectionPairs(board: SimState['board']): number {
  let supported = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 'GOAT') {
      let adjGoats = 0;
      for (const n of ADJACENCY[i]) {
        if (board[n] === 'GOAT') adjGoats++;
      }
      if (adjGoats >= 2) supported += 2;
      else if (adjGoats === 1) supported += 1;
    }
  }
  return supported;
}

/**
 * Static board evaluation from TIGER's perspective (+ favors Tiger, - favors Goat).
 */
function evaluateBoardForTiger(state: SimState, depthRemaining: number): number {
  if (state.winner === 'TIGER') return WIN_SCORE + depthRemaining * 100;
  if (state.winner === 'GOAT') return -WIN_SCORE - depthRemaining * 100;

  let tigerMoves = 0;
  let blockedTigers = 0;
  let tigerControl = 0;
  let immediateCaptures = 0;

  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === 'TIGER') {
      const moves = getLegalMovesForTigerAt(state.board, i);
      tigerMoves += moves.length;
      if (moves.length === 0) blockedTigers++;
      tigerControl += NODE_CONTROL_WEIGHTS[i];
      for (const m of moves) {
        if (m.type === 'CAPTURE') immediateCaptures++;
      }
    }
  }

  const goatSupport = countGoatProtectionPairs(state.board);
  const threats = state.turn === 'TIGER' ? immediateCaptures : countTigerCaptureThreats(state.board);

  let score = 0;
  // Capturing goats is paramount for Tigers (and avoiding captures is paramount for Goats)
  score += state.capturedGoats * 420;
  // Immediate capture threats when it is Tiger's turn, or unprotected goats
  score += threats * (state.turn === 'TIGER' ? 140 : 45);
  // Tiger mobility vs trapped tigers
  score += tigerMoves * 26;
  score -= blockedTigers * 180;
  // Positional board control
  score += tigerControl * 3;
  // Goat formation density hurts tigers
  score -= goatSupport * 11;

  // Near-win urgency
  if (state.capturedGoats === TIGERS_WIN_CAPTURES - 1 && immediateCaptures > 0 && state.turn === 'TIGER') {
    score += 350;
  }

  return score;
}

function orderMoves(state: SimState, moves: Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const scoreA = moveHeuristicPriority(state, a);
    const scoreB = moveHeuristicPriority(state, b);
    return scoreB - scoreA;
  });
}

function moveHeuristicPriority(state: SimState, move: Move): number {
  if (move.type === 'CAPTURE') return 1000 + NODE_CONTROL_WEIGHTS[move.to];

  if (state.turn === 'GOAT' && move.type === 'PLACE') {
    // Prioritize blocking an active jump landing or defending a threatened goat
    let bonus = NODE_CONTROL_WEIGHTS[move.to];
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === 'TIGER') {
        for (const j of JUMPS[i]) {
          // Placing on landing square blocks capture!
          if (j.to === move.to && state.board[j.over] === 'GOAT') {
            bonus += 180;
          }
          // Placing next to a tiger where the jump landing is empty is risky!
          if (j.over === move.to && state.board[j.to] === null) {
            bonus -= 160;
          }
        }
      }
    }
    // Check if adjacent to existing goats for mutual defense
    for (const n of ADJACENCY[move.to]) {
      if (state.board[n] === 'GOAT') bonus += 18;
      if (state.board[n] === 'TIGER') bonus += 10;
    }
    return bonus;
  }

  if (move.type === 'MOVE') {
    let bonus = NODE_CONTROL_WEIGHTS[move.to] - NODE_CONTROL_WEIGHTS[move.from] * 0.5;
    if (state.turn === 'GOAT') {
      // Moving out of a capture threat or into a jump block is high priority
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] === 'TIGER') {
          for (const j of JUMPS[i]) {
            if (j.over === move.from && state.board[j.to] === null) bonus += 160;
            if (j.to === move.to && state.board[j.over] === 'GOAT') bonus += 140;
            if (j.over === move.to && state.board[j.to] === null) bonus -= 150;
          }
        }
      }
    }
    return bonus;
  }

  return 0;
}

function alphabeta(
  state: SimState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingTiger: boolean
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateBoardForTiger(state, depth);
  }

  const legalMoves = orderMoves(state, getLegalMovesSim(state));
  if (legalMoves.length === 0) {
    return evaluateBoardForTiger(state, depth);
  }

  // Cap branching factor slightly during early placement at deep levels so AI stays <80ms
  const candidateLimit =
    state.goatsToPlace > 0 && depth >= 3 ? Math.min(legalMoves.length, 12) : legalMoves.length;

  if (maximizingTiger) {
    let best = -Infinity;
    for (let i = 0; i < candidateLimit; i++) {
      const next = applyMoveSim(state, legalMoves[i]);
      const val = alphabeta(next, depth - 1, alpha, beta, false);
      if (val > best) best = val;
      if (val > alpha) alpha = val;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < candidateLimit; i++) {
      const next = applyMoveSim(state, legalMoves[i]);
      const val = alphabeta(next, depth - 1, alpha, beta, true);
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (alpha >= beta) break;
    }
    return best;
  }
}

export function chooseAiMove(
  state: SimState,
  aiSide: PlayerSide,
  difficulty: Difficulty
): Move | null {
  if (state.winner !== null || state.turn !== aiSide) return null;
  const legalMoves = getLegalMovesSim(state);
  if (legalMoves.length === 0) return null;

  // EASY: Occasional captures, light heuristic awareness, and deliberate beginner-friendly variety
  if (difficulty === 'EASY') {
    const captures = legalMoves.filter((m) => m.type === 'CAPTURE');
    if (captures.length > 0 && Math.random() < 0.65) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    const ordered = orderMoves(state, legalMoves);
    const poolSize = Math.max(1, Math.ceil(ordered.length * 0.65));
    const idx = Math.floor(Math.random() * poolSize);
    return ordered[idx];
  }

  // MEDIUM: Depth 2 search (looks ahead 1 full turn pair) with slight tie randomness
  if (difficulty === 'MEDIUM') {
    return selectBestSearchMove(state, aiSide, 2, 0.15);
  }

  // HARD: Deep alpha-beta search (Depth 4 in placement, Depth 5 in movement)
  const depth = state.goatsToPlace > 0 ? 4 : 5;
  return selectBestSearchMove(state, aiSide, depth, 0);
}

function selectBestSearchMove(
  state: SimState,
  aiSide: PlayerSide,
  depth: number,
  noiseChance: number
): Move {
  const ordered = orderMoves(state, getLegalMovesSim(state));
  const maximizingTiger = aiSide === 'TIGER';

  // Instant win check at root
  for (const move of ordered) {
    const next = applyMoveSim(state, move);
    if (next.winner === aiSide) {
      return move;
    }
  }

  let bestScore = maximizingTiger ? -Infinity : Infinity;
  let bestMoves: Move[] = [];
  let alpha = -Infinity;
  let beta = Infinity;

  const candidateLimit =
    state.goatsToPlace > 0 && depth >= 4 ? Math.min(ordered.length, 15) : ordered.length;

  for (let i = 0; i < candidateLimit; i++) {
    const move = ordered[i];
    const next = applyMoveSim(state, move);
    const score = alphabeta(next, depth - 1, alpha, beta, !maximizingTiger);

    if (maximizingTiger) {
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
      if (score > alpha) alpha = score;
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
      if (score < beta) beta = score;
    }
  }

  if (noiseChance > 0 && ordered.length > 1 && Math.random() < noiseChance) {
    const topPool = ordered.slice(0, Math.min(3, ordered.length));
    return topPool[Math.floor(Math.random() * topPool.length)];
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? ordered[0];
}
