import React, { useCallback, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { soundFx } from './audio/soundFx.ts';
import { GameWorkspace } from './components/GameWorkspace.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import type { Difficulty, GameMode, PlayerSide, ScreenState } from './game/types.ts';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [humanSide, setHumanSide] = useState<PlayerSide>('GOAT');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [matchKey, setMatchKey] = useState(0);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundFx.setMuted(next);
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    setMatchKey((k) => k + 1);
    setScreen('PLAYING');
  }, []);

  const handleExitToMenu = useCallback(() => {
    setScreen('TITLE_MENU');
  }, []);

  return (
    <>
      {screen === 'TITLE_MENU' ? (
        <TitleScreen
          gameMode={gameMode}
          difficulty={difficulty}
          humanSide={humanSide}
          muted={muted}
          onChangeMode={setGameMode}
          onChangeDifficulty={setDifficulty}
          onChangeHumanSide={setHumanSide}
          onStartGame={handleStartGame}
          onOpenRules={() => setRulesOpen(true)}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <GameWorkspace
          key={matchKey}
          gameMode={gameMode}
          difficulty={difficulty}
          humanSide={humanSide}
          muted={muted}
          onToggleMute={handleToggleMute}
          onOpenRules={() => setRulesOpen(true)}
          onExitToMenu={handleExitToMenu}
        />
      )}

      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
      <Analytics />
    </>
  );
}
