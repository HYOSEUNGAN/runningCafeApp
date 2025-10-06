import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import { useAuthStore } from '../stores/useAuthStore';
import {
  getUserRunningRecords,
  getMonthlyRunningStats,
} from '../services/runningRecordService';
import { getKSTDateKey, getLocalDateKey } from '../utils/format';
import { useNavigate } from 'react-router-dom';

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

        // 날짜별로 기록 정리 (한국 시간대로 변환)
        const recordsMap = {};
        recordsResult.data.forEach(record => {
          // UTC 시간을 한국 시간대로 변환하여 날짜 키 생성
          const dateKey = getKSTDateKey(record.created_at);
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

  // 날짜를 YYYY-MM-DD 형식으로 변환 (한국 시간대 기준)
  const formatDateKey = date => {
    return getLocalDateKey(date);
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

  // 응원 메시지 생성 함수
  const getMotivationalMessage = () => {
    const totalRuns = monthlyStats.totalRuns;
    const totalDistance = monthlyStats.totalDistance;

    if (totalRuns === 0) {
      return {
        title: '첫 번째 러닝을 시작해보세요!',
        message:
          '새로운 여정의 첫 걸음을 내딛어보세요. 모든 위대한 러너도 첫 걸음부터 시작했답니다!',
        emoji: '🌟',
      };
    } else if (totalRuns < 5) {
      return {
        title: '좋은 시작이에요!',
        message:
          '벌써 ' +
          totalRuns +
          '번째 러닝이네요! 꾸준함이 가장 중요해요. 오늘도 화이팅!',
        emoji: '💪',
      };
    } else if (totalDistance < 50) {
      return {
        title: '점점 강해지고 있어요!',
        message:
          '이미 ' +
          totalDistance.toFixed(1) +
          'km를 달렸네요! 목표를 향해 한 걸음씩 나아가고 있어요!',
        emoji: '🔥',
      };
    } else {
      return {
        title: '정말 대단해요!',
        message:
          '총 ' +
          totalDistance.toFixed(1) +
          'km! 진정한 러너의 모습이에요. 오늘도 새로운 기록에 도전해보세요!',
        emoji: '🏆',
      };
    }
  };

  const motivationalMessage = getMotivationalMessage();
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
    <div className="min-h-screen bg-neutral-50  pb-20">
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
          <div className="w-6"></div> {/* 헤더 균형을 위한 빈 공간 */}
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

        {/* 러닝 시작 메인 섹션 */}
        <div className="px-4 py-6 text-center bg-gradient-to-br from-primary-500 to-primary-600 text-white mx-4 mt-4 rounded-2xl shadow-lg">
          <div className="mb-4">
            <div className="text-3xl mb-2">{motivationalMessage.emoji}</div>
            <h2 className="text-xl font-bold mb-2">
              {motivationalMessage.title}
            </h2>
            <p className="text-primary-100 text-sm mb-4 leading-relaxed">
              {motivationalMessage.message}
            </p>
          </div>

          <button
            onClick={() => navigate('/nav')}
            className="w-full bg-white text-primary-600 font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 mb-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <svg
              className="w-6 h-6 relative z-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-lg relative z-10">러닝 시작하기</span>
          </button>

          <div className="grid grid-cols-3 gap-2 text-xs text-primary-100">
            <div className="flex items-center justify-center space-x-1 p-2 rounded-lg bg-white bg-opacity-10">
              <span>🏆</span>
              <span>러닝 챌린지</span>
            </div>
            <div className="flex items-center justify-center space-x-1 p-2 rounded-lg bg-white bg-opacity-10">
              <span>📊</span>
              <span>실시간 기록</span>
            </div>
            <div className="flex items-center justify-center space-x-1 p-2 rounded-lg bg-white bg-opacity-10">
              <span>💬</span>
              <span>기록 공유</span>
            </div>
          </div>
        </div>

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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordPage;
