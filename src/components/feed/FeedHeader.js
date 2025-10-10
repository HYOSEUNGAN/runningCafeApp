import React, { memo } from 'react';
import { Plus } from 'lucide-react';

/**
 * 피드 페이지 헤더 컴포넌트
 * 제목, 새로고침 버튼, 글쓰기 버튼을 포함
 *
 * @param {Object} props
 * @param {Function} props.onRefresh - 새로고침 버튼 클릭 핸들러
 * @param {Function} props.onCreatePost - 글쓰기 버튼 클릭 핸들러
 * @param {boolean} props.refreshing - 새로고침 중 여부
 */
const FeedHeader = ({ onRefresh, onCreatePost, refreshing = false }) => {
  return (
    <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">피드</h1>

      <div className="flex items-center space-x-3">
        {/* 새로고침 버튼 */}
        <button
          onClick={onRefresh}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          disabled={refreshing}
          aria-label="새로고침"
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

        {/* 포스트 작성 버튼 */}
        <button
          onClick={onCreatePost}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
          aria-label="새 포스트 작성"
        >
          <Plus size={16} />
          <span className="text-sm font-semibold">글쓰기</span>
        </button>
      </div>
    </div>
  );
};

export default memo(FeedHeader);
