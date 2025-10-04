/**
 * 사진에 러닝 데이터를 오버랩하는 유틸리티
 * 런데이 앱처럼 사진 위에 러닝 통계를 표시
 */

/**
 * 캔버스에 러닝 데이터를 오버랩하여 이미지 생성
 */
export const createRunningPhotoOverlay = async (
  imageFile,
  runningData,
  options = {}
) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 캔버스 크기 설정
        const maxWidth = options.maxWidth || 1080;
        const maxHeight = options.maxHeight || 1080;

        let { width, height } = img;

        // 이미지 비율 유지하면서 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 오버랩 그리기
        drawRunningOverlay(ctx, width, height, runningData, options);

        // 결과 이미지 반환
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 캔버스에 러닝 데이터 오버랩 그리기
 */
const drawRunningOverlay = (ctx, width, height, runningData, options) => {
  const {
    distance = 0,
    duration = 0,
    pace = 0,
    calories = 0,
    date = new Date(),
  } = runningData;

  const {
    position = 'bottom', // 'top', 'bottom', 'center'
    theme = 'dark', // 'dark', 'light', 'gradient'
    showLogo = true,
    customText = '',
  } = options;

  // 폰트 설정
  const baseFont = Math.max(width * 0.03, 16);
  const titleFont = Math.max(width * 0.045, 22);
  const smallFont = Math.max(width * 0.025, 14);

  // 오버랩 영역 계산
  const overlayHeight = height * 0.25;
  const overlayY =
    position === 'top'
      ? 0
      : position === 'center'
        ? (height - overlayHeight) / 2
        : height - overlayHeight;

  // 배경 그리기
  drawOverlayBackground(ctx, width, overlayHeight, overlayY, theme);

  // 텍스트 색상 설정
  const textColor = theme === 'light' ? '#1a1a1a' : '#ffffff';
  const accentColor = theme === 'light' ? '#ef4444' : '#f87171';

  // 로고 및 앱 이름
  if (showLogo) {
    ctx.fillStyle = accentColor;
    ctx.font = `bold ${titleFont}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('🏃 Running Cafe', width * 0.05, overlayY + titleFont + 20);
  }

  // 날짜 표시
  ctx.fillStyle = textColor;
  ctx.font = `${smallFont}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(formatDate(date), width * 0.95, overlayY + smallFont + 20);

  // 커스텀 텍스트
  if (customText) {
    ctx.fillStyle = textColor;
    ctx.font = `${baseFont}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(customText, width / 2, overlayY + overlayHeight * 0.3);
  }

  // 러닝 통계 그리기
  drawRunningStats(
    ctx,
    width,
    overlayHeight,
    overlayY,
    {
      distance,
      duration,
      pace,
      calories,
    },
    textColor,
    accentColor,
    baseFont
  );
};

/**
 * 오버랩 배경 그리기
 */
const drawOverlayBackground = (ctx, width, height, y, theme) => {
  if (theme === 'gradient') {
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
  } else if (theme === 'light') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  }

  // 둥근 모서리 사각형
  const radius = 20;
  const x = width * 0.02;
  const rectWidth = width * 0.96;
  const rectHeight = height * 0.9;
  const rectY = y + height * 0.05;

  ctx.beginPath();
  ctx.roundRect(x, rectY, rectWidth, rectHeight, radius);
  ctx.fill();
};

/**
 * 러닝 통계 그리기
 */
const drawRunningStats = (
  ctx,
  width,
  height,
  y,
  stats,
  textColor,
  accentColor,
  baseFont
) => {
  const statsY = y + height * 0.6;
  const statWidth = width / 4;

  // 거리
  drawStat(
    ctx,
    width * 0.1,
    statsY,
    '거리',
    `${(stats.distance / 1000).toFixed(2)}km`,
    textColor,
    accentColor,
    baseFont
  );

  // 시간
  drawStat(
    ctx,
    width * 0.35,
    statsY,
    '시간',
    formatDuration(stats.duration),
    textColor,
    accentColor,
    baseFont
  );

  // 페이스
  drawStat(
    ctx,
    width * 0.6,
    statsY,
    '페이스',
    formatPace(stats.pace),
    textColor,
    accentColor,
    baseFont
  );

  // 칼로리
  drawStat(
    ctx,
    width * 0.85,
    statsY,
    '칼로리',
    `${stats.calories}kcal`,
    textColor,
    accentColor,
    baseFont
  );
};

/**
 * 개별 통계 그리기
 */
const drawStat = (
  ctx,
  x,
  y,
  label,
  value,
  textColor,
  accentColor,
  baseFont
) => {
  ctx.textAlign = 'center';

  // 값
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${baseFont * 1.2}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(value, x, y);

  // 라벨
  ctx.fillStyle = textColor;
  ctx.font = `${baseFont * 0.8}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(label, x, y + baseFont);
};

/**
 * 시간 포맷팅
 */
const formatDuration = seconds => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 페이스 포맷팅 (분/km)
 */
const formatPace = pace => {
  if (!pace || pace === 0) return '--\'--"';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
};

/**
 * 날짜 포맷팅
 */
const formatDate = date => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

/**
 * 카메라로 사진 촬영 및 오버랩 적용
 */
export const captureRunningPhoto = async (runningData, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // 모바일 환경에서 카메라 접근
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // 후면 카메라 사용

      input.onchange = async event => {
        const file = event.target.files[0];
        if (file) {
          try {
            const overlayImage = await createRunningPhotoOverlay(
              file,
              runningData,
              options
            );
            resolve(overlayImage);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('사진이 선택되지 않았습니다.'));
        }
      };

      input.click();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 이미지 다운로드
 */
export const downloadRunningPhoto = (imageBlob, filename) => {
  const url = URL.createObjectURL(imageBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `running_${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 이미지 공유 (Web Share API 사용)
 */
export const shareRunningPhoto = async (imageBlob, runningData) => {
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([imageBlob], `running_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const shareData = {
        title: '러닝 기록 공유',
        text: `${(runningData.distance / 1000).toFixed(2)}km 러닝 완주! 🏃‍♂️`,
        files: [file],
      };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    }

    // Web Share API를 지원하지 않는 경우 다운로드
    downloadRunningPhoto(imageBlob, `running_share_${Date.now()}.jpg`);
    return false;
  } catch (error) {
    console.error('공유 실패:', error);
    downloadRunningPhoto(imageBlob, `running_share_${Date.now()}.jpg`);
    return false;
  }
};
