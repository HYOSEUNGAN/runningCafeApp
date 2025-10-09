import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { ROUTES } from '../constants/app';
import {
  getUserProfile,
  updateUserProfile,
} from '../services/userProfileService';
import { getUserRunningRecords } from '../services/runningRecordService';
import { getUserCompletedChallenges } from '../services/challengeService';
import { getUserPlaceRequests } from '../services/placeRequestService';
import { getFeedPosts } from '../services/feedService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BottomNavigation from '../components/layout/BottomNavigation';
import ProfileHeader from '../components/layout/ProfileHeader';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import PlaceRequestModal from '../components/profile/PlaceRequestModal';

/**
 * 프로필 페이지 컴포넌트 - 사용자 정보 및 러닝 통계
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    isAuthenticated,
    getUserName,
    getUserAvatar,
    getUserId,
    userProfile,
    setUserProfile,
  } = useAuthStore();
  const { showToast } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalRuns: 0,
    totalTime: 0,
    averagePace: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [myFeeds, setMyFeeds] = useState([]);

  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlaceRequestModal, setShowPlaceRequestModal] = useState(false);

  // 추가 통계 데이터
  const [monthlyStats, setMonthlyStats] = useState({
    totalDistance: 48.5,
    totalRuns: 10,
    averagePace: 6.25, // 6분 15초
    favoriteDay: '수요일',
    favoritePlace: '뚝섬 한강공원',
  });
  const [activityStats, setActivityStats] = useState({
    favorites: 100,
    challenges: 17,
    placeRequests: 3,
  });

  // 사용자 데이터 로드
  const loadUserData = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = getUserId();

      // 프로필 데이터 로드
      const profileResult = await getUserProfile(userId);
      if (profileResult.success) {
        setProfileData(profileResult.data);
        // 스토어 업데이트
        setUserProfile(profileResult.data);
      }

      // 러닝 기록 로드
      const recordsResult = await getUserRunningRecords(userId, { limit: 50 }); // 더 많은 데이터 로드하여 정확한 분석
      if (recordsResult.success) {
        const records = recordsResult.data;

        // 통계 계산
        const stats = records.reduce(
          (acc, record) => ({
            totalDistance: acc.totalDistance + (record.distance || 0),
            totalRuns: acc.totalRuns + 1,
            totalTime: acc.totalTime + (record.duration || 0),
          }),
          { totalDistance: 0, totalRuns: 0, totalTime: 0 }
        );

        stats.averagePace =
          stats.totalDistance > 0
            ? stats.totalTime / 60 / stats.totalDistance
            : 0;

        setUserStats(stats);

        // 선호 요일과 장소 계산
        const favoriteDay = calculateFavoriteDay(records);
        const favoritePlace = calculateFavoritePlace(records);

        setMonthlyStats(prev => ({
          ...prev,
          favoriteDay,
          favoritePlace,
        }));

        // 최근 활동 변환 (표시용으로 10개만)
        const activities = records.slice(0, 5).map(record => ({
          id: record.id,
          type: 'running',
          title: record.title || `${record.distance}km 러닝`,
          distance: `${record.distance}km`,
          time: formatDuration(record.duration),
          date: new Date(record.created_at).toLocaleDateString(),
          pace: formatPace(record.pace),
        }));

        setRecentActivities(activities);
      }

      // 완료된 챌린지 로드
      const challengesResult = await getUserCompletedChallenges(userId);
      if (challengesResult.success) {
        setCompletedChallenges(challengesResult.data.slice(0, 3)); // 최근 3개만
      }

      // 장소 등록 요청 통계 로드
      const placeRequestsResult = await getUserPlaceRequests(userId, {
        limit: 5,
      });
      if (placeRequestsResult.success) {
        setActivityStats(prev => ({
          ...prev,
          placeRequests: placeRequestsResult.data.length,
        }));
      }

      // 자기 피드 로드 (최대 6개만)
      const feedsResult = await getFeedPosts({ userId, limit: 6 });
      if (feedsResult.success) {
        setMyFeeds(feedsResult.data);
      }
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      showToast({
        type: 'error',
        message: '데이터 로드에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // 프로필 수정 모달 열기
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  // 장소 등록 요청 모달 열기
  const handlePlaceRequest = () => {
    setShowPlaceRequestModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast({
        type: 'success',
        message: '로그아웃되었습니다.',
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      showToast({
        type: 'error',
        message: '로그아웃 중 오류가 발생했습니다.',
      });
    }
  };

  // 시간 포맷팅 (초를 HH:MM:SS로 변환)
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 페이스 포맷팅 (분/km)
  const formatPace = pace => {
    if (!pace || pace === 0) return '0:00/km';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  // 선호 요일 계산 함수
  const calculateFavoriteDay = records => {
    if (!records || records.length === 0) return '데이터 없음';

    const dayCount = {};
    const dayNames = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];

    records.forEach(record => {
      const date = new Date(record.created_at);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    let maxCount = 0;
    let favoriteDay = '데이터 없음';

    Object.entries(dayCount).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteDay = day;
      }
    });

    return favoriteDay;
  };

  // 선호 장소 계산 함수 (GPS 좌표 기반)
  const calculateFavoritePlace = records => {
    if (!records || records.length === 0) return '데이터 없음';

    // GPS 좌표가 있는 기록들을 분석
    const locationsWithGPS = records.filter(
      record =>
        record.route_data &&
        record.route_data.coordinates &&
        record.route_data.coordinates.length > 0
    );

    if (locationsWithGPS.length === 0) {
      // GPS 데이터가 없으면 제목에서 장소명 추출 시도
      const locationCount = {};

      records.forEach(record => {
        const title = record.title || '';
        // 일반적인 러닝 장소 키워드 추출
        const placeKeywords = [
          '한강',
          '올림픽공원',
          '서울숲',
          '뚝섬',
          '반포',
          '여의도',
          '청계천',
          '남산',
          '북한산',
          '양재천',
          '탄천',
          '중랑천',
          '공원',
          '체육관',
          '운동장',
          '둘레길',
        ];

        const foundPlace = placeKeywords.find(keyword =>
          title.includes(keyword)
        );
        if (foundPlace) {
          locationCount[foundPlace] = (locationCount[foundPlace] || 0) + 1;
        }
      });

      if (Object.keys(locationCount).length > 0) {
        return Object.entries(locationCount).sort(
          ([, a], [, b]) => b - a
        )[0][0];
      }

      return '데이터 없음';
    }

    // GPS 좌표 기반 클러스터링 (간단한 버전)
    const clusters = [];
    const CLUSTER_RADIUS = 0.01; // 약 1km 반경

    locationsWithGPS.forEach(record => {
      const startCoord = record.route_data.coordinates[0];
      if (!startCoord || !startCoord.lat || !startCoord.lng) return;

      let foundCluster = false;

      for (let cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(cluster.centerLat - startCoord.lat, 2) +
            Math.pow(cluster.centerLng - startCoord.lng, 2)
        );

        if (distance < CLUSTER_RADIUS) {
          cluster.count += 1;
          cluster.records.push(record);
          // 중심점 업데이트
          cluster.centerLat =
            (cluster.centerLat * (cluster.count - 1) + startCoord.lat) /
            cluster.count;
          cluster.centerLng =
            (cluster.centerLng * (cluster.count - 1) + startCoord.lng) /
            cluster.count;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          centerLat: startCoord.lat,
          centerLng: startCoord.lng,
          count: 1,
          records: [record],
        });
      }
    });

    if (clusters.length === 0) return '데이터 없음';

    // 가장 많이 사용된 클러스터 찾기
    const favoriteCluster = clusters.sort((a, b) => b.count - a.count)[0];

    // 좌표를 기반으로 대략적인 장소명 추정
    const lat = favoriteCluster.centerLat;
    const lng = favoriteCluster.centerLng;

    // 서울 주요 러닝 코스 좌표 기반 장소 추정
    if (lat >= 37.52 && lat <= 37.53 && lng >= 126.93 && lng <= 126.94) {
      return '여의도 한강공원';
    } else if (lat >= 37.51 && lat <= 37.52 && lng >= 127.0 && lng <= 127.02) {
      return '반포 한강공원';
    } else if (lat >= 37.52 && lat <= 37.53 && lng >= 127.04 && lng <= 127.06) {
      return '뚝섬 한강공원';
    } else if (lat >= 37.51 && lat <= 37.53 && lng >= 127.12 && lng <= 127.14) {
      return '올림픽공원';
    } else if (lat >= 37.54 && lat <= 37.55 && lng >= 127.03 && lng <= 127.05) {
      return '서울숲';
    } else if (lat >= 37.55 && lat <= 37.57 && lng >= 126.97 && lng <= 126.99) {
      return '청계천';
    } else if (lat >= 37.55 && lat <= 37.56 && lng >= 126.98 && lng <= 127.0) {
      return '남산공원';
    } else {
      // 좌표 기반으로 일반적인 지역명 추정
      if (lng < 126.95) return '서울 서부';
      else if (lng > 127.05) return '서울 동부';
      else if (lat > 37.55) return '서울 북부';
      else return '서울 남부';
    }
  };

  // 로그인 상태 확인
  const isLoggedIn = isAuthenticated();

  // 로딩 중
  if (loading && isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <ProfileHeader
          title="프로필"
          showEditButton={false}
          isEditing={false}
          onEditToggle={() => {}}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <ProfileHeader
        title="마이페이지"
        showEditButton={false}
        isEditing={false}
        onEditToggle={() => {}}
      />

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 프로필 섹션 - 카카오톡 스타일 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 ring-2 ring-primary-100">
                {isLoggedIn && (profileData?.avatar_url || getUserAvatar()) ? (
                  <img
                    src={profileData?.avatar_url || getUserAvatar()}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-xl">👤</div>
                )}
              </div>

              {/* 온라인 상태 표시 */}
              {isLoggedIn && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-system-success border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {isLoggedIn
                    ? profileData?.display_name ||
                      profileData?.username ||
                      getUserName() ||
                      '러닝 메이트'
                    : '게스트'}
                </h2>

                {/* 인증 배지 */}
                {isLoggedIn && (
                  <div className="w-5 h-5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">
                  {isLoggedIn
                    ? user?.email || 'runner@example.com'
                    : '로그인해주세요'}
                </span>

                {isLoggedIn && (
                  <button
                    onClick={handleEditProfile}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    편집
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 로그인하지 않은 경우 - 인스타그램 스타일 */}
        {!isLoggedIn ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl text-white">🏃‍♀️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              러닝을 시작해보세요!
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              나만의 러닝 기록을 남기고
              <br />
              카페 정보를 공유해보세요
            </p>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              <span className="mr-2">✨</span>
              시작하기
            </Button>
          </div>
        ) : (
          <>
            {/* 나의 활동 모아보기 - 인스타그램 스타일 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">나의 활동</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  전체보기
                </button>
              </div>

              {/* 이번 달 러닝 요약 */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📊</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900">
                      이번 달 러닝 요약
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    {new Date().getMonth() + 1}월에 달린 모든 기록을 정리했어요!
                  </p>
                </div>

                {/* 통계 그리드 - 카드 스타일 */}
                {userStats.totalRuns > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 text-center">
                        <div className="text-sm text-primary-700 mb-1 font-medium">
                          총 거리
                        </div>
                        <div className="text-lg font-bold text-primary-800">
                          {userStats.totalDistance.toFixed(1)}km
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-secondary-orange/10 to-secondary-orange/20 rounded-xl p-4 text-center">
                        <div className="text-sm text-orange-700 mb-1 font-medium">
                          러닝 횟수
                        </div>
                        <div className="text-lg font-bold text-orange-800">
                          {userStats.totalRuns}회
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-secondary-mint/10 to-secondary-mint/20 rounded-xl p-4 text-center">
                        <div className="text-sm text-green-700 mb-1 font-medium">
                          평균 페이스
                        </div>
                        <div className="text-lg font-bold text-green-800">
                          {formatPace(userStats.averagePace)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1 font-medium">
                          선호 요일
                        </div>
                        <div className="text-base font-bold text-gray-800">
                          {monthlyStats.favoriteDay}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1 font-medium">
                          선호 장소
                        </div>
                        <div className="text-base font-bold text-gray-800">
                          {monthlyStats.favoritePlace}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">🏃‍♀️</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      첫 러닝을 시작해보세요!
                    </h4>
                    <p className="text-sm text-gray-600 mb-6">
                      러닝 기록을 남기고 성취감을 느껴보세요
                    </p>
                    <Button
                      size="md"
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                      onClick={() => navigate('/record')}
                    >
                      <span className="mr-2">🚀</span>첫 러닝 기록하기
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 나의 피드 섹션 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">나의 피드</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  더보기
                </button>
              </div>

              <div className="p-6">
                {myFeeds && myFeeds.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                    {myFeeds.slice(0, 6).map((feed, index) => (
                      <div
                        key={feed.id}
                        className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        {feed.image_urls && feed.image_urls.length > 0 ? (
                          <img
                            src={feed.image_urls[0]}
                            alt="피드 이미지"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-primary-600 text-xl">📷</span>
                          </div>
                        )}

                        {/* 다중 이미지 표시 */}
                        {feed.image_urls && feed.image_urls.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            <span>📷</span>
                          </div>
                        )}

                        {/* 러닝 기록이 있는 경우 거리 표시 */}
                        {feed.running_records && (
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {feed.running_records.distance}km
                          </div>
                        )}

                        {/* 좋아요/댓글 수 오버레이 (호버 시 표시) */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="flex items-center space-x-4 text-white text-sm font-medium">
                            <span className="flex items-center space-x-1">
                              <span>❤️</span>
                              <span>{feed.likes_count || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>💬</span>
                              <span>{feed.comments_count || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">📝</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      첫 피드를 작성해보세요!
                    </h4>
                    <p className="text-sm text-gray-600 mb-6">
                      러닝 경험을 다른 러너들과 공유해보세요
                    </p>
                    <Button
                      size="md"
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                      onClick={() => navigate('/feed')}
                    >
                      <span className="mr-2">✨</span>피드 작성하기
                    </Button>
                  </div>
                )}
              </div>

              {/* 활동 통계 - 간소화된 카드 스타일 */}

              {/* <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-secondary-orange/10 to-secondary-orange/20 rounded-xl p-4 text-center">
                    <div className="text-sm text-orange-700 mb-1 font-medium">
                      즐겨찾기
                    </div>
                    <div className="text-xl font-bold text-orange-800">
                      {activityStats.favorites}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-secondary-mint/10 to-secondary-mint/20 rounded-xl p-4 text-center">
                    <div className="text-sm text-green-700 mb-1 font-medium">
                      참여 챌린지
                    </div>
                    <div className="text-xl font-bold text-green-800">
                      {activityStats.challenges}
                    </div>
                  </div>
                </div>
              </div> */}
            </div>

            {/* 장소 등록 요청 - 인스타그램 스타일 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={handlePlaceRequest}
                className="w-full p-6 text-left hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg">
                    <span className="text-white text-xl">📍</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      새로운 장소 추천하기
                    </h4>
                    <p className="text-sm text-gray-600">
                      숨겨진 러닝 코스나 카페를 공유해보세요
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* 설정 메뉴 - 인스타그램 스타일 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <button className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-xl px-4 py-3 -mx-4 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📢</span>
                    </div>
                    <span className="text-base font-medium text-gray-900">
                      공지사항
                    </span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="px-6 py-4 border-b border-gray-100">
                <button className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-xl px-4 py-3 -mx-4 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-orange to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🔔</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-medium text-gray-900">
                        알림 설정
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                        베타 서비스
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="px-6 py-4">
                <button className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-xl px-4 py-3 -mx-4 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-mint to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">💬</span>
                    </div>
                    <span className="text-base font-medium text-gray-900">
                      고객의 소리
                    </span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* 로그아웃/회원탈퇴 */}
            <div className="px-4 py-6">
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <button
                  onClick={handleLogout}
                  className="hover:text-gray-700 transition-colors"
                >
                  로그아웃
                </button>
                <span>ㅣ</span>
                <button className="hover:text-gray-700 transition-colors">
                  회원탈퇴
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 모달들 */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentProfile={profileData}
      />

      <PlaceRequestModal
        isOpen={showPlaceRequestModal}
        onClose={() => setShowPlaceRequestModal(false)}
      />

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
