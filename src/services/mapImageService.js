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

      if (!path || path.length === 0) {
        console.log('경로 데이터가 비어있음 - 기본 이미지 생성');
        // 경로가 없는 경우 기본 이미지
        drawEmptyMapPlaceholder(ctx, width, height, title, {
          distance,
          duration,
          showDistance,
          showDuration,
        });
      } else {
        console.log(`경로 데이터 처리 시작: ${path.length}개 지점`);

        // 경로 좌표 정규화
        const bounds = calculateMapBounds(path, 0.01);
        console.log('경계 계산 완료:', bounds);

        if (!bounds) {
          console.warn('경계 계산 실패 - 기본 이미지로 대체');
          drawEmptyMapPlaceholder(ctx, width, height, title, {
            distance,
            duration,
            showDistance,
            showDuration,
          });
        } else {
          const normalizedPath = normalizeCoordinates(
            path,
            bounds,
            width,
            height
          );
          console.log(`좌표 정규화 완료: ${normalizedPath.length}개 지점`);

          // 지도 배경 패턴 그리기
          drawMapBackground(ctx, width, height);

          // 러닝 경로 그리기
          if (normalizedPath.length >= 2) {
            drawRunningPath(ctx, normalizedPath, routeColor, routeWidth);
            console.log('경로 그리기 완료');
          }

          // 시작/끝 마커 그리기 (더 크게)
          if (normalizedPath.length > 0) {
            drawMarker(
              ctx,
              normalizedPath[0].x,
              normalizedPath[0].y,
              startMarkerColor,
              'START',
              18 // 더 크게
            );
            if (normalizedPath.length > 1) {
              const lastPoint = normalizedPath[normalizedPath.length - 1];
              drawMarker(
                ctx,
                lastPoint.x,
                lastPoint.y,
                endMarkerColor,
                'END',
                18 // 더 크게
              );
            }
            console.log('마커 그리기 완료');
          }

          // 카페 마커 그리기
          if (showCafes && nearbyCafes && nearbyCafes.length > 0) {
            try {
              const normalizedCafes = normalizeCafeCoordinates(
                nearbyCafes,
                bounds,
                width,
                height
              );
              normalizedCafes.forEach((cafe, index) => {
                drawCafeMarker(ctx, cafe.x, cafe.y, cafeMarkerColor, index + 1);
              });
              console.log(`카페 마커 그리기 완료: ${normalizedCafes.length}개`);
            } catch (cafeError) {
              console.warn('카페 마커 그리기 실패:', cafeError);
            }
          }
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

      console.log('이미진 그리기 완료 - Blob 변환 시작');

      // Canvas 품질 검증
      const imageData = ctx.getImageData(0, 0, width, height);
      console.log('Canvas 이미지 데이터:', {
        width: imageData.width,
        height: imageData.height,
        dataLength: imageData.data.length,
      });

      // Canvas를 Blob으로 변환 (더 높은 품질)
      canvas.toBlob(
        blob => {
          if (blob && blob.size > 0) {
            console.log('Blob 변환 성공:', {
              size: blob.size,
              type: blob.type,
              sizeInKB: (blob.size / 1024).toFixed(2) + 'KB',
            });
            resolve(blob);
          } else {
            console.error('Blob 변환 실패 또는 빈 Blob');
            reject(new Error('이미지 생성에 실패했습니다.'));
          }
        },
        'image/png',
        1.0 // 최대 품질
      );
    } catch (error) {
      console.error('지도 이미지 생성 실패:', error);
      console.error('에러 스택:', error.stack);
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
  if (!path || !bounds || path.length === 0) {
    console.warn('좌표 정규화 실패: 잘못된 입력 데이터');
    return [];
  }

  const padding = 80; // 여백 증가
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2 - 120; // 하단 정보 영역 여백 증가

  console.log('좌표 정규화 시작:', { bounds, drawWidth, drawHeight });

  const normalized = path
    .map((point, index) => {
      try {
        const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
        const lng = typeof point.lng === 'function' ? point.lng() : point.lng;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          console.warn(`잘못된 좌표 데이터 (index ${index}):`, { lat, lng });
          return null;
        }

        // 위도/경도를 0-1 범위로 정규화
        const normalizedLng = (lng - bounds.west) / (bounds.east - bounds.west);
        const normalizedLat =
          1 - (lat - bounds.south) / (bounds.north - bounds.south); // Y축 반전

        return {
          x: padding + normalizedLng * drawWidth,
          y: padding + normalizedLat * drawHeight,
          lat,
          lng,
        };
      } catch (error) {
        console.warn(`좌표 정규화 오류 (index ${index}):`, error);
        return null;
      }
    })
    .filter(point => point !== null);

  console.log(`좌표 정규화 완료: ${path.length} -> ${normalized.length}`);
  return normalized;
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
  const padding = 80; // 여백 증가
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2 - 120; // 하단 영역 증가

  return cafes
    .filter(cafe => cafe.coordinates)
    .map(cafe => {
      const { lat, lng } = cafe.coordinates;
      const normalizedLng = (lng - bounds.west) / (bounds.east - bounds.west);
      const normalizedLat =
        1 - (lat - bounds.south) / (bounds.north - bounds.south);

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
  if (!normalizedPath || normalizedPath.length < 2) {
    console.log('경로 데이터 부족으로 경로 그리기 생략');
    return;
  }

  console.log(
    `경로 그리기 시작: ${normalizedPath.length}개 지점, 색상: ${color}, 두께: ${width}`
  );

  // 배경 경로 (더 두껏게, 어둡게)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = width + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(normalizedPath[0].x, normalizedPath[0].y);
  for (let i = 1; i < normalizedPath.length; i++) {
    ctx.lineTo(normalizedPath[i].x, normalizedPath[i].y);
  }
  ctx.stroke();

  // 메인 경로
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 경로 그림자 효과
  ctx.shadowColor = 'rgba(139, 61, 255, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

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

  console.log('경로 그리기 완료');
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
  // 마커 그림자
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // 마커 원형 배경
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();

  // 마커 테두리
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 그림자 초기화
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 마커 텍스트 (더 크게)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
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

  // 하단 정보 패널 배경 (더 높게)
  const panelHeight = 120;
  const panelY = height - panelHeight;

  // 그래디언트 배경
  const gradient = ctx.createLinearGradient(0, panelY, 0, height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  gradient.addColorStop(1, 'rgba(248, 250, 252, 0.95)');
  ctx.fillStyle = gradient;

  // 둥근 모서리 패널
  ctx.beginPath();
  ctx.roundRect(0, panelY, width, panelHeight, [0, 0, 20, 20]);
  ctx.fill();

  // 패널 상단 경계선
  ctx.strokeStyle = '#8b3dff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, panelY);
  ctx.lineTo(width - 20, panelY);
  ctx.stroke();

  // 제목 (더 크게)
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, panelY + 35);

  // 통계 정보
  if (showDistance || showDuration) {
    const stats = [];
    if (showDistance && distance > 0) {
      stats.push(`📏 ${(distance / 1000).toFixed(1)}km`);
    }
    if (showDuration && duration > 0) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      stats.push(`⏱️ ${minutes}분 ${seconds}초`);
    }

    if (stats.length > 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(stats.join(' • '), width / 2, panelY + 70);
    }
  }

  // 앱 브랜드 (더 크게)
  ctx.fillStyle = '#8b3dff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🏃‍♀️ Running Cafe', width / 2, panelY + 95);
};

/**
 * 빈 지도 플레이스홀더 그리기 - Running View 흐릿한 배경 포함
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @param {string} title - 제목
 */
const drawEmptyMapPlaceholder = (ctx, width, height, title, options = {}) => {
  console.log('Running View 배경이 포함된 빈 지도 플레이스홀더 그리기');
  const {
    distance = 0,
    duration = 0,
    showDistance = false,
    showDuration = false,
  } = options;

  // 1. 러닝 배경 패턴 그리기
  drawRunningViewBackground(ctx, width, height);

  // 2. 흐릿한 오버레이 효과
  const overlayGradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    width * 0.6
  );
  overlayGradient.addColorStop(0, 'rgba(139, 61, 255, 0.1)');
  overlayGradient.addColorStop(0.7, 'rgba(67, 233, 123, 0.05)');
  overlayGradient.addColorStop(1, 'rgba(255, 107, 53, 0.03)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, width, height);

  // 3. 중앙 컨텐츠 영역
  const centerX = width / 2;
  const centerY = height / 2;
  const cardWidth = width * 0.85;
  const cardHeight = height * 0.65;

  // 메인 카드 배경 (유리 효과)
  const cardGradient = ctx.createLinearGradient(
    0,
    centerY - cardHeight / 2,
    0,
    centerY + cardHeight / 2
  );
  cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  cardGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  cardGradient.addColorStop(1, 'rgba(248, 250, 252, 0.2)');
  ctx.fillStyle = cardGradient;

  // 카드 그리기 (둥근 모서리)
  const cardX = centerX - cardWidth / 2;
  const cardY = centerY - cardHeight / 2;
  const cornerRadius = 24;

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cornerRadius);
  ctx.fill();

  // 카드 테두리 (글로우 효과)
  ctx.strokeStyle = 'rgba(139, 61, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(139, 61, 255, 0.3)';
  ctx.shadowBlur = 15;
  ctx.stroke();

  // 그림자 초기화
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 4. 러닝 아이콘 (더 크고 생동감 있게)
  ctx.fillStyle = '#8b3dff';
  ctx.font = 'bold 90px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏃‍♀️', centerX, centerY - 90);

  // 아이콘 주변 글로우 효과
  ctx.shadowColor = 'rgba(139, 61, 255, 0.4)';
  ctx.shadowBlur = 20;
  ctx.fillText('🏃‍♀️', centerX, centerY - 90);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 5. 제목 (더 눈에 띄게)
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(title, centerX, centerY - 15);

  // 제목 하이라이트 효과
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillText(title, centerX, centerY - 15);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 6. 통계 정보 표시 (더 세련되게)
  if (showDistance || showDuration) {
    const stats = [];
    if (showDistance && distance > 0) {
      stats.push(`📏 ${(distance / 1000).toFixed(1)}km`);
    }
    if (showDuration && duration > 0) {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      stats.push(`⏱️ ${minutes}분 ${seconds}초`);
    }

    if (stats.length > 0) {
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 26px Arial';
      ctx.fillText(stats.join(' • '), centerX, centerY + 45);
    }
  } else {
    // 기본 메시지 (더 매력적으로)
    ctx.fillStyle = '#6b7280';
    ctx.font = '22px Arial';
    ctx.fillText('러닝의 추억을 기록해보세요', centerX, centerY + 45);
  }

  // 7. 하단 브랜드 (글로우 효과와 함께)
  ctx.fillStyle = '#8b3dff';
  ctx.font = 'bold 20px Arial';
  ctx.shadowColor = 'rgba(139, 61, 255, 0.3)';
  ctx.shadowBlur = 10;
  ctx.fillText('🏃‍♀️ Running Cafe', centerX, centerY + 110);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 8. 장식적인 요소들 추가
  drawDecorativeElements(ctx, width, height, centerX, centerY);
};

/**
 * Running View 배경 패턴 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 */
const drawRunningViewBackground = (ctx, width, height) => {
  // 1. 기본 그래디언트 배경
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#f0f9ff'); // 연한 파랑
  bgGradient.addColorStop(0.3, '#e0f2fe'); // 중간 파랑
  bgGradient.addColorStop(0.7, '#f0fdf4'); // 연한 초록
  bgGradient.addColorStop(1, '#fef3e2'); // 연한 오렌지
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. 러닝 트랙 패턴 (흐릿하게)
  ctx.globalAlpha = 0.1;
  drawRunningTrackPattern(ctx, width, height);
  ctx.globalAlpha = 1;

  // 3. 도시 실루엣 (매우 흐릿하게)
  ctx.globalAlpha = 0.05;
  drawCitySilhouette(ctx, width, height);
  ctx.globalAlpha = 1;

  // 4. 러닝 경로 스타일 곡선들 (장식용)
  ctx.globalAlpha = 0.08;
  drawDecorativeRunningPaths(ctx, width, height);
  ctx.globalAlpha = 1;
};

/**
 * 러닝 트랙 패턴 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 */
const drawRunningTrackPattern = (ctx, width, height) => {
  const centerX = width / 2;
  const centerY = height / 2;

  // 타원형 트랙들 (여러 개의 동심원)
  const trackCount = 5;
  for (let i = 0; i < trackCount; i++) {
    const radiusX = width * 0.3 + i * 30;
    const radiusY = height * 0.2 + i * 20;

    ctx.strokeStyle = `rgba(139, 61, 255, ${0.3 - i * 0.05})`;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.setLineDash([10, 15]);

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.setLineDash([]); // 점선 해제
};

/**
 * 도시 실루엣 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 */
const drawCitySilhouette = (ctx, width, height) => {
  ctx.fillStyle = 'rgba(75, 85, 99, 0.3)';

  // 간단한 빌딩 실루엣들
  const buildings = [
    { x: 0, width: 80, height: 120 },
    { x: 80, width: 60, height: 180 },
    { x: 140, width: 90, height: 150 },
    { x: 230, width: 70, height: 200 },
    { x: 300, width: 100, height: 130 },
    { x: 400, width: 85, height: 170 },
    { x: 485, width: 75, height: 140 },
    { x: 560, width: 95, height: 160 },
    { x: 655, width: 80, height: 190 },
    { x: 735, width: 65, height: 145 },
  ];

  buildings.forEach(building => {
    if (building.x < width) {
      const buildingHeight = Math.min(building.height, height * 0.4);
      ctx.fillRect(
        building.x,
        height - buildingHeight,
        building.width,
        buildingHeight
      );
    }
  });
};

/**
 * 장식용 러닝 경로 곡선들 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 */
const drawDecorativeRunningPaths = (ctx, width, height) => {
  // 여러 개의 곡선 경로 그리기
  const paths = [
    {
      start: { x: 0, y: height * 0.7 },
      control1: { x: width * 0.3, y: height * 0.3 },
      control2: { x: width * 0.7, y: height * 0.8 },
      end: { x: width, y: height * 0.4 },
      color: 'rgba(67, 233, 123, 0.4)',
    },
    {
      start: { x: 0, y: height * 0.3 },
      control1: { x: width * 0.4, y: height * 0.8 },
      control2: { x: width * 0.6, y: height * 0.2 },
      end: { x: width, y: height * 0.6 },
      color: 'rgba(139, 61, 255, 0.4)',
    },
    {
      start: { x: 0, y: height * 0.5 },
      control1: { x: width * 0.2, y: height * 0.1 },
      control2: { x: width * 0.8, y: height * 0.9 },
      end: { x: width, y: height * 0.3 },
      color: 'rgba(255, 107, 53, 0.4)',
    },
  ];

  paths.forEach(path => {
    ctx.strokeStyle = path.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(path.start.x, path.start.y);
    ctx.bezierCurveTo(
      path.control1.x,
      path.control1.y,
      path.control2.x,
      path.control2.y,
      path.end.x,
      path.end.y
    );
    ctx.stroke();
  });
};

/**
 * 장식적인 요소들 그리기
 * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
 * @param {number} width - Canvas 너비
 * @param {number} height - Canvas 높이
 * @param {number} centerX - 중심 X 좌표
 * @param {number} centerY - 중심 Y 좌표
 */
const drawDecorativeElements = (ctx, width, height, centerX, centerY) => {
  // 1. 코너 장식 요소들
  const cornerElements = [
    { x: 40, y: 40, emoji: '💪', size: 24 },
    { x: width - 80, y: 50, emoji: '🔥', size: 20 },
    { x: 60, y: height - 80, emoji: '⚡', size: 22 },
    { x: width - 60, y: height - 70, emoji: '🏆', size: 26 },
  ];

  ctx.globalAlpha = 0.6;
  cornerElements.forEach(element => {
    ctx.font = `${element.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.emoji, element.x, element.y);
  });
  ctx.globalAlpha = 1;

  // 2. 반짝이는 점들 (별처럼)
  const sparkles = [
    { x: centerX - 150, y: centerY - 200, size: 3 },
    { x: centerX + 180, y: centerY - 150, size: 2 },
    { x: centerX - 200, y: centerY + 100, size: 4 },
    { x: centerX + 160, y: centerY + 180, size: 2 },
    { x: centerX + 220, y: centerY - 80, size: 3 },
    { x: centerX - 180, y: centerY + 200, size: 2 },
  ];

  ctx.globalAlpha = 0.4;
  sparkles.forEach(sparkle => {
    if (
      sparkle.x > 0 &&
      sparkle.x < width &&
      sparkle.y > 0 &&
      sparkle.y < height
    ) {
      ctx.fillStyle = '#fbbf24'; // yellow-400
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
};

/**
 * Blob을 File 객체로 변환
 * @param {Blob} blob - 변환할 Blob
 * @param {string} filename - 파일명
 * @returns {File} File 객체
 */
export const blobToFile = (blob, filename = 'running-map.png') => {
  if (!blob) {
    throw new Error('Blob이 null이거나 undefined입니다.');
  }

  const file = new File([blob], filename, {
    type: blob.type || 'image/png',
    lastModified: Date.now(),
  });

  console.log('File 변환 완료:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  });

  return file;
};

/**
 * 러닝 기록용 지도 이미지 생성 (NavigationPage용 헬퍼)
 * @param {Object} runningData - 러닝 기록 데이터
 * @returns {Promise<File>} 생성된 이미지 파일
 */
export const createRunningRecordMapImage = async runningData => {
  try {
    console.log('지도 이미지 생성 시작:', runningData);
    const {
      path = [],
      nearbyCafes = [],
      distance = 0,
      duration = 0,
      title = null,
      isEmptyPath = false,
    } = runningData;

    // 거리 계산 (미터 -> 킬로미터)
    const distanceInKm = distance / 1000;
    const finalTitle =
      title ||
      (distanceInKm > 0 ? `${distanceInKm.toFixed(1)}km 러닝` : '러닝 기록');

    const imageOptions = {
      title: finalTitle,
      distance,
      duration,
      showDistance: distance > 0,
      showDuration: duration > 0,
      showCafes: nearbyCafes && nearbyCafes.length > 0,
      routeColor: '#8b3dff', // 프로젝트 메인 컬러
      routeWidth: 6,
      width: 1080, // Instagram 친화적 크기
      height: 1080, // 정사각형
      isEmptyPath,
    };

    console.log('이미지 옵션:', imageOptions);
    console.log('경로 데이터 길이:', path.length);
    console.log('카페 데이터 길이:', nearbyCafes.length);

    const imageBlob = await generateRunningMapImage(
      path,
      nearbyCafes,
      imageOptions
    );

    if (!imageBlob) {
      throw new Error('이미지 Blob 생성 실패');
    }

    const imageFile = blobToFile(imageBlob, `running-${Date.now()}.png`);
    console.log('지도 이미지 생성 완료:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
    });

    return imageFile;
  } catch (error) {
    console.error('러닝 기록 지도 이미지 생성 실패:', error);
    console.error('에러 상세:', error.stack);
    throw error;
  }
};
