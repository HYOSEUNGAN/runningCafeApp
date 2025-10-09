import React from 'react';

const UserTable = ({ users, onUserClick, sortBy, sortOrder, onSort }) => {
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

  const formatDistance = distance => {
    return `${distance.toFixed(1)}km`;
  };

  const getStatusBadge = isActive => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        활성
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        비활성
      </span>
    );
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">👥</div>
        <p className="text-gray-500">사용자가 없습니다</p>
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
              onClick={() => onSort('username')}
            >
              <div className="flex items-center space-x-1">
                <span>사용자명</span>
                <span>{getSortIcon('username')}</span>
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('email')}
            >
              <div className="flex items-center space-x-1">
                <span>이메일</span>
                <span>{getSortIcon('email')}</span>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('total_runs')}
            >
              <div className="flex items-center space-x-1">
                <span>러닝 횟수</span>
                <span>{getSortIcon('total_runs')}</span>
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('total_distance')}
            >
              <div className="flex items-center space-x-1">
                <span>총 거리</span>
                <span>{getSortIcon('total_distance')}</span>
              </div>
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('created_at')}
            >
              <div className="flex items-center space-x-1">
                <span>가입일</span>
                <span>{getSortIcon('created_at')}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map(user => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onUserClick(user)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {user.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.avatar_url}
                        alt=""
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username || '이름 없음'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.display_name || ''}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.email || '이메일 없음'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(user.is_active)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.total_runs}회
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDistance(user.total_distance)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(user.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
