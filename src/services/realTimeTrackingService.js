/**
 * 실시간 러닝 추적 최적화 서비스
 * Strava 스타일의 부드러운 실시간 추적을 위한 고성능 서비스
 */

class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  add(item) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.size;

    if (this.count < this.size) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.size;
    }
  }

  getAll() {
    const result = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.size;
      result.push(this.buffer[index]);
    }
    return result;
  }

  getLast(n) {
    const all = this.getAll();
    return all.slice(-n);
  }
}

class RealTimeTrackingService {
  constructor() {
    this.trackingBuffer = new CircularBuffer(10000); // 최대 10,000개 점 저장
    this.batchSize = 5; // 5개씩 배치 처리
    this.updateInterval = 1000; // 1초마다 업데이트
    this.lastUpdateTime = 0;
    this.pendingUpdates = [];
    this.isUpdating = false;

    // 성능 모니터링
    this.performanceMetrics = {
      updateCount: 0,
      averageUpdateTime: 0,
      memoryUsage: 0,
    };

    // 적응형 설정
    this.adaptiveSettings = {
      lowPerformance: {
        batchSize: 10,
        updateInterval: 2000,
        simplificationTolerance: 0.0001,
      },
      normalPerformance: {
        batchSize: 5,
        updateInterval: 1000,
        simplificationTolerance: 0.00005,
      },
      highPerformance: {
        batchSize: 3,
        updateInterval: 500,
        simplificationTolerance: 0.00001,
      },
    };

    this.currentSettings = this.adaptiveSettings.normalPerformance;
    this.polylineRef = null;
    this.mapRef = null;
  }

  /**
   * 지도와 폴리라인 참조 설정
   */
  setMapReferences(mapRef, polylineRef) {
    this.mapRef = mapRef;
    this.polylineRef = polylineRef;
  }

  /**
   * 새로운 위치 점 추가
   */
  addTrackingPoint(point) {
    const enhancedPoint = {
      ...point,
      timestamp: Date.now(),
      id: this.generatePointId(),
    };

    this.trackingBuffer.add(enhancedPoint);
    this.scheduleUpdate();
  }

  /**
   * 업데이트 스케줄링
   */
  scheduleUpdate() {
    const now = Date.now();

    if (
      now - this.lastUpdateTime >= this.currentSettings.updateInterval &&
      !this.isUpdating
    ) {
      this.executeUpdate();
    }
  }

  /**
   * 실제 폴리라인 업데이트 실행
   */
  async executeUpdate() {
    if (this.isUpdating || !this.mapRef?.current) return;

    this.isUpdating = true;
    const startTime = performance.now();

    try {
      const allPoints = this.trackingBuffer.getAll();

      if (allPoints.length < 2) {
        this.isUpdating = false;
        return;
      }

      // 경로 단순화 (성능 최적화)
      const simplifiedPath = this.simplifyPath(
        allPoints,
        this.currentSettings.simplificationTolerance
      );

      // 네이버 지도 LatLng 객체로 변환
      const naverPath = simplifiedPath.map(
        point => new window.naver.maps.LatLng(point.lat, point.lng)
      );

      // 기존 폴리라인 제거
      if (this.polylineRef?.current) {
        this.polylineRef.current.setMap(null);
      }

      // 새로운 폴리라인 생성 (Strava 스타일)
      this.polylineRef.current = new window.naver.maps.Polyline({
        map: this.mapRef.current,
        path: naverPath,
        strokeColor: '#FF6B35', // Strava 오렌지 컬러
        strokeWeight: 6,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        // 그라데이션 효과를 위한 추가 스타일
        strokeLineDash: [],
        strokePattern: [],
      });

      // 그림자 효과를 위한 배경 폴리라인
      const shadowPolyline = new window.naver.maps.Polyline({
        map: this.mapRef.current,
        path: naverPath,
        strokeColor: 'rgba(0, 0, 0, 0.2)',
        strokeWeight: 8,
        strokeOpacity: 0.5,
        strokeStyle: 'solid',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        zIndex: -1,
      });

      this.lastUpdateTime = Date.now();

      // 성능 메트릭 업데이트
      const updateTime = performance.now() - startTime;
      this.updatePerformanceMetrics(updateTime);

      // 적응형 성능 조정
      this.adaptPerformanceSettings(updateTime);
    } catch (error) {
      console.error('폴리라인 업데이트 오류:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Douglas-Peucker 알고리즘을 사용한 경로 단순화
   */
  simplifyPath(points, tolerance) {
    if (points.length <= 2) return points;

    return this.douglasPeucker(points, tolerance);
  }

  douglasPeucker(points, tolerance) {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(
        points.slice(0, maxIndex + 1),
        tolerance
      );
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);

      return left.slice(0, -1).concat(right);
    } else {
      return [start, end];
    }
  }

  perpendicularDistance(point, lineStart, lineEnd) {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }

    const param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lng;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lng;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lng + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lng - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 성능 메트릭 업데이트
   */
  updatePerformanceMetrics(updateTime) {
    this.performanceMetrics.updateCount++;
    this.performanceMetrics.averageUpdateTime =
      (this.performanceMetrics.averageUpdateTime *
        (this.performanceMetrics.updateCount - 1) +
        updateTime) /
      this.performanceMetrics.updateCount;

    // 메모리 사용량 추정
    this.performanceMetrics.memoryUsage = this.trackingBuffer.count * 100; // 대략적인 바이트 수
  }

  /**
   * 적응형 성능 설정 조정
   */
  adaptPerformanceSettings(updateTime) {
    const avgTime = this.performanceMetrics.averageUpdateTime;

    if (avgTime > 100) {
      // 100ms 이상 걸리면 저성능 모드
      this.currentSettings = this.adaptiveSettings.lowPerformance;
    } else if (avgTime < 30) {
      // 30ms 미만이면 고성능 모드
      this.currentSettings = this.adaptiveSettings.highPerformance;
    } else {
      this.currentSettings = this.adaptiveSettings.normalPerformance;
    }
  }

  /**
   * 포인트 ID 생성
   */
  generatePointId() {
    return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 현재 경로 데이터 반환
   */
  getCurrentPath() {
    return this.trackingBuffer.getAll();
  }

  /**
   * 성능 메트릭 반환
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * 서비스 초기화
   */
  reset() {
    this.trackingBuffer = new CircularBuffer(10000);
    this.lastUpdateTime = 0;
    this.pendingUpdates = [];
    this.isUpdating = false;
    this.performanceMetrics = {
      updateCount: 0,
      averageUpdateTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    if (this.polylineRef?.current) {
      this.polylineRef.current.setMap(null);
    }
    this.reset();
  }
}

// 싱글톤 인스턴스 생성
const realTimeTrackingService = new RealTimeTrackingService();

export default realTimeTrackingService;
export { RealTimeTrackingService };
