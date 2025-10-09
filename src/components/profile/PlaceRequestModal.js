import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { createPlaceRequest } from '../../services/placeRequestService';
import BaseModal from '../common/BaseModal';
import Button from '../ui/Button';
import Input from '../ui/Input';

/**
 * 장소 등록 요청 모달 컴포넌트
 * 사용자가 새로운 러닝 코스나 카페 등록을 요청할 때 사용
 */
const PlaceRequestModal = ({ isOpen, onClose }) => {
  const { getUserId } = useAuthStore();
  const { showToast } = useAppStore();

  const [formData, setFormData] = useState({
    place_type: 'cafe', // 'cafe' | 'running_place'
    place_name: '',
    address: '',
    description: '',
    reason: '',
    contact_info: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 데이터 업데이트
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      place_type: 'cafe',
      place_name: '',
      address: '',
      description: '',
      reason: '',
      contact_info: '',
    });
  };

  // 요청 제출
  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.place_name.trim()) {
      showToast({
        type: 'error',
        message: '장소명을 입력해주세요.',
      });
      return;
    }

    if (!formData.reason.trim()) {
      showToast({
        type: 'error',
        message: '등록 요청 이유를 입력해주세요.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = getUserId();

      const requestData = {
        user_id: userId,
        place_type: formData.place_type,
        place_name: formData.place_name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        reason: formData.reason.trim(),
        contact_info: formData.contact_info.trim(),
      };

      const result = await createPlaceRequest(requestData);

      if (result.success) {
        showToast({
          type: 'success',
          message: '장소 등록 요청이 성공적으로 제출되었습니다!',
        });
        resetForm();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('장소 등록 요청 제출 실패:', error);
      showToast({
        type: 'error',
        message: '요청 제출에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="장소 등록 요청"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-1">
                장소 등록 요청 안내
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                새로운 러닝 코스나 카페를 추천해주세요! 검토 후 승인되면 다른
                러너들과 함께 공유할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 장소 유형 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            장소 유형 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('place_type', 'cafe')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.place_type === 'cafe'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">☕</div>
              <div className="font-medium">카페</div>
              <div className="text-xs text-gray-500 mt-1">
                러닝 후 휴식할 수 있는 카페
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('place_type', 'running_place')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.place_type === 'running_place'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🏃‍♀️</div>
              <div className="font-medium">러닝 코스</div>
              <div className="text-xs text-gray-500 mt-1">
                새로운 러닝 루트나 장소
              </div>
            </button>
          </div>
        </div>

        {/* 장소명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            장소명 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder={
              formData.place_type === 'cafe'
                ? '예: 스타벅스 한강공원점'
                : '예: 한강 러닝 코스'
            }
            value={formData.place_name}
            onChange={e => handleInputChange('place_name', e.target.value)}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 (선택사항)
          </label>
          <Input
            type="text"
            placeholder="예: 서울시 영등포구 여의동로 330"
            value={formData.address}
            onChange={e => handleInputChange('address', e.target.value)}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>

        {/* 장소 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            장소 설명 (선택사항)
          </label>
          <textarea
            placeholder={
              formData.place_type === 'cafe'
                ? '카페의 특징, 분위기, 메뉴 등을 설명해주세요'
                : '러닝 코스의 특징, 거리, 난이도 등을 설명해주세요'
            }
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            disabled={isSubmitting}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 등록 요청 이유 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            등록 요청 이유 <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="이 장소를 추천하는 이유를 자세히 설명해주세요"
            value={formData.reason}
            onChange={e => handleInputChange('reason', e.target.value)}
            disabled={isSubmitting}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            예: 러닝 후 휴식하기 좋고, 음료가 맛있어서 추천합니다
          </p>
        </div>

        {/* 연락처 정보 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연락처 정보 (선택사항)
          </label>
          <Input
            type="text"
            placeholder="검토 과정에서 연락할 수 있는 연락처"
            value={formData.contact_info}
            onChange={e => handleInputChange('contact_info', e.target.value)}
            disabled={isSubmitting}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            추가 정보가 필요한 경우에만 사용되며, 공개되지 않습니다
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                제출 중...
              </div>
            ) : (
              '요청 제출'
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default PlaceRequestModal;
