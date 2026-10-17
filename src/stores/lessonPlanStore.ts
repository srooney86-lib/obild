import { create } from 'zustand';
import {
  ContentElement,
  GagnéEventPlan,
  LearningArea,
  LessonPlan,
  ReadingMaterial,
  ReadingStrategy,
} from '@/lib/ontology/types';

interface LessonPlanState {
  // 워크플로우 진행 단계 (1 ~ 5)
  currentStep: number;
  setStep: (step: number) => void;

  // 1단계: 교육과정 선택
  selectedArea: LearningArea | null;
  selectedElements: ContentElement[];
  targetGrade: string;
  setSelectedArea: (area: LearningArea | null) => void;
  toggleElement: (element: ContentElement) => void;
  setTargetGrade: (grade: string) => void;

  // 2단계: 읽기자료 생성
  minLen: number;
  maxLen: number;
  selectedFormat: string; // '연속적' | '비연속적' | '혼합적'
  selectedContentType: string; // 'Exposition' | 'Argumentation' ...
  readingMaterial: ReadingMaterial | null;
  isGeneratingMaterial: boolean;
  setLengthRange: (min: number, max: number) => void;
  setSelectedFormat: (format: string) => void;
  setSelectedContentType: (type: string) => void;
  setReadingMaterial: (mat: ReadingMaterial | null) => void;
  setIsGeneratingMaterial: (generating: boolean) => void;
  updateReadingMaterialText: (title: string, body: string) => void;

  // 3단계: 독서전략 선택 (1~3개)
  selectedStrategies: ReadingStrategy[];
  toggleStrategy: (strategy: ReadingStrategy) => void;
  setSelectedStrategies: (strats: ReadingStrategy[]) => void;

  // 4단계: 가네 9사태 지도안
  gagneEvents: GagnéEventPlan[];
  setGagneEvents: (events: GagnéEventPlan[]) => void;
  updateGagneEvent: (sequence: number, field: keyof GagnéEventPlan, value: string) => void;

  // 5단계: 저장된 수업지도안 및 관리
  savedPlans: LessonPlan[];
  activePlan: LessonPlan | null;
  saveCurrentPlan: () => LessonPlan;
  deleteSavedPlan: (id: string) => void;
  toggleBookmark: (id: string) => void;
  loadPlan: (plan: LessonPlan) => void;
  resetWizard: () => void;
}

const DEFAULT_GAGNE_EVENTS: GagnéEventPlan[] = [
  { sequence: 1, label: '주의집중', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 2, label: '학습목표 제시', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 3, label: '선수학습 능력 재생', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 4, label: '학습자료 제시', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 5, label: '학습 지침 제공', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 6, label: '학생 수행 요구', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 7, label: '피드백 제공', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 8, label: '성취 행동 평가', strategy: '', activity: '', resource: '', description: '' },
  { sequence: 9, label: '파지와 전이', strategy: '', activity: '', resource: '', description: '' },
];

export const useLessonPlanStore = create<LessonPlanState>((set, get) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),

  // 1단계
  selectedArea: null,
  selectedElements: [],
  targetGrade: '중학교 2학년',
  setSelectedArea: (area) => set({ selectedArea: area, selectedElements: [] }),
  toggleElement: (element) =>
    set((state) => {
      const exists = state.selectedElements.some((e) => e.uri === element.uri);
      return {
        selectedElements: exists
          ? state.selectedElements.filter((e) => e.uri !== element.uri)
          : [...state.selectedElements, element],
      };
    }),
  setTargetGrade: (grade) => set({ targetGrade: grade }),

  // 2단계
  minLen: 400,
  maxLen: 700,
  selectedFormat: '연속적',
  selectedContentType: 'Exposition',
  readingMaterial: null,
  isGeneratingMaterial: false,
  setLengthRange: (min, max) => set({ minLen: min, maxLen: max }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setSelectedContentType: (type) => set({ selectedContentType: type }),
  setReadingMaterial: (mat) => set({ readingMaterial: mat }),
  setIsGeneratingMaterial: (generating) => set({ isGeneratingMaterial: generating }),
  updateReadingMaterialText: (title, body) =>
    set((state) => ({
      readingMaterial: state.readingMaterial
        ? { ...state.readingMaterial, title, body }
        : null,
    })),

  // 3단계
  selectedStrategies: [],
  toggleStrategy: (strategy) =>
    set((state) => {
      const exists = state.selectedStrategies.some((s) => s.id === strategy.id);
      if (exists) {
        return { selectedStrategies: state.selectedStrategies.filter((s) => s.id !== strategy.id) };
      }
      if (state.selectedStrategies.length >= 3) {
        // 최대 3개까지 선택 가능
        return state;
      }
      return { selectedStrategies: [...state.selectedStrategies, strategy] };
    }),
  setSelectedStrategies: (strats) => set({ selectedStrategies: strats }),

  // 4단계
  gagneEvents: DEFAULT_GAGNE_EVENTS,
  setGagneEvents: (events) => set({ gagneEvents: events }),
  updateGagneEvent: (sequence, field, value) =>
    set((state) => ({
      gagneEvents: state.gagneEvents.map((evt) =>
        evt.sequence === sequence ? { ...evt, [field]: value } : evt
      ),
    })),

  // 5단계 및 저장소
  savedPlans: [],
  activePlan: null,

  saveCurrentPlan: () => {
    const s = get();
    const planId = 'plan_' + Date.now();
    const topicName = s.selectedElements.map((e) => e.label).join(', ') || '사회과 수업';
    const coreDesc = s.selectedArea?.coreIdeas?.[0]?.description || '사회과 핵심 아이디어';

    const newPlan: LessonPlan = {
      id: planId,
      title: `${topicName} 교수·학습 과정안`,
      subject: 'social-studies',
      subjectName: '사회',
      learningAreaUri: s.selectedArea?.uri || '',
      learningAreaLabel: s.selectedArea?.label || '',
      selectedContentElements: s.selectedElements,
      coreIdeaDescription: coreDesc,
      achievementStandards: `${s.selectedArea?.label} 영역 관련 교육과정 성취기준`,
      targetGrade: s.targetGrade,
      readingMaterial: s.readingMaterial || {
        title: `${topicName} 읽기자료`,
        body: '기본 읽기자료 내용이 준비되지 않았습니다.',
        grade: s.targetGrade,
        textType: {
          source: 'SingleText',
          structure: 'StaticText',
          format: s.selectedFormat,
          content: s.selectedContentType,
        },
        generatedBy: 'offline-template-generator',
        generatedAt: new Date().toISOString(),
      },
      selectedStrategies: s.selectedStrategies,
      gagneEvents: s.gagneEvents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBookmarked: false,
    };

    set((state) => ({
      savedPlans: [newPlan, ...state.savedPlans],
      activePlan: newPlan,
    }));

    return newPlan;
  },

  deleteSavedPlan: (id) =>
    set((state) => ({
      savedPlans: state.savedPlans.filter((p) => p.id !== id),
    })),

  toggleBookmark: (id) =>
    set((state) => ({
      savedPlans: state.savedPlans.map((p) =>
        p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p
      ),
    })),

  loadPlan: (plan) =>
    set({
      activePlan: plan,
      targetGrade: plan.targetGrade,
      readingMaterial: plan.readingMaterial,
      selectedStrategies: plan.selectedStrategies,
      gagneEvents: plan.gagneEvents,
      currentStep: 5,
    }),

  resetWizard: () =>
    set({
      currentStep: 1,
      selectedArea: null,
      selectedElements: [],
      readingMaterial: null,
      selectedStrategies: [],
      gagneEvents: DEFAULT_GAGNE_EVENTS,
      activePlan: null,
    }),
}));
