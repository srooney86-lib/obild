/**
 * 읽기자료 및 수업사태 초안 생성 엔진
 * - Gemini 2.0 Flash API (온라인/키 설정 시)
 * - 고품질 교육용 템플릿 생성기 (오프라인/키 미설정 시 Fallback)
 */

export interface ReadingGenerationRequest {
  topic: string;
  coreIdea: string;
  grade: string;
  minLen: number;
  maxLen: number;
  format: string; // '연속적' | '비연속적' | '혼합적'
  contentType: string; // 'Exposition' | 'Description' | 'Argumentation' | 'Narration' | 'Instruction'
}

export interface ReadingGenerationResponse {
  title: string;
  body: string;
  generatedBy: 'gemini-2.0-flash' | 'offline-template-generator';
  generatedAt: string;
}

/**
 * 오프라인용 교과 주제별 맞춤 읽기자료 생성기
 */
function generateOfflineReadingMaterial(req: ReadingGenerationRequest): { title: string; body: string } {
  const { topic, coreIdea, grade, format, contentType } = req;

  let title = `[${grade} 사회] ${topic}의 이해와 탐구`;
  let paragraphs: string[] = [];

  if (contentType === 'Argumentation') {
    title = `[생각해보기] ${topic}, 우리는 어떤 선택을 해야 할까?`;
    paragraphs = [
      `현대 사회에서 ${topic} 문제는 우리 모두가 직면한 중요한 쟁점 중 하나입니다. ${coreIdea}라는 관점에서 볼 때, 우리는 사회 구성원으로서 이 문제를 단순한 개인의 차원이 아닌 공동체의 지속가능성과 정의의 관점에서 검토해야 합니다.`,
      `일각에서는 ${topic}에 대해 효율성과 신속한 성과를 우선해야 한다고 주장합니다. 하지만 다른 한편에서는 민주적 절차, 기본적 권리 보장, 그리고 미래 세대에 미칠 영향을 균형 있게 고려해야 한다는 반론이 팽팽히 맞서고 있습니다. 과거의 여러 역사적·사회적 경험들은 구성원의 실질적인 참여와 합의가 결여된 결정이 예기치 못한 사회적 갈등을 낳을 수 있음을 보여줍니다.`,
      `결국 우리는 ${topic}를 바라볼 때 편향된 정보에 휩쓸리지 않고, 객관적 사실과 타당한 근거를 토대로 비판적 사고를 발휘해야 합니다. 건강한 민주 시민 사회는 서로 다른 의견을 존중하고 대화와 타협을 통해 더 나은 대안을 찾아가는 과정에서 비로소 완성됩니다.`
    ];
  } else if (contentType === 'Narration') {
    title = `[사례로 보는 사회] 어느 마을의 이야기로 만나는 ${topic}`;
    paragraphs = [
      `하늘마을 사람들은 최근 ${topic}와 관련된 커다란 변화를 겪게 되었습니다. ${coreIdea}에 대한 주민들의 관심이 높아지면서, 동네 어귀에는 주민들이 함께 모여 의견을 나누는 작은 공론장이 마련되었습니다.`,
      `중학생 지우는 방과 후 도서관을 오가며 마을 사람들이 나누는 열띤 토론을 지켜보았습니다. 어떤 주민은 일상생활의 편리함을 이야기했고, 또 다른 주민은 자연환경과 이웃 간의 배려를 강조했습니다. 지우는 학교 사회 시간에 배운 내용을 떠올리며, 교과서 속 지식이 바로 우리 마을의 현실과 맞닿아 있음을 실감하게 되었습니다.`,
      `주민 투표와 여러 차례의 공청회를 거쳐 마을은 마침내 서로 배려하는 상생의 해결책을 찾아냈습니다. 이 작은 경험은 ${topic}가 멀리 있는 제도가 아니라, 우리 모두의 일상과 참여 속에서 살아 숨 쉬는 가치임을 일깨워 주었습니다.`
    ];
  } else if (contentType === 'Instruction') {
    title = `[탐구 안내서] ${topic} 탐구 및 실천 단계별 가이드`;
    paragraphs = [
      `본 안내서는 중학교 학생들이 ${topic}의 핵심 내용을 단계적으로 탐구하고 일상에서 실천할 수 있도록 돕기 위해 작성되었습니다. ${coreIdea}를 바탕으로 다음의 3단계를 차근차근 따라 해 봅시다.`,
      `[1단계: 문제 정의 및 현황 파악] 먼저 우리 주변에서 ${topic}와 관련된 현상이나 문제 상황을 찾아 메모합니다. 신문 기사나 통계 자료를 활용하여 사실(Fact)과 의견(Opinion)을 명확히 구분하는 것이 중요합니다.\n\n[2단계: 다각적 관점 분석] 가계, 기업, 정부, 시민단체 등 다양한 사회 주체의 입장에서 이 문제를 바라보고, 각 입장의 근거를 표로 정리해 봅니다.\n\n[3단계: 실천 대안 제안] 개인적 차원에서 실천할 수 있는 행동 수칙과 제도적 개선 방안을 각각 한 가지씩 도출하여 발표 자료를 완성합니다.`,
      `위 과정을 성실히 수행하면 ${topic}에 대한 체계적인 이해는 물론, 문제를 비판적으로 검토하고 창의적으로 해결하는 시민 역량을 기를 수 있습니다.`
    ];
  } else {
    // Exposition (기본 설명문)
    title = `[교과 탐구] ${topic}의 개념과 현대적 의의`;
    paragraphs = [
      `${topic}은(는) 중학교 사회과 교육과정에서 다루는 핵심 주제 중 하나로, 현대 사회의 작동 원리를 이해하는 데 기초가 됩니다. ${coreIdea}라는 핵심 아이디어에서 알 수 있듯이, 이는 단순한 지식의 암기를 넘어 우리가 살아가는 공동체의 다양한 현상을 해석하는 열쇠입니다.`,
      `역사적으로 ${topic}은(는) 사회의 발전과 제도적 성숙에 따라 끊임없이 변화해 왔습니다. 특히 오늘날과 같은 고도 정보화 및 다문화 사회에서는 다양한 가치관과 이해관계가 복잡하게 얽혀 있으므로, ${topic}에 내재된 기본 원리를 정확히 파악하는 것이 무엇보다 중요합니다. 예를 들어 일상생활 속에서 우리가 내리는 크고 작은 결정들은 제도와 규범, 그리고 상호작용 속에서 형성됩니다.`,
      `따라서 우리는 ${topic}을(를) 학습함으로써 사회 현상을 비판적으로 바라보고, 책임 있는 민주 시민으로서 합리적 의사결정을 내릴 수 있는 안목을 길러야 합니다. 앞으로 이어지는 탐구 활동과 독서 전략을 통해 관련 자료를 깊이 있게 분석해 봅시다.`
    ];
  }

  // 체재(Format)에 따른 부가 요소 추가
  if (format === '비연속적' || format === '혼합적') {
    paragraphs.push(
      `\n[핵심 정리 및 개념 구조표]\n` +
      `┌───────────────────┬──────────────────────────────────────┐\n` +
      `│ 구분             │ 주요 내용                            │\n` +
      `├───────────────────┼──────────────────────────────────────┤\n` +
      `│ 핵심 주제         │ ${topic}                             │\n` +
      `│ 관련 성취 기준    │ ${coreIdea.slice(0, 30)}...          │\n` +
      `│ 탐구 역량         │ 비판적 사고력, 문제해결 및 의사결정  │\n` +
      `└───────────────────┴──────────────────────────────────────┘`
    );
  }

  return {
    title,
    body: paragraphs.join('\n\n'),
  };
}

/**
 * 읽기자료 생성 메인 함수 (Gemini API 호출 + 오프라인 Fallback)
 */
export async function generateReadingMaterial(req: ReadingGenerationRequest): Promise<ReadingGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `당신은 중학교 사회과 교사를 위한 교육용 읽기자료 전문 작성자입니다.
다음 조건을 모두 만족하는 읽기자료를 한국어로 작성하십시오:
- 주제: ${req.topic}
- 핵심 아이디어: ${req.coreIdea}
- 학년: ${req.grade}
- 글자 수: ${req.minLen}~${req.maxLen}자 내외
- 텍스트 체재: ${req.format}
- 내용 유형: ${req.contentType}
- 요구사항: 중학생 어휘 수준에 맞춘 친절하고 명확한 문장, 객관적 사실 기반, 교육적 가치 함양

출력 형식은 반드시 유효한 JSON 형식이어야 합니다:
{
  "title": "글의 제목",
  "body": "본문 내용..."
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          return {
            title: parsed.title || `${req.topic} 읽기자료`,
            body: parsed.body || '',
            generatedBy: 'gemini-2.0-flash',
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API 호출 실패, 오프라인 템플릿 생성기로 대체합니다:', e);
    }
  }

  // 오프라인 템플릿 생성기 작동
  const offlineResult = generateOfflineReadingMaterial(req);
  return {
    title: offlineResult.title,
    body: offlineResult.body,
    generatedBy: 'offline-template-generator',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 가네 수업사태별 세부 초안 생성 함수
 */
export function generateGagneStepDraft(
  seq: number,
  label: string,
  topic: string,
  strategy: string
): string {
  const drafts: Record<number, string> = {
    1: `'${topic}'의 실제 뉴스 기사 헤드라인이나 일상 속 갈등 장면을 짧게 제시하며 "만약 여러분이 이 상황의 주인공이라면 어떻게 할까요?"라는 개방형 발문으로 호기심을 유발한다.`,
    2: `학생들과 함께 판서된 학습목표를 읽으며, 이번 차시에서 '${topic}'의 개념을 이해하고 '${strategy}' 전략을 활용해 주요 내용을 정리할 것임을 명확히 인지시킨다.`,
    3: `지난 시간에 다룬 관련 개념을 짝과 함께 1분간 회상하여 말해보고, 오늘 배울 '${topic}'과 어떤 공통점과 차이점이 있는지 브레인스토밍 질문을 던진다.`,
    4: `준비된 읽기자료를 배부하고, 먼저 제목과 소제목, 첫 문단을 훑어보며 글 전체의 개요를 파악할 수 있도록 3분간의 탐색 시간을 제공한다.`,
    5: `'${strategy}' 전략의 적용 방법을 교사가 직접 시범(Modeling) 보이고, 활동지 양식의 빈칸을 채우는 힌트와 핵심 키워드 유의사항을 단계별로 안내한다.`,
    6: `학생들이 모둠별 또는 개별적으로 읽기자료를 정독하며, '${strategy}' 기법을 적용하여 주요 논거와 세부 사실을 활동지에 직접 기록하고 정리한다.`,
    7: `교사는 교실을 순회하며 모둠별 작성 내용을 확인하고, 오개념이 있는 경우 질문을 통해 스스로 수정할 수 있도록 교정 피드백과 칭찬을 제공한다.`,
    8: `'${topic}'의 핵심 개념과 관련된 2~3개의 형성평가 퀴즈 또는 3줄 요약 카드를 작성하게 하여 학습목표 도달 여부를 확인한다.`,
    9: `오늘 배운 '${topic}'의 원리를 우리 학교나 지역사회의 실제 문제에 어떻게 적용해 볼 수 있을지 생각해보게 하고, 후속 탐구 과제로 제시한다.`,
  };

  return drafts[seq] || `${label} 단계 활동을 진행합니다.`;
}
