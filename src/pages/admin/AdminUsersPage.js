import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { adminService } from '../../services/adminService';
import AdminLayout from '../../components/admin/AdminLayout';
import UserTable from '../../components/admin/UserTable';
import UserModal from '../../components/admin/UserModal';
import SearchBar from '../../components/admin/SearchBar';
import FilterDropdown from '../../components/admin/FilterDropdown';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminUsersPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    // 관리자 권한 확인
    if (!user || !adminService.isAdmin(user)) {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    // 검색 및 필터링 적용
    let filtered = users;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.is_active;
        if (statusFilter === 'inactive') return !user.is_active;
        return true;
      });
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

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await adminService.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = user => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserUpdate = async (userId, updateData) => {
    try {
      await adminService.updateUser(userId, updateData);
      await fetchUsers(); // 데이터 새로고침
      setShowUserModal(false);
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
    }
  };

  const handleUserDelete = async userId => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        await adminService.deleteUser(userId);
        await fetchUsers(); // 데이터 새로고침
        setShowUserModal(false);
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
      }
    }
  };

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' },
  ];

  const sortOptions = [
    { value: 'created_at', label: '가입일' },
    { value: 'nickname', label: '닉네임' },
    { value: 'email', label: '이메일' },
    { value: 'total_runs', label: '러닝 횟수' },
    { value: 'total_distance', label: '총 거리' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="사용자 데이터 로딩 중..." />
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
              사용자 관리
            </h1>
            <p className="text-gray-600">
              총 {users.length}명의 사용자가 등록되어 있습니다
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="이메일, 닉네임으로 검색..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex gap-4">
              <FilterDropdown
                label="상태"
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
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

        {/* 사용자 테이블 */}
        <div className="bg-white rounded-lg shadow-sm">
          <UserTable
            users={filteredUsers}
            onUserClick={handleUserClick}
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

        {/* 사용자 상세 모달 */}
        {showUserModal && selectedUser && (
          <UserModal
            user={selectedUser}
            onClose={() => setShowUserModal(false)}
            onUpdate={handleUserUpdate}
            onDelete={handleUserDelete}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
