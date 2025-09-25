import { supabase } from './supabase';
import { APP_CONFIG } from '../constants/app';

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
      // 현재 환경에 맞는 리다이렉트 URL 결정
      const currentOrigin = APP_CONFIG.getCurrentOrigin();
      const isDevelopment = APP_CONFIG.isDevelopment();
      const isProduction = APP_CONFIG.isProduction();

      // 항상 현재 도메인의 콜백 페이지로 리다이렉트
      const redirectTo = `${currentOrigin}/auth/callback`;

      console.log('OAuth 설정 정보:');
      console.log('- 현재 Origin:', currentOrigin);
      console.log('- 개발 환경:', isDevelopment);
      console.log('- 프로덕션 환경:', isProduction);
      console.log('- 리다이렉트 URL:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          // 카카오는 Supabase에서 자동으로 적절한 스코프를 설정
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
