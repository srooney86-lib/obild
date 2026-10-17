import {
  ContentElement,
  ContentElementType,
  GagnéEventPlan,
  GagnéEventTemplate,
  ReadingFunction,
  ReadingStrategy,
} from './types';
import {
  DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE,
  DEFAULT_TEXT_TYPE_TO_READING_FUNCTION,
  STRATEGY_TO_GAGNE_EVENT_MAPPING,
} from './mappings';

/**
 * 1. 선택된 내용 요소(ContentElement)들의 유형에 따라 적합한 PISA ContentType을 추론합니다.
 */
export function inferTextTypesForContentElements(
  elements: ContentElement[],
  customMapping?: Record<ContentElementType, string[]>
): string[] {
  const mapping = customMapping || DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE;
  const inferredTypes = new Set<string>();

  for (const el of elements) {
    const types = mapping[el.type] || [];
    for (const t of types) {
      inferredTypes.add(t);
    }
  }

  // 기본값 fallback
  if (inferredTypes.size === 0) {
    return ['Exposition', 'Description'];
  }

  return Array.from(inferredTypes);
}

/**
 * 2. PISA ContentType에 대응하는 KNU ReadingFunction ID 목록을 추론합니다.
 */
export function inferReadingFunctionsForTextType(
  contentType: string,
  customMapping?: Record<string, string[]>
): string[] {
  const mapping = customMapping || DEFAULT_TEXT_TYPE_TO_READING_FUNCTION;
  const fns = mapping[contentType] || ['Func_Understanding', 'Func_Analysis'];
  return Array.from(new Set(fns));
}

/**
 * 3. 추론된 독서기능에 매핑되는 독서전략들을 추천합니다.
 */
export function recommendStrategiesForFunctions(
  functionIds: string[],
  allFunctions: ReadingFunction[]
): ReadingStrategy[] {
  const strategyMap = new Map<string, ReadingStrategy>();

  for (const fnId of functionIds) {
    const foundFn = allFunctions.find((f) => f.id === fnId || f.uri.includes(fnId));
    if (foundFn) {
      for (const strat of foundFn.strategies) {
        if (!strategyMap.has(strat.id)) {
          strategyMap.set(strat.id, {
            ...strat,
            functionUris: [foundFn.uri],
            functionLabels: [foundFn.label],
          });
        } else {
          const existing = strategyMap.get(strat.id)!;
          if (!existing.functionLabels.includes(foundFn.label)) {
            existing.functionLabels.push(foundFn.label);
            existing.functionUris.push(foundFn.uri);
          }
        }
      }
    }
  }

  return Array.from(strategyMap.values());
}

/**
 * 4. 선택한 독서전략 및 읽기자료를 가네의 9가지 수업사태 템플릿에 자동 슬롯팅(Slotting)합니다.
 */
export function slotStrategiesIntoGagneEvents(
  templates: GagnéEventTemplate[],
  selectedStrategies: ReadingStrategy[],
  topicTitle: string,
  readingMaterialSummary: string
): GagnéEventPlan[] {
  const strategyNames = selectedStrategies.map((s) => s.label);
  const primaryStrategy = strategyNames[0] || '밑줄 긋기';
  const secondaryStrategy = strategyNames[1] || strategyNames[0] || '요약하기';

  return templates.map((tmpl) => {
    const seq = tmpl.sequenceNumber;

    let strategyText = tmpl.strategyLabel || '';
    let activityText = tmpl.activityLabel || '';
    let resourceText = (tmpl.resourceLabels && tmpl.resourceLabels.length > 0)
      ? tmpl.resourceLabels.join(', ')
      : '교과 활동지, PPT';
    let descriptionText = tmpl.exampleDescription || '';

    // 단계별 맞춤형 자동 슬롯팅 로직
    switch (seq) {
      case 1: // 주의집중
        strategyText = '시각 자료 및 핵심 발문을 통한 호기심 유발';
        resourceText = '관련 뉴스 영상 클립, 시각 자료 PPT';
        activityText = '도입 질문에 대한 자유 발언 및 흥미 집중';
        descriptionText = `'${topicTitle}'과 관련된 실생활 사례나 흥미로운 질문을 제시하여 학생들의 주의를 집중시키고 탐구 의욕을 자극한다.`;
        break;

      case 2: // 학습목표 제시
        strategyText = '학습 목표 명시 및 활동 흐름 안내';
        resourceText = '학습목표 안내 슬라이드';
        activityText = '성취기준 및 학습목표 함께 읽고 확인하기';
        descriptionText = `'${topicTitle}'의 핵심 개념을 이해하고, '${primaryStrategy}' 전략을 활용하여 읽기자료를 분석·정리할 수 있음을 안내한다.`;
        break;

      case 3: // 선수학습 재생
        strategyText = '선수 지식 활성화 및 배경지식 연결';
        resourceText = '진단 질문지, 모둠 보드';
        activityText = '이전 학습 개념 브레인스토밍 및 짝과 공유';
        descriptionText = `이전 차시에서 학습한 내용과 학생들의 일상 경험을 연결하여, '${topicTitle}' 탐구에 필요한 기초 지식을 점검한다.`;
        break;

      case 4: // 학습자료 제시
        strategyText = '구조화된 읽기자료 및 핵심 개념 순차 제시';
        resourceText = `생성된 읽기자료 ('${topicTitle}'), 텍스트 활동지`;
        activityText = '읽기자료 개별 묵독 및 핵심 어휘 확인';
        descriptionText = `배포된 읽기자료를 단계별로 훑어보고 문단별 중심 내용을 파악하도록 안내한다. (${readingMaterialSummary.slice(0, 50)}...)`;
        break;

      case 5: // 학습 지침 제공
        strategyText = `'${primaryStrategy}' 독서전략 안내 및 그래픽 조직자 제공`;
        resourceText = `${primaryStrategy} 활동지, 사고 촉진 안내문`;
        activityText = '독서전략 적용 절차 이해 및 단계별 안내 확인';
        descriptionText = `학생들이 읽기자료를 효과적으로 분석할 수 있도록 '${primaryStrategy}'의 적용 절차를 시범 보이고, 힌트와 그래픽 조직자를 제공한다.`;
        break;

      case 6: // 학생 수행 요구
        strategyText = `'${primaryStrategy}' 및 '${secondaryStrategy}' 기반 능동적 읽기 수행`;
        resourceText = '모둠별 분석 활동지, 포스트잇';
        activityText = `자료에서 핵심 논점 찾기 및 '${primaryStrategy}' 활동지 완성`;
        descriptionText = `학생 개별 또는 모둠으로 읽기자료를 정독하며, 전략을 적용해 주장·근거·개념 관계를 직접 정리하고 활동지를 작성한다.`;
        break;

      case 7: // 피드백 제공
        strategyText = '즉각적인 피드백 및 모둠 간 상호 교정';
        resourceText = '피드백 루브릭, 예시 답안';
        activityText = '짝 피드백 나누기 및 교사 순회 지도 피드백 반영';
        descriptionText = `활동지 정리 과정에서 발생하는 오개념을 즉시 바로잡고, 우수 작성 사례를 공유하여 보완할 수 있도록 지원한다.`;
        break;

      case 8: // 성취 행동 평가
        strategyText = tmpl.strategyLabel || '형성평가 문항 및 수행 평가';
        resourceText = '형성평가 질문지, 체크리스트';
        activityText = '핵심 질문 응답 및 형성평가 수행';
        descriptionText = `'${topicTitle}'의 핵심 내용 이해도와 독서전략 활용 수준을 점검하는 형성평가 또는 3줄 요약 과제를 개별 수행한다.`;
        break;

      case 9: // 파지와 전이
        strategyText = '실생활 연계 심화 탐구 및 확장 과제 제시';
        resourceText = '연계 탐구 안내 자료, 도서관/웹 탐색 과제';
        activityText = '새로운 맥락에 개념 적용해보기 및 소감 공유';
        descriptionText = `학습한 내용을 우리 지역 사회의 현안이나 다른 교과 주제와 연결하여 심화 탐구할 수 있는 과제를 제시한다.`;
        break;
    }

    return {
      sequence: seq,
      label: tmpl.label,
      strategy: strategyText,
      activity: activityText,
      resource: resourceText,
      description: descriptionText,
    };
  });
}
