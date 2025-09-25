import React from 'react';

/**
 * 프로필 페이지 헤더 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 헤더 타이틀
 * @param {boolean} props.showEditButton - 편집 버튼 표시 여부
 * @param {boolean} props.isEditing - 편집 모드 상태
 * @param {function} props.onEditToggle - 편집 모드 토글 핸들러
 */
const ProfileHeader = ({
  title = '프로필',
  showEditButton = false,
  isEditing = false,
  onEditToggle,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 safe-area-top w-full max-w-[390px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {/* {showEditButton && (
          <button
            onClick={onEditToggle}
            className="touch-button text-primary-500 hover:text-primary-600 transition-colors"
            aria-label={isEditing ? '편집 완료' : '편집 모드'}
          >
            <span className="text-lg">{isEditing ? '✓' : '✏️'}</span>
          </button>
        )} */}
      </div>
    </header>
  );
};

export default ProfileHeader;
