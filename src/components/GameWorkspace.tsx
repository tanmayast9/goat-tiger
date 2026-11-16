import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, RotateCcw, Undo2, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../audio/soundFx.ts';
import { chooseAiMove } from '../game/ai.ts';
import { TIGERS_WIN_CAPTURES, TOTAL_GOATS } from '../game/board.ts';
import {
  applyMove,
  countGoatsOnBoard,
  createInitialState,
  getBlockedTigersCount,
  getGamePhase,
  getLegalMovesForNode,
  undoMoves,
} from '../game/engine.ts';
import type { Difficulty, GameMode, GameState, Move, PlayerSide } from '../game/types.ts';
import { BoardSvg } from './BoardSvg.tsx';
import { GoatEmblem, TigerEmblem } from './PieceIcons.tsx';
import { VictoryModal } from './VictoryModal.tsx';

interface GameWorkspaceProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  humanSide: PlayerSide;
  muted: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
  onExitToMenu: () => void;
}

export function GameWorkspace({
  gameMode,
  difficulty,
  humanSide,
  muted,
  onToggleMute,
  onOpenRules,
  onExitToMenu,
}: GameWorkspaceProps) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [capturedBurstNode, setCapturedBurstNode] = useState<number | null>(null);
  const [noticeText, setNoticeText] = useState<string | null>(null);

  const aiSide: PlayerSide | null = gameMode === 'PVE' ? (humanSide === 'GOAT' ? 'TIGER' : 'GOAT') : null;
  const isAiTurn = gameMode === 'PVE' && state.winner === null && state.turn === aiSide;
  const isHumanTurn = state.winner === null && !isAiTurn;

  const burstTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const phase = getGamePhase(state.goatsToPlace);
  const goatsOnBoard = countGoatsOnBoard(state.board);
  const trappedTigers = getBlockedTigersCount(state.board);

  // Compute legal moves for currently selected piece (or placement hints)
  const validMoves = useMemo<Move[]>(() => {
    if (!isHumanTurn) return [];
    if (state.turn === 'GOAT' && state.goatsToPlace > 0) {
      // During placement, all empty nodes are valid; show subtle rings only when hovering/clicking isn't noisy,
      // or show empty placement targets cleanly? Showing all 20 emerald dots at start can look busy,
      // wait—let's check: the prompt says "Highlight all valid moves"!
      // Returning all PLACE moves highlights every valid empty placement point cleanly!
      const moves: Move[] = [];
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] === null) moves.push({ type: 'PLACE', to: i });
      }
      return moves;
    }
    if (selectedNode === null) return [];
    return getLegalMovesForNode(state, selectedNode);
  }, [isHumanTurn, state, selectedNode]);

  const showNotice = useCallback((msg: string) => {
    setNoticeText(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeText(null);
    }, 2200);
  }, []);

  const triggerBurst = useCallback((nodeId: number) => {
    setCapturedBurstNode(nodeId);
    if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    burstTimerRef.current = window.setTimeout(() => {
      setCapturedBurstNode(null);
    }, 360);
  }, []);

  const executeMove = useCallback(
    (move: Move) => {
      setState((prev) => {
        const next = applyMove(prev, move);
        if (move.type === 'CAPTURE') {
          soundFx.playCapture();
          triggerBurst(move.over);
        } else if (move.type === 'PLACE') {
          soundFx.playPlace();
        } else {
          soundFx.playMove();
        }

        if (next.winner !== null) {
          window.setTimeout(() => soundFx.playVictory(), 140);
        }
        return next;
      });
      setSelectedNode(null);
      setNoticeText(null);
    },
    [triggerBurst]
  );

  // AI turn orchestration
  useEffect(() => {
    if (!isAiTurn || !aiSide) return;
    const timerId = window.setTimeout(() => {
      const move = chooseAiMove(
        {
          board: state.board,
          turn: state.turn,
          goatsToPlace: state.goatsToPlace,
          capturedGoats: state.capturedGoats,
          winner: state.winner,
        },
        aiSide,
        difficulty
      );
      if (move) {
        executeMove(move);
      }
    }, 520);

    return () => window.clearTimeout(timerId);
  }, [isAiTurn, aiSide, state.board, state.turn, state.goatsToPlace, state.capturedGoats, state.winner, difficulty, executeMove]);

  const handleRestart = useCallback(() => {
    setState(createInitialState());
    setSelectedNode(null);
    setCapturedBurstNode(null);
    setNoticeText(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (state.history.length === 0 || isAiTurn) return;
    // In PvE, undo back to the human's previous turn (2 plies if AI already moved, or 1 if human just won)
    let steps = 1;
    if (gameMode === 'PVE') {
      if (state.winner !== null && state.turn === aiSide) {
        steps = 1;
      } else if (state.history.length >= 2) {
        steps = 2;
      } else {
        return;
      }
    }
    setState((prev) => undoMoves(prev, steps));
    setSelectedNode(null);
    setCapturedBurstNode(null);
    setNoticeText(null);
    soundFx.playSelect();
  }, [state.history.length, state.winner, state.turn, aiSide, gameMode, isAiTurn]);

  // Keyboard shortcuts during play
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'u') {
        handleUndo();
      } else if (key === 'r') {
        handleRestart();
      } else if (key === 'h') {
        onOpenRules();
      } else if (key === 'm') {
        onToggleMute();
      } else if (key === 'escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo, handleRestart, onOpenRules, onToggleMute]);

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const handleNodeClick = (nodeId: number) => {
    if (state.winner !== null) return;
    if (!isHumanTurn) return;

    const occupant = state.board[nodeId];

    // 1. Goat Placement Phase
    if (state.turn === 'GOAT' && state.goatsToPlace > 0) {
      if (occupant === null) {
        executeMove({ type: 'PLACE', to: nodeId });
      } else if (occupant === 'GOAT') {
        showNotice(`Place all ${TOTAL_GOATS} goats before moving them (${state.goatsToPlace} left).`);
      } else {
        showNotice('That point is occupied by a tiger. Choose an empty point.');
      }
      return;
    }

    // 2. Movement / Tiger Turn: check if clicking a valid target for currently selected piece
    if (selectedNode !== null) {
      if (selectedNode === nodeId) {
        setSelectedNode(null);
        return;
      }

      const matchingMove = validMoves.find((m) => m.to === nodeId);
      if (matchingMove) {
        executeMove(matchingMove);
        return;
      }
    }

    // 3. Selecting a piece belonging to the active player
    if (occupant === state.turn) {
      const nodeMoves = getLegalMovesForNode(state, nodeId);
      if (nodeMoves.length === 0) {
        showNotice(
          state.turn === 'TIGER'
            ? 'This tiger is blocked and has no legal moves.'
            : 'This goat has no adjacent empty points.'
        );
        return;
      }
      setSelectedNode(nodeId);
      setNoticeText(null);
      soundFx.playSelect();
      return;
    }

    // 4. Invalid click feedback
    if (selectedNode !== null) {
      showNotice('Invalid destination. Choose a highlighted green or red point.');
    } else {
      showNotice(
        state.turn === 'TIGER'
          ? 'Select one of your 3 golden tigers first.'
          : 'Select one of your ivory goats to move.'
      );
    }
  };

  // Determine concise player guidance text
  let guidance = '';
  if (state.winner !== null) {
    guidance = state.winReason ?? 'Match finished.';
  } else if (isAiTurn) {
    guidance = `Computer (${state.turn === 'TIGER' ? 'Tigers' : 'Goats'}) is considering a move…`;
  } else if (state.turn === 'GOAT' && state.goatsToPlace > 0) {
    guidance = `Click any highlighted empty intersection to place a goat (${state.goatsToPlace} remaining).`;
  } else if (state.turn === 'GOAT') {
    guidance =
      selectedNode !== null
        ? 'Click a highlighted green point to move the selected goat.'
        : 'Select any goat on the board to slide it to an adjacent empty point.';
  } else {
    guidance =
      selectedNode !== null
        ? 'Click a green point to slide, or a red target to jump and capture a goat.'
        : 'Select one of your 3 tigers to move or jump over an adjacent goat.';
  }

  const canUndo =
    !isAiTurn &&
    (gameMode === 'PVP'
      ? state.history.length > 0
      : state.winner !== null && state.turn === aiSide
      ? state.history.length >= 1
      : state.history.length >= 2);

  return (
    <div className="min-h-screen w-full bg-[#120B07] text-[#F4EAD5] flex flex-col">
      {/* Compact Game Header */}
      <header className="w-full border-b border-[#C98F32]/20 bg-[#180F09]/95 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onExitToMenu}
              className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#D8C8AE] hover:text-[#FAF2E1] hover:bg-[#2A1910] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Main Menu</span>
            </button>
            <div className="h-5 w-px bg-[#C98F32]/20 hidden sm:block" aria-hidden="true" />
            <h1 className="font-display text-lg sm:text-xl font-bold text-[#FAF2E1] truncate">
              Aadu Puli Aattam
            </h1>
          </div>

          {/* Unboxed match metadata */}
          <div className="hidden md:flex items-center gap-2 text-xs text-[#C7B393] whitespace-nowrap">
            <span>{gameMode === 'PVE' ? 'Player vs Computer' : 'Player vs Player'}</span>
            {gameMode === 'PVE' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} AI</span>
                <span aria-hidden="true">·</span>
                <span>You: {humanSide === 'GOAT' ? 'Goats' : 'Tigers'}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#D8C8AE] hover:text-[#FAF2E1] hover:bg-[#2A1910] transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onOpenRules}
              className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#24150C] border border-[#C98F32]/25 text-sm font-medium text-[#F4EAD5] hover:bg-[#331E12] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#D99B26]" />
              <span>Rules</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Play Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8">
        {/* Dominant Interactive Board Canvas (unobstructed) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          <BoardSvg
            state={state}
            selectedNode={selectedNode}
            validMoves={validMoves}
            isHumanTurn={isHumanTurn}
            onNodeClick={handleNodeClick}
            capturedBurstNode={capturedBurstNode}
          />
        </div>

        {/* Side Status & Control Rail */}
        <aside className="w-full max-w-[820px] lg:w-[320px] shrink-0 space-y-4">
          {/* Active Turn & Phase Card */}
          <section className="rounded-2xl bg-[#1D110A] border border-[#C98F32]/25 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {state.turn === 'TIGER' ? (
                  <TigerEmblem className="w-10 h-10 shrink-0" />
                ) : (
                  <GoatEmblem className="w-10 h-10 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs text-[#BDA98A] font-medium">Current Turn</div>
                  <div className="font-display text-lg font-bold text-[#FAF2E1] truncate">
                    {state.winner
                      ? `${state.winner === 'TIGER' ? 'Tigers' : 'Goats'} Won`
                      : state.turn === 'TIGER'
                      ? "Tiger's Turn"
                      : "Goat's Turn"}
                  </div>
                </div>
              </div>
              {isAiTurn && (
                <span className="text-xs font-medium text-[#F3C35F] whitespace-nowrap">
                  AI Thinking…
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-[#C98F32]/15 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#BDA98A]">Game Phase</span>
                <span className="font-semibold text-[#F3C35F]">
                  {phase === 'PLACEMENT' ? 'Goat Placement' : 'Movement Phase'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#D8C8AE]">
                {noticeText ? (
                  <span className="text-[#FCA5A5] font-medium">{noticeText}</span>
                ) : (
                  guidance
                )}
              </p>
            </div>
          </section>

          {/* Match Telemetry & Reserve Readout */}
          <section className="rounded-2xl bg-[#1D110A] border border-[#C98F32]/25 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#BDA98A]">Goats to Place</div>
                <div className="font-mono-tabular text-2xl font-semibold text-[#FAF2E1] mt-0.5">
                  {state.goatsToPlace}
                  <span className="text-sm text-[#8F7C60]"> / {TOTAL_GOATS}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#BDA98A]">Goats on Board</div>
                <div className="font-mono-tabular text-2xl font-semibold text-[#FAF2E1] mt-0.5">
                  {goatsOnBoard}
                </div>
              </div>
            </div>

            {/* Captured Goats Meter */}
            <div className="pt-3 border-t border-[#C98F32]/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#BDA98A]">Captured Goats (Tiger Goal)</span>
                <span className="font-mono-tabular font-semibold text-[#F3C35F]">
                  {state.capturedGoats} / {TIGERS_WIN_CAPTURES}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2" aria-label={`${state.capturedGoats} of 5 goats captured`}>
                {Array.from({ length: TIGERS_WIN_CAPTURES }).map((_, idx) => {
                  const captured = idx < state.capturedGoats;
                  return (
                    <div
                      key={idx}
                      className={`h-8 rounded-lg flex items-center justify-center border transition-colors ${
                        captured
                          ? 'bg-[#7F1D1D]/45 border-[#F87171]/60'
                          : 'bg-[#140C07] border-[#C98F32]/15'
                      }`}
                    >
                      {captured ? (
                        <GoatEmblem className="w-5 h-5 opacity-90" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4D3723]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trapped Tigers Meter */}
            <div className="pt-3 border-t border-[#C98F32]/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#BDA98A]">Trapped Tigers (Goat Goal)</span>
                <span className="font-mono-tabular font-semibold text-[#34D399]">
                  {trappedTigers} / 3
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2" aria-label={`${trappedTigers} of 3 tigers trapped`}>
                {Array.from({ length: 3 }).map((_, idx) => {
                  const isTrapped = idx < trappedTigers;
                  return (
                    <div
                      key={idx}
                      className={`h-8 rounded-lg flex items-center justify-center gap-1.5 border text-xs font-medium transition-colors ${
                        isTrapped
                          ? 'bg-[#064E3B]/45 border-[#34D399]/55 text-[#A7F3D0]'
                          : 'bg-[#140C07] border-[#C98F32]/15 text-[#8F7C60]'
                      }`}
                    >
                      <TigerEmblem className={`w-4 h-4 ${isTrapped ? 'opacity-100' : 'opacity-40'}`} />
                      <span>{isTrapped ? 'Trapped' : 'Free'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Match Controls */}
          <section className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24150C] border border-[#C98F32]/25 text-sm font-semibold text-[#F4EAD5] hover:bg-[#331E12] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Undo2 className="w-4 h-4 text-[#D99B26]" />
              Undo Move
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24150C] border border-[#C98F32]/25 text-sm font-semibold text-[#F4EAD5] hover:bg-[#331E12] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#D99B26]" />
              Restart
            </button>
          </section>
        </aside>
      </main>

      {/* Victory Overlay */}
      <VictoryModal
        winner={state.winner}
        winReason={state.winReason}
        capturedGoats={state.capturedGoats}
        moveCount={state.moveCount}
        trappedTigers={trappedTigers}
        gameMode={gameMode}
        difficulty={difficulty}
        humanSide={humanSide}
        onPlayAgain={handleRestart}
        onMainMenu={onExitToMenu}
      />
    </div>
  );
}
