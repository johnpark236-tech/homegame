import React from 'react';

interface CharacterProps {
  isRunning?: boolean;
  size?: number;
  className?: string;
  variant?: 'idle' | 'run' | 'win';
}

const dragonImages = {
  idle: '/assets/characters/dragon-idle.png',
  run: '/assets/characters/dragon-run.png',
  win: '/assets/characters/dragon-win.png',
};

export const BabyDragon: React.FC<CharacterProps> = ({
  isRunning = false,
  size = 180,
  className = '',
  variant,
}) => {
  const activeVariant = variant || (isRunning ? 'run' : 'idle');

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        isRunning ? 'animate-bounce' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      aria-label="아기 용 캐릭터"
    >
      <img
        src={dragonImages[activeVariant]}
        alt=""
        draggable={false}
        className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-200"
      />
    </div>
  );
};
