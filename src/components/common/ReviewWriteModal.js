import React, { useState } from 'react';
import {
  createPlaceReview,
  validateReviewData,
} from '../../services/placeReviewService';

/**
 * 리뷰 작성 컴포넌트
 * 장소에 대한 리뷰를 작성할 수 있는 폼
 */
const ReviewWriteModal = ({
  isOpen = false,
  onClose,
  placeType,
  placeId,
  placeName,
  onReviewCreated,
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    content: '',
    tags: [],
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  // 폼 데이터 초기화
  const resetForm = () => {
    setFormData({
      rating: 0,
      content: '',
      tags: [],
      images: [],
    });
    setErrors([]);
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 별점 설정
  const handleRatingClick = rating => {
    setFormData(prev => ({ ...prev, rating }));
  };

  // 태그 토글
  const handleTagToggle = tag => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // 리뷰 제출
  const handleSubmit = async e => {
    e.preventDefault();

    const reviewData = {
      placeType,
      placeId,
      ...formData,
    };

    // 유효성 검사
    const validation = validateReviewData(reviewData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const newReview = await createPlaceReview(reviewData);
      if (newReview) {
        // 성공 시 콜백 호출 및 모달 닫기
        if (onReviewCreated) {
          onReviewCreated(newReview);
        }
        handleClose();
      } else {
        setErrors(['리뷰 작성에 실패했습니다. 다시 시도해주세요.']);
      }
    } catch (error) {
      console.error('리뷰 작성 오류:', error);
      setErrors([error.message || '리뷰 작성 중 오류가 발생했습니다.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 추천 태그 목록
  const getRecommendedTags = () => {
    if (placeType === 'running_place') {
      return [
        '경치가 좋아요',
        '러닝하기 좋아요',
        '안전해요',
        '접근성이 좋아요',
        '시설이 깨끗해요',
        '주차하기 편해요',
        '초보자 추천',
        '고급자 추천',
        '야간 러닝 가능',
        '가족과 함께',
        '반려동물 동반 가능',
        '사진 찍기 좋아요',
      ];
    } else {
      return [
        '러너 친화적',
        '음료가 맛있어요',
        '분위기가 좋아요',
        '직원이 친절해요',
        '가격이 합리적',
        '시설이 깨끗해요',
        '주차하기 편해요',
        '와이파이 좋아요',
        '콘센트 많아요',
        '조용해요',
        '넓어요',
        '샤워실 있어요',
      ];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">리뷰 작성</h2>
            <p className="text-sm text-gray-500 mt-1">{placeName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 폼 컨텐츠 */}
        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 에러 메시지 */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium text-red-800">
                    오류가 발생했습니다
                  </span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 별점 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                평점 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`w-8 h-8 transition-colors ${
                      formData.rating >= star
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating > 0
                    ? `${formData.rating}점`
                    : '평점을 선택해주세요'}
                </span>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                리뷰 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={e =>
                  setFormData(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요. (최소 10자)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                maxLength={1000}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>최소 10자 이상 작성해주세요</span>
                <span>{formData.content.length}/1000</span>
              </div>
            </div>

            {/* 태그 선택 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                태그 (선택사항)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                해당하는 태그를 선택해주세요. (최대 5개)
              </p>
              <div className="flex flex-wrap gap-2">
                {getRecommendedTags().map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={
                      !formData.tags.includes(tag) && formData.tags.length >= 5
                    }
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {formData.tags.length > 0 && (
                <div className="text-xs text-gray-500">
                  선택된 태그: {formData.tags.length}/5
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              formData.rating === 0 ||
              formData.content.trim().length < 10
            }
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '작성 중...' : '리뷰 작성'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewWriteModal;
