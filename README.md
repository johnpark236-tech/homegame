# Korean Animal Race

외국인 한국어 학습자를 위한 QR 기반 실시간 팀 레이스 웹게임입니다.

교사가 방을 만들고 학생 1~4명이 휴대폰으로 참가합니다. 학생이 한국어 문제를 맞히면 3초 동안 TAP할 수 있으며, 팀 TAP 합계가 교사 화면의 동물 캐릭터 이동에 실시간 반영됩니다.

## 주요 기능

- 6자리 방 번호와 QR 입장
- 학생 1명부터 게임 시작 가능, 최대 4명
- 용 팀과 호랑이 팀, 팀당 최대 2명
- 초급 한국어 객관식 10문제
- 정답자만 3초 TAP
- SSE 기반 실시간 경기 상태 동기화
- 팀 점수 합산, 100m 거리 계산, 승자 판정
- 참가자와 팀을 유지하는 다시하기
- 교사용 화면, 학생용 모바일 화면, 디버그 시뮬레이터
- 귀여운 SVG 동물 캐릭터와 애니메이션

## 기술 구조

- React 19 + TypeScript + Vite
- Express API 서버
- Server-Sent Events(SSE) 실시간 동기화
- 서버 메모리 기반 방 상태 관리

현재 방 데이터는 서버 메모리에 저장되므로 서버가 재시작되면 초기화됩니다. 여러 서버 인스턴스 사이에서 상태가 공유되지 않으므로 MVP 배포 시 서버 인스턴스는 1개로 설정해야 합니다.

## 로컬 실행

Node.js 20 이상을 권장합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 검사 및 프로덕션 빌드

```bash
npm run lint
npm run build
npm start
```

## 배포 주의사항

이 버전은 `/api/rooms/...` Express API와 SSE 연결을 사용하므로 정적 GitHub Pages만으로 실행할 수 없습니다. GitHub는 소스 관리에 사용하고, 실제 서비스는 Node.js 서버를 실행할 수 있는 Cloud Run 등의 환경에 배포해야 합니다.

## AI Studio 원본

https://ai.studio/apps/899bd3f4-62ed-467a-a813-6850eea4887b
