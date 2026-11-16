import React from 'react';
import { BOARD_EDGES, BOARD_HEIGHT, BOARD_NODES, BOARD_WIDTH } from '../game/board.ts';
import type { GameState, Move } from '../game/types.ts';

interface BoardSvgProps {
  state: GameState;
  selectedNode: number | null;
  validMoves: Move[];
  isHumanTurn: boolean;
  onNodeClick: (nodeId: number) => void;
  capturedBurstNode: number | null;
}

interface ActivePiece {
  id: string;
  type: 'TIGER' | 'GOAT';
  nodeId: number;
  x: number;
  y: number;
}

export function BoardSvg({
  state,
  selectedNode,
  validMoves,
  isHumanTurn,
  onNodeClick,
  capturedBurstNode,
}: BoardSvgProps) {
  // Collect valid move targets for highlighting
  const validMoveMap = new Map<number, Move>();
  for (const m of validMoves) {
    validMoveMap.set(m.to, m);
  }

  // Collect stable pieces sorted by ID so React preserves DOM/SVG elements across moves for smooth CSS transitions
  const pieces: ActivePiece[] = [];
  for (let i = 0; i < state.board.length; i++) {
    const cell = state.board[i];
    const id = state.pieceIds[i];
    if (cell && id) {
      pieces.push({
        id,
        type: cell,
        nodeId: i,
        x: BOARD_NODES[i].x,
        y: BOARD_NODES[i].y,
      });
    }
  }
  pieces.sort((a, b) => a.id.localeCompare(b.id));

  const lastMove = state.lastMove;
  const lastFromNode =
    lastMove && (lastMove.type === 'MOVE' || lastMove.type === 'CAPTURE')
      ? BOARD_NODES[lastMove.from]
      : null;
  const lastToNode = lastMove ? BOARD_NODES[lastMove.to] : null;

  return (
    <div className="relative w-full max-w-[820px] mx-auto select-none">
      {/* Carved wooden slab frame */}
      <div className="relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-[#422717] via-[#2C180E] to-[#1C0F08] shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-[#734A28]/50">
        <div className="relative rounded-xl overflow-hidden wood-surface border border-[#D99B26]/20 shadow-inner">
          {/* SVG Board Layer */}
          <svg
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            className="block w-full h-auto"
            role="img"
            aria-label="Aadu Puli Aattam 23-point triangular wooden game board"
          >
            <defs>
              {/* Wood grain subtle overlay */}
              <linearGradient id="boardSheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D99B26" stopOpacity="0.06" />
                <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
              </linearGradient>

              {/* Inlaid Brass Line Gradient */}
              <linearGradient id="brassInlay" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E6B65C" />
                <stop offset="50%" stopColor="#C48724" />
                <stop offset="100%" stopColor="#E6B65C" />
              </linearGradient>

              {/* Golden Tiger Piece Gradient */}
              <radialGradient id="pieceTigerGrad" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#FFE394" />
                <stop offset="48%" stopColor="#E09E24" />
                <stop offset="100%" stopColor="#854B07" />
              </radialGradient>

              {/* Cream Ivory Goat Piece Gradient */}
              <radialGradient id="pieceGoatGrad" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#FFFDF8" />
                <stop offset="58%" stopColor="#ECE0C6" />
                <stop offset="100%" stopColor="#B59F79" />
              </radialGradient>

              {/* Drop shadow for pieces */}
              <filter id="pieceShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#090503" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* Board Wood Sheen */}
            <rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#boardSheen)" />

            {/* Subtle Decorative Outer Inlay Border */}
            <rect
              x="16"
              y="16"
              width={BOARD_WIDTH - 32}
              height={BOARD_HEIGHT - 32}
              rx="10"
              fill="none"
              stroke="#C98F32"
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />
            {/* Corner Brass Flourishes */}
            <path d="M22 44V22H44" stroke="#D99B26" strokeOpacity="0.45" strokeWidth="2.2" fill="none" />
            <path d="M778 44V22H756" stroke="#D99B26" strokeOpacity="0.45" strokeWidth="2.2" fill="none" />
            <path d="M22 548V570H44" stroke="#D99B26" strokeOpacity="0.45" strokeWidth="2.2" fill="none" />
            <path d="M778 548V570H756" stroke="#D99B26" strokeOpacity="0.45" strokeWidth="2.2" fill="none" />

            {/* Carved Groove Underlay for Board Lines */}
            <g stroke="#0D0603" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.65">
              {BOARD_EDGES.map(([a, b]) => (
                <line
                  key={`groove-${a}-${b}`}
                  x1={BOARD_NODES[a].x}
                  y1={BOARD_NODES[a].y}
                  x2={BOARD_NODES[b].x}
                  y2={BOARD_NODES[b].y}
                />
              ))}
            </g>

            {/* Inlaid Brass Lines */}
            <g stroke="url(#brassInlay)" strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.88">
              {BOARD_EDGES.map(([a, b]) => (
                <line
                  key={`edge-${a}-${b}`}
                  x1={BOARD_NODES[a].x}
                  y1={BOARD_NODES[a].y}
                  x2={BOARD_NODES[b].x}
                  y2={BOARD_NODES[b].y}
                />
              ))}
            </g>

            {/* Last Move Trail Highlight */}
            {lastFromNode && lastToNode && (
              <line
                x1={lastFromNode.x}
                y1={lastFromNode.y}
                x2={lastToNode.x}
                y2={lastToNode.y}
                stroke={lastMove?.type === 'CAPTURE' ? '#F87171' : '#F3C35F'}
                strokeWidth="5"
                strokeOpacity="0.45"
                strokeLinecap="round"
                strokeDasharray={lastMove?.type === 'CAPTURE' ? '8 6' : undefined}
              />
            )}

            {/* Jump Preview Arcs for Selected Tiger */}
            {selectedNode !== null &&
              validMoves.map((m) => {
                if (m.type !== 'CAPTURE') return null;
                const from = BOARD_NODES[m.from];
                const over = BOARD_NODES[m.over];
                const to = BOARD_NODES[m.to];
                const midX = over.x;
                const midY = over.y - 38;
                return (
                  <g key={`jump-arc-${m.from}-${m.to}`}>
                    <path
                      d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                      fill="none"
                      stroke="#F87171"
                      strokeWidth="3"
                      strokeDasharray="6 5"
                      strokeOpacity="0.85"
                    />
                    {/* Target highlight over goat to be captured */}
                    <circle
                      cx={over.x}
                      cy={over.y}
                      r="31"
                      fill="none"
                      stroke="#F87171"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeOpacity="0.85"
                    />
                  </g>
                );
              })}

            {/* 23 Intersection Node Sockets */}
            {BOARD_NODES.map((node) => {
              const validMove = validMoveMap.get(node.id);
              const isCaptureTarget = validMove?.type === 'CAPTURE';
              const isLastPlaced = lastMove?.type === 'PLACE' && lastMove.to === node.id;
              const isLastDest = lastToNode?.id === node.id;
              const isSelected = selectedNode === node.id;

              return (
                <g key={`socket-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
                  {/* Outer carved depression */}
                  <circle r="13" fill="#130A05" stroke="#B68029" strokeOpacity="0.7" strokeWidth="2" />
                  {/* Inner brass dot */}
                  <circle r="4.5" fill="#D99B26" fillOpacity="0.65" />

                  {/* Last move destination ring */}
                  {(isLastPlaced || isLastDest) && !isSelected && (
                    <circle
                      r="29"
                      fill="none"
                      stroke="#F3C35F"
                      strokeOpacity="0.38"
                      strokeWidth="2"
                    />
                  )}

                  {/* Valid placement / move / capture destination ring */}
                  {validMove && isHumanTurn && (
                    <g>
                      <circle
                        r="24"
                        fill={isCaptureTarget ? 'rgba(239, 68, 68, 0.22)' : 'rgba(52, 211, 153, 0.2)'}
                        stroke={isCaptureTarget ? '#F87171' : '#34D399'}
                        strokeWidth="2.5"
                        className="animate-valid-ring"
                      />
                      <circle
                        r="7"
                        fill={isCaptureTarget ? '#F87171' : '#34D399'}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Capture Ripple Effect */}
            {capturedBurstNode !== null && BOARD_NODES[capturedBurstNode] && (
              <g
                transform={`translate(${BOARD_NODES[capturedBurstNode].x}, ${BOARD_NODES[capturedBurstNode].y})`}
              >
                <circle r="34" fill="rgba(239, 68, 68, 0.28)" stroke="#FCA5A5" strokeWidth="2.5" />
              </g>
            )}

            {/* Active Pieces Layer (compositor-only translate3d transforms for smooth movement) */}
            <g>
              {pieces.map((piece) => {
                const isSelected = selectedNode === piece.nodeId;
                const isSelectable =
                  isHumanTurn &&
                  ((state.turn === 'TIGER' && piece.type === 'TIGER') ||
                    (state.turn === 'GOAT' &&
                      state.goatsToPlace === 0 &&
                      piece.type === 'GOAT'));

                return (
                  <g
                    key={piece.id}
                    filter="url(#pieceShadow)"
                    style={{
                      transform: `translate3d(${piece.x}px, ${piece.y}px, 0) scale(${isSelected ? 1.12 : 1})`,
                      transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        r="31"
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="3"
                        strokeOpacity="0.95"
                      />
                    )}
                    {/* Subtle hover/turn readiness ring */}
                    {!isSelected && isSelectable && (
                      <circle
                        r="27"
                        fill="none"
                        stroke={piece.type === 'TIGER' ? '#F3C35F' : '#F4EAD5'}
                        strokeOpacity="0.25"
                        strokeWidth="1.5"
                      />
                    )}

                    {piece.type === 'TIGER' ? (
                      <g>
                        <circle
                          r="23"
                          fill="url(#pieceTigerGrad)"
                          stroke="#4D2904"
                          strokeWidth="2.4"
                        />
                        <circle
                          r="18.5"
                          fill="none"
                          stroke="#FFF3C4"
                          strokeOpacity="0.45"
                          strokeWidth="1.2"
                        />
                        {/* Tiger Head Crest */}
                        <path
                          d="M-9 -7L-13 -13L-6 -10C-4 -11.5 -2 -12 0 -12C2 -12 4 -11.5 6 -10L13 -13L9 -7C11 -4.5 11.8 -1 11 3C9.8 8.5 5 12.5 0 12.5C-5 12.5 -9.8 8.5 -11 3C-11.8 -1 -11 -4.5 -9 -7Z"
                          fill="#381C03"
                        />
                        <path
                          d="M0 -10V-5M-4.5 -9L-3 -6M4.5 -9L3 -6"
                          stroke="#F4C150"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                        <path
                          d="M-9 -1L-5.5 0M-9 3L-5.5 2.2M9 -1L5.5 0M9 3L5.5 2.2"
                          stroke="#F4C150"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <ellipse cx="-4.5" cy="-2" rx="1.8" ry="1.3" fill="#FFE8A3" />
                        <ellipse cx="4.5" cy="-2" rx="1.8" ry="1.3" fill="#FFE8A3" />
                        <path d="M-2.4 3.5L0 5.8L2.4 3.5H-2.4Z" fill="#F4C150" />
                        <path
                          d="M0 5.8V8.2M-3 8.2C-1.5 9.4 1.5 9.4 3 8.2"
                          stroke="#F4C150"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </g>
                    ) : (
                      <g>
                        <circle
                          r="20.5"
                          fill="url(#pieceGoatGrad)"
                          stroke="#5A452C"
                          strokeWidth="2.2"
                        />
                        <circle
                          r="16.5"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeOpacity="0.65"
                          strokeWidth="1.1"
                        />
                        {/* Horned Goat Crest */}
                        <path
                          d="M-5 -7C-8 -11 -12 -11.5 -13.5 -9C-10.5 -8.5 -9 -7 -8 -4.5L-11 -1.5L-7.5 -0.8C-7.5 3.8 -5.2 9 -2.2 11.2L0 13.5L2.2 11.2C5.2 9 7.5 3.8 7.5 -0.8L11 -1.5L8 -4.5C9 -7 10.5 -8.5 13.5 -9C12 -11.5 8 -11 5 -7C3.5 -8.2 1.8 -8.6 0 -8.6C-1.8 -8.6 -3.5 -8.2 -5 -7Z"
                          fill="#3A2918"
                        />
                        <circle cx="-3.3" cy="-0.2" r="1.3" fill="#FFFDF7" />
                        <circle cx="3.3" cy="-0.2" r="1.3" fill="#FFFDF7" />
                        <path
                          d="M-1.5 6.8H1.5M0 6.8V10"
                          stroke="#EFE3CB"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Accessible HTML Hit Target Buttons (>= 44px touch targets) */}
          <div className="absolute inset-0 pointer-events-none">
            {BOARD_NODES.map((node) => {
              const occupant = state.board[node.id];
              const validMove = validMoveMap.get(node.id);
              const isSelected = selectedNode === node.id;
              const leftPct = (node.x / BOARD_WIDTH) * 100;
              const topPct = (node.y / BOARD_HEIGHT) * 100;

              let actionDesc = 'Empty intersection';
              if (occupant === 'TIGER') actionDesc = 'Tiger piece';
              else if (occupant === 'GOAT') actionDesc = 'Goat piece';
              if (validMove?.type === 'PLACE') actionDesc = 'Place goat here';
              else if (validMove?.type === 'MOVE') actionDesc = 'Move piece here';
              else if (validMove?.type === 'CAPTURE') actionDesc = 'Jump and capture goat';

              return (
                <button
                  key={`hit-${node.id}`}
                  type="button"
                  onClick={() => onNodeClick(node.id)}
                  aria-label={`Point ${node.label}: ${actionDesc}${isSelected ? ' (selected)' : ''}`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-[8.5%] min-w-[44px] min-h-[44px] aspect-square rounded-full bg-transparent hover:bg-[#F3C35F]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C35F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D100A] transition-colors duration-150 cursor-pointer"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
