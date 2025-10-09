import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Play,
  Target,
  Route,
  Clock,
  Activity,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import CreatePostModal from '../components/feed/CreatePostModal';
import { createRunningRecord } from '../services/runningRecordService';

/**
 * RUNNING START 페이지
 * 러닝 시작 전 설정 및 목표 설정 화면
 */
const RunningStartPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  // 러닝 설정 상태
  const [runningGoals, setRunningGoals] = useState({
    type: 'distance', // 'distance', 'time', 'free'
    targetDistance: 5, // km
    targetTime: 30, // minutes
  });

  const [selectedMode, setSelectedMode] = useState('free'); // 'free', 'goal', 'map', 'course'

  // 뒤로가기
  const handleGoBack = () => {
    navigate(-1);
  };

  // 지도 아이콘 클릭 시 RUNNING START2로 이동
  const handleMapClick = () => {
    navigate(ROUTES.RUNNING_START2);
  };

  // 러닝 시작
  const handleStartRunning = () => {
    if (!isAuthenticated()) {
      showToast('로그인이 필요합니다.', 'error');
      navigate(ROUTES.LOGIN);
      return;
    }

    // 러닝 설정 데이터를 로컬 스토리지에 저장
    const runningConfig = {
      mode: selectedMode,
      goals: runningGoals,
      startTime: Date.now(),
    };

    localStorage.setItem('runningConfig', JSON.stringify(runningConfig));

    // 지도 러닝 모드일 때는 RUNNING START2로 이동
    if (selectedMode === 'map') {
      showToast('지도 러닝을 시작합니다! 🗺️', 'success');
      navigate(ROUTES.RUNNING_START2);
    } else {
      // 목표 러닝이나 자유 러닝 모드일 때는 NavigationPage로 이동
      if (selectedMode === 'goal') {
        showToast(
          `목표 ${runningGoals.type === 'distance' ? runningGoals.targetDistance + 'km' : runningGoals.targetTime + '분'} 러닝을 시작합니다! 🎯`,
          'success'
        );
      } else {
        showToast('자유 러닝을 시작합니다! 🏃‍♀️', 'success');
      }
      navigate('/nav-detail'); // 실제 러닝 페이지로 이동
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm relative">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />

        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">RUNNING START</h1>
            <p className="text-xs text-purple-600 font-medium -mt-1">
              러닝 준비하기
            </p>
          </div>

          <button
            onClick={handleMapClick}
            className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center hover:bg-purple-200 transition-colors"
            title="지도 보기"
          >
            <MapPin size={20} className="text-purple-600" />
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-6 py-6 space-y-6">
        {/* 러닝 모드 선택 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">러닝 모드</h2>

          <div className="space-y-3">
            {/* 자유 러닝 */}
            <div
              onClick={() => setSelectedMode('free')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'free'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedMode === 'free' ? 'bg-purple-500' : 'bg-gray-100'
                  }`}
                >
                  <Activity
                    size={24}
                    className={
                      selectedMode === 'free' ? 'text-white' : 'text-gray-600'
                    }
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">자유 러닝</h3>
                  <p className="text-sm text-gray-600">
                    목표 없이 자유롭게 달리기
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'free'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedMode === 'free' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* 목표 러닝 */}
            <div
              onClick={() => setSelectedMode('goal')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'goal'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedMode === 'goal' ? 'bg-purple-500' : 'bg-gray-100'
                  }`}
                >
                  <Target
                    size={24}
                    className={
                      selectedMode === 'goal' ? 'text-white' : 'text-gray-600'
                    }
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">목표 러닝</h3>
                  <p className="text-sm text-gray-600">거리나 시간 목표 설정</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'goal'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedMode === 'goal' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* 지도 러닝 */}
            <div
              onClick={() => setSelectedMode('map')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'map'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedMode === 'map' ? 'bg-purple-500' : 'bg-gray-100'
                  }`}
                >
                  <MapPin
                    size={24}
                    className={
                      selectedMode === 'map' ? 'text-white' : 'text-gray-600'
                    }
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">지도 러닝</h3>
                  <p className="text-sm text-gray-600">
                    실시간 경로 추적 및 SNS 공유
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'map'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedMode === 'map' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>

            {/* 코스 러닝 - 베타 서비스 */}
            <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-200">
                  <Route size={24} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-500">코스 러닝</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                      베타 준비중
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    미리 설정된 코스 따라가기 (곧 출시 예정)
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 목표 설정 (목표 러닝 모드일 때만 표시) */}
        {selectedMode === 'goal' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">목표 설정</h2>

            <div className="space-y-4">
              {/* 목표 타입 선택 */}
              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    setRunningGoals(prev => ({ ...prev, type: 'distance' }))
                  }
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    runningGoals.type === 'distance'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  거리 목표
                </button>
                <button
                  onClick={() =>
                    setRunningGoals(prev => ({ ...prev, type: 'time' }))
                  }
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                    runningGoals.type === 'time'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  시간 목표
                </button>
              </div>

              {/* 목표 값 설정 */}
              {runningGoals.type === 'distance' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">목표 거리</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {runningGoals.targetDistance}km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={runningGoals.targetDistance}
                    onChange={e =>
                      setRunningGoals(prev => ({
                        ...prev,
                        targetDistance: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span>20km</span>
                  </div>
                </div>
              )}

              {runningGoals.type === 'time' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">목표 시간</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {runningGoals.targetTime}분
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={runningGoals.targetTime}
                    onChange={e =>
                      setRunningGoals(prev => ({
                        ...prev,
                        targetTime: parseInt(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10분</span>
                    <span>120분</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 러닝 정보 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">오늘의 러닝</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Clock size={24} className="text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">예상 시간</div>
              <div className="text-lg font-bold text-gray-900">
                {selectedMode === 'goal' && runningGoals.type === 'time'
                  ? `${runningGoals.targetTime}분`
                  : selectedMode === 'goal' && runningGoals.type === 'distance'
                    ? `${Math.round(runningGoals.targetDistance * 6)}분`
                    : selectedMode === 'map'
                      ? '실시간'
                      : '자유'}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <MapPin size={24} className="text-indigo-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">예상 거리</div>
              <div className="text-lg font-bold text-gray-900">
                {selectedMode === 'goal' && runningGoals.type === 'distance'
                  ? `${runningGoals.targetDistance}km`
                  : selectedMode === 'goal' && runningGoals.type === 'time'
                    ? `${(runningGoals.targetTime / 6).toFixed(1)}km`
                    : '자유'}
              </div>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleStartRunning}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center space-x-3"
          >
            <Play size={24} />
            <span>러닝 시작하기</span>
          </button>
        </div>
      </div>

      {/* 사용자 정의 스타일 */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default RunningStartPage;
