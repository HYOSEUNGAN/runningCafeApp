import React, { useState } from 'react';
import { X, Star, Camera, Tag } from 'lucide-react';
import { createReview, validateReviewData } from '../../services/reviewService';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 리뷰 작성 모달 컴포넌트
 */
const ReviewModal = ({ 
  isOpen, 
  onClose, 
  place, 
  placeType = 'running_place',
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAppStore();

  // 러닝 플레이스용 태그
  const runningPlaceTags = [
    '초보자 추천', '고급자 추천', '경치 좋음', '접근성 좋음', 
    '주차 편리', '화장실 있음', '샤워실 있음', '안전함', 
    '조용함', '사람 많음', '야간 러닝 가능', '가족 단위'
  ];

  // 카페용 태그
  const cafeTags = [
    '러너 친화적', '샤워실 있음', '주차 가능', '24시간', 
    '조용함', '와이파이 좋음', '콘센트 많음', '뷰 좋음',
    '브런치 맛있음', '커피 맛있음', '친절함', '깨끗함'
  ];

  const availableTags = placeType === 'running_place' ? runningPlaceTags : cafeTags;

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!place) {
      showToast('장소 정보가 없습니다.', 'error');
      return;
    }

    const reviewData = {
      placeType,
      placeId: place.id,
      rating,
      content: content.trim(),
      tags: selectedTags,
      images: [] // 이미지 업로드 기능은 추후 구현
    };

    // 유효성 검사
    const validation = validateReviewData(reviewData);
    if (!validation.isValid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await createReview(reviewData);
      showToast('리뷰가 성공적으로 작성되었습니다!', 'success');
      
      // 부모 컴포넌트에 리뷰 작성 완료 알림
      if (onReviewSubmitted) {
        onReviewSubmitted(newReview);
      }
      
      // 폼 초기화
      setRating(0);
      setContent('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      showToast(error.message || '리뷰 작성에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setContent('');
      setSelectedTags([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">리뷰 작성</h2>
            <p className="text-sm text-gray-500 mt-1">{place?.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 평점 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                평점을 선택해주세요
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && '별로예요'}
                  {rating === 2 && '그저 그래요'}
                  {rating === 3 && '보통이에요'}
                  {rating === 4 && '좋아요'}
                  {rating === 5 && '최고예요!'}
                </p>
              )}
            </div>

            {/* 리뷰 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                리뷰 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`${place?.name}에 대한 솔직한 후기를 남겨주세요. (최소 10자)`}
                className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">최소 10자 이상 작성해주세요</p>
                <p className="text-xs text-gray-500">{content.length}/500</p>
              </div>
            </div>

            {/* 태그 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                태그 선택 (선택사항)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {selectedTags.length}개 태그 선택됨
                </p>
              )}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || content.trim().length < 10}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    작성 중...
                  </div>
                ) : (
                  '리뷰 작성'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
