import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import cacheManager from '../../utils/cacheManager';

/**
 * 업데이트 알림 컴포넌트
 * 새 버전이 있을 때 사용자에게 업데이트를 안내합니다.
 */
const UpdateNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // 캐시 매니저 이벤트 리스너 등록
    const handleCacheEvent = (eventType, data) => {
      switch (eventType) {
        case 'updateAvailable':
          setUpdateInfo(data);
          setIsVisible(true);
          break;
        case 'cacheCleared':
          console.log('캐시가 삭제되었습니다:', data.message);
          break;
        default:
          break;
      }
    };

    cacheManager.addListener(handleCacheEvent);

    // 컴포넌트 마운트 시 업데이트 확인
    cacheManager.checkForUpdates();

    return () => {
      cacheManager.removeListener(handleCacheEvent);
    };
  }, []);

  /**
   * 업데이트 적용
   */
  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const success = await cacheManager.applyUpdate();
      if (!success) {
        // Service Worker 업데이트가 실패한 경우 강제 새로고침
        cacheManager.forceReload();
      }
    } catch (error) {
      console.error('업데이트 적용 실패:', error);
      cacheManager.forceReload();
    }
  };

  /**
   * 알림 닫기
   */
  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Download className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                새 버전 업데이트
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {updateInfo?.message || '새로운 기능과 개선사항이 있습니다.'}
              </p>
              {updateInfo?.version && (
                <p className="text-xs text-gray-500 mt-1">
                  버전: {updateInfo.version}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                업데이트 중...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                지금 업데이트
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 캐시 관리 컴포넌트
 * 개발자나 관리자가 캐시를 수동으로 관리할 수 있는 UI
 */
export const CacheManagementPanel = ({ isVisible = false, onClose }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadDiagnostics();
    }
  }, [isVisible]);

  /**
   * 진단 정보 로드
   */
  const loadDiagnostics = async () => {
    try {
      const info = await cacheManager.diagnostics();
      setDiagnostics(info);
    } catch (error) {
      console.error('진단 정보 로드 실패:', error);
    }
  };

  /**
   * 모든 캐시 삭제
   */
  const handleClearCache = async () => {
    if (
      !window.confirm('모든 캐시를 삭제하시겠습니까? 페이지가 새로고침됩니다.')
    ) {
      return;
    }

    setIsClearing(true);

    try {
      await cacheManager.clearAllCaches();
      // 캐시 삭제 후 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('캐시 삭제 실패:', error);
      setIsClearing(false);
    }
  };

  /**
   * 강제 새로고침
   */
  const handleForceReload = () => {
    if (window.confirm('캐시를 무시하고 새로고침하시겠습니까?')) {
      cacheManager.forceReload();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">캐시 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 진단 정보 */}
          {diagnostics && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                시스템 정보
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>앱 버전: {diagnostics.appVersion}</div>
                <div>SW 버전: {diagnostics.swVersion || 'N/A'}</div>
                <div>
                  Service Worker:{' '}
                  {diagnostics.serviceWorker ? '활성' : '비활성'}
                </div>
                <div>
                  업데이트 가능: {diagnostics.updateAvailable ? '예' : '아니오'}
                </div>
                {diagnostics.storageUsage && (
                  <div>
                    스토리지: {diagnostics.storageUsage.usedMB}MB /{' '}
                    {diagnostics.storageUsage.quotaMB}MB
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  캐시 삭제 중...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  모든 캐시 삭제
                </>
              )}
            </button>

            <button
              onClick={handleForceReload}
              className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              강제 새로고침
            </button>

            <button
              onClick={loadDiagnostics}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              정보 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
