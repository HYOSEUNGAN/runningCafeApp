import { calculateMapBounds } from '../utils/mapRunner';

/**
 * 지도 이미지 생성 서비스
 * 러닝 경로와 함께 지도 이미지를 Canvas로 생성
 */

/**
 * 러닝 경로가 포함된 지도 이미지 생성
 * @param {Array} path - 러닝 경로 좌표 배열 [{lat, lng}, ...]
 * @param {Array} nearbyCafes - 주변 카페 정보
 * @param {Object} options - 이미지 생성 옵션
 * @returns {Promise<Blob>} 생성된 이미지 Blob
 */
export const generateRunningMapImage = async (
  path,
  nearbyCafes = [],
  options = {}
) => {
  const {
    width = 800,
    height = 600,
    backgroundColor = '#f0f9ff',
    routeColor = '#3b82f6',
    routeWidth = 4,
    startMarkerColor = '#22c55e',
    endMarkerColor = '#ef4444',
    cafeMarkerColor = '#f59e0b',
    showCafes = true,
    showDistance = true,
    showDuration = true,
    title = '러닝 기록',
    distance = 0,
    duration = 0,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 배경 그리기
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (path.length === 0) {
        // 경로가 없는 경우 기본 이미지
        drawEmptyMapPlaceholder(ctx, width, height, title);
      } else {
        // 경로 좌표 정규화
        const bounds = calculateMapBounds(path, 0.01);
        const normalizedPath = normalizeCoordinates(path, bounds, width, height);

        // 지도 배경 패턴 그리기
        drawMapBackground(ctx, width, height);

        // 러닝 경로 그리기
        drawRunningPath(ctx, normalizedPath, routeColor, routeWidth);

        // 시작/끝 마커 그리기
        if (normalizedPath.length > 0) {
          drawMarker(
            ctx,
            normalizedPath[0].x,
            normalizedPath[0].y,
            startMarkerColor,
            'START',
            12
          );
          if (normalizedPath.length > 1) {
            const lastPoint = normalizedPath[normalizedPath.length - 1];
            drawMarker(
              ctx,
              lastPoint.x,
              lastPoint.y,
              endMarkerColor,
              'END',
              12
            );
          }
        }

        // 카페 마커 그리기
        if (showCafes && nearbyCafes.length > 0) {
          const normalizedCafes = normalizeCafeCoordinates(
            nearbyCafes,
            bounds,
            width,
            height
          );
          normalizedCafes.forEach((cafe, index) => {
            drawCafeMarker(ctx, cafe.x, cafe.y, cafeMarkerColor, index + 1);
          });
        }
      }

      // 정보 오버레이 그리기
      drawInfoOverlay(ctx, width, height, {
        title,
        distance,
        duration,
        showDistance,
        showDuration,
      });

      // Canvas를 Blob으로 변환
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 생성에 실패했습니다.'));
          }
        },
        'image/png',
        0.9
      );
    } catch (error) {
      console.error('지도 이미지 생성 실패:', error);
      reject(error);
    }
  });
};

/**
 * 좌표를 Canvas 좌표계로 정규화
 * @param {Array} path - 경로 좌표 배열
 * @param {Object} bounds - 지도 경계
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @returns {Array} 정규화된 좌표 배열
 */
const normalizeCoordinates = (path, bounds, width, height) => {
  const padding = 60; // 여백
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2 - 80; // 하단 정보 영역 여백

  return path.map(point => {
    const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
    const lng = typeof point.lng === 'function' ? point.lng() : point.lng;

    // 위도/경도를 0-1 범위로 정규화
    const normalizedLng = (lng - bounds.west) / (bounds.east - bounds.west);
    const normalizedLat = 1 - (lat - bounds.south) / (bounds.north - bounds.south); // Y축 반전

    return {
      x: padding + normalizedLng * drawWidth,
      y: padding + normalizedLat * drawHeight,
      lat,
      lng,
    };
  });
};

/**
 * 카페 좌표를 정규화
 * @param {Array} cafes - 카페 정보 배열
 * @param {Object} bounds - 지도 경계
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @returns {Array} 정규화된 카페 좌표 배열
 */
const normalizeCafeCoordinates = (cafes, bounds, width, height) => {
  const padding = 60;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2 - 80;

  return cafes
    .filter(cafe => cafe.coordinates)
    .map(cafe => {
      const { lat, lng } = cafe.coordinates;
      const normalizedLng = (lng - bounds.west) / (bounds.east - bounds.west);
      const normalizedLat = 1 - (lat - bounds.south) / (bounds.north - bounds.south);

      return {
        x: padding + normalizedLng * drawWidth,
        y: padding + normalizedLat * drawHeight,
        name: cafe.name,
        lat,
        lng,
      };
    });
};

/**
 * 지도 배경 패턴 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 */
const drawMapBackground = (ctx, width, height) => {
  // 그리드 패턴
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;

  const gridSize = 50;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
};

/**
 * 러닝 경로 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {Array} normalizedPath - 정규화된 경로 좌표
 * @param {string} color - 경로 색상
 * @param {number} width - 경로 두께
 */
const drawRunningPath = (ctx, normalizedPath, color, width) => {
  if (normalizedPath.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 경로 그림자 효과
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.moveTo(normalizedPath[0].x, normalizedPath[0].y);

  for (let i = 1; i < normalizedPath.length; i++) {
    ctx.lineTo(normalizedPath[i].x, normalizedPath[i].y);
  }

  ctx.stroke();

  // 그림자 초기화
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

/**
 * 마커 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {string} color - 마커 색상
 * @param {string} text - 마커 텍스트
 * @param {number} size - 마커 크기
 */
const drawMarker = (ctx, x, y, color, text, size) => {
  // 마커 원형 배경
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();

  // 마커 테두리
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 마커 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

/**
 * 카페 마커 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {string} color - 마커 색상
 * @param {number} number - 카페 번호
 */
const drawCafeMarker = (ctx, x, y, color, number) => {
  // 카페 마커 (사각형)
  const size = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);

  // 마커 테두리
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);

  // 카페 번호
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), x, y);
};

/**
 * 정보 오버레이 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @param {Object} info - 표시할 정보
 */
const drawInfoOverlay = (ctx, width, height, info) => {
  const { title, distance, duration, showDistance, showDuration } = info;

  // 하단 정보 패널 배경
  const panelHeight = 80;
  const panelY = height - panelHeight;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(0, panelY, width, panelHeight);

  // 패널 테두리
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, panelY, width, panelHeight);

  // 제목
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, panelY + 25);

  // 통계 정보
  if (showDistance || showDuration) {
    const stats = [];
    if (showDistance && distance > 0) {
      stats.push(`거리: ${(distance / 1000).toFixed(1)}km`);
    }
    if (showDuration && duration > 0) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      stats.push(`시간: ${minutes}분 ${seconds}초`);
    }

    if (stats.length > 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.fillText(stats.join(' • '), width / 2, panelY + 50);
    }
  }

  // 앱 로고/브랜드
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial';
  ctx.fillText('Running Cafe', width / 2, panelY + 70);
};

/**
 * 빈 지도 플레이스홀더 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @param {string} title - 제목
 */
const drawEmptyMapPlaceholder = (ctx, width, height, title) => {
  // 중앙 플레이스홀더
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(width / 4, height / 4, width / 2, height / 2);

  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(width / 4, height / 4, width / 2, height / 2);

  // 플레이스홀더 텍스트
  ctx.fillStyle = '#6b7280';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏃‍♀️', width / 2, height / 2 - 20);
  ctx.fillText('러닝 경로 없음', width / 2, height / 2 + 10);
};

/**
 * Blob을 File 객체로 변환
 * @param {Blob} blob - 변환할 Blob
 * @param {string} filename - 파일명
 * @returns {File} File 객체
 */
export const blobToFile = (blob, filename = 'running-map.png') => {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
  });
};

/**
 * 러닝 기록용 지도 이미지 생성 (NavigationPage용 헬퍼)
 * @param {Object} runningData - 러닝 기록 데이터
 * @returns {Promise<File>} 생성된 이미지 파일
 */
export const createRunningRecordMapImage = async runningData => {
  try {
    const { path, nearbyCafes, distance, duration } = runningData;

    const imageBlob = await generateRunningMapImage(path, nearbyCafes, {
      title: `${(distance / 1000).toFixed(1)}km 러닝`,
      distance,
      duration,
      showDistance: true,
      showDuration: true,
      showCafes: nearbyCafes && nearbyCafes.length > 0,
    });

    return blobToFile(imageBlob, `running-${Date.now()}.png`);
  } catch (error) {
    console.error('러닝 기록 지도 이미지 생성 실패:', error);
    throw error;
  }
};
