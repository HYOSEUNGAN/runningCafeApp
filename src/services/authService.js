import { supabase } from './supabase';

export const authService = {
  // 회원가입
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // 로그인
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // 로그아웃
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // 현재 세션 가져오기
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  },

  // 사용자 정보 업데이트
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // 카카오 소셜 로그인
  async signInWithKakao() {
    try {
      // 환경에 따른 리다이렉트 URL 설정
      const getRedirectUrl = () => {
        // Vercel 배포 환경 (Create React App용)
        if (process.env.REACT_APP_VERCEL_URL) {
          return `https://${process.env.REACT_APP_VERCEL_URL}/auth/callback`;
        }

        // 프로덕션 환경에서 running-cafe-app.vercel.app 도메인 감지
        if (window.location.hostname.includes('running-cafe-app.vercel.app')) {
          return 'https://running-cafe-app.vercel.app/auth/callback';
        }

        // 로컬 개발 환경
        if (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        ) {
          return 'http://localhost:3000/auth/callback';
        }

        // 기본적으로 현재 origin 사용
        return `${window.location.origin}/auth/callback`;
      };

      const redirectTo = getRedirectUrl();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      return { data: null, error: error.message };
    }
  },

  // 사용자 프로필 정보 가져오기 (소셜 로그인 시 유용)
  async getUserProfile() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },
};
