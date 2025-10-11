import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.runview.app',
  appName: '런뷰',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3B82F6',
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3600000, // 1시간
    },
    App: {
      // 앱이 백그라운드로 이동해도 위치 추적 유지
      backgroundMode: true,
    },
    Camera: {
      // 카메라 권한 설정
      permissions: ['camera', 'photos'],
    },
    Device: {
      // 디바이스 정보 접근
    },
    Haptics: {
      // 햅틱 피드백
    },
    LocalNotifications: {
      // 로컬 알림
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
      sound: 'beep.wav',
    },
    Network: {
      // 네트워크 상태 모니터링
    },
    Preferences: {
      // 로컬 저장소
    },
    Share: {
      // 공유 기능
    },
  },
};

export default config;
