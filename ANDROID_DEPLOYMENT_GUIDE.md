# 🚀 Run View - Android 앱 배포 가이드

## 📱 개요

이 가이드는 React 웹앱을 Capacitor를 사용하여 Android 앱으로 변환하고 Google Play Store에 배포하는 전체 과정을 설명합니다.

## 🛠️ 준비사항

### 1. 개발 환경

- **Node.js**: 18.x 이상
- **Android Studio**: 최신 버전
- **Java JDK**: 11 이상
- **Google Play Console 계정**: 25달러 개발자 등록비

### 2. 필수 도구 설치

```bash
# Android Studio 설치 후 SDK 설정
# ANDROID_HOME 환경변수 설정 필요
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🔧 빌드 과정

### 1단계: 개발용 빌드 및 테스트

```bash
# 개발용 Android 앱 실행
npm run android:dev

# Android Studio에서 프로젝트 열기
npm run android:build
```

### 2단계: 릴리즈 빌드 생성

```bash
# 서명되지 않은 릴리즈 APK 생성
npm run android:release

# APK 파일 위치: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 3단계: APK 서명 (필수)

```bash
# 키스토어 생성 (최초 1회만)
cd android
keytool -genkey -v -keystore runview-release-key.keystore -alias runview-key-alias -keyalg RSA -keysize 2048 -validity 10000

# gradle.properties에 서명 정보 추가
echo "MYAPP_RELEASE_STORE_FILE=runview-release-key.keystore" >> gradle.properties
echo "MYAPP_RELEASE_KEY_ALIAS=runview-key-alias" >> gradle.properties
echo "MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password" >> gradle.properties
echo "MYAPP_RELEASE_KEY_PASSWORD=your_key_password" >> gradle.properties
```

### 4단계: build.gradle 설정 수정

`android/app/build.gradle` 파일에 서명 설정 추가:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### 5단계: 서명된 APK/AAB 생성

```bash
# 서명된 APK 생성
cd android && ./gradlew assembleRelease

# AAB (Android App Bundle) 생성 - Play Store 권장
cd android && ./gradlew bundleRelease
```

## 📦 Google Play Store 배포

### 1단계: Google Play Console 설정

1. [Google Play Console](https://play.google.com/console) 접속
2. 개발자 계정 생성 (25달러 등록비)
3. "앱 만들기" 클릭

### 2단계: 앱 정보 입력

- **앱 이름**: 런 뷰
- **기본 언어**: 한국어
- **앱 유형**: 앱
- **무료/유료**: 무료

### 3단계: 스토어 등록정보 작성

```
제목: 런 뷰 - 러닝 카페 찾기
간단한 설명: 러닝 카페를 찾고 기록을 공유하는 러너들의 소셜 플랫폼
자세한 설명:
런 뷰는 러닝을 사랑하는 사람들을 위한 특별한 앱입니다.
- 🏃‍♀️ 러닝 기록 추적 및 관리
- ☕ 근처 러닝 친화적 카페 찾기
- 📱 러닝 경험 공유 및 소셜 기능
- 🗺️ GPS 기반 경로 추적
- 📊 상세한 운동 통계
```

### 4단계: 스크린샷 및 아이콘 준비

- **앱 아이콘**: 512x512px (PNG)
- **피처 그래픽**: 1024x500px
- **스크린샷**: 최소 2개 (휴대전화용)
- **스토어 등록정보 아이콘**: 512x512px

### 5단계: 앱 콘텐츠 등급

- 콘텐츠 등급 설문지 작성
- 대상 연령층: 전체 이용가 또는 12세 이상

### 6단계: 앱 업로드

1. "프로덕션" → "새 릴리스 만들기"
2. AAB 파일 업로드 (`android/app/build/outputs/bundle/release/app-release.aab`)
3. 릴리스 이름 및 출시 노트 작성

### 7단계: 검토 및 게시

- 모든 필수 정보 입력 완료 확인
- "검토를 위해 제출" 클릭
- Google 검토 대기 (보통 1-3일)

## 🔐 보안 및 권한

### 필요한 권한

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 개인정보 보호정책

- Google Play Store 요구사항에 따라 개인정보 보호정책 필수
- 위치 정보, 카메라 사용에 대한 명확한 설명 필요

## 🚨 주의사항

### 1. 키스토어 보안

- **절대** 키스토어 파일을 분실하지 마세요
- 키스토어 비밀번호를 안전하게 보관하세요
- Git에 키스토어나 비밀번호를 커밋하지 마세요

### 2. 버전 관리

- 매 업데이트마다 `versionCode` 증가 필요
- `versionName`은 사용자에게 표시되는 버전

### 3. 테스트

- 다양한 Android 기기에서 테스트
- 네트워크 상태별 테스트 (WiFi, 모바일 데이터, 오프라인)
- 권한 거부 시나리오 테스트

## 📱 테스트 방법

### 내부 테스트

```bash
# 개발용 디바이스에 직접 설치
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Google Play Console 내부 테스트

1. Play Console에서 "내부 테스트" 트랙 생성
2. 테스터 이메일 추가
3. AAB 업로드 후 테스터에게 링크 공유

## 🔄 업데이트 프로세스

### 1. 코드 수정 후 빌드

```bash
npm run build
npx cap sync android
```

### 2. 버전 업데이트

`android/app/build.gradle`에서:

```gradle
versionCode 2  // 이전 버전보다 높은 숫자
versionName "1.1.0"  // 사용자용 버전 표시
```

### 3. 새 릴리스 빌드

```bash
cd android && ./gradlew bundleRelease
```

### 4. Play Console에 업로드

새로운 AAB 파일로 릴리스 생성

## 📊 성능 최적화

### APK 크기 줄이기

- 불필요한 라이브러리 제거
- 이미지 최적화 (WebP 사용)
- ProGuard/R8 활성화

### 로딩 성능

- 스플래시 스크린 최적화
- 초기 로딩 시간 단축
- 오프라인 기능 구현

## 🆘 문제 해결

### 일반적인 오류

1. **빌드 실패**: Android SDK 경로 확인
2. **서명 오류**: 키스토어 설정 재확인
3. **권한 오류**: AndroidManifest.xml 권한 설정 확인

### 디버깅 도구

```bash
# Android 로그 확인
adb logcat

# 디바이스 연결 확인
adb devices

# 앱 제거
adb uninstall com.runview.app
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Android 개발자 가이드](https://developer.android.com)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)

---

**🎉 축하합니다! 이제 Run View 앱을 Google Play Store에서 만나보실 수 있습니다!**
