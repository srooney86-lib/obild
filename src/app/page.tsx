'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  Share2,
  Database,
  Cpu,
  GraduationCap,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { loadOntologyStores } from '@/lib/ontology/loader';

export default function HomePage() {
  const [stats, setStats] = useState({
    social: 125,
    gagne: 78,
    text: 38,
    read: 247,
    total: 488,
    ready: false,
  });

  useEffect(() => {
    loadOntologyStores()
      .then((stores) => {
        setStats({
          social: stores.tripleCounts.social,
          gagne: stores.tripleCounts.gagne,
          text: stores.tripleCounts.text,
          read: stores.tripleCounts.read,
          total: stores.tripleCounts.total,
          ready: true,
        });
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            2022 개정 교육과정 & 온톨로지 기반 수업 설계
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            독서전략 기반 교과 수업지도안 <br className="hidden sm:inline" />
            자동 생성 시스템 <span className="text-blue-400">OBILD</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            사회과 교육과정의 단원과 내용 요소를 선택하면, 맞춤형 <strong>읽기자료</strong>를 자동 생성하고
            최적의 <strong>독서전략</strong>을 추천하여 <strong>가네(Gagné)의 9가지 수업사태</strong>에 맞춘 완성형
            수업지도안을 원스톱으로 구성합니다.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <a
              href="/teacher"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              수업지도안 설계 시작
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
            <a
              href="/admin"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Shield className="w-4 h-4 text-slate-300" />
              관리자 지식베이스 보기
            </a>
          </div>
        </div>
      </section>

      {/* 4대 온톨로지 지식베이스 카드 그리드 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              온톨로지 지식베이스 구조 (TTL 4종)
            </h2>
            <p className="text-xs text-slate-500">로컬 N3.js 그래프 저장소에 통합 파싱 및 인덱싱됨</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            총 {stats.total}개 RDF 트리플 활성화
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. 사회과 교육과정 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-xs text-blue-600 font-semibold mb-1">사회과.ttl ({stats.social} Triples)</div>
            <h3 className="font-bold text-slate-900 text-base mb-1">중학교 사회과 교육과정</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              11개 내용 영역(정치, 법, 경제 등), 영역별 핵심 아이디어, 지식·과정·가치 내용 요소 및 5대 핵심 역량
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">11개 영역</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">40+ 내용요소</span>
            </div>
          </div>

          {/* 2. 가네의 9사태 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs text-emerald-600 font-semibold mb-1">가네.ttl ({stats.gagne} Triples)</div>
            <h3 className="font-bold text-slate-900 text-base mb-1">가네 9가지 수업사태</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              주의집중부터 파지와 전이까지 9단계 교수 사건, 교수 전략, 학습 활동, 학습 매체 및 평가 템플릿
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">9개 사태</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">수업설계 템플릿</span>
            </div>
          </div>

          {/* 3. PISA 텍스트 체재 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-amber-600 font-semibold mb-1">text.ttl ({stats.text} Triples)</div>
            <h3 className="font-bold text-slate-900 text-base mb-1">PISA 텍스트 분류</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              자료 기준(단일/다중), 조직과 탐색(정적/동적), 체재(연속/비연속/혼합), 내용(설명/논증/기술/서사/지시/교섭)
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">4대 분류기준</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">6개 내용유형</span>
            </div>
          </div>

          {/* 4. KNU 독서전략 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-400 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-xs text-purple-600 font-semibold mb-1">readstrategy.ttl ({stats.read} Triples)</div>
            <h3 className="font-bold text-slate-900 text-base mb-1">KNU 독서전략 온톨로지</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              15개 핵심 독서기능(이해, 탐색, 추론, 예측, 비교 등), 40여 개 과정-기능 동사, 대표 독서전략 매핑
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">15개 독서기능</span>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">대표전략 매핑</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5단계 워크플로우 안내 */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">수업지도안 자동 설계 파이프라인 (5-Step)</h2>
          <p className="text-xs text-slate-500">온톨로지 추론 체인에 기반하여 교사의 결정을 최적화합니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">교육과정 탐색</h4>
            <p className="text-xs text-slate-500 leading-snug">
              사회과 11개 영역에서 수업할 핵심 아이디어와 내용 요소 선택
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">읽기자료 생성</h4>
            <p className="text-xs text-slate-500 leading-snug">
              내용요소에 적합한 PISA 텍스트 유형 자동 추론 및 교육용 읽기자료 생성
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">독서전략 추천</h4>
            <p className="text-xs text-slate-500 leading-snug">
              텍스트 유형에 대응하는 독서기능 활성화 및 1~3개 맞춤 전략 추천·선택
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              4
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">가네 9사태 슬롯팅</h4>
            <p className="text-xs text-slate-500 leading-snug">
              주의집중부터 전이까지 9개 단계별로 선정된 독서전략을 자동 배치 및 편집
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              5
            </div>
            <h4 className="font-bold text-sm text-slate-900 mb-1">미리보기 & PDF</h4>
            <p className="text-xs text-slate-500 leading-snug">
              학교 표준 공문 양식 표 미리보기, 로컬 저장 및 정밀 PDF/인쇄 내보내기
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <a
            href="/teacher"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-xl shadow-md transition-all text-sm"
          >
            새 수업지도안 설계 시작하기
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
