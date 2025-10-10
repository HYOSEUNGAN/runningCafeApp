import React, { memo, forwardRef } from 'react';

/**
 * 무한스크롤 로더 컴포넌트
 * Intersection Observer의 타겟 역할을 하며 로딩 상태를 표시
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - 로딩 중 여부
 * @param {boolean} props.hasMore - 더 가져올 데이터가 있는지 여부
 * @param {string} props.loadingText - 로딩 중 텍스트 (기본값: '더 많은 포스트를 불러오는 중...')
 * @param {string} props.endText - 끝에 도달했을 때 텍스트 (기본값: '모든 포스트를 확인했습니다')
 */
const InfiniteScrollLoader = forwardRef(
  (
    {
      isLoading = false,
      hasMore = true,
      loadingText = '더 많은 포스트를 불러오는 중...',
      endText = '모든 포스트를 확인했습니다',
    },
    ref
  ) => {
    // 더 가져올 데이터가 없으면 끝 메시지 표시
    if (!hasMore) {
      return (
        <div ref={ref} className="py-8 text-center">
          <div className="text-gray-400 text-sm">
            <span className="inline-block mr-2">🏁</span>
            {endText}
          </div>
        </div>
      );
    }

    // 로딩 중이면 로딩 스피너 표시
    if (isLoading) {
      return (
        <div ref={ref} className="py-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-500 text-sm">{loadingText}</span>
          </div>
        </div>
      );
    }

    // 기본 상태 (Intersection Observer 타겟)
    return (
      <div ref={ref} className="py-4 text-center">
        <div className="text-gray-300 text-sm">
          <span className="inline-block animate-pulse">⬇️</span>
        </div>
      </div>
    );
  }
);

InfiniteScrollLoader.displayName = 'InfiniteScrollLoader';

export default memo(InfiniteScrollLoader);
