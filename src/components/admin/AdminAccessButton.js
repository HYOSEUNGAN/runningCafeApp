import React from 'react';
import { Link } from 'react-router-dom';

const AdminAccessButton = () => {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        title="관리자 대시보드"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        관리자
      </Link>
    </div>
  );
};

export default AdminAccessButton;
