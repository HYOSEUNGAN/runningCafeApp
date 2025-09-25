-- Supabase 데이터베이스 함수들
-- 이 파일의 내용을 Supabase 콘솔의 SQL Editor에서 실행하세요.

-- 1. 포스트 좋아요 수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_posts 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 포스트 좋아요 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_posts 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 포스트 댓글 수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_posts 
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 포스트 댓글 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_posts 
  SET comments_count = GREATEST(comments_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS (Row Level Security) 정책 설정
-- 프로필 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 모든 사용자는 프로필 조회 가능
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 사용자는 자신의 프로필만 삽입 가능
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 러닝 기록 테이블 RLS 활성화
ALTER TABLE running_records ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 러닝 기록만 관리 가능
CREATE POLICY "Users can manage own running records" ON running_records
  FOR ALL USING (auth.uid() = user_id);

-- 공개 러닝 기록은 모든 사용자가 조회 가능
CREATE POLICY "Public running records are viewable" ON running_records
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- 피드 포스트 테이블 RLS 활성화
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 포스트만 관리 가능
CREATE POLICY "Users can manage own posts" ON feed_posts
  FOR ALL USING (auth.uid() = user_id);

-- 모든 사용자는 피드 포스트 조회 가능
CREATE POLICY "Feed posts are viewable by everyone" ON feed_posts
  FOR SELECT USING (true);

-- 좋아요 테이블 RLS 활성화
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 좋아요만 관리 가능
CREATE POLICY "Users can manage own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- 댓글 테이블 RLS 활성화
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 댓글만 관리 가능
CREATE POLICY "Users can manage own comments" ON post_comments
  FOR ALL USING (auth.uid() = user_id);

-- 모든 사용자는 댓글 조회 가능
CREATE POLICY "Comments are viewable by everyone" ON post_comments
  FOR SELECT USING (true);

-- 챌린지 관련 테이블 RLS 설정
ALTER TABLE monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_records ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 활성 챌린지 조회 가능
CREATE POLICY "Active challenges are viewable by everyone" ON monthly_challenges
  FOR SELECT USING (is_active = true);

-- 사용자는 자신의 챌린지 참여만 관리 가능
CREATE POLICY "Users can manage own participations" ON challenge_participations
  FOR ALL USING (auth.uid() = user_id);

-- 사용자는 자신의 챌린지 기록만 관리 가능
CREATE POLICY "Users can manage own challenge records" ON challenge_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM challenge_participations cp 
      WHERE cp.id = challenge_records.participation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- 알림 테이블 RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 관리 가능
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 팔로우 관계 테이블 RLS 활성화 (미래 기능용)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신과 관련된 팔로우 관계만 관리 가능
CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 6. 트리거 함수들 (자동 업데이트용)
-- 프로필 생성 시 자동으로 created_at, updated_at 설정
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 가입 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 7. 인덱스 최적화 (성능 향상)
-- 자주 조회되는 필드들에 대한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_running_records_user_created ON running_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user ON challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- 8. 샘플 챌린지 데이터 삽입 (테스트용)
INSERT INTO monthly_challenges (
  title,
  description,
  target_type,
  target_value,
  target_unit,
  year,
  month,
  start_date,
  end_date,
  reward_points,
  is_active
) VALUES 
(
  '9월 100km 챌린지',
  '9월 한 달 동안 총 100km 달리기에 도전해보세요!',
  'distance',
  100.0,
  'km',
  2025,
  9,
  '2025-09-01',
  '2025-09-30',
  1000,
  true
),
(
  '9월 매일 러닝',
  '9월 한 달 동안 매일 러닝하기 도전! (30회)',
  'runs_count',
  30.0,
  '회',
  2025,
  9,
  '2025-09-01',
  '2025-09-30',
  1500,
  true
),
(
  '9월 1500분 러닝',
  '9월 한 달 동안 총 1500분 러닝하기',
  'duration',
  1500.0,
  '분',
  2025,
  9,
  '2025-09-01',
  '2025-09-30',
  800,
  true
)
ON CONFLICT DO NOTHING;

-- 완료 메시지
SELECT 'Supabase 데이터베이스 설정이 완료되었습니다!' as message;
