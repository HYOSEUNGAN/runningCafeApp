import React from 'react';
import HomeHeader from '../components/layout/HomeHeader';
import BottomNavigation from '../components/layout/BottomNavigation';
import ChallengeSection from '../components/challenge/ChallengeSection';
import {
  BannerCarousel,
  RankingSection,
  NearbyCafesSection,
  VoteSection,
} from '../components/home';

/**
 * 메인 홈페이지 컴포넌트
 * Figma 디자인에 맞춘 새로운 홈페이지 레이아웃
 */
const HomePage = () => {
  return (
    <div className="app-container bg-gray-50">
      {/* 상단 헤더 */}
      {/* <HomeHeader /> */}

      {/* 메인 컨텐츠 */}
      <main className="pb-20">
        {/* 배너 섹션 - 이번주 오픈 카페 */}
        <BannerCarousel />

        {/* 월별 챌린지 섹션 */}
        <div className="px-4 py-6">
          <ChallengeSection />
        </div>

        {/* 랭킹 섹션 - 이번주 러너스픽 */}
        <RankingSection />

        {/* 주변 카페 섹션 - 지금 위치에서 1km 이내 */}
        <NearbyCafesSection />

        {/* 투표 섹션 - 볼까?말까? 의견을 모아모아 */}
        <VoteSection />
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default HomePage;
