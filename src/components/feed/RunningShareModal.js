import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import RunningShareCard from './RunningShareCard';
import { createFeedPost } from '../../services/feedService';
import { useAuthStore } from '../../stores/useAuthStore';
import Toast from '../common/Toast';

/**
 * 러닝 기록을 이미지와 함께 피드에 공유하는 모달
 * 사진 선택, 스타일 선택, 캡션 작성 기능 포함
 */
const RunningShareModal = ({ isOpen, onClose, runningRecord }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState(['러닝', '운동', '건강']);
  const [newHashtag, setNewHashtag] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const fileInputRef = useRef(null);
  const { getUserId } = useAuthStore();

  // 모달이 열릴 때 기본 캡션 설정
  React.useEffect(() => {
    if (isOpen && runningRecord) {
      const defaultCaption = `오늘 ${runningRecord.distance?.toFixed(1) || '0.0'}km 러닝 완주! 💪\n시간: ${formatDuration(runningRecord.duration || 0)}\n페이스: ${formatPace(runningRecord.pace || 0)}`;
      setCaption(defaultCaption);
    }
  }, [isOpen, runningRecord]);

  // 시간 포맷팅
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 페이스 포맷팅
  const formatPace = pace => {
    if (!pace || pace === 0) return '--\'--"';
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  // 이미지 선택 처리
  const handleImageSelect = event => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB 제한
        showToast('이미지 크기는 10MB 이하여야 합니다.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 해시태그 추가
  const handleAddHashtag = () => {
    const trimmed = newHashtag.trim().replace('#', '');
    if (trimmed && !hashtags.includes(trimmed)) {
      setHashtags([...hashtags, trimmed]);
      setNewHashtag('');
    }
  };

  // 해시태그 제거
  const handleRemoveHashtag = tagToRemove => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  // 생성된 이미지 처리
  const handleImageGenerated = imageDataUrl => {
    setGeneratedImage(imageDataUrl);
  };

  // 피드에 공유
  const handleShare = async () => {
    if (!runningRecord) {
      showToast('러닝 기록이 없습니다.', 'error');
      return;
    }

    if (!generatedImage) {
      showToast('공유할 이미지를 먼저 생성해주세요.', 'error');
      return;
    }

    setIsSharing(true);

    try {
      const userId = getUserId();

      // base64 이미지를 Blob으로 변환
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'running-share.jpg', {
        type: 'image/jpeg',
      });

      // 피드 포스트 생성
      const postData = {
        user_id: userId,
        running_record_id: runningRecord.id,
        caption: caption.trim(),
        images: [file], // 생성된 이미지 파일
        hashtags: hashtags.filter(tag => tag.trim()),
        location: runningRecord.location || '',
        is_achievement: runningRecord.distance >= 10, // 10km 이상이면 달성 기록으로 표시
      };

      const result = await createFeedPost(postData);

      if (result.success) {
        showToast('러닝 기록이 성공적으로 공유되었습니다! 🎉', 'success');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(result.error || '공유 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      showToast(error.message || '공유 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  // 토스트 메시지 표시
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedImage(null);
    setSelectedStyle('default');
    setCaption('');
    setHashtags(['러닝', '운동', '건강']);
    setNewHashtag('');
    setGeneratedImage(null);
    onClose();
  };

  if (!runningRecord) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            러닝 기록 공유하기 🏃‍♂️
          </h2>

          <div className="space-y-6">
            {/* 1단계: 배경 이미지 선택 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                1. 배경 이미지 선택
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {selectedImage ? (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="선택된 배경"
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-500 mb-4">
                      러닝 사진을 선택하거나 기본 배경을 사용하세요
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors mr-2"
                    >
                      사진 선택
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage(
                          'data:image/svg+xml;base64,' +
                            btoa(`
                        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                            </linearGradient>
                          </defs>
                          <rect width="400" height="400" fill="url(#grad1)"/>
                          <circle cx="200" cy="200" r="80" fill="rgba(255,255,255,0.1)"/>
                          <circle cx="200" cy="200" r="40" fill="rgba(255,255,255,0.2)"/>
                          <text x="200" y="210" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">🏃‍♂️</text>
                        </svg>
                      `)
                        )
                      }
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      기본 배경 사용
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* 2단계: 스타일 선택 */}
            {selectedImage && (
              <div>
                <h3 className="text-lg font-semibold mb-3">2. 스타일 선택</h3>
                <div className="flex space-x-3">
                  {[
                    {
                      key: 'minimal',
                      label: '미니멀',
                      desc: '간단하고 깔끔한 스타일',
                    },
                    {
                      key: 'default',
                      label: '기본',
                      desc: '균형잡힌 정보 표시',
                    },
                    {
                      key: 'detailed',
                      label: '상세',
                      desc: '모든 정보를 자세히',
                    },
                  ].map(style => (
                    <button
                      key={style.key}
                      onClick={() => setSelectedStyle(style.key)}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                        selectedStyle === style.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-sm text-gray-500">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3단계: 미리보기 */}
            {selectedImage && (
              <div>
                <h3 className="text-lg font-semibold mb-3">3. 미리보기</h3>
                <RunningShareCard
                  runningData={runningRecord}
                  backgroundImage={selectedImage}
                  style={selectedStyle}
                  onImageGenerated={handleImageGenerated}
                />
              </div>
            )}

            {/* 4단계: 캡션 작성 */}
            {generatedImage && (
              <div>
                <h3 className="text-lg font-semibold mb-3">4. 캡션 작성</h3>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="러닝에 대한 소감을 남겨보세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {caption.length}/500
                </div>
              </div>
            )}

            {/* 5단계: 해시태그 */}
            {generatedImage && (
              <div>
                <h3 className="text-lg font-semibold mb-3">5. 해시태그</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveHashtag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newHashtag}
                    onChange={e => setNewHashtag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddHashtag()}
                    placeholder="새 해시태그 추가"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={20}
                  />
                  <button
                    onClick={handleAddHashtag}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex space-x-3 mt-8">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSharing}
            >
              취소
            </button>
            <button
              onClick={handleShare}
              disabled={!generatedImage || isSharing}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  공유 중...
                </>
              ) : (
                '피드에 공유하기 🚀'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 토스트 메시지 */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </>
  );
};

export default RunningShareModal;
