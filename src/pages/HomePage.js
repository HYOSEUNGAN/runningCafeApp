import React from 'react';
// import HomeHeader from '../components/layout/HomeHeader'; // 기존 헤더 주석 처리
import MobileHeader from '../components/layout/MobileHeader'; // 새로운 모바일 헤더
import BottomNavigation from '../components/layout/BottomNavigation';
import ChallengeSection from '../components/challenge/ChallengeSection';
import {
  BannerCarousel,
  RecentRunnersSection,
  RankingSection,
  NearbyRunningPlacesSection,
  VoteSection,
} from '../components/home';

/**
 * 메인 홈페이지 컴포넌트
 * 새로운 모바일 앱 스타일 디자인 적용
 */
const HomePage = () => {
  return (
    <div className="app-container bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      {/* 새로운 모바일 스타일 헤더 */}
      {/* <MobileHeader /> */}

      {/* 메인 컨텐츠 */}
      <main className="pb-20">
        {/* 배너 섹션 - 이번주 오픈 카페 */}
        <BannerCarousel />

        {/* 최근 운동한 사람들 TOP 3 섹션 */}
        <RecentRunnersSection />

        {/* 월별 챌린지 섹션 */}
        {/* <div className="px-4 py-6">
          <ChallengeSection />
        </div> */}

        {/* 랭킹 섹션 - 이번주 러너스픽 */}
        <RankingSection />

        {/* 주변 러닝코스 섹션 - 지금 위치에서 1km 이내 */}
        <NearbyRunningPlacesSection />

        {/* 투표 섹션 - 볼까?말까? 의견을 모아모아 */}
        <VoteSection />
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
};

export default HomePage;
