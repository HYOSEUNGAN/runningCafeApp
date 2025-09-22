# Running Cafe ☕️

러닝 카페 관리 시스템 - React 기반 웹 애플리케이션

## 🚀 빠른 시작

### 1. 프로젝트 설정

```bash
# 프로젝트 클론 후
cd runningcafe

# 의존성 설치 및 초기 설정
npm run setup
# 또는
bun setup
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Running Cafe 환경변수
REACT_APP_NAME=Running Cafe
REACT_APP_VERSION=0.1.0
REACT_APP_ENVIRONMENT=development

# Supabase 설정 (https://supabase.com에서 프로젝트 생성 후 설정)
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# API 설정
REACT_APP_API_BASE_URL=http://localhost:3000/api

# 기타 설정
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=info
GENERATE_SOURCEMAP=true
```

### 3. 개발 서버 실행

```bash
npm start
# 또는
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 📦 기술 스택

- **Frontend**: React 19.1.1, React Router DOM 7.9.1
- **상태관리**: Zustand 5.0.8
- **스타일링**: Tailwind CSS 3.4.17
- **폼 관리**: React Hook Form 7.63.0
- **데이터베이스**: Supabase
- **유틸리티**: date-fns, uuid, zod
- **아이콘**: Lucide React
- **테스팅**: React Testing Library, Jest

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── forms/          # 폼 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── ui/             # UI 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
├── constants/          # 상수
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

## 📚 추가 자료

- [React 공식 문서](https://reactjs.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

**Running Cafe** - 러닝 카페 관리를 위한 모던 웹 애플리케이션 🏃‍♂️☕️
