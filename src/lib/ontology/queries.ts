import { DataFactory, Store } from 'n3';
import { loadOntologyStores } from './loader';
import {
  NAMESPACES,
  SubjectCurriculum,
  LearningArea,
  CoreIdea,
  ContentElement,
  ContentElementType,
  Competency,
  GagnéEventTemplate,
  TextTypeAttribute,
  ReadingFunction,
  ReadingStrategy,
} from './types';
import { GAGNE_EVENT_META } from './mappings';

const { namedNode } = DataFactory;

/**
 * URI에서 식별자(ID)를 추출합니다.
 */
function getLocalId(uri: string): string {
  if (uri.includes('#')) {
    return uri.split('#')[1];
  }
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

/**
 * 리터럴 값을 추출합니다.
 */
function getLiteralValue(store: Store, subjectUri: string, predicateUri: string): string {
  const quads = store.getQuads(namedNode(subjectUri), namedNode(predicateUri), null, null);
  if (quads.length > 0) {
    return quads[0].object.value;
  }
  return '';
}

/**
 * 복수 객체 URI들을 추출합니다.
 */
function getObjectUris(store: Store, subjectUri: string, predicateUri: string): string[] {
  const quads = store.getQuads(namedNode(subjectUri), namedNode(predicateUri), null, null);
  return quads.map((q) => q.object.value);
}

// ==========================================
// 1. 중학교 사회과 교육과정 쿼리
// ==========================================

export async function getSocialStudiesCurriculum(): Promise<SubjectCurriculum> {
  const { socialStore } = await loadOntologyStores();
  const subjectUri = `${NAMESPACES.curr}SocialStudies`;

  const label = getLiteralValue(socialStore, subjectUri, `${NAMESPACES.rdfs}label`) || '사회';
  const description = getLiteralValue(socialStore, subjectUri, `${NAMESPACES.curr}description`);

  // 역량 조회
  const compUris = getObjectUris(socialStore, subjectUri, `${NAMESPACES.curr}developsCompetency`);
  const competencies: Competency[] = compUris.map((uri) => ({
    uri,
    id: getLocalId(uri),
    label: getLiteralValue(socialStore, uri, `${NAMESPACES.rdfs}label`) || getLocalId(uri),
  }));

  // 영역 조회
  const areaUris = getObjectUris(socialStore, subjectUri, `${NAMESPACES.curr}hasArea`);
  const areas: LearningArea[] = areaUris.map((areaUri) => {
    const areaId = getLocalId(areaUri);
    const areaLabel = getLiteralValue(socialStore, areaUri, `${NAMESPACES.rdfs}label`) || areaId;

    // 핵심 아이디어
    const coreIdeaUris = getObjectUris(socialStore, areaUri, `${NAMESPACES.curr}hasCoreIdea`);
    const coreIdeas: CoreIdea[] = coreIdeaUris.map((ciUri) => ({
      uri: ciUri,
      id: getLocalId(ciUri),
      description: getLiteralValue(socialStore, ciUri, `${NAMESPACES.curr}description`),
      areaUri,
    }));

    // 내용 요소
    const elemUris = getObjectUris(socialStore, areaUri, `${NAMESPACES.curr}hasContentElement`);
    const contentElements: ContentElement[] = elemUris.map((elUri) => {
      const elId = getLocalId(elUri);
      const elLabel = getLiteralValue(socialStore, elUri, `${NAMESPACES.rdfs}label`) || elId;
      const gradeBand = getLiteralValue(socialStore, elUri, `${NAMESPACES.curr}gradeBand`);

      // 서브타입 판단 (KnowledgeUnderstanding | ProcessSkill | ValueAttitude)
      const types = getObjectUris(socialStore, elUri, `${NAMESPACES.rdf}type`);
      let elType: ContentElementType = 'KnowledgeUnderstanding';
      if (types.some((t) => t.includes('ProcessSkill'))) {
        elType = 'ProcessSkill';
      } else if (types.some((t) => t.includes('ValueAttitude'))) {
        elType = 'ValueAttitude';
      }

      return {
        uri: elUri,
        id: elId,
        label: elLabel,
        type: elType,
        gradeBand,
        areaUri,
      };
    });

    // 관련 영역
    const relatedAreaUris = getObjectUris(socialStore, areaUri, `${NAMESPACES.curr}relatedToArea`);

    return {
      uri: areaUri,
      id: areaId,
      label: areaLabel,
      coreIdeas,
      contentElements,
      relatedAreaUris,
    };
  });

  return {
    uri: subjectUri,
    id: 'SocialStudies',
    label,
    description,
    areas,
    competencies,
  };
}

// ==========================================
// 2. 가네 9가지 수업사태 템플릿 쿼리
// ==========================================

export async function getGagnéEvents(): Promise<GagnéEventTemplate[]> {
  const { gagneStore } = await loadOntologyStores();
  const events: GagnéEventTemplate[] = [];

  for (let i = 1; i <= 9; i++) {
    const eventUri = `${NAMESPACES.gagne}event${i}`;
    const label = getLiteralValue(gagneStore, eventUri, `${NAMESPACES.rdfs}label`) || `사태 ${i}`;
    const exampleDescription = getLiteralValue(gagneStore, eventUri, `${NAMESPACES.gagne}exampleDescription`);

    // 교수 전략
    const strategyUris = getObjectUris(gagneStore, eventUri, `${NAMESPACES.gagne}hasStrategy`);
    const strategyUri = strategyUris[0];
    const strategyLabel = strategyUri ? getLiteralValue(gagneStore, strategyUri, `${NAMESPACES.rdfs}label`) : undefined;

    // 학습 자료
    const resourceUris = getObjectUris(gagneStore, eventUri, `${NAMESPACES.gagne}usesResource`);
    const resourceLabels = resourceUris.map((rUri) => getLiteralValue(gagneStore, rUri, `${NAMESPACES.rdfs}label`) || getLocalId(rUri));

    // 학습 활동
    const activityUris = getObjectUris(gagneStore, eventUri, `${NAMESPACES.gagne}hasActivity`);
    const activityUri = activityUris[0];
    const activityLabel = activityUri ? getLiteralValue(gagneStore, activityUri, `${NAMESPACES.rdfs}label`) : undefined;

    // 평가 방법
    const assessmentUris = getObjectUris(gagneStore, eventUri, `${NAMESPACES.gagne}hasAssessment`);
    const assessmentUri = assessmentUris[0];
    const assessmentLabel = assessmentUri ? getLiteralValue(gagneStore, assessmentUri, `${NAMESPACES.rdfs}label`) : undefined;

    const meta = GAGNE_EVENT_META.find((m) => m.sequence === i);

    events.push({
      sequenceNumber: i,
      uri: eventUri,
      id: `event${i}`,
      label,
      strategyUri,
      strategyLabel,
      resourceUris,
      resourceLabels,
      activityUri,
      activityLabel,
      assessmentUri,
      assessmentLabel,
      exampleDescription,
      guideQuestion: meta?.guideQuestion || '이 단계를 어떻게 구성할까요?',
    });
  }

  return events;
}

// ==========================================
// 3. PISA 텍스트 속성 및 분류 쿼리
// ==========================================

export async function getPISATextAttributes(): Promise<TextTypeAttribute[]> {
  const { textStore } = await loadOntologyStores();
  const typeUri = `${NAMESPACES.pisa}TextTypeAttribute`;

  const quads = textStore.getQuads(null, namedNode(`${NAMESPACES.rdf}type`), namedNode(typeUri), null);
  const attributes: TextTypeAttribute[] = [];

  for (const q of quads) {
    const uri = q.subject.value;
    const id = getLocalId(uri);
    const label = getLiteralValue(textStore, uri, `${NAMESPACES.rdfs}label`) || id;
    const description = getLiteralValue(textStore, uri, `${NAMESPACES.pisa}contentDescription`);

    const catUris = getObjectUris(textStore, uri, `${NAMESPACES.pisa}hasCategory`);
    const catId = catUris.length > 0 ? getLocalId(catUris[0]) : '';
    
    let category: 'SourceMaterial' | 'StructureAndNavigation' | 'Format' | 'ContentType' = 'ContentType';
    let categoryLabel = '유형(내용)';

    if (catId === 'SourceMaterial') {
      category = 'SourceMaterial';
      categoryLabel = '자료';
    } else if (catId === 'StructureAndNavigation') {
      category = 'StructureAndNavigation';
      categoryLabel = '조직과 탐색';
    } else if (catId === 'Format') {
      category = 'Format';
      categoryLabel = '체재';
    }

    attributes.push({
      uri,
      id,
      label,
      category,
      categoryLabel,
      description,
    });
  }

  return attributes;
}

// ==========================================
// 4. KNU 독서기능 및 전략 쿼리
// ==========================================

export async function getReadingFunctionsAndStrategies(): Promise<ReadingFunction[]> {
  const { readStore } = await loadOntologyStores();
  const funcTypeUri = `${NAMESPACES.read}ReadingFunction`;

  const quads = readStore.getQuads(null, namedNode(`${NAMESPACES.rdf}type`), namedNode(funcTypeUri), null);
  const functions: ReadingFunction[] = [];

  for (const q of quads) {
    const uri = q.subject.value;
    const id = getLocalId(uri);
    const label = getLiteralValue(readStore, uri, `${NAMESPACES.rdfs}label`) || id;

    // 동사들
    const verbUris = getObjectUris(readStore, uri, `${NAMESPACES.read}hasVerb`);
    const verbs = verbUris.map((vUri) => getLiteralValue(readStore, vUri, `${NAMESPACES.rdfs}label`) || getLocalId(vUri));

    // 전략들
    const stratUris = getObjectUris(readStore, uri, `${NAMESPACES.read}hasStrategy`);
    const strategies: ReadingStrategy[] = stratUris.map((sUri) => {
      const sId = getLocalId(sUri);
      const sLabel = getLiteralValue(readStore, sUri, `${NAMESPACES.rdfs}label`) || sId.replace('Strat_', '').replace(/_/g, ' ');
      return {
        uri: sUri,
        id: sId,
        label: sLabel,
        functionUris: [uri],
        functionLabels: [label],
      };
    });

    functions.push({
      uri,
      id,
      label,
      verbs,
      strategies,
    });
  }

  return functions;
}
