export const APP_CONFIG = {
  NAME: 'Running Cafe',
  VERSION: '1.0.0',
  DESCRIPTION: '러닝과 카페를 연결하는 플랫폼',
  // 환경 감지 함수
  isProduction: () => {
    return (
      process.env.NODE_ENV === 'production' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    );
  },
  isDevelopment: () => {
    return (
      process.env.NODE_ENV === 'development' ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')
    );
  },
  getCurrentOrigin: () => {
    return window.location.origin;
  },
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  RUNNING_COURSES: '/courses',
  MAP: '/map',
  NAV: '/nav',
  CAFES: '/cafes',
  MY_RECORDS: '/records',
};

export const API_ENDPOINTS = {
  USERS: 'users',
  RUNNING_COURSES: 'running_courses',
  CAFES: 'cafes',
  RECORDS: 'running_records',
  REVIEWS: 'reviews',
};

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
};
