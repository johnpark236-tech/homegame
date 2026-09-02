import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { RoomState, Player } from '../types/game';
import { KOREAN_QUESTIONS } from '../data/questions';
import { RaceTrack } from './RaceTrack';
import { apiFetch } from '../utils/apiFetch';
import { sound } from '../utils/sound';
import { BabyDragon } from './characters/BabyDragon';
import { BabyTiger } from './characters/BabyTiger';
import {
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Copy,
  Check,
  HelpCircle,
  Zap,
  Volume2,
  Clock,
} from 'lucide-react';

interface TeacherHostViewProps {
  initialRoom: RoomState;
  onExitHost?: () => void;
}

export const TeacherHostView: React.FC<TeacherHostViewProps> = ({
  initialRoom,
  onExitHost,
}) => {
  const [room, setRoom] = useState<RoomState>(initialRoom);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prevCountdownRef = useRef<number>(room.countdownValue);
  const prevWinnerRef = useRef<string | null>(room.winner);

  // Student joining URL
  const studentJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
    : '';

  // Setup Server-Sent Events (SSE) stream for live updates
  useEffect(() => {
    const sse = new EventSource(`/api/rooms/${room.roomId}/stream`);

    sse.onmessage = (event) => {
      try {
        const updatedRoom: RoomState = JSON.parse(event.data);
        setRoom(updatedRoom);

        // Sound triggers
        if (updatedRoom.status === 'COUNTDOWN' && updatedRoom.countdownValue !== prevCountdownRef.current) {
          sound.playCountdown(updatedRoom.countdownValue);
          prevCountdownRef.current = updatedRoom.countdownValue;
        }

        if (updatedRoom.status === 'GAME_OVER' && updatedRoom.winner && !prevWinnerRef.current) {
          sound.playVictory();
          prevWinnerRef.current = updatedRoom.winner;
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    sse.onerror = () => {
      console.warn('SSE disconnected, retrying...');
    };

    return () => {
      sse.close();
    };
  }, [room.roomId]);

  // Handle Game Start
  const handleStartGame = async () => {
    setErrorMsg(null);
    setIsStarting(true);
    sound.playTap();

    try {
      const res = await apiFetch(`/api/rooms/${room.roomId}/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '게임을 시작할 수 없습니다.');
      }
    } catch (err) {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  // Handle Restart Game
  const handleRestartGame = async () => {
    setIsRestarting(true);
    sound.playTap();
    prevWinnerRef.current = null;

    try {
      const res = await apiFetch(`/api/rooms/${room.roomId}/restart`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '게임을 다시 시작할 수 없습니다.');
      }
    } catch (err) {
      setErrorMsg('다시하기 처리 중 오류가 발생했습니다.');
    } finally {
      setIsRestarting(false);
    }
  };

  // Copy join link
  const handleCopyLink = () => {
    if (studentJoinUrl) {
      navigator.clipboard.writeText(studentJoinUrl);
      setCopied(true);
      sound.playTap();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playersList = (Object.values(room.players || {}) as Player[]);
  const playerCount = playersList.length;
  const currentQuestion = KOREAN_QUESTIONS[room.currentQuestionIndex];

  const playersAnsweredCount = playersList.filter((p) => p.answeredCurrentQuestion).length;
  const isSoloMode = room.gameMode === 'SOLO';
  const modeLabel = isSoloMode ? '모드 2: 각자 달리기' : '모드 1: 함께 풀기';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* ================= HIGH DENSITY HEADER BAR ================= */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200">
            🏃
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-emerald-900 font-['Jua'] tracking-tight">
                교사 경기 진행 대시보드
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black tracking-wider">
                {modeLabel}
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Teacher Dashboard v1.0 • {isSoloMode ? '학생별 개인 진행' : '학생 스마트폰 실시간 연동'}
            </p>
          </div>
        </div>

        {/* Room ID Badge & Copy Button */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border-2 border-emerald-200 px-5 py-2 rounded-2xl text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
              ROOM CODE
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {room.roomId}
            </span>
          </div>

          <button
            id="copy-join-link-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 border-b-4 border-slate-700 active:border-b-0 transition-all cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> 링크 복사됨!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" /> 접속 링크 복사
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error Message Toast */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs text-rose-500 font-black hover:underline ml-3 cursor-pointer"
          >
            ✕ 닫기
          </button>
        </div>
      )}

      {/* ================= 1. LOBBY / WAITING STATE ================= */}
      {room.status === 'WAITING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (col-span-5): High Density Join Code & QR & Participants */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* QR Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Room Join Code
              </span>
              <div className="text-5xl sm:text-6xl font-black text-emerald-600 tracking-tighter mb-4 font-mono">
                {room.roomId}
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-emerald-50 rounded-2xl border-4 border-emerald-500 border-dashed mb-4 flex items-center justify-center shadow-inner">
                <QRCodeSVG
                  value={studentJoinUrl}
                  size={180}
                  level="M"
                  includeMargin
                />
              </div>

              <p className="text-xs font-medium text-slate-500 px-2 leading-relaxed">
                학생 기기에서 QR 코드를 스캔하거나 <br />
                코드를 입력하여 입장하세요.
              </p>
            </div>

            {/* Participants Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-slate-800 font-['Jua'] flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  참가 학생 ({playerCount} / 4명)
                </h3>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                  WAITING
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {/* Team Dragon Players */}
                {playersList
                  .filter((p) => p.team === 'A')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <BabyDragon size={54} variant="idle" />
                        <div>
                          <span className="font-bold text-sm text-blue-950 block">
                            {p.nickname}
                          </span>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                            Dragon Team (A팀)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        준비완료
                      </span>
                    </div>
                  ))}

                {/* Team Tiger Players */}
                {playersList
                  .filter((p) => p.team === 'B')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <BabyTiger size={54} variant="idle" />
                        <div>
                          <span className="font-bold text-sm text-orange-950 block">
                            {p.nickname}
                          </span>
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">
                            Tiger Team (B팀)
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                        준비완료
                      </span>
                    </div>
                  ))}

                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-3.5 text-slate-300 text-xs font-bold bg-slate-50/50"
                  >
                    대기 중... (빈 자리)
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column (col-span-7): Live Race Preview & Start Command Console */}
          <section className="lg:col-span-7 flex flex-col gap-6 justify-between">
            {/* Live Track Preview Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-['Jua'] tracking-tight">
                    LIVE RACE PREVIEW
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    경기가 시작되면 100m 실시간 레이스가 펼쳐집니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-slate-50 px-3.5 py-2 rounded-2xl text-center border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                      Distance
                    </div>
                    <div className="text-lg font-black text-slate-800 leading-none">
                      100m
                    </div>
                  </div>
                  <div className="bg-slate-50 px-3.5 py-2 rounded-2xl text-center border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                      Question
                    </div>
                    <div className="text-lg font-black text-slate-800 leading-none">
                      0/{room.totalQuestions}
                    </div>
                  </div>
                </div>
              </div>

              {/* Race Track Canvas */}
              <div className="my-2">
                <RaceTrack room={room} isHostView={true} />
              </div>

              {/* Guide Box */}
              <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                    Game Rule
                  </span>
                  <span className="text-xs font-bold text-emerald-950">
                    준비된 10개의 초급 한국어 퀴즈로 진행됩니다.
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {isSoloMode
                    ? '각 학생은 자기 화면에서 문제를 따로 진행합니다. 정답이면 3초 탭, 오답이면 바로 다음 문제로 이동합니다.'
                    : '학생들이 정답을 맞추면 3초 동안 화면을 연타할 수 있습니다.'}
                  <br />
                  연타 횟수가 팀별로 합산되어 동물의 전진 거리가 됩니다. (최초 100m 도달 시 승리)
                </p>
              </div>
            </div>

            {/* High Density Dark Command Console Bar */}
            <div className="bg-emerald-900 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4 border-t-8 border-emerald-800 text-white">
              <div className="flex gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    Target Taps
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {room.raceTargetTaps} Taps
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    Players
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {playerCount}/4
                  </span>
                </div>
              </div>

              <button
                id="host-start-game-btn"
                onClick={handleStartGame}
                disabled={playerCount < 1 || isStarting}
                className={`px-8 sm:px-12 py-4 rounded-2xl font-black text-lg sm:text-xl font-['Jua'] transition-all shadow-lg ${
                  playerCount >= 1
                    ? 'bg-white text-emerald-900 hover:bg-emerald-50 shadow-emerald-950/40 border-b-4 border-slate-300 active:border-b-0 cursor-pointer'
                    : 'bg-emerald-800 text-emerald-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  {isStarting ? '시작 중...' : '게임 시작 (START)'}
                </div>
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-white font-bold text-sm mb-0.5">
                  {playerCount >= 1 ? '방 접속 완료' : '접속 대기 중'}
                </p>
                <p className="text-emerald-400 text-xs font-medium">
                  {playerCount >= 1
                    ? '학생이 한 명 이상 참가했습니다.'
                    : '학생이 참가하면 시작할 수 있습니다.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ================= 2. COUNTDOWN SYNC STATE ================= */}
      {room.status === 'COUNTDOWN' && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-2xl border-2 border-emerald-100 flex flex-col items-center justify-center space-y-6 min-h-[380px]">
          <span className="text-xs font-black tracking-[0.2em] text-emerald-600 uppercase">
            RACE STARTING COUNTDOWN
          </span>
          <div className="text-8xl sm:text-9xl font-black text-emerald-600 font-['Jua'] animate-ping">
            {room.countdownValue}
          </div>
          <p className="text-sm text-slate-600 font-bold">
            한국어 문제가 곧 화면에 나타납니다. 학생 기기를 확인하세요!
          </p>
        </div>
      )}

      {/* ================= 3. ACTIVE GAME PLAY (QUESTION / TAP / RESULT) ================= */}
      {(room.status === 'QUESTION' ||
        room.status === 'TAP_PHASE' ||
        room.status === 'ROUND_RESULT') && (
        <div className="space-y-6">
          {/* Question Banner for Classroom Projector */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl relative overflow-hidden">
            {isSoloMode ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <span className="px-3.5 py-1.5 rounded-2xl bg-orange-500 text-white font-black text-xs tracking-wider">
                      모드 2: 각자 달리기
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-['Jua'] leading-snug mt-4">
                      학생별로 문제를 풀고 있습니다.
                    </h2>
                  </div>
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 font-bold flex items-center gap-1.5 border border-orange-200">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    개인 진행 현황
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {playersList.map((p) => {
                    const questionNumber = (p.currentQuestionIndex ?? 0) + 1;
                    const isTapping = Boolean(
                      p.isCorrect &&
                        p.soloTapPhaseEndTime &&
                        Date.now() <= p.soloTapPhaseEndTime
                    );

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border-2 ${
                          p.team === 'A'
                            ? 'bg-blue-50 border-blue-100'
                            : 'bg-orange-50 border-orange-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {p.team === 'A' ? (
                            <BabyDragon size={54} variant={isTapping ? 'run' : 'idle'} />
                          ) : (
                            <BabyTiger size={54} variant={isTapping ? 'run' : 'idle'} />
                          )}
                          <div>
                            <span className="block text-sm font-black text-slate-900">
                              {p.nickname}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {p.team === 'A' ? '용팀' : '호랑이팀'} · {p.taps} 탭
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-black text-slate-700">
                          {p.soloFinished ? '문제 완료' : `문제 ${questionNumber} / ${room.totalQuestions}`}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">
                          {p.soloFinished
                            ? '결승 결과 대기'
                            : isTapping
                            ? '정답! 3초 탭 중'
                            : p.answeredCurrentQuestion
                            ? '답안 처리 중'
                            : '문제 풀이 중'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider">
                      문제 {room.currentQuestionIndex + 1} / {room.totalQuestions}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-2xl bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200">
                      {currentQuestion?.category}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {room.status === 'QUESTION' && (
                      <span className="text-xs px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center gap-1.5 animate-pulse border border-blue-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        학생 답변 중 ({playersAnsweredCount}/{playerCount}명 완료)
                      </span>
                    )}
                    {room.status === 'TAP_PHASE' && (
                      <span className="text-xs px-3.5 py-1.5 rounded-full bg-rose-500 text-white font-black flex items-center gap-1.5 animate-bounce shadow-md shadow-rose-200">
                        <Zap className="w-3.5 h-3.5" />
                        ⚡ 3초 연타 시간! TAP TAP!
                      </span>
                    )}
                    {room.status === 'ROUND_RESULT' && (
                      <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-200">
                        결과 집계 중 → 다음 문제 준비
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Question Prompt */}
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-['Jua'] leading-snug mb-6">
                  {currentQuestion?.prompt}
                </h2>

                {/* 4 Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {currentQuestion?.options.map((opt, idx) => {
                    const isCorrect = idx === currentQuestion.correctIndex;
                    const showAnswer = room.status === 'TAP_PHASE' || room.status === 'ROUND_RESULT';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border-2 font-bold text-center text-sm transition-all flex flex-col items-center justify-center min-h-[72px] ${
                          showAnswer && isCorrect
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-102'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] opacity-70 block mb-0.5 uppercase tracking-wider font-mono">
                          Choice 0{idx + 1}
                        </span>
                        <span className="text-base">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 100m Race Track Canvas Component */}
          <RaceTrack room={room} isHostView={true} />
        </div>
      )}

      {/* ================= 4. GAME OVER & WINNER PODIUM ================= */}
      {room.status === 'GAME_OVER' && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-100 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-100 text-emerald-700 shadow-md shadow-emerald-100">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-black block mb-1">
              경기 종료 • 100M 결승선 도착
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 font-['Jua']">
              {room.winner === 'A' && '🏆 용팀(A팀) 승리! 🎉'}
              {room.winner === 'B' && '🏆 호랑이팀(B팀) 승리! 🎉'}
              {room.winner === 'DRAW' && '🤝 치열한 접전! 무승부! 🎉'}
            </h2>
          </div>

          {/* Winning Character Centerpiece */}
          <div className="flex items-center justify-center gap-6 py-4">
            {room.winner === 'A' && <BabyDragon size={260} variant="win" isRunning={true} />}
            {room.winner === 'B' && <BabyTiger size={260} variant="win" isRunning={true} />}
            {room.winner === 'DRAW' && (
              <>
                <BabyDragon size={190} variant="win" isRunning={true} />
                <BabyTiger size={190} variant="win" isRunning={true} />
              </>
            )}
          </div>

          {/* Final Match Stats Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-950 text-sm font-['Jua'] flex items-center gap-1.5">
                  <BabyDragon size={38} variant="idle" /> 용팀 (A팀) 성적
                </span>
                <span className="font-mono text-base font-black text-blue-700">
                  {room.teamScores.A.distance}m
                </span>
              </div>
              <p className="text-xs text-blue-800 mb-2">
                총 연타 수: <span className="font-bold">{room.teamScores.A.taps}회</span>
              </p>
              <div className="space-y-1.5 pt-2 border-t border-blue-200/60">
                {playersList
                  .filter((p) => p.team === 'A')
                  .map((p) => (
                    <div key={p.id} className="text-xs text-blue-900 flex justify-between font-medium">
                      <span>{p.nickname}</span>
                      <span className="font-mono font-bold">{p.taps} 탭</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-orange-950 text-sm font-['Jua'] flex items-center gap-1.5">
                  <BabyTiger size={38} variant="idle" /> 호랑이팀 (B팀) 성적
                </span>
                <span className="font-mono text-base font-black text-orange-700">
                  {room.teamScores.B.distance}m
                </span>
              </div>
              <p className="text-xs text-orange-800 mb-2">
                총 연타 수: <span className="font-bold">{room.teamScores.B.taps}회</span>
              </p>
              <div className="space-y-1.5 pt-2 border-t border-orange-200/60">
                {playersList
                  .filter((p) => p.team === 'B')
                  .map((p) => (
                    <div key={p.id} className="text-xs text-orange-900 flex justify-between font-medium">
                      <span>{p.nickname}</span>
                      <span className="font-mono font-bold">{p.taps} 탭</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Restart Button */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              id="host-restart-game-btn"
              onClick={handleRestartGame}
              disabled={isRestarting}
              className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg font-['Jua'] shadow-lg hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              {isRestarting ? '초기화 중...' : '다시하기 (참가자 유지)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
