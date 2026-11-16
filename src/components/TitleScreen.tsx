import React, { useEffect } from 'react';
import { BookOpen, Play, Volume2, VolumeX } from 'lucide-react';
import type { Difficulty, GameMode, PlayerSide } from '../game/types.ts';
import { GoatEmblem, TigerEmblem } from './PieceIcons.tsx';

interface TitleScreenProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  humanSide: PlayerSide;
  muted: boolean;
  onChangeMode: (mode: GameMode) => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onChangeHumanSide: (side: PlayerSide) => void;
  onStartGame: () => void;
  onOpenRules: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  gameMode,
  difficulty,
  humanSide,
  muted,
  onChangeMode,
  onChangeDifficulty,
  onChangeHumanSide,
  onStartGame,
  onOpenRules,
  onToggleMute,
}: TitleScreenProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT') return;
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#120B07] text-[#F4EAD5] flex flex-col justify-between">
      {/* Atmospheric Hero Key Art Backdrop */}
      <div className="absolute inset-0 wood-surface">
        <img
          src="/src/assets/images/aadu_puli_hero_1794809008267.jpg"
          alt="Hand-carved rosewood Aadu Puli Aattam board with brass tigers and ivory goats beside a warm oil lamp"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-80"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Measured scrim protecting left-side typography and bottom hint */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#110905]/95 via-[#110905]/80 to-[#110905]/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#110905]/90 via-transparent to-[#110905]/50"
          aria-hidden="true"
        />
      </div>

      {/* Top utility bar (minimal mute + rules access) */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 pt-6">
        <div className="text-xs tracking-wider text-[#C7B393] font-medium">
          Traditional South Indian Board Game
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 px-3 rounded-lg bg-[#24150C]/80 border border-[#C98F32]/25 text-[#E8D9BE] hover:bg-[#331F13] transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="text-xs font-medium hidden sm:inline">{muted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>

      {/* Main Hero Content aligned to calm left negative space */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 py-8 flex-1 flex items-center">
        <div className="w-full max-w-xl space-y-7">
          {/* Bespoke Title Lockup */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <TigerEmblem className="w-10 h-10 shrink-0" />
              <GoatEmblem className="w-10 h-10 shrink-0 -ml-2" />
              <span className="text-sm text-[#D99B26] font-medium tracking-wide">
                3 Tigers · 15 Goats · 23 Points
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#FAF2E1] leading-[1.1] text-balance">
              Aadu Puli Aattam
            </h1>
            <p className="text-base sm:text-lg text-[#D8C8AE] leading-relaxed max-w-lg">
              Outmaneuver three prowling tigers across the carved triangular grid, or leap across the herd to claim five captures.
            </p>
          </div>

          {/* Match Configuration Panel */}
          <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-[#1A0F09]/90 border border-[#C98F32]/25 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            {/* Game Mode Selection */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#BDA98A]">Game Mode</span>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#110905] border border-[#C98F32]/15">
                <button
                  type="button"
                  onClick={() => onChangeMode('PVE')}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gameMode === 'PVE'
                      ? 'bg-[#D99B26] text-[#1A0F08]'
                      : 'text-[#D6C7AF] hover:text-[#FAF2E1] hover:bg-[#24150C]'
                  }`}
                >
                  Player vs Computer
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('PVP')}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gameMode === 'PVP'
                      ? 'bg-[#D99B26] text-[#1A0F08]'
                      : 'text-[#D6C7AF] hover:text-[#FAF2E1] hover:bg-[#24150C]'
                  }`}
                >
                  Player vs Player
                </button>
              </div>
            </div>

            {/* AI Options (Difficulty + Side) */}
            {gameMode === 'PVE' && (
              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <span className="block text-xs font-medium text-[#BDA98A]">AI Difficulty</span>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#110905] border border-[#C98F32]/15">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => onChangeDifficulty(level)}
                        className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          difficulty === level
                            ? 'bg-[#3C2515] text-[#F3C35F] border border-[#D99B26]/45'
                            : 'text-[#C7B69B] hover:text-[#FAF2E1]'
                        }`}
                      >
                        {level === 'EASY' ? 'Easy' : level === 'MEDIUM' ? 'Medium' : 'Hard'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-medium text-[#BDA98A]">Play As</span>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#110905] border border-[#C98F32]/15">
                    <button
                      type="button"
                      onClick={() => onChangeHumanSide('GOAT')}
                      className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        humanSide === 'GOAT'
                          ? 'bg-[#3C2515] text-[#FAF2E1] border border-[#D99B26]/45'
                          : 'text-[#C7B69B] hover:text-[#FAF2E1]'
                      }`}
                    >
                      <GoatEmblem className="w-4 h-4 shrink-0" />
                      Goats
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeHumanSide('TIGER')}
                      className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        humanSide === 'TIGER'
                          ? 'bg-[#3C2515] text-[#F3C35F] border border-[#D99B26]/45'
                          : 'text-[#C7B69B] hover:text-[#FAF2E1]'
                      }`}
                    >
                      <TigerEmblem className="w-4 h-4 shrink-0" />
                      Tigers
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartGame}
                className="flex-1 min-w-[170px] min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#D99B26] text-[#1A0F08] font-bold text-base hover:bg-[#E7AD3B] transition-colors shadow-[0_6px_20px_rgba(217,155,38,0.3)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Game
              </button>
              <button
                type="button"
                onClick={onOpenRules}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2B1A10] text-[#F4EAD5] border border-[#C98F32]/30 font-semibold text-sm hover:bg-[#3A2316] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#D99B26]" />
                How to Play
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Single flat control-hint line */}
      <footer className="relative z-10 px-6 sm:px-10 pb-5 text-xs text-[#BDA98A]">
        Click any point to place or move · Press Enter to start · U Undo · R Restart · M Mute
      </footer>
    </div>
  );
}
