import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, RoomState, TeamId, GAME_CONSTANTS } from '../types/game';
import { KOREAN_QUESTIONS } from '../data/questions';
import { sound } from '../utils/sound';
import { BabyDragon } from './characters/BabyDragon';
import { BabyTiger } from './characters/BabyTiger';
import { RaceTrack } from './RaceTrack';
import { apiFetch } from '../utils/apiFetch';
import {
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Sparkles,
  Flame,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface StudentViewProps {
  initialRoomId?: string;
}

export const StudentView: React.FC<StudentViewProps> = ({ initialRoomId = '' }) => {
  const [roomIdInput, setRoomIdInput] = useState<string>(initialRoomId.toUpperCase());
  const [nickname, setNickname] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<TeamId>('A');
  const [joinedRoom, setJoinedRoom] = useState<RoomState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Answering & Tapping state
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctIndex: number } | null>(null);

  // Local rapid tap counting & batching
  const [localTapCount, setLocalTapCount] = useState<number>(0);
  const pendingTapDeltaRef = useRef<number>(0);
  const tapIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuestionIndexRef = useRef<number>(-1);
  const isSoloMode = joinedRoom?.gameMode === 'SOLO';
  const playerQuestionIndex = isSoloMode
    ? player?.currentQuestionIndex ?? 0
    : joinedRoom?.currentQuestionIndex ?? 0;
  const currentQuestion = joinedRoom ? KOREAN_QUESTIONS[playerQuestionIndex] : null;
  const soloTapPhaseActive = Boolean(
    isSoloMode &&
      joinedRoom?.status === 'QUESTION' &&
      player?.isCorrect &&
      player?.soloTapPhaseEndTime &&
      Date.now() <= player.soloTapPhaseEndTime
  );
  const canTapNow = joinedRoom?.status === 'TAP_PHASE' || soloTapPhaseActive;

  // Check localStorage for existing session recovery
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('korean_animal_race_session');
      if (savedSession) {
        const { roomId, playerId } = JSON.parse(savedSession);
        if (roomId && playerId) {
          reconnectSession(roomId, playerId);
        }
      }
    } catch {}
  }, []);

  const reconnectSession = async (roomId: string, playerId: string) => {
    try {
      const res = await apiFetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingPlayerId: playerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinedRoom(data.room);
        setPlayer(data.player);
      }
    } catch {
      localStorage.removeItem('korean_animal_race_session');
    }
  };

  // Setup SSE stream once joined to room
  useEffect(() => {
    if (!joinedRoom) return;

    const sse = new EventSource(`/api/rooms/${joinedRoom.roomId}/stream`);

    sse.onmessage = (event) => {
      try {
        const updatedRoom: RoomState = JSON.parse(event.data);
        setJoinedRoom(updatedRoom);

        // Sync player data
        const updatedPlayer = player && updatedRoom.players[player.id] ? updatedRoom.players[player.id] : null;
        if (updatedPlayer) {
          setPlayer(updatedPlayer);
        }

        // Reset local answer/tap states when moving to next question or countdown
        const updatedQuestionIndex =
          updatedRoom.gameMode === 'SOLO' && updatedPlayer
            ? updatedPlayer.currentQuestionIndex ?? 0
            : updatedRoom.currentQuestionIndex;

        if (updatedQuestionIndex !== lastQuestionIndexRef.current) {
          lastQuestionIndexRef.current = updatedQuestionIndex;
          setSelectedChoice(null);
          setAnswerResult(null);
          setLocalTapCount(0);
          pendingTapDeltaRef.current = 0;
        }

        if (updatedRoom.lastEvent === 'GAME_RESTARTED') {
          setSelectedChoice(null);
          setAnswerResult(null);
          setLocalTapCount(0);
          pendingTapDeltaRef.current = 0;
        }
      } catch (err) {
        console.error('Failed to parse SSE in student view', err);
      }
    };

    sse.onerror = () => {
      console.warn('Student SSE disconnected, retrying...');
    };

    return () => {
      sse.close();
    };
  }, [joinedRoom?.roomId, player?.id]);

  // Periodic batch flush for local rapid taps (every 150ms)
  useEffect(() => {
    if (!joinedRoom || !canTapNow || !player || !player.isCorrect) {
      if (tapIntervalRef.current) {
        clearInterval(tapIntervalRef.current);
        tapIntervalRef.current = null;
      }
      return;
    }

    tapIntervalRef.current = setInterval(() => {
      if (pendingTapDeltaRef.current > 0) {
        const deltaToSend = pendingTapDeltaRef.current;
        pendingTapDeltaRef.current = 0;

        apiFetch(`/api/rooms/${joinedRoom.roomId}/tap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            tapDelta: deltaToSend,
          }),
        }).catch((err) => {
          console.error('Failed to stream tap delta', err);
        });
      }
    }, 150);

    return () => {
      if (tapIntervalRef.current) {
        clearInterval(tapIntervalRef.current);
        tapIntervalRef.current = null;
      }
    };
  }, [canTapNow, joinedRoom?.roomId, player?.id, player?.isCorrect]);

  // Handle Joining Room
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanRoom = roomIdInput.trim().toUpperCase();
    const cleanNick = nickname.trim();

    if (!cleanRoom) {
      setErrorMsg('방 번호(ROOM ID)를 입력해 주세요.');
      return;
    }
    if (!cleanNick) {
      setErrorMsg('닉네임을 입력해 주세요.');
      return;
    }
    if (cleanNick.length > GAME_CONSTANTS.MAX_NICKNAME_LENGTH) {
      setErrorMsg(`닉네임은 최대 ${GAME_CONSTANTS.MAX_NICKNAME_LENGTH}자까지 가능합니다.`);
      return;
    }

    setIsLoading(true);
    sound.playTap();

    try {
      const res = await apiFetch(`/api/rooms/${cleanRoom}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: cleanNick,
          team: selectedTeam,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '입장할 수 없습니다.');
        return;
      }

      setJoinedRoom(data.room);
      setPlayer(data.player);

      // Store in localStorage for refresh recovery
      try {
        localStorage.setItem(
          'korean_animal_race_session',
          JSON.stringify({ roomId: cleanRoom, playerId: data.player.id })
        );
      } catch {}
    } catch (err) {
      setErrorMsg('서버와 연결할 수 없습니다. 인터넷 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer for Question
  const handleSelectAnswer = async (index: number) => {
    if (!joinedRoom || !player || isSubmittingAnswer || selectedChoice !== null) return;

    setSelectedChoice(index);
    setIsSubmittingAnswer(true);
    sound.playTap();

    try {
      const res = await apiFetch(`/api/rooms/${joinedRoom.roomId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          answerIndex: index,
          questionIndex: playerQuestionIndex,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAnswerResult({
          isCorrect: data.isCorrect,
          correctIndex: data.correctIndex,
        });

        if (data.isCorrect) {
          sound.playCorrect();
        } else {
          sound.playWrong();
        }
      } else {
        setErrorMsg(data.error || '답안 제출에 실패했습니다.');
      }
    } catch (err) {
      setErrorMsg('답안 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Handle Rapid Tap Event with PointerDown
  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!joinedRoom || !canTapNow || !player?.isCorrect) return;

      sound.playTap();
      setLocalTapCount((prev) => prev + 1);
      pendingTapDeltaRef.current += 1;
    },
    [canTapNow, player?.isCorrect]
  );

  // ======================== RENDER 1: ENTRY / LOGIN SCREEN ========================
  if (!joinedRoom || !player) {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border-2 border-emerald-100 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200 text-2xl">
            📱
          </div>
          <h1 className="text-2xl font-black text-emerald-950 font-['Jua']">
            학생 참가하기
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            닉네임과 팀을 정하고 동물 달리기 경기에 참여하세요!
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          {/* Room ID Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Jua'] uppercase tracking-wider">
              방 번호 (ROOM ID)
            </label>
            <input
              id="student-room-id-input"
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              placeholder="예: 6자리 코드"
              maxLength={8}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white text-center font-mono font-black text-xl text-emerald-900 tracking-widest outline-none transition-all"
            />
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Jua'] uppercase tracking-wider">
              내 닉네임 (최대 8자)
            </label>
            <input
              id="student-nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 날쌘돌이"
              maxLength={GAME_CONSTANTS.MAX_NICKNAME_LENGTH}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white font-bold text-base text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Team Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Jua'] uppercase tracking-wider">
              팀 선택 (팀당 최대 2명)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Dragon Team */}
              <button
                type="button"
                id="select-team-a-btn"
                onClick={() => {
                  setSelectedTeam('A');
                  sound.playTap();
                }}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedTeam === 'A'
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <BabyDragon size={96} variant={selectedTeam === 'A' ? 'run' : 'idle'} isRunning={selectedTeam === 'A'} />
                <span className="font-bold text-xs text-blue-950 font-['Jua']">
                  A팀: 아기 용
                </span>
              </button>

              {/* Tiger Team */}
              <button
                type="button"
                id="select-team-b-btn"
                onClick={() => {
                  setSelectedTeam('B');
                  sound.playTap();
                }}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedTeam === 'B'
                    ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <BabyTiger size={96} variant={selectedTeam === 'B' ? 'run' : 'idle'} isRunning={selectedTeam === 'B'} />
                <span className="font-bold text-xs text-orange-950 font-['Jua']">
                  B팀: 아기 호랑이
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="student-join-room-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-lg font-['Jua'] shadow-md hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? '입장하는 중...' : '입장하기'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  // ======================== RENDER 2: WAITING LOBBY ========================
  if (joinedRoom.status === 'WAITING') {
    const isTeamA = player.team === 'A';
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border-2 border-emerald-100 shadow-xl text-center space-y-6">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
            ROOM CODE: {joinedRoom.roomId}
          </span>
          <h2 className="text-xl font-black text-emerald-950 font-['Jua'] mt-1">
            {player.nickname}님 환영합니다!
          </h2>
        </div>

        {/* Assigned Team Showcase */}
        <div
          className={`p-6 rounded-3xl border-2 flex flex-col items-center ${
            isTeamA
              ? 'bg-blue-50/80 border-blue-200'
              : 'bg-orange-50/80 border-orange-200'
          }`}
        >
          {isTeamA ? (
            <BabyDragon size={160} variant="run" isRunning={true} />
          ) : (
            <BabyTiger size={160} variant="run" isRunning={true} />
          )}

          <div className="mt-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                isTeamA ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
              }`}
            >
              {isTeamA ? 'A팀 : 아기 용' : 'B팀 : 아기 호랑이'}
            </span>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              선생님이 <span className="font-bold text-emerald-700">START</span>를 누르면 문제가 시작됩니다.
            </p>
          </div>
        </div>

        {/* Room Participants Status */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>참가 학생 ({Object.keys(joinedRoom.players).length}/4명)</span>
            <span className="text-emerald-600 font-bold">준비 완료</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.values(joinedRoom.players || {}) as Player[]).map((p) => (
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  p.team === 'A'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-orange-100 text-orange-800 border-orange-200'
                }`}
              >
                {p.nickname} {p.id === player.id && '(나)'}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ======================== RENDER 3: COUNTDOWN SYNC ========================
  if (joinedRoom.status === 'COUNTDOWN') {
    return (
      <div className="w-full max-w-md mx-auto p-12 bg-white rounded-3xl border-2 border-emerald-100 shadow-2xl text-center space-y-6">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          경기 시작 카운트다운
        </span>
        <div className="text-9xl font-black text-emerald-600 font-['Jua'] animate-ping">
          {joinedRoom.countdownValue}
        </div>
        <p className="text-sm font-bold text-slate-600">
          첫 번째 문제가 곧 나옵니다!
        </p>
      </div>
    );
  }

  if (isSoloMode && joinedRoom.status === 'QUESTION' && player.soloFinished) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 text-center">
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl space-y-3">
          <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-bold">
            모드 2 개인 문제 완료
          </span>
          <h2 className="text-2xl font-black text-emerald-950 font-['Jua']">
            모든 문제를 풀었어요!
          </h2>
          <p className="text-xs text-slate-600">
            다른 친구들의 진행이 끝나거나 100m 결승에 도착하면 결과가 나옵니다.
          </p>
        </div>

        <RaceTrack room={joinedRoom} isHostView={false} />
      </div>
    );
  }

  // ======================== RENDER 4: QUESTION PHASE ========================
  if (joinedRoom.status === 'QUESTION' && !soloTapPhaseActive) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Question Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-100 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-xs">
              문제 {playerQuestionIndex + 1} / {joinedRoom.totalQuestions}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {currentQuestion?.category}
            </span>
          </div>

          <h2 className="text-xl font-black text-emerald-950 font-['Jua'] leading-snug mb-4">
            {currentQuestion?.prompt}
          </h2>

          {/* 4 Large Choice Buttons */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuestion?.options.map((option, idx) => {
              const isSelected = selectedChoice === idx;
              const isLocked = selectedChoice !== null;

              return (
                <button
                  key={idx}
                  id={`choice-btn-${idx}`}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isLocked}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-base transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-[0.99]'
                      : isLocked
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 active:scale-98 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isSelected
                          ? 'bg-white text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                </button>
              );
            })}
          </div>

          {selectedChoice !== null && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs font-bold text-emerald-900 animate-pulse">
              {isSoloMode
                ? answerResult?.isCorrect
                  ? '정답입니다. 3초 탭 화면으로 이동합니다!'
                  : '오답입니다. 다음 문제로 이동합니다.'
                : '답을 제출했습니다. 다른 학생들의 답변을 기다리는 중...'}
            </div>
          )}
        </div>

        {/* Small Live Race Preview */}
        <RaceTrack room={joinedRoom} isHostView={false} />
      </div>
    );
  }

  // ======================== RENDER 5: 3-SECOND TAP PHASE ========================
  if (joinedRoom.status === 'TAP_PHASE' || soloTapPhaseActive) {
    const isCorrect = player.isCorrect;

    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        {isCorrect ? (
          /* CORRECT ANSWER: HIGH DENSITY ENORMOUS RAPID TAP ARENA */
          <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-2xl text-center space-y-4 border-t-8 border-emerald-700 relative overflow-hidden">
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 font-black flex items-center gap-1 border border-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                정답입니다!
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-rose-500 text-white font-mono font-bold animate-pulse">
                ⚡ 3초 동안 마구 연타하세요!
              </span>
            </div>

            {/* Giant Tap Score Counter */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block mb-1">
                MY TAP COUNT
              </span>
              <div className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {localTapCount}
              </div>
            </div>

            {/* Giant Full-Screen Touch Button */}
            <button
              id="student-rapid-tap-btn"
              type="button"
              onPointerDown={handleTap}
              style={{ touchAction: 'manipulation' }}
              className="w-full h-44 rounded-3xl bg-white text-slate-900 font-black text-3xl font-['Jua'] shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 cursor-pointer select-none border-b-6 border-slate-300 active:border-b-0 ring-4 ring-emerald-500/40"
            >
              <div className="flex items-center gap-2 text-emerald-600">
                <Flame className="w-8 h-8 animate-bounce" />
                <span>TAP! TAP! TAP!</span>
              </div>
              <span className="text-xs font-sans text-slate-500 font-bold">
                화면을 빠르게 마구 누르세요!
              </span>
            </button>

            {/* Live Team Distance Bar */}
            <div className="bg-emerald-950/60 rounded-2xl p-2.5 text-xs flex items-center justify-between border border-emerald-800">
              <span className="text-emerald-300">내 팀 누적:</span>
              <span className="font-mono font-bold text-white text-sm">
                {joinedRoom.teamScores[player.team].distance}m ({joinedRoom.teamScores[player.team].taps} 탭)
              </span>
            </div>
          </div>
        ) : (
          /* WRONG ANSWER: FRIENDLY LOCKOUT & EXPLANATION */
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xl text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-rose-100 text-rose-600">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-['Jua']">
                아쉬워요! 오답입니다 😢
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isSoloMode
                  ? '바로 다음 문제로 이동합니다!'
                  : '정답자 친구들이 3초 동안 달리고 있어요. 다음 문제에 도전하세요!'}
              </p>
            </div>

            {/* Question Explanation Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <p className="font-bold text-slate-700">
                💡 정답:{' '}
                <span className="text-emerald-600 font-bold">
                  {currentQuestion?.options[currentQuestion.correctIndex]}
                </span>
              </p>
              <p className="text-slate-500">{currentQuestion?.explanation}</p>
            </div>
          </div>
        )}

        {/* Live Race Preview */}
        <RaceTrack room={joinedRoom} isHostView={false} />
      </div>
    );
  }

  // ======================== RENDER 6: ROUND RESULT / NEXT QUESTION ========================
  if (joinedRoom.status === 'ROUND_RESULT') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4 text-center">
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl space-y-3">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            문제 {joinedRoom.currentQuestionIndex + 1} 결과 집계
          </span>
          <h2 className="text-2xl font-black text-emerald-950 font-['Jua']">
            달리기 완료! 🏃💨
          </h2>
          <p className="text-xs text-slate-600">
            잠시 후 다음 문제가 시작됩니다.
          </p>
        </div>

        <RaceTrack room={joinedRoom} isHostView={false} />
      </div>
    );
  }

  // ======================== RENDER 7: GAME OVER SCREEN ========================
  if (joinedRoom.status === 'GAME_OVER') {
    const isWinner = joinedRoom.winner === player.team;
    const isDraw = joinedRoom.winner === 'DRAW';

    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl border-2 border-emerald-100 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-3xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-100">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 block mb-1">
            100M RACE FINISHED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 font-['Jua']">
            {isWinner
              ? '🎉 우리 팀 승리! 🏆'
              : isDraw
              ? '🤝 치열한 무승부! 🎉'
              : '👏 수고하셨습니다! 다음엔 꼭 승리해요!'}
          </h2>
        </div>

        {/* Character Illustration */}
        <div className="flex justify-center py-2">
          {player.team === 'A' ? (
            <BabyDragon size={190} variant={isWinner ? 'win' : 'idle'} isRunning={isWinner} />
          ) : (
            <BabyTiger size={190} variant={isWinner ? 'win' : 'idle'} isRunning={isWinner} />
          )}
        </div>

        {/* Personal & Team Summary Card */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-left text-xs space-y-2">
          <div className="flex justify-between items-center font-bold text-slate-800 pb-2 border-b border-emerald-200">
            <span>내 개인 탭:</span>
            <span className="font-mono text-sm text-emerald-900">{player.taps}회</span>
          </div>
          <div className="flex justify-between items-center font-bold text-slate-800">
            <span>우리 팀 누적 탭:</span>
            <span className="font-mono text-sm text-emerald-900">
              {joinedRoom.teamScores[player.team].taps}회
            </span>
          </div>
          <div className="flex justify-between items-center font-bold text-slate-800">
            <span>우리 팀 최종 거리:</span>
            <span className="font-mono text-sm text-emerald-900">
              {joinedRoom.teamScores[player.team].distance}m
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          선생님이 <span className="font-bold text-emerald-700">다시하기</span>를 누르면 새로운 경기가 시작됩니다.
        </p>
      </div>
    );
  }

  return null;
};
