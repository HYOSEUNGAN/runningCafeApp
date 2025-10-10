import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 무한스크롤을 위한 커스텀 훅
 * Intersection Observer API를 활용하여 자연스러운 무한스크롤 구현
 *
 * @param {Function} fetchMore - 추가 데이터를 가져오는 함수
 * @param {Object} options - 옵션 설정
 * @param {boolean} options.hasMore - 더 가져올 데이터가 있는지 여부
 * @param {boolean} options.isLoading - 현재 로딩 중인지 여부
 * @param {number} options.threshold - Intersection Observer threshold (기본값: 0.1)
 * @param {number} options.rootMargin - Intersection Observer rootMargin (기본값: '100px')
 * @returns {Object} { targetRef, isIntersecting }
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    hasMore = true,
    isLoading = false,
    threshold = 0.1,
    rootMargin = '100px',
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  // fetchMore 함수를 useCallback으로 메모이제이션
  const memoizedFetchMore = useCallback(fetchMore, [fetchMore]);

  // Intersection Observer 설정
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 새로운 observer 생성
    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);

        // 교차점에 도달하고, 로딩 중이 아니며, 더 가져올 데이터가 있을 때 fetchMore 실행
        if (entry.isIntersecting && !isLoading && hasMore) {
          memoizedFetchMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(target);

    // 정리 함수
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, threshold, rootMargin, memoizedFetchMore]);

  // 컴포넌트 언마운트 시 observer 정리
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    targetRef,
    isIntersecting,
  };
};

export default useInfiniteScroll;
