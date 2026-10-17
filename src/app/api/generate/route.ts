import { NextRequest, NextResponse } from 'next/server';
import { generateReadingMaterial, generateGagneStepDraft } from '@/lib/llm/generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'readingMaterial') {
      const result = await generateReadingMaterial(body);
      return NextResponse.json(result);
    }

    if (action === 'gagneDraft') {
      const { seq, label, topic, strategy } = body;
      const draft = generateGagneStepDraft(seq, label, topic, strategy);
      return NextResponse.json({ draft });
    }

    return NextResponse.json({ error: '알 수 없는 요청 액션입니다.' }, { status: 400 });
  } catch (error) {
    console.error('API Error in /api/generate:', error);
    return NextResponse.json({ error: '생성 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
