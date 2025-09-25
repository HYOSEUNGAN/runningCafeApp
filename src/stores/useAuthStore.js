import { create } from 'zustand';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
  // 상태
  user: null,
  session: null,
  userProfile: null,
  isLoading: true,
  error: null,

  // 액션
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // 현재 세션 확인
      const { session, error } = await authService.getCurrentSession();
      if (error) throw new Error(error);

      set({
        session,
        user: session?.user || null,
        isLoading: false,
      });

      // 인증 상태 변화 리스너 설정
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({
          session,
          user: session?.user || null,
          isLoading: false,
        });

        // 로그인 성공 시 프로필 처리
        if (event === 'SIGNED_IN' && session?.user) {
          await get().handleLoginSuccess(session.user);
        }
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        user: null,
        session: null,
      });
    }
  },

  // 로그인 성공 후처리 (프로필 생성 등)
  handleLoginSuccess: async user => {
    try {
      if (!user) return;

      let result;

      // 로그인 제공자에 따라 프로필 생성
      if (user.app_metadata?.provider === 'kakao') {
        // 카카오 로그인인 경우
        result = await authService.handleKakaoLoginSuccess(user);
        console.log('카카오 로그인 후처리 완료');
      } else {
        // 이메일 로그인인 경우 (기본값)
        result = await authService.handleEmailLoginSuccess(user);
        console.log('이메일 로그인 후처리 완료');
      }

      if (result?.success && result?.profileCreated) {
        set({ userProfile: result.profile });
        console.log('사용자 프로필 생성/업데이트 완료:', result.profile);
      } else if (result?.error) {
        console.warn('프로필 생성 실패 (로그인은 성공):', result.error);
      }
    } catch (error) {
      console.error('로그인 후처리 중 오류:', error);
    }
  },

  signUp: async (email, password, userData) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await authService.signUp(
        email,
        password,
        userData
      );

      if (error) throw new Error(error);

      set({ isLoading: false });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await authService.signIn(email, password);

      if (error) throw new Error(error);

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await authService.signOut();

      if (error) throw new Error(error);

      set({
        user: null,
        session: null,
        userProfile: null,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateProfile: async updates => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await authService.updateProfile(updates);

      if (error) throw new Error(error);

      set({ user: data.user, isLoading: false });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // 카카오 소셜 로그인
  signInWithKakao: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await authService.signInWithKakao();

      if (error) throw new Error(error);

      // OAuth는 리다이렉트되므로 여기서 상태 업데이트하지 않음
      // 리다이렉트 후 onAuthStateChange에서 처리됨
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),

  // 사용자 프로필 설정
  setUserProfile: profile => set({ userProfile: profile }),

  // 셀렉터
  isAuthenticated: () => !!get().user,
  getUserId: () => get().user?.id,
  getUserEmail: () => get().user?.email,
  getUserName: () =>
    get().userProfile?.display_name ||
    get().userProfile?.username ||
    get().user?.user_metadata?.name ||
    get().user?.user_metadata?.full_name ||
    get().user?.email?.split('@')[0],
  getUserAvatar: () =>
    get().userProfile?.avatar_url ||
    get().user?.user_metadata?.avatar_url ||
    get().user?.user_metadata?.picture,
  getUserProfile: () => get().userProfile,
}));
