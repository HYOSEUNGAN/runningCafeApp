import React from 'react';

/**
 * 액션 버튼 그룹 컴포넌트
 * 경로, 통화, 저장, 공유 기능 버튼들
 */
const ActionButtons = ({
  onRouteClick,
  onCallClick,
  onSaveClick,
  onShareClick,
  isSaved = false,
  phoneNumber,
}) => {
  const buttons = [
    {
      id: 'route',
      label: '경로',
      icon: '🗺️',
      onClick: onRouteClick,
      color: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50',
    },
    {
      id: 'call',
      label: '통화',
      icon: '📞',
      onClick: onCallClick,
      color: 'text-green-600',
      hoverColor: 'hover:bg-green-50',
      disabled: !phoneNumber,
    },
    {
      id: 'save',
      label: isSaved ? '저장됨' : '저장',
      icon: isSaved ? '❤️' : '🤍',
      onClick: onSaveClick,
      color: isSaved ? 'text-red-500' : 'text-gray-600',
      hoverColor: isSaved ? 'hover:bg-red-50' : 'hover:bg-gray-50',
    },
    {
      id: 'share',
      label: '공유',
      icon: '📤',
      onClick: onShareClick,
      color: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50',
    },
  ];

  const handleButtonClick = button => {
    if (button.disabled) return;

    // 버튼 클릭 피드백 애니메이션
    const buttonElement = document.getElementById(`action-btn-${button.id}`);
    if (buttonElement) {
      buttonElement.style.transform = 'scale(0.95)';
      setTimeout(() => {
        buttonElement.style.transform = 'scale(1)';
      }, 150);
    }

    if (button.onClick) {
      button.onClick();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 px-4 py-3">
      <div className="flex justify-around items-center">
        {buttons.map((button, index) => (
          <React.Fragment key={button.id}>
            {/* 액션 버튼 */}
            <button
              id={`action-btn-${button.id}`}
              onClick={() => handleButtonClick(button)}
              disabled={button.disabled}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                button.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : `${button.hoverColor} active:scale-95 hover:shadow-sm`
              }`}
            >
              {/* 아이콘 */}
              <div
                className={`text-2xl transition-transform duration-200 ${
                  button.disabled ? 'grayscale' : 'hover:scale-110'
                }`}
              >
                {button.icon}
              </div>

              {/* 라벨 */}
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  button.disabled ? 'text-gray-400' : button.color
                }`}
              >
                {button.label}
              </span>

              {/* 활성 상태 인디케이터 (저장 버튼) */}
              {button.id === 'save' && isSaved && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>

            {/* 구분선 (마지막 버튼 제외) */}
            {index < buttons.length - 1 && (
              <div className="h-10 w-px bg-gray-200"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span>🚶‍♀️ 도보 3분</span>
          <span>•</span>
          <span>🚗 차량 1분</span>
          <span>•</span>
          <span>🏃‍♀️ 러닝 2분</span>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;
