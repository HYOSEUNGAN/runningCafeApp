import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import RecentActivitiesCard from '../../components/admin/RecentActivitiesCard';
import ChartCard from '../../components/admin/ChartCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalCourses: 0,
      totalCafes: 0,
      totalRecords: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
    },
    recentActivities: [],
    chartData: {
      userGrowth: [],
      popularCourses: [],
      cafeRatings: [],
    },
  });

  useEffect(() => {
    // 관리자 권한 확인
    if (!user || !adminService.isAdmin(user)) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="대시보드 데이터 로딩 중..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">
            Running Cafe 서비스 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatsCard
            title="전체 사용자"
            value={dashboardData.stats.totalUsers}
            icon="👥"
            trend={`+${dashboardData.stats.newUsersThisMonth}`}
            trendText="이번 달 신규"
            color="blue"
          />
          <StatsCard
            title="활성 사용자"
            value={dashboardData.stats.activeUsers}
            icon="🏃"
            trend={`${((dashboardData.stats.activeUsers / dashboardData.stats.totalUsers) * 100).toFixed(1)}%`}
            trendText="활성률"
            color="green"
          />
          <StatsCard
            title="러닝 코스"
            value={dashboardData.stats.totalCourses}
            icon="🛤️"
            color="purple"
          />
          <StatsCard
            title="등록된 카페"
            value={dashboardData.stats.totalCafes}
            icon="☕"
            color="orange"
          />
          <StatsCard
            title="총 러닝 기록"
            value={dashboardData.stats.totalRecords}
            icon="📊"
            color="indigo"
          />
        </div>

        {/* 차트 및 최근 활동 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 사용자 증가 차트 */}
          <div className="lg:col-span-2">
            <ChartCard
              title="사용자 증가 추이"
              type="line"
              data={dashboardData.chartData.userGrowth}
              height={300}
            />
          </div>

          {/* 최근 활동 */}
          <div>
            <RecentActivitiesCard activities={dashboardData.recentActivities} />
          </div>
        </div>

        {/* 인기 코스 및 카페 평점 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="인기 러닝 코스 TOP 5"
            type="bar"
            data={dashboardData.chartData.popularCourses}
            height={250}
          />
          <ChartCard
            title="카페 평점 분포"
            type="doughnut"
            data={dashboardData.chartData.cafeRatings}
            height={250}
          />
        </div>

        {/* 빠른 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            빠른 관리 작업
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              사용자 관리
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              코스 관리
            </button>
            <button
              onClick={() => navigate('/admin/cafes')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              카페 관리
            </button>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              데이터 새로고침
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
