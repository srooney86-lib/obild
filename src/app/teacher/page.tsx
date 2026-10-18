'use client';

import { useEffect, useState } from 'react';
import {
  SubjectCurriculum,
  LearningArea,
  ContentElement,
  GagnéEventTemplate,
  ReadingFunction,
  ReadingStrategy,
} from '@/lib/ontology/types';
import {
  getSocialStudiesCurriculum,
  getGagnéEvents,
  getReadingFunctionsAndStrategies,
} from '@/lib/ontology/queries';
import {
  inferTextTypesForContentElements,
  inferReadingFunctionsForTextType,
  recommendStrategiesForFunctions,
  slotStrategiesIntoGagneEvents,
} from '@/lib/ontology/inference';
import { PISA_CONTENT_TYPE_LABELS } from '@/lib/ontology/mappings';
import { useLessonPlanStore } from '@/stores/lessonPlanStore';
import { useAuthStore } from '@/stores/authStore';
import { exportLessonPlanToPdf, printLessonPlan } from '@/lib/export/pdf';
import { generateReadingMaterial, generateGagneStepDraft } from '@/lib/llm/generator';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Download,
  Printer,
  Save,
  RotateCcw,
  Sliders,
  Layers,
  FileText,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  Eye,
  Info,
  Check,
} from 'lucide-react';

export default function TeacherPortalPage() {
  const { currentUser } = useAuthStore();
  const store = useLessonPlanStore();

  const [curriculum, setCurriculum] = useState<SubjectCurriculum | null>(null);
  const [gagneTemplates, setGagneTemplates] = useState<GagnéEventTemplate[]>([]);
  const [allReadingFunctions, setAllReadingFunctions] = useState<ReadingFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [strategyDetailModal, setStrategyDetailModal] = useState<ReadingStrategy | null>(null);

  // 온톨로지 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const [curr, gagne, readFns] = await Promise.all([
          getSocialStudiesCurriculum(),
          getGagnéEvents(),
          getReadingFunctionsAndStrategies(),
        ]);
        setCurriculum(curr);
        setGagneTemplates(gagne);
        setAllReadingFunctions(readFns);

        // 기본 영역 설정 (정치 또는 첫 번째 영역)
        if (!store.selectedArea && curr.areas.length > 0) {
          const politics = curr.areas.find((a) => a.id === 'Politics') || curr.areas[0];
          store.setSelectedArea(politics);
          if (politics.contentElements.length > 0) {
            store.toggleElement(politics.contentElements[0]);
          }
        }
      } catch (err) {
        console.error('온톨로지 데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 1단계 -> 2단계 진입 시 자동 추론
  const handleProceedToStep2 = () => {
    if (store.selectedElements.length === 0) {
      alert('하나 이상의 내용 요소를 선택해 주세요.');
      return;
    }
    const inferredTypes = inferTextTypesForContentElements(store.selectedElements);
    if (inferredTypes.length > 0) {
      store.setSelectedContentType(inferredTypes[0]);
    }
    store.setStep(2);
  };

  // 2단계: 읽기자료 생성
  const handleGenerateReadingMaterial = async () => {
    if (store.selectedElements.length === 0) return;
    store.setIsGeneratingMaterial(true);

    try {
      const topic = store.selectedElements.map((e) => e.label).join(', ');
      const coreIdea = store.selectedArea?.coreIdeas?.[0]?.description || '사회 현상의 이해와 탐구';

      const data = await generateReadingMaterial({
        topic,
        coreIdea,
        grade: store.targetGrade,
        minLen: store.minLen,
        maxLen: store.maxLen,
        format: store.selectedFormat,
        contentType: store.selectedContentType,
      });

      store.setReadingMaterial({
        title: data.title,
        body: data.body,
        grade: store.targetGrade,
        textType: {
          source: 'SingleText',
          structure: 'StaticText',
          format: store.selectedFormat,
          content: store.selectedContentType,
        },
        generatedBy: data.generatedBy,
        generatedAt: data.generatedAt,
      });
    } catch (e) {
      console.error('자료 생성 실패:', e);
    } finally {
      store.setIsGeneratingMaterial(false);
    }
  };

  // 2단계 -> 3단계 진입 시 독서전략 추천 세팅
  const handleProceedToStep3 = async () => {
    if (!store.readingMaterial) {
      await handleGenerateReadingMaterial();
    }
    store.setStep(3);
  };

  // 3단계 추천 독서전략 계산
  const currentInferredFunctionIds = inferReadingFunctionsForTextType(store.selectedContentType);
  const recommendedStrategies = recommendStrategiesForFunctions(
    currentInferredFunctionIds,
    allReadingFunctions
  );

  // 3단계 -> 4단계 진입 시 가네 9사태 자동 슬롯팅
  const handleProceedToStep4 = () => {
    if (store.selectedStrategies.length === 0) {
      // 기본 1개 자동 선택
      if (recommendedStrategies.length > 0) {
        store.setSelectedStrategies([recommendedStrategies[0]]);
      }
    }

    const topicTitle = store.selectedElements.map((e) => e.label).join(', ') || '사회과 수업';
    const summary = store.readingMaterial?.body ? store.readingMaterial.body.slice(0, 100) : '';

    const slottedEvents = slotStrategiesIntoGagneEvents(
      gagneTemplates,
      store.selectedStrategies.length > 0 ? store.selectedStrategies : [recommendedStrategies[0]],
      topicTitle,
      summary
    );

    store.setGagneEvents(slottedEvents);
    store.setStep(4);
  };

  // 4단계 단계별 초안 생성
  const handleRegenerateGagneStep = async (seq: number, label: string) => {
    const topic = store.selectedElements.map((e) => e.label).join(', ') || '사회과 수업';
    const strategy = store.selectedStrategies[0]?.label || '독서전략';

    try {
      const draft = generateGagneStepDraft(seq, label, topic, strategy);
      store.updateGagneEvent(seq, 'description', draft);
    } catch (e) {
      console.error('사태 초안 생성 실패:', e);
    }
  };

  if (isLoading || !curriculum) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">온톨로지 지식베이스(TTL) 로드 및 파싱 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 상단 스텝 프로그레스 바 (1~5) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs md:text-sm font-medium">
          {[
            { num: 1, title: '교육과정 탐색' },
            { num: 2, title: '읽기자료 생성' },
            { num: 3, title: '독서전략 추천' },
            { num: 4, title: '가네 지도안 작성' },
            { num: 5, title: '미리보기 & 출력' },
          ].map((s) => {
            const isCurrent = store.currentStep === s.num;
            const isCompleted = store.currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => store.setStep(s.num)}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                  isCurrent
                    ? 'text-primary font-bold bg-blue-50'
                    : isCompleted
                    ? 'text-emerald-700 hover:bg-slate-50'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-primary text-white shadow'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1단계: 교육과정 탐색기 (Curriculum Browser) */}
      {/* ==================================================== */}
      {store.currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 좌측: 11개 영역 트리 */}
          <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                사회과 내용 영역 (11개)
              </h3>
              <span className="text-[11px] text-slate-400">2022 개정</span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {curriculum.areas.map((area) => {
                const isSelected = store.selectedArea?.uri === area.uri;
                return (
                  <button
                    key={area.uri}
                    type="button"
                    onClick={() => store.setSelectedArea(area)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-white font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    <span>{area.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {area.contentElements.length}개 요소
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측: 핵심 아이디어 및 내용 요소 선택 */}
          <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            {store.selectedArea ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">선택 영역</span>
                    <h2 className="text-xl font-bold text-slate-900">{store.selectedArea.label}</h2>
                  </div>

                  {/* 대상 학년 선택 */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">대상 학년:</span>
                    <select
                      value={store.targetGrade}
                      onChange={(e) => store.setTargetGrade(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="중학교 1학년">중학교 1학년</option>
                      <option value="중학교 2학년">중학교 2학년</option>
                      <option value="중학교 3학년">중학교 3학년</option>
                    </select>
                  </div>
                </div>

                {/* 핵심 아이디어 */}
                {store.selectedArea.coreIdeas.length > 0 && (
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-1">
                    <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      핵심 아이디어 (Core Idea)
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {store.selectedArea.coreIdeas[0].description}
                    </p>
                  </div>
                )}

                {/* 내용 요소 목록 (다중 선택 가능) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      수업에 포함할 내용 요소 선택 (복수 선택 가능)
                    </label>
                    <span className="text-xs text-slate-500">
                      선택됨: <strong className="text-primary">{store.selectedElements.length}</strong>개
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {store.selectedArea.contentElements.map((elem) => {
                      const isChecked = store.selectedElements.some((e) => e.uri === elem.uri);

                      let badgeColor = 'bg-blue-100 text-blue-700';
                      let typeLabel = '지식·이해';
                      if (elem.type === 'ProcessSkill') {
                        badgeColor = 'bg-emerald-100 text-emerald-700';
                        typeLabel = '과정·기능';
                      } else if (elem.type === 'ValueAttitude') {
                        badgeColor = 'bg-amber-100 text-amber-700';
                        typeLabel = '가치·태도';
                      }

                      return (
                        <div
                          key={elem.uri}
                          onClick={() => store.toggleElement(elem)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isChecked
                              ? 'bg-blue-50/50 border-primary ring-1 ring-primary'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                {typeLabel}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 truncate">{elem.label}</h4>
                            {elem.gradeBand && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{elem.gradeBand}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 다음 버튼 */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    disabled={store.selectedElements.length === 0}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
                  >
                    다음: 읽기자료 생성
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">좌측에서 내용 영역을 선택해 주세요.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2단계: 읽기자료 생성기 (Reading Material Generator) */}
      {/* ==================================================== */}
      {store.currentStep === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 좌측 옵션 설정 패널 */}
          <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                읽기자료 생성 옵션
              </h3>
              <p className="text-xs text-slate-500 mt-1">내용요소 및 PISA 텍스트 체재에 맞춰 튜닝합니다.</p>
            </div>

            {/* 선택된 내용 요소 요약 */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">선택된 주제</span>
              <div className="font-bold text-slate-800">
                {store.selectedElements.map((e) => e.label).join(', ')}
              </div>
            </div>

            {/* 글자 수 슬라이더 (300 ~ 800자) */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">목표 글자 수</span>
                <span className="font-bold text-primary">{store.minLen} ~ {store.maxLen}자</span>
              </div>
              <input
                type="range"
                min="300"
                max="800"
                step="50"
                value={store.maxLen}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  store.setLengthRange(Math.max(250, val - 300), val);
                }}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>300자 (간결)</span>
                <span>550자 (표준)</span>
                <span>800자 (상세)</span>
              </div>
            </div>

            {/* 텍스트 체재 (연속 / 비연속 / 혼합) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">텍스트 체재 (PISA Format)</label>
              <div className="grid grid-cols-3 gap-2">
                {['연속적', '비연속적', '혼합적'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => store.setSelectedFormat(fmt)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      store.selectedFormat === fmt
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 유형 (설명문, 논증문, 서사문, 지시문 등) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">내용 유형 (PISA ContentType)</label>
              <select
                value={store.selectedContentType}
                onChange={(e) => store.setSelectedContentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary"
              >
                <option value="Exposition">{PISA_CONTENT_TYPE_LABELS.Exposition}</option>
                <option value="Argumentation">{PISA_CONTENT_TYPE_LABELS.Argumentation}</option>
                <option value="Narration">{PISA_CONTENT_TYPE_LABELS.Narration}</option>
                <option value="Instruction">{PISA_CONTENT_TYPE_LABELS.Instruction}</option>
                <option value="Description">{PISA_CONTENT_TYPE_LABELS.Description}</option>
              </select>
            </div>

            {/* 생성 버튼 */}
            <button
              type="button"
              onClick={handleGenerateReadingMaterial}
              disabled={store.isGeneratingMaterial}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {store.isGeneratingMaterial ? '읽기자료 생성 중...' : '읽기자료 자동 생성'}
            </button>
          </div>

          {/* 우측 읽기자료 미리보기 & 편집 패널 */}
          <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-slate-900 text-sm">생성된 읽기자료 미리보기</h3>
                </div>

                {store.readingMaterial && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {store.readingMaterial.generatedBy === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : '오프라인 템플릿'}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {store.readingMaterial.body.length}자
                    </span>
                  </div>
                )}
              </div>

              {store.readingMaterial ? (
                <div className="space-y-3">
                  {/* 제목 입력 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">글 제목</label>
                    <input
                      type="text"
                      value={store.readingMaterial.title}
                      onChange={(e) =>
                        store.updateReadingMaterialText(e.target.value, store.readingMaterial!.body)
                      }
                      className="w-full mt-1 font-bold text-base text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* 본문 에디터 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      본문 내용 (직접 수정 가능)
                    </label>
                    <textarea
                      rows={12}
                      value={store.readingMaterial.body}
                      onChange={(e) =>
                        store.updateReadingMaterialText(store.readingMaterial!.title, e.target.value)
                      }
                      className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-800 font-sans focus:bg-white focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    좌측 [읽기자료 자동 생성] 버튼을 누르면 맞춤형 읽기자료가 구성됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => store.setStep(1)}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
                이전: 교육과정
              </button>

              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={!store.readingMaterial}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all"
              >
                다음: 독서전략 추천
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3단계: 독서전략 추천기 (Strategy Recommender) */}
      {/* ==================================================== */}
      {store.currentStep === 3 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">추천 엔진</span>
              <h2 className="text-xl font-bold text-slate-900">
                맞춤형 독서전략 추천 (1~3개 선택)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                생성된 자료의 내용 유형({PISA_CONTENT_TYPE_LABELS[store.selectedContentType]})에 매핑된 KNU 독서전략입니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">선택한 전략:</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-primary font-bold text-xs border border-blue-200">
                {store.selectedStrategies.length} / 3개
              </span>
            </div>
          </div>

          {/* 활성화된 독서기능 태그 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600">활성화된 핵심 독서기능:</span>
            {currentInferredFunctionIds.map((fnId) => {
              const fnObj = allReadingFunctions.find((f) => f.id === fnId);
              return (
                <span
                  key={fnId}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                >
                  {fnObj?.label || fnId}
                </span>
              );
            })}
          </div>

          {/* 전략 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendedStrategies.map((strat) => {
              const isSelected = store.selectedStrategies.some((s) => s.id === strat.id);

              return (
                <div
                  key={strat.id}
                  onClick={() => store.toggleStrategy(strat)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 border-primary ring-2 ring-primary shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {strat.functionLabels.join(', ')}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{strat.label}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      수업 중 독서 활동 및 정보 조직화에 최적화된 전략
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStrategyDetailModal(strat);
                      }}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" />
                      자세히 보기
                    </button>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> 선택됨
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => store.setStep(2)}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              이전: 읽기자료
            </button>

            <button
              type="button"
              onClick={handleProceedToStep4}
              disabled={store.selectedStrategies.length === 0}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
            >
              다음: 가네 9사태 지도안 작성
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 전략 상세 정보 모달 */}
      {strategyDetailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{strategyDetailModal.label} 전략</h3>
              <button
                type="button"
                onClick={() => setStrategyDetailModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <strong className="text-slate-900">연계 독서기능:</strong>{' '}
                {strategyDetailModal.functionLabels.join(', ')}
              </div>
              <div>
                <strong className="text-slate-900">가네 사태 권장 단계:</strong> 4단계(자료제시) ~ 6단계(수행요구)
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed text-slate-600">
                학생들이 텍스트를 읽으며 핵심 단어 간의 위계와 관계를 시각적으로 구조화하거나,
                자료의 주장과 근거를 체계적으로 분류·평가할 수 있도록 돕는 대표적인 독서 교수·학습 전략입니다.
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStrategyDetailModal(null)}
                className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4단계: 가네 9가지 수업사태 빌더 (Gagné Lesson Plan Builder) */}
      {/* ==================================================== */}
      {store.currentStep === 4 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">수업사태 슬롯팅</span>
              <h2 className="text-xl font-bold text-slate-900">가네(Gagné)의 9가지 수업사태 지도안 작성</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                선택한 독서전략({store.selectedStrategies.map((s) => s.label).join(', ')})이 최적의 사태에 자동 배치되었습니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProceedToStep4}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                기본 슬롯팅 초기화
              </button>
            </div>
          </div>

          {/* 9단계 아코디언 / 카드 목록 */}
          <div className="space-y-4">
            {store.gagneEvents.map((evt) => {
              const meta = gagneTemplates.find((t) => t.sequenceNumber === evt.sequence);

              return (
                <div
                  key={evt.sequence}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                        {evt.sequence}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{evt.label}</h4>
                      <span className="text-[11px] text-slate-400 italic">
                        ({meta?.guideQuestion})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRegenerateGagneStep(evt.sequence, evt.label)}
                      className="text-[11px] font-semibold text-primary hover:text-primary-hover bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      이 단계 초안 자동 생성
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">교수 전략</label>
                      <input
                        type="text"
                        value={evt.strategy}
                        onChange={(e) => store.updateGagneEvent(evt.sequence, 'strategy', e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">학습 자료 / 매체</label>
                      <input
                        type="text"
                        value={evt.resource}
                        onChange={(e) => store.updateGagneEvent(evt.sequence, 'resource', e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">학생 학습 활동</label>
                      <input
                        type="text"
                        value={evt.activity}
                        onChange={(e) => store.updateGagneEvent(evt.sequence, 'activity', e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">구체적 교수·학습 내용 서술</label>
                    <textarea
                      rows={2}
                      value={evt.description}
                      onChange={(e) => store.updateGagneEvent(evt.sequence, 'description', e.target.value)}
                      className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => store.setStep(3)}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              이전: 독서전략
            </button>

            <button
              type="button"
              onClick={() => store.setStep(5)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
            >
              다음: 완성 지도안 미리보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5단계: 수업지도안 미리보기 & 내보내기 (Preview & Export) */}
      {/* ==================================================== */}
      {store.currentStep === 5 && (
        <div className="space-y-6">
          {/* 상단 액션 툴바 (인쇄 시 숨김) */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">수업지도안이 성공적으로 완성되었습니다!</h3>
                <p className="text-xs text-slate-500">학교 표준 서식으로 인쇄하거나 PDF로 저장할 수 있습니다.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  store.saveCurrentPlan();
                  alert('수업지도안이 로컬 저장소에 저장되었습니다.');
                }}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                지도안 저장
              </button>

              <button
                type="button"
                onClick={printLessonPlan}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                인쇄 다이얼로그
              </button>

              <button
                type="button"
                onClick={() => exportLessonPlanToPdf('lesson-plan-document', `${store.selectedElements[0]?.label || '수업'}지도안.pdf`)}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                PDF 다운로드
              </button>

              <button
                type="button"
                onClick={store.resetWizard}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium px-2 py-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                새로 작성
              </button>
            </div>
          </div>

          {/* 학교 공문 서식 수업지도안 문서 (인쇄 영역) */}
          <div
            id="lesson-plan-document"
            className="print-container bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-lg text-slate-900 space-y-6"
          >
            {/* 문서 헤더 */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <div className="text-xs tracking-widest text-slate-500">2022 개정 교육과정 기반</div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                사회과 교수·학습 과정안 (수업지도안)
              </h1>
            </div>

            {/* 기본 개요 표 */}
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center w-24">교과</th>
                  <td className="border border-slate-400 p-2">사회 (중학교)</td>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center w-24">내용 영역</th>
                  <td className="border border-slate-400 p-2 font-semibold">{store.selectedArea?.label}</td>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center w-24">대상</th>
                  <td className="border border-slate-400 p-2">{store.targetGrade}</td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center">내용 요소</th>
                  <td colSpan={3} className="border border-slate-400 p-2 font-semibold">
                    {store.selectedElements.map((e) => e.label).join(', ')}
                  </td>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center">지도 교사</th>
                  <td className="border border-slate-400 p-2">{currentUser.displayName}</td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center">핵심 아이디어</th>
                  <td colSpan={5} className="border border-slate-400 p-2 text-slate-700">
                    {store.selectedArea?.coreIdeas?.[0]?.description || '사회 현상을 비판적으로 분석하고 합리적으로 참여한다.'}
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-400 bg-slate-100 p-2 text-center">적용 독서전략</th>
                  <td colSpan={5} className="border border-slate-400 p-2 font-semibold text-primary">
                    {store.selectedStrategies.map((s) => s.label).join(', ') || '밑줄 긋기, 요약하기'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 읽기자료 첨부 섹션 */}
            {store.readingMaterial && (
              <div className="space-y-2 border border-slate-300 p-4 rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    [수업 활용 읽기자료] {store.readingMaterial.title}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    체재: {store.selectedFormat} | 유형: {PISA_CONTENT_TYPE_LABELS[store.selectedContentType]}
                  </span>
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans pt-1">
                  {store.readingMaterial.body}
                </div>
              </div>
            )}

            {/* 가네 9사태 교수·학습 과정 표 */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-900">[본시 교수·학습 과정 (가네의 9사태)]</h3>
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 p-2 text-center w-12">단계</th>
                    <th className="border border-slate-400 p-2 text-center w-28">수업사태</th>
                    <th className="border border-slate-400 p-2 text-center w-36">교수 전략</th>
                    <th className="border border-slate-400 p-2 text-center">교수·학습 활동 내용</th>
                    <th className="border border-slate-400 p-2 text-center w-36">자료 및 유의점</th>
                  </tr>
                </thead>
                <tbody>
                  {store.gagneEvents.map((evt) => (
                    <tr key={evt.sequence} className="align-top">
                      <td className="border border-slate-400 p-2 text-center font-bold text-slate-600">
                        {evt.sequence}
                      </td>
                      <td className="border border-slate-400 p-2 font-bold text-slate-900">
                        {evt.label}
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-700">
                        {evt.strategy}
                      </td>
                      <td className="border border-slate-400 p-2 space-y-1">
                        <div className="font-medium text-slate-900">• {evt.activity}</div>
                        <div className="text-slate-600 leading-snug">{evt.description}</div>
                      </td>
                      <td className="border border-slate-400 p-2 text-slate-600">
                        {evt.resource}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 서명란 */}
            <div className="pt-6 text-right text-xs text-slate-600 space-y-1">
              <p>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-semibold">{currentUser.school} 지도교사: {currentUser.displayName} (인)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
