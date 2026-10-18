'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  BookOpen,
  Settings,
  Shield,
  UserCheck,
  FileText,
  Home,
  Sparkles,
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, switchRole } = useAuthStore();

  return (
    <html lang="ko">
      <head>
        <title>OBILD - 온톨로지 기반 교과 수업지도안 설계 시스템</title>
        <meta
          name="description"
          content="중학교 사회과 교육과정 온톨로지, PISA 텍스트 분류, KNU 독서전략, 가네 9가지 수업사태 기반 수업지도안 자동 설계 시스템"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        {/* 상단 내비게이션 바 (56px) */}
        <header className="no-print h-14 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow">
                O
              </span>
              <span>OBILD</span>
              <span className="hidden md:inline text-xs font-medium text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                수업지도안 설계
              </span>
            </a>

            <nav className="hidden sm:flex items-center gap-1">
              <a
                href="/"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/' ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                홈
              </a>
              <a
                href="/teacher"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/teacher')
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                수업지도안 설계
              </a>
              <a
                href="/admin"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/admin')
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                관리자 포털
              </a>
            </nav>
          </div>

          {/* 우측 듀얼 모드 전환 및 사용자 표시 */}
          <div className="flex items-center gap-3">
            {/* 오프라인 모드 안내 배지 */}
            <span className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              오프라인 로컬 모드
            </span>

            {/* 역할 전환 토글 버튼 */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => switchRole('teacher')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentUser.role === 'teacher'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                교사
              </button>
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-white text-purple-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                관리자
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-xs">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-semibold text-slate-800">{currentUser.displayName}</div>
                <div className="text-[11px] text-slate-400">{currentUser.school}</div>
              </div>
            </div>
          </div>
        </header>

        {/* 본문 영역 */}
        <main className="flex-1 w-full flex flex-col">{children}</main>

        {/* 하단 푸터 */}
        <footer className="no-print bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          <p>© 2026 OBILD (Ontology-Based Instructional Lesson Designer) - 2022 개정 사회과 교육과정 온톨로지 기반</p>
        </footer>
      </body>
    </html>
  );
}
