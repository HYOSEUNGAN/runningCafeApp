import React, { useState, useEffect, useRef } from 'react';
import { generateRunningMapImage } from '../../services/mapImageService';
import { formatTime, calculatePace } from '../../utils/format';
import '../../styles/running-completion.css';

/**
 * Strava 스타일 러닝 완료 인증 화면
 * 동적 애니메이션과 성취감을 주는 시각적 요소들로 구성
 */
const RunningCompletionScreen = ({
  isVisible,
  runningData,
  onClose,
  onShare,
  onSaveToFeed,
  onViewDetail,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mapImageUrl, setMapImageUrl] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const confettiRef = useRef(null);

  const {
    distance = 0,
    duration = 0,
    calories = 0,
    averageSpeed = 0,
    maxSpeed = 0,
    path = [],
    startTime,
    endTime,
  } = runningData || {};

  // 애니메이션 단계별 진행
  useEffect(() => {
    if (!isVisible) return;

    const steps = [
      { delay: 0, step: 0 }, // 초기 화면
      { delay: 500, step: 1 }, // 완료 메시지
      { delay: 1000, step: 2 }, // 통계 카드들
      { delay: 1500, step: 3 }, // 지도 생성
      { delay: 2000, step: 4 }, // 액션 버튼들
    ];

    steps.forEach(({ delay, step }) => {
      setTimeout(() => setCurrentStep(step), delay);
    });

    // 지도 이미지 생성
    generateMapImageAsync();

    // 성취 분석
    analyzeAchievements();

    // 햅틱 피드백
    triggerHapticFeedback();

    // 완료 사운드
    playCompletionSound();
  }, [isVisible]);

  // 지도 이미지 비동기 생성
  const generateMapImageAsync = async () => {
    if (!path || path.length < 2) return;

    setIsGeneratingMap(true);
    try {
      const imageBlob = await generateRunningMapImage(path, [], {
        width: 800,
        height: 400,
        title: '러닝 완료!',
        showDistance: true,
        showDuration: true,
        distance: distance,
        duration: duration,
      });

      const imageUrl = URL.createObjectURL(imageBlob);
      setMapImageUrl(imageUrl);
    } catch (error) {
      console.error('지도 이미지 생성 실패:', error);
    } finally {
      setIsGeneratingMap(false);
    }
  };

  // 성취 분석
  const analyzeAchievements = () => {
    const achievementList = [];

    // 거리 기반 성취
    if (distance >= 5000) {
      achievementList.push({
        icon: '🏃‍♀️',
        title: '5K 완주!',
        description: '5킬로미터를 완주했습니다',
        color: 'from-blue-400 to-blue-600',
      });
    }

    if (distance >= 10000) {
      achievementList.push({
        icon: '🏆',
        title: '10K 달성!',
        description: '10킬로미터 완주 축하합니다',
        color: 'from-gold-400 to-gold-600',
      });
    }

    // 시간 기반 성취
    if (duration >= 3600000) {
      // 1시간 이상
      achievementList.push({
        icon: '⏰',
        title: '지구력 왕',
        description: '1시간 이상 달리기 완주',
        color: 'from-green-400 to-green-600',
      });
    }

    // 속도 기반 성취
    const paceMinutes = calculatePaceInMinutes(distance, duration);
    if (paceMinutes <= 5) {
      achievementList.push({
        icon: '⚡',
        title: '스피드 러너',
        description: '평균 페이스 5분/km 달성',
        color: 'from-yellow-400 to-orange-500',
      });
    }

    setAchievements(achievementList);
  };

  // 햅틱 피드백
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      // 성공 패턴: 짧게-길게-짧게
      navigator.vibrate([200, 100, 300, 100, 200]);
    }
  };

  // 완료 사운드
  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // 성공 멜로디 생성
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.1,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime + index * 0.2);
        oscillator.stop(audioContext.currentTime + index * 0.2 + 0.5);
      });
    } catch (error) {
      console.log('사운드 재생 실패:', error);
    }
  };

  const calculatePaceInMinutes = (distance, duration) => {
    if (distance === 0) return 0;
    return duration / 60000 / (distance / 1000); // 분/km
  };

  const StatCard = ({
    icon,
    value,
    label,
    delay = 0,
    color = 'from-purple-400 to-pink-500',
  }) => (
    <div
      className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-700 hover:scale-105`}
      style={{
        animationDelay: `${delay}ms`,
        animation:
          currentStep >= 2 ? 'slideInUp 0.6s ease-out forwards' : 'none',
      }}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );

  const AchievementBadge = ({ achievement, delay }) => (
    <div
      className={`bg-gradient-to-br ${achievement.color} rounded-full p-4 text-white text-center shadow-lg transform transition-all duration-800`}
      style={{
        animationDelay: `${delay}ms`,
        animation:
          currentStep >= 2 ? 'bounceIn 0.8s ease-out forwards' : 'none',
      }}
    >
      <div className="text-2xl mb-1">{achievement.icon}</div>
      <div className="text-xs font-semibold">{achievement.title}</div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 overflow-y-auto transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6">
          <button
            onClick={onClose}
            className={`text-white/80 hover:text-white text-2xl transition-all duration-300 ${
              currentStep >= 4
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-5'
            }`}
          >
            ×
          </button>
          <div
            className={`text-white text-center transition-all duration-500 ${
              currentStep >= 1
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-5'
            }`}
          >
            <div className="text-sm opacity-80">러닝 완료</div>
            <div className="text-lg font-semibold">
              {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 px-6 pb-6">
          {/* 완료 메시지 */}
          {currentStep >= 1 && (
            <div
              className="text-center mb-8 transition-all duration-800 transform"
              style={{
                animation:
                  currentStep >= 1
                    ? 'slideInUp 0.8s ease-out forwards'
                    : 'none',
              }}
            >
              <div
                className="text-8xl mb-4 animate-bounce"
                style={{
                  animationDuration: '2s',
                  animationIterationCount: 'infinite',
                }}
              >
                🎉
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">러닝 완료!</h1>
              <p className="text-white/80 text-lg">훌륭한 러닝이었습니다! 🏃‍♀️</p>
            </div>
          )}

          {/* 통계 카드들 */}
          {currentStep >= 2 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard
                icon="📏"
                value={`${(distance / 1000).toFixed(1)}km`}
                label="거리"
                delay={0}
                color="from-blue-400 to-blue-600"
              />
              <StatCard
                icon="⏱️"
                value={formatTime(duration)}
                label="시간"
                delay={100}
                color="from-green-400 to-green-600"
              />
              <StatCard
                icon="⚡"
                value={calculatePace(distance, duration)}
                label="평균 페이스"
                delay={200}
                color="from-purple-400 to-purple-600"
              />
              <StatCard
                icon="🔥"
                value={`${Math.round(calories)}kcal`}
                label="칼로리"
                delay={300}
                color="from-orange-400 to-red-500"
              />
            </div>
          )}

          {/* 성취 배지들 */}
          {currentStep >= 2 && achievements.length > 0 && (
            <div
              className={`mb-6 transition-all duration-600 ${
                currentStep >= 2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <h3 className="text-white text-lg font-semibold mb-3 text-center">
                🏆 달성한 성취
              </h3>
              <div className="flex justify-center space-x-4">
                {achievements.map((achievement, index) => (
                  <AchievementBadge
                    key={index}
                    achievement={achievement}
                    delay={600 + index * 100}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 지도 스냅샷 */}
          {currentStep >= 3 && (
            <div
              className={`mb-6 transition-all duration-600 ${
                currentStep >= 3
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95'
              }`}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                <h3 className="text-white text-lg font-semibold mb-3 text-center">
                  🗺️ 러닝 경로
                </h3>
                <div className="relative">
                  {isGeneratingMap ? (
                    <div className="h-48 bg-white/20 rounded-xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin text-2xl mb-2">⏳</div>
                        <div className="text-sm">지도 생성 중...</div>
                      </div>
                    </div>
                  ) : mapImageUrl ? (
                    <img
                      src={mapImageUrl}
                      alt="러닝 경로"
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="h-48 bg-white/20 rounded-xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl mb-2">🗺️</div>
                        <div className="text-sm">경로 데이터 없음</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          {currentStep >= 4 && (
            <div
              className={`space-y-3 transition-all duration-600 ${
                currentStep >= 4
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <button
                onClick={onShare}
                className="w-full bg-white/20 backdrop-blur-lg text-white font-semibold py-4 px-6 rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-200 transform hover:scale-102 active:scale-98"
              >
                📱 친구들과 공유하기
              </button>

              <button
                onClick={onSaveToFeed}
                className="w-full bg-white/20 backdrop-blur-lg text-white font-semibold py-4 px-6 rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-200 transform hover:scale-102 active:scale-98"
              >
                📝 피드에 기록하기
              </button>

              <button
                onClick={onViewDetail}
                className="w-full bg-white text-purple-600 font-semibold py-4 px-6 rounded-2xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-102 active:scale-98"
              >
                📊 상세 기록 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunningCompletionScreen;
