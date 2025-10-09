import React from 'react';

const CafeTable = ({ cafes, onCafeClick, sortBy, sortOrder, onSort }) => {
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

  const getRunnerFriendlyBadge = isRunnerFriendly => {
    return isRunnerFriendly ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        러너 친화적
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        일반
      </span>
    );
  };

  if (cafes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">☕</div>
        <p className="text-gray-500">등록된 카페가 없습니다</p>
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
                <span>카페명</span>
                <span>{getSortIcon('name')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              주소
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              러너 친화도
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
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('review_count')}
            >
              <div className="flex items-center space-x-1">
                <span>리뷰 수</span>
                <span>{getSortIcon('review_count')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              연락처
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
          {cafes.map(cafe => (
            <tr
              key={cafe.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onCafeClick(cafe)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {cafe.image_url ? (
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={cafe.image_url}
                        alt=""
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-lg">☕</span>
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {cafe.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                {cafe.address || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getRunnerFriendlyBadge(cafe.runner_friendly)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <span className="mr-1">{getRatingStars(cafe.rating)}</span>
                  <span>{cafe.rating ? cafe.rating.toFixed(1) : '0.0'}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {cafe.review_count || 0}개
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cafe.phone || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(cafe.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CafeTable;
