## 🎨 브랜드 정체성 설계 (Brand Identity)

### 1.1 브랜드 컬러 시스템

**Primary Colors (메인 브랜드 컬러)**

```css
--primary-gradient: linear-gradient(135deg, #a259ff 0%, #6a82fb 100%);
--primary-500: #a259ff;
--primary-400: #b06aff;
--primary-300: #be7bff;
--primary-200: #cc8cff;
--primary-100: #da9dff;
```

**Secondary Colors (보조 컬러)**

```css
--secondary-orange: #ffb86c;
--secondary-mint: #43e97b;
--secondary-pink: #ffd6e0;
```

**Neutral Colors (중립 컬러)**

```css
--neutral-white: #ffffff;
--neutral-50: #f5f6fa;
--neutral-100: #e8eaed;
--neutral-200: #dadce0;
--neutral-300: #bdc1c6;
--neutral-400: #9aa0a6;
--neutral-500: #80868b;
--neutral-600: #5f6368;
--neutral-700: #3c4043;
--neutral-800: #202124;
--neutral-900: #22223b;
```

**System Colors (상태 컬러)**

```css
--error: #ff4d4f;
--success: #43e97b;
--warning: #ffb86c;
--info: #6a82fb;
```

### 1.2 타이포그래피 시스템

**Font Family**

```css
font-family:
  'Pretendard',
  'Noto Sans KR',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

**Typography Scale**

```css
--text-h1: 32px/1.3/-1%; /* 페이지 타이틀 */
--text-h2: 28px/1.3/-0.5%; /* 섹션 헤딩 */
--text-h3: 24px/1.4/0%; /* 서브 헤딩 */
--text-h4: 20px/1.4/0%; /* 카드 타이틀 */
--text-body: 16px/1.5/0%; /* 본문 텍스트 */
--text-caption: 13px/1.4/0%; /* 캡션, 라벨 */
```

**Font Weights**

```css
--font-regular: 400;
--font-medium: 500;
--font-bold: 700;
```

---

## 👤 페르소나 기반 디자인 전략

### 2.1 타겟 사용자: "러닝을 즐기는 MZ세대 여성"

**디자인 원칙**

- **감성적 경험**: 부드러운 곡선, 그라데이션 활용
- **트렌디함**: 최신 디자인 트렌드 반영 (글래스모피즘, 네오모피즘)
- **소셜 중심**: 공유, 인증샷에 최적화된 UI
- **직관적 사용성**: 한 손으로 조작 가능한 모바일 퍼스트 설계

**UX 고려사항**

- 러닝 중 사용: 큰 터치 영역, 명확한 시각적 피드백
- 카페 발견: 이미지 중심의 매력적인 카드 디자인
- 소셜 기능: 쉬운 공유, 좋아요, 댓글 기능

---
