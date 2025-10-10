import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import {
  MapHeader,
  MapContainer,
  BottomSheet,
  RunningDetailBottomSheet,
} from '../components/map';
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
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchRadius, setSearchRadius] = useState(5);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [mapType, setMapType] = useState('normal');
  const [selectedRunningItem, setSelectedRunningItem] = useState(null);
  const [runningItemType, setRunningItemType] = useState('course');
  const [isRunningDetailOpen, setIsRunningDetailOpen] = useState(false);

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
      setSelectedRunningItem(item);
      setRunningItemType('course');
      setIsRunningDetailOpen(true);
      setIsBottomSheetOpen(false);
    } else if (type === 'place') {
      setSelectedRunningItem(item);
      setRunningItemType('place');
      setIsRunningDetailOpen(true);
      setIsBottomSheetOpen(false);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = newFilters => {
    setSelectedFilters(newFilters);
    const filterNames = {
      open: '영업중',
      'runner-friendly': '러너친화',
      partnership: '제휴카페',
      brunch: '브런치',
    };

    if (newFilters.length > 0) {
      const filterText = newFilters.map(f => filterNames[f]).join(', ');
      showToast({
        type: 'info',
        message: `${filterText} 필터가 적용되었습니다.`,
      });
    } else {
      showToast({
        type: 'info',
        message: '모든 필터가 해제되었습니다.',
      });
    }
  };

  // 검색 반경 변경 핸들러
  const handleRadiusChange = newRadius => {
    setSearchRadius(newRadius);
    showToast({
      type: 'info',
      message: `검색 반경이 ${newRadius}km로 설정되었습니다.`,
    });
  };

  // 현재 지역 재검색 핸들러
  const handleReSearchArea = () => {
    getCurrentLocation();
    showToast({
      type: 'info',
      message: '현재 지역에서 카페를 다시 검색합니다.',
    });
  };

  // 줌 인 핸들러
  const handleZoomIn = () => {
    if (currentZoom < 19) {
      setCurrentZoom(currentZoom + 1);
    }
  };

  // 줌 아웃 핸들러
  const handleZoomOut = () => {
    if (currentZoom > 10) {
      setCurrentZoom(currentZoom - 1);
    }
  };

  // 지도 타입 변경 핸들러
  const handleMapTypeChange = () => {
    const nextType = {
      normal: 'satellite',
      satellite: 'hybrid',
      hybrid: 'normal',
    };

    const newMapType = nextType[mapType];
    setMapType(newMapType);

    const typeNames = {
      normal: '일반 지도',
      satellite: '위성 지도',
      hybrid: '하이브리드 지도',
    };

    showToast({
      type: 'info',
      message: `${typeNames[newMapType]}로 변경되었습니다.`,
    });
  };

  return (
    <div className="app-container bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* 지도 헤더 */}
      <MapHeader
        onSearchFocus={handleSearchFocus}
        onLocationClick={handleLocationClick}
        onFilterChange={handleFilterChange}
        onRadiusChange={handleRadiusChange}
        onReSearchArea={handleReSearchArea}
        selectedFilters={selectedFilters}
        selectedRadius={searchRadius}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMapTypeChange={handleMapTypeChange}
        currentZoom={currentZoom}
        mapType={mapType}
      />

      {/* 메인 지도 */}
      <div className="absolute inset-0">
        <MapContainer
          userLocation={userLocation}
          onMarkerClick={handleMarkerClick}
          selectedFilters={selectedFilters}
          searchRadius={searchRadius}
          onReSearchArea={handleReSearchArea}
          currentZoom={currentZoom}
          mapType={mapType}
          onZoomChange={setCurrentZoom}
          onMapTypeChange={setMapType}
        />
      </div>

      {/* 하단 바텀시트 */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        userLocation={userLocation}
        onClose={() => setIsBottomSheetOpen(false)}
        onPlaceSelect={place => {
          setSelectedRunningItem(place);
          setRunningItemType('place');
          setIsRunningDetailOpen(true);
          setIsBottomSheetOpen(false);
        }}
        selectedFilters={selectedFilters}
        searchRadius={searchRadius}
      />

      {/* 러닝 상세 정보 바텀시트 */}
      <RunningDetailBottomSheet
        isOpen={isRunningDetailOpen}
        onClose={() => {
          setIsRunningDetailOpen(false);
          setIsBottomSheetOpen(true);
        }}
        selectedItem={selectedRunningItem}
        itemType={runningItemType}
      />

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default MapPage;
