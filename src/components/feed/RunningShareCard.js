import React, { useRef, useState, useEffect } from 'react';

/**
 * 러닝 기록을 사진 위에 오버레이하여 공유용 이미지를 생성하는 컴포넌트
 * 인스타그램 스타일의 러닝 기록 공유 카드
 */
const RunningShareCard = ({
  runningData,
  backgroundImage,
  onImageGenerated,
  style = 'default', // 'default', 'minimal', 'detailed'
}) => {
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // 시간 포맷팅 (초를 HH:MM:SS로 변환)
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 페이스 포맷팅 (분/km)
  const formatPace = pace => {
    if (!pace || pace === 0) return '--\'--"';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  // Canvas에 이미지와 데이터를 합성
  const generateShareImage = async () => {
    if (!runningData || !backgroundImage) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    try {
      // Canvas 크기 설정 (인스타그램 정사각형 비율)
      const canvasSize = 1080;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // 배경 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = backgroundImage;
      });

      // 배경 이미지 그리기 (중앙 크롭)
      const aspectRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (aspectRatio > 1) {
        // 가로가 긴 이미지
        drawHeight = canvasSize;
        drawWidth = drawHeight * aspectRatio;
        offsetX = (canvasSize - drawWidth) / 2;
        offsetY = 0;
      } else {
        // 세로가 긴 이미지
        drawWidth = canvasSize;
        drawHeight = drawWidth / aspectRatio;
        offsetX = 0;
        offsetY = (canvasSize - drawHeight) / 2;
      }

      // 배경 어둡게 처리
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // 반투명 오버레이
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // 러닝 데이터 오버레이 그리기
      if (style === 'minimal') {
        drawMinimalOverlay(ctx, canvasSize);
      } else if (style === 'detailed') {
        drawDetailedOverlay(ctx, canvasSize);
      } else {
        drawDefaultOverlay(ctx, canvasSize);
      }

      // 생성된 이미지를 base64로 변환
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(imageDataUrl);

      if (onImageGenerated) {
        onImageGenerated(imageDataUrl);
      }
    } catch (error) {
      console.error('이미지 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 기본 스타일 오버레이
  const drawDefaultOverlay = (ctx, canvasSize) => {
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // 메인 통계 (큰 거리 표시)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${runningData.distance?.toFixed(1) || '0.0'}`,
      centerX,
      centerY - 60
    );

    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('KM', centerX, centerY + 20);

    // 하단 통계 영역
    const bottomY = canvasSize - 200;
    const statSpacing = canvasSize / 4;

    // 시간
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      formatDuration(runningData.duration || 0),
      statSpacing,
      bottomY
    );
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('시간', statSpacing, bottomY + 40);

    // 페이스
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatPace(runningData.pace || 0), statSpacing * 2, bottomY);
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('페이스', statSpacing * 2, bottomY + 40);

    // 칼로리
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${runningData.calories_burned || 0}`,
      statSpacing * 3,
      bottomY
    );
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('칼로리', statSpacing * 3, bottomY + 40);

    // 상단 앱 로고/제목
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏃 Running Cafe', 60, 100);

    // 날짜
    const date = new Date().toLocaleDateString('ko-KR');
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(date, 60, 140);
  };

  // 미니멀 스타일 오버레이
  const drawMinimalOverlay = (ctx, canvasSize) => {
    const centerX = canvasSize / 2;
    const bottomY = canvasSize - 120;

    // 하단 중앙에 간단한 통계
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, bottomY - 80, canvasSize, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${runningData.distance?.toFixed(1) || '0.0'}km • ${formatDuration(runningData.duration || 0)} • ${formatPace(runningData.pace || 0)}`,
      centerX,
      bottomY + 20
    );

    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('🏃 Running Cafe', centerX, bottomY + 60);
  };

  // 상세 스타일 오버레이
  const drawDetailedOverlay = (ctx, canvasSize) => {
    const padding = 60;

    // 상단 헤더
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvasSize, 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏃 Running Cafe', padding, 70);

    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    const date = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(date, padding, 110);

    if (runningData.title) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px system-ui, -apple-system, sans-serif';
      ctx.fillText(runningData.title, padding, 150);
    }

    // 중앙 메인 통계
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2 + 50;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 140px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${runningData.distance?.toFixed(1) || '0.0'}`,
      centerX,
      centerY - 40
    );

    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('KILOMETERS', centerX, centerY + 20);

    // 하단 상세 통계
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, canvasSize - 220, canvasSize, 220);

    const statsY = canvasSize - 150;
    const statWidth = canvasSize / 3;

    // 시간
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      formatDuration(runningData.duration || 0),
      statWidth / 2,
      statsY
    );
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('시간', statWidth / 2, statsY + 35);

    // 페이스
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatPace(runningData.pace || 0), statWidth * 1.5, statsY);
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('평균 페이스', statWidth * 1.5, statsY + 35);

    // 칼로리
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${runningData.calories_burned || 0}`,
      statWidth * 2.5,
      statsY
    );
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('칼로리', statWidth * 2.5, statsY + 35);

    // 추가 정보 (있는 경우)
    if (runningData.notes) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const maxWidth = canvasSize - padding * 2;
      const lines = wrapText(ctx, runningData.notes, maxWidth);
      lines.slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, padding, canvasSize - 80 + index * 30);
      });
    }
  };

  // 텍스트 줄바꿈 헬퍼 함수
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // 배경 이미지나 러닝 데이터가 변경될 때마다 이미지 생성
  useEffect(() => {
    if (runningData && backgroundImage) {
      generateShareImage();
    }
  }, [runningData, backgroundImage, style]);

  return (
    <div className="running-share-card">
      {/* 숨겨진 Canvas - 실제 이미지 생성용 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 미리보기 */}
      {previewImage && (
        <div className="preview-container">
          <img
            src={previewImage}
            alt="공유용 러닝 기록"
            className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
            style={{ aspectRatio: '1/1' }}
          />
          {isGenerating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RunningShareCard;
