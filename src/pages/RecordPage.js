import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getUserRunningRecords,
  getMonthlyRunningStats,
} from '../services/runningRecordService';
import { useNavigate } from 'react-router-dom';
import RunningShareModal from '../components/feed/RunningShareModal';

const RecordPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [runningRecords, setRunningRecords] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalRuns: 0,
    averagePace: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recordsByDate, setRecordsByDate] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    selectedRecord: null,
  });

  const { user, isAuthenticated, getUserId } = useAuthStore();
  const navigate = useNavigate();

  // 데이터 로드
  const loadRunningRecords = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = getUserId();

      // 러닝 기록 조회
      const recordsResult = await getUserRunningRecords(userId, { limit: 100 });
      if (recordsResult.success) {
        setRunningRecords(recordsResult.data);

        // 날짜별로 기록 정리
        const recordsMap = {};
        recordsResult.data.forEach(record => {
          const dateKey = record.created_at.split('T')[0];
          if (!recordsMap[dateKey]) {
            recordsMap[dateKey] = [];
          }
          recordsMap[dateKey].push(record);
        });
        setRecordsByDate(recordsMap);
      }

      // 월별 통계 조회
      const statsResult = await getMonthlyRunningStats(
        userId,
        currentYear,
        currentMonth
      );
      if (statsResult.success) {
        setMonthlyStats(statsResult.data);
      }
    } catch (error) {
      console.error('러닝 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunningRecords();
  }, [user, currentMonth, currentYear]);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateKey = date => {
    return date.toISOString().split('T')[0];
  };

  // 선택된 날짜의 기록 가져오기
  const getRecordForDate = date => {
    const dateKey = formatDateKey(date);
    return recordsByDate[dateKey] || null;
  };

  // 시간 포맷팅 (초를 HH:MM:SS로 변환)
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 페이스 포맷팅 (분/km)
  const formatPace = pace => {
    if (!pace || pace === 0) return '--\'--"';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  // 달력에서 러닝 기록이 있는 날짜 표시 - 러닝 도장 아이콘 추가
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const records = getRecordForDate(date);
      const hasRecord = records && records.length > 0;

      if (hasRecord) {
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <span className="text-xs">🏃</span>
          </div>
        );
      }
    }
    return null;
  };

  // 달력 날짜 클래스명 설정
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const records = getRecordForDate(date);
      const hasRecord = records && records.length > 0;
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      let classes = [];

      if (hasRecord) {
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

  const selectedRecords = getRecordForDate(selectedDate);

  // 요일 가져오기
  const getDayOfWeek = date => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  // 달력 네비게이션 변경 처리
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    if (activeStartDate) {
      const newMonth = activeStartDate.getMonth() + 1;
      const newYear = activeStartDate.getFullYear();

      if (newMonth !== currentMonth || newYear !== currentYear) {
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
      }
    }
  };

  // 공유 모달 열기
  const handleShareRecord = record => {
    setShareModal({
      isOpen: true,
      selectedRecord: record,
    });
  };

  // 공유 모달 닫기
  const handleCloseShareModal = () => {
    setShareModal({
      isOpen: false,
      selectedRecord: null,
    });
  };

  // 날짜 선택 처리
  const handleDateChange = date => {
    setSelectedDate(date);

    // 선택한 날짜의 월이 현재 보고 있는 월과 다르면 월도 변경
    const selectedMonth = date.getMonth() + 1;
    const selectedYear = date.getFullYear();

    if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
      setCurrentMonth(selectedMonth);
      setCurrentYear(selectedYear);
    }
  };

  // 로그인 안 된 경우
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-16 pb-20">
        <div className="app-container bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📊</span>
              </div>
              <p className="text-gray-500 mb-4">
                로그인하면 러닝 기록을 확인할 수 있어요
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-16 pb-20">
        <div className="app-container bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-4 pb-20">
      <div className="app-container bg-white">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
          <button
            onClick={() => navigate(-1)}
            className="touch-button text-neutral-600 hover:text-primary-500"
          >
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
            <button
              onClick={() => navigate('/nav')}
              className="touch-button text-neutral-600 hover:text-primary-500"
              title="러닝 시작"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 2px #ef4444)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M9 19V6l12 6-12 6z"
                  fill="#ef4444"
                  stroke="#ef4444"
                />
              </svg>
            </button>
            {/* <button className="touch-button text-neutral-600 hover:text-primary-500">
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
            </button> */}
          </div>
        </div>

        {/* 런데이 업데이트 알림 */}
        {/* <div className="mx-4 mt-4 p-4 bg-primary-gradient rounded-card text-white text-sm flex items-center justify-between shadow-card">
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
        </div> */}

        {/* 현재 러닝 통계 */}
        <div className="px-4 py-6 text-center bg-white">
          <div className="text-h3 font-bold text-gradient mb-4">
            총 {monthlyStats.totalDistance.toFixed(1)}km
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">
                {formatDuration(monthlyStats.totalDuration)}
              </div>
              <div className="text-caption text-neutral-600">시간</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">
                {formatPace(monthlyStats.averagePace)}
              </div>
              <div className="text-caption text-neutral-600">페이스</div>
            </div>
            <div className="text-center p-3 bg-neutral-50 rounded-card">
              <div className="text-h4 font-bold text-neutral-900 mb-1">
                {monthlyStats.totalCalories}
              </div>
              <div className="text-caption text-neutral-600">칼로리</div>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div className="px-4">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            tileContent={tileContent}
            tileClassName={tileClassName}
            formatDay={(locale, date) => date.getDate().toString()}
            showNeighboringMonth={false}
            calendarType="gregory"
            next2Label={null}
            prev2Label={null}
            nextLabel="›"
            prevLabel="‹"
            className="custom-calendar"
            locale="ko-KR"
            showFixedNumberOfWeeks={false}
            minDetail="month"
            tileDisabled={({ date, view }) => {
              if (view === 'month') {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                return (
                  date.getMonth() !== currentMonth ||
                  date.getFullYear() !== currentYear
                );
              }
              return false;
            }}
          />
        </div>

        {/* 월별 분석 */}
        <div className="px-4 py-4">
          <div className="mobile-card bg-neutral-50">
            <h3 className="text-h4 font-bold text-neutral-900 mb-2">
              {currentMonth}월 분석
            </h3>
            <div className="text-body text-neutral-600">
              {monthlyStats.totalDistance.toFixed(1)}km /{' '}
              {formatDuration(monthlyStats.totalDuration)} /{' '}
              {formatPace(monthlyStats.averagePace)} /{' '}
              {monthlyStats.totalCalories}kcal
            </div>
          </div>
        </div>

        {/* 선택된 날짜의 기록 */}
        {selectedRecords && selectedRecords.length > 0 && (
          <div className="px-4 pb-4 space-y-3">
            {selectedRecords.map((record, index) => (
              <div
                key={record.id}
                className="mobile-card border border-neutral-200 hover:shadow-card-hover transition-all"
              >
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
                      {record.title || `${record.distance}km 러닝`}
                    </h4>
                    <div className="text-body text-neutral-600">
                      {formatDuration(record.duration)} / {record.distance}km /{' '}
                      {formatPace(record.pace)}
                    </div>
                    {record.notes && (
                      <div className="text-sm text-neutral-500 mt-1">
                        {record.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShareRecord(record)}
                      className="touch-button text-primary-500 hover:text-primary-600 p-2 rounded-full hover:bg-primary-50 transition-colors"
                      title="피드에 공유하기"
                    >
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
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
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
            ))}
          </div>
        )}

        {/* 공유 모달 */}
        <RunningShareModal
          isOpen={shareModal.isOpen}
          onClose={handleCloseShareModal}
          runningRecord={shareModal.selectedRecord}
        />
      </div>
    </div>
  );
};

export default RecordPage;
