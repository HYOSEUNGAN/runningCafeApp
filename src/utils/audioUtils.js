/**
 * 오디오 유틸리티 함수들
 * Web Audio API를 사용한 간단한 효과음 생성
 */

// 오디오 컨텍스트 생성 (싱글톤)
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * 비프음 생성
 * @param {number} frequency - 주파수 (Hz)
 * @param {number} duration - 지속시간 (초)
 * @param {number} volume - 볼륨 (0-1)
 */
export const playBeep = (frequency = 800, duration = 0.3, volume = 0.3) => {
  try {
    const ctx = getAudioContext();
    
    // 오실레이터 생성
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // 연결
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 설정
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // 볼륨 페이드 효과
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    // 재생
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
  } catch (error) {
    console.warn('오디오 재생 실패:', error);
  }
};

/**
 * 카운트다운 효과음
 * @param {number} count - 카운트 숫자 (1, 2, 3)
 */
export const playCountdownBeep = (count) => {
  if (count === 3 || count === 2) {
    // 3, 2일 때는 낮은 톤
    playBeep(600, 0.4, 0.4);
  } else if (count === 1) {
    // 1일 때는 높은 톤
    playBeep(800, 0.6, 0.5);
  }
};

/**
 * 시작 효과음 (더 긴 톤)
 */
export const playStartBeep = () => {
  playBeep(1000, 0.8, 0.6);
};

/**
 * 성공 효과음 (상승 톤)
 */
export const playSuccessBeep = () => {
  setTimeout(() => playBeep(523, 0.2, 0.3), 0);    // C5
  setTimeout(() => playBeep(659, 0.2, 0.3), 150);  // E5
  setTimeout(() => playBeep(784, 0.3, 0.4), 300);  // G5
};

/**
 * 알림 효과음
 */
export const playNotificationBeep = () => {
  playBeep(880, 0.3, 0.4);
  setTimeout(() => playBeep(1100, 0.3, 0.4), 200);
};

/**
 * 오디오 컨텍스트 재개 (사용자 상호작용 후 호출)
 */
export const resumeAudioContext = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (error) {
    console.warn('오디오 컨텍스트 재개 실패:', error);
  }
};
