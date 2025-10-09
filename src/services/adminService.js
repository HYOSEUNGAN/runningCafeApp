import { supabase } from './supabase';

class AdminService {
  // 관리자 권한 확인
  isAdmin(user) {
    // 임시로 특정 이메일을 관리자로 설정 (실제 구현시에는 DB에서 관리)
    const adminEmails = [
      'admin@runningcafe.com',
      'test@admin.com',
      'bdg4611@naver.com',
      // 개발용 - 모든 사용자를 임시 관리자로 설정 (개발 환경에서만)
      ...(process.env.NODE_ENV === 'development' ? ['test@test.com'] : []),
    ];

    return user && adminEmails.includes(user.email);
  }

  // 대시보드 데이터 조회
  async getDashboardData() {
    try {
      // 병렬로 모든 통계 데이터 조회
      const [
        usersResult,
        coursesResult,
        cafesResult,
        recordsResult,
        activitiesResult,
      ] = await Promise.all([
        this.getUserStats(),
        this.getCourseStats(),
        this.getCafeStats(),
        this.getRecordStats(),
        this.getRecentActivities(),
      ]);

      // 차트 데이터 생성
      const chartData = await this.getChartData();

      return {
        stats: {
          totalUsers: usersResult.total,
          activeUsers: usersResult.active,
          newUsersThisMonth: usersResult.newThisMonth,
          totalCourses: coursesResult.total,
          totalCafes: cafesResult.total,
          totalRecords: recordsResult.total,
        },
        recentActivities: activitiesResult,
        chartData,
      };
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 통계
  async getUserStats() {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newThisMonth = users.filter(
        user => new Date(user.created_at) >= thisMonth
      ).length;

      return {
        total: users.length,
        active: Math.floor(users.length * 0.7), // 임시 계산
        newThisMonth,
      };
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return { total: 0, active: 0, newThisMonth: 0 };
    }
  }

  // 코스 통계
  async getCourseStats() {
    try {
      const { data: courses, error } = await supabase
        .from('running_places')
        .select('id');

      if (error) throw error;

      return {
        total: courses.length,
      };
    } catch (error) {
      console.error('코스 통계 조회 실패:', error);
      return { total: 0 };
    }
  }

  // 카페 통계
  async getCafeStats() {
    try {
      const { data: cafes, error } = await supabase.from('cafes').select('id');

      if (error) throw error;

      return {
        total: cafes.length,
      };
    } catch (error) {
      console.error('카페 통계 조회 실패:', error);
      return { total: 0 };
    }
  }

  // 기록 통계
  async getRecordStats() {
    try {
      const { data: records, error } = await supabase
        .from('running_records')
        .select('id');

      if (error) throw error;

      return {
        total: records.length,
      };
    } catch (error) {
      console.error('기록 통계 조회 실패:', error);
      return { total: 0 };
    }
  }

  // 최근 활동 조회
  async getRecentActivities() {
    try {
      // 여러 테이블에서 최근 활동 조회
      const activities = [];

      // 최근 사용자 가입
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (newUsers) {
        activities.push(
          ...newUsers.map(user => ({
            type: 'user_signup',
            user_name: user.username,
            description: '님이 가입했습니다',
            created_at: user.created_at,
          }))
        );
      }

      // 최근 러닝 기록
      const { data: recentRecords } = await supabase
        .from('running_records')
        .select(
          `
          title,
          created_at,
          profiles:user_id (username)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentRecords) {
        activities.push(
          ...recentRecords.map(record => ({
            type: 'record_posted',
            user_name: record.profiles?.username,
            description: `러닝 기록을 등록했습니다: ${record.title || '제목 없음'}`,
            created_at: record.created_at,
          }))
        );
      }

      // 시간순 정렬
      activities.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      return activities.slice(0, 10);
    } catch (error) {
      console.error('최근 활동 조회 실패:', error);
      return [];
    }
  }

  // 차트 데이터 생성
  async getChartData() {
    try {
      const userGrowth = await this.getUserGrowthData();
      const popularCourses = await this.getPopularCoursesData();
      const cafeRatings = await this.getCafeRatingsData();

      return {
        userGrowth,
        popularCourses,
        cafeRatings,
      };
    } catch (error) {
      console.error('차트 데이터 생성 실패:', error);
      return {
        userGrowth: null,
        popularCourses: null,
        cafeRatings: null,
      };
    }
  }

  // 사용자 증가 차트 데이터
  async getUserGrowthData() {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (!users) return null;

      // 월별 사용자 증가 데이터 생성
      const monthlyData = {};
      users.forEach(user => {
        const date = new Date(user.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      const labels = Object.keys(monthlyData).sort();
      const data = labels.map(label => monthlyData[label]);

      return {
        labels,
        datasets: [
          {
            label: '신규 사용자',
            data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
        ],
      };
    } catch (error) {
      console.error('사용자 증가 데이터 조회 실패:', error);
      return null;
    }
  }

  // 인기 코스 차트 데이터
  async getPopularCoursesData() {
    try {
      const { data: courses } = await supabase
        .from('running_places')
        .select('name, review_count')
        .order('review_count', { ascending: false })
        .limit(5);

      if (!courses) return null;

      return {
        labels: courses.map(course => course.name),
        datasets: [
          {
            label: '리뷰 수',
            data: courses.map(course => course.review_count || 0),
            backgroundColor: [
              'rgba(147, 51, 234, 0.8)',
              'rgba(147, 51, 234, 0.6)',
              'rgba(147, 51, 234, 0.4)',
              'rgba(147, 51, 234, 0.3)',
              'rgba(147, 51, 234, 0.2)',
            ],
          },
        ],
      };
    } catch (error) {
      console.error('인기 코스 데이터 조회 실패:', error);
      return null;
    }
  }

  // 카페 평점 분포 차트 데이터
  async getCafeRatingsData() {
    try {
      const { data: cafes } = await supabase.from('cafes').select('rating');

      if (!cafes) return null;

      // 평점 구간별 카페 수 계산
      const ratingRanges = {
        '4.5-5.0': 0,
        '4.0-4.4': 0,
        '3.5-3.9': 0,
        '3.0-3.4': 0,
        '3.0 미만': 0,
      };

      cafes.forEach(cafe => {
        const rating = cafe.rating || 0;
        if (rating >= 4.5) ratingRanges['4.5-5.0']++;
        else if (rating >= 4.0) ratingRanges['4.0-4.4']++;
        else if (rating >= 3.5) ratingRanges['3.5-3.9']++;
        else if (rating >= 3.0) ratingRanges['3.0-3.4']++;
        else ratingRanges['3.0 미만']++;
      });

      return {
        labels: Object.keys(ratingRanges),
        datasets: [
          {
            data: Object.values(ratingRanges),
            backgroundColor: [
              '#10B981',
              '#34D399',
              '#F59E0B',
              '#F97316',
              '#EF4444',
            ],
          },
        ],
      };
    } catch (error) {
      console.error('카페 평점 데이터 조회 실패:', error);
      return null;
    }
  }

  // 사용자 목록 조회
  async getUsers() {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select(
          `
          *,
          running_records (
            id,
            distance,
            duration
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 사용자별 통계 계산
      return users.map(user => ({
        ...user,
        total_runs: user.running_records?.length || 0,
        total_distance:
          user.running_records?.reduce(
            (sum, record) => sum + (record.distance || 0),
            0
          ) || 0,
        is_active:
          user.running_records?.some(
            record =>
              new Date(record.created_at) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ) || false,
      }));
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 수정
  async updateUser(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      throw error;
    }
  }

  // 러닝 코스 목록 조회
  async getCourses() {
    try {
      const { data: courses, error } = await supabase
        .from('running_places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return courses;
    } catch (error) {
      console.error('러닝 코스 목록 조회 실패:', error);
      throw error;
    }
  }

  // 러닝 코스 생성
  async createCourse(courseData) {
    try {
      const { data, error } = await supabase
        .from('running_places')
        .insert([courseData])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('러닝 코스 생성 실패:', error);
      throw error;
    }
  }

  // 러닝 코스 수정
  async updateCourse(courseId, updateData) {
    try {
      const { data, error } = await supabase
        .from('running_places')
        .update(updateData)
        .eq('id', courseId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('러닝 코스 수정 실패:', error);
      throw error;
    }
  }

  // 러닝 코스 삭제
  async deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('running_places')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    } catch (error) {
      console.error('러닝 코스 삭제 실패:', error);
      throw error;
    }
  }

  // 카페 목록 조회
  async getCafes() {
    try {
      const { data: cafes, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return cafes;
    } catch (error) {
      console.error('카페 목록 조회 실패:', error);
      throw error;
    }
  }

  // 카페 생성
  async createCafe(cafeData) {
    try {
      const { data, error } = await supabase
        .from('cafes')
        .insert([cafeData])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('카페 생성 실패:', error);
      throw error;
    }
  }

  // 카페 수정
  async updateCafe(cafeId, updateData) {
    try {
      const { data, error } = await supabase
        .from('cafes')
        .update(updateData)
        .eq('id', cafeId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('카페 수정 실패:', error);
      throw error;
    }
  }

  // 카페 삭제
  async deleteCafe(cafeId) {
    try {
      const { error } = await supabase.from('cafes').delete().eq('id', cafeId);

      if (error) throw error;
    } catch (error) {
      console.error('카페 삭제 실패:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
