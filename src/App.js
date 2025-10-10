import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import AppRoutes from './components/AppRoutes';
import LoadingSpinner from './components/common/LoadingSpinner';
import Toast from './components/common/Toast';
import Modal from './components/common/Modal';
import UpdateNotification from './components/common/UpdateNotification';
import IntroPage from './pages/IntroPage';
import { setupSampleDataHelper } from './utils/sampleData';
import { setupSampleDataHelper as setupRunningDataHelper } from './utils/sampleRunningData';
import { initializeServiceWorker } from './utils/backgroundService';
import './App.css';
import './styles/scrollbar.css';

// 앱 내부 컴포넌트 - Router 컨텍스트 내부에서 실행
function AppContent() {
  const { initialize, isLoading } = useAuthStore();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // 앱 초기화 - 인증 상태 확인
    initialize();

    // Service Worker 초기화 (백그라운드 추적용)
    initializeServiceWorker().catch(error => {
      console.error('Service Worker 초기화 실패:', error);
    });

    // 개발 환경에서만 샘플 데이터 헬퍼 등록
    if (process.env.NODE_ENV === 'development') {
      setupSampleDataHelper();
      setupRunningDataHelper();
    }

    // 인트로 페이지 표시 여부 확인 (localStorage 사용)
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro === 'true') {
      setShowIntro(false);
    } else {
      // 3초 후 인트로 숨기기
      const timer = setTimeout(() => {
        setShowIntro(false);
        localStorage.setItem('hasSeenIntro', 'true');
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [initialize]);

  // 인트로 페이지 표시 (Router 컨텍스트 내부에서)
  if (showIntro) {
    return <IntroPage />;
  }

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <LoadingSpinner size="lg" message="" />
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* 메인 콘텐츠 */}
      <AppRoutes />

      {/* 전역 컴포넌트들 */}
      <Toast />
      <Modal />
      <UpdateNotification />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
