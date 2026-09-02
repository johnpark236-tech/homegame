import React, { useState, useEffect } from 'react';
import { TeacherHostView } from './components/TeacherHostView';
import { StudentView } from './components/StudentView';
import { DebugSimulator } from './components/DebugSimulator';
import { BabyDragon } from './components/characters/BabyDragon';
import { BabyTiger } from './components/characters/BabyTiger';
import { GameMode, RoomState } from './types/game';
import { apiFetch } from './utils/apiFetch';
import { sound } from './utils/sound';
import {
  Trophy,
  Users,
  Smartphone,
  School,
  Sparkles,
  ArrowRight,
  Flame,
  HelpCircle,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'HOME' | 'TEACHER' | 'STUDENT'>('HOME');
  const [createdRoom, setCreatedRoom] = useState<RoomState | null>(null);
  const [urlRoomId, setUrlRoomId] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('SYNC');

  // Check URL query parameters for student direct QR join or debug mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setUrlRoomId(roomParam.toUpperCase());
        setViewMode('STUDENT');
      }
    }
  }, []);

  // Handle Teacher Create Room Button
  const handleCreateRoom = async () => {
    setCreateError(null);
    setIsCreatingRoom(true);
    sound.playTap();

    try {
      const res = await apiFetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameMode: selectedGameMode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCreatedRoom(data.room);
        setViewMode('TEACHER');
      } else {
        setCreateError(data.error || '방 생성에 실패했습니다.');
      }
    } catch (err) {
      setCreateError('서버 연결에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 font-sans text-slate-900 flex flex-col justify-between selection:bg-emerald-400 selection:text-emerald-950">
      {/* ================= HIGH DENSITY GLOBAL APP BAR ================= */}
      <header className="h-20 bg-white border-b border-emerald-200 flex items-center justify-between px-6 sm:px-8 shadow-sm">
        <button
          onClick={() => {
            sound.playTap();
            setViewMode('HOME');
          }}
          className="flex items-center gap-4 cursor-pointer group text-left"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
            🏃
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-900 font-['Jua']">
                KOREAN ANIMAL RACE
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider hidden sm:inline-block">
                High Density v1.0
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              만날 한국어 동물 달리기 게임
            </p>
          </div>
        </button>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Server Status
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                SSE Live Sync
              </span>
            </div>
          </div>

          {viewMode !== 'HOME' && (
            <button
              onClick={() => {
                sound.playTap();
                setViewMode('HOME');
              }}
              className="bg-rose-500 text-white px-5 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-rose-600 border-b-4 border-rose-700 active:border-b-0 transition-all shadow-sm cursor-pointer"
            >
              처음 화면으로
            </button>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT ROUTING ================= */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 flex items-center justify-center">
        {/* VIEW 1: HOME SELECTION */}
        {viewMode === 'HOME' && (
          <div className="w-full max-w-4xl space-y-6 py-2">
            {/* Title & Mascot Showcase */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl text-center space-y-3 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-1">
                <BabyDragon size={160} variant="idle" className="sm:-mr-2 hover:scale-105 transition-transform" />
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 font-black text-emerald-800 text-xs font-['Jua'] tracking-wide">
                  ⚡ 100m 골인을 향해 탭하여 달려라!
                </div>
                <BabyTiger size={160} variant="idle" className="sm:-ml-2 hover:scale-105 transition-transform" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 font-['Jua'] tracking-tight">
                만날 한국어 동물 달리기 게임
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
                교사 PC 대형 화면과 학생 스마트폰이 실시간으로 연동되는 고밀도 한국어 교육 레이스 게임입니다.
              </p>
            </div>

            {createError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold rounded-2xl text-center shadow-sm">
                {createError}
              </div>
            )}

            {/* Mode Select Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Teacher Room Creation */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl flex flex-col justify-between group hover:border-emerald-300 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                    <School className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black text-emerald-950 font-['Jua']">
                      교사 (방 만들기)
                    </h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      HOST DASHBOARD
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    프로젝터나 PC에 100m 동물 달리기 트랙과 입장 QR 코드를 띄우고 실시간 경기를 진행합니다.
                  </p>

                  <div className="mb-6 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">
                      진행 모드 선택
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        id="select-sync-mode-btn"
                        type="button"
                        onClick={() => {
                          setSelectedGameMode('SYNC');
                          sound.playTap();
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          selectedGameMode === 'SYNC'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <span className="block text-sm font-black text-emerald-950 font-['Jua']">
                          모드 1: 함께 풀기
                        </span>
                        <span className="block text-[11px] font-bold text-slate-500 mt-1 leading-snug">
                          모두 같은 문제를 풀고 정답자만 함께 3초 탭
                        </span>
                      </button>
                      <button
                        id="select-solo-mode-btn"
                        type="button"
                        onClick={() => {
                          setSelectedGameMode('SOLO');
                          sound.playTap();
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          selectedGameMode === 'SOLO'
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200'
                            : 'bg-slate-50 border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        <span className="block text-sm font-black text-orange-950 font-['Jua']">
                          모드 2: 각자 달리기
                        </span>
                        <span className="block text-[11px] font-bold text-slate-500 mt-1 leading-snug">
                          학생별로 문제 진행, 정답이면 탭, 오답이면 다음 문제
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  id="create-room-btn"
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-base font-['Jua'] shadow-md hover:bg-emerald-500 border-b-4 border-emerald-800 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  {isCreatingRoom ? '방 생성 중...' : '새로운 방 만들기'}
                </button>
              </div>

              {/* Card 2: Student Join */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-xl flex flex-col justify-between group hover:border-emerald-300 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-200 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black text-slate-900 font-['Jua']">
                      학생 (참가하기)
                    </h2>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-800 uppercase">
                      MOBILE CLIENT
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    스마트폰으로 방 번호를 입력하거나 QR을 스캔하여 퀴즈를 풀고 3초 폭풍 연타를 시작합니다!
                  </p>
                </div>

                <button
                  id="student-entry-btn"
                  onClick={() => {
                    sound.playTap();
                    setViewMode('STUDENT');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-black text-base font-['Jua'] shadow-md hover:bg-orange-600 border-b-4 border-orange-700 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                  학생으로 입장하기
                </button>
              </div>
            </div>

            {/* Game Flow Step Guide */}
            <div className="bg-white rounded-2xl p-5 border-2 border-emerald-100 shadow-md text-xs text-slate-600">
              <span className="font-black text-emerald-900 font-['Jua'] text-xs uppercase tracking-widest block mb-2">
                🎮 게임 진행 순서 (GAME FLOW)
              </span>
              <div className="flex flex-wrap items-center gap-2 font-bold text-xs">
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  1. 방 생성
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  2. QR/코드 입장
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  3. 학생 1~4명
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  4. START 3-2-1
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  5. 한국어 퀴즈
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                  6. 3초 TAP
                </span>
                <span className="text-slate-300">→</span>
                <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-2xs">
                  7. 100m 승리! 🏆
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TEACHER HOST VIEW */}
        {viewMode === 'TEACHER' && createdRoom && (
          <TeacherHostView
            initialRoom={createdRoom}
            onExitHost={() => setViewMode('HOME')}
          />
        )}

        {/* VIEW 3: STUDENT VIEW */}
        {viewMode === 'STUDENT' && (
          <StudentView initialRoomId={urlRoomId} />
        )}
      </main>

      {/* Developer Test Simulator Modal (Available in Teacher mode or with ?debug=true) */}
      {createdRoom && (
        <DebugSimulator room={createdRoom} />
      )}

      {/* ================= HIGH DENSITY FOOTER ================= */}
      <footer className="h-9 bg-slate-100 border-t border-slate-200 flex items-center px-6 sm:px-8 justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
        <span>© 2026 KOREAN ANIMAL RACE - HIGH DENSITY EDUCORE</span>
        <div className="flex gap-4 sm:gap-6 font-mono">
          <span className="hidden sm:inline">ENGINE: REALTIME_SSE_01</span>
          <span>PLAYER_CAP: 4</span>
        </div>
      </footer>
    </div>
  );
}
