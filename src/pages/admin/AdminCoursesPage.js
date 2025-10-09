import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import CourseTable from '../../components/admin/CourseTable';
import CourseModal from '../../components/admin/CourseModal';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminCoursesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    // 관리자 권한 확인
    if (!user || !adminService.isAdmin(user)) {
      navigate('/login');
      return;
    }

    fetchCourses();
  }, [user, navigate]);

  useEffect(() => {
    // 검색 및 필터링 적용
    let filtered = courses;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        course =>
          course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(course => course.place_type === typeFilter);
    }

    // 난이도 필터링
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(
        course => course.difficulty_level === parseInt(difficultyFilter)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCourses(filtered);
  }, [courses, searchTerm, typeFilter, difficultyFilter, sortBy, sortOrder]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const courseData = await adminService.getCourses();
      setCourses(courseData);
    } catch (error) {
      console.error('러닝 코스 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = course => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setShowCourseModal(true);
  };

  const handleCourseSave = async courseData => {
    try {
      if (selectedCourse) {
        // 수정
        await adminService.updateCourse(selectedCourse.id, courseData);
      } else {
        // 새로 생성
        await adminService.createCourse(courseData);
      }
      await fetchCourses(); // 데이터 새로고침
      setShowCourseModal(false);
    } catch (error) {
      console.error('러닝 코스 저장 실패:', error);
    }
  };

  const handleCourseDelete = async courseId => {
    if (window.confirm('정말로 이 러닝 코스를 삭제하시겠습니까?')) {
      try {
        await adminService.deleteCourse(courseId);
        await fetchCourses(); // 데이터 새로고침
        setShowCourseModal(false);
      } catch (error) {
        console.error('러닝 코스 삭제 실패:', error);
      }
    }
  };

  const typeOptions = [
    { value: 'all', label: '전체' },
    { value: 'park', label: '공원' },
    { value: 'trail', label: '트레일' },
    { value: 'track', label: '트랙' },
    { value: 'riverside', label: '강변' },
    { value: 'mountain', label: '산' },
  ];

  const difficultyOptions = [
    { value: 'all', label: '전체 난이도' },
    { value: '1', label: '1단계 (초급)' },
    { value: '2', label: '2단계' },
    { value: '3', label: '3단계 (중급)' },
    { value: '4', label: '4단계' },
    { value: '5', label: '5단계 (고급)' },
  ];

  const sortOptions = [
    { value: 'created_at', label: '등록일' },
    { value: 'name', label: '이름' },
    { value: 'distance_km', label: '거리' },
    { value: 'difficulty_level', label: '난이도' },
    { value: 'rating', label: '평점' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="러닝 코스 데이터 로딩 중..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              러닝 코스 관리
            </h1>
            <p className="text-gray-600">
              총 {courses.length}개의 러닝 코스가 등록되어 있습니다
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateCourse}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              새 코스 추가
            </button>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="코스명, 주소로 검색..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex gap-4">
              <FilterDropdown
                label="타입"
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
              />
              <FilterDropdown
                label="난이도"
                options={difficultyOptions}
                value={difficultyFilter}
                onChange={setDifficultyFilter}
              />
              <FilterDropdown
                label="정렬"
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 러닝 코스 테이블 */}
        <div className="bg-white rounded-lg shadow-sm">
          <CourseTable
            courses={filteredCourses}
            onCourseClick={handleCourseClick}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={field => {
              if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(field);
                setSortOrder('desc');
              }
            }}
          />
        </div>

        {/* 러닝 코스 모달 */}
        {showCourseModal && (
          <CourseModal
            course={selectedCourse}
            onClose={() => setShowCourseModal(false)}
            onSave={handleCourseSave}
            onDelete={selectedCourse ? handleCourseDelete : null}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCoursesPage;
