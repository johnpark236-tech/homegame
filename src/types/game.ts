export type TeamId = 'A' | 'B';

export interface CharacterConfig {
  id: string;
  name: string;
  koreanName: string;
  team: TeamId;
  color: string;
  accentColor: string;
  emoji: string;
  tagline: string;
}

export interface Player {
  id: string;
  nickname: string;
  team: TeamId;
  isReady: boolean;
  taps: number;
  lastActive: number;
  answeredCurrentQuestion?: boolean;
  selectedAnswerIndex?: number;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  category: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export type GameStatus =
  | 'WAITING'      // Lobby, players joining
  | 'COUNTDOWN'    // 3, 2, 1 sync start
  | 'QUESTION'     // Students answering question
  | 'TAP_PHASE'    // 3-second rapid TAP window for correct answers
  | 'ROUND_RESULT' // Showing distance gained this question
  | 'GAME_OVER';   // Winner reached 100m or 10 questions ended

export interface TeamScore {
  taps: number;
  distance: number; // 0 to 100 meters
}

export interface RoomState {
  roomId: string;
  roundId: string;
  hostId: string;
  createdAt: number;
  status: GameStatus;
  maxPlayers: number;
  players: Record<string, Player>;
  currentQuestionIndex: number;
  countdownValue: number; // 3, 2, 1, 0
  tapPhaseEndTime: number | null;
  tapPhaseDurationMs: number;
  teamScores: {
    A: TeamScore;
    B: TeamScore;
  };
  winner: TeamId | 'DRAW' | null;
  winnerDeclaredAt: number | null;
  totalQuestions: number;
  raceTargetTaps: number;
  raceDistance: number; // 100
  lastEvent?: string;
  lastEventTimestamp?: number;
}

export const GAME_CONSTANTS = {
  MAX_PLAYERS: 4,
  TEAM_CAPACITY: 2,
  QUESTION_COUNT: 10,
  COUNTDOWN_SECONDS: 3,
  TAP_DURATION_MS: 3000,
  RACE_DISTANCE: 100, // 100m
  RACE_TARGET_TAPS: 60, // 60 total taps = 100m
  MAX_NICKNAME_LENGTH: 8,
  MIN_NICKNAME_LENGTH: 1,
} as const;

export const CHARACTERS: Record<TeamId, CharacterConfig> = {
  A: {
    id: 'dragon',
    name: 'Baby Dragon',
    koreanName: '아기 용 🐉',
    team: 'A',
    color: '#10B981', // Emerald green
    accentColor: '#059669',
    emoji: '🐲',
    tagline: '하늘을 가르는 불꽃 파워!',
  },
  B: {
    id: 'tiger',
    name: 'Baby Tiger',
    koreanName: '아기 호랑이 🐯',
    team: 'B',
    color: '#F59E0B', // Amber / Gold
    accentColor: '#D97706',
    emoji: '🐯',
    tagline: '번개처럼 빠른 맹수 질주!',
  },
};
