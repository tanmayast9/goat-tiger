import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GoatEmblem, TigerEmblem } from './PieceIcons.tsx';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#1D110A] border border-[#C98F32]/35 shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-[#F4EAD5]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#C98F32]/20">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#D99B26]">
              Traditional Indian Strategy Game
            </p>
            <h2 id="rules-modal-title" className="font-display text-2xl sm:text-3xl font-bold text-[#FAF2E1] mt-1">
              How to Play Aadu Puli Aattam
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#C7B69B] hover:text-[#FAF2E1] hover:bg-[#2F1C11] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 py-6 text-sm sm:text-[15px] leading-relaxed text-[#DDD0BA]">
          <p>
            Aadu Puli Aattam (Tiger and Goat) is an asymmetric hunt game played on a 23-point triangular grid.
            Three powerful Tigers hunt a herd of fifteen Goats, while the Goats cooperate to surround and immobilize every Tiger.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-xl bg-[#27170E] border border-[#C98F32]/20">
              <div className="flex items-center gap-3">
                <TigerEmblem className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="font-display text-lg font-bold text-[#F3C35F]">Tigers (3 Pieces)</h3>
                  <p className="text-xs text-[#BDA98A]">Goal: Capture 5 Goats</p>
                </div>
              </div>
              <ul className="space-y-2 list-disc list-inside text-[#D6C7AF]">
                <li>All 3 tigers begin on the apex and upper center points.</li>
                <li>On your turn, slide one tiger to an adjacent empty connected point.</li>
                <li>
                  To capture a goat, jump over an adjacent goat in a straight line onto an empty point immediately beyond it.
                </li>
                <li>Tigers cannot jump over other tigers or around corners.</li>
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-[#27170E] border border-[#C98F32]/20">
              <div className="flex items-center gap-3">
                <GoatEmblem className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="font-display text-lg font-bold text-[#FAF2E1]">Goats (15 Pieces)</h3>
                  <p className="text-xs text-[#BDA98A]">Goal: Trap all 3 Tigers</p>
                </div>
              </div>
              <ul className="space-y-2 list-disc list-inside text-[#D6C7AF]">
                <li>Goats move first and start off the board.</li>
                <li>
                  <strong>Phase 1 — Placement:</strong> Place one goat per turn on any empty intersection until all 15 goats have entered play.
                </li>
                <li>
                  <strong>Phase 2 — Movement:</strong> Once all 15 goats are placed, slide one goat per turn to an adjacent empty connected point.
                </li>
                <li>Goats win the moment none of the 3 tigers can make a legal move or capture.</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-[#C98F32]/15 flex flex-wrap items-center justify-between gap-4 text-xs text-[#BDA98A]">
            <span>Shortcuts: U Undo · R Restart · H Rules · M Mute Sound</span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#D99B26] text-[#1A0F08] font-semibold hover:bg-[#E7AD3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
