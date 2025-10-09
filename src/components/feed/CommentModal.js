import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  getPostComments,
  createPostComment,
  deletePostComment,
} from '../../services/feedService';

const CommentModal = ({ isOpen, onClose, post }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sheetHeight, setSheetHeight] = useState('60%'); // '30%', '60%', '90%'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const { user, isAuthenticated, getUserId } = useAuthStore();

  // 댓글 목록 로드
  const loadComments = async () => {
    if (!post?.id) return;

    setLoading(true);
    try {
      const result = await getPostComments(post.id);
      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 댓글 로드
  useEffect(() => {
    if (isOpen && post?.id) {
      loadComments();
    }
  }, [isOpen, post?.id]);

  // 모달 애니메이션 관리
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // 애니메이션 시작을 위해 약간의 지연
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // 댓글 작성
  const handleSubmitComment = async e => {
    e.preventDefault();

    if (!isAuthenticated()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const userId = getUserId();
      const result = await createPostComment({
        user_id: userId,
        post_id: post.id,
        content: newComment.trim(),
      });

      if (result.success) {
        setNewComment('');
        // 댓글 목록에 새 댓글 추가
        setComments(prev => [...prev, result.data]);

        // 부모 컴포넌트에 댓글 수 업데이트 알림 (정확한 댓글 수 전달)
        if (post.onCommentAdded) {
          post.onCommentAdded(post.id, result.data.commentsCount);
        }
      } else {
        alert('댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async commentId => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const userId = getUserId();
      const result = await deletePostComment(commentId, userId);

      if (result.success) {
        // 댓글 목록에서 삭제
        setComments(prev => prev.filter(comment => comment.id !== commentId));

        // 부모 컴포넌트에 댓글 수 업데이트 알림 (정확한 댓글 수 전달)
        if (post.onCommentDeleted) {
          post.onCommentDeleted(result.data.postId, result.data.commentsCount);
        }
      } else {
        alert('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 바텀시트 높이 스타일 계산
  const getSheetStyles = () => {
    switch (sheetHeight) {
      case '30%':
        return {
          height: '30vh',
          transform: 'translateY(0)',
        };
      case '60%':
        return {
          height: '60vh',
          transform: 'translateY(0)',
        };
      case '90%':
        return {
          height: '90vh',
          transform: 'translateY(0)',
        };
      default:
        return {
          height: '60vh',
          transform: 'translateY(0)',
        };
    }
  };

  // 드래그 시작
  const handleDragStart = e => {
    setIsDragging(true);
    setDragStartY(e.type === 'touchstart' ? e.touches[0].clientY : e.clientY);
  };

  // 드래그 중
  const handleDragMove = e => {
    if (!isDragging) return;

    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && sheetHeight !== '30%') {
        // 아래로 드래그 - 축소
        if (sheetHeight === '90%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('30%');
        }
        setDragStartY(currentY);
      } else if (deltaY < 0 && sheetHeight !== '90%') {
        // 위로 드래그 - 확대
        if (sheetHeight === '30%') {
          setSheetHeight('60%');
        } else if (sheetHeight === '60%') {
          setSheetHeight('90%');
        }
        setDragStartY(currentY);
      }
    }
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너
  useEffect(() => {
    const handleMouseMove = e => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = e => handleDragMove(e);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartY]);

  // 상대 시간 포맷팅
  const formatRelativeTime = dateString => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}일 전`;

    return commentDate.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[60]">
      <div
        ref={sheetRef}
        className={`bg-white w-full max-w-[390px] rounded-t-3xl flex flex-col shadow-[0_-4px_32px_rgba(0,0,0,0.12)] ${
          isDragging
            ? 'transition-none'
            : 'transition-all duration-300 ease-out'
        }`}
        style={{
          ...getSheetStyles(),
          borderTop: '1px solid rgba(0,0,0,0.05)',
          transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
        }}
      >
        {/* 드래그 핸들 */}
        <div
          ref={handleRef}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors duration-200"></div>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="text-lg font-semibold text-gray-900">댓글</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 포스트 정보 */}
        <div className="px-4 pb-3 border-b border-gray-100/70 bg-gray-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {post.profiles?.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt="프로필"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white font-bold text-xs">
                  {(
                    post.profiles?.display_name ||
                    post.profiles?.username ||
                    'U'
                  ).charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {post.profiles?.display_name ||
                  post.profiles?.username ||
                  '익명의 러너'}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                {post.caption}
              </p>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
              <p className="text-gray-500 text-sm">댓글을 불러오는 중...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-sm">
                첫 번째 댓글을 남겨보세요!
              </p>
            </div>
          ) : (
            <div
              className="h-full overflow-y-auto px-4"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB #F3F4F6',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 4px;
                }
                div::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 2px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #c4b5fd;
                  border-radius: 2px;
                  transition: background 0.2s ease;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #a78bfa;
                }
                div::-webkit-scrollbar-thumb:active {
                  background: #8b5cf6;
                }
              `}</style>
              <div className="space-y-4 py-2">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt="프로필"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-white font-bold text-xs">
                          {(
                            comment.profiles?.display_name ||
                            comment.profiles?.username ||
                            'U'
                          ).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100/80 rounded-2xl px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.profiles?.display_name ||
                            comment.profiles?.username ||
                            '익명의 러너'}
                        </p>
                        <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(comment.created_at)}
                        </p>
                        {isAuthenticated() &&
                          comment.user_id === getUserId() && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* 하단 패딩 */}
                <div className="h-4"></div>
              </div>
            </div>
          )}
        </div>

        {/* 댓글 작성 */}
        {isAuthenticated() ? (
          <div className="px-4 py-3 border-t border-gray-100/70 bg-white">
            <form
              onSubmit={handleSubmitComment}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="프로필"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-bold text-xs">
                    {(user?.display_name || user?.username || 'U').charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2.5 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>전송중</span>
                  </div>
                ) : (
                  '전송'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-gray-100/70 bg-white text-center">
            <p className="text-sm text-gray-500">
              댓글을 작성하려면 로그인하세요.
            </p>
          </div>
        )}

        {/* 하단 여백 (safe area) */}
        <div className="h-1 bg-white"></div>
      </div>
    </div>
  );
};

export default CommentModal;
