import React from 'react';

/**
 * 챌린지 카드 컴포넌트
 * @param {Object} challenge - 챌린지 데이터
 * @param {Object} participation - 참여 데이터 (선택사항)
 * @param {Function} onJoin - 참여 버튼 클릭 핸들러
 * @param {Function} onLeave - 참여 취소 버튼 클릭 핸들러
 */
const ChallengeCard = ({ challenge, participation, onJoin, onLeave }) => {
  const isParticipating = !!participation;
  const isCompleted = participation?.is_completed || false;
  const progress = participation?.current_progress || 0;
  const progressPercentage = Math.min(
    (progress / challenge.target_value) * 100,
    100
  );

  // 목표 타입에 따른 단위 표시
  const getTargetDisplay = () => {
    switch (challenge.target_type) {
      case 'distance':
        return `${challenge.target_value}${challenge.target_unit}`;
      case 'runs_count':
        return `${challenge.target_value}회`;
      case 'duration':
        return `${challenge.target_value}분`;
      default:
        return `${challenge.target_value}${challenge.target_unit}`;
    }
  };

  // 진행률 표시
  const getProgressDisplay = () => {
    switch (challenge.target_type) {
      case 'distance':
        return `${progress.toFixed(1)}${challenge.target_unit}`;
      case 'runs_count':
        return `${Math.floor(progress)}회`;
      case 'duration':
        return `${Math.floor(progress)}분`;
      default:
        return `${progress.toFixed(1)}${challenge.target_unit}`;
    }
  };

  // 챌린지 기간 표시
  const getPeriodDisplay = () => {
    return `${challenge.year}년 ${challenge.month}월`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
          <div className="text-xs text-gray-500">{getPeriodDisplay()}</div>
        </div>

        {challenge.badge_image_url ? (
          <img
            src={challenge.badge_image_url}
            alt="챌린지 배지"
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
        )}
      </div>

      {/* 목표 및 진행률 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">목표</span>
          <span className="text-sm font-medium text-gray-900">
            {getTargetDisplay()}
          </span>
        </div>

        {isParticipating && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">진행률</span>
              <span className="text-sm font-medium text-primary-600">
                {getProgressDisplay()} ({progressPercentage.toFixed(0)}%)
              </span>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            {isCompleted && (
              <div className="flex items-center text-green-600 text-sm font-medium mb-2">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                챌린지 완료!
                {challenge.reward_points > 0 && (
                  <span className="ml-2 text-yellow-600">
                    +{challenge.reward_points}P
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex space-x-2">
        {!isParticipating ? (
          <button
            onClick={() => onJoin?.(challenge.id)}
            className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            챌린지 참여하기
          </button>
        ) : (
          <div className="flex space-x-2 w-full">
            {!isCompleted && (
              <button
                onClick={() => onLeave?.(challenge.id)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                참여 취소
              </button>
            )}
            <button
              className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium cursor-default"
              disabled
            >
              {isCompleted ? '완료됨' : '참여 중'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;
