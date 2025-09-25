import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  Hash,
  Send,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { createFeedPost } from '../../services/feedService';
import {
  createImagePreview,
  revokeImagePreview,
  compressImage,
} from '../../services/imageUploadService';
import { createRunningRecordMapImage } from '../../services/mapImageService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 피드 포스트 작성 모달 컴포넌트
 * 이미지 업로드, 캡션 작성, 해시태그 추가 기능을 제공합니다.
 */
const CreatePostModal = ({ isOpen, onClose, runningRecord = null }) => {
  // 상태 관리
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 스토어
  const { user, getUserId } = useAuthStore();
  const { showToast } = useAppStore();

  // refs
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // 러닝 기록이 있는 경우 초기 캡션 설정 및 지도 이미지 생성
  useEffect(() => {
    if (runningRecord && isOpen) {
      const distance = (runningRecord.distance / 1000).toFixed(1);
      const duration = formatRunningTime(runningRecord.duration);
      const pace = calculatePace(
        runningRecord.distance,
        runningRecord.duration
      );

      const autoCaption = `오늘 ${distance}km 러닝 완주! 🏃‍♀️\n시간: ${duration}\n페이스: ${pace}\n\n#러닝 #운동 #건강 #러닝기록 #RunningCafe`;
      setCaption(autoCaption);
      setHashtags(['러닝', '운동', '건강', '러닝기록', 'RunningCafe']);

      if (runningRecord.location) {
        setLocation(runningRecord.location);
      }

      // 러닝 경로가 있으면 지도 이미지 자동 생성
      if (runningRecord.path && runningRecord.path.length > 0) {
        generateMapImage();
      }
    } else if (!runningRecord && isOpen) {
      // 수기 작성의 경우 빈 상태로 시작
      setCaption('');
      setHashtags([]);
      setLocation('');
    }
  }, [runningRecord, isOpen]);

  // 러닝 기록용 지도 이미지 생성
  const generateMapImage = async () => {
    try {
      showToast({
        type: 'info',
        message: '러닝 경로 지도를 생성하고 있습니다...',
      });

      const mapImageFile = await createRunningRecordMapImage({
        path: runningRecord.path,
        nearbyCafes: runningRecord.nearbyCafes || [],
        distance: runningRecord.distance,
        duration: runningRecord.duration,
      });

      // 생성된 이미지를 선택된 이미지 목록에 추가
      const previewUrl = createImagePreview(mapImageFile);
      if (previewUrl) {
        const newPreview = {
          id: Date.now(),
          url: previewUrl,
          file: mapImageFile,
          name: mapImageFile.name,
        };

        setSelectedImages(prev => [mapImageFile, ...prev]);
        setImagePreviews(prev => [newPreview, ...prev]);

        showToast({
          type: 'success',
          message: '러닝 경로 지도가 추가되었습니다! 🗺️',
        });
      }
    } catch (error) {
      console.error('지도 이미지 생성 실패:', error);
      showToast({
        type: 'warning',
        message: '지도 이미지 생성에 실패했습니다. 다른 이미지를 추가해주세요.',
      });
    }
  };

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // 이미지 미리보기 정리
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => revokeImagePreview(preview.url));
    };
  }, [imagePreviews]);

  // 폼 초기화
  const resetForm = () => {
    setCaption('');
    setHashtags([]);
    setHashtagInput('');
    setLocation('');
    setSelectedImages([]);

    // 이미지 미리보기 정리
    imagePreviews.forEach(preview => revokeImagePreview(preview.url));
    setImagePreviews([]);

    setIsSubmitting(false);
  };

  // 러닝 시간 포맷팅
  const formatRunningTime = milliseconds => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    }
    return `${minutes}분 ${seconds}초`;
  };

  // 페이스 계산
  const calculatePace = (distanceMeters, durationMs) => {
    const distanceKm = distanceMeters / 1000;
    const durationMin = durationMs / 1000 / 60;
    const paceMinPerKm = durationMin / distanceKm;

    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);

    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  // 이미지 선택 처리
  const handleImageSelect = async event => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // 최대 5개 이미지 제한
    if (selectedImages.length + files.length > 5) {
      showToast({
        type: 'warning',
        message: '최대 5개의 이미지만 업로드할 수 있습니다.',
      });
      return;
    }

    try {
      const newImages = [];
      const newPreviews = [];

      for (const file of files) {
        // 이미지 압축
        const compressedFile = await compressImage(file);
        newImages.push(compressedFile);

        // 미리보기 생성
        const previewUrl = createImagePreview(compressedFile);
        if (previewUrl) {
          newPreviews.push({
            id: Date.now() + Math.random(),
            url: previewUrl,
            file: compressedFile,
            name: file.name,
          });
        }
      }

      setSelectedImages(prev => [...prev, ...newImages]);
      setImagePreviews(prev => [...prev, ...newPreviews]);

      showToast({
        type: 'success',
        message: `${files.length}개의 이미지가 추가되었습니다.`,
      });
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      showToast({
        type: 'error',
        message: '이미지 처리에 실패했습니다.',
      });
    }

    // 파일 입력 초기화
    event.target.value = '';
  };

  // 이미지 제거
  const removeImage = previewId => {
    const previewIndex = imagePreviews.findIndex(p => p.id === previewId);
    if (previewIndex === -1) return;

    const preview = imagePreviews[previewIndex];

    // 미리보기 URL 해제
    revokeImagePreview(preview.url);

    // 상태에서 제거
    setImagePreviews(prev => prev.filter(p => p.id !== previewId));
    setSelectedImages(prev =>
      prev.filter((_, index) => index !== previewIndex)
    );
  };

  // 해시태그 추가
  const addHashtag = () => {
    const tag = hashtagInput.trim().replace('#', '');

    if (!tag) return;

    if (hashtags.includes(tag)) {
      showToast({
        type: 'warning',
        message: '이미 추가된 해시태그입니다.',
      });
      return;
    }

    if (hashtags.length >= 10) {
      showToast({
        type: 'warning',
        message: '최대 10개의 해시태그만 추가할 수 있습니다.',
      });
      return;
    }

    setHashtags(prev => [...prev, tag]);
    setHashtagInput('');
  };

  // 해시태그 제거
  const removeHashtag = tagToRemove => {
    setHashtags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // 해시태그 입력 키 처리
  const handleHashtagKeyPress = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addHashtag();
    }
  };

  // 포스트 제출
  const handleSubmit = async () => {
    if (!caption.trim() && selectedImages.length === 0) {
      showToast({
        type: 'warning',
        message: '내용을 입력하거나 이미지를 추가해주세요.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        user_id: getUserId(),
        running_record_id: runningRecord?.id || null,
        caption: caption.trim(),
        images: selectedImages,
        hashtags,
        location: location.trim(),
        is_achievement: runningRecord ? runningRecord.distance >= 5000 : false,
      };

      console.log('포스트 생성 시작:', postData);

      const result = await createFeedPost(postData);

      if (result.success) {
        showToast({
          type: 'success',
          message: '포스트가 성공적으로 작성되었습니다! 🎉',
        });

        onClose();

        // 페이지 새로고침 (피드 목록 갱신)
        if (window.location.pathname === '/feed') {
          window.location.reload();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('포스트 작성 실패:', error);
      showToast({
        type: 'error',
        message: `포스트 작성에 실패했습니다: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white w-full max-w-md mx-4 rounded-t-lg sm:rounded-lg shadow-xl max-h-[90vh] flex flex-col mb-16 sm:mb-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {runningRecord ? '러닝 기록 공유' : '새 포스트 작성'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 사용자 정보 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {(
                  user?.user_metadata?.display_name ||
                  user?.email ||
                  'U'
                ).charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.user_metadata?.display_name ||
                  user?.email ||
                  '익명의 러너'}
              </h3>
              {location && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin size={12} className="mr-1" />
                  {location}
                </div>
              )}
            </div>
          </div>

          {/* 러닝 기록 요약 (있는 경우) */}
          {runningRecord && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  🏃‍♀️ 러닝 기록
                </h4>
                <div className="flex items-center space-x-2">
                  {runningRecord.path && runningRecord.path.length > 0 && (
                    <button
                      onClick={generateMapImage}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      🗺️ 지도 추가
                    </button>
                  )}
                  <span className="text-xs text-gray-500">자동 연결됨</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <div className="font-bold text-blue-600">
                    {(runningRecord.distance / 1000).toFixed(1)}km
                  </div>
                  <div className="text-gray-500">거리</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">
                    {formatRunningTime(runningRecord.duration)}
                  </div>
                  <div className="text-gray-500">시간</div>
                </div>
                <div>
                  <div className="font-bold text-purple-600">
                    {calculatePace(
                      runningRecord.distance,
                      runningRecord.duration
                    )}
                  </div>
                  <div className="text-gray-500">페이스</div>
                </div>
              </div>
            </div>
          )}

          {/* 수기 작성 안내 (러닝 기록이 없는 경우) */}
          {!runningRecord && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">✍️</span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">
                    자유 포스트
                  </h4>
                  <p className="text-xs text-gray-500">
                    사진과 글로 일상을 공유해보세요
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 캡션 입력 */}
          <div>
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={
                runningRecord
                  ? '오늘의 러닝은 어땠나요? 경험을 공유해보세요...'
                  : '무엇을 공유하고 싶나요? 일상의 순간들을 들려주세요...'
              }
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              disabled={isSubmitting}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {caption.length}/500
            </div>
          </div>

          {/* 이미지 미리보기 */}
          {imagePreviews.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                첨부된 이미지 ({imagePreviews.length}/5)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map(preview => (
                  <div key={preview.id} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(preview.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이미지 추가 버튼 */}
          {imagePreviews.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-500 hover:text-blue-500"
              disabled={isSubmitting}
            >
              <ImageIcon size={20} />
              <span>이미지 추가 (최대 5개)</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={isSubmitting}
          />

          {/* 위치 입력 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin size={16} className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">위치</label>
            </div>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="위치를 입력하세요 (선택사항)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* 해시태그 입력 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Hash size={16} className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">
                해시태그
              </label>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyPress={handleHashtagKeyPress}
                placeholder="해시태그 입력 후 엔터"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <button
                onClick={addHashtag}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={!hashtagInput.trim() || isSubmitting}
              >
                추가
              </button>
            </div>

            {/* 해시태그 목록 */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="w-4 h-4 flex items-center justify-center hover:bg-blue-200 rounded-full transition-colors"
                      disabled={isSubmitting}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              disabled={
                isSubmitting || (!caption.trim() && selectedImages.length === 0)
              }
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={16} />
                  <span>게시하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
