import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import AppRoutes from './components/AppRoutes';
import LoadingSpinner from './components/common/LoadingSpinner';
import Toast from './components/common/Toast';
import Modal from './components/common/Modal';
import './App.css';

function App() {
  // const { initialize, isLoading } = useAuthStore();

  // useEffect(() => {
  //   // 앱 초기화 - 인증 상태 확인
  //   initialize();
  // }, [initialize]);

  // // 로딩 중일 때 표시할 컴포넌트
  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-neutral-50">
  //       <LoadingSpinner size="lg" message="앱을 초기화하는 중..." />
  //     </div>
  //   );
  // }

  return (
    <Router>
      <div className="App min-h-screen bg-neutral-50">
        {/* 메인 콘텐츠 */}
        <AppRoutes />

        {/* 전역 컴포넌트들 */}
        <Toast />
        <Modal />
      </div>
    </Router>
  );
}

export default App;
