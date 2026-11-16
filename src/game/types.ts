export type PieceType = 'TIGER' | 'GOAT';
export type CellValue = PieceType | null;
export type PlayerSide = 'TIGER' | 'GOAT';
export type GameMode = 'PVP' | 'PVE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GamePhase = 'PLACEMENT' | 'MOVEMENT';
export type ScreenState = 'TITLE_MENU' | 'PLAYING';

export type Move =
  | { type: 'PLACE'; to: number }
  | { type: 'MOVE'; from: number; to: number }
  | { type: 'CAPTURE'; from: number; over: number; to: number };

export interface GameSnapshot {
  board: CellValue[];
  pieceIds: (string | null)[];
  turn: PlayerSide;
  goatsToPlace: number;
  capturedGoats: number;
  winner: PlayerSide | null;
  winReason: string | null;
  lastMove: Move | null;
  moveCount: number;
  nextGoatSeq: number;
}

export interface GameState extends GameSnapshot {
  history: GameSnapshot[];
}

export interface SimState {
  board: CellValue[];
  turn: PlayerSide;
  goatsToPlace: number;
  capturedGoats: number;
  winner: PlayerSide | null;
}
