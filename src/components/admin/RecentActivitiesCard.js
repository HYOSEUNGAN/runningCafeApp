import React from 'react';

const RecentActivitiesCard = ({ activities = [] }) => {
  const getActivityIcon = type => {
    const icons = {
      user_signup: '👤',
      course_created: '🛤️',
      cafe_added: '☕',
      record_posted: '📊',
      review_posted: '⭐',
      default: '📝',
    };
    return icons[type] || icons.default;
  };

  const getActivityColor = type => {
    const colors = {
      user_signup: 'text-green-600',
      course_created: 'text-purple-600',
      cafe_added: 'text-orange-600',
      record_posted: 'text-blue-600',
      review_posted: 'text-yellow-600',
      default: 'text-gray-600',
    };
    return colors[type] || colors.default;
  };

  const formatTimeAgo = timestamp => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
        <span className="text-sm text-gray-500">실시간</span>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📭</div>
            <p className="text-gray-500">최근 활동이 없습니다</p>
          </div>
        ) : (
          activities.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-xl">
                  {getActivityIcon(activity.type)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span
                    className={`font-medium ${getActivityColor(activity.type)}`}
                  >
                    {activity.user_name || '익명'}
                  </span>
                  <span className="ml-1">{activity.description}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            더 많은 활동 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivitiesCard;
