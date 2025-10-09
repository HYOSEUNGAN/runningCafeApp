import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { updateUserProfile } from '../../services/userProfileService';
import BaseModal from '../common/BaseModal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ProfileImageUpload from './ProfileImageUpload';

/**
 * 프로필 수정 모달 컴포넌트
 * 사용자가 프로필 정보를 수정할 때 사용
 */
const ProfileEditModal = ({ isOpen, onClose, currentProfile }) => {
  const { getUserId, setUserProfile } = useAuthStore();
  const { showToast } = useAppStore();

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    username: '',
    avatar_url: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 프로필 데이터로 폼 초기화
  useEffect(() => {
    if (currentProfile && isOpen) {
      setFormData({
        display_name: currentProfile.display_name || '',
        bio: currentProfile.bio || '',
        username: currentProfile.username || '',
        avatar_url: currentProfile.avatar_url || '',
      });
    }
  }, [currentProfile, isOpen]);

  // 폼 데이터 업데이트
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 폼 초기화
  const resetForm = () => {
    if (currentProfile) {
      setFormData({
        display_name: currentProfile.display_name || '',
        bio: currentProfile.bio || '',
        username: currentProfile.username || '',
        avatar_url: currentProfile.avatar_url || '',
      });
    }
  };

  // 프로필 업데이트
  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.display_name.trim()) {
      showToast({
        type: 'error',
        message: '표시명을 입력해주세요.',
      });
      return;
    }

    if (formData.display_name.trim().length > 20) {
      showToast({
        type: 'error',
        message: '표시명은 20글자 이하로 입력해주세요.',
      });
      return;
    }

    if (formData.bio.length > 150) {
      showToast({
        type: 'error',
        message: '자기소개는 150글자 이하로 입력해주세요.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = getUserId();

      const updateData = {
        display_name: formData.display_name.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url,
      };

      const result = await updateUserProfile(userId, updateData);

      if (result.success) {
        // 스토어 업데이트
        setUserProfile(result.data);

        showToast({
          type: 'success',
          message: '프로필이 성공적으로 업데이트되었습니다!',
        });
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      showToast({
        type: 'error',
        message: '프로필 업데이트에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 이미지 변경 핸들러
  const handleImageChange = imageUrl => {
    setFormData(prev => ({
      ...prev,
      avatar_url: imageUrl || '',
    }));
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
      title="프로필 수정"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 프로필 이미지 업로드 */}
        <div className="flex justify-center">
          <ProfileImageUpload
            currentImageUrl={formData.avatar_url}
            onImageChange={handleImageChange}
            userId={getUserId()}
            size="xl"
          />
        </div>

        {/* 사용자명 (읽기 전용) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사용자명
          </label>
          <Input
            type="text"
            value={formData.username}
            disabled={true}
            className="w-full bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            사용자명은 변경할 수 없습니다
          </p>
        </div>

        {/* 표시명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            표시명 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="다른 사용자에게 보여질 이름"
            value={formData.display_name}
            onChange={e => handleInputChange('display_name', e.target.value)}
            disabled={isSubmitting}
            className="w-full"
            maxLength={20}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              다른 러너들에게 표시되는 이름입니다
            </p>
            <span className="text-xs text-gray-400">
              {formData.display_name.length}/20
            </span>
          </div>
        </div>

        {/* 자기소개 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            자기소개
          </label>
          <textarea
            placeholder="자신을 소개하는 간단한 메시지를 작성해보세요"
            value={formData.bio}
            onChange={e => handleInputChange('bio', e.target.value)}
            disabled={isSubmitting}
            rows="4"
            maxLength={150}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              러닝에 대한 열정이나 목표를 공유해보세요
            </p>
            <span className="text-xs text-gray-400">
              {formData.bio.length}/150
            </span>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-800 mb-1">
                프로필 수정 안내
              </h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• 표시명은 다른 러너들에게 보여지는 이름입니다</li>
                <li>• 부적절한 내용은 관리자에 의해 수정될 수 있습니다</li>
                <li>• 프로필 이미지 업로드 기능은 준비 중입니다</li>
              </ul>
            </div>
          </div>
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
                저장 중...
              </div>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ProfileEditModal;
