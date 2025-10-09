import React, { useState } from 'react';

const CafeModal = ({ cafe, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: cafe?.name || '',
    address: cafe?.address || '',
    lat: cafe?.lat || '',
    lng: cafe?.lng || '',
    phone: cafe?.phone || '',
    description: cafe?.description || '',
    image_url: cafe?.image_url || '',
    image_urls: cafe?.image_urls || [],
    operating_hours: cafe?.operating_hours || {},
    facilities: cafe?.facilities || [],
    tags: cafe?.tags || [],
    runner_friendly: cafe?.runner_friendly || false,
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
        operating_hours:
          typeof formData.operating_hours === 'string'
            ? JSON.parse(formData.operating_hours || '{}')
            : formData.operating_hours,
      };

      await onSave(processedData);
    } catch (error) {
      console.error('카페 저장 실패:', error);
      alert('카페 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        '정말로 이 카페를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      setLoading(true);
      try {
        await onDelete(cafe.id);
      } catch (error) {
        console.error('카페 삭제 실패:', error);
        alert('카페 삭제에 실패했습니다.');
        setLoading(false);
      }
    }
  };

  const facilityOptions = [
    'wifi',
    'parking',
    'restroom',
    'charging',
    'outdoor_seating',
    'takeout',
    'delivery',
  ];

  const facilityLabels = {
    wifi: 'WiFi',
    parking: '주차장',
    restroom: '화장실',
    charging: '충전시설',
    outdoor_seating: '야외좌석',
    takeout: '테이크아웃',
    delivery: '배달',
  };

  const tagOptions = [
    'runner_friendly',
    'quiet',
    'spacious',
    'view',
    'specialty_coffee',
    'dessert',
    'breakfast',
  ];

  const tagLabels = {
    runner_friendly: '러너 친화적',
    quiet: '조용한',
    spacious: '넓은',
    view: '뷰가 좋은',
    specialty_coffee: '스페셜티 커피',
    dessert: '디저트',
    breakfast: '조식',
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

  const handleTagChange = tag => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({
        ...formData,
        tags: currentTags.filter(t => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...currentTags, tag],
      });
    }
  };

  const handleOperatingHoursChange = (day, timeType, value) => {
    const hours = formData.operating_hours || {};
    if (!hours[day]) {
      hours[day] = { open: '', close: '', closed: false };
    }
    hours[day][timeType] = value;
    setFormData({ ...formData, operating_hours: hours });
  };

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const dayLabels = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {cafe ? '카페 정보 수정' : '새 카페 추가'}
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
                카페명 *
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
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="02-1234-5678"
              />
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

          {/* 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대표 이미지 URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={e =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/cafe-image.jpg"
            />
          </div>

          {/* 러너 친화적 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.runner_friendly}
                onChange={e =>
                  setFormData({
                    ...formData,
                    runner_friendly: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                러너 친화적 카페
              </span>
            </label>
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

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tagOptions.map(tag => (
                <label key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.tags?.includes(tag) || false}
                    onChange={() => handleTagChange(tag)}
                    className="mr-2"
                  />
                  <span className="text-sm">{tagLabels[tag]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 운영시간 (간단화) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              운영시간 (예: 월-금 09:00-22:00, 주말 10:00-23:00)
            </label>
            <textarea
              value={
                typeof formData.operating_hours === 'string'
                  ? formData.operating_hours
                  : JSON.stringify(formData.operating_hours || {}, null, 2)
              }
              onChange={e =>
                setFormData({ ...formData, operating_hours: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="운영시간 정보를 입력하세요..."
            />
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
              placeholder="카페에 대한 설명을 입력하세요..."
            />
          </div>
        </form>

        {/* 버튼 */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          {cafe && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '삭제 중...' : '카페 삭제'}
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

export default CafeModal;
