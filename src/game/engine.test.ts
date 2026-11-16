import assert from 'node:assert/strict';
import { chooseAiMove } from './ai.ts';
import {
  ADJACENCY,
  BOARD_EDGES,
  BOARD_NODES,
  INITIAL_TIGER_NODES,
  JUMPS,
  TOTAL_GOATS,
} from './board.ts';
import {
  applyMove,
  countGoatsOnBoard,
  createInitialState,
  getBlockedTigersCount,
  getGamePhase,
  getLegalMovesForNode,
  getLegalMovesSim,
  isMoveLegal,
  undoMoves,
} from './engine.ts';
import type { GameState } from './types.ts';

function runTests() {
  // 1. Board geometry checks
  assert.equal(BOARD_NODES.length, 23, 'Board must have exactly 23 intersection points');
  for (let i = 0; i < 23; i++) {
    assert.ok(ADJACENCY[i].length >= 2, `Node ${i} should have at least 2 neighbors`);
    for (const n of ADJACENCY[i]) {
      assert.ok(ADJACENCY[n].includes(i), `Adjacency must be symmetric between ${i} and ${n}`);
    }
    // Check collinearity for every jump triplet
    for (const j of JUMPS[i]) {
      const a = BOARD_NODES[i];
      const b = BOARD_NODES[j.over];
      const c = BOARD_NODES[j.to];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      assert.equal(cross, 0, `Jump ${i}->${j.over}->${j.to} must be strictly collinear`);
    }
  }
  assert.ok(BOARD_EDGES.length > 0, 'Board edges must exist');

  // 2. Initial state checks
  let state = createInitialState();
  assert.equal(state.turn, 'GOAT', 'Goat moves first');
  assert.equal(state.goatsToPlace, TOTAL_GOATS, '15 goats to place initially');
  assert.equal(getGamePhase(state.goatsToPlace), 'PLACEMENT');
  for (const t of INITIAL_TIGER_NODES) {
    assert.equal(state.board[t], 'TIGER', `Initial tiger expected at node ${t}`);
  }
  assert.equal(countGoatsOnBoard(state.board), 0);

  // 3. Invalid move rejections during placement
  assert.equal(
    isMoveLegal(state, { type: 'PLACE', to: 0 }),
    false,
    'Cannot place goat on occupied tiger node'
  );
  assert.equal(
    isMoveLegal(state, { type: 'MOVE', from: 0, to: 2 }),
    false,
    'Tiger cannot move on Goat turn'
  );

  // 4. Goat placement and Tiger capture
  state = applyMove(state, { type: 'PLACE', to: 9 }); // Goat at 9 (below Tiger at 3, along 0-3-9-15-20)
  assert.equal(state.board[9], 'GOAT');
  assert.equal(state.goatsToPlace, 14);
  assert.equal(state.turn, 'TIGER');

  // Tiger at 3 cannot jump over 0 (no goat) and cannot jump over 4 (tiger!)
  const tiger3Moves = getLegalMovesForNode(state, 3);
  assert.equal(
    tiger3Moves.some((m) => m.type === 'CAPTURE' && m.over === 4),
    false,
    'Tiger cannot jump over another tiger'
  );
  // Tiger at 3 CAN capture goat at 9 by landing on 15!
  const capture3to15 = tiger3Moves.find(
    (m) => m.type === 'CAPTURE' && m.from === 3 && m.over === 9 && m.to === 15
  );
  assert.ok(capture3to15, 'Tiger at 3 must detect capture over 9 to 15');

  // Corner jump check: Tiger at 0 should NOT be able to jump over 3 to 2 or anything non-collinear
  assert.equal(
    isMoveLegal(state, { type: 'CAPTURE', from: 0, over: 3, to: 2 }),
    false,
    'Tiger cannot jump around corners'
  );

  state = applyMove(state, capture3to15);
  assert.equal(state.board[3], null);
  assert.equal(state.board[9], null, 'Captured goat must be removed from board');
  assert.equal(state.board[15], 'TIGER');
  assert.equal(state.capturedGoats, 1);
  assert.equal(state.turn, 'GOAT');

  // Goat cannot move existing goats while goatsToPlace > 0
  state = applyMove(state, { type: 'PLACE', to: 1 });
  state = applyMove(state, { type: 'MOVE', from: 15, to: 9 });
  assert.equal(
    isMoveLegal(state, { type: 'MOVE', from: 1, to: 7 }),
    false,
    'Goat cannot move before all 15 goats are placed'
  );

  // 5. Undo test
  const beforeUndoCount = state.moveCount;
  const undone = undoMoves(state, 1);
  assert.equal(undone.moveCount, beforeUndoCount - 1);
  assert.equal(undone.board[9], null);
  assert.equal(undone.board[15], 'TIGER');

  // 6. Placement -> Movement Phase transition test
  let phaseState = createInitialState();
  const safeNodes = [1, 7, 13, 6, 12, 18, 19, 22, 20, 21, 14, 17, 8, 11, 2];
  let tigerToggle = false;
  for (let i = 0; i < 15; i++) {
    assert.equal(getGamePhase(phaseState.goatsToPlace), 'PLACEMENT');
    // Pick first empty node
    const emptyNode = safeNodes.find((n) => phaseState.board[n] === null) ?? phaseState.board.findIndex((c) => c === null);
    phaseState = applyMove(phaseState, { type: 'PLACE', to: emptyNode });
    if (phaseState.goatsToPlace > 0) {
      // Make a safe tiger move that doesn't block our loop
      const tMoves = getLegalMovesSim(phaseState).filter((m) => m.type === 'MOVE');
      const move = tMoves[tigerToggle ? 0 : tMoves.length - 1] ?? getLegalMovesSim(phaseState)[0];
      tigerToggle = !tigerToggle;
      phaseState = applyMove(phaseState, move);
    }
  }
  assert.equal(phaseState.goatsToPlace, 0);
  assert.equal(getGamePhase(phaseState.goatsToPlace), 'MOVEMENT');
  // Now after a tiger move, goat MUST be able to move!
  const tMovesAfter = getLegalMovesSim(phaseState);
  if (phaseState.winner === null && tMovesAfter.length > 0) {
    phaseState = applyMove(phaseState, tMovesAfter[0]);
    const goatMoves = getLegalMovesSim(phaseState);
    assert.ok(goatMoves.some((m) => m.type === 'MOVE'), 'Goats must be able to MOVE in Movement Phase');
  }

  // 7. Tiger Victory Condition (5 captured goats)
  const nearTigerWin: GameState = {
    ...createInitialState(),
    board: Array(23).fill(null),
    turn: 'TIGER',
    goatsToPlace: 5,
    capturedGoats: 4,
  };
  nearTigerWin.board[0] = 'TIGER';
  nearTigerWin.board[1] = 'TIGER';
  nearTigerWin.board[6] = 'TIGER';
  nearTigerWin.board[3] = 'GOAT'; // Tiger at 0 can jump over 3 to 9!
  nearTigerWin.pieceIds[0] = 'tiger-0';
  nearTigerWin.pieceIds[1] = 'tiger-1';
  nearTigerWin.pieceIds[6] = 'tiger-2';
  nearTigerWin.pieceIds[3] = 'goat-1';

  const tigerWonState = applyMove(nearTigerWin, { type: 'CAPTURE', from: 0, over: 3, to: 9 });
  assert.equal(tigerWonState.capturedGoats, 5);
  assert.equal(tigerWonState.winner, 'TIGER', 'Tigers must win upon capturing 5th goat');
  assert.equal(
    getLegalMovesSim(tigerWonState).length,
    0,
    'No legal moves allowed after Tiger wins'
  );
  assert.throws(() => applyMove(tigerWonState, { type: 'PLACE', to: 2 }));

  // 8. Goat Victory Condition (All 3 Tigers completely trapped)
  // Place 3 tigers at 0, 1, 7 (no wait: block all neighbors AND all jump landings of 0, 2, 3)
  const nearGoatWin: GameState = {
    ...createInitialState(),
    board: Array(23).fill(null),
    turn: 'GOAT',
    goatsToPlace: 1,
    capturedGoats: 0,
  };
  // Put Tigers at 0, 2, 3 and block every adjacent and jump square around them, leaving 4 empty for final goat placement!
  nearGoatWin.board[0] = 'TIGER';
  nearGoatWin.board[1] = 'GOAT';
  nearGoatWin.board[2] = 'TIGER';
  nearGoatWin.board[3] = 'TIGER';
  // Neighbors of 0: 2(T), 3(T), 4(empty->will place!), 5(G). Jump landings from 0: 8(G), 9(G), 10(G), 11(G)
  // Neighbors of 2: 0(T), 1(G), 3(T), 8(G). Jump landings from 2: 4(empty->blocked by T at 3!), 14(G)
  // Neighbors of 3: 0(T), 2(T), 4(empty!), 9(G). Jump landings from 3: 1(G), 5(G), 15(G)
  nearGoatWin.board[5] = 'GOAT';
  nearGoatWin.board[8] = 'GOAT';
  nearGoatWin.board[9] = 'GOAT';
  nearGoatWin.board[10] = 'GOAT';
  nearGoatWin.board[11] = 'GOAT';
  nearGoatWin.board[14] = 'GOAT';
  nearGoatWin.board[15] = 'GOAT';
  nearGoatWin.pieceIds[0] = 'tiger-0';
  nearGoatWin.pieceIds[2] = 'tiger-1';
  nearGoatWin.pieceIds[3] = 'tiger-2';

  const goatWonState = applyMove(nearGoatWin, { type: 'PLACE', to: 4 });
  assert.equal(getBlockedTigersCount(goatWonState.board), 3, 'All 3 tigers must be trapped');
  assert.equal(goatWonState.winner, 'GOAT', 'Goats must win when all 3 tigers are trapped');
  assert.equal(getLegalMovesSim(goatWonState).length, 0, 'No moves allowed after Goat wins');

  // 9. AI tests across Easy, Medium, Hard for both sides
  const aiTestInitial = createInitialState();
  for (const diff of ['EASY', 'MEDIUM', 'HARD'] as const) {
    const goatAiMove = chooseAiMove(
      {
        board: aiTestInitial.board,
        turn: aiTestInitial.turn,
        goatsToPlace: aiTestInitial.goatsToPlace,
        capturedGoats: aiTestInitial.capturedGoats,
        winner: null,
      },
      'GOAT',
      diff
    );
    assert.ok(goatAiMove && isMoveLegal(aiTestInitial, goatAiMove), `${diff} Goat AI must return legal move`);
  }

  // Hard Tiger AI must take immediate winning capture
  const hardWinningMove = chooseAiMove(
    {
      board: nearTigerWin.board,
      turn: 'TIGER',
      goatsToPlace: 5,
      capturedGoats: 4,
      winner: null,
    },
    'TIGER',
    'HARD'
  );
  assert.deepEqual(hardWinningMove, { type: 'CAPTURE', from: 0, over: 3, to: 9 });

  console.log('ALL_TESTS_PASSED');
}

runTests();
