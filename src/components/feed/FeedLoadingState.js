import React, { memo } from 'react';

/**
 * 피드 로딩 상태 컴포넌트
 * 초기 로딩 시 표시되는 스켈레톤 UI
 */
const FeedLoadingState = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 스켈레톤 */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 포스트 스켈레톤들 */}
        <div className="space-y-0">
          {[1, 2, 3].map(index => (
            <div key={index} className="bg-white border-b border-gray-200 p-4">
              {/* 사용자 정보 스켈레톤 */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* 러닝 통계 스켈레톤 (일부 포스트만) */}
              {index % 2 === 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(statIndex => (
                      <div key={statIndex} className="text-center">
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                        <div className="h-3 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 텍스트 콘텐츠 스켈레톤 */}
              <div className="mb-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex space-x-2 mt-2">
                  <div className="h-3 w-12 bg-blue-200 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-blue-200 rounded animate-pulse"></div>
                  <div className="h-3 w-10 bg-blue-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* 이미지 스켈레톤 (일부 포스트만) */}
              {index % 3 === 0 && (
                <div className="mb-4">
                  <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              )}

              {/* 액션 버튼 스켈레톤 */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 로딩 인디케이터 */}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
};

export default memo(FeedLoadingState);
