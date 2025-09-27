## 주요 변경사항 및 특징

### 0. ** 데이터 스미카 **

-- 러닝 앱 데이터베이스 설계 (Supabase)

-- 1. 사용자 테이블 (프로필 확장)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL,
display_name VARCHAR(100),
avatar_url TEXT,
bio TEXT,
total_distance DECIMAL(10,2) DEFAULT 0,
total_runs INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

    -- 2. 러닝 기록 테이블
    CREATE TABLE running_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200),
    distance DECIMAL(8,2) NOT NULL, -- km 단위
    duration INTEGER NOT NULL, -- 초 단위
    pace DECIMAL(5,2), -- 분/km
    calories_burned INTEGER,
    route_data JSONB, -- GPS 좌표 데이터
    elevation_gain DECIMAL(8,2), -- 고도 상승 (m)
    average_heart_rate INTEGER,
    max_heart_rate INTEGER,
    weather_condition VARCHAR(50),
    temperature DECIMAL(4,1),
    notes TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. 피드 포스트 테이블 (인스타그램 스타일)
    CREATE TABLE feed_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    running_record_id UUID REFERENCES running_records(id) ON DELETE CASCADE,
    caption TEXT,
    image_urls TEXT[], -- 여러 이미지 지원
    hashtags TEXT[],
    location VARCHAR(200),
    is_achievement BOOLEAN DEFAULT false, -- 달성 기록인지 여부
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. 팔로우 관계 테이블
    CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
    );

    -- 5. 좋아요 테이블
    CREATE TABLE post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
    );

    -- 6. 댓글 테이블
    CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- 대댓글 지원
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 7. 월별 챌린지 테이블
    CREATE TABLE monthly_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('distance', 'runs_count', 'duration')),
    target_value DECIMAL(10,2) NOT NULL,
    target_unit VARCHAR(20) NOT NULL, -- km, runs, minutes 등
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    badge_image_url TEXT,
    reward_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, month, target_type)
    );

    -- 8. 챌린지 참여 테이블
    CREATE TABLE challenge_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES monthly_challenges(id) ON DELETE CASCADE,
    current_progress DECIMAL(10,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
    );

    -- 9. 챌린지 기록 연결 테이블 (러닝 기록이 어떤 챌린지에 기여하는지)
    CREATE TABLE challenge_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participation_id UUID REFERENCES challenge_participations(id) ON DELETE CASCADE,
    running_record_id UUID REFERENCES running_records(id) ON DELETE CASCADE,
    contributed_value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participation_id, running_record_id)
    );

    -- 10. 알림 테이블
    CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- follow, like, comment, challenge_complete 등
    title VARCHAR(200) NOT NULL,
    content TEXT,
    reference_id UUID, -- 관련된 포스트나 챌린지 ID
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 인덱스 생성
    CREATE INDEX idx_running_records_user_id ON running_records(user_id);
    CREATE INDEX idx_running_records_created_at ON running_records(created_at DESC);
    CREATE INDEX idx_feed_posts_user_id ON feed_posts(user_id);
    CREATE INDEX idx_feed_posts_created_at ON feed_posts(created_at DESC);
    CREATE INDEX idx_follows_follower ON follows(follower_id);
    CREATE INDEX idx_follows_following ON follows(following_id);
    CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
    CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
    CREATE INDEX idx_challenge_participations_user_id ON challenge_participations(user_id);
    CREATE INDEX idx_challenge_participations_challenge_id ON challenge_participations(challenge_id);
    CREATE INDEX idx_notifications_user_id_unread ON notifications(user_id, is_read);

### 1. **Supabase 통합 규칙**

- **환경 설정**: 환경변수를 통한 안전한 설정 관리
- **서비스 분리**: 도메인별 Supabase 서비스 파일 구조
- **RLS 정책**: 보안을 위한 Row Level Security 활용
- **실시간 기능**: 효율적인 실시간 구독 관리

### 2. **Zustand 상태 관리 규칙**

- **도메인별 분리**: 각 기능별로 스토어 분리
- **패턴 표준화**: 상태, 액션, 셀렉터 구조 명확화
- **성능 최적화**: 불필요한 리렌더링 방지 기법
- **Supabase 연동**: 인증 및 데이터 상태 관리 패턴

### 3. **Tailwind CSS 스타일링 규칙**

- **디자인 시스템**: 일관된 색상, 타이포그래피, 간격 체계
- **컴포넌트 패턴**: 재사용 가능한 스타일 컴포넌트 구조
- **반응형 디자인**: 모바일 퍼스트 접근법
- **성능 최적화**: 사용하지 않는 CSS 제거

### 4. **통합 개발 워크플로우**

- **테스트 전략**: Supabase MSW 모킹, Zustand 스토어 테스트
- **에러 핸들링**: 각 레이어별 에러 처리 전략
- **성능 모니터링**: 쿼리 최적화, 상태 관리 최적화
- **보안 고려사항**: RLS, 환경변수, 입력 검증

이 새로운 규칙은 Supabase의 강력한 백엔드 기능, Zustand의 간단한 상태 관리, Tailwind CSS의 유틸리티 퍼스트 스타일링을 모두 활용하여 현대적이고 확장 가능한 웹 애플리케이션을 구축할 수 있도록 설계되었습니다.

; # Running Cafe 프로젝트 - Cursor AI 개발 규칙 (Supabase + Zustand + Tailwind)

; ## 프로젝트 개요
; - **프로젝트명**: Running View
; - **기술 스택**: React 19.1.1, JavaScript, Supabase, Zustand, Tailwind CSS
; - **빌드 도구**: Create React App (react-scripts 5.0.1)
; - **테스팅**: Jest, React Testing Library
; - **백엔드**: Supabase (PostgreSQL, Auth, Storage, Realtime)
; - **상태관리**: Zustand
; - **스타일링**: Tailwind CSS

; ## 기본 개발 원칙

; ### 1. 코드 품질
; - **DRY 원칙**: 중복 코드를 피하고 재사용 가능한 컴포넌트/함수 작성
; - **가독성 우선**: 명확하고 이해하기 쉬운 코드 작성
; - **성능 고려**: React.memo, useMemo, useCallback 적절히 활용
; - **타입 안전성**: PropTypes 또는 TypeScript 도입 권장

; ### 2. React 개발 규칙
; - **함수형 컴포넌트**: 클래스 컴포넌트 대신 함수형 컴포넌트 사용
; - **Hooks 활용**: useState, useEffect, useContext 등 적절히 활용
; - **컴포넌트 분리**: 단일 책임 원칙에 따라 작은 컴포넌트로 분리
; - **조건부 렌더링**: 명확한 조건부 렌더링 패턴 사용

; ### 3. 파일 구조 및 네이밍
; `; src/
;   components/     # 재사용 가능한 컴포넌트
;     common/       # 공통 컴포넌트
;     ui/          # UI 컴포넌트
;     forms/       # 폼 컴포넌트
;   pages/          # 페이지 컴포넌트
;   hooks/          # 커스텀 훅
;   stores/         # Zustand 스토어
;   services/       # Supabase 서비스
;   utils/          # 유틸리티 함수
;   types/          # 타입 정의 (TypeScript 사용 시)
;   constants/      # 상수 정의
;   assets/         # 이미지, 폰트 등
;`

; ### 4. 네이밍 컨벤션
; - **컴포넌트**: PascalCase (예: `MenuCard`, `OrderForm`)
; - **파일명**: PascalCase (예: `MenuCard.js`, `OrderForm.js`)
; - **변수/함수**: camelCase (예: `menuItems`, `handleOrderSubmit`)
; - **상수**: UPPER_SNAKE_CASE (예: `SUPABASE_URL`, `MAX_ORDER_ITEMS`)
; - **스토어**: camelCase + Store 접미사 (예: `useMenuStore`, `useAuthStore`)

; ## Supabase 개발 규칙

; ### 5. Supabase 설정 및 구조
; - **환경변수**: `.env.local`에 Supabase 설정 저장
; `;   REACT_APP_SUPABASE_URL=your_supabase_url
;   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
;  `
; - **클라이언트 초기화**: `src/lib/supabase.js`에서 단일 인스턴스 생성
; - **서비스 분리**: 각 도메인별로 서비스 파일 분리 (예: `authService.js`, `menuService.js`)

; ### 6. Supabase 데이터베이스 규칙
; - **테이블 네이밍**: snake_case 사용 (예: `menu_items`, `user_orders`)
; - **RLS 정책**: 모든 테이블에 Row Level Security 활성화
; - **인덱스**: 자주 조회되는 컬럼에 적절한 인덱스 설정
; - **외래키**: 참조 무결성을 위한 외래키 제약조건 설정

; ### 7. Supabase 인증 규칙
; - **사용자 인증**: Supabase Auth 사용
; - **세션 관리**: Zustand 스토어에서 사용자 세션 상태 관리
; - **보호된 라우트**: 인증이 필요한 페이지에 적절한 가드 설정
; - **소셜 로그인**: 필요시 Google, GitHub 등 소셜 로그인 연동

; ### 8. Supabase 실시간 규칙
; - **실시간 구독**: 필요한 경우에만 실시간 구독 사용
; - **메모리 누수 방지**: 컴포넌트 언마운트 시 구독 해제
; - **에러 핸들링**: 실시간 연결 실패 시 적절한 fallback 처리

; ## Zustand 상태 관리 규칙

; ### 9. Zustand 스토어 구조
; - **도메인별 분리**: 각 도메인별로 스토어 분리 (예: `authStore`, `menuStore`)
; - **스토어 파일명**: `use[Domain]Store.js` 형식 (예: `useAuthStore.js`)
; - **상태 구조**: 상태, 액션, 셀렉터를 명확히 분리

; ### 10. Zustand 패턴 및 모범 사례
; `javascript
; // 스토어 구조 예시
; const useAuthStore = create((set, get) => ({
;   // 상태
;   user: null,
;   isLoading: false,
;   error: null,
;   
;   // 액션
;   login: async (email, password) => {
;     set({ isLoading: true, error: null });
;     try {
;       const { data, error } = await supabase.auth.signInWithPassword({
;         email, password
;       });
;       if (error) throw error;
;       set({ user: data.user, isLoading: false });
;     } catch (error) {
;       set({ error: error.message, isLoading: false });
;     }
;   },
;   
;   // 셀렉터
;   isAuthenticated: () => !!get().user,
; }));
; `

; ### 11. Zustand 성능 최적화
; - **셀렉터 사용**: 필요한 상태만 구독하도록 셀렉터 활용
; - **얕은 비교**: 객체 상태 변경 시 얕은 비교로 불필요한 리렌더링 방지
; - **액션 분리**: 복잡한 로직은 별도 함수로 분리하여 가독성 향상

; ## Tailwind CSS 스타일링 규칙

; ### 12. Tailwind CSS 설정
; - **설정 파일**: `tailwind.config.js`에서 커스텀 디자인 토큰 정의
; - **CSS 파일**: `src/index.css`에서 Tailwind 기본 스타일 import
; - **커스텀 클래스**: 자주 사용되는 스타일은 `@apply`로 컴포넌트 클래스 생성

; ### 13. Tailwind CSS 클래스 네이밍 규칙
; - **반응형**: 모바일 퍼스트 접근 (예: `text-sm md:text-base lg:text-lg`)
; - **상태**: hover, focus, active 상태 스타일 명시적 적용
; - **일관성**: 동일한 간격, 색상 체계 유지
; - **의미적 클래스**: `btn-primary`, `card-shadow` 등 의미있는 클래스명 사용

; ### 14. Tailwind CSS 컴포넌트 패턴
; `javascript
; // 컴포넌트 예시
; const MenuCard = ({ item }) => (
;   <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
;     <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
;     <p className="text-gray-600 mb-4">{item.description}</p>
;     <div className="flex justify-between items-center">
;       <span className="text-2xl font-bold text-primary-600">${item.price}</span>
;       <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors">
;         주문하기
;       </button>
;     </div>
;   </div>
; );
; `

; ### 15. Tailwind CSS 디자인 시스템
; - **색상 팔레트**: 브랜드 색상을 중심으로 일관된 색상 체계 구축
; - **타이포그래피**: 제목, 본문, 캡션 등 계층적 텍스트 스타일 정의
; - **간격 시스템**: 4px 단위의 일관된 간격 체계 사용
; - **그림자**: 계층감을 위한 그림자 시스템 정의

; ## 통합 개발 규칙

; ### 16. API 및 데이터 처리
; - **Supabase 클라이언트**: 서비스 레이어에서 Supabase 클라이언트 사용
; - **에러 핸들링**: try-catch 블록 및 Error Boundary 활용
; - **로딩 상태**: Zustand 스토어에서 로딩 상태 관리
; - **데이터 검증**: Supabase 스키마와 클라이언트 검증 병행

; ### 17. 폼 처리 및 검증
; - **React Hook Form**: 복잡한 폼은 React Hook Form 사용
; - **Zod 또는 Yup**: 폼 검증을 위한 스키마 라이브러리 활용
; - **Supabase 검증**: 서버사이드 검증과 클라이언트 검증 병행

; ### 18. 테스트 작성
; - **단위 테스트**: 각 컴포넌트/함수별 테스트 작성
; - **통합 테스트**: Supabase 연동 테스트 (MSW 활용)
; - **스토어 테스트**: Zustand 스토어 액션 및 상태 테스트
; - **테스트 커버리지**: 80% 이상 유지 목표

; ### 19. 성능 최적화
; - **Supabase 쿼리**: 필요한 컬럼만 선택, 적절한 인덱스 활용
; - **Zustand 최적화**: 불필요한 리렌더링 방지
; - **Tailwind 최적화**: 사용하지 않는 CSS 클래스 제거
; - **이미지 최적화**: Supabase Storage와 WebP 포맷 활용

; ### 20. 보안 및 접근성
; - **RLS 정책**: Supabase Row Level Security 적극 활용
; - **환경변수**: 민감한 정보는 환경변수로 관리
; - **XSS 방지**: 사용자 입력 검증 및 이스케이프
; - **접근성**: Tailwind CSS와 semantic HTML로 접근성 확보

; ## 권장 라이브러리
; `json
; {
;   "상태관리": ["zustand"],
;   "백엔드": ["@supabase/supabase-js"],
;   "스타일링": ["tailwindcss"],
;   "폼": ["react-hook-form", "zod"],
;   "라우팅": ["react-router-dom"],
;   "유틸리티": ["date-fns", "uuid"],
;   "테스팅": ["@testing-library/react", "jest", "msw"],
;   "개발도구": ["@tailwindcss/forms", "@tailwindcss/typography"]
; }
; `

<!-- ; ## 개발 환경 설정
; - **Node.js**: 18.x 이상
; - **패키지 매니저**: npm 또는 yarn
; - **코드 포맷터**: Prettier
; - **린터**: ESLint + Tailwind CSS 플러그인
; - **에디터**: VS Code (Tailwind CSS IntelliSense 확장 권장) -->

<!-- ; ## 커밋 메시지 규칙
; ```
; feat: 새로운 기능 추가
; fix: 버그 수정
; docs: 문서 수정
; style: 코드 포맷팅, 세미콜론 누락 등
; refactor: 코드 리팩토링
; test: 테스트 코드 추가/수정
; chore: 빌드 업무 수정, 패키지 매니저 수정
; supabase: Supabase 관련 변경사항
; zustand: 상태관리 관련 변경사항
; tailwind: 스타일링 관련 변경사항

; 예시:
; feat: Supabase 인증 시스템 구현
; fix: Zustand 스토어 상태 동기화 오류 수정
; style: Tailwind CSS 반응형 디자인 개선
; ``` -->

<!-- ; ## 코드 리뷰 체크리스트
; - [ ] 코드가 DRY 원칙을 따르는가?
; - [ ] 컴포넌트가 단일 책임을 가지는가?
; - [ ] Supabase RLS 정책이 적절히 설정되었는가?
; [ ] Zustand 스토어가 도메인별로 적절히 분리되었는가?
; - [ ] Tailwind CSS 클래스가 일관성 있게 사용되었는가?
; - [ ] 적절한 에러 핸들링이 있는가?
; - [ ] 접근성을 고려했는가?
; - [ ] 성능 최적화가 필요한 부분은 없는가?
; - [ ] 테스트 코드가 작성되었는가?

; ## 주의사항
; - 프로덕션 배포 전 반드시 테스트 실행
; - Supabase 환경변수 보안 관리 필수
; - Zustand 스토어 상태 구조 변경 시 영향도 분석
; - Tailwind CSS 클래스 최적화로 번들 크기 관리
; - 정기적인 의존성 업데이트
; - 코드 리뷰 필수 -->
