import React from 'react';
import { BabyDragon } from './characters/BabyDragon';
import { BabyTiger } from './characters/BabyTiger';
import { RoomState, Player } from '../types/game';
import { Flag, Sparkles, Trophy } from 'lucide-react';

interface RaceTrackProps {
  room: RoomState;
  isHostView?: boolean;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ room, isHostView = false }) => {
  const distA = Math.min(100, Math.max(0, room.teamScores.A.distance));
  const distB = Math.min(100, Math.max(0, room.teamScores.B.distance));

  const playersList = Object.values(room.players || {}) as Player[];
  const playersA = playersList.filter((p) => p.team === 'A');
  const playersB = playersList.filter((p) => p.team === 'B');

  const isRacing = room.status === 'TAP_PHASE' || room.status === 'QUESTION' || room.status === 'ROUND_RESULT';

  return (
    <div id="race-track-container" className="w-full bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-xl relative overflow-hidden">
      {/* Track Header with Live Distance & Leader */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-200">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-emerald-950 flex items-center gap-2 font-['Jua']">
              100M LIVE RACECOURSE
              {room.winner && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-sans">
                  {room.winner === 'DRAW' ? '무승부!' : `${room.winner}팀 골인!`}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              정답 후 3초 연타로 100m 결승선에 먼저 도착하세요!
            </p>
          </div>
        </div>

        {/* Distance Indicator Badges */}
        <div className="flex items-center gap-2.5 text-xs font-mono font-black">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs">
            🐲 Dragon: {distA.toFixed(1)}m ({room.teamScores.A.taps} 탭)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 shadow-2xs">
            🐯 Tiger: {distB.toFixed(1)}m ({room.teamScores.B.taps} 탭)
          </span>
        </div>
      </div>

      {/* Distance Ruler Labels */}
      <div className="relative w-full h-6 mb-1 text-[10px] font-mono font-bold text-slate-400 pl-16 pr-12 hidden sm:block">
        <span className="absolute left-[8%] -translate-x-1/2">START (0m)</span>
        <span className="absolute left-[31%] -translate-x-1/2">25m</span>
        <span className="absolute left-[54%] -translate-x-1/2">50m</span>
        <span className="absolute left-[77%] -translate-x-1/2">75m</span>
        <span className="absolute right-0 text-rose-500 font-black flex items-center gap-1">
          <Flag className="w-3.5 h-3.5" /> 100M GOAL
        </span>
      </div>

      {/* Tracks Container */}
      <div className="space-y-4">
        {/* ================= LANE A : DRAGON ================= */}
        <div className="relative bg-blue-50/50 rounded-2xl p-3 border border-blue-100 overflow-hidden">
          {/* Lane Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs font-mono">
                LANE 01
              </span>
              <span className="text-sm font-bold text-blue-950 font-['Jua'] flex items-center gap-1">
                🐲 아기 용 (A팀)
              </span>
              <div className="flex items-center gap-1">
                {playersA.map((p) => (
                  <span
                    key={p.id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-900 font-bold"
                  >
                    {p.nickname} ({p.taps})
                  </span>
                ))}
                {playersA.length === 0 && (
                  <span className="text-[10px] text-slate-400 italic">참가 대기 중</span>
                )}
              </div>
            </div>
            <span className="font-mono text-xs font-black text-blue-700">
              {distA.toFixed(1)} / 100m
            </span>
          </div>

          {/* Lane Roadway */}
          <div className="relative h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center overflow-hidden px-4">
            {/* Lane watermark index */}
            <span className="absolute left-6 text-slate-200 font-black text-6xl italic select-none pointer-events-none">
              01
            </span>

            {/* Lane Milestone Dotted Markers */}
            <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none opacity-30">
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
            </div>

            {/* Finish Line Checkered Banner */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-[repeating-conic-gradient(#cbd5e1_0_90deg,#fff_90deg_180deg)] bg-[length:10px_10px] opacity-60 border-l-2 border-rose-400 flex items-center justify-center">
              <span className="text-[8px] font-black font-mono text-rose-600 rotate-90 uppercase tracking-widest">
                GOAL
              </span>
            </div>

            {/* Progress Fill Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-100/90 border-r-4 border-blue-400 transition-all duration-300 ease-out pointer-events-none"
              style={{ width: `${distA}%` }}
            />

            {/* Running Animal Character */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10 flex items-center"
              style={{
                left: `calc(12px + (${distA} * (100% - 80px) / 100))`,
              }}
            >
              {isRacing && (
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin absolute -left-4 -top-2 opacity-80" />
              )}
              <BabyDragon
                isRunning={isRacing || distA > 0}
                size={isHostView ? 64 : 54}
                className="hover:scale-110 transition-transform"
              />
            </div>
          </div>
        </div>

        {/* ================= LANE B : TIGER ================= */}
        <div className="relative bg-orange-50/50 rounded-2xl p-3 border border-orange-100 overflow-hidden">
          {/* Lane Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-orange-500 text-white font-black text-xs font-mono">
                LANE 02
              </span>
              <span className="text-sm font-bold text-orange-950 font-['Jua'] flex items-center gap-1">
                🐯 아기 호랑이 (B팀)
              </span>
              <div className="flex items-center gap-1">
                {playersB.map((p) => (
                  <span
                    key={p.id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-900 font-bold"
                  >
                    {p.nickname} ({p.taps})
                  </span>
                ))}
                {playersB.length === 0 && (
                  <span className="text-[10px] text-slate-400 italic">참가 대기 중</span>
                )}
              </div>
            </div>
            <span className="font-mono text-xs font-black text-orange-700">
              {distB.toFixed(1)} / 100m
            </span>
          </div>

          {/* Lane Roadway */}
          <div className="relative h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center overflow-hidden px-4">
            {/* Lane watermark index */}
            <span className="absolute left-6 text-slate-200 font-black text-6xl italic select-none pointer-events-none">
              02
            </span>

            {/* Lane Milestone Dotted Markers */}
            <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none opacity-30">
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
              <div className="h-full border-r border-dashed border-slate-400"></div>
            </div>

            {/* Finish Line Checkered Banner */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-[repeating-conic-gradient(#cbd5e1_0_90deg,#fff_90deg_180deg)] bg-[length:10px_10px] opacity-60 border-l-2 border-rose-400 flex items-center justify-center">
              <span className="text-[8px] font-black font-mono text-rose-600 rotate-90 uppercase tracking-widest">
                GOAL
              </span>
            </div>

            {/* Progress Fill Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-orange-100/90 border-r-4 border-orange-400 transition-all duration-300 ease-out pointer-events-none"
              style={{ width: `${distB}%` }}
            />

            {/* Running Animal Character */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10 flex items-center"
              style={{
                left: `calc(12px + (${distB} * (100% - 80px) / 100))`,
              }}
            >
              {isRacing && (
                <Sparkles className="w-4 h-4 text-orange-400 animate-spin absolute -left-4 -top-2 opacity-80" />
              )}
              <BabyTiger
                isRunning={isRacing || distB > 0}
                size={isHostView ? 64 : 54}
                className="hover:scale-110 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
