import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/app';
import Navigation from './layout/Navigation';
import BottomNavigation from './layout/BottomNavigation';

// 페이지 컴포넌트들
import HomePage from '../pages/HomePage';
import MapPage from '../pages/MapPage';
// import NavigationPage from '../pages/NavigationPage';
import NavPage from '../pages/NavPage';
import RunningStartPage from '../pages/RunningStartPage';
import RunningStart2Page from '../pages/RunningStart2Page';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import FeedPage from '../pages/FeedPage';
import RecordPage from '../pages/RecordPage';
import CafeDetailPage from '../pages/CafeDetailPage';
import RunningPlaceDetailPage from '../pages/RunningPlaceDetailPage';
// import SignupPage from '../pages/SignupPage';
// import RunningCoursesPage from '../pages/RunningCoursesPage';
// import CafesPage from '../pages/CafesPage';
// import MyRecordsPage from '../pages/MyRecordsPage';

// 관리자 페이지 컴포넌트들
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminCoursesPage from '../pages/admin/AdminCoursesPage';
import AdminCafesPage from '../pages/admin/AdminCafesPage';
import AdminProtectedRoute from './admin/AdminProtectedRoute';
import AdminAccessButton from './admin/AdminAccessButton';
import { useAuthStore } from '../stores/useAuthStore';
import { adminService } from '../services/adminService';

// 임시 페이지 컴포넌트
const TempPage = ({ title }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="text-center">
      <h1 className="text-h1 font-bold text-gradient mb-4">{title}</h1>
      <p className="text-body text-neutral-600">준비 중인 페이지입니다.</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  // 러닝 관련 페이지들 (하단 네비게이션 숨김)
  const isRunningPage =
    location.pathname === ROUTES.NAV ||
    location.pathname === '/nav-detail' ||
    location.pathname === ROUTES.RUNNING_START2;
  const isHomePage = location.pathname === ROUTES.HOME;
  const isLoginPage =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/auth/callback';

  const isAdminPage = location.pathname.startsWith('/admin');
  const showAdminButton =
    user && adminService.isAdmin(user) && !isAdminPage && !isLoginPage;

  return (
    <>
      {/* 네비게이션 페이지가 아닐 때만 상단 네비게이션 표시 */}
      {isHomePage && !isAdminPage && <Navigation />}

      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path={ROUTES.SIGNUP} element={<TempPage title="회원가입" />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route
          path={ROUTES.RUNNING_COURSES}
          element={<TempPage title="러닝 코스" />}
        />
        <Route path={ROUTES.MAP} element={<MapPage />} />
        {/* <Route path={ROUTES.NAV} element={<NavigationPage />} /> */}
        <Route path="/nav" element={<RunningStartPage />} />
        <Route path="/nav-detail" element={<NavPage />} />
        <Route path={ROUTES.RUNNING_START} element={<RunningStartPage />} />
        <Route path={ROUTES.RUNNING_START2} element={<RunningStart2Page />} />
        <Route path={ROUTES.CAFES} element={<TempPage title="카페" />} />
        <Route path={ROUTES.CAFE_DETAIL} element={<CafeDetailPage />} />
        <Route
          path={ROUTES.RUNNING_PLACE_DETAIL}
          element={<RunningPlaceDetailPage />}
        />
        <Route
          path={ROUTES.MY_RECORDS}
          element={<TempPage title="내 기록" />}
        />
        <Route path={ROUTES.FEED} element={<FeedPage />} />
        <Route path={ROUTES.RECORD} element={<RecordPage />} />

        {/* 관리자 페이지 라우트 */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <AdminProtectedRoute>
              <AdminUsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_COURSES}
          element={
            <AdminProtectedRoute>
              <AdminCoursesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_CAFES}
          element={
            <AdminProtectedRoute>
              <AdminCafesPage />
            </AdminProtectedRoute>
          }
        />

        {/* 404 페이지 */}
        <Route
          path="*"
          element={<TempPage title="페이지를 찾을 수 없습니다" />}
        />
      </Routes>

      {/* 러닝 페이지가 아닐 때만 하단 네비게이션 표시 */}
      {!isRunningPage && !isLoginPage && !isAdminPage && <BottomNavigation />}

      {/* 관리자 접근 버튼 */}
      {showAdminButton && <AdminAccessButton />}
    </>
  );
};

export default AppRoutes;
