import React, { useState, useRef } from 'react';
import {
  uploadImage,
  compressImage,
  deleteImage,
  extractImagePath,
} from '../../services/imageUploadService';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 프로필 이미지 업로드 컴포넌트
 * 카카오톡/인스타그램 스타일의 프로필 이미지 변경 기능
 */
const ProfileImageUpload = ({
  currentImageUrl,
  onImageChange,
  userId,
  size = 'md',
}) => {
  const { showToast } = useAppStore();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  // 파일 선택 핸들러
  const handleFileSelect = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          message: '이미지 파일만 업로드할 수 있습니다.',
        });
        return;
      }

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'error',
          message: '파일 크기는 5MB 이하여야 합니다.',
        });
        return;
      }

      // 이미지 압축
      const compressedFile = await compressImage(file, 400, 400, 0.8);

      // 미리보기 생성
      const preview = URL.createObjectURL(compressedFile);
      setPreviewUrl(preview);

      // 기존 이미지 삭제 (있는 경우)
      if (currentImageUrl) {
        const oldImagePath = extractImagePath(currentImageUrl);
        if (oldImagePath) {
          await deleteImage(oldImagePath);
        }
      }

      // 새 이미지 업로드
      const uploadResult = await uploadImage(compressedFile, userId, 'profile');

      if (uploadResult.success) {
        onImageChange(uploadResult.data.imageUrl);
        showToast({
          type: 'success',
          message: '프로필 이미지가 변경되었습니다.',
        });
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      setPreviewUrl(currentImageUrl); // 원본으로 복원
      showToast({
        type: 'error',
        message: '이미지 업로드에 실패했습니다.',
      });
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);

      if (currentImageUrl) {
        const imagePath = extractImagePath(currentImageUrl);
        if (imagePath) {
          await deleteImage(imagePath);
        }
      }

      setPreviewUrl(null);
      onImageChange(null);

      showToast({
        type: 'success',
        message: '프로필 이미지가 제거되었습니다.',
      });
    } catch (error) {
      console.error('프로필 이미지 제거 실패:', error);
      showToast({
        type: 'error',
        message: '이미지 제거에 실패했습니다.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 프로필 이미지 */}
      <div className="relative group">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center relative`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="프로필"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-2xl">👤</div>
          )}

          {/* 로딩 오버레이 */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* 편집 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-primary-500 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors group-hover:scale-110 transform duration-200"
        >
          <svg
            className={`${iconSizeClasses[size]} text-primary-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 이미지 제거 버튼 (이미지가 있을 때만) */}
      {previewUrl && (
        <button
          onClick={handleRemoveImage}
          disabled={isUploading}
          className="mt-3 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          이미지 제거
        </button>
      )}

      {/* 안내 텍스트 */}
      <p className="mt-2 text-xs text-gray-500 text-center">
        JPG, PNG 파일 (최대 5MB)
      </p>
    </div>
  );
};

export default ProfileImageUpload;
