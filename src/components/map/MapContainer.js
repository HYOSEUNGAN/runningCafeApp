import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sortCafesByDistance, enrichCafeData } from '../../utils/location';
import { getAllCafes, getNearbyCafes } from '../../services/cafeService';
import {
  getWalkingDirections,
  convertPathToNaverLatLng,
  formatRouteInfo,
} from '../../services/naverDirectionsService';

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
  selectedFilters = [],
  searchRadius = 5,
  onReSearchArea,
  currentZoom: propCurrentZoom,
  mapType: propMapType,
  onZoomChange,
  onMapTypeChange,
}) => {
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [supabaseCafes, setSupabaseCafes] = useState([]);
  const [showRoute, setShowRoute] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(propCurrentZoom || 15);
  const [mapType, setMapType] = useState(propMapType || 'normal'); // 'normal', 'satellite', 'hybrid'

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

  // Supabase에서 카페 데이터 가져오기
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        let cafeData = [];

        if (userLocation) {
          // 사용자 위치가 있으면 설정된 반경 내 카페만 가져오기
          cafeData = await getNearbyCafes(
            userLocation.lat,
            userLocation.lng,
            searchRadius
          );
        } else {
          // 사용자 위치가 없으면 모든 카페 가져오기
          cafeData = await getAllCafes();
        }

        setSupabaseCafes(cafeData);
      } catch (error) {
        console.error('카페 데이터 로딩 실패:', error);
        // 에러 발생 시 기본 데이터 사용
        const enrichedCafes = enrichCafeData(baseCafeData, userLocation);
        const sortedCafes = sortCafesByDistance(enrichedCafes, userLocation);
        setSupabaseCafes(sortedCafes);
      }
    };

    fetchCafes();
  }, [userLocation, searchRadius]);

  // 카페 필터링 함수
  const applyFilters = useCallback((cafes, filters) => {
    if (!filters || filters.length === 0) {
      return cafes;
    }

    return cafes.filter(cafe => {
      return filters.every(filter => {
        switch (filter) {
          case 'open':
            return cafe.isOpen === true;
          case 'runner-friendly':
            return (
              cafe.features?.includes('러닝 후 추천') ||
              cafe.features?.includes('샤워실') ||
              cafe.features?.includes('러닝 클럽')
            );
          case 'partnership':
            return (
              cafe.features?.includes('제휴카페') ||
              cafe.features?.includes('할인혜택')
            );
          case 'brunch':
            return (
              cafe.features?.includes('브런치') ||
              cafe.features?.includes('건강식') ||
              cafe.name.includes('브런치')
            );
          default:
            return true;
        }
      });
    });
  }, []);

  // 사용자 위치 기반으로 거리 계산된 카페 데이터 (폴백용)
  const enrichedCafes = enrichCafeData(baseCafeData, userLocation);
  const sortedCafes = sortCafesByDistance(enrichedCafes, userLocation);

  // 실제 사용할 카페 데이터 (Supabase 데이터 우선, 없으면 기본 데이터)
  const baseCafes = supabaseCafes.length > 0 ? supabaseCafes : sortedCafes;

  // 필터 적용된 카페 데이터
  const displayCafes = applyFilters(baseCafes, selectedFilters);

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
        // 모든 기본 컨트롤 비활성화
        mapTypeControl: false,
        zoomControl: false,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        // 지도 스타일을 더 모던하게
        tileDuration: 200,
        tileTransition: true,
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

      // 줌 레벨 변경 이벤트 리스너
      window.naver.maps.Event.addListener(
        naverMapRef.current,
        'zoom_changed',
        () => {
          const newZoom = naverMapRef.current.getZoom();
          setCurrentZoom(newZoom);
          if (onZoomChange) {
            onZoomChange(newZoom);
          }
        }
      );

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

  // 실제 경로 찾기 API를 사용한 경로 그리기 함수
  const drawRoute = useCallback(async (startCoords, endCoords, cafe) => {
    if (!naverMapRef.current || !window.naver?.maps) return;

    // 기존 경로 제거
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    try {
      // 네이버 Directions API를 사용한 실제 경로 검색
      const routeData = await getWalkingDirections(startCoords, endCoords);

      // API에서 받은 경로 좌표를 네이버 지도 LatLng 객체로 변환
      const path = convertPathToNaverLatLng(routeData.path);

      if (path.length === 0) {
        console.warn('경로 데이터가 없습니다. 직선 경로를 사용합니다.');
        // 폴백: 직선 경로
        path.push(
          new window.naver.maps.LatLng(startCoords.lat, startCoords.lng),
          new window.naver.maps.LatLng(endCoords.lat, endCoords.lng)
        );
      }

      // 실제 도로를 따라가는 Polyline 생성
      const polyline = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: path,
        strokeColor: '#FF6B35', // 주황색 경로
        strokeWeight: 5,
        strokeOpacity: 0.8,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        strokeStyle: 'solid',
      });

      polylinesRef.current.push(polyline);

      // 경로 정보 포맷팅
      const routeInfo = formatRouteInfo(routeData.distance, routeData.duration);

      // 경로 중간 지점에 정보 표시
      const midIndex = Math.floor(path.length / 2);
      const midPoint = path[midIndex] || path[0];

      const routeInfoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 10px 14px; 
            background: linear-gradient(135deg, #FF6B35, #F97316); 
            color: white; 
            border-radius: 24px; 
            font-size: 13px; 
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
            border: 2px solid white;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>🚶‍♀️</span>
              <span>${routeInfo.distance}</span>
              <span style="opacity: 0.8;">•</span>
              <span>${routeInfo.walkingTime}</span>
            </div>
          </div>
        `,
        position: midPoint,
        borderWidth: 0,
        anchorSize: new window.naver.maps.Size(0, 0),
        pixelOffset: new window.naver.maps.Point(0, -15),
      });

      routeInfoWindow.open(naverMapRef.current);

      // 지도 범위를 전체 경로에 맞게 조정
      const bounds = new window.naver.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      naverMapRef.current.fitBounds(bounds, { padding: 80 });

      return {
        distance: routeData.distance,
        duration: routeData.duration,
        path: routeData.path,
      };
    } catch (error) {
      console.error('경로 생성 오류:', error);

      // 에러 시 직선 경로로 폴백
      const fallbackPath = [
        new window.naver.maps.LatLng(startCoords.lat, startCoords.lng),
        new window.naver.maps.LatLng(endCoords.lat, endCoords.lng),
      ];

      const polyline = new window.naver.maps.Polyline({
        map: naverMapRef.current,
        path: fallbackPath,
        strokeColor: '#FF6B35',
        strokeWeight: 4,
        strokeOpacity: 0.6,
        strokeStyle: 'shortdash', // 점선으로 표시하여 추정 경로임을 나타냄
      });

      polylinesRef.current.push(polyline);

      return { distance: 0, duration: 0, path: [] };
    }
  }, []);

  // 경로 지우기 함수
  const clearRoute = useCallback(() => {
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];
    setShowRoute(false);
    setSelectedCafe(null);
  }, []);

  // 커스텀 줌 컨트롤 함수들
  const handleZoomIn = useCallback(() => {
    if (naverMapRef.current && currentZoom < 19) {
      naverMapRef.current.setZoom(currentZoom + 1, true);
    }
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    if (naverMapRef.current && currentZoom > 10) {
      naverMapRef.current.setZoom(currentZoom - 1, true);
    }
  }, [currentZoom]);

  // 지도 타입 변경 함수
  const handleMapTypeChange = useCallback(() => {
    if (!naverMapRef.current) return;

    const nextType = {
      normal: 'satellite',
      satellite: 'hybrid',
      hybrid: 'normal',
    };

    const newMapType = nextType[mapType];
    setMapType(newMapType);

    // 네이버 지도 타입 설정
    const naverMapType = {
      normal: window.naver.maps.MapTypeId.NORMAL,
      satellite: window.naver.maps.MapTypeId.SATELLITE,
      hybrid: window.naver.maps.MapTypeId.HYBRID,
    };

    naverMapRef.current.setMapTypeId(naverMapType[newMapType]);

    // 부모 컴포넌트에 변경사항 전달
    if (onMapTypeChange) {
      onMapTypeChange(newMapType);
    }
  }, [mapType]);

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

    // 카페 마커들 (Supabase 데이터 또는 기본 데이터 사용)
    displayCafes.forEach(cafe => {
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
              width: 44px; 
              height: 44px; 
              background: linear-gradient(135deg, ${cafe.isOpen ? '#FF6B35, #F97316' : '#6B7280, #4B5563'}); 
              border: 3px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              cursor: pointer;
              position: relative;
              transition: all 0.2s ease;
            ">
              <span style="color: white; font-size: 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">☕</span>
              ${
                cafe.isOpen
                  ? `
                <div style="
                  position: absolute;
                  top: -3px;
                  right: -3px;
                  width: 14px;
                  height: 14px;
                  background: #10B981;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                "></div>
              `
                  : ''
              }
              ${
                cafe.distance && cafe.distance < 1
                  ? `
                <div style="
                  position: absolute;
                  bottom: -8px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #3B82F6;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 8px;
                  font-size: 10px;
                  font-weight: bold;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">${cafe.distanceText || '가까움'}</div>
              `
                  : ''
              }
            </div>
          `,
          anchor: new window.naver.maps.Point(22, 22),
        },
      });

      // 마커 클릭 이벤트 (경로 표시 기능 포함)
      window.naver.maps.Event.addListener(marker, 'click', () => {
        handleMarkerClick('cafe', cafe);

        // 사용자 위치가 있으면 경로 표시
        if (userLocation) {
          setSelectedCafe(cafe);
          setShowRoute(true);
          drawRoute(userLocation, cafe.coordinates, cafe);
        }
      });

      // 정보 창 (InfoWindow) 추가 - 개선된 디자인
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 12px; 
            min-width: 220px; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1F2937; flex: 1;">${cafe.name}</h4>
              ${
                cafe.isOpen
                  ? '<span style="background: #10B981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">OPEN</span>'
                  : '<span style="background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">CLOSED</span>'
              }
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #F59E0B; margin-right: 4px;">⭐</span>
              <span style="font-size: 13px; font-weight: 600; color: #374151; margin-right: 8px;">${cafe.rating || '4.5'}</span>
              <span style="font-size: 13px; color: #6B7280;">
                ${cafe.distanceText || (cafe.distance ? `${cafe.distance.toFixed(1)}km` : '거리 정보 없음')}
              </span>
            </div>
            
            ${
              cafe.address
                ? `
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280; line-height: 1.4;">
                📍 ${cafe.address}
              </p>
            `
                : ''
            }
            
            ${
              cafe.features && cafe.features.length > 0
                ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
                ${cafe.features
                  .slice(0, 3)
                  .map(
                    feature =>
                      `<span style="
                    background: #F3F4F6; 
                    color: #4B5563; 
                    padding: 2px 6px; 
                    border-radius: 6px; 
                    font-size: 10px; 
                    font-weight: 500;
                  ">${feature}</span>`
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            
            ${
              userLocation
                ? `
              <div style="
                margin-top: 8px; 
                padding: 6px 0; 
                border-top: 1px solid #E5E7EB; 
                font-size: 11px; 
                color: #6B7280; 
                text-align: center;
              ">
                클릭하여 경로 보기 🚶‍♀️
              </div>
            `
                : ''
            }
          </div>
        `,
        borderWidth: 0,
        anchorSize: new window.naver.maps.Size(0, 0),
        pixelOffset: new window.naver.maps.Point(0, -15),
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
  }, [
    mapReady,
    userLocation,
    displayCafes,
    drawRoute,
    selectedFilters,
    applyFilters,
  ]);

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
  }, [createMarkers, displayCafes]);

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

  // props에서 받은 줌 레벨 변경 시 지도 업데이트
  useEffect(() => {
    if (
      naverMapRef.current &&
      propCurrentZoom !== undefined &&
      propCurrentZoom !== currentZoom
    ) {
      naverMapRef.current.setZoom(propCurrentZoom, true);
      setCurrentZoom(propCurrentZoom);
    }
  }, [propCurrentZoom, currentZoom]);

  // props에서 받은 지도 타입 변경 시 지도 업데이트
  useEffect(() => {
    if (naverMapRef.current && propMapType && propMapType !== mapType) {
      const naverMapType = {
        normal: window.naver.maps.MapTypeId.NORMAL,
        satellite: window.naver.maps.MapTypeId.SATELLITE,
        hybrid: window.naver.maps.MapTypeId.HYBRID,
      };

      naverMapRef.current.setMapTypeId(naverMapType[propMapType]);
      setMapType(propMapType);
    }
  }, [propMapType, mapType]);

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

      {/* 경로 제어 버튼들 */}
      {showRoute && selectedCafe && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-gray-800">
              {selectedCafe.name}
            </h4>
            <button
              onClick={clearRoute}
              className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            🚶‍♀️ 도보 경로가 표시되었습니다
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (selectedCafe.phone) {
                  window.open(`tel:${selectedCafe.phone}`);
                }
              }}
              className="flex-1 bg-green-500 text-white text-xs py-2 px-3 rounded-md hover:bg-green-600 transition-colors"
            >
              📞 전화
            </button>
            <button
              onClick={() => {
                const url = `https://map.naver.com/v5/directions/${userLocation?.lng},${userLocation?.lat},,/${selectedCafe.coordinates.lng},${selectedCafe.coordinates.lat},,/walk`;
                window.open(url, '_blank');
              }}
              className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              🗺️ 길찾기
            </button>
          </div>
        </div>
      )}

      {/* 카페 개수 표시 */}
      {/* {displayCafes.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium text-gray-700">
            ☕ {displayCafes.length}개 카페 발견
          </p>
          {userLocation && (
            <p className="text-xs text-gray-500">
              현재 위치 기준 {searchRadius}km 범위
              {selectedFilters.length > 0 &&
                ` • ${selectedFilters.length}개 필터 적용`}
            </p>
          )}
        </div>
      )} */}

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
