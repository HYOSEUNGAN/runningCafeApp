import React, { useState, useEffect } from 'react';
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

        // 부모 컴포넌트에 댓글 수 업데이트 알림
        if (post.onCommentAdded) {
          post.onCommentAdded(post.id);
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

        // 부모 컴포넌트에 댓글 수 업데이트 알림
        if (post.onCommentDeleted) {
          post.onCommentDeleted(post.id);
        }
      } else {
        alert('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[60]">
      <div className="bg-white w-full max-w-md h-2/3 rounded-t-lg flex flex-col mb-16">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">댓글</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 포스트 정보 */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
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
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {post.profiles?.display_name ||
                  post.profiles?.username ||
                  '익명의 러너'}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2">
                {post.caption}
              </p>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                첫 번째 댓글을 남겨보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.profiles?.display_name ||
                          comment.profiles?.username ||
                          '익명의 러너'}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                      {isAuthenticated() && comment.user_id === getUserId() && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 댓글 작성 */}
        {isAuthenticated() ? (
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '전송 중...' : '전송'}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              댓글을 작성하려면 로그인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModal;
