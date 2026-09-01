import React from 'react';

interface CharacterProps {
  isRunning?: boolean;
  size?: number;
  className?: string;
}

export const BabyTiger: React.FC<CharacterProps> = ({
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
        {/* Tiger Tail with curved stripes */}
        <path
          d="M22 66 C10 65 6 50 14 42 C16 45 12 56 24 58 Z"
          fill="#F59E0B"
        />
        <path d="M12 47 L15 48" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 53 L18 55" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

        {/* Tiger Body */}
        <ellipse cx="48" cy="64" rx="23" ry="17" fill="#F59E0B" />
        <ellipse cx="50" cy="68" rx="14" ry="11" fill="#FEF3C7" />

        {/* Body Stripes */}
        <path d="M38 52 L42 57" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M46 50 L49 56" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M54 51 L56 57" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />

        {/* Tiger Running Paws */}
        <ellipse
          cx={isRunning ? '38' : '36'}
          cy="78"
          rx="6.5"
          ry="4.5"
          fill="#D97706"
        />
        <ellipse
          cx={isRunning ? '58' : '60'}
          cy="78"
          rx="6.5"
          ry="4.5"
          fill="#D97706"
        />

        {/* Tiger Ears */}
        <circle cx="50" cy="28" r="9" fill="#F59E0B" />
        <circle cx="50" cy="28" r="5" fill="#FEF3C7" />
        <circle cx="72" cy="30" r="9" fill="#F59E0B" />
        <circle cx="72" cy="30" r="5" fill="#FEF3C7" />

        {/* Tiger Head */}
        <ellipse cx="62" cy="42" rx="19" ry="17" fill="#F59E0B" />

        {/* Forehead Stripes (King '王' pattern) */}
        <path d="M58 28 L66 28" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 32 L64 32" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        <path d="M62 26 L62 34" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />

        {/* Side Cheeks White Fur */}
        <circle cx="53" cy="48" r="7" fill="#FEF3C7" />
        <circle cx="69" cy="48" r="7" fill="#FEF3C7" />

        {/* Big Sparkling Anime Eyes */}
        <circle cx="67" cy="40" r="4.5" fill="#1F2937" />
        <circle cx="68.5" cy="38.5" r="1.6" fill="#FFFFFF" />
        <circle cx="66" cy="42" r="0.8" fill="#FFFFFF" />

        {/* Cute Tiger Nose and Whiskers */}
        <polygon points="71,46 75,46 73,49" fill="#F43F5E" />
        <line x1="75" y1="46" x2="84" y2="44" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="75" y1="48" x2="83" y2="50" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />

        {/* Rosy Blush Cheek */}
        <ellipse cx="58" cy="48" rx="3.5" ry="2" fill="#FB7185" opacity="0.6" />

        {/* Cute Smiling Mouth */}
        <path
          d="M71 49 Q73 53 76 50"
          stroke="#78350F"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
