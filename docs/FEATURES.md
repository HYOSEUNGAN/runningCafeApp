# Run View - 기능 명세서

## 📋 프로젝트 개요

**프로젝트명**: Run View  
**목적**: 러닝과 지도를 결합하여 스마트한 러닝 경험과 기록 관리를 제공  
**타겟 사용자**: 20~30대 MZ세대, 러닝을 즐기는 모든 사용자  
**기술 스택**: React 19.1.1, Supabase, Zustand, Tailwind CSS, 네이버 지도 API

---

## 🎯 핵심 기능

### 1. 사용자 관리 (Authentication)

#### 1.1 회원가입

- **기능**: 이메일/비밀번호 기반 회원가입
- **필수 정보**: 이메일, 비밀번호, 닉네임
- **선택 정보**: 프로필 이미지, 러닝 경험 수준, 선호 거리
- **유효성 검사**:
  - 이메일 형식 검증
  - 비밀번호 강도 검증 (8자 이상, 영문+숫자 포함)
  - 닉네임 중복 검사

#### 1.2 로그인/로그아웃

- **기능**: 이메일/비밀번호 로그인
- **추가 기능**:
  - 자동 로그인 (세션 유지)
  - 비밀번호 찾기
  - 소셜 로그인 (Google, 카카오 - 추후 구현)

#### 1.3 프로필 관리

- **기능**: 사용자 정보 수정
- **수정 가능 항목**: 닉네임, 프로필 이미지, 러닝 목표, 선호 카페 스타일

---

### 2. 러닝 코스 관리

#### 2.1 러닝 코스 탐색

- **기능**: 지역별 러닝 코스 검색 및 탐색
- **필터링**:
  - 거리별 (1km, 3km, 5km, 10km+)
  - 난이도별 (초급, 중급, 고급)
  - 지역별 (현재 위치 기준 반경)
  - 태그별 (공원, 강변, 도심, 산책로)
- **정렬**: 인기순, 거리순, 최신순, 평점순

#### 2.2 러닝 코스 상세 정보

- **코스 정보**:
  - 코스 이름, 거리, 예상 소요시간
  - 시작점/종료점 위치
  - 고도 정보 및 코스 지도
  - 난이도 및 추천 대상
- **사용자 리뷰**:
  - 평점 (1-5점)
  - 후기 및 팁
  - 사진 첨부
- **통계 정보**:
  - 완주자 수
  - 평균 완주 시간
  - 월별/계절별 인기도

#### 2.3 러닝 기록

- **기능**: 러닝 완주 기록 저장
- **기록 정보**:
  - 코스명, 완주 시간, 날짜
  - GPS 경로 (선택적)
  - 개인 메모 및 사진
  - 기분/컨디션 점수

---

### 3. 카페 정보 관리

#### 3.1 카페 탐색

- **기능**: 러닝 코스 주변 카페 검색
- **필터링**:
  - 러닝 코스별 근처 카페
  - 카페 타입 (커피 전문점, 베이커리, 브런치)
  - 편의시설 (WiFi, 콘센트, 주차, 샤워실)
  - 영업시간 (24시간, 새벽 운영 등)
- **거리 정보**: 러닝 코스 종료점에서의 도보 거리

#### 3.2 카페 상세 정보

- **기본 정보**:
  - 카페명, 주소, 연락처, 영업시간
  - 메뉴 및 가격 정보
  - 편의시설 목록
- **사용자 리뷰**:
  - 평점 및 후기
  - 러너 친화도 점수
  - 추천 메뉴 및 팁
- **사진**: 카페 외관, 내부, 메뉴 사진

#### 3.3 카페 추천

- **개인화 추천**:
  - 사용자의 러닝 패턴 기반
  - 선호하는 카페 스타일 기반
  - 과거 방문 이력 기반
- **상황별 추천**:
  - 러닝 후 회복 메뉴
  - 날씨별 추천 카페
  - 시간대별 추천

---

### 4. 소셜 기능

#### 4.1 커뮤니티

- **러닝 모임**:
  - 지역별 러닝 그룹 생성/참여
  - 정기 러닝 일정 관리
  - 그룹 채팅 (추후 구현)
- **게시판**:
  - 러닝 팁 공유
  - 카페 추천 및 후기
  - 질문/답변

#### 4.2 소셜 공유

- **기록 공유**:
  - 러닝 완주 인증
  - 카페 방문 인증
  - SNS 연동 공유
- **친구 기능**:
  - 친구 추가/관리
  - 친구 활동 피드
  - 함께 러닝한 기록

---

### 5. 개인 대시보드

#### 5.1 러닝 통계

- **개인 기록**:
  - 총 러닝 거리, 횟수, 시간
  - 월별/연별 통계
  - 개인 베스트 기록
- **목표 관리**:
  - 월간/연간 목표 설정
  - 진행률 추적
  - 달성 배지 시스템

#### 5.2 카페 방문 기록

- **방문 이력**:
  - 방문한 카페 목록
  - 즐겨찾는 카페
  - 카페별 방문 횟수
- **추천 시스템**:
  - 개인 취향 분석
  - 새로운 카페 추천
  - 계절별 추천 메뉴

---

## 🔧 기술적 구현 사항

### 데이터베이스 스키마 (Supabase)

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  nickname VARCHAR UNIQUE NOT NULL,
  avatar_url TEXT,
  running_level VARCHAR DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 러닝 코스 테이블
CREATE TABLE running_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  distance DECIMAL NOT NULL,
  difficulty VARCHAR NOT NULL,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  route_data JSONB,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 카페 테이블
CREATE TABLE cafes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  address TEXT NOT NULL,
  location JSONB NOT NULL,
  phone VARCHAR,
  hours JSONB,
  amenities TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 러닝 기록 테이블
CREATE TABLE running_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  course_id UUID REFERENCES running_courses(id) NOT NULL,
  completed_time INTEGER NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  notes TEXT,
  photos TEXT[],
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5)
);

-- 카페 리뷰 테이블
CREATE TABLE cafe_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  cafe_id UUID REFERENCES cafes(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  runner_friendly_score INTEGER CHECK (runner_friendly_score >= 1 AND runner_friendly_score <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API 엔드포인트

#### 인증 관련

- `POST /auth/signup` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `GET /auth/user` - 현재 사용자 정보
- `PUT /auth/user` - 사용자 정보 수정

#### 러닝 코스 관련

- `GET /courses` - 러닝 코스 목록 조회
- `GET /courses/:id` - 러닝 코스 상세 조회
- `POST /courses` - 러닝 코스 생성
- `GET /courses/:id/reviews` - 코스 리뷰 목록

#### 카페 관련

- `GET /cafes` - 카페 목록 조회
- `GET /cafes/:id` - 카페 상세 조회
- `GET /cafes/nearby` - 주변 카페 조회
- `POST /cafes/:id/reviews` - 카페 리뷰 작성

#### 기록 관련

- `POST /records` - 러닝 기록 저장
- `GET /records` - 개인 러닝 기록 조회
- `GET /records/stats` - 개인 통계 조회

---

## 🎨 UI/UX 가이드라인

### 디자인 시스템

- **컬러**: 보라색 그라데이션 (#A259FF ~ #6A82FB) 메인
- **폰트**: Pretendard, Noto Sans KR
- **컴포넌트**: 카드 기반 레이아웃, 둥근 모서리
- **반응형**: 모바일 퍼스트 디자인

### 주요 화면 구성

1. **홈페이지**: 브랜드 소개, 주요 기능 안내
2. **러닝 코스 페이지**: 지도 기반 코스 탐색
3. **카페 페이지**: 카드 기반 카페 목록
4. **마이페이지**: 개인 통계 및 기록 관리
5. **커뮤니티**: 게시판 및 모임 관리

---

## 📱 모바일 최적화

### PWA (Progressive Web App) 기능

- **오프라인 지원**: 기본 기능 오프라인 사용 가능
- **푸시 알림**: 러닝 알림, 모임 알림
- **홈 스크린 추가**: 앱처럼 사용 가능
- **위치 기반 서비스**: GPS를 활용한 코스 추적

### 성능 최적화

- **이미지 최적화**: WebP 포맷, lazy loading
- **코드 스플리팅**: 페이지별 번들 분할
- **캐싱 전략**: 자주 사용되는 데이터 캐싱

---

## 🚀 향후 개발 계획

### Phase 1 (현재)

- ✅ 기본 UI/UX 구축
- ✅ 사용자 인증 시스템
- ✅ 기본 페이지 구조

### Phase 2 (1개월 후)

- 🔄 러닝 코스 데이터베이스 구축
- 🔄 카페 정보 연동
- 🔄 기본 검색 및 필터링 기능

### Phase 3 (2개월 후)

- 📋 러닝 기록 및 통계 기능
- 📋 리뷰 및 평점 시스템
- 📋 개인화 추천 알고리즘

### Phase 4 (3개월 후)

- 📋 소셜 기능 (모임, 커뮤니티)
- 📋 푸시 알림 시스템
- 📋 PWA 기능 완성

---

_이 문서는 Running Cafe 프로젝트의 전체적인 기능 명세를 담고 있으며, 개발 진행에 따라 지속적으로 업데이트됩니다._
