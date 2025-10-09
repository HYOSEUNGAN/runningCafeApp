import {
  format,
  formatDistance as formatDateDistance,
  isToday,
  isYesterday,
} from 'date-fns';
import { ko } from 'date-fns/locale';

// UTC 시간을 한국 시간대(KST)로 변환하여 날짜 키 생성
export const getKSTDateKey = utcDateString => {
  const utcDate = new Date(utcDateString);
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return kstDate.toISOString().split('T')[0];
};

// 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 변환 없이)
export const getLocalDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 날짜 포맷팅
export const formatDate = (date, formatString = 'yyyy.MM.dd') => {
  if (!date) return '';
  return format(new Date(date), formatString, { locale: ko });
};

// 상대적 시간 표시
export const formatRelativeTime = date => {
  if (!date) return '';

  const targetDate = new Date(date);

  if (isToday(targetDate)) {
    return format(targetDate, 'HH:mm');
  }

  if (isYesterday(targetDate)) {
    return '어제';
  }

  return formatDateDistance(targetDate, new Date(), {
    addSuffix: true,
    locale: ko,
  });
};

// 거리 포맷팅 (미터 단위)
export const formatDistance = meters => {
  if (!meters) return '0m';

  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  return `${(meters / 1000).toFixed(1)}km`;
};

// 시간 포맷팅 (초 -> 분:초)
export const formatDuration = seconds => {
  if (!seconds) return '00:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 시간 포맷팅 (밀리초 -> HH:MM:SS)
export const formatTime = milliseconds => {
  if (!milliseconds) return '00:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 칼로리 포맷팅
export const formatCalories = calories => {
  if (!calories) return '0';
  return Math.round(calories).toString();
};

// 숫자 포맷팅 (천 단위 콤마)
export const formatNumber = number => {
  if (!number) return '0';
  return number.toLocaleString('ko-KR');
};

// 페이스 계산 (분/km)
export const calculatePace = (distance, duration) => {
  if (!distance || !duration || distance === 0) return '0\'00"';

  const distanceInKm = distance / 1000;
  const durationInMinutes = duration / 60000;
  const paceInMinutes = durationInMinutes / distanceInKm;

  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes - minutes) * 60);

  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
};
