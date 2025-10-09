import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import CafeTable from '../../components/admin/CafeTable';
import CafeModal from '../../components/admin/CafeModal';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminCafesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cafes, setCafes] = useState([]);
  const [filteredCafes, setFilteredCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [runnerFriendlyFilter, setRunnerFriendlyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    // 관리자 권한 확인
    if (!user || !adminService.isAdmin(user)) {
      navigate('/login');
      return;
    }

    fetchCafes();
  }, [user, navigate]);

  useEffect(() => {
    // 검색 및 필터링 적용
    let filtered = cafes;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        cafe =>
          cafe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cafe.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cafe.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 러너 친화적 필터링
    if (runnerFriendlyFilter !== 'all') {
      filtered = filtered.filter(cafe =>
        runnerFriendlyFilter === 'yes'
          ? cafe.runner_friendly
          : !cafe.runner_friendly
      );
    }

    // 평점 필터링
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(cafe => cafe.rating >= minRating);
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

    setFilteredCafes(filtered);
  }, [
    cafes,
    searchTerm,
    runnerFriendlyFilter,
    ratingFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      const cafeData = await adminService.getCafes();
      setCafes(cafeData);
    } catch (error) {
      console.error('카페 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCafeClick = cafe => {
    setSelectedCafe(cafe);
    setShowCafeModal(true);
  };

  const handleCreateCafe = () => {
    setSelectedCafe(null);
    setShowCafeModal(true);
  };

  const handleCafeSave = async cafeData => {
    try {
      if (selectedCafe) {
        // 수정
        await adminService.updateCafe(selectedCafe.id, cafeData);
      } else {
        // 새로 생성
        await adminService.createCafe(cafeData);
      }
      await fetchCafes(); // 데이터 새로고침
      setShowCafeModal(false);
    } catch (error) {
      console.error('카페 저장 실패:', error);
    }
  };

  const handleCafeDelete = async cafeId => {
    if (window.confirm('정말로 이 카페를 삭제하시겠습니까?')) {
      try {
        await adminService.deleteCafe(cafeId);
        await fetchCafes(); // 데이터 새로고침
        setShowCafeModal(false);
      } catch (error) {
        console.error('카페 삭제 실패:', error);
      }
    }
  };

  const runnerFriendlyOptions = [
    { value: 'all', label: '전체' },
    { value: 'yes', label: '러너 친화적' },
    { value: 'no', label: '일반' },
  ];

  const ratingOptions = [
    { value: 'all', label: '전체 평점' },
    { value: '4.5', label: '4.5점 이상' },
    { value: '4.0', label: '4.0점 이상' },
    { value: '3.5', label: '3.5점 이상' },
    { value: '3.0', label: '3.0점 이상' },
  ];

  const sortOptions = [
    { value: 'created_at', label: '등록일' },
    { value: 'name', label: '이름' },
    { value: 'rating', label: '평점' },
    { value: 'review_count', label: '리뷰 수' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="카페 데이터 로딩 중..." />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">카페 관리</h1>
            <p className="text-gray-600">
              총 {cafes.length}개의 카페가 등록되어 있습니다
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateCafe}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              새 카페 추가
            </button>
            <button
              onClick={fetchCafes}
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
                placeholder="카페명, 주소로 검색..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex gap-4">
              <FilterDropdown
                label="러너 친화도"
                options={runnerFriendlyOptions}
                value={runnerFriendlyFilter}
                onChange={setRunnerFriendlyFilter}
              />
              <FilterDropdown
                label="평점"
                options={ratingOptions}
                value={ratingFilter}
                onChange={setRatingFilter}
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

        {/* 카페 테이블 */}
        <div className="bg-white rounded-lg shadow-sm">
          <CafeTable
            cafes={filteredCafes}
            onCafeClick={handleCafeClick}
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

        {/* 카페 모달 */}
        {showCafeModal && (
          <CafeModal
            cafe={selectedCafe}
            onClose={() => setShowCafeModal(false)}
            onSave={handleCafeSave}
            onDelete={selectedCafe ? handleCafeDelete : null}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCafesPage;
