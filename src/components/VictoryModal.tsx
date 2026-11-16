import React from 'react';
import { RotateCcw, Home } from 'lucide-react';
import type { Difficulty, GameMode, PlayerSide } from '../game/types.ts';
import { GoatEmblem, TigerEmblem } from './PieceIcons.tsx';

interface VictoryModalProps {
  winner: PlayerSide | null;
  winReason: string | null;
  capturedGoats: number;
  moveCount: number;
  trappedTigers: number;
  gameMode: GameMode;
  difficulty: Difficulty;
  humanSide: PlayerSide;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function VictoryModal({
  winner,
  winReason,
  capturedGoats,
  moveCount,
  trappedTigers,
  gameMode,
  difficulty,
  humanSide,
  onPlayAgain,
  onMainMenu,
}: VictoryModalProps) {
  if (!winner) return null;

  const isTigerWin = winner === 'TIGER';
  let winnerHeadline = isTigerWin ? 'Tigers Win' : 'Goats Win';
  let subtitle = '';

  if (gameMode === 'PVE') {
    subtitle = winner === humanSide ? 'Victory — You outsmarted the Computer' : 'Defeat — Computer wins this match';
  } else {
    subtitle = isTigerWin ? 'Player controlling Tigers takes the hunt' : 'Player controlling Goats sealed the board';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#1D110A] border border-[#D99B26]/45 shadow-[0_28px_72px_rgba(0,0,0,0.85)] p-7 text-center text-[#F4EAD5]">
        <div className="flex justify-center mb-4">
          {isTigerWin ? (
            <TigerEmblem className="w-16 h-16" />
          ) : (
            <GoatEmblem className="w-16 h-16" />
          )}
        </div>

        <p className="text-xs font-medium text-[#D99B26] tracking-wide">
          {gameMode === 'PVE' ? `Player vs Computer · ${difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}` : 'Player vs Player'}
        </p>

        <h2 id="victory-title" className="font-display text-3xl font-bold text-[#FAF2E1] mt-1.5">
          {winnerHeadline}
        </h2>
        <p className="text-sm text-[#D6C7AF] mt-1">{subtitle}</p>
        {winReason && (
          <p className="text-sm text-[#EADBBF] mt-3 px-3 py-2 rounded-lg bg-[#2A1910] border border-[#C98F32]/20">
            {winReason}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 my-6 py-4 border-y border-[#C98F32]/20">
          <div>
            <div className="font-mono-tabular text-xl font-semibold text-[#FAF2E1]">{moveCount}</div>
            <div className="text-xs text-[#BDA98A] mt-0.5">Total Moves</div>
          </div>
          <div>
            <div className="font-mono-tabular text-xl font-semibold text-[#F3C35F]">{capturedGoats} / 5</div>
            <div className="text-xs text-[#BDA98A] mt-0.5">Captured</div>
          </div>
          <div>
            <div className="font-mono-tabular text-xl font-semibold text-[#34D399]">{trappedTigers} / 3</div>
            <div className="text-xs text-[#BDA98A] mt-0.5">Trapped</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#D99B26] text-[#1A0F08] font-semibold hover:bg-[#E7AD3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2B1A10] text-[#F4EAD5] border border-[#C98F32]/30 font-medium hover:bg-[#382215] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
