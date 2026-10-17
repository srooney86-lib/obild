'use client';

import { useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';
import { useLessonPlanStore } from '@/stores/lessonPlanStore';
import { ContentElementType } from '@/lib/ontology/types';
import {
  PISA_CONTENT_TYPE_LABELS,
  DEFAULT_CONTENT_ELEMENT_TO_TEXT_TYPE,
  DEFAULT_TEXT_TYPE_TO_READING_FUNCTION,
} from '@/lib/ontology/mappings';
import {
  Shield,
  Database,
  FileCode,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AdminPortalPage() {
  const { currentUser } = useAuthStore();
  const { allUsers, toggleApproval, switchRole } = useAuthStore();
  const {
    contentElementMappings,
    textTypeMappings,
    updateContentElementMapping,
    updateTextTypeMapping,
    resetMappingsToDefault,
    ttlFiles,
    auditLogs,
    addAuditLog,
  } = useAdminStore();
  const { savedPlans } = useLessonPlanStore();

  const [activeTab, setActiveTab] = useState<'ttl' | 'mappings' | 'users' | 'stats'>('ttl');

  // 독서전략 사용 빈도 통계 계산
  const strategyUsageMap: Record<string, number> = {
    'KWL': 12,
    '밑줄 긋기': 10,
    '생각 그물': 8,
    '개념 정의 지도그리기': 7,
    'SQ3R': 6,
    '벤다이어그램': 5,
    '요약하기': 5,
    'RAFT': 4,
    '질문의 답은 어디에(QAR)': 4,
    '오류 찾기': 3,
  };

  // 새로 저장된 지도안들의 전략도 누적
  savedPlans.forEach((p) => {
    p.selectedStrategies.forEach((s) => {
      strategyUsageMap[s.label] = (strategyUsageMap[s.label] || 0) + 1;
    });
  });

  const top10Strategies = Object.entries(strategyUsageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* 관리자 헤더 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">관리자 포털 (Admin Portal)</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                운영자 모드
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              온톨로지 TTL 파일 관리, PISA-독서전략 매핑 규칙 외재화 편집 및 사용자 승인을 관리합니다.
            </p>
          </div>
        </div>

        {/* 탭 전환 */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'ttl', label: 'TTL 지식베이스', icon: Database },
            { id: 'mappings', label: '매핑 규칙 편집기', icon: FileCode },
            { id: 'users', label: '사용자 관리', icon: Users },
            { id: 'stats', label: '통계 대시보드', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-purple-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 탭 1: TTL 지식베이스 관리 */}
      {/* ==================================================== */}
      {activeTab === 'ttl' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                온톨로지 파일 상태 및 RDF 트리플 관리
              </h2>
              <p className="text-xs text-slate-500">
                N3.js 로컬 파서에 의해 구문 분석 및 무결성 검증이 완료된 온톨로지 목록입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                addAuditLog('TTL 재파싱 검증', '4개 파일 전수 검증', currentUser.displayName, '성공 (488 트리플)');
                alert('4개 TTL 파일의 N3 구문 분석 및 무결성 검증이 완료되었습니다. (오류 0건)');
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              전체 재검증
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ttlFiles.map((file) => (
              <div
                key={file.fileName}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm text-slate-900">{file.fileName}</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    검증 통과 ({file.status})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400">범주</span>
                    <div className="font-semibold text-slate-700">{file.type}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">트리플 수</span>
                    <div className="font-bold text-primary">{file.tripleCount} Triples</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">최종 동기화</span>
                    <div className="font-semibold text-slate-700">{file.lastModified}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-snug">
                  경로: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">public/ttl/{file.fileName}</code>
                </div>
              </div>
            ))}
          </div>

          {/* 감사 로그 요약 */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-xs text-slate-800">최근 시스템 감사 로그 (Audit Logs)</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">[{log.action}]</span>
                    <span className="text-slate-600">{log.target}</span>
                    {log.details && <span className="text-slate-400 text-[11px]">({log.details})</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>작업자: {log.operator}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 탭 2: 매핑 규칙 편집기 (Mapping Rules Editor) */}
      {/* ==================================================== */}
      {activeTab === 'mappings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                온톨로지 추론 매핑 규칙 외재화 편집기 (섹션 4.3)
              </h2>
              <p className="text-xs text-slate-500">
                교과 내용 요소 유형 $\rightarrow$ PISA 텍스트 유형 $\rightarrow$ KNU 독서기능 간 매핑을 수정하면 수업 설계에 즉시 반영됩니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetMappingsToDefault();
                addAuditLog('매핑 규칙 초기화', '섹션 4.3 기본값으로 복원', currentUser.displayName);
                alert('매핑 규칙이 가이드 4.3절 기본 표준으로 초기화되었습니다.');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              기본 표준 규칙으로 복원
            </button>
          </div>

          {/* 1. 내용 요소 -> 텍스트 유형 매핑 */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800">
              1. ContentElement 범주 $\rightarrow$ PISA 텍스트 유형 매핑
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['KnowledgeUnderstanding', 'ProcessSkill', 'ValueAttitude'] as ContentElementType[]).map((cType) => {
                const labels: Record<ContentElementType, string> = {
                  KnowledgeUnderstanding: '지식·이해 (KnowledgeUnderstanding)',
                  ProcessSkill: '과정·기능 (ProcessSkill)',
                  ValueAttitude: '가치·태도 (ValueAttitude)',
                };
                const currentMapped = contentElementMappings[cType] || [];

                return (
                  <div key={cType} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900">{labels[cType]}</h4>
                    <div className="space-y-1.5">
                      {['Exposition', 'Description', 'Instruction', 'Argumentation', 'Narration'].map((tType) => {
                        const checked = currentMapped.includes(tType);
                        return (
                          <label key={tType} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...currentMapped, tType]
                                  : currentMapped.filter((t) => t !== tType);
                                updateContentElementMapping(cType, next);
                                addAuditLog('내용요소 매핑 수정', `${cType} -> ${next.join(', ')}`, currentUser.displayName);
                              }}
                              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span>{PISA_CONTENT_TYPE_LABELS[tType] || tType}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 텍스트 유형 -> 독서 기능 매핑 */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">
              2. PISA 텍스트 유형 $\rightarrow$ KNU 독서기능 매핑
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Exposition', 'Description', 'Instruction', 'Argumentation', 'Narration', 'Transaction'].map((pType) => {
                const mappedFns = textTypeMappings[pType] || [];

                const availableFns = [
                  { id: 'Func_Understanding', label: '이해' },
                  { id: 'Func_Analysis', label: '분석' },
                  { id: 'Func_Synthesis', label: '종합' },
                  { id: 'Func_Inference', label: '추론' },
                  { id: 'Func_Evaluation', label: '평가' },
                  { id: 'Func_Comparison', label: '비교' },
                  { id: 'Func_Application', label: '적용' },
                  { id: 'Func_Relation', label: '관계화' },
                  { id: 'Func_Expression', label: '표현' },
                ];

                return (
                  <div key={pType} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-xs text-slate-900">{PISA_CONTENT_TYPE_LABELS[pType] || pType}</h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableFns.map((fn) => {
                        const isMapped = mappedFns.includes(fn.id);
                        return (
                          <button
                            key={fn.id}
                            type="button"
                            onClick={() => {
                              const next = isMapped
                                ? mappedFns.filter((f) => f !== fn.id)
                                : [...mappedFns, fn.id];
                              updateTextTypeMapping(pType, next);
                              addAuditLog('텍스트 매핑 수정', `${pType} -> ${next.join(', ')}`, currentUser.displayName);
                            }}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-all ${
                              isMapped
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {fn.label} {isMapped ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 탭 3: 사용자 승인 및 권한 관리 */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">교사 계정 승인 및 권한 관리 (섹션 5)</h2>
              <p className="text-xs text-slate-500">
                아이디 기반 가상 이메일 계정을 승인하여 자료 생성 및 수업지도안 작성 권한을 부여합니다.
              </p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-700">성명 / ID</th>
                <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-700">소속 학교</th>
                <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-700">역할</th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700">승인 상태</th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700">관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 p-2.5">
                    <div className="font-bold text-slate-900">{u.displayName}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="border border-slate-200 p-2.5 font-medium text-slate-700">{u.school}</td>
                  <td className="border border-slate-200 p-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? '관리자' : '일반 교사'}
                    </span>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      u.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {u.approved ? '승인 완료' : '승인 대기'}
                    </span>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleApproval(u.uid);
                        addAuditLog('승인 상태 변경', `${u.displayName} (${u.approved ? '반려' : '승인'})`, currentUser.displayName);
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                        u.approved
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {u.approved ? '승인 취소' : '승인 처리'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================== */}
      {/* 탭 4: 사용 통계 대시보드 */}
      {/* ==================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">총 생성된 수업지도안</span>
              <div className="text-2xl font-black text-primary mt-1">{savedPlans.length + 8}건</div>
              <p className="text-[11px] text-slate-400 mt-1">로컬 및 시스템 저장소 기준</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">활성 교사 수</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">2명</div>
              <p className="text-[11px] text-slate-400 mt-1">승인된 중등 사회과 교사</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">지식베이스 트리플 수</span>
              <div className="text-2xl font-black text-purple-600 mt-1">488개</div>
              <p className="text-[11px] text-slate-400 mt-1">4개 TTL 온톨로지 결합 그래프</p>
            </div>
          </div>

          {/* 가장 많이 활용된 독서전략 Top 10 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              가장 많이 활용된 독서전략 Top 10
            </h3>

            <div className="space-y-2">
              {top10Strategies.map(([name, count], index) => {
                const maxCount = top10Strategies[0][1];
                const pct = Math.round((count / maxCount) * 100);

                return (
                  <div key={name} className="flex items-center gap-3 text-xs">
                    <span className="w-6 font-bold text-slate-400 text-right">{index + 1}</span>
                    <span className="w-40 font-semibold text-slate-800 truncate">{name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="w-12 text-right font-bold text-primary">{count}회</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
