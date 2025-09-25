# 이미지 업로드 기능 가이드

## 🖼️ 개요

Running Cafe 앱에 이미지 업로드 기능이 추가되었습니다. 사용자는 이제 러닝 기록과 함께 사진을 공유할 수 있습니다.

## ✨ 주요 기능

### 1. 피드 포스트 작성

- **위치**: 피드 화면 우하단 플로팅 액션 버튼(+)
- **기능**:
  - 최대 5개 이미지 업로드
  - 자동 이미지 압축 (최대 1200x1200px, 품질 80%)
  - 캡션 작성 (최대 500자)
  - 해시태그 추가 (최대 10개)
  - 위치 정보 추가

### 2. 러닝 완료 후 공유

- **위치**: 네비게이션 페이지에서 러닝 완료 후
- **흐름**:
  1. 러닝 기록 저장
  2. 공유 옵션 선택
  3. 커스텀 포스트 작성 또는 자동 공유

### 3. 이미지 표시

- **단일 이미지**: 전체 너비로 표시
- **다중 이미지**: 그리드 레이아웃
  - 2개: 2열 그리드
  - 3개: 2열 2행 (첫 번째 이미지가 2행 차지)
  - 4개 이상: 2x2 그리드 (4개 초과 시 "+N" 표시)

## 🛠️ 기술 구현

### 이미지 업로드 서비스 (`imageUploadService.js`)

```javascript
// 단일 이미지 업로드
const result = await uploadImage(file, userId, 'posts');

// 다중 이미지 업로드
const result = await uploadMultipleImages(files, userId, 'posts');

// 이미지 압축
const compressedFile = await compressImage(file, 1200, 1200, 0.8);
```

### 피드 서비스 업데이트 (`feedService.js`)

```javascript
// 이미지와 함께 포스트 생성
const postData = {
  user_id: 'user-id',
  caption: '캡션',
  images: [file1, file2], // File 객체 배열
  hashtags: ['러닝', '운동'],
  location: '위치',
};

const result = await createFeedPost(postData);
```

### 컴포넌트 구조

```
src/
├── components/
│   └── feed/
│       └── CreatePostModal.js    # 포스트 작성 모달
├── services/
│   ├── imageUploadService.js     # 이미지 업로드 서비스
│   └── feedService.js            # 피드 서비스 (업데이트)
└── pages/
    ├── FeedPage.js               # 피드 페이지 (플로팅 버튼 추가)
    └── NavigationPage.js         # 네비게이션 페이지 (공유 연동)
```

## 📋 Supabase 설정

### 1. Storage 버킷 생성

Supabase 콘솔에서 다음과 같이 버킷을 생성하세요:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

### 2. Storage 정책 설정

```sql
-- 인증된 사용자만 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'images' AND
    (storage.foldername(name))[1] = 'users' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- 모든 사용자가 이미지 조회 가능
CREATE POLICY "Images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'images' AND
    (storage.foldername(name))[1] = 'users' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
```

### 3. 버킷 설정

- **버킷명**: `images`
- **공개 액세스**: `true`
- **파일 크기 제한**: `10MB`
- **허용 파일 타입**: `image/*`

## 🔧 파일 구조

### 이미지 저장 경로

```
images/
└── users/
    └── {user_id}/
        └── posts/
            ├── {timestamp}_{random}.jpg
            ├── {timestamp}_{random}.png
            └── ...
```

### 데이터베이스 구조

```sql
-- feed_posts 테이블의 image_urls 컬럼
image_urls: text[] -- 이미지 URL 배열
```

## 🎯 사용 방법

### 1. 피드에서 직접 포스트 작성

1. 피드 페이지 접속
2. 우하단 플로팅 액션 버튼(+) 클릭
3. 이미지 추가 (선택사항)
4. 캡션, 해시태그, 위치 입력
5. "게시하기" 버튼 클릭

### 2. 러닝 완료 후 공유

1. 네비게이션에서 러닝 시작
2. 러닝 완료 후 "저장" 버튼 클릭
3. 공유 옵션에서 "사진과 함께 커스텀 포스트 작성" 선택
4. 모달에서 이미지 추가 및 내용 편집
5. "게시하기" 버튼 클릭

## 📱 UI/UX 특징

### 이미지 압축

- 자동 압축으로 업로드 속도 향상
- 원본 품질 유지하면서 파일 크기 최적화
- 10MB 이상 파일 업로드 제한

### 반응형 레이아웃

- 모바일 퍼스트 디자인
- 다양한 화면 크기 지원
- 터치 친화적 인터페이스

### 접근성

- 키보드 네비게이션 지원
- 스크린 리더 호환
- 명확한 버튼 라벨링

## 🐛 문제 해결

### 이미지 업로드 실패

1. 파일 형식 확인 (JPG, PNG, WebP, GIF만 지원)
2. 파일 크기 확인 (10MB 이하)
3. 네트워크 연결 상태 확인
4. Supabase Storage 설정 확인

### 이미지가 표시되지 않음

1. Supabase Storage 버킷 공개 설정 확인
2. 이미지 URL 유효성 확인
3. 브라우저 캐시 초기화

### 권한 오류

1. 사용자 로그인 상태 확인
2. RLS 정책 설정 확인
3. Storage 정책 적용 여부 확인

## 🔮 향후 개선 계획

1. **이미지 편집 기능**
   - 크롭, 회전, 필터 적용
   - 텍스트 오버레이

2. **고급 갤러리 기능**
   - 이미지 확대 보기
   - 스와이프 네비게이션
   - 다운로드 기능

3. **성능 최적화**
   - 지연 로딩 개선
   - CDN 연동
   - 이미지 캐싱

4. **소셜 기능**
   - 이미지에 태그 추가
   - 이미지 공유 옵션 확장
   - 이미지 기반 검색
