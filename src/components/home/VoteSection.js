import React, { useState, useEffect } from 'react';
import { getActiveVotes, submitVote } from '../../services/voteService';

/**
 * 볼까말까 투표 섹션 컴포넌트
 * "볼까?말까? 의견을 모아모아" 캐러셀
 */
const VoteSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [voteItems, setVoteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingStates, setVotingStates] = useState({}); // 각 투표의 진행 상태

  // 컴포넌트 마운트 시 활성 투표 데이터 가져오기
  useEffect(() => {
    const fetchActiveVotes = async () => {
      try {
        setLoading(true);
        const votes = await getActiveVotes();
        setVoteItems(votes);
      } catch (error) {
        console.error('투표 데이터 가져오기 실패:', error);
        // 에러 시 기본 데이터 사용
        setVoteItems([
          {
            id: 1,
            title: '새로운 러닝 코스 카페',
            subtitle: '한강공원 5km 코스 끝',
            leftImage: '/images/banners/banner-00.png',
            rightImage: '/images/banners/banner-01.png',
            voteCount: 234,
            totalVotes: 456,
          },
          {
            id: 2,
            title: '주말 러닝 모임 카페',
            subtitle: '올림픽공원 3km 코스',
            leftImage: '/images/banners/banner-02.png',
            rightImage: '/images/banners/banner-00.png',
            voteCount: 189,
            totalVotes: 312,
          },
          {
            id: 3,
            title: '야간 러닝 후 카페',
            subtitle: '반포 한강공원 근처',
            leftImage: '/images/banners/banner-01.png',
            rightImage: '/images/banners/banner-02.png',
            voteCount: 156,
            totalVotes: 289,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVotes();
  }, []);

  const handleVote = async (itemId, voteType) => {
    try {
      // 투표 진행 상태 설정
      setVotingStates(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], [voteType]: true },
      }));

      const success = await submitVote(itemId, voteType);

      if (success) {
        // 투표 성공 시 UI 업데이트 (임시)
        console.log(`투표 성공: ${itemId} - ${voteType}`);
        // 실제로는 투표 결과를 다시 가져와서 상태 업데이트
      } else {
        console.error('투표 실패');
      }
    } catch (error) {
      console.error('투표 처리 중 오류:', error);
    } finally {
      // 투표 진행 상태 해제
      setVotingStates(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], [voteType]: false },
      }));
    }
  };

  const handleSeeMore = () => {
    console.log('자세히 보기 클릭');
    // 전체 투표 목록 페이지로 이동
  };

  const handleSlideChange = index => {
    setCurrentSlide(index);
  };

  return (
    <section className="px-4 py-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-black">
          볼까?말까? 의견을 모아모아
        </h2>
        <button
          onClick={handleSeeMore}
          className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          자세히 보기
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="flex space-x-3">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-lg aspect-[128/182] animate-pulse" />
            <div className="mt-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-200 rounded-lg aspect-[128/182] animate-pulse" />
            <div className="mt-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
            </div>
          </div>
        </div>
      ) : voteItems.length === 0 ? (
        /* 투표가 없을 때 안내 카드 */
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center max-w-sm mx-auto border border-purple-100">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              진행 중인 투표가 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              현재 활성화된 투표가 없습니다.
              <br />
              새로운 투표가 곧 시작될 예정이에요!
            </p>
            <button
              onClick={() => {
                // 투표 목록 새로고침 또는 전체 투표 페이지로 이동
                window.location.reload();
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md"
            >
              새로고침
            </button>
          </div>
        </div>
      ) : (
        /* 투표 카드 캐러셀 */
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {voteItems.map(item => (
                <div
                  key={item.id}
                  className="w-full flex-shrink-0 px-2 first:pl-0 last:pr-0"
                >
                  <div className="flex space-x-3">
                    {/* 좌측 카드 */}
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[128/182] relative">
                        {/* 투표 이미지 */}
                        <img
                          src={item.leftImage}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-black mb-1">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => handleVote(item.id, 'left')}
                          disabled={votingStates[item.id]?.left}
                          className={`bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-gray-700 transition-colors ${
                            votingStates[item.id]?.left
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {votingStates[item.id]?.left
                            ? '투표중...'
                            : '보고싶어요'}
                        </button>
                      </div>
                    </div>

                    {/* 우측 카드 */}
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-lg overflow-hidden aspect-[128/182] relative">
                        {/* 투표 이미지 */}
                        <img
                          src={item.rightImage}
                          alt={item.subtitle}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2">
                        <h3 className="text-xs font-bold text-black mb-1">
                          {item.subtitle}
                        </h3>
                        <button
                          onClick={() => handleVote(item.id, 'right')}
                          disabled={votingStates[item.id]?.right}
                          className={`bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-gray-700 transition-colors ${
                            votingStates[item.id]?.right
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {votingStates[item.id]?.right
                            ? '투표중...'
                            : '보고싶어요'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 인디케이터 */}
          {!loading && voteItems.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {voteItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                  aria-label={`슬라이드 ${index + 1}로 이동`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default VoteSection;
