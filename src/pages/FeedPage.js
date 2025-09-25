import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getFeedPosts,
  togglePostLike,
  checkPostLikeStatus,
  createPostComment,
} from '../services/feedService';
import { useNavigate } from 'react-router-dom';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likeStates, setLikeStates] = useState({});

  const { user, isAuthenticated, getUserId } = useAuthStore();
  const navigate = useNavigate();

  // 피드 포스트 로드
  const loadFeedPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getFeedPosts({ limit: 20 });
      if (result.success) {
        setPosts(result.data);

        // 로그인한 사용자의 좋아요 상태 확인
        if (isAuthenticated()) {
          const userId = getUserId();
          const likePromises = result.data.map(async post => {
            const likeResult = await checkPostLikeStatus(post.id, userId);
            return {
              postId: post.id,
              isLiked: likeResult.success ? likeResult.data.isLiked : false,
            };
          });

          const likes = await Promise.all(likePromises);
          const likeMap = {};
          likes.forEach(({ postId, isLiked }) => {
            likeMap[postId] = isLiked;
          });
          setLikeStates(likeMap);
        }
      }
    } catch (error) {
      console.error('피드 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeedPosts();
  }, [user]);

  // 좋아요 토글
  const handleLike = async postId => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      const userId = getUserId();
      const result = await togglePostLike(postId, userId);

      if (result.success) {
        // 좋아요 상태 업데이트
        setLikeStates(prev => ({
          ...prev,
          [postId]: result.data.isLiked,
        }));

        // 포스트의 좋아요 수 업데이트
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  likes_count: result.data.isLiked
                    ? post.likes_count + 1
                    : post.likes_count - 1,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
    }
  };

  // 시간 포맷팅 (초를 HH:MM:SS로 변환)
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

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

  // 상대 시간 포맷팅
  const formatRelativeTime = dateString => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}일 전`;

    return postDate.toLocaleDateString();
  };

  // 로그인 안 된 경우
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">피드</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📱</span>
              </div>
              <p className="text-gray-500 mb-4">
                로그인하면 다른 러너들의 기록을 볼 수 있어요
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">피드</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">피드</h1>
          <button
            onClick={() => loadFeedPosts(true)}
            className="text-blue-500 hover:text-blue-600 transition-colors"
            disabled={refreshing}
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 피드 리스트 */}
        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">🏃‍♂️</span>
              </div>
              <p className="text-gray-500 mb-4">
                아직 피드에 게시된 러닝 기록이 없어요
              </p>
              <button
                onClick={() => navigate('/navigation')}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                첫 러닝 시작하기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map(post => (
              <div key={post.id} className="bg-white border-b border-gray-200">
                {/* 사용자 정보 헤더 */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt="프로필"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(
                            post.profiles?.display_name ||
                            post.profiles?.username ||
                            'U'
                          ).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {post.profiles?.display_name ||
                          post.profiles?.username ||
                          '익명의 러너'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {post.location || '위치 정보 없음'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatRelativeTime(post.created_at)}
                  </span>
                </div>

                {/* 러닝 통계 카드 */}
                <div className="mx-4 mb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {post.running_records?.distance?.toFixed(1) || '0.0'}km
                      </div>
                      <div className="text-xs text-gray-500">거리</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {formatDuration(post.running_records?.duration || 0)}
                      </div>
                      <div className="text-xs text-gray-500">시간</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatPace(post.running_records?.pace || 0)}
                      </div>
                      <div className="text-xs text-gray-500">페이스</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {post.running_records?.calories_burned || 0}
                      </div>
                      <div className="text-xs text-gray-500">칼로리</div>
                    </div>
                  </div>
                </div>

                {/* 게시글 내용 */}
                <div className="px-4 pb-3">
                  <p className="text-gray-800 leading-relaxed">
                    {post.caption}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.hashtags.map((hashtag, index) => (
                        <span key={index} className="text-blue-500 text-sm">
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 이미지 (있을 경우) */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="px-4 pb-3">
                    <img
                      src={post.image_urls[0]}
                      alt="러닝 사진"
                      className="w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 ${
                        likeStates[post.id] ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={likeStates[post.id] ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {post.likes_count}
                      </span>
                    </button>

                    <button className="flex items-center space-x-1 text-gray-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        {post.comments_count}
                      </span>
                    </button>

                    <button className="text-gray-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                  </div>

                  <button className="text-gray-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 로딩 더보기 */}
        {posts.length > 0 && (
          <div className="p-4 text-center">
            <button
              onClick={() => loadFeedPosts(true)}
              className="text-blue-500 font-medium hover:text-blue-600 transition-colors"
            >
              새로고침
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
