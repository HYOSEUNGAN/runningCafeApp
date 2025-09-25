import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import {
  getCurrentMonthlyChallenges,
  getUserChallengeParticipations,
  joinChallenge,
  leaveChallengeParticipation,
} from '../../services/challengeService';
import ChallengeCard from './ChallengeCard';

/**
 * 챌린지 섹션 컴포넌트 - 현재 월의 활성 챌린지들을 표시
 */
const ChallengeSection = () => {
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, getUserId } = useAuthStore();
  const { showToast } = useAppStore();

  // 챌린지 데이터 로드
  const loadChallenges = async () => {
    try {
      setLoading(true);

      // 현재 월의 활성 챌린지 조회
      const challengesResult = await getCurrentMonthlyChallenges();
      if (challengesResult.success) {
        setChallenges(challengesResult.data);
      }

      // 로그인한 경우 참여 현황 조회
      if (isAuthenticated()) {
        const userId = getUserId();
        const participationsResult =
          await getUserChallengeParticipations(userId);
        if (participationsResult.success) {
          setParticipations(participationsResult.data);
        }
      }
    } catch (error) {
      console.error('챌린지 로드 실패:', error);
      showToast({
        type: 'error',
        message: '챌린지 데이터를 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [isAuthenticated()]);

  // 챌린지 참여
  const handleJoinChallenge = async challengeId => {
    if (!isAuthenticated()) {
      showToast({
        type: 'warning',
        message: '로그인이 필요합니다.',
      });
      return;
    }

    try {
      const userId = getUserId();
      const result = await joinChallenge(userId, challengeId);

      if (result.success) {
        showToast({
          type: 'success',
          message: '챌린지에 참여했습니다! 🎯',
        });
        // 참여 현황 새로고침
        loadChallenges();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('챌린지 참여 실패:', error);
      showToast({
        type: 'error',
        message: '챌린지 참여에 실패했습니다.',
      });
    }
  };

  // 챌린지 참여 취소
  const handleLeaveChallenge = async challengeId => {
    try {
      const userId = getUserId();
      const result = await leaveChallengeParticipation(userId, challengeId);

      if (result.success) {
        showToast({
          type: 'success',
          message: '챌린지 참여를 취소했습니다.',
        });
        // 참여 현황 새로고침
        loadChallenges();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('챌린지 참여 취소 실패:', error);
      showToast({
        type: 'error',
        message: '참여 취소에 실패했습니다.',
      });
    }
  };

  // 참여 데이터 찾기
  const getParticipation = challengeId => {
    return participations.find(p => p.challenge_id === challengeId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-gray-400">🎯</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          이번 달 챌린지가 없습니다
        </h3>
        <p className="text-gray-500 text-sm">
          새로운 챌린지가 곧 업데이트될 예정입니다!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {new Date().getMonth() + 1}월 챌린지
        </h2>
        <button
          onClick={loadChallenges}
          className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
        >
          새로고침
        </button>
      </div>

      {challenges.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          participation={getParticipation(challenge.id)}
          onJoin={handleJoinChallenge}
          onLeave={handleLeaveChallenge}
        />
      ))}
    </div>
  );
};

export default ChallengeSection;
