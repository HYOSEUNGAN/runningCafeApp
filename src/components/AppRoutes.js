import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/app';
import Navigation from './layout/Navigation';
import BottomNavigation from './layout/BottomNavigation';

// 페이지 컴포넌트들
import HomePage from '../pages/HomePage';
import MapPage from '../pages/MapPage';
import NavigationPage from '../pages/NavigationPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import FeedPage from '../pages/FeedPage';
import RecordPage from '../pages/RecordPage';
// import SignupPage from '../pages/SignupPage';
// import RunningCoursesPage from '../pages/RunningCoursesPage';
// import CafesPage from '../pages/CafesPage';
// import MyRecordsPage from '../pages/MyRecordsPage';

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
  const isNavigationPage = location.pathname === ROUTES.NAV;
  const isHomePage = location.pathname === ROUTES.HOME;
  const isLoginPage =
    location.pathname === ROUTES.LOGIN ||
    location.pathname === '/auth/callback';

  return (
    <>
      {/* 네비게이션 페이지가 아닐 때만 상단 네비게이션 표시 */}
      {isHomePage && <Navigation />}

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
        <Route path={ROUTES.NAV} element={<NavigationPage />} />
        <Route path={ROUTES.CAFES} element={<TempPage title="카페" />} />
        <Route
          path={ROUTES.MY_RECORDS}
          element={<TempPage title="내 기록" />}
        />
        <Route path={ROUTES.FEED} element={<FeedPage />} />
        <Route path={ROUTES.RECORD} element={<RecordPage />} />
        {/* 404 페이지 */}
        <Route
          path="*"
          element={<TempPage title="페이지를 찾을 수 없습니다" />}
        />
      </Routes>

      {/* 네비게이션 페이지가 아닐 때만 하단 네비게이션 표시 */}
      {!isNavigationPage && !isLoginPage && <BottomNavigation />}
    </>
  );
};

export default AppRoutes;
