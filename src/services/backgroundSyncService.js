/**
 * 개선된 백그라운드-포그라운드 동기화 서비스
 * 실시간 데이터 동기화와 상태 관리를 통해 끊김 없는 러닝 추적 제공
 */

class BackgroundSyncService {
  constructor() {
    this.isActive = false;
    this.syncQueue = [];
    this.lastSyncTime = 0;
    this.syncInterval = 2000; // 2초마다 동기화
    this.maxRetries = 3;
    this.retryDelay = 1000;

    // 동기화 상태
    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSuccessfulSync: null,
      failedSyncs: 0,
      pendingOperations: 0,
    };

    // 이벤트 리스너
    this.eventListeners = new Map();

    // 워커 및 채널
    this.serviceWorker = null;
    this.broadcastChannel = null;

    this.init();
  }

  /**
   * 서비스 초기화
   */
  async init() {
    try {
      // Service Worker 등록 및 연결
      await this.initServiceWorker();

      // BroadcastChannel 초기화
      this.initBroadcastChannel();

      // 네트워크 상태 모니터링
      this.initNetworkMonitoring();

      // 페이지 가시성 모니터링
      this.initVisibilityMonitoring();

      // 주기적 동기화 시작
      this.startPeriodicSync();

      console.log('백그라운드 동기화 서비스 초기화 완료');
    } catch (error) {
      console.error('백그라운드 동기화 서비스 초기화 실패:', error);
    }
  }

  /**
   * Service Worker 초기화
   */
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Service Worker 활성화 대기
        if (registration.installing) {
          await new Promise(resolve => {
            registration.installing.addEventListener('statechange', e => {
              if (e.target.state === 'activated') {
                resolve();
              }
            });
          });
        }

        this.serviceWorker =
          registration.active ||
          registration.waiting ||
          registration.installing;

        // Service Worker 메시지 수신
        navigator.serviceWorker.addEventListener('message', event => {
          this.handleServiceWorkerMessage(event.data);
        });

        console.log('Service Worker 연결 완료');
      } catch (error) {
        console.error('Service Worker 등록 실패:', error);
      }
    }
  }

  /**
   * BroadcastChannel 초기화
   */
  initBroadcastChannel() {
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('running-sync');

      this.broadcastChannel.addEventListener('message', event => {
        this.handleBroadcastMessage(event.data);
      });

      console.log('BroadcastChannel 초기화 완료');
    }
  }

  /**
   * 네트워크 상태 모니터링
   */
  initNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      console.log('네트워크 연결 복구 - 동기화 재시작');
      this.processPendingSyncs();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      console.log('네트워크 연결 끊김 - 오프라인 모드');
    });
  }

  /**
   * 페이지 가시성 모니터링
   */
  initVisibilityMonitoring() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('앱이 백그라운드로 이동 - 백그라운드 동기화 활성화');
        this.activateBackgroundMode();
      } else {
        console.log('앱이 포그라운드로 복귀 - 동기화 데이터 복구');
        this.activateForegroundMode();
      }
    });
  }

  /**
   * 주기적 동기화 시작
   */
  startPeriodicSync() {
    setInterval(() => {
      if (this.isActive && this.syncStatus.isOnline) {
        this.performSync();
      }
    }, this.syncInterval);
  }

  /**
   * 백그라운드 모드 활성화
   */
  activateBackgroundMode() {
    this.isActive = true;

    // Service Worker에 백그라운드 모드 알림
    this.postToServiceWorker({
      type: 'ACTIVATE_BACKGROUND_MODE',
      timestamp: Date.now(),
    });

    // BroadcastChannel로 다른 탭에 알림
    this.broadcast({
      type: 'BACKGROUND_MODE_ACTIVATED',
      tabId: this.getTabId(),
      timestamp: Date.now(),
    });
  }

  /**
   * 포그라운드 모드 활성화
   */
  async activateForegroundMode() {
    console.log('포그라운드 모드 활성화 - 데이터 동기화 시작');

    try {
      // Service Worker에서 백그라운드 데이터 요청
      const backgroundData = await this.requestBackgroundData();

      if (backgroundData) {
        // 백그라운드에서 수집된 데이터를 포그라운드로 동기화
        this.syncBackgroundData(backgroundData);
      }

      // Service Worker에 포그라운드 모드 알림
      this.postToServiceWorker({
        type: 'ACTIVATE_FOREGROUND_MODE',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('포그라운드 데이터 동기화 실패:', error);
    }
  }

  /**
   * Service Worker 메시지 처리
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'LOCATION_UPDATE':
        this.handleLocationUpdate(data.payload);
        break;
      case 'BACKGROUND_DATA_SYNC':
        this.handleBackgroundDataSync(data.payload);
        break;
      case 'SYNC_STATUS_UPDATE':
        this.updateSyncStatus(data.payload);
        break;
      default:
        console.log('알 수 없는 Service Worker 메시지:', data);
    }
  }

  /**
   * BroadcastChannel 메시지 처리
   */
  handleBroadcastMessage(data) {
    switch (data.type) {
      case 'RUNNING_DATA_UPDATE':
        this.handleRunningDataUpdate(data.payload);
        break;
      case 'SYNC_REQUEST':
        this.handleSyncRequest(data.payload);
        break;
      default:
        console.log('알 수 없는 Broadcast 메시지:', data);
    }
  }

  /**
   * 위치 업데이트 처리
   */
  handleLocationUpdate(locationData) {
    console.log('백그라운드 위치 업데이트 수신:', locationData);

    // 이벤트 발생
    this.emit('locationUpdate', locationData);

    // 동기화 큐에 추가
    this.addToSyncQueue({
      type: 'LOCATION_UPDATE',
      data: locationData,
      timestamp: Date.now(),
    });
  }

  /**
   * 백그라운드 데이터 동기화 처리
   */
  handleBackgroundDataSync(syncData) {
    console.log('백그라운드 데이터 동기화:', syncData);

    // 러닝 데이터 업데이트
    if (syncData.runningData) {
      this.emit('runningDataUpdate', syncData.runningData);
    }

    // 경로 데이터 업데이트
    if (syncData.pathData) {
      this.emit('pathDataUpdate', syncData.pathData);
    }

    // 통계 데이터 업데이트
    if (syncData.statsData) {
      this.emit('statsDataUpdate', syncData.statsData);
    }
  }

  /**
   * 백그라운드 데이터 요청
   */
  async requestBackgroundData() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('백그라운드 데이터 요청 타임아웃'));
      }, 5000);

      // Service Worker에 데이터 요청
      this.postToServiceWorker({
        type: 'REQUEST_BACKGROUND_DATA',
        requestId: Date.now(),
      });

      // 응답 대기
      const handleResponse = event => {
        if (event.data.type === 'BACKGROUND_DATA_RESPONSE') {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener(
            'message',
            handleResponse
          );
          resolve(event.data.payload);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleResponse);
    });
  }

  /**
   * 백그라운드 데이터 동기화
   */
  syncBackgroundData(backgroundData) {
    console.log('백그라운드 데이터 동기화 시작:', backgroundData);

    try {
      // 러닝 세션 데이터 복구
      if (backgroundData.runningSession) {
        this.emit('runningSessionRestore', backgroundData.runningSession);
      }

      // 경로 데이터 복구
      if (backgroundData.pathData && backgroundData.pathData.length > 0) {
        this.emit('pathDataRestore', backgroundData.pathData);
      }

      // 통계 데이터 복구
      if (backgroundData.statsData) {
        this.emit('statsDataRestore', backgroundData.statsData);
      }

      console.log('백그라운드 데이터 동기화 완료');
    } catch (error) {
      console.error('백그라운드 데이터 동기화 실패:', error);
    }
  }

  /**
   * 동기화 큐에 항목 추가
   */
  addToSyncQueue(item) {
    this.syncQueue.push({
      ...item,
      id: Date.now() + Math.random(),
      retries: 0,
      timestamp: Date.now(),
    });

    this.syncStatus.pendingOperations = this.syncQueue.length;
  }

  /**
   * 동기화 실행
   */
  async performSync() {
    if (this.syncQueue.length === 0) return;

    const now = Date.now();
    const itemsToSync = this.syncQueue.filter(
      item => now - item.timestamp > this.syncInterval
    );

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);

        // 성공한 항목 제거
        this.syncQueue = this.syncQueue.filter(
          queueItem => queueItem.id !== item.id
        );

        this.syncStatus.lastSuccessfulSync = now;
        this.syncStatus.failedSyncs = 0;
      } catch (error) {
        console.error('동기화 실패:', error);

        item.retries++;
        this.syncStatus.failedSyncs++;

        // 최대 재시도 횟수 초과 시 제거
        if (item.retries >= this.maxRetries) {
          this.syncQueue = this.syncQueue.filter(
            queueItem => queueItem.id !== item.id
          );
          console.warn('동기화 항목 포기:', item);
        }
      }
    }

    this.syncStatus.pendingOperations = this.syncQueue.length;
  }

  /**
   * 개별 항목 동기화
   */
  async syncItem(item) {
    switch (item.type) {
      case 'LOCATION_UPDATE':
        return this.syncLocationUpdate(item.data);
      case 'RUNNING_DATA_UPDATE':
        return this.syncRunningDataUpdate(item.data);
      default:
        throw new Error(`알 수 없는 동기화 타입: ${item.type}`);
    }
  }

  /**
   * 위치 업데이트 동기화
   */
  async syncLocationUpdate(locationData) {
    // 실제 동기화 로직 구현
    console.log('위치 데이터 동기화:', locationData);

    // 서버 또는 로컬 스토리지에 저장
    return new Promise(resolve => {
      setTimeout(resolve, 100); // 시뮬레이션
    });
  }

  /**
   * 러닝 데이터 업데이트 동기화
   */
  async syncRunningDataUpdate(runningData) {
    console.log('러닝 데이터 동기화:', runningData);

    return new Promise(resolve => {
      setTimeout(resolve, 100); // 시뮬레이션
    });
  }

  /**
   * 대기 중인 동기화 처리
   */
  async processPendingSyncs() {
    if (this.syncStatus.isOnline && this.syncQueue.length > 0) {
      console.log(`${this.syncQueue.length}개의 대기 중인 동기화 처리 시작`);
      await this.performSync();
    }
  }

  /**
   * Service Worker에 메시지 전송
   */
  postToServiceWorker(message) {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage(message);
    }
  }

  /**
   * BroadcastChannel로 메시지 전송
   */
  broadcast(message) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 발생
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 리스너 오류 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 탭 ID 생성
   */
  getTabId() {
    if (!this.tabId) {
      this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.tabId;
  }

  /**
   * 동기화 상태 반환
   */
  getSyncStatus() {
    return { ...this.syncStatus };
  }

  /**
   * 서비스 정리
   */
  cleanup() {
    this.isActive = false;

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    // 대기 중인 동기화 완료
    this.processPendingSyncs();

    console.log('백그라운드 동기화 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
const backgroundSyncService = new BackgroundSyncService();

export default backgroundSyncService;
export { BackgroundSyncService };
