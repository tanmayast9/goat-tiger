import React from 'react';

export function TigerEmblem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="tigerGoldGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="45%" stopColor="#E5A229" />
          <stop offset="100%" stopColor="#8C510A" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#tigerGoldGrad)" stroke="#522D04" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#FFF3C4" strokeOpacity="0.45" strokeWidth="1.2" />
      {/* Stylized Tiger Face Silhouette */}
      <path
        d="M19 22L14 15L23 18C26 16.5 29 16 32 16C35 16 38 16.5 41 18L50 15L45 22C47.5 25.5 48.5 30 47.5 35C46 42 39.5 47 32 47C24.5 47 18 42 16.5 35C15.5 30 16.5 25.5 19 22Z"
        fill="#3B1E04"
      />
      {/* Forehead & Cheek Stripes */}
      <path d="M32 19V25M26 20L28 24M38 20L36 24" stroke="#F4C150" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 31L24 32M19 36L24 35M45 31L40 32M45 36L40 35" stroke="#F4C150" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="25.5" cy="29" rx="2.3" ry="1.6" fill="#FFE8A3" />
      <ellipse cx="38.5" cy="29" rx="2.3" ry="1.6" fill="#FFE8A3" />
      {/* Nose & Snout */}
      <path d="M29 36L32 39L35 36H29Z" fill="#F4C150" />
      <path d="M32 39V42M28 42C30 43.5 34 43.5 36 42" stroke="#F4C150" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GoatEmblem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="goatIvoryGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="55%" stopColor="#EFE3CB" />
          <stop offset="100%" stopColor="#BBA683" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#goatIvoryGrad)" stroke="#5E4930" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="1.2" />
      {/* Stylized Horned Goat Silhouette */}
      <path
        d="M25 22C21 17 16 16 14 19C18 20 20 22 21 25L17 29L22 30C22 36 25 43 29 46L32 50L35 46C39 43 42 36 42 30L47 29L43 25C44 22 46 20 50 19C48 16 43 17 39 22C37 20.5 34.5 20 32 20C29.5 20 27 20.5 25 22Z"
        fill="#3A2918"
      />
      {/* Eyes */}
      <circle cx="27.5" cy="31" r="1.7" fill="#FFFDF7" />
      <circle cx="36.5" cy="31" r="1.7" fill="#FFFDF7" />
      {/* Muzzle & Beard Detail */}
      <path d="M30 40H34M32 40V45" stroke="#EFE3CB" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
