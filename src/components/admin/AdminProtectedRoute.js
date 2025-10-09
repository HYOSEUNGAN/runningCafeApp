import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" message="인증 확인 중..." />
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 관리자 권한이 없는 경우
  if (!adminService.isAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            접근 권한 없음
          </h2>
          <p className="text-gray-600 mb-4">
            관리자 페이지에 접근할 권한이 없습니다.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 관리자 권한이 있는 경우 자식 컴포넌트 렌더링
  return children;
};

export default AdminProtectedRoute;
