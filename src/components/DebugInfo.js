import React from 'react';
import { APP_CONFIG } from '../constants/app';

const DebugInfo = () => {
  const currentOrigin = APP_CONFIG.getCurrentOrigin();
  const isDevelopment = APP_CONFIG.isDevelopment();
  const isProduction = APP_CONFIG.isProduction();

  // 개발 환경에서만 표시
  if (!isDevelopment && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      <div className="space-y-1">
        <div>
          <strong>Origin:</strong> {currentOrigin}
        </div>
        <div>
          <strong>Hostname:</strong> {window.location.hostname}
        </div>
        <div>
          <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
        </div>
        <div>
          <strong>isDevelopment:</strong> {isDevelopment ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>isProduction:</strong> {isProduction ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Supabase URL:</strong>{' '}
          {process.env.REACT_APP_SUPABASE_URL?.substring(0, 30)}...
        </div>
        <div>
          <strong>Callback URL:</strong> {currentOrigin}/auth/callback
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;
