/**
 * OBILD 온톨로지 공통 타입 정의
 */

// 네임스페이스 정의
export const NAMESPACES = {
  curr: 'https://example.org/curriculum/social-studies#',
  gagne: 'http://example.org/il-lesson/',
  pisa: 'http://example.org/pisa#',
  read: 'http://example.org/reading#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
} as const;

// 1. 교육과정 (Curriculum)
export type ContentElementType = 'KnowledgeUnderstanding' | 'ProcessSkill' | 'ValueAttitude';

export interface ContentElement {
  uri: string;
  id: string; // e.g. "LocationTerritory"
  label: string; // e.g. "위치와 영역"
  type: ContentElementType;
  gradeBand?: string; // e.g. "중학교 1~3학년"
  areaUri: string;
}

export interface CoreIdea {
  uri: string;
  id: string;
  description: string;
  areaUri: string;
}

export interface LearningArea {
  uri: string;
  id: string; // e.g. "Politics", "Law", "SustainableWorld"
  label: string; // e.g. "정치", "법", "지속가능한 세계"
  coreIdeas: CoreIdea[];
  contentElements: ContentElement[];
  relatedAreaUris: string[];
}

export interface Competency {
  uri: string;
  id: string;
  label: string;
}

export interface SubjectCurriculum {
  uri: string;
  id: string;
  label: string;
  description: string;
  areas: LearningArea[];
  competencies: Competency[];
}

// 2. 가네 9가지 수업사태 (Gagné Instructional Events)
export interface GagnéEventTemplate {
  sequenceNumber: number;
  uri: string;
  id: string; // e.g. "event1"
  label: string; // e.g. "주의집중"
  strategyUri?: string;
  strategyLabel?: string;
  resourceUris?: string[];
  resourceLabels?: string[];
  activityUri?: string;
  activityLabel?: string;
  assessmentUri?: string;
  assessmentLabel?: string;
  exampleDescription: string;
  guideQuestion: string; // 교사용 가이드 질문
}

// 3. PISA 텍스트 분류 (Text Types)
export interface TextTypeAttribute {
  uri: string;
  id: string;
  label: string;
  category: 'SourceMaterial' | 'StructureAndNavigation' | 'Format' | 'ContentType';
  categoryLabel: string;
  description: string;
}

export interface PISATextClassification {
  sourceMaterial: string; // e.g. "단일 텍스트" (SingleText)
  structureAndNavigation: string; // e.g. "정적" (StaticText)
  format: string; // e.g. "연속적" (ContinuousText)
  contentType: string; // e.g. "설명" (Exposition)
}

// 4. 독서기능 및 독서전략 (Reading Functions & Strategies)
export interface ReadingStrategy {
  uri: string;
  id: string; // e.g. "Strat_KWL"
  label: string; // e.g. "KWL"
  functionUris: string[];
  functionLabels: string[];
  description?: string;
}

export interface ReadingFunction {
  uri: string;
  id: string; // e.g. "Func_Understanding"
  label: string; // e.g. "이해"
  verbs: string[]; // e.g. ["이해하다", "파악하다"]
  strategies: ReadingStrategy[];
}

// 5. 수업지도안 (Lesson Plan)
export interface GagnéEventPlan {
  sequence: number; // 1 ~ 9
  label: string; // "주의집중" 등
  strategy: string; // 적용 전략
  activity: string; // 학생 활동
  resource: string; // 학습 자료/매체
  description: string; // 구체적 교수·학습 내용
}

export interface ReadingMaterial {
  title: string;
  body: string;
  grade: string; // e.g. "중1", "중2", "중3"
  textType: {
    source: string;
    structure: string;
    format: string;
    content: string; // e.g. "Exposition" / "설명"
  };
  generatedBy: 'gemini-2.0-flash' | 'offline-template-generator';
  generatedAt: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  subjectName: string;
  learningAreaUri: string;
  learningAreaLabel: string;
  selectedContentElements: ContentElement[];
  coreIdeaDescription: string;
  achievementStandards: string;
  targetGrade: string; // "중학교 1학년" 등
  readingMaterial: ReadingMaterial;
  selectedStrategies: ReadingStrategy[];
  gagneEvents: GagnéEventPlan[];
  createdAt: string;
  updatedAt: string;
  isBookmarked?: boolean;
}

// 6. 사용자 및 인증
export type UserRole = 'admin' | 'teacher';

export interface UserProfile {
  uid: string;
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  approved: boolean;
  school: string;
  createdAt: string;
  lastLoginAt: string;
}

// 7. 매핑 규칙
export interface MappingRules {
  contentElementToTextType: Record<ContentElementType, string[]>;
  textTypeToReadingFunction: Record<string, string[]>;
}
