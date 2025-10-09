import React, { useState, useEffect } from 'react';
import { getWeeklyTopRunners } from '../../services/userProfileService';

/**
 * 최근 운동한 사람들 TOP 3 섹션 컴포넌트
 * 홈페이지에서 최근 활발하게 러닝한 사용자들을 보여주는 섹션
 */
const RecentRunnersSection = () => {
  const [topRunners, setTopRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 실제 TOP3 러너 데이터 로드
  useEffect(() => {
    const loadTopRunners = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getWeeklyTopRunners({ limit: 3 });

        if (result.success && result.data.length > 0) {
          setTopRunners(result.data);
        } else {
          // 실제 데이터가 없을 경우 샘플 데이터 사용
          setTopRunners([
            {
              id: 'sample-1',
              rank: 1,
              name: '김러너',
              avatar: '/images/avatars/runner-01.svg',
              totalDistance: '42.5km',
              weeklyRuns: 5,
              level: '프로 러너',
              badge: '🏃‍♂️',
              recentActivity: '2시간 전',
            },
            {
              id: 'sample-2',
              rank: 2,
              name: '박달리기',
              avatar: '/images/avatars/runner-02.svg',
              totalDistance: '38.2km',
              weeklyRuns: 4,
              level: '열정 러너',
              badge: '🔥',
              recentActivity: '4시간 전',
            },
            {
              id: 'sample-3',
              rank: 3,
              name: '이조깅',
              avatar: '/images/avatars/runner-03.svg',
              totalDistance: '35.8km',
              weeklyRuns: 6,
              level: '꾸준 러너',
              badge: '⭐',
              recentActivity: '6시간 전',
            },
          ]);
        }
      } catch (err) {
        console.error('TOP 러너 데이터 로드 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');

        // 오류 발생 시에도 샘플 데이터 표시
        setTopRunners([
          {
            id: 'fallback-1',
            rank: 1,
            name: '김러너',
            avatar: '/images/avatars/runner-01.svg',
            totalDistance: '42.5km',
            weeklyRuns: 5,
            level: '프로 러너',
            badge: '🏃‍♂️',
            recentActivity: '2시간 전',
          },
          {
            id: 'fallback-2',
            rank: 2,
            name: '박달리기',
            avatar: '/images/avatars/runner-02.svg',
            totalDistance: '38.2km',
            weeklyRuns: 4,
            level: '열정 러너',
            badge: '🔥',
            recentActivity: '4시간 전',
          },
          {
            id: 'fallback-3',
            rank: 3,
            name: '이조깅',
            avatar: '/images/avatars/runner-03.svg',
            totalDistance: '35.8km',
            weeklyRuns: 6,
            level: '꾸준 러너',
            badge: '⭐',
            recentActivity: '6시간 전',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTopRunners();
  }, []);

  const handleRunnerClick = runnerId => {
    console.log('러너 프로필 클릭:', runnerId);
    // 러너 프로필 페이지로 이동 로직 추가
  };

  const getRankColor = rank => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'; // 금색
      case 2:
        return 'text-gray-400'; // 은색
      case 3:
        return 'text-amber-600'; // 동색
      default:
        return 'text-gray-600';
    }
  };

  const getRankBg = rank => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <section className="bg-white px-4 py-6">
      {/* 섹션 타이틀 */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-800">이번주 TOP 3 러너</h2>
        <p className="text-xs text-gray-500 mt-1">
          {loading ? '데이터 로딩 중...' : '이번 주 가장 활발한 러너들'}
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-red-500 mt-1">샘플 데이터를 표시합니다.</p>
        </div>
      )}

      {/* TOP 3 러너 리스트 */}
      {!loading && topRunners.length > 0 && (
        <div className="space-y-3">
          {topRunners.map(runner => (
            <div
              key={runner.id}
              onClick={() => handleRunnerClick(runner.id)}
              className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            >
              {/* 랭킹 번호 */}
              <div className="flex-shrink-0 mr-3">
                <div
                  className={`w-8 h-8 rounded-full ${getRankBg(
                    runner.rank
                  )} flex items-center justify-center`}
                >
                  <span className="text-white text-sm font-bold">
                    {runner.rank}
                  </span>
                </div>
              </div>

              {/* 프로필 아바타 */}
              <div className="flex-shrink-0 mr-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  <img
                    src={runner.avatar}
                    alt={`${runner.name} 프로필`}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // 이미지 로드 실패 시 기본 아바타 표시
                      e.target.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyMCIgcj0iOCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNOCAzNkM4IDI4IDEyIDI0IDI0IDI0UzQwIDI4IDQwIDM2IiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
              </div>

              {/* 러너 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-bold text-gray-800 truncate">
                    {runner.name}
                  </h3>
                  <span className="ml-2 text-sm">{runner.badge}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{runner.level}</p>
                <div className="flex items-center text-xs text-gray-400">
                  <span>이번주 {runner.totalDistance}</span>
                  <span className="mx-2">•</span>
                  <span>{runner.weeklyRuns}회 러닝</span>
                </div>
              </div>

              {/* 최근 활동 시간 */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-400">{runner.recentActivity}</p>
                <div className="mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 데이터가 없는 경우 */}
      {!loading && topRunners.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🏃‍♂️</div>
          <p className="text-sm text-gray-500">
            아직 이번 주 러닝 기록이 없습니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            첫 번째 러너가 되어보세요!
          </p>
        </div>
      )}

      {/* 더보기 버튼 */}
      {/* {!loading && topRunners.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200">
            전체 랭킹 보기 →
          </button>
        </div>
      )} */}
    </section>
  );
};

export default RecentRunnersSection;
