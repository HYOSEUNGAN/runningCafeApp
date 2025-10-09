import React, { useState } from 'react';

const UserModal = ({ user, onClose, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    display_name: user.display_name || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate(user.id, formData);
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      alert('사용자 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        '정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      setLoading(true);
      try {
        await onDelete(user.id);
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        alert('사용자 삭제에 실패했습니다.');
        setLoading(false);
      }
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">사용자 정보</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용자명
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={e =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                표시 이름
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={e =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로필 이미지 URL
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={e =>
                setFormData({ ...formData, avatar_url: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              소개
            </label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="사용자 소개를 입력하세요..."
            />
          </div>

          {/* 통계 정보 (읽기 전용) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              통계 정보
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">이메일:</span>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-500">러닝 횟수:</span>
                <p className="font-medium">{user.total_runs}회</p>
              </div>
              <div>
                <span className="text-gray-500">총 거리:</span>
                <p className="font-medium">
                  {user.total_distance?.toFixed(1)}km
                </p>
              </div>
              <div>
                <span className="text-gray-500">가입일:</span>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '삭제 중...' : '사용자 삭제'}
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
