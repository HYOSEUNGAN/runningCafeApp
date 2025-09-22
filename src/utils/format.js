import { format, formatDistance, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

// 날짜 포맷팅
export const formatDate = (date, formatString = 'yyyy.MM.dd') => {
  if (!date) return '';
  return format(new Date(date), formatString, { locale: ko });
};

// 상대적 시간 표시
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const targetDate = new Date(date);
  
  if (isToday(targetDate)) {
    return format(targetDate, 'HH:mm');
  }
  
  if (isYesterday(targetDate)) {
    return '어제';
  }
  
  return formatDistance(targetDate, new Date(), {
    addSuffix: true,
    locale: ko,
  });
};

// 거리 포맷팅
export const formatDistance = (meters) => {
  if (!meters) return '0m';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  
  return `${(meters / 1000).toFixed(1)}km`;
};

// 시간 포맷팅 (초 -> 분:초)
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 숫자 포맷팅 (천 단위 콤마)
export const formatNumber = (number) => {
  if (!number) return '0';
  return number.toLocaleString('ko-KR');
};
