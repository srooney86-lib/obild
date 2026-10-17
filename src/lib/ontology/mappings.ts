import { ContentElementType, MappingRules } from './types';

/**
 * LIS 가이드 4.3절 표준 매핑 규칙
 */

// 1. ContentElement 서브클래스 → PISA ContentType 1차 매핑
export const DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE: Record<ContentElementType, string[]> = {
  KnowledgeUnderstanding: ['Exposition', 'Description'], // 지식·이해 -> 설명, 기술
  ProcessSkill: ['Instruction', 'Exposition'],            // 과정·기능 -> 지시, 설명
  ValueAttitude: ['Argumentation', 'Narration'],          // 가치·태도 -> 논증, 서사
};

// 2. PISA ContentType → ReadingFunction 매핑 (복수 매핑)
export const DEFAULT_TEXT_TYPE_TO_READING_FUNCTION: Record<string, string[]> = {
  Description: ['Func_Understanding', 'Func_Analysis'],
  Narration: ['Func_Understanding', 'Func_Relation', 'Func_Expression'],
  Exposition: ['Func_Understanding', 'Func_Analysis', 'Func_Synthesis'],
  Argumentation: ['Func_Inference', 'Func_Evaluation', 'Func_Comparison'],
  Instruction: ['Func_Understanding', 'Func_Application'],
  Transaction: ['Func_Expression', 'Func_Application'],
};

// 가네 9사태별 독서전략 권장 배치 가이드
export const STRATEGY_TO_GAGNE_EVENT_MAPPING: Record<string, number[]> = {
  // 탐색/예측/질문 -> 1단계(주의집중), 2단계(학습목표), 3단계(선수학습)
  KWL: [2, 3],
  SQ3R: [1, 4],
  미리보기: [1, 3],
  앙케이트_질문표: [1, 2],
  어휘_예상하기: [3, 4],
  사진_속으로: [1, 3],
  상상_속으로: [1, 6],
  
  // 이해/분석/구조화 -> 4단계(자료제시), 5단계(학습지침)
  밑줄_긋기: [4, 5, 6],
  개념_정의_지도그리기: [4, 5],
  생각_그물: [4, 5],
  의미지도_그리기: [4, 5],
  글_구조_전략: [4, 5],
  단어의_나무: [4, 5],
  피라미드_다이어그램: [4, 5],
  벤다이어그램: [5, 6],
  대조표: [5, 6],
  
  // 수행/피드백/평가/전이 -> 6단계(수행), 7단계(피드백), 8단계(평가), 9단계(전이)
  요약하기: [6, 8],
  자석_요약하기: [6, 8],
  질문의_답은_어디에_QAR: [5, 6, 8],
  참_거짓_가리기: [6, 8],
  오류_찾기: [6, 8],
  RAFT: [6, 9],
  복식_기재_일지: [6, 7, 9],
  다시_이야기하기: [6, 9],
  인물_따라하기: [6, 9],
  수학책을_읽는_열쇠: [5, 6, 9],
};

// PISA ContentType 영문 키 -> 한글 라벨 매핑
export const PISA_CONTENT_TYPE_LABELS: Record<string, string> = {
  Description: '기술 (Description)',
  Narration: '서사 (Narration)',
  Exposition: '설명 (Exposition)',
  Argumentation: '논증 (Argumentation)',
  Instruction: '지시 (Instruction)',
  Transaction: '교섭 (Transaction)',
};

// 가네 9사태 기본 메타데이터
export const GAGNE_EVENT_META = [
  { sequence: 1, label: '주의집중', guideQuestion: '학습자의 주의를 환기하고 동기를 유발하기 위해 어떤 매체나 질문을 사용할까요?' },
  { sequence: 2, label: '학습목표 제시', guideQuestion: '이번 차시에서 학생들이 도달해야 할 핵심 성취기준과 목표를 어떻게 명시할까요?' },
  { sequence: 3, label: '선수학습 능력 재생', guideQuestion: '본 학습과 연계되는 이전 차시 개념이나 학생들의 배경지식을 어떻게 상기시킬까요?' },
  { sequence: 4, label: '학습자료 제시', guideQuestion: '핵심 내용이 담긴 읽기자료나 도표·사례를 어떤 순서와 방식으로 제시할까요?' },
  { sequence: 5, label: '학습 지침 제공', guideQuestion: '선택한 독서전략(그래픽 조직자, 힌트 등)을 적용하여 읽기 과정을 어떻게 안내할까요?' },
  { sequence: 6, label: '학생 수행 요구', guideQuestion: '학생들이 자료를 읽고 직접 활동지 작성, 토의, 요약 등 능동적 수행을 하도록 무엇을 요구할까요?' },
  { sequence: 7, label: '피드백 제공', guideQuestion: '학생들의 활동 결과에 대해 교사 또는 동료가 어떤 피드백과 교정 단서를 제공할까요?' },
  { sequence: 8, label: '성취 행동 평가', guideQuestion: '학습목표 도달 여부를 확인하기 위해 어떤 형성평가나 수행 과제를 적용할까요?' },
  { sequence: 9, label: '파지와 전이', guideQuestion: '배운 내용을 기억에 정착시키고 실생활이나 다른 교과 영역에 어떻게 전이·적용할까요?' },
];
