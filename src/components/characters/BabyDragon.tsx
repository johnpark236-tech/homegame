import React from 'react';

interface CharacterProps {
  isRunning?: boolean;
  size?: number;
  className?: string;
}

export const BabyDragon: React.FC<CharacterProps> = ({
  isRunning = false,
  size = 72,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isRunning ? 'animate-bounce' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md transition-transform duration-200"
      >
        {/* Dragon Tail with cute wiggle */}
        <path
          d="M20 65 Q10 60 8 48 Q14 52 24 58 Z"
          fill="#059669"
          className={isRunning ? 'origin-right animate-pulse' : ''}
        />
        <polygon points="10,50 6,45 12,47" fill="#FBBF24" />

        {/* Dragon Wings */}
        <g className={isRunning ? 'origin-center transition-transform' : ''}>
          <path
            d="M32 38 C22 22 40 18 46 28 C42 34 36 38 32 38 Z"
            fill="#34D399"
            stroke="#059669"
            strokeWidth="1.5"
          />
          <path
            d="M36 32 C30 22 42 20 44 28"
            stroke="#10B981"
            strokeWidth="1.2"
            fill="none"
          />
        </g>

        {/* Dragon Body */}
        <ellipse cx="48" cy="62" rx="22" ry="18" fill="#10B981" />
        <ellipse cx="50" cy="66" rx="14" ry="12" fill="#A7F3D0" />

        {/* Dragon Feet / Running Paws */}
        <ellipse
          cx={isRunning ? '38' : '36'}
          cy="78"
          rx="6"
          ry="4"
          fill="#059669"
        />
        <ellipse
          cx={isRunning ? '58' : '60'}
          cy="78"
          rx="6"
          ry="4"
          fill="#059669"
        />

        {/* Dragon Head */}
        <circle cx="62" cy="42" r="18" fill="#10B981" />

        {/* Little Yellow Horns */}
        <polygon points="56,26 59,18 64,25" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
        <polygon points="68,27 73,20 76,28" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />

        {/* Big Sparkling Anime Eyes */}
        <circle cx="68" cy="39" r="4.5" fill="#1F2937" />
        <circle cx="69.5" cy="37.5" r="1.6" fill="#FFFFFF" />
        <circle cx="67" cy="41" r="0.8" fill="#FFFFFF" />

        {/* Cute Snout and Nostril */}
        <ellipse cx="76" cy="45" rx="5" ry="3.5" fill="#34D399" />
        <circle cx="77.5" cy="44.5" r="0.8" fill="#047857" />

        {/* Rosy Blush Cheek */}
        <ellipse cx="62" cy="47" rx="3.5" ry="2" fill="#F87171" opacity="0.6" />

        {/* Happy Smiling Mouth */}
        <path
          d="M72 48 Q75 51 78 48"
          stroke="#065F46"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cute Back Spikes */}
        <polygon points="38,46 42,40 45,47" fill="#FBBF24" />
        <polygon points="46,47 50,42 53,49" fill="#FBBF24" />
      </svg>
    </div>
  );
};
