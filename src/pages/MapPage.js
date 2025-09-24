import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import { MapHeader, MapContainer, BottomSheet } from '../components/map';
import BottomNavigation from '../components/layout/BottomNavigation';

/**
 * 지도 페이지 컴포넌트
 * 네이버 지도 스타일의 러닝 특화 지도 서비스
 */
const MapPage = () => {
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      showToast({
        type: 'info',
        message: '현재 위치를 찾는 중...',
      });

      const options = {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // 10초 타임아웃
        maximumAge: 300000, // 5분 이내 캐시된 위치 사용
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          setUserLocation(location);

          showToast({
            type: 'success',
            message: `현재 위치를 찾았습니다! (정확도: ${Math.round(location.accuracy)}m)`,
          });

          // 위치 기반 주변 카페 검색 (실제 구현에서는 API 호출)
          console.log('사용자 위치:', location);
        },
        error => {
          console.error('위치 정보 오류:', error);

          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
              break;
            default:
              errorMessage = '알 수 없는 오류가 발생했습니다.';
              break;
          }

          // 기본 위치 (서울 중심가)
          setUserLocation({
            lat: 37.5665,
            lng: 126.978,
            accuracy: null,
            timestamp: Date.now(),
          });

          showToast({
            type: 'warning',
            message: `${errorMessage} 기본 위치(서울)로 설정했습니다.`,
          });
        },
        options
      );
    } else {
      showToast({
        type: 'error',
        message: '이 브라우저는 위치 서비스를 지원하지 않습니다.',
      });

      // 기본 위치 설정
      setUserLocation({
        lat: 37.5665,
        lng: 126.978,
        accuracy: null,
        timestamp: Date.now(),
      });
    }
  };

  const handleSearchFocus = () => {
    showToast({
      type: 'info',
      message: '검색 기능을 준비 중입니다.',
    });
    // TODO: 검색 페이지로 이동 또는 검색 모달 열기
  };

  const handleLocationClick = () => {
    getCurrentLocation();
  };

  const handleMarkerClick = (type, item) => {
    if (type === 'cafe') {
      setSelectedCafe(item);
      setIsBottomSheetOpen(true);
    } else if (type === 'course') {
      showToast({
        type: 'info',
        message: `${item.name} 러닝 코스 정보`,
      });
      // TODO: 러닝 코스 상세 정보 표시
    }
  };

  const handleCafeSelect = cafe => {
    setSelectedCafe(cafe);
    showToast({
      type: 'info',
      message: `${cafe.name}을(를) 선택했습니다.`,
    });
  };

  const handleRouteClick = cafe => {
    showToast({
      type: 'success',
      message: `${cafe.name}까지의 경로를 안내합니다.`,
    });
    // TODO: 경로 안내 기능 구현
  };

  const handleCallClick = cafe => {
    if (cafe.phone) {
      window.open(`tel:${cafe.phone}`);
    } else {
      showToast({
        type: 'warning',
        message: '전화번호 정보가 없습니다.',
      });
    }
  };

  const handleSaveClick = (cafeId, isSaved) => {
    showToast({
      type: 'success',
      message: isSaved
        ? '즐겨찾기에 추가했습니다.'
        : '즐겨찾기에서 제거했습니다.',
    });
    // TODO: 즐겨찾기 상태 저장
  };

  const handleShareClick = cafe => {
    if (navigator.share) {
      navigator
        .share({
          title: cafe.name,
          text: `${cafe.name} - 러닝 후 추천 카페`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast({
          type: 'success',
          message: '링크가 클립보드에 복사되었습니다.',
        });
      });
    }
  };

  return (
    <div className="app-container bg-gray-100 overflow-hidden">
      {/* 지도 헤더 */}
      <MapHeader
        onSearchFocus={handleSearchFocus}
        onLocationClick={handleLocationClick}
      />

      {/* 메인 지도 */}
      <div className="absolute inset-0">
        <MapContainer
          userLocation={userLocation}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* 하단 바텀시트 */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onCafeSelect={handleCafeSelect}
        onRouteClick={handleRouteClick}
        onCallClick={handleCallClick}
        onSaveClick={handleSaveClick}
        onShareClick={handleShareClick}
      />

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default MapPage;
