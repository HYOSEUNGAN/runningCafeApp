import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sortCafesByDistance, enrichCafeData } from '../../utils/location';

/**
 * 메인 지도 컨테이너 컴포넌트
 * 네이버 지도 API를 사용하여 러닝 코스와 카페 마커를 표시하는 인터랙티브 지도
 */
const MapContainer = ({
  runningCourses = [],
  cafes = [],
  onMarkerClick,
  userLocation,
  mapCenter,
}) => {
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 샘플 러닝 코스 데이터
  const sampleRunningCourses = [
    {
      id: 1,
      name: '한강공원 5km 코스',
      distance: '5.2km',
      difficulty: 'easy',
      coordinates: { lat: 37.5219, lng: 126.9895 },
      color: '#4F46E5',
    },
    {
      id: 2,
      name: '올림픽공원 3km 코스',
      distance: '3.1km',
      difficulty: 'medium',
      coordinates: { lat: 37.5202, lng: 127.124 },
      color: '#059669',
    },
    {
      id: 3,
      name: '남산 순환로 7km',
      distance: '7.3km',
      difficulty: 'hard',
      coordinates: { lat: 37.5512, lng: 126.9882 },
      color: '#DC2626',
    },
  ];

  // 기본 카페 데이터 (실제로는 API에서 가져올 데이터)
  const baseCafeData = [
    {
      id: 1,
      name: '러닝 후 힐링 카페',
      rating: 4.8,
      coordinates: { lat: 37.5225, lng: 126.99 },
      isOpen: true,
      phone: '02-123-4567',
      address: '서울시 마포구 한강대로 123',
      operatingHours: { open: '07:00', close: '22:00' },
      features: ['WiFi', '콘센트', '러닝 용품 보관'],
    },
    {
      id: 2,
      name: '한강뷰 카페',
      rating: 4.6,
      coordinates: { lat: 37.521, lng: 126.989 },
      isOpen: true,
      phone: '02-234-5678',
      address: '서울시 용산구 한강대로 456',
      operatingHours: { open: '06:30', close: '23:00' },
      features: ['한강뷰', '테라스', '샤워실'],
    },
    {
      id: 3,
      name: '올림픽공원 카페',
      rating: 4.9,
      coordinates: { lat: 37.5208, lng: 127.1235 },
      isOpen: false,
      phone: '02-345-6789',
      address: '서울시 송파구 올림픽로 789',
      operatingHours: { open: '08:00', close: '21:00' },
      features: ['공원뷰', '주차장', '러닝 코스 연결'],
    },
    {
      id: 4,
      name: '강변 러너스 카페',
      rating: 4.7,
      coordinates: { lat: 37.518, lng: 126.995 },
      isOpen: true,
      phone: '02-456-7890',
      address: '서울시 영등포구 여의도동 123',
      operatingHours: { open: '05:30', close: '24:00' },
      features: ['24시간', '러닝 클럽', '프로틴 음료'],
    },
    {
      id: 5,
      name: '서울숲 브런치 카페',
      rating: 4.5,
      coordinates: { lat: 37.5443, lng: 127.0378 },
      isOpen: true,
      phone: '02-567-8901',
      address: '서울시 성동구 성수동1가 456',
      operatingHours: { open: '07:30', close: '20:00' },
      features: ['브런치', '건강식', '러닝 후 회복 메뉴'],
    },
  ];

  // 사용자 위치 기반으로 거리 계산된 카페 데이터
  const enrichedCafes = enrichCafeData(baseCafeData, userLocation);
  const sortedCafes = sortCafesByDistance(enrichedCafes, userLocation);

  // 네이버 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    // 네이버 지도 API 로딩 확인
    if (!window.naver || !window.naver.maps) {
      console.warn('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    try {
      const defaultCenter = userLocation
        ? new window.naver.maps.LatLng(userLocation.lat, userLocation.lng)
        : new window.naver.maps.LatLng(37.5665, 126.978); // 서울 중심가

      const mapOptions = {
        center: defaultCenter,
        zoom: 15,
        minZoom: 10,
        maxZoom: 19,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.BUTTON,
          position: window.naver.maps.Position.TOP_LEFT,
        },
        zoomControl: true,
        zoomControlOptions: {
          style: window.naver.maps.ZoomControlStyle.SMALL,
          position: window.naver.maps.Position.TOP_RIGHT,
        },
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
      };

      naverMapRef.current = new window.naver.maps.Map(
        mapRef.current,
        mapOptions
      );

      // 지도 로드 완료 이벤트 리스너
      window.naver.maps.Event.addListener(naverMapRef.current, 'init', () => {
        console.log('네이버 지도가 성공적으로 초기화되었습니다.');
        setMapReady(true);
        setIsLoading(false);
      });

      // 타임아웃으로 안전장치 추가
      setTimeout(() => {
        if (!mapReady) {
          setMapReady(true);
          setIsLoading(false);
        }
      }, 3000);
    } catch (error) {
      console.error('네이버 지도 초기화 오류:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [userLocation, mapReady]);

  // 마커 생성 및 관리
  const createMarkers = useCallback(() => {
    if (!naverMapRef.current || !mapReady) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 현재 위치 마커
    if (userLocation) {
      const userMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          userLocation.lat,
          userLocation.lng
        ),
        map: naverMapRef.current,
        title: '현재 위치',
        icon: {
          content: `
            <div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
          `,
          anchor: new window.naver.maps.Point(10, 10),
        },
      });
      markersRef.current.push(userMarker);
    }

    // 카페 마커들 (거리순으로 정렬된 데이터 사용)
    sortedCafes.forEach(cafe => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          cafe.coordinates.lat,
          cafe.coordinates.lng
        ),
        map: naverMapRef.current,
        title: `${cafe.name} - ${cafe.distanceText || '거리 정보 없음'}`,
        icon: {
          content: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: ${cafe.isOpen ? '#F97316' : '#6B7280'}; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              position: relative;
            ">
              <span style="color: white; font-size: 18px;">☕</span>
              ${
                cafe.isOpen
                  ? `
                <div style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 12px;
                  height: 12px;
                  background: #10B981;
                  border: 2px solid white;
                  border-radius: 50%;
                "></div>
              `
                  : ''
              }
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 20),
        },
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        handleMarkerClick('cafe', cafe);
      });

      // 정보 창 (InfoWindow) 추가
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${cafe.name}</h4>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
              ⭐ ${cafe.rating} · ${cafe.distanceText || '거리 정보 없음'}
            </p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: ${cafe.isOpen ? '#10B981' : '#EF4444'};">
              ${cafe.isOpen ? '영업중' : '영업종료'}
            </p>
            ${
              cafe.features && cafe.features.length > 0
                ? `
              <p style="margin: 0; font-size: 11px; color: #888;">
                ${cafe.features.slice(0, 2).join(', ')}
              </p>
            `
                : ''
            }
          </div>
        `,
        borderWidth: 0,
        anchorSize: new window.naver.maps.Size(20, 10),
        pixelOffset: new window.naver.maps.Point(0, -10),
      });

      // 마커 호버 시 정보 창 표시
      window.naver.maps.Event.addListener(marker, 'mouseover', () => {
        infoWindow.open(naverMapRef.current, marker);
      });

      window.naver.maps.Event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
    });

    // 러닝 코스 마커들
    sampleRunningCourses.forEach(course => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          course.coordinates.lat,
          course.coordinates.lng
        ),
        map: naverMapRef.current,
        title: course.name,
        icon: {
          content: `
            <div style="
              width: 48px; 
              height: 48px; 
              background: ${course.color}; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              <span style="color: white; font-size: 20px;">🏃‍♀️</span>
            </div>
          `,
          anchor: new window.naver.maps.Point(24, 24),
        },
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        handleMarkerClick('course', course);
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, userLocation]);

  // 지도 초기화 useEffect
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5초 동안 시도 (100ms * 50)

    const checkNaverMaps = () => {
      if (window.naver && window.naver.maps) {
        console.log('네이버 지도 API 로드 완료');
        initializeMap();
      } else if (retryCount < maxRetries) {
        retryCount++;
        // 네이버 지도 API 로딩 대기
        setTimeout(checkNaverMaps, 100);
      } else {
        console.error('네이버 지도 API 로드 실패 - 타임아웃');
        setHasError(true);
        setIsLoading(false);
      }
    };

    // 초기 로딩 시작
    checkNaverMaps();
  }, [initializeMap]);

  // 마커 생성 useEffect
  useEffect(() => {
    createMarkers();
  }, [createMarkers]);

  // 사용자 위치 변경 시 지도 중심 이동
  useEffect(() => {
    if (naverMapRef.current && userLocation) {
      const newCenter = new window.naver.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );
      naverMapRef.current.setCenter(newCenter);
    }
  }, [userLocation]);

  const handleMarkerClick = (type, item) => {
    setSelectedMarker({ type, item });
    if (onMarkerClick) {
      onMarkerClick(type, item);
    }
  };

  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="relative w-full h-full bg-gray-100">
  //       {/* 로딩 스켈레톤 */}
  //       <div className="absolute inset-0 flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
  //           <p className="text-gray-600 font-medium">
  //             네이버 지도를 불러오는 중...
  //           </p>
  //           <p className="text-gray-500 text-sm mt-2">
  //             GPS 위치 정보를 가져오고 있습니다
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative w-full h-full">
      {/* 네이버 지도 컨테이너 */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* 네이버 지도가 로드되지 않은 경우 또는 에러 상황 폴백 UI */}
      {(!mapReady || hasError) && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-4">
            <div className="text-6xl mb-4">{hasError ? '⚠️' : '🗺️'}</div>
            <h3 className="text-lg font-semibold mb-2">
              {hasError ? '지도 로드 실패' : '지도 준비 중...'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasError
                ? '네이버 지도 API를 불러올 수 없습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.'
                : '네이버 지도를 불러오고 있습니다. 잠시만 기다려주세요.'}
            </p>
            {hasError && (
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                다시 시도
              </button>
            )}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                💡 개발 중인 기능입니다. 실제 네이버 지도 API 키가 필요할 수
                있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
