import React from 'react';

const CourseTable = ({ courses, onCourseClick, sortBy, sortOrder, onSort }) => {
  const getSortIcon = field => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = type => {
    const typeLabels = {
      park: '공원',
      trail: '트레일',
      track: '트랙',
      riverside: '강변',
      mountain: '산',
    };
    return typeLabels[type] || type;
  };

  const getDifficultyBadge = level => {
    const configs = {
      1: { label: '초급', color: 'bg-green-100 text-green-800' },
      2: { label: '초중급', color: 'bg-blue-100 text-blue-800' },
      3: { label: '중급', color: 'bg-yellow-100 text-yellow-800' },
      4: { label: '중고급', color: 'bg-orange-100 text-orange-800' },
      5: { label: '고급', color: 'bg-red-100 text-red-800' },
    };

    const config = configs[level] || {
      label: '미정',
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getRatingStars = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }

    return stars.join('') || '☆☆☆☆☆';
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">🛤️</div>
        <p className="text-gray-500">등록된 러닝 코스가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>코스명</span>
                <span>{getSortIcon('name')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              타입
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('distance_km')}
            >
              <div className="flex items-center space-x-1">
                <span>거리</span>
                <span>{getSortIcon('distance_km')}</span>
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('difficulty_level')}
            >
              <div className="flex items-center space-x-1">
                <span>난이도</span>
                <span>{getSortIcon('difficulty_level')}</span>
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('rating')}
            >
              <div className="flex items-center space-x-1">
                <span>평점</span>
                <span>{getSortIcon('rating')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              리뷰 수
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('created_at')}
            >
              <div className="flex items-center space-x-1">
                <span>등록일</span>
                <span>{getSortIcon('created_at')}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map(course => (
            <tr
              key={course.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onCourseClick(course)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {course.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {course.address}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {getTypeLabel(course.place_type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {course.distance_km ? `${course.distance_km}km` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getDifficultyBadge(course.difficulty_level)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <span className="mr-1">{getRatingStars(course.rating)}</span>
                  <span>
                    {course.rating ? course.rating.toFixed(1) : '0.0'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {course.review_count || 0}개
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(course.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
