import React, { useState } from 'react';

const CourseModal = ({ course, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    address: course?.address || '',
    lat: course?.lat || '',
    lng: course?.lng || '',
    place_type: course?.place_type || 'park',
    description: course?.description || '',
    difficulty_level: course?.difficulty_level || 1,
    distance_km: course?.distance_km || '',
    surface_type: course?.surface_type || 'asphalt',
    facilities: course?.facilities || [],
    image_urls: course?.image_urls || [],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      // 숫자 필드 변환
      const processedData = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        difficulty_level: parseInt(formData.difficulty_level),
        distance_km: formData.distance_km
          ? parseFloat(formData.distance_km)
          : null,
      };

      await onSave(processedData);
    } catch (error) {
      console.error('러닝 코스 저장 실패:', error);
      alert('러닝 코스 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        '정말로 이 러닝 코스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      setLoading(true);
      try {
        await onDelete(course.id);
      } catch (error) {
        console.error('러닝 코스 삭제 실패:', error);
        alert('러닝 코스 삭제에 실패했습니다.');
        setLoading(false);
      }
    }
  };

  const placeTypes = [
    { value: 'park', label: '공원' },
    { value: 'trail', label: '트레일' },
    { value: 'track', label: '트랙' },
    { value: 'riverside', label: '강변' },
    { value: 'mountain', label: '산' },
  ];

  const surfaceTypes = [
    { value: 'asphalt', label: '아스팔트' },
    { value: 'dirt', label: '흙길' },
    { value: 'track', label: '트랙' },
    { value: 'mixed', label: '혼합' },
  ];

  const facilityOptions = [
    'parking',
    'restroom',
    'water_fountain',
    'shower',
    'locker',
    'cafe',
  ];

  const facilityLabels = {
    parking: '주차장',
    restroom: '화장실',
    water_fountain: '음수대',
    shower: '샤워실',
    locker: '락커',
    cafe: '카페',
  };

  const handleFacilityChange = facility => {
    const currentFacilities = formData.facilities || [];
    if (currentFacilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: currentFacilities.filter(f => f !== facility),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...currentFacilities, facility],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {course ? '러닝 코스 수정' : '새 러닝 코스 추가'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-h-96 overflow-y-auto"
        >
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                코스명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타입
              </label>
              <select
                value={formData.place_type}
                onChange={e =>
                  setFormData({ ...formData, place_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {placeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 위치 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위도 *
              </label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={e =>
                  setFormData({ ...formData, lat: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                경도 *
              </label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={e =>
                  setFormData({ ...formData, lng: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 코스 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                거리 (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.distance_km}
                onChange={e =>
                  setFormData({ ...formData, distance_km: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                난이도 (1-5)
              </label>
              <select
                value={formData.difficulty_level}
                onChange={e =>
                  setFormData({ ...formData, difficulty_level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1단계 (초급)</option>
                <option value={2}>2단계</option>
                <option value={3}>3단계 (중급)</option>
                <option value={4}>4단계</option>
                <option value={5}>5단계 (고급)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                노면 타입
              </label>
              <select
                value={formData.surface_type}
                onChange={e =>
                  setFormData({ ...formData, surface_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {surfaceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 시설 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시설
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {facilityOptions.map(facility => (
                <label key={facility} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities?.includes(facility) || false}
                    onChange={() => handleFacilityChange(facility)}
                    className="mr-2"
                  />
                  <span className="text-sm">{facilityLabels[facility]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="러닝 코스에 대한 설명을 입력하세요..."
            />
          </div>
        </form>

        {/* 버튼 */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          {course && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '삭제 중...' : '코스 삭제'}
            </button>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
