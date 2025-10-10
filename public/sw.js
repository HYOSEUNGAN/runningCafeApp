/**
 * Running Cafe Service Worker
 * 백그라운드에서 러닝 추적을 지속하기 위한 서비스 워커
 */

// 버전 기반 캐시 이름 (배포시마다 변경)
const VERSION = '1.0.1'; // 배포할 때마다 이 버전을 업데이트하세요
const CACHE_NAME = `running-cafe-v${VERSION}`;
const RUNNING_DATA_CACHE = `running-data-v${VERSION}`;

// 캐시할 리소스 목록
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.svg',
];

// 러닝 세션 데이터 저장소
let runningSession = null;
let locationWatchId = null;
let isTracking = false;

// Service Worker 설치
self.addEventListener('install', event => {
  console.log('[SW] 서비스 워커 설치 중...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 캐시 열기 완료');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] 캐시 설치 실패:', error);
      })
  );

  // 새 서비스 워커를 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  console.log('[SW] 서비스 워커 활성화됨');

  event.waitUntil(
    Promise.all([
      // 모든 기존 캐시 삭제 (버전이 다른 경우)
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNNING_DATA_CACHE) {
              console.log('[SW] 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 새 버전의 서비스 워커임을 클라이언트에 알림
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: VERSION,
            message: '새 버전이 설치되었습니다. 페이지를 새로고침해주세요.',
          });
        });
      }),
    ])
  );

  // 모든 클라이언트에서 새 서비스 워커 제어
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // 러닝 데이터 API 요청은 캐시하지 않음
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        // 캐시에 있으면 캐시된 버전 반환
        if (response) {
          return response;
        }

        // 없으면 네트워크에서 가져오기
        return fetch(event.request).then(response => {
          // 유효한 응답인지 확인
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          // 응답을 복사하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // 오프라인 상태에서 기본 페이지 반환
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// 메인 앱으로부터 메시지 수신
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      // 새 서비스 워커로 즉시 전환
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // 모든 캐시 강제 삭제
      clearAllCaches();
      break;

    case 'GET_VERSION':
      // 현재 서비스 워커 버전 반환
      event.ports[0].postMessage({
        type: 'VERSION_INFO',
        version: VERSION,
      });
      break;

    case 'START_BACKGROUND_TRACKING':
      startBackgroundTracking(data);
      break;

    case 'STOP_BACKGROUND_TRACKING':
      stopBackgroundTracking();
      break;

    case 'UPDATE_RUNNING_SESSION':
      updateRunningSession(data);
      break;

    case 'GET_RUNNING_SESSION':
      event.ports[0].postMessage({
        type: 'RUNNING_SESSION_DATA',
        data: runningSession,
      });
      break;

    default:
      console.log('[SW] 알 수 없는 메시지 타입:', type);
  }
});

/**
 * 모든 캐시 강제 삭제
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('[SW] 캐시 삭제:', cacheName);
        return caches.delete(cacheName);
      })
    );

    // 클라이언트에게 캐시 삭제 완료 알림
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_CLEARED',
        message: '모든 캐시가 삭제되었습니다.',
      });
    });

    console.log('[SW] 모든 캐시 삭제 완료');
  } catch (error) {
    console.error('[SW] 캐시 삭제 실패:', error);
  }
}

/**
 * 백그라운드 러닝 추적 시작
 */
function startBackgroundTracking(sessionData) {
  console.log('[SW] 백그라운드 러닝 추적 시작');

  runningSession = {
    ...sessionData,
    startTime: sessionData.startTime || Date.now(),
    path: sessionData.path || [],
    distance: sessionData.distance || 0,
    isBackgroundMode: true,
  };

  isTracking = true;

  // 위치 추적 시작
  if ('geolocation' in navigator) {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    locationWatchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    );
  }

  // 주기적으로 데이터 저장
  setInterval(() => {
    if (isTracking && runningSession) {
      saveRunningDataToCache();
    }
  }, 10000); // 10초마다 저장

  // 클라이언트에게 추적 시작 알림
  broadcastToClients({
    type: 'BACKGROUND_TRACKING_STARTED',
    data: runningSession,
  });
}

/**
 * 백그라운드 러닝 추적 중지
 */
function stopBackgroundTracking() {
  console.log('[SW] 백그라운드 러닝 추적 중지');

  isTracking = false;

  if (locationWatchId) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }

  // 최종 데이터 저장
  if (runningSession) {
    saveRunningDataToCache();
  }

  broadcastToClients({
    type: 'BACKGROUND_TRACKING_STOPPED',
    data: runningSession,
  });
}

/**
 * 위치 업데이트 처리
 */
function handleLocationUpdate(position) {
  if (!isTracking || !runningSession) return;

  const newPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    timestamp: Date.now(),
    accuracy: position.coords.accuracy,
    speed: position.coords.speed || 0,
  };

  // 경로에 새 위치 추가
  runningSession.path.push(newPosition);

  // 거리 계산 (이전 위치가 있는 경우)
  if (runningSession.path.length > 1) {
    const prevPos = runningSession.path[runningSession.path.length - 2];
    const distance = calculateDistance(prevPos, newPosition);

    // GPS 정확도가 좋을 때만 거리 추가 (20m 이하)
    if (position.coords.accuracy <= 20) {
      runningSession.distance += distance;
    }
  }

  // 현재 시간 업데이트
  runningSession.currentTime = Date.now();
  runningSession.duration =
    runningSession.currentTime - runningSession.startTime;

  // 클라이언트에게 업데이트 전송
  broadcastToClients({
    type: 'LOCATION_UPDATE',
    data: {
      position: newPosition,
      distance: runningSession.distance,
      duration: runningSession.duration,
      path: runningSession.path,
    },
  });

  console.log('[SW] 위치 업데이트:', newPosition);
}

/**
 * 위치 추적 오류 처리
 */
function handleLocationError(error) {
  console.error('[SW] 위치 추적 오류:', error);

  broadcastToClients({
    type: 'LOCATION_ERROR',
    data: { error: error.message },
  });
}

/**
 * 러닝 세션 업데이트
 */
function updateRunningSession(data) {
  if (runningSession) {
    runningSession = { ...runningSession, ...data };
    saveRunningDataToCache();
  }
}

/**
 * 러닝 데이터를 캐시에 저장
 */
async function saveRunningDataToCache() {
  try {
    const cache = await caches.open(RUNNING_DATA_CACHE);
    const dataToSave = {
      ...runningSession,
      lastSaved: Date.now(),
    };

    const response = new Response(JSON.stringify(dataToSave), {
      headers: { 'Content-Type': 'application/json' },
    });

    await cache.put('/running-session-backup', response);
    console.log('[SW] 러닝 데이터 캐시 저장 완료');
  } catch (error) {
    console.error('[SW] 러닝 데이터 저장 실패:', error);
  }
}

/**
 * 캐시에서 러닝 데이터 복구
 */
async function restoreRunningDataFromCache() {
  try {
    const cache = await caches.open(RUNNING_DATA_CACHE);
    const response = await cache.match('/running-session-backup');

    if (response) {
      const data = await response.json();
      return data;
    }

    return null;
  } catch (error) {
    console.error('[SW] 러닝 데이터 복구 실패:', error);
    return null;
  }
}

/**
 * 모든 클라이언트에게 메시지 브로드캐스트
 */
async function broadcastToClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

/**
 * 두 지점 간의 거리 계산 (Haversine formula)
 */
function calculateDistance(pos1, pos2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = toRadians(pos2.lat - pos1.lat);
  const dLng = toRadians(pos2.lng - pos1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pos1.lat)) *
      Math.cos(toRadians(pos2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 도를 라디안으로 변환
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// 백그라운드 동기화 (실험적 기능)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-running') {
    event.waitUntil(syncRunningData());
  }
});

/**
 * 러닝 데이터 동기화
 */
async function syncRunningData() {
  try {
    const cachedData = await restoreRunningDataFromCache();
    if (cachedData) {
      // 메인 앱에 동기화 요청
      broadcastToClients({
        type: 'SYNC_RUNNING_DATA',
        data: cachedData,
      });
    }
  } catch (error) {
    console.error('[SW] 데이터 동기화 실패:', error);
  }
}

console.log('[SW] 서비스 워커 로드 완료');
