import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import { useAuthStore } from '../stores/useAuthStore';

// 샘플 기록 데이터 (날짜별로 정리)
const runningRecords = {
  '2025-09-19': {
    distance: 10.2,
    time: '02:23:39',
    pace: '18\'31"',
    calories: 488,
    route: '한강공원 러닝',
    notes: '컨디션이 좋았던 날! 목표했던 10km를 완주했다.',
    dayOfWeek: 'THU',
  },
  '2025-09-25': {
    distance: 0,
    time: '00:34',
    pace: '--\'--"',
    calories: 0,
    route: '30분 달리기 도전',
    notes: '30분 달리기 도전!',
    dayOfWeek: 'WED',
  },
};

// 이번 달 통계
const monthlyStats = {
  totalDistance: '0.00km',
  totalTime: '00:34',
  avgPace: '--\'--"',
  totalCalories: 0,
};

const RecordPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuthStore();

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateKey = date => {
    return date.toISOString().split('T')[0];
  };

  // 선택된 날짜의 기록 가져오기
  const getRecordForDate = date => {
    const dateKey = formatDateKey(date);
    return runningRecords[dateKey] || null;
  };

  // 달력에서 러닝 기록이 있는 날짜 표시
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const record = getRecordForDate(date);
      if (record) {
        return (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
          </div>
        );
      }
    }
    return null;
  };

  // 달력 날짜 클래스명 설정
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const record = getRecordForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      let classes = [];

      if (record) {
        classes.push('has-record');
      }
      if (isToday) {
        classes.push('today');
      }
      if (isSelected) {
        classes.push('selected');
      }

      return classes.join(' ');
    }
    return null;
  };

  const selectedRecord = getRecordForDate(selectedDate);

  // 요일 가져오기
  const getDayOfWeek = date => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 pb-20">
      <div className="app-container bg-white">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
          <button className="touch-button text-neutral-600 hover:text-primary-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-neutral-900">전체 기록</h1>
          <div className="flex space-x-1">
            <button className="touch-button text-neutral-600 hover:text-primary-500">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19V6l12 6-12 6z"
                />
              </svg>
            </button>
            <button className="touch-button text-neutral-600 hover:text-primary-500">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 런데이 업데이트 알림 */}
        <div className="mx-4 mt-4 p-4 bg-primary-gradient rounded-card text-white text-sm flex items-center justify-between shadow-card">
          <span className="flex-1 mr-3">
            런데이 어워드가 새롭게 개설되었습니다. 운동 후 어워드를 획득하여
            모아보세요.
          </span>
          <button className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors touch-button">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 현재 러닝 통계 */}
        <div className="px-4 py-6 text-center bg-white">
          <div className="text-h3 font-bold text-gradient mb-4">거리(km)</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">
                02:23:39
              </div>
              <div className="text-caption text-neutral-600">시간</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">
                18'31"
              </div>
              <div className="text-caption text-neutral-600">페이스</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">488</div>
              <div className="text-caption text-neutral-600">칼로리</div>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div className="px-4">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            formatDay={(locale, date) => date.getDate().toString()}
            showNeighboringMonth={false}
            next2Label={null}
            prev2Label={null}
            nextLabel="›"
            prevLabel="‹"
            className="custom-calendar"
          />
        </div>

        {/* 월별 분석 */}
        <div className="px-4 py-4">
          <div className="mobile-card bg-neutral-50">
            <h3 className="text-h4 font-bold text-neutral-900 mb-2">
              9월 분석
            </h3>
            <div className="text-body text-neutral-600">
              {monthlyStats.totalDistance} / {monthlyStats.totalTime} /{' '}
              {monthlyStats.avgPace} / --kcal
            </div>
          </div>
        </div>

        {/* 선택된 날짜의 기록 */}
        {selectedRecord && (
          <div className="px-4 pb-4">
            <div className="mobile-card border border-neutral-200 hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div className="text-primary-500 font-medium text-center">
                  <div className="text-caption font-semibold">
                    {getDayOfWeek(selectedDate)}
                  </div>
                  <div className="text-h3 font-bold">
                    {selectedDate.getDate()}
                  </div>
                </div>
                <div className="flex-1 ml-4">
                  <h4 className="font-semibold text-neutral-900 mb-1">
                    {selectedRecord.route}
                  </h4>
                  <div className="text-body text-neutral-600">
                    {selectedRecord.time} /{' '}
                    {selectedRecord.distance > 0
                      ? `${selectedRecord.distance}km`
                      : '0.00km'}
                  </div>
                </div>
                <button className="touch-button text-neutral-400 hover:text-primary-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordPage;
