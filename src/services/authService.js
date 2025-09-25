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
      // 개발환경과 프로덕션환경에 따라 리다이렉트 URI 결정
      const isDevelopment =
        process.env.REACT_APP_ENVIRONMENT === 'development' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      const redirectTo = isDevelopment
        ? `${window.location.origin}/auth/callback`
        : 'https://hdummdjaakiihhwfroub.supabase.co/auth/v1/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          // scopes: 'profile_nickname, profile_image',
          // 카카오는 Supabase에서 자동으로 적절한 스코프를 설정하므로
          // 추가 옵션 없이 기본 설정 사용
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
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
