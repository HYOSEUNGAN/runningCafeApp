/**
 * 날씨 정보 서비스
 * OpenWeatherMap API를 사용하여 현재 위치의 날씨 정보 제공
 */

// OpenWeatherMap API 설정
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * 현재 날씨 정보 가져오기
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {Promise<Object>} 날씨 정보
 */
export const getCurrentWeather = async (lat, lng) => {
  try {
    // API 키가 없거나 demo인 경우 더미 데이터 반환
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'demo') {
      console.warn(
        '날씨 API 키가 설정되지 않았습니다. 더미 데이터를 사용합니다.'
      );
      return generateDummyWeather();
    }

    const url = `${WEATHER_API_URL}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return formatWeatherData(data);
  } catch (error) {
    console.error('날씨 정보 가져오기 실패:', error);
    // API 오류 시 더미 데이터 반환
    return generateDummyWeather();
  }
};

/**
 * 러닝에 적합한 날씨인지 판단
 * @param {Object} weather - 날씨 정보
 * @returns {Object} 러닝 적합도 정보
 */
export const getRunningWeatherAdvice = weather => {
  const { temperature, humidity, windSpeed, condition } = weather;

  let score = 100; // 기본 점수
  let advice = [];
  let level = 'excellent'; // excellent, good, fair, poor

  // 온도 체크 (15-25°C가 최적)
  if (temperature < 0) {
    score -= 40;
    advice.push('매우 추워요. 충분한 보온이 필요해요! 🧥');
    level = 'poor';
  } else if (temperature < 10) {
    score -= 20;
    advice.push('쌀쌀해요. 가벼운 겉옷을 준비하세요! 🧥');
    if (level === 'excellent') level = 'good';
  } else if (temperature > 30) {
    score -= 30;
    advice.push('더워요. 충분한 수분 섭취를 하세요! 💧');
    level = 'fair';
  } else if (temperature > 25) {
    score -= 10;
    advice.push('따뜻해요. 가벼운 복장이 좋겠어요! 👕');
    if (level === 'excellent') level = 'good';
  }

  // 습도 체크 (40-60%가 최적)
  if (humidity > 80) {
    score -= 15;
    advice.push('습해요. 땀이 많이 날 수 있어요! 💦');
    if (level === 'excellent') level = 'good';
  } else if (humidity < 30) {
    score -= 10;
    advice.push('건조해요. 수분 보충을 잊지 마세요! 💧');
    if (level === 'excellent') level = 'good';
  }

  // 바람 체크
  if (windSpeed > 10) {
    score -= 20;
    advice.push('바람이 강해요. 바람막이를 준비하세요! 🌬️');
    if (level === 'excellent') level = 'fair';
  }

  // 날씨 상태 체크
  if (condition.includes('rain') || condition.includes('비')) {
    score -= 50;
    advice.push('비가 와요. 실내 운동을 고려해보세요! ☔');
    level = 'poor';
  } else if (condition.includes('snow') || condition.includes('눈')) {
    score -= 40;
    advice.push('눈이 와요. 미끄럽지 않도록 주의하세요! ❄️');
    level = 'poor';
  } else if (condition.includes('cloud') || condition.includes('구름')) {
    advice.push('구름이 많아요. 러닝하기 좋은 날씨예요! ☁️');
  } else if (condition.includes('clear') || condition.includes('맑음')) {
    advice.push('맑은 날씨! 러닝하기 완벽한 날이에요! ☀️');
  }

  // 점수에 따른 레벨 조정
  if (score >= 80) level = 'excellent';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';
  else level = 'poor';

  // 기본 조언이 없으면 추가
  if (advice.length === 0) {
    advice.push('러닝하기 좋은 날씨예요! 🏃‍♀️');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    advice: advice.slice(0, 2), // 최대 2개의 조언만
    emoji: getWeatherEmoji(level),
  };
};

/**
 * 날씨 레벨에 따른 이모지 반환
 * @param {string} level - 날씨 레벨
 * @returns {string} 이모지
 */
const getWeatherEmoji = level => {
  const emojis = {
    excellent: '🌟',
    good: '👍',
    fair: '⚠️',
    poor: '❌',
  };
  return emojis[level] || '🌤️';
};

/**
 * 날씨 데이터 포맷팅
 * @param {Object} data - OpenWeatherMap API 응답
 * @returns {Object} 포맷된 날씨 데이터
 */
const formatWeatherData = data => {
  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind?.speed * 3.6) || 0, // m/s to km/h
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    city: data.name,
    country: data.sys.country,
    timestamp: Date.now(),
  };
};

/**
 * 더미 날씨 데이터 생성 (API 키가 없을 때)
 * @returns {Object} 더미 날씨 데이터
 */
const generateDummyWeather = () => {
  // 현재 시간에 따라 다른 더미 데이터 생성
  const hour = new Date().getHours();
  const season = Math.floor((new Date().getMonth() + 1) / 3); // 0: 겨울, 1: 봄, 2: 여름, 3: 가을

  let baseTemp, condition, icon;

  // 계절별 기본 온도 설정
  switch (season) {
    case 0: // 겨울 (12, 1, 2월)
      baseTemp = Math.random() * 10 - 2; // -2 ~ 8도
      condition = ['맑음', '구름많음', '눈'][Math.floor(Math.random() * 3)];
      icon = condition === '눈' ? '13d' : hour > 6 && hour < 18 ? '01d' : '01n';
      break;
    case 1: // 봄 (3, 4, 5월)
      baseTemp = Math.random() * 15 + 10; // 10 ~ 25도
      condition = ['맑음', '구름조금', '구름많음'][
        Math.floor(Math.random() * 3)
      ];
      icon = hour > 6 && hour < 18 ? '02d' : '02n';
      break;
    case 2: // 여름 (6, 7, 8월)
      baseTemp = Math.random() * 10 + 25; // 25 ~ 35도
      condition = ['맑음', '구름많음', '소나기'][Math.floor(Math.random() * 3)];
      icon =
        condition === '소나기' ? '10d' : hour > 6 && hour < 18 ? '01d' : '01n';
      break;
    case 3: // 가을 (9, 10, 11월)
      baseTemp = Math.random() * 15 + 8; // 8 ~ 23도
      condition = ['맑음', '구름조금', '구름많음'][
        Math.floor(Math.random() * 3)
      ];
      icon = hour > 6 && hour < 18 ? '03d' : '03n';
      break;
    default:
      baseTemp = 20;
      condition = '맑음';
      icon = '01d';
  }

  return {
    temperature: Math.round(baseTemp),
    feelsLike: Math.round(baseTemp + (Math.random() * 4 - 2)), // ±2도 차이
    humidity: Math.round(Math.random() * 40 + 40), // 40-80%
    windSpeed: Math.round(Math.random() * 15), // 0-15 km/h
    condition,
    icon,
    city: '서울',
    country: 'KR',
    timestamp: Date.now(),
  };
};

/**
 * 날씨 아이콘 URL 생성
 * @param {string} iconCode - OpenWeatherMap 아이콘 코드
 * @returns {string} 아이콘 URL
 */
export const getWeatherIconUrl = iconCode => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * 날씨 상태에 따른 이모지 반환
 * @param {string} condition - 날씨 상태
 * @returns {string} 이모지
 */
export const getWeatherConditionEmoji = condition => {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('clear') || conditionLower.includes('맑'))
    return '☀️';
  if (conditionLower.includes('cloud') || conditionLower.includes('구름'))
    return '☁️';
  if (conditionLower.includes('rain') || conditionLower.includes('비'))
    return '🌧️';
  if (conditionLower.includes('snow') || conditionLower.includes('눈'))
    return '❄️';
  if (conditionLower.includes('thunder') || conditionLower.includes('천둥'))
    return '⛈️';
  if (conditionLower.includes('mist') || conditionLower.includes('안개'))
    return '🌫️';
  if (conditionLower.includes('wind') || conditionLower.includes('바람'))
    return '💨';

  return '🌤️'; // 기본값
};

export default {
  getCurrentWeather,
  getRunningWeatherAdvice,
  getWeatherIconUrl,
  getWeatherConditionEmoji,
};
