# Run View 🏃‍♀️🗺️

러닝과 지도를 결합한 스마트 러닝 앱 - React 기반 웹 애플리케이션

## 🚀 빠른 시작

### 1. 프로젝트 설정

```bash
# 프로젝트 클론 후
cd runview

# 의존성 설치 및 초기 설정
npm run setup
# 또는
bun setup
```

### 2. 네이버 지도 API 설정

네이버 지도를 사용하기 위해 API 키를 발급받아야 합니다:

1. **네이버 클라우드 플랫폼 가입**
   - [https://www.ncloud.com](https://www.ncloud.com)에서 회원가입
   - 본인 인증 및 결제 수단 등록 (무료 사용량 내에서는 과금되지 않음)

2. **Maps API 신청**
   - 콘솔 > Application Service > Maps 메뉴로 이동
   - 웹 동적 지도 API 신청
   - 도메인 등록 (개발 시: `localhost:3000`, `127.0.0.1:3000`)

3. **API 키 설정**
   - `public/index.html` 파일에서 `YOUR_CLIENT_ID`를 실제 클라이언트 ID로 변경:
   ```html
   <script
     type="text/javascript"
     src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=실제_클라이언트_ID"
   ></script>
   ```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Run View 환경변수
REACT_APP_NAME=Run View
REACT_APP_VERSION=0.1.0
REACT_APP_ENVIRONMENT=development

# 네이버 지도 API (필수)
REACT_APP_NAVER_MAP_CLIENT_ID=your_naver_map_client_id

# 네이버 검색 API (서버에서 사용, 주변 카페 검색용)
NAVER_CLIENT_ID=your_naver_search_client_id
NAVER_CLIENT_SECRET=your_naver_search_client_secret

# Supabase 설정 (https://supabase.com에서 프로젝트 생성 후 설정)
REACT_APP_SUPABASE_URL=https://hdummdjaakiihhwfroub.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# API 설정
REACT_APP_API_BASE_URL=http://localhost:3000/api

# 기타 설정
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=info
GENERATE_SOURCEMAP=true

# 카카오 OAuth 설정 (Supabase에서 자동 처리되므로 선택사항)
# REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id
# REACT_APP_KAKAO_REDIRECT_URI=https://hdummdjaakiihhwfroub.supabase.co/auth/v1/callback
```

> **중요**: 네이버 검색 API는 보안상 서버에서만 호출해야 합니다. 클라이언트 시크릿을 브라우저에 노출하면 안됩니다.

### 4. 카카오 로그인 설정 (Supabase)

카카오 소셜 로그인을 위해 Supabase에서 다음과 같이 설정하세요:

1. **Supabase 대시보드**에서 Authentication > Providers로 이동
2. **Kakao** 활성화
3. **카카오 개발자 콘솔**에서 설정:
   - Client ID: `MsbPUHKPdZ8pSlFKikKJdSOHrSg6OQFH` (예시)
   - Client Secret: `MsbPUHKPdZ8pSlFKikKJdSOHrSg6OQFH` (예시)
   - Redirect URI: `https://hdummdjaakiihhwfroub.supabase.co/auth/v1/callback`

### 5. 개발 서버 실행

```bash
npm start
# 또는
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## ✨ 주요 기능

### 🏃‍♂️ 러닝 네비게이션 (`/navigation`)

- **실시간 GPS 추적**: 정확한 위치 기반 경로 추적
- **경로 그리기**: 이동 경로를 지도에 실시간으로 표시
- **운동 통계**: 거리, 시간, 칼로리, 속도 실시간 계산
- **지도 기반 러닝**: 네이버 지도 API를 활용한 정확한 위치 서비스
- **러닝 기록 저장**: 완료된 운동 기록을 데이터베이스에 저장
- **피드 공유**: 운동 결과를 피드에 자동 공유

### 📱 소셜 피드 시스템 (`/feed`)

- **러닝 기록 공유**: 운동 완료 후 피드에 자동 공유 옵션
- **실시간 피드**: 다른 러너들의 운동 기록을 실시간으로 확인
- **좋아요 & 댓글**: 다른 러너들과 소통하고 응원
- **해시태그**: 러닝 기록에 해시태그 추가로 분류 및 검색

### 🏆 월별 챌린지 시스템

- **다양한 챌린지**: 거리, 횟수, 시간 기반 월별 도전 과제
- **실시간 진행률**: 챌린지 참여 후 실시간 달성률 확인
- **배지 시스템**: 챌린지 완료 시 배지 획득
- **보상 포인트**: 챌린지 완료 시 포인트 지급

### 📊 개인 대시보드 (`/record`)

- **러닝 기록 관리**: 개인별 운동 기록 저장 및 조회
- **달력 뷰**: 날짜별 러닝 기록을 달력에서 직관적으로 확인
- **월별 통계**: 총 거리, 시간, 평균 페이스, 칼로리 등 상세 통계
- **기록 상세보기**: 각 러닝 세션의 상세 정보 및 경로 확인

### 👤 사용자 프로필 (`/profile`)

- **카카오 소셜 로그인**: Supabase 통합 간편 로그인
- **프로필 관리**: 표시명, 자기소개 등 개인 정보 수정
- **러닝 통계**: 총 거리, 러닝 횟수, 총 시간, 평균 페이스
- **완료한 챌린지**: 획득한 배지 및 챌린지 이력 관리
- **최근 활동**: 최근 러닝 기록 및 활동 내역

### 🗺️ 지도 기능

- **네이버 지도 통합**: 한국 지역에 최적화된 정확한 지도 서비스
- **러닝 경로 표시**: 실시간 러닝 경로를 지도에 직관적으로 표시
- **위치 기반 서비스**: 현재 위치 자동 감지 및 지도 중심 이동
- **코스 추천**: 인기 러닝 코스 및 경로 추천 기능

## 📦 기술 스택

- **Frontend**: React 19.1.1, React Router DOM 7.9.1
- **상태관리**: Zustand 5.0.8
- **스타일링**: Tailwind CSS 3.4.17
- **지도 서비스**: 네이버 지도 API v3, 네이버 검색 API
- **위치 서비스**: HTML5 Geolocation API
- **폼 관리**: React Hook Form 7.63.0
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth (카카오 OAuth)
- **유틸리티**: date-fns, uuid, zod
- **아이콘**: Lucide React
- **테스팅**: React Testing Library, Jest

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트 (LoadingSpinner, Modal, Toast)
│   ├── challenge/      # 챌린지 관련 컴포넌트
│   │   ├── ChallengeCard.js   # 챌린지 카드 컴포넌트
│   │   └── ChallengeSection.js # 챌린지 섹션
│   ├── forms/          # 폼 컴포넌트
│   ├── home/           # 홈 페이지 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트 (Navigation, Header)
│   ├── map/            # 지도 관련 컴포넌트
│   │   ├── MapContainer.js    # 네이버 지도 메인 컨테이너
│   │   ├── MapHeader.js       # 지도 헤더 (검색, 위치 버튼)
│   │   ├── BottomSheet.js     # 카페 정보 바텀시트
│   │   ├── CafeCard.js        # 카페 카드 컴포넌트
│   │   └── FilterTabs.js      # 필터 탭
│   └── ui/             # UI 컴포넌트 (Button, Card, Input)
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.js     # 홈 페이지 (챌린지 섹션 포함)
│   ├── MapPage.js      # 지도 페이지 (GPS + 네이버 지도)
│   ├── NavigationPage.js # 러닝 네비게이션 페이지
│   ├── RecordPage.js   # 러닝 기록 페이지 (달력 뷰)
│   ├── FeedPage.js     # 소셜 피드 페이지
│   ├── ProfilePage.js  # 사용자 프로필 페이지
│   ├── LoginPage.js    # 로그인 페이지
│   └── AuthCallbackPage.js # 인증 콜백 페이지
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
│   ├── useAppStore.js  # 앱 전역 상태
│   └── useAuthStore.js # 인증 상태
├── services/           # API 서비스
│   ├── supabase.js     # Supabase 클라이언트
│   ├── authService.js  # 인증 서비스
│   ├── userProfileService.js # 사용자 프로필 서비스
│   ├── runningRecordService.js # 러닝 기록 서비스 (새 스키마)
│   ├── feedService.js  # 피드 시스템 서비스
│   ├── challengeService.js # 챌린지 시스템 서비스
│   ├── cafeService.js  # 카페 검색 서비스
│   ├── runningService.js # 러닝 기록 서비스 (레거시)
│   └── naverApiService.js # 네이버 API 서비스
├── utils/              # 유틸리티 함수
│   ├── location.js     # GPS, 거리 계산, 위치 관련 유틸리티
│   ├── format.js       # 데이터 포맷팅
│   └── validation.js   # 유효성 검사
├── constants/          # 상수
│   └── app.js         # 앱 상수 (라우트, 설정값)
└── assets/             # 이미지, 아이콘 등
```

## 🛠️ 사용 가능한 스크립트

프로젝트 디렉토리에서 다음 명령어들을 실행할 수 있습니다:

### `npm run setup` 또는 `bun setup`

프로젝트 초기 설정을 수행합니다. 의존성을 설치하고 환경변수 설정을 안내합니다.

### `npm start` 또는 `npm run dev`

개발 모드로 앱을 실행합니다. [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.
코드 변경 시 자동으로 새로고침되며, 린트 오류도 콘솔에서 확인할 수 있습니다.

### `npm test`

대화형 테스트 러너를 실행합니다.

### `npm run build`

프로덕션용 빌드를 생성합니다. `build` 폴더에 최적화된 파일들이 생성됩니다.

### `npm run lint`

ESLint를 실행하여 코드 스타일을 검사하고 자동으로 수정합니다.

### `npm run format`

Prettier를 사용하여 코드를 포맷팅합니다.

## 🔧 개발 환경 설정

### 권장 도구

- **Node.js**: 18.x 이상
- **패키지 매니저**: npm 또는 bun
- **에디터**: VS Code (권장)
- **브라우저**: Chrome, Firefox, Safari 최신 버전

### VS Code 확장 프로그램 (권장)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

## 🏗️ 개발 가이드라인

### 코딩 컨벤션

- **컴포넌트**: PascalCase (`MenuCard.js`)
- **변수/함수**: camelCase (`menuItems`, `handleSubmit`)
- **상수**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **CSS 클래스**: kebab-case (`menu-card`)

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 업무 수정

예시:
feat: 메뉴 카드 컴포넌트 추가
fix: 주문 폼 유효성 검사 오류 수정
```

## 🐛 트러블슈팅

### 자주 발생하는 문제들

1. **의존성 설치 오류**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **포트 충돌 (3000번 포트가 이미 사용 중)**

   ```bash
   # 다른 포트로 실행
   PORT=3001 npm start
   ```

3. **환경변수가 로드되지 않음**
   - `.env` 파일이 프로젝트 루트에 있는지 확인
   - 환경변수명이 `REACT_APP_`로 시작하는지 확인
   - 서버 재시작 필요

4. **네이버 지도가 로드되지 않음**
   - `public/index.html`의 네이버 지도 API 키 확인
   - 네이버 클라우드 플랫폼에서 도메인 등록 확인
   - 브라우저 개발자 도구에서 네트워크 오류 확인

5. **GPS 위치 정보를 가져올 수 없음**
   - 브라우저에서 위치 권한 허용 확인
   - HTTPS 환경에서 테스트 (일부 브라우저는 HTTP에서 위치 서비스 제한)
   - 모바일에서는 위치 서비스 활성화 확인

6. **러닝 기록이 저장되지 않음**
   - 로그인 상태 확인 (로그인 필수)
   - Supabase 데이터베이스 연결 상태 확인
   - 브라우저 개발자 도구에서 API 호출 오류 확인

7. **주변 카페가 표시되지 않음**
   - 네이버 검색 API 키 설정 확인
   - 서버 엔드포인트 구현 필요 (`/api/naver/search/local`)
   - 현재 위치 권한 허용 확인

## 🚀 사용법

### 러닝 네비게이션 사용하기

1. **네비게이션 페이지 접근**: 메뉴에서 "러닝 네비" 클릭 또는 `/nav` 경로로 이동
2. **위치 권한 허용**: 브라우저에서 위치 정보 액세스 권한 허용
3. **운동 시작**: "시작" 버튼을 눌러 GPS 추적 시작
4. **실시간 모니터링**: 지도에서 이동 경로와 통계 정보 확인
5. **일시정지/재개**: 필요 시 운동을 일시정지하고 재개 가능
6. **운동 완료**: "정지" 버튼으로 운동 종료
7. **기록 저장**: 로그인 후 "저장" 버튼으로 운동 기록 저장
8. **SNS 공유**: "공유" 버튼으로 운동 결과를 소셜 미디어에 공유

### 주요 화면 구성

- **상단 헤더**: 페이지 제목, 공유 버튼
- **통계 카드**: 시간, 거리, 칼로리, 속도 실시간 표시
- **지도 영역**: 네이버 지도, 이동 경로, 카페 마커
- **주변 카페 리스트**: 1km 반경 내 카페 정보 (이름, 주소, 거리)
- **컨트롤 버튼**: 시작/정지/일시정지, 저장 버튼

## 📚 추가 자료

- [React 공식 문서](https://reactjs.org/)
- [네이버 지도 API 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/)
- [네이버 클라우드 플랫폼](https://www.ncloud.com/product/applicationService/maps)
- [HTML5 Geolocation API](https://developer.mozilla.org/ko/docs/Web/API/Geolocation_API)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

**Run View** - 러닝과 지도를 결합한 스마트 러닝 앱 🏃‍♂️🗺️
