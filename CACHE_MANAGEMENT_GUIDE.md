# 캐시 관리 및 업데이트 가이드

## 개요

Running Cafe 앱에서 브라우저 캐싱으로 인한 업데이트 반영 문제를 해결하기 위한 완전한 솔루션을 구현했습니다.

## 구현된 기능

### 1. Service Worker 캐시 관리

- **버전 기반 캐시 네이밍**: `running-cafe-v{VERSION}` 형태로 캐시 이름 관리
- **자동 캐시 무효화**: 새 버전 배포 시 기존 캐시 자동 삭제
- **강제 캐시 삭제**: 수동으로 모든 캐시를 삭제할 수 있는 기능

### 2. 업데이트 알림 시스템

- **자동 업데이트 감지**: 새 버전이 배포되면 자동으로 감지
- **사용자 친화적 알림**: 업데이트 가능 시 사용자에게 알림 표시
- **원클릭 업데이트**: 버튼 클릭으로 간편하게 업데이트 적용

### 3. 개발자 도구

- **캐시 관리 패널**: 개발 모드에서 캐시 상태 확인 및 관리
- **진단 정보**: 앱 버전, Service Worker 상태, 스토리지 사용량 확인
- **강제 새로고침**: 캐시를 무시하고 서버에서 최신 파일 로드

## 배포 시 해야 할 일

### 1. Service Worker 버전 업데이트

```javascript
// public/sw.js 파일에서 VERSION 값 변경
const VERSION = '1.0.2'; // 이 값을 새 버전으로 변경
```

### 2. package.json 버전 업데이트

```json
{
  "version": "0.1.1" // 이 값을 새 버전으로 변경
}
```

### 3. 배포 스크립트 실행

```bash
# 개발 환경에서 테스트
npm run dev

# 프로덕션 빌드
npm run build

# Android 앱 빌드 (필요한 경우)
npm run android:build
```

## 사용자 경험

### 자동 업데이트 알림

1. 새 버전이 배포되면 사용자에게 알림이 표시됩니다
2. "지금 업데이트" 버튼을 클릭하면 자동으로 새 버전이 적용됩니다
3. "나중에" 버튼으로 업데이트를 미룰 수 있습니다

### 수동 캐시 관리 (개발자 모드)

1. 개발 환경에서 RecordPage 우하단에 설정 버튼이 표시됩니다
2. 버튼을 클릭하면 캐시 관리 패널이 열립니다
3. 다음 기능들을 사용할 수 있습니다:
   - **모든 캐시 삭제**: 모든 브라우저 캐시와 스토리지 삭제
   - **강제 새로고침**: 캐시를 무시하고 서버에서 최신 파일 로드
   - **정보 새로고침**: 현재 상태 정보 다시 로드

## 기술적 세부사항

### CacheManager 클래스

```javascript
// 주요 메서드들
cacheManager.checkForUpdates(); // 업데이트 확인
cacheManager.applyUpdate(); // 업데이트 적용
cacheManager.clearAllCaches(); // 모든 캐시 삭제
cacheManager.forceReload(); // 강제 새로고침
cacheManager.diagnostics(); // 진단 정보 가져오기
```

### Service Worker 메시지 타입

```javascript
// 클라이언트 → Service Worker
'SKIP_WAITING'; // 새 SW로 즉시 전환
'CLEAR_CACHE'; // 모든 캐시 삭제
'GET_VERSION'; // 현재 SW 버전 확인

// Service Worker → 클라이언트
'SW_UPDATED'; // 새 버전 설치 완료
'CACHE_CLEARED'; // 캐시 삭제 완료
'VERSION_INFO'; // 버전 정보 응답
```

## 문제 해결

### 업데이트가 여전히 반영되지 않는 경우

1. **Service Worker 버전 확인**

   ```javascript
   // 개발자 도구 콘솔에서 실행
   navigator.serviceWorker.ready.then(reg => {
     reg.active.postMessage({ type: 'GET_VERSION' });
   });
   ```

2. **강제 캐시 삭제**
   - 개발자 모드에서 캐시 관리 패널 사용
   - 또는 브라우저 개발자 도구에서 Application > Storage > Clear storage

3. **하드 리프레시**
   - Windows/Linux: `Ctrl + Shift + R`
   - macOS: `Cmd + Shift + R`

### 프로덕션 환경에서 캐시 관리

프로덕션에서는 보안상 캐시 관리 패널이 표시되지 않습니다. 사용자가 업데이트 문제를 겪는 경우:

1. 브라우저 새로고침 안내 (`Ctrl/Cmd + Shift + R`)
2. 브라우저 캐시 수동 삭제 안내
3. 앱 재설치 안내 (모바일 앱의 경우)

## 모니터링

### 업데이트 성공률 추적

```javascript
// 업데이트 이벤트 로깅
cacheManager.addListener((eventType, data) => {
  if (eventType === 'updateAvailable') {
    // 업데이트 가능 이벤트 로깅
    console.log('Update available:', data.version);
  }
});
```

### 캐시 문제 진단

```javascript
// 진단 정보 로깅
cacheManager.diagnostics().then(info => {
  console.log('Cache diagnostics:', info);
});
```

## 향후 개선 사항

1. **자동 업데이트**: 사용자 동의 없이 백그라운드에서 자동 업데이트
2. **점진적 업데이트**: 중요하지 않은 업데이트는 점진적으로 적용
3. **업데이트 롤백**: 문제 발생 시 이전 버전으로 롤백
4. **오프라인 지원**: 오프라인 상태에서도 캐시된 버전 사용

---

이 가이드를 따라 배포하면 사용자들이 항상 최신 버전의 앱을 사용할 수 있습니다.
