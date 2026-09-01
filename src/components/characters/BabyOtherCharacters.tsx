import React from 'react';

interface CharacterProps {
  isRunning?: boolean;
  size?: number;
  className?: string;
}

export const BabyBear: React.FC<CharacterProps> = ({
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
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <circle cx="50" cy="65" r="20" fill="#92400E" />
        <ellipse cx="50" cy="67" rx="13" ry="12" fill="#FDE68A" />
        <circle cx="52" cy="28" r="8" fill="#92400E" />
        <circle cx="52" cy="28" r="4.5" fill="#FDE68A" />
        <circle cx="72" cy="30" r="8" fill="#92400E" />
        <circle cx="72" cy="30" r="4.5" fill="#FDE68A" />
        <circle cx="62" cy="42" r="18" fill="#92400E" />
        <ellipse cx="69" cy="46" rx="8" ry="6" fill="#FDE68A" />
        <circle cx="67" cy="40" r="4" fill="#1F2937" />
        <circle cx="68.5" cy="38.5" r="1.5" fill="#FFFFFF" />
        <ellipse cx="73" cy="45" rx="3" ry="2" fill="#451A03" />
        <ellipse cx="58" cy="47" rx="3.5" ry="2" fill="#FB7185" opacity="0.6" />
      </svg>
    </div>
  );
};

export const BabyLion: React.FC<CharacterProps> = ({
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
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <circle cx="62" cy="42" r="22" fill="#F97316" />
        <circle cx="50" cy="64" r="20" fill="#FBBF24" />
        <circle cx="62" cy="42" r="16" fill="#FDE047" />
        <circle cx="67" cy="40" r="4" fill="#1F2937" />
        <circle cx="68.5" cy="38.5" r="1.5" fill="#FFFFFF" />
        <polygon points="72,46 76,46 74,49" fill="#9A3412" />
        <ellipse cx="58" cy="46" rx="3.5" ry="2" fill="#FB7185" opacity="0.6" />
      </svg>
    </div>
  );
};
