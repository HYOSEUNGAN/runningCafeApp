/**
 * 햅틱 피드백 및 사운드 효과 서비스
 * Strava 스타일의 인터랙티브한 사용자 경험 제공
 */

class InteractiveEffectsService {
  constructor() {
    this.isHapticEnabled = true;
    this.isSoundEnabled = true;
    this.audioContext = null;
    this.soundCache = new Map();

    // 햅틱 패턴 정의
    this.hapticPatterns = {
      success: [200, 100, 200],
      error: [100, 50, 100, 50, 100],
      warning: [150, 100, 150],
      click: [50],
      longPress: [100, 50, 100],
      notification: [200, 100, 100, 100, 200],
      achievement: [300, 150, 200, 150, 300],
      countdown: [100],
      start: [200, 100, 100],
      stop: [300, 200, 300],
    };

    // 사운드 주파수 정의
    this.soundFrequencies = {
      success: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
      error: [220, 196, 174.61], // A3, G3, F3
      warning: [440, 554.37], // A4, C#5
      click: [800],
      notification: [523.25, 659.25], // C5, E5
      achievement: [523.25, 659.25, 783.99, 1046.5, 1318.51], // C5-E6
      countdown: [440], // A4
      start: [523.25, 659.25, 783.99], // C5, E5, G5
      stop: [783.99, 659.25, 523.25], // G5, E5, C5
    };

    this.init();
  }

  /**
   * 서비스 초기화
   */
  async init() {
    try {
      // 오디오 컨텍스트 초기화
      await this.initAudioContext();

      // 설정 로드
      this.loadSettings();

      // 권한 확인
      await this.checkPermissions();

      console.log('인터랙티브 효과 서비스 초기화 완료');
    } catch (error) {
      console.error('인터랙티브 효과 서비스 초기화 실패:', error);
    }
  }

  /**
   * 오디오 컨텍스트 초기화
   */
  async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // 사용자 제스처 후 오디오 컨텍스트 재개
      if (this.audioContext.state === 'suspended') {
        document.addEventListener(
          'click',
          () => {
            this.audioContext.resume();
          },
          { once: true }
        );
      }
    } catch (error) {
      console.warn('오디오 컨텍스트 초기화 실패:', error);
    }
  }

  /**
   * 설정 로드
   */
  loadSettings() {
    const settings = localStorage.getItem('interactiveEffectsSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.isHapticEnabled = parsed.haptic !== false;
      this.isSoundEnabled = parsed.sound !== false;
    }
  }

  /**
   * 설정 저장
   */
  saveSettings() {
    localStorage.setItem(
      'interactiveEffectsSettings',
      JSON.stringify({
        haptic: this.isHapticEnabled,
        sound: this.isSoundEnabled,
      })
    );
  }

  /**
   * 권한 확인
   */
  async checkPermissions() {
    // 알림 권한 확인 (햅틱 피드백을 위해)
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('알림 권한 요청 실패:', error);
      }
    }
  }

  /**
   * 햅틱 피드백 실행
   */
  triggerHaptic(pattern = 'click', intensity = 1) {
    if (!this.isHapticEnabled) return;

    try {
      // 웹 진동 API 사용
      if ('vibrate' in navigator) {
        const vibrationPattern =
          this.hapticPatterns[pattern] || this.hapticPatterns.click;
        const adjustedPattern = vibrationPattern.map(duration =>
          Math.round(duration * intensity)
        );
        navigator.vibrate(adjustedPattern);
      }

      // Capacitor 햅틱 (모바일 앱인 경우)
      if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
        this.triggerCapacitorHaptic(pattern, intensity);
      }
    } catch (error) {
      console.warn('햅틱 피드백 실행 실패:', error);
    }
  }

  /**
   * Capacitor 햅틱 피드백
   */
  async triggerCapacitorHaptic(pattern, intensity) {
    try {
      const { Haptics, ImpactStyle } = window.Capacitor.Plugins;

      let impactStyle;
      switch (pattern) {
        case 'success':
        case 'achievement':
          impactStyle = ImpactStyle.Heavy;
          break;
        case 'error':
          impactStyle = ImpactStyle.Medium;
          break;
        default:
          impactStyle = ImpactStyle.Light;
      }

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.warn('Capacitor 햅틱 실행 실패:', error);
    }
  }

  /**
   * 사운드 효과 재생
   */
  async playSound(type = 'click', volume = 0.3) {
    if (!this.isSoundEnabled || !this.audioContext) return;

    try {
      // 캐시된 사운드 확인
      if (this.soundCache.has(type)) {
        const cachedSound = this.soundCache.get(type);
        this.playAudioBuffer(cachedSound, volume);
        return;
      }

      // 새로운 사운드 생성
      const audioBuffer = await this.generateSound(type);
      this.soundCache.set(type, audioBuffer);
      this.playAudioBuffer(audioBuffer, volume);
    } catch (error) {
      console.warn('사운드 재생 실패:', error);
    }
  }

  /**
   * 사운드 생성
   */
  async generateSound(type) {
    const frequencies =
      this.soundFrequencies[type] || this.soundFrequencies.click;
    const duration = this.getSoundDuration(type);

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const audioBuffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    // 사운드 웨이브 생성
    for (let i = 0; i < length; i++) {
      let sample = 0;
      const time = i / sampleRate;

      frequencies.forEach((freq, index) => {
        const noteTime = (duration / frequencies.length) * index;
        const noteEnd = (duration / frequencies.length) * (index + 1);

        if (time >= noteTime && time < noteEnd) {
          // 사인파 생성
          sample += Math.sin(2 * Math.PI * freq * (time - noteTime));

          // 엔벨로프 적용 (페이드 인/아웃)
          const noteProgress = (time - noteTime) / (noteEnd - noteTime);
          const envelope = this.getEnvelope(noteProgress, type);
          sample *= envelope;
        }
      });

      data[i] = sample / frequencies.length;
    }

    return audioBuffer;
  }

  /**
   * 사운드 지속 시간 반환
   */
  getSoundDuration(type) {
    switch (type) {
      case 'success':
      case 'achievement':
        return 1.0;
      case 'error':
        return 0.8;
      case 'warning':
        return 0.6;
      case 'notification':
        return 0.5;
      case 'start':
        return 0.8;
      case 'stop':
        return 1.0;
      default:
        return 0.2;
    }
  }

  /**
   * 엔벨로프 계산
   */
  getEnvelope(progress, type) {
    switch (type) {
      case 'success':
      case 'achievement':
        // 부드러운 페이드 인/아웃
        if (progress < 0.1) return progress / 0.1;
        if (progress > 0.8) return (1 - progress) / 0.2;
        return 1;

      case 'error':
        // 급격한 시작, 빠른 페이드 아웃
        if (progress < 0.05) return progress / 0.05;
        return Math.exp(-progress * 5);

      case 'click':
        // 빠른 클릭 사운드
        return Math.exp(-progress * 10);

      default:
        // 기본 엔벨로프
        if (progress < 0.1) return progress / 0.1;
        if (progress > 0.7) return (1 - progress) / 0.3;
        return 1;
    }
  }

  /**
   * 오디오 버퍼 재생
   */
  playAudioBuffer(audioBuffer, volume = 0.3) {
    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('오디오 버퍼 재생 실패:', error);
    }
  }

  /**
   * 복합 효과 실행 (햅틱 + 사운드)
   */
  async triggerEffect(type, options = {}) {
    const {
      hapticIntensity = 1,
      soundVolume = 0.3,
      enableHaptic = true,
      enableSound = true,
    } = options;

    const promises = [];

    if (enableHaptic) {
      promises.push(Promise.resolve(this.triggerHaptic(type, hapticIntensity)));
    }

    if (enableSound) {
      promises.push(this.playSound(type, soundVolume));
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('복합 효과 실행 실패:', error);
    }
  }

  /**
   * 러닝 관련 특화 효과들
   */

  // 러닝 시작 효과
  async triggerRunningStart() {
    await this.triggerEffect('start', {
      hapticIntensity: 1.2,
      soundVolume: 0.4,
    });
  }

  // 러닝 완료 효과
  async triggerRunningComplete() {
    await this.triggerEffect('success', {
      hapticIntensity: 1.5,
      soundVolume: 0.5,
    });

    // 추가 성취 효과 (0.5초 후)
    setTimeout(() => {
      this.triggerEffect('achievement', {
        hapticIntensity: 1.0,
        soundVolume: 0.3,
      });
    }, 500);
  }

  // 카운트다운 효과
  async triggerCountdown(number) {
    const intensity = number === 1 ? 1.5 : 1.0; // 마지막 카운트는 더 강하게
    const volume = number === 1 ? 0.4 : 0.3;

    await this.triggerEffect('countdown', {
      hapticIntensity: intensity,
      soundVolume: volume,
    });
  }

  // 일시정지/재개 효과
  async triggerPauseResume(isPaused) {
    const type = isPaused ? 'warning' : 'click';
    await this.triggerEffect(type, {
      hapticIntensity: 0.8,
      soundVolume: 0.2,
    });
  }

  // 목표 달성 효과
  async triggerGoalAchieved() {
    await this.triggerEffect('achievement', {
      hapticIntensity: 2.0,
      soundVolume: 0.6,
    });

    // 연속 햅틱 효과
    setTimeout(() => this.triggerHaptic('success', 0.8), 200);
    setTimeout(() => this.triggerHaptic('success', 0.6), 400);
  }

  // 오류 효과
  async triggerError() {
    await this.triggerEffect('error', {
      hapticIntensity: 1.0,
      soundVolume: 0.3,
    });
  }

  // 알림 효과
  async triggerNotification() {
    await this.triggerEffect('notification', {
      hapticIntensity: 0.7,
      soundVolume: 0.25,
    });
  }

  /**
   * 설정 메서드들
   */

  setHapticEnabled(enabled) {
    this.isHapticEnabled = enabled;
    this.saveSettings();
  }

  setSoundEnabled(enabled) {
    this.isSoundEnabled = enabled;
    this.saveSettings();
  }

  isHapticSupported() {
    return (
      'vibrate' in navigator ||
      (window.Capacitor && window.Capacitor.Plugins.Haptics)
    );
  }

  isSoundSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  getSettings() {
    return {
      hapticEnabled: this.isHapticEnabled,
      soundEnabled: this.isSoundEnabled,
      hapticSupported: this.isHapticSupported(),
      soundSupported: this.isSoundSupported(),
    };
  }

  /**
   * 서비스 정리
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }

    this.soundCache.clear();
    console.log('인터랙티브 효과 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
const interactiveEffectsService = new InteractiveEffectsService();

export default interactiveEffectsService;
export { InteractiveEffectsService };
