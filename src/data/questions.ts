import { Question } from '../types/game';

export const KOREAN_QUESTIONS: Question[] = [
  {
    id: 1,
    category: '조사 (Particles)',
    prompt: '저는 학교___ 갑니다. (어울리는 조사는?)',
    options: ['를', '에', '은', '와'],
    correctIndex: 1, // 에
    explanation: '장소로 이동할 때는 목적지 조사 "에"를 씁니다.',
  },
  {
    id: 2,
    category: '어휘 (Vocabulary)',
    prompt: '사과 🍎 는 맛있는 ___입니다.',
    options: ['채소', '과일', '고기', '음료수'],
    correctIndex: 1, // 과일
    explanation: '사과, 배, 포도 등은 달콤한 "과일"입니다.',
  },
  {
    id: 3,
    category: '반대말 (Antonyms)',
    prompt: "'크다'의 반대말은 무엇일까요? 🐘 vs 🐭",
    options: ['작다', '넓다', '높다', '길다'],
    correctIndex: 0, // 작다
    explanation: "'크다(Big)'의 반대말은 '작다(Small)'입니다.",
  },
  {
    id: 4,
    category: '조사 (Particles)',
    prompt: '목이 마릅니다. 컵___ 물을 가득 따릅니다.',
    options: ['에', '가', '도', '로'],
    correctIndex: 0, // 에
    explanation: '그릇이나 컵에 무언가를 담을 때 "에"를 사용합니다.',
  },
  {
    id: 5,
    category: '장소 (Places)',
    prompt: '조용히 책을 읽고 빌리는 곳은 어디일까요? 📚',
    options: ['병원', '도서관', '수영장', '공항'],
    correctIndex: 1, // 도서관
    explanation: '도서관(Library)에서 책을 읽고 빌립니다.',
  },
  {
    id: 6,
    category: '음식 (Food Culture)',
    prompt: '배추와 고춧가루로 만든 한국의 대표 전통 발효 음식은? 🥬🌶️',
    options: ['김치', '피자', '파스타', '타코'],
    correctIndex: 0, // 김치
    explanation: '한국의 대표 건강 발효 음식은 "김치"입니다.',
  },
  {
    id: 7,
    category: '일상 표현 (Daily Expressions)',
    prompt: '아침이나 낮에 친구나 선생님을 만났을 때 하는 바른 인사는? ☀️',
    options: ['안녕히 주무세요', '안녕하세요', '실례합니다', '축하합니다'],
    correctIndex: 1, // 안녕하세요
    explanation: '사람을 만났을 때는 "안녕하세요"라고 인사합니다.',
  },
  {
    id: 8,
    category: '동물 어휘 (Animals)',
    prompt: '날개가 있어 푸른 하늘을 훨훨 나는 동물은? 🦅',
    options: ['호랑이', '새', '토끼', '물고기'],
    correctIndex: 1, // 새
    explanation: '날개로 하늘을 나는 동물은 "새(Bird)"입니다.',
  },
  {
    id: 9,
    category: '반대말 (Antonyms)',
    prompt: "'덥다(Hot)'의 반대말은 무엇일까요? ☀️ vs ❄️",
    options: ['춥다', '맑다', '시끄럽다', '어둡다'],
    correctIndex: 0, // 춥다
    explanation: "'덥다'의 반대말은 날씨가 쌀쌀한 '춥다(Cold)'입니다.",
  },
  {
    id: 10,
    category: '문장 완성 (Sentences)',
    prompt: '오늘 날씨가 맑아서 기분이 ___ 좋습니다! 😊',
    options: ['아주', '전혀', '아직', '결코'],
    correctIndex: 0, // 아주
    explanation: '긍정적인 강조 부사로 "아주(Very)"가 적절합니다.',
  },
];
