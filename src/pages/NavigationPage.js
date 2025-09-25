import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Share2,
  MapPin,
  Coffee,
  Save,
} from 'lucide-react';
import { formatDistance, formatTime, formatCalories } from '../utils/format';
import { searchNearbyCafesWithNaver } from '../services/cafeService';
import { saveRunningRecord, compressPath } from '../services/runningService';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

const NavigationPage = () => {
  // 상태 관리
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [path, setPath] = useState([]);
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 스토어
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAppStore();

  // 지도 관련 refs
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);

  // 네이버 지도 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (window.naver && window.naver.maps) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
          zoom: 15,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
          scaleControl: true,
          logoControl: false,
          mapDataControl: false,
        };

        naverMapRef.current = new window.naver.maps.Map(
          mapRef.current,
          mapOptions
        );

        // 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const currentPos = new window.naver.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              setCurrentPosition(currentPos);
              naverMapRef.current.setCenter(currentPos);

              // 현재 위치 마커 추가
              new window.naver.maps.Marker({
                position: currentPos,
                map: naverMapRef.current,
                icon: {
                  content:
                    '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
                  size: new window.naver.maps.Size(16, 16),
                  anchor: new window.naver.maps.Point(8, 8),
                },
              });

              // 주변 카페 검색
              searchNearbyCafes(
                position.coords.latitude,
                position.coords.longitude
              );
            },
            error => {
              console.error('위치 정보를 가져올 수 없습니다:', error);
            }
          );
        }
      }
    };

    // 네이버 지도 스크립트 로드
    if (!window.naver) {
      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // 시간 업데이트
  useEffect(() => {
    if (isTracking && !isPaused) {
      intervalIdRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isTracking, isPaused, startTime]);

  // 주변 카페 검색
  const searchNearbyCafes = async (lat, lng) => {
    try {
      // 네이버 검색 API를 통한 카페 검색 (1km 반경)
      const cafes = await searchNearbyCafesWithNaver(lat, lng, 1000, '카페');

      setNearbyCafes(cafes);

      // 지도에 카페 마커 추가
      cafes.forEach(cafe => {
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            cafe.coordinates.lat,
            cafe.coordinates.lng
          ),
          map: naverMapRef.current,
          icon: {
            content: `
              <div class="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full shadow-lg">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
                </svg>
              </div>
            `,
            size: new window.naver.maps.Size(32, 32),
            anchor: new window.naver.maps.Point(16, 32),
          },
          title: cafe.name,
        });
      });
    } catch (error) {
      console.error('카페 검색 실패:', error);
      // 실패 시 샘플 데이터 사용
      const sampleCafes = [
        {
          id: 'sample_1',
          name: '스타벅스 강남점',
          address: '서울특별시 강남구 테헤란로',
          coordinates: { lat: lat + 0.001, lng: lng + 0.001 },
          distanceText: '100m',
        },
        {
          id: 'sample_2',
          name: '블루보틀 청담점',
          address: '서울특별시 강남구 청담동',
          coordinates: { lat: lat - 0.001, lng: lng + 0.002 },
          distanceText: '200m',
        },
      ];
      setNearbyCafes(sampleCafes);
    }
  };

  // 위치 추적 시작
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPath([]);
    setTotalDistance(0);

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const newPos = new window.naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );

        setCurrentPosition(newPos);
        const speed = position.coords.speed || 0;
        setCurrentSpeed(speed);
        setMaxSpeed(prev => Math.max(prev, speed));

        if (!isPaused) {
          setPath(prevPath => {
            const newPath = [...prevPath, newPos];

            // 거리 계산
            if (prevPath.length > 0) {
              const lastPos = prevPath[prevPath.length - 1];
              const distance = calculateDistance(lastPos, newPos);
              setTotalDistance(prev => prev + distance);
            }

            // 폴리라인 업데이트
            updatePolyline(newPath);

            return newPath;
          });

          // 지도 중심을 현재 위치로 이동
          naverMapRef.current.setCenter(newPos);
        }
      },
      error => {
        console.error('위치 추적 오류:', error);
      },
      options
    );
  };

  // 위치 추적 일시정지/재개
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 위치 추적 중지
  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    setEndTime(Date.now());

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // 러닝 기록 저장
  const saveRecord = async () => {
    if (!isAuthenticated() || !user) {
      showToast({
        type: 'error',
        message: '로그인이 필요합니다.',
      });
      return;
    }

    if (totalDistance === 0 || path.length < 2) {
      showToast({
        type: 'error',
        message: '저장할 러닝 기록이 없습니다.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const runningData = {
        userId: user.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime || Date.now()).toISOString(),
        duration: elapsedTime,
        distance: totalDistance,
        calories: Math.round(calculateCalories()),
        averageSpeed:
          totalDistance > 0 ? totalDistance / (elapsedTime / 1000) : 0,
        maxSpeed: maxSpeed,
        path: compressPath(
          path.map(pos => ({
            lat: pos.lat(),
            lng: pos.lng(),
          }))
        ),
        nearbyCafes: nearbyCafes.map(cafe => ({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          coordinates: cafe.coordinates,
          distanceText: cafe.distanceText,
        })),
      };

      const savedRecord = await saveRunningRecord(runningData);

      if (savedRecord) {
        showToast({
          type: 'success',
          message: '러닝 기록이 저장되었습니다!',
        });

        // 상태 초기화
        resetTrackingState();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('러닝 기록 저장 실패:', error);
      showToast({
        type: 'error',
        message: '러닝 기록 저장에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 추적 상태 초기화
  const resetTrackingState = () => {
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
    setTotalDistance(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setPath([]);

    // 폴리라인 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  // 폴리라인 업데이트
  const updatePolyline = pathArray => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (pathArray.length > 1) {
      polylineRef.current = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: pathArray,
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      });
    }
  };

  // 두 지점 간 거리 계산 (미터)
  const calculateDistance = (pos1, pos2) => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (pos1.lat() * Math.PI) / 180;
    const φ2 = (pos2.lat() * Math.PI) / 180;
    const Δφ = ((pos2.lat() - pos1.lat()) * Math.PI) / 180;
    const Δλ = ((pos2.lng() - pos1.lng()) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 칼로리 계산 (간단한 추정)
  const calculateCalories = () => {
    // 평균 체중 70kg, 러닝 시 km당 70칼로리 소모 기준
    const caloriesPerKm = 70;
    return (totalDistance / 1000) * caloriesPerKm;
  };

  // SNS 공유
  const shareToSNS = async () => {
    if (totalDistance === 0) {
      showToast({
        type: 'error',
        message: '공유할 러닝 기록이 없습니다.',
      });
      return;
    }

    const runningTime = formatTime(elapsedTime);
    const distance = formatDistance(totalDistance);
    const calories = Math.round(calculateCalories());
    const avgSpeed =
      totalDistance > 0
        ? (totalDistance / 1000 / (elapsedTime / 3600000)).toFixed(1)
        : '0.0';

    const shareData = {
      title: 'Running Cafe - 내 러닝 기록',
      text: `🏃‍♂️ Running Cafe에서 달렸어요!\n\n⏱️ 시간: ${runningTime}\n📏 거리: ${distance}\n🔥 칼로리: ${calories}kcal\n⚡ 평균 속도: ${avgSpeed}km/h\n\n${nearbyCafes.length > 0 ? `☕ 주변 카페 ${nearbyCafes.length}곳 발견!\n` : ''}#러닝 #운동 #RunningCafe`,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // 폴백: 클립보드에 복사
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);

        showToast({
          type: 'success',
          message: '공유 내용이 클립보드에 복사되었습니다!',
        });
      }
    } catch (error) {
      console.error('공유 실패:', error);

      // 최종 폴백: 텍스트 선택 가능한 모달 표시
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;

      // 간단한 프롬프트로 폴백
      if (window.prompt) {
        window.prompt('아래 내용을 복사해서 공유하세요:', shareText);
      } else {
        showToast({
          type: 'error',
          message: '공유 기능을 사용할 수 없습니다.',
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">러닝 네비게이션</h1>
        <button
          onClick={shareToSNS}
          disabled={totalDistance === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={16} />
          공유
        </button>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* 통계 카드 */}
        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-500">시간</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(totalDistance)}
              </div>
              <div className="text-xs text-gray-500">거리</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(calculateCalories())}
              </div>
              <div className="text-xs text-gray-500">칼로리</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(currentSpeed * 3.6).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">km/h</div>
            </div>
          </div>
        </div>

        {/* 주변 카페 리스트 */}
        {nearbyCafes.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg max-h-32 overflow-y-auto">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <Coffee size={16} className="text-orange-500" />
                <span className="font-medium text-sm">주변 카페</span>
              </div>
            </div>
            {nearbyCafes.map(cafe => (
              <div key={cafe.id} className="p-3 border-b last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{cafe.name}</div>
                    <div className="text-xs text-gray-500">{cafe.address}</div>
                    {cafe.phone && (
                      <div className="text-xs text-blue-500 mt-1">
                        {cafe.phone}
                      </div>
                    )}
                  </div>
                  {cafe.distanceText && (
                    <div className="text-xs text-gray-400 ml-2">
                      {cafe.distanceText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-center gap-3">
          {!isTracking ? (
            <>
              <button
                onClick={startTracking}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-medium"
              >
                <Play size={20} />
                시작
              </button>
              {totalDistance > 0 && (
                <button
                  onClick={saveRecord}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={togglePause}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium ${
                  isPaused
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? '재개' : '일시정지'}
              </button>
              <button
                onClick={stopTracking}
                className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white rounded-full font-medium"
              >
                <Square size={18} />
                정지
              </button>
            </>
          )}
        </div>

        {/* 추가 정보 표시 */}
        {totalDistance > 0 && !isTracking && (
          <div className="mt-3 text-center">
            <div className="text-sm text-gray-600">
              운동을 완료했습니다! 기록을 저장하거나 SNS에 공유해보세요.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationPage;
