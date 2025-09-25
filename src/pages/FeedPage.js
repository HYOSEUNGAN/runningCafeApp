import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

// 샘플 데이터
const samplePosts = [
  {
    id: 1,
    user: {
      id: 1,
      name: '이동혁',
      avatar: null,
      location: '서울 강남구',
    },
    content: '오늘 한강에서 10km 런! 날씨도 좋고 기분 최고 🏃‍♂️',
    image: null,
    distance: 10.2,
    time: '02:23:39',
    pace: '18\'31"',
    calories: 488,
    likes: 24,
    comments: 8,
    timestamp: '2시간 전',
    isLiked: false,
  },
  {
    id: 2,
    user: {
      id: 2,
      name: '김수정',
      avatar: null,
      location: '서울 마포구',
    },
    content: '새벽 러닝 후 카페에서 아메리카노 한 잔 ☕️ 완벽한 하루의 시작!',
    image: null,
    distance: 5.8,
    time: '01:15:22',
    pace: '12\'58"',
    calories: 312,
    likes: 42,
    comments: 12,
    timestamp: '5시간 전',
    isLiked: true,
  },
  {
    id: 3,
    user: {
      id: 3,
      name: '박민호',
      avatar: null,
      location: '서울 송파구',
    },
    content: '올림픽공원 러닝코스 완주! 벚꽃이 너무 예뻐서 사진 찍었어요 🌸',
    image: null,
    distance: 8.5,
    time: '01:45:30',
    pace: '12\'25"',
    calories: 425,
    likes: 67,
    comments: 15,
    timestamp: '1일 전',
    isLiked: false,
  },
];

const FeedPage = () => {
  const [posts, setPosts] = useState(samplePosts);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleLike = postId => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const formatTime = timeStr => {
    return timeStr;
  };

  const formatDistance = distance => {
    return `${distance}km`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">피드</h1>
        </div>

        {/* 피드 리스트 */}
        <div className="space-y-0">
          {posts.map(post => (
            <div key={post.id} className="bg-white border-b border-gray-200">
              {/* 사용자 정보 헤더 */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {post.user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {post.user.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {post.user.location}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{post.timestamp}</span>
              </div>

              {/* 러닝 통계 카드 */}
              <div className="mx-4 mb-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatDistance(post.distance)}
                    </div>
                    <div className="text-xs text-gray-500">거리</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatTime(post.time)}
                    </div>
                    <div className="text-xs text-gray-500">시간</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {post.pace}
                    </div>
                    <div className="text-xs text-gray-500">페이스</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {post.calories}
                    </div>
                    <div className="text-xs text-gray-500">칼로리</div>
                  </div>
                </div>
              </div>

              {/* 게시글 내용 */}
              <div className="px-4 pb-3">
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
              </div>

              {/* 이미지 (있을 경우) */}
              {post.image && (
                <div className="px-4 pb-3">
                  <img
                    src={post.image}
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
                      post.isLiked ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={post.isLiked ? 'currentColor' : 'none'}
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
                    <span className="text-sm font-medium">{post.likes}</span>
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
                    <span className="text-sm font-medium">{post.comments}</span>
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

        {/* 로딩 더보기 */}
        <div className="p-4 text-center">
          <button className="text-blue-500 font-medium">더 보기</button>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
