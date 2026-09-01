import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { KOREAN_QUESTIONS } from './src/data/questions';
import { GameStatus, Player, RoomState, TeamId, GAME_CONSTANTS } from './src/types/game';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory room store with active SSE subscribers
const rooms: Map<string, RoomState> = new Map();
const roomSubscribers: Map<string, Set<Response>> = new Map();

// Helper to broadcast room state to all connected clients (Host & Students)
function broadcastRoomState(roomId: string, eventName?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (eventName) {
    room.lastEvent = eventName;
    room.lastEventTimestamp = Date.now();
  }

  const subscribers = roomSubscribers.get(roomId);
  if (subscribers && subscribers.size > 0) {
    const payload = `data: ${JSON.stringify(room)}\n\n`;
    for (const res of subscribers) {
      try {
        res.write(payload);
      } catch (err) {
        // Handle dead connections
        subscribers.delete(res);
      }
    }
  }
}

// Generate 6-digit alphanumeric room ID
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Clean up inactive rooms older than 4 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > 4 * 60 * 60 * 1000) {
      rooms.delete(id);
      roomSubscribers.delete(id);
    }
  }
}, 60 * 60 * 1000);

// ======================== API ROUTES ========================

// 1. Create Room (Host / Teacher)
app.post('/api/rooms/create', (req: Request, res: Response) => {
  let roomId = generateRoomId();
  while (rooms.has(roomId)) {
    roomId = generateRoomId();
  }

  const newRoom: RoomState = {
    roomId,
    roundId: `r1_${Date.now()}`,
    hostId: `host_${Date.now()}`,
    createdAt: Date.now(),
    status: 'WAITING',
    maxPlayers: GAME_CONSTANTS.MAX_PLAYERS,
    players: {},
    currentQuestionIndex: 0,
    countdownValue: 3,
    tapPhaseEndTime: null,
    tapPhaseDurationMs: GAME_CONSTANTS.TAP_DURATION_MS,
    teamScores: {
      A: { taps: 0, distance: 0 },
      B: { taps: 0, distance: 0 },
    },
    winner: null,
    winnerDeclaredAt: null,
    totalQuestions: KOREAN_QUESTIONS.length,
    raceTargetTaps: GAME_CONSTANTS.RACE_TARGET_TAPS,
    raceDistance: GAME_CONSTANTS.RACE_DISTANCE,
  };

  rooms.set(roomId, newRoom);
  roomSubscribers.set(roomId, new Set());

  console.log(`[Room Created] ID: ${roomId}`);
  res.json({ success: true, room: newRoom });
});

// 2. Get Room State
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }
  res.json({ success: true, room });
});

// 3. Realtime SSE Stream for Room
app.get('/api/rooms/:roomId/stream', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial room snapshot
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  if (!roomSubscribers.has(roomId)) {
    roomSubscribers.set(roomId, new Set());
  }
  const subscribers = roomSubscribers.get(roomId)!;
  subscribers.add(res);

  // Keep connection alive with ping every 25s
  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    subscribers.delete(res);
  });
});

// 4. Join Room (Student)
app.post('/api/rooms/:roomId/join', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  const { nickname, team, existingPlayerId } = req.body;

  // Check if player is rejoining with existing playerId
  if (existingPlayerId && room.players[existingPlayerId]) {
    const existing = room.players[existingPlayerId];
    existing.lastActive = Date.now();
    broadcastRoomState(roomId, 'PLAYER_RECONNECTED');
    return res.json({ success: true, player: existing, room });
  }

  // Validate nickname
  const trimmedName = (nickname || '').trim();
  if (!trimmedName || trimmedName.length < GAME_CONSTANTS.MIN_NICKNAME_LENGTH) {
    return res.status(400).json({ error: '닉네임을 입력해 주세요.' });
  }
  if (trimmedName.length > GAME_CONSTANTS.MAX_NICKNAME_LENGTH) {
    return res.status(400).json({
      error: `닉네임은 최대 ${GAME_CONSTANTS.MAX_NICKNAME_LENGTH}자까지 가능합니다.`,
    });
  }

  // Check total player capacity
  const playerList = Object.values(room.players);
  if (playerList.length >= GAME_CONSTANTS.MAX_PLAYERS) {
    return res.status(400).json({ error: '방 정원(최대 4명)이 초과되었습니다.' });
  }

  // Check duplicate nickname in room
  const duplicateName = playerList.some(
    (p) => p.nickname.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicateName) {
    return res.status(400).json({ error: '이미 방에 존재하는 닉네임입니다.' });
  }

  // Validate team selection
  const selectedTeam: TeamId = team === 'B' ? 'B' : 'A';
  const teamMembers = playerList.filter((p) => p.team === selectedTeam);
  if (teamMembers.length >= GAME_CONSTANTS.TEAM_CAPACITY) {
    const otherTeam: TeamId = selectedTeam === 'A' ? 'B' : 'A';
    return res.status(400).json({
      error: `${selectedTeam}팀 정원(2명)이 마감되었습니다. ${otherTeam}팀을 선택해 주세요.`,
    });
  }

  const newPlayerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newPlayer: Player = {
    id: newPlayerId,
    nickname: trimmedName,
    team: selectedTeam,
    isReady: true,
    taps: 0,
    lastActive: Date.now(),
    answeredCurrentQuestion: false,
  };

  room.players[newPlayerId] = newPlayer;
  broadcastRoomState(roomId, 'PLAYER_JOINED');

  console.log(`[Player Joined] Room: ${roomId}, Player: ${trimmedName} (${selectedTeam}팀)`);
  res.json({ success: true, player: newPlayer, room });
});

// 5. Host Starts Game (Start Countdown)
app.post('/api/rooms/:roomId/start', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  const playerCount = Object.keys(room.players).length;
  if (playerCount < 1) {
    return res.status(400).json({ error: '학생이 한 명 이상 참가해야 시작할 수 있습니다.' });
  }

  // Reset players question state
  for (const pid in room.players) {
    room.players[pid].answeredCurrentQuestion = false;
    room.players[pid].selectedAnswerIndex = undefined;
    room.players[pid].isCorrect = undefined;
  }

  room.status = 'COUNTDOWN';
  room.countdownValue = 3;
  room.currentQuestionIndex = 0;
  broadcastRoomState(roomId, 'COUNTDOWN_STARTED');

  // Synchronized countdown timer: 3 -> 2 -> 1 -> QUESTION
  const countdownInterval = setInterval(() => {
    const activeRoom = rooms.get(roomId);
    if (!activeRoom || activeRoom.status !== 'COUNTDOWN') {
      clearInterval(countdownInterval);
      return;
    }

    if (activeRoom.countdownValue > 1) {
      activeRoom.countdownValue -= 1;
      broadcastRoomState(roomId, 'COUNTDOWN_TICK');
    } else {
      clearInterval(countdownInterval);
      activeRoom.status = 'QUESTION';
      activeRoom.countdownValue = 0;
      broadcastRoomState(roomId, 'QUESTION_STARTED');
    }
  }, 1000);

  res.json({ success: true, room });
});

// 6. Student Submits Answer
app.post('/api/rooms/:roomId/answer', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  if (room.status !== 'QUESTION') {
    return res.status(400).json({ error: '현재 문제 풀이 단계가 아닙니다.' });
  }

  const { playerId, answerIndex, questionIndex } = req.body;
  const player = room.players[playerId];

  if (!player) {
    return res.status(404).json({ error: '등록되지 않은 참가자입니다.' });
  }

  if (player.answeredCurrentQuestion) {
    return res.status(400).json({ error: '이미 답을 제출하셨습니다.' });
  }

  const currentQ = KOREAN_QUESTIONS[room.currentQuestionIndex];
  if (!currentQ) {
    return res.status(400).json({ error: '문제를 찾을 수 없습니다.' });
  }

  const isCorrect = Number(answerIndex) === currentQ.correctIndex;
  player.answeredCurrentQuestion = true;
  player.selectedAnswerIndex = Number(answerIndex);
  player.isCorrect = isCorrect;
  player.lastActive = Date.now();

  // Check if all joined players have answered
  const allPlayers = Object.values(room.players);
  const allAnswered = allPlayers.every((p) => p.answeredCurrentQuestion);

  // If all players answered (or after a brief delay), transition to TAP phase
  if (allAnswered) {
    initiateTapPhase(roomId);
  } else {
    broadcastRoomState(roomId, 'ANSWER_SUBMITTED');
  }

  res.json({ success: true, isCorrect, correctIndex: currentQ.correctIndex, room });
});

// Function to trigger TAP Phase for 3 seconds
function initiateTapPhase(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || (room.status !== 'QUESTION' && room.status !== 'COUNTDOWN')) return;

  room.status = 'TAP_PHASE';
  room.tapPhaseEndTime = Date.now() + GAME_CONSTANTS.TAP_DURATION_MS;
  broadcastRoomState(roomId, 'TAP_PHASE_STARTED');

  // Auto-end tap phase after exactly 3000ms (+200ms grace period)
  setTimeout(() => {
    endTapPhase(roomId);
  }, GAME_CONSTANTS.TAP_DURATION_MS + 200);
}

// Host force trigger next phase (in case student took too long)
app.post('/api/rooms/:roomId/force-tap-phase', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  initiateTapPhase(roomId);
  res.json({ success: true });
});

// Function to calculate and advance after TAP Phase
function endTapPhase(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'TAP_PHASE') return;

  // Check if any team has reached 100m
  const distA = room.teamScores.A.distance;
  const distB = room.teamScores.B.distance;

  if (distA >= GAME_CONSTANTS.RACE_DISTANCE || distB >= GAME_CONSTANTS.RACE_DISTANCE) {
    room.status = 'GAME_OVER';
    if (distA >= GAME_CONSTANTS.RACE_DISTANCE && distB >= GAME_CONSTANTS.RACE_DISTANCE) {
      room.winner = distA > distB ? 'A' : distB > distA ? 'B' : 'DRAW';
    } else if (distA >= GAME_CONSTANTS.RACE_DISTANCE) {
      room.winner = 'A';
    } else {
      room.winner = 'B';
    }
    room.winnerDeclaredAt = Date.now();
    broadcastRoomState(roomId, 'GAME_OVER');
    return;
  }

  // Check if we reached the last question (10 questions)
  if (room.currentQuestionIndex >= KOREAN_QUESTIONS.length - 1) {
    room.status = 'GAME_OVER';
    if (distA > distB) {
      room.winner = 'A';
    } else if (distB > distA) {
      room.winner = 'B';
    } else {
      room.winner = 'DRAW';
    }
    room.winnerDeclaredAt = Date.now();
    broadcastRoomState(roomId, 'GAME_OVER');
    return;
  }

  // Show round result for 2 seconds, then go to next question
  room.status = 'ROUND_RESULT';
  broadcastRoomState(roomId, 'ROUND_RESULT');

  setTimeout(() => {
    const activeRoom = rooms.get(roomId);
    if (!activeRoom || activeRoom.status !== 'ROUND_RESULT') return;

    activeRoom.currentQuestionIndex += 1;
    activeRoom.status = 'QUESTION';
    activeRoom.tapPhaseEndTime = null;

    // Reset player per-question answer flags
    for (const pid in activeRoom.players) {
      activeRoom.players[pid].answeredCurrentQuestion = false;
      activeRoom.players[pid].selectedAnswerIndex = undefined;
      activeRoom.players[pid].isCorrect = undefined;
    }

    broadcastRoomState(roomId, 'NEXT_QUESTION');
  }, 2200);
}

// 7. Student Streams TAP Delta (Rapid atomic increments)
app.post('/api/rooms/:roomId/tap', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  if (room.status !== 'TAP_PHASE') {
    return res.status(400).json({ error: '현재 탭 연타 시간이 아닙니다.' });
  }

  const { playerId, tapDelta } = req.body;
  const player = room.players[playerId];

  if (!player) {
    return res.status(404).json({ error: '등록되지 않은 참가자입니다.' });
  }

  // Only allow TAP if student answered current question correctly
  if (!player.isCorrect) {
    return res.status(403).json({ error: '정답자만 탭을 할 수 있습니다.' });
  }

  // Validate tap delta to prevent unrealistic client cheat
  const delta = Math.max(0, Math.min(Number(tapDelta) || 0, 30));
  if (delta === 0) {
    return res.json({ success: true, room });
  }

  // Atomic increments
  player.taps += delta;
  player.lastActive = Date.now();

  const team = player.team;
  room.teamScores[team].taps += delta;

  // Calculate distance: 60 taps = 100 meters
  const totalTeamTaps = room.teamScores[team].taps;
  const rawDistance = (totalTeamTaps / GAME_CONSTANTS.RACE_TARGET_TAPS) * GAME_CONSTANTS.RACE_DISTANCE;
  room.teamScores[team].distance = Math.min(GAME_CONSTANTS.RACE_DISTANCE, Math.round(rawDistance * 10) / 10);

  // Check if this tap crossed 100m finish line first
  if (room.teamScores[team].distance >= GAME_CONSTANTS.RACE_DISTANCE && !room.winner) {
    room.status = 'GAME_OVER';
    room.winner = team;
    room.winnerDeclaredAt = Date.now();
    broadcastRoomState(roomId, 'WINNER_REACHED_GOAL');
  } else {
    broadcastRoomState(roomId, 'TAP_UPDATED');
  }

  res.json({
    success: true,
    playerTaps: player.taps,
    teamTaps: room.teamScores[team].taps,
    teamDistance: room.teamScores[team].distance,
  });
});

// 8. Restart Game ("다시하기" with same players)
app.post('/api/rooms/:roomId/restart', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || '').toUpperCase();
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: '존재하지 않는 방 번호입니다.' });
  }

  // Reset game state while keeping players and teams
  room.roundId = `r_${Date.now()}`;
  room.status = 'WAITING';
  room.currentQuestionIndex = 0;
  room.countdownValue = 3;
  room.tapPhaseEndTime = null;
  room.winner = null;
  room.winnerDeclaredAt = null;
  room.teamScores = {
    A: { taps: 0, distance: 0 },
    B: { taps: 0, distance: 0 },
  };

  for (const pid in room.players) {
    room.players[pid].taps = 0;
    room.players[pid].answeredCurrentQuestion = false;
    room.players[pid].selectedAnswerIndex = undefined;
    room.players[pid].isCorrect = undefined;
  }

  broadcastRoomState(roomId, 'GAME_RESTARTED');
  console.log(`[Room Restarted] ID: ${roomId}`);
  res.json({ success: true, room });
});

// ======================== VITE & STATIC SERVING ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Korean Animal Race Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
