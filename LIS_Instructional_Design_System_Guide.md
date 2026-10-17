# 독서전략 기반 교과 수업지도안 생성 시스템 개발 가이드

> **대상 개발 환경:** Google Antigravity 2.0 (바이브 코딩)
> **작성 목적:** 온톨로지(TTL) 기반 교과 수업 설계 지원 시스템의 전체 사양을 Antigravity 2.0 에이전트에게 전달하여 반복 수정 없이 단일 세션에서 MVP를 구축하도록 하기 위함
> **첨부 파일:** `사회과.ttl`, `가네.ttl`, `text.ttl`, `readstrategy.ttl`

---

## 1. 프로젝트 개요

### 1.1 시스템명 (가칭)
- **국문:** 온톨로지 기반 교과 수업지도안 설계 시스템
- **영문:** OBILD (Ontology-Based Instructional Lesson Designer)

### 1.2 핵심 가치 제안
교사가 교과 교육과정의 단원·성취기준·내용 요소를 선택하면, 해당 요소에 적합한 **읽기자료(Reading Material)**를 자동 생성하고, 자료 특성에 맞는 **독서전략(Reading Strategy)**을 추천하며, **가네(Gagné)의 9가지 수업사태(Nine Events of Instruction)**에 따라 수업지도안(Lesson Plan)을 자동 구성하는 시스템.

### 1.3 핵심 특징
- **온톨로지 기반(Ontology-Based):** 4개의 TTL(Turtle) 파일을 지식 베이스로 활용
- **RDF/OWL 추론(Reasoning):** SPARQL 쿼리로 교과 요소–텍스트 유형–독서전략–수업사태 간 매핑 수행
- **오프라인 우선(Offline-First):** 로컬 환경에서 테스트 후 GitHub 배포
- **듀얼 모드(Dual Mode):** 관리자/일반 교사 분리

---

## 2. 기술 스택 (Tech Stack)

### 2.1 프론트엔드 (Frontend)
| 범주 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | **Next.js 15 (App Router)** | SSR 및 정적 호스팅 모두 대응 |
| 언어 | **TypeScript** | 타입 안정성 확보 |
| UI 라이브러리 | **shadcn/ui + Tailwind CSS 4** | 교육용 한글 UI 적합 |
| 상태 관리 | **Zustand** | Redux 대비 경량 |
| RDF 파서 | **rdflib.js** 또는 **N3.js** | TTL 파싱 및 SPARQL 쿼리 |
| 아이콘 | **lucide-react** | shadcn과 호환 |
| 폰트 | **Pretendard Variable** | 한글 가독성 |

### 2.2 백엔드 (Backend)
| 범주 | 선택 | 비고 |
|------|------|------|
| 인증 | **Firebase Authentication** | 이메일/비밀번호, 커스텀 토큰 |
| 데이터베이스 | **Cloud Firestore** | NoSQL, 실시간 동기화 |
| 파일 저장소 | **Firebase Storage** | TTL 파일, 생성된 PDF 수업지도안 |
| 서버리스 함수 | **Firebase Cloud Functions (2nd Gen)** | TTL 파싱, LLM 호출 중계 |
| LLM API | **Google Gemini API** | 읽기자료 생성 (Antigravity와 동일 생태계) |

### 2.3 개발·배포 (DevOps)
| 범주 | 선택 | 비고 |
|------|------|------|
| 버전 관리 | **GitHub** | main / develop 브랜치 전략 |
| CI/CD | **GitHub Actions** | 빌드 후 Firebase Hosting 배포 |
| 로컬 테스트 | **Firebase Emulator Suite** | Firestore·Auth·Storage·Functions 전부 로컬 구동 |
| 패키지 매니저 | **pnpm** | 디스크·속도 효율 |

---

## 3. 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (GitHub Pages)          │
│  ┌──────────────────┐           ┌──────────────────────┐    │
│  │  Admin Portal    │           │ Teacher Portal       │    │
│  │  - TTL CRUD      │           │ - 단원 선택           │    │
│  │  - 사용자 관리     │           │ - 자료 생성           │    │
│  │  - 사용 통계       │           │ - 지도안 작성        │    │
│  └────────┬─────────┘           └──────────┬───────────┘    │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            │  HTTPS / Firebase SDK           │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Backend (BaaS)                    │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────┐    │
│  │  Auth   │  │Firestore │  │ Storage │  │ Functions   │    │
│  │ (사용자) │  │(지도안·메타)│ │ (TTL)   │  │ (TTL파싱·LLM)│    │
│  └─────────┘  └──────────┘  └─────────┘  └──────┬──────┘    │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │   Gemini API        │
                                        │ (읽기자료 생성)       │
                                        └─────────────────────┘
```

---

## 4. 온톨로지 지식 모델 (Ontology Knowledge Model)

### 4.1 TTL 파일 역할 및 네임스페이스
| 파일 | 네임스페이스 접두사 | 핵심 클래스 | 역할 |
|------|------------------|-----------|------|
| `사회과.ttl` | `ex:` (curriculum) | `Subject`, `LearningArea`, `CoreIdea`, `ContentElement`, `Competency` | 중학교 사회과 교육과정 구조 |
| `가네.ttl` | `ex:` (il-lesson) | `InstructionalEvent`, `TeachingStrategy`, `LearningActivity`, `LearningResource`, `AssessmentMethod` | 가네의 9가지 수업사태 템플릿 |
| `text.ttl` | `ex:` (pisa) | `TextClassificationCategory`, `TextTypeAttribute`, `TextExample` | PISA 기준 텍스트 분류(자료·조직·체재·내용) |
| `readstrategy.ttl` | `ex:` (reading) | `ReadingFunction`, `ReadingVerb`, `ReadingStrategy` | 15개 핵심 독서기능과 전략 매핑 |

> **주의:** 4개 파일 모두 `ex:` 접두사를 쓰지만 **네임스페이스 URI가 서로 다르다.** 통합 그래프 로드 시 이름 충돌이 없도록 별도 그래프로 로드하거나 접두사를 `curr:`, `gagne:`, `pisa:`, `read:`로 재바인딩할 것.

### 4.2 통합 추론 흐름 (Inference Chain)
교사의 선택부터 지도안 출력까지:

```
[1] 사용자 입력: 사회과 LearningArea 선택 (예: ex:Politics)
         │
         ▼
[2] SPARQL: 해당 Area의 ContentElement 조회
         │
         ▼
[3] 매핑 규칙 적용: ContentElement 유형 → 적합한 TextTypeAttribute 추론
         │  (예: KnowledgeUnderstanding → Exposition / ProcessSkill → Instruction)
         ▼
[4] Gemini LLM 호출: TextTypeAttribute 조건을 프롬프트에 반영하여 읽기자료 생성
         │
         ▼
[5] SPARQL: 선정된 TextTypeAttribute의 ContentType에 대응하는 ReadingFunction 추론
         │  (예: Exposition → 이해, 분석, 종합 기능 활성화)
         ▼
[6] SPARQL: 해당 ReadingFunction의 ReadingStrategy 조회
         │
         ▼
[7] 가네 9단계 템플릿에 (3)(4)(6) 결과를 슬롯팅하여 LessonPlan 생성
```

### 4.3 매핑 규칙 테이블 (Mapping Rules — 코드 상수화)
`src/lib/ontology/mappings.ts`에 다음 규칙을 상수로 선언:

```typescript
// ContentElement 서브클래스 → PISA ContentType 1차 매핑
export const CONTENT_ELEMENT_TO_TEXT_TYPE = {
  KnowledgeUnderstanding: ['Exposition', 'Description'],
  ProcessSkill: ['Instruction', 'Exposition'],
  ValueAttitude: ['Argumentation', 'Narration'],
} as const;

// PISA ContentType → ReadingFunction 매핑 (복수 매핑)
export const TEXT_TYPE_TO_READING_FUNCTION = {
  Description: ['Func_Understanding', 'Func_Analysis'],
  Narration: ['Func_Understanding', 'Func_Relation', 'Func_Expression'],
  Exposition: ['Func_Understanding', 'Func_Analysis', 'Func_Synthesis'],
  Argumentation: ['Func_Inference', 'Func_Evaluation', 'Func_Comparison'],
  Instruction: ['Func_Understanding', 'Func_Application'],
  Transaction: ['Func_Expression', 'Func_Application'],
} as const;
```

> **중요:** 이 매핑 규칙은 **별도 TTL 파일(`mapping.ttl`)로 외재화**하는 것을 권장. 추후 교사가 UI에서 수정 가능하게 하기 위함.

---

## 5. 사용자 역할 및 인증 (Roles & Authentication)

### 5.1 역할 정의
| 역할 | 식별자 | 권한 범위 |
|------|-------|---------|
| **관리자(Admin)** | `role: "admin"` | 모든 TTL 파일 CRUD, 사용자 승인/삭제, 전체 지도안 조회, 매핑 규칙 수정 |
| **일반 교사(Teacher)** | `role: "teacher"` | 자신의 지도안만 CRUD, 공개 TTL 조회(읽기 전용), 자료 생성 |

### 5.2 인증 플로우
- **관리자:** Firebase Auth 이메일/비밀번호 (최초 1인은 Firestore에 수동 플래그 설정)
- **일반 교사:** **아이디 + 패스워드 간이 로그인**
  - Firebase Auth의 이메일 요구를 우회하기 위해 입력된 ID를 `{id}@obild.local` 형태의 가상 이메일로 변환하여 내부적으로 사용
  - 회원가입 시 관리자 승인 플래그(`approved: false`) 기본값. 승인 전에는 로그인 가능하나 자료 생성 불가
  - **비밀번호 복잡도:** 최소 6자(Firebase 기본). 교사 편의를 우선

### 5.3 Firebase Auth 커스텀 클레임 (Custom Claims)
Cloud Function `setUserRole`에서 커스텀 클레임 부여:
```typescript
await admin.auth().setCustomUserClaims(uid, {
  role: 'teacher',
  approved: true,
  school: '국립공주대학교부설중학교',
});
```

---

## 6. Firestore 데이터 모델 (Database Schema)

### 6.1 컬렉션 구조
```
/users/{uid}
  - id: string (교사 ID)
  - displayName: string
  - email: string (가상 이메일)
  - role: "admin" | "teacher"
  - approved: boolean
  - school: string
  - createdAt: timestamp
  - lastLoginAt: timestamp

/subjects/{subjectId}            // "social-studies", "science" 등
  - name: string                 // "사회", "과학"
  - ttlFileId: string            // Storage 경로 참조
  - version: string              // 교육과정 버전 (예: "2022개정")
  - active: boolean

/ttlFiles/{fileId}
  - fileName: string             // "사회과.ttl"
  - type: "curriculum" | "instruction" | "textType" | "readingStrategy"
  - storagePath: string
  - version: number              // 수정 이력 추적
  - uploadedBy: uid
  - uploadedAt: timestamp
  - checksum: string             // SHA-256, 캐시 무효화용

/lessonPlans/{planId}
  - ownerId: uid
  - subject: string              // "social-studies"
  - learningArea: string         // "ex:Politics"
  - contentElements: string[]    // 선택한 요소 URI 배열
  - achievementStandards: string
  - readingMaterial: {
      title: string,
      body: string,              // Gemini 생성 본문
      textType: {                // text.ttl 분류
        source: string,          // "SingleText"
        structure: string,       // "StaticText"
        format: string,          // "ContinuousText"
        content: string,         // "Exposition"
      },
      generatedBy: "gemini-2.0-flash",
      generatedAt: timestamp,
    }
  - readingStrategies: string[]  // 추천 전략 URI 배열
  - gagneEvents: [               // 9개 이벤트 각각 채워진 상태
      {
        sequence: 1,
        label: "주의집중",
        strategy: string,
        activity: string,
        resource: string,
        description: string,
      }, ...
    ]
  - createdAt: timestamp
  - updatedAt: timestamp
  - exported: boolean            // PDF 내보내기 여부

/mappings/{mappingId}            // 매핑 규칙 외재화
  - from: string                 // "ContentElement:KnowledgeUnderstanding"
  - to: string[]                 // ["TextType:Exposition", ...]
  - editable: boolean
  - updatedBy: uid
  - updatedAt: timestamp
```

### 6.2 Firestore 보안 규칙 (Security Rules)
`firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.role == 'admin';
    }
    function isApproved() {
      return request.auth != null && request.auth.token.approved == true;
    }
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if isAdmin();
    }

    match /subjects/{id} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /ttlFiles/{id} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /lessonPlans/{planId} {
      allow read: if isOwner(resource.data.ownerId) || isAdmin();
      allow create: if isApproved() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.ownerId) || isAdmin();
    }

    match /mappings/{id} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

### 6.3 Storage 규칙
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /ttl/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    match /exports/{uid}/{file} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

---

## 7. 기능 명세 (Feature Specification)

### 7.1 관리자 모드 (Admin Portal)
#### 7.1.1 TTL 파일 관리
- 업로드: 드래그 앤 드롭 + 유효성 검사(N3.js로 파싱 성공 여부)
- 미리보기: 파싱된 트리플을 표 형태로 표시
- 수정: 모나코 에디터(Monaco Editor) 기반 인라인 편집, 저장 시 서버 측 재파싱 검증
- 버전 관리: 수정 시 이전 버전 Firestore에 스냅샷 보관
- 삭제: Soft delete (`active: false`)

#### 7.1.2 매핑 규칙 편집기
- `ContentElement → TextType` 매핑 테이블 UI
- `TextType → ReadingFunction` 매핑 테이블 UI
- 변경 시 영향받는 지도안 수 미리보기

#### 7.1.3 사용자 관리
- 승인 대기 목록, 승인/반려 버튼
- 역할 변경(admin ↔ teacher)
- 비활성화

#### 7.1.4 사용 통계 대시보드
- 교과별 지도안 생성 수
- 가장 많이 쓰인 독서전략 Top 10
- 월별 활성 교사 수

### 7.2 일반 교사 모드 (Teacher Portal)
#### 7.2.1 교육과정 탐색기 (Curriculum Browser)
- 좌측 트리: `Subject > LearningArea > CoreIdea > ContentElement`
- 노드 클릭 시 우측 패널에 해당 요소 설명, 관련 역량, 성취기준 표시
- 다중 선택 지원(여러 ContentElement를 하나의 지도안에 포함)

#### 7.2.2 읽기자료 생성기 (Reading Material Generator)
- 입력 패널:
  - 선택된 ContentElement 요약
  - 학년 수준 (중1/중2/중3)
  - 글자 수 범위 (300–800자, 슬라이더)
  - 텍스트 체재 선택 (연속/비연속/혼합) — 기본값은 매핑 규칙에서 추론
  - 원하는 스타일 (설명문/논설문/서사문/지시문)
- 출력 패널:
  - 생성된 읽기자료
  - 자동 분류된 PISA 텍스트 유형
  - **재생성** 버튼 (seed 변경)
  - **수동 수정** 가능 (리치 텍스트 에디터)
- Gemini 프롬프트 템플릿(`src/lib/llm/prompts/reading-material.ts`):
  ```
  당신은 중학교 사회과 교사를 위한 교육용 읽기자료 작성자입니다.
  다음 조건을 모두 만족하는 읽기자료를 한국어로 작성하십시오:
  - 주제: {contentElementLabel}
  - 핵심 아이디어: {coreIdeaDescription}
  - 학년: {grade}
  - 글자 수: {minLen}~{maxLen}자
  - 텍스트 체재: {format} (예: 연속적 = 문단으로 구성)
  - 내용 유형: {contentType} (예: 설명)
  - 요구사항: 중학생 어휘 수준, 중립적 서술, 사실 기반
  출력 형식: {"title": "...", "body": "..."}
  ```

#### 7.2.3 독서전략 추천기 (Strategy Recommender)
- 생성된 읽기자료의 `contentType`을 바탕으로 `ReadingFunction` 복수 추론
- 각 Function의 대표 전략을 카드 형태로 제시
- 교사가 **1–3개 전략 선택**
- 각 전략 카드에는 전략 명, 간단한 설명, "자세히 보기" 모달 포함

#### 7.2.4 수업지도안 자동 작성기 (Gagné Lesson Plan Builder)
- 가네 9단계 각각에 대해:
  - 템플릿 가이드 질문 표시 (예: "주의집중 단계에서 사용할 매체는?")
  - 선택한 독서전략이 적합한 단계에 자동 배치
    - 예: `KWL` → 2단계(학습목표 제시) + 3단계(선수학습 재생)
    - 예: `밑줄 긋기` → 5단계(학습 지침) + 6단계(수행 요구)
  - 각 단계별 LLM 보조 작성 버튼 ("이 단계 초안 생성")
- 완성된 지도안:
  - 미리보기 (학교 공문 양식 스타일)
  - PDF 내보내기 (jsPDF + html2canvas, 한글 폰트 임베드)
  - HWPX 내보내기는 **MVP 범위 외**로 명시 (추후 확장)

### 7.3 공통 기능
- 다크 모드 토글
- 지도안 북마크/즐겨찾기
- 지도안 공유 링크 (관리자 승인 시 공개)
- 생성 이력 로그

---

## 8. UI/UX 요구사항

### 8.1 디자인 원칙
- **교육용 톤:** 전문적이되 친근하게. 과도한 애니메이션 지양
- **한글 가독성 최우선:** 본문 16px, 행간 1.6
- **키보드 접근성:** Tab 네비게이션 완전 지원
- **반응형:** 데스크톱 우선, 태블릿 보조 (교실 활용 가능성)

### 8.2 레이아웃 가이드
- 좌측 사이드바: 네비게이션 (고정, 220px)
- 상단바: 사용자 메뉴, 검색, 알림 (56px)
- 메인 영역: 2단 또는 3단 분할 (워크플로우 단계에 따라)

### 8.3 색상 팔레트
```css
--primary: #2563eb;      /* 신뢰감 있는 파랑 */
--secondary: #0891b2;    /* 교육 보조 */
--accent: #f59e0b;       /* 중요 액션 */
--success: #16a34a;
--warning: #ea580c;
--danger: #dc2626;
--neutral-bg: #f8fafc;
```

---

## 9. 개발 디렉터리 구조 (Suggested Directory Layout)

```
obild/
├── .github/workflows/        # CI/CD
│   └── deploy.yml
├── public/
│   ├── ttl/                  # 초기 TTL 파일 (오프라인 fallback)
│   │   ├── 사회과.ttl
│   │   ├── 가네.ttl
│   │   ├── text.ttl
│   │   └── readstrategy.ttl
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (auth)/           # 로그인/회원가입
│   │   ├── (admin)/          # 관리자 라우트 그룹
│   │   ├── (teacher)/        # 교사 라우트 그룹
│   │   └── api/              # Next.js API 라우트 (프록시)
│   ├── components/
│   │   ├── ui/               # shadcn 컴포넌트
│   │   ├── curriculum/
│   │   ├── reading/
│   │   ├── strategy/
│   │   └── lesson-plan/
│   ├── lib/
│   │   ├── firebase/         # Firebase 초기화·헬퍼
│   │   ├── ontology/
│   │   │   ├── loader.ts     # TTL 파일 로드 및 캐시
│   │   │   ├── parser.ts     # N3.js 래퍼
│   │   │   ├── queries.ts    # SPARQL 쿼리 모음
│   │   │   ├── mappings.ts   # 매핑 규칙 상수
│   │   │   └── inference.ts  # 통합 추론 엔진
│   │   ├── llm/
│   │   │   ├── gemini.ts
│   │   │   └── prompts/
│   │   └── export/
│   │       └── pdf.ts
│   ├── stores/               # Zustand
│   └── types/                # 공통 TypeScript 타입
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── setUserRole.ts
│   │   ├── validateTtl.ts
│   │   └── generateReading.ts
│   └── package.json
├── firestore.rules
├── storage.rules
├── firebase.json
├── .firebaserc
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. 개발 단계별 수행 지침 (Development Phases)

### Phase 0: 환경 준비 (Day 1)
1. `pnpm create next-app@latest obild --typescript --tailwind --app`
2. shadcn/ui 초기화 (`pnpm dlx shadcn@latest init`)
3. Firebase 프로젝트 생성, Emulator Suite 설치
4. `pnpm add rdflib n3 zustand firebase lucide-react`
5. Pretendard 폰트 설치

### Phase 1: 온톨로지 로더 (Day 2–3)
- 4개 TTL 파일을 `public/ttl/`에 배치
- `src/lib/ontology/loader.ts` 작성:
  - 브라우저에서 fetch → N3.js로 파싱 → IndexedDB 캐시
- `src/lib/ontology/queries.ts` 작성:
  - `getLearningAreas(subject)`, `getContentElements(area)`, `getStrategiesForFunction(fn)` 등 20여 개
- **단위 테스트:** Vitest로 각 쿼리 검증

### Phase 2: 인증 및 라우팅 (Day 4)
- Firebase Auth 설정 (Emulator)
- 가상 이메일 변환 로직
- 라우트 보호 미들웨어
- 로그인/회원가입/승인 대기 페이지

### Phase 3: 교사 포털 핵심 플로우 (Day 5–8)
- 교육과정 탐색기
- 읽기자료 생성기 (Gemini 연동)
- 독서전략 추천기
- 가네 지도안 작성기

### Phase 4: 관리자 포털 (Day 9–11)
- TTL 파일 CRUD
- 사용자 관리
- 매핑 규칙 편집기
- 통계 대시보드

### Phase 5: 내보내기·공유 (Day 12)
- PDF 내보내기
- 공유 링크
- 북마크

### Phase 6: 오프라인 테스트 → 배포 (Day 13–14)
- Firebase Emulator로 end-to-end 테스트
- GitHub Actions로 Firebase Hosting 자동 배포 설정
- 환경 변수 분리 (`.env.local` / `.env.production`)

### Phase 7: 교과 확장 (Day 15+)
- `과학.ttl`, `국어.ttl` 등 추가 교과 TTL 작성
- `/subjects/{subjectId}` 레코드 추가만으로 신규 교과 활성화되도록 설계

---

## 11. 테스트 전략 (Testing)

| 레벨 | 도구 | 범위 |
|------|------|------|
| 단위 | Vitest | SPARQL 쿼리 결과, 매핑 함수, 유틸리티 |
| 통합 | Vitest + Testing Library | 컴포넌트 상호작용 |
| E2E | Playwright | 로그인 → 지도안 생성 → PDF 내보내기 |
| 보안 규칙 | `@firebase/rules-unit-testing` | Firestore 규칙 통과·거부 케이스 |

---

## 12. 비기능 요구사항 (Non-Functional Requirements)

### 12.1 성능
- 초기 TTL 파싱: 2초 이내 (최초 1회, 이후 IndexedDB)
- 읽기자료 생성 요청: 10초 이내 응답 (Gemini Flash)
- Lighthouse Performance Score: 85+

### 12.2 접근성
- WCAG 2.1 AA 준수
- 스크린 리더 라벨 완비
- 색상 대비 4.5:1 이상

### 12.3 국제화 (I18n)
- MVP: 한국어 전용
- 향후 확장을 위해 `next-intl` 구조만 미리 세팅

### 12.4 로깅·감사
- 관리자 작업(TTL 수정, 사용자 승인)은 `/auditLogs` 컬렉션에 기록
- 민감 정보(비밀번호, API 키) 로깅 금지

---

## 13. 환경 변수 (Environment Variables)

`.env.local` 템플릿:
```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Emulator (로컬 테스트)
NEXT_PUBLIC_USE_EMULATOR=true
NEXT_PUBLIC_EMULATOR_HOST=localhost

# Gemini (서버 전용 — NEXT_PUBLIC 접두사 금지)
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 14. GitHub 배포 플로우

### 14.1 브랜치 전략
- `main`: 운영 (자동 배포)
- `develop`: 통합 테스트
- `feature/*`: 기능 개발

### 14.2 GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)
핵심 단계:
1. pnpm 캐시 복원
2. `pnpm install --frozen-lockfile`
3. `pnpm test`
4. `pnpm build`
5. Firebase Hosting 배포 (`firebase-tools` + 서비스 계정 키 Secret)
6. Firestore 규칙·Functions 배포

### 14.3 GitHub Secrets 필요 항목
- `FIREBASE_SERVICE_ACCOUNT`
- `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`

---

## 15. TTL 파일 수정·보완 기능 상세

### 15.1 수정 가능 범위 (관리자 전용)
- 라벨(`rdfs:label`) 번역·오타 수정
- 설명(`ex:description` 등 리터럴) 보완
- 새로운 인스턴스 추가 (예: 새 독서전략)
- 매핑 관계 추가·수정

### 15.2 수정 금지 항목 (안전장치)
- 네임스페이스 접두사 변경
- 기존 URI 삭제 (지도안이 참조 중일 수 있음)
- 클래스·속성 정의 삭제

### 15.3 수정 UI
- 모나코 에디터 좌측 패널
- 우측 패널: 실시간 트리플 수 비교, 삭제된 URI 경고
- 저장 전 `validateTtl` Cloud Function 호출로 서버 측 검증

---

## 16. 향후 확장 로드맵 (Future Roadmap)

| 우선순위 | 항목 |
|---------|------|
| ★★★ | 교과 추가 (국어·과학·영어) |
| ★★★ | HWPX 내보내기 (한컴오피스 포맷) |
| ★★ | 교사 간 지도안 공유 커뮤니티 |
| ★★ | 학생 자가학습 모드 |
| ★ | SPARQL Endpoint 공개 (연구용) |
| ★ | 수업 결과 피드백 수집 → 매핑 규칙 자동 개선 |

---

## 17. Antigravity 2.0 에이전트 지시사항

**이 파일(`LIS_Instructional_Design_System_Guide.md`)과 4개 TTL 파일을 함께 받으면 다음 순서로 작업하라:**

1. **파일 전수 검토:** TTL 4개의 접두사·클래스·관계를 모두 파싱하여 요약 보고
2. **매핑 규칙 확정 요청:** 섹션 4.3의 매핑 테이블을 사용자에게 확인받기
3. **Phase 0부터 순차 진행:** 각 Phase 완료 시 체크포인트에서 사용자 확인
4. **코드 생성 원칙:**
   - 모든 함수에 JSDoc 작성
   - 한국어 변수명은 금지, 한국어 라벨은 상수 파일에 분리
   - 매직 넘버 금지, 상수화
   - 에러 메시지는 한국어로 사용자에게 노출
5. **TTL 접두사 충돌 해결:** 통합 그래프 로드 시 반드시 재바인딩
6. **보안 우선:** Firebase 규칙 작성 없이 Firestore 접근 코드 생성 금지
7. **커밋 메시지:** Conventional Commits 규격, 한국어 본문 허용
8. **의문점은 즉시 질문:** 추측으로 구조 결정하지 말고 사용자에게 확인

---

**문서 끝 — 작업 시작 전 이 가이드와 TTL 파일 4종을 모두 읽었음을 확인하라.**
