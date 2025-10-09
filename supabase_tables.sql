-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cafes (
  id integer NOT NULL DEFAULT nextval('cafes_id_seq'::regclass),
  name text NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  description text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cafes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenge_participations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  challenge_id uuid,
  current_progress numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_participations_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT challenge_participations_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.monthly_challenges(id)
);
CREATE TABLE public.challenge_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  participation_id uuid,
  running_record_id uuid,
  contributed_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_records_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_records_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES public.challenge_participations(id),
  CONSTRAINT challenge_records_running_record_id_fkey FOREIGN KEY (running_record_id) REFERENCES public.running_records(id)
);
CREATE TABLE public.feed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  running_record_id uuid,
  caption text,
  image_urls ARRAY,
  hashtags ARRAY,
  location character varying,
  is_achievement boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feed_posts_pkey PRIMARY KEY (id),
  CONSTRAINT feed_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT feed_posts_running_record_id_fkey FOREIGN KEY (running_record_id) REFERENCES public.running_records(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid,
  following_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.monthly_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  target_type character varying NOT NULL CHECK (target_type::text = ANY (ARRAY['distance'::character varying, 'runs_count'::character varying, 'duration'::character varying]::text[])),
  target_value numeric NOT NULL,
  target_unit character varying NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  start_date date NOT NULL,
  end_date date NOT NULL,
  badge_image_url text,
  reward_points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_challenges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  content text,
  reference_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  post_id uuid,
  parent_comment_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id),
  CONSTRAINT post_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.post_comments(id)
);
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  post_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.feed_posts(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username character varying NOT NULL UNIQUE,
  display_name character varying,
  avatar_url text,
  bio text,
  total_distance numeric DEFAULT 0,
  total_runs integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.running_feeds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text,
  images ARRAY,
  tags ARRAY,
  location character varying,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  visibility character varying DEFAULT 'public'::character varying CHECK (visibility::text = ANY (ARRAY['public'::character varying, 'friends'::character varying, 'private'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT running_feeds_pkey PRIMARY KEY (id),
  CONSTRAINT running_feeds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.running_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title character varying,
  distance numeric NOT NULL,
  duration integer NOT NULL,
  pace numeric,
  calories_burned integer,
  route_data jsonb,
  elevation_gain numeric,
  average_heart_rate integer,
  max_heart_rate integer,
  weather_condition character varying,
  temperature numeric,
  notes text,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT running_records_pkey PRIMARY KEY (id),
  CONSTRAINT running_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  nickname text,
  profile_image text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- 10.2 러닝플레이스, 카페 테이블 확장

-- 10.2 러닝플레이스, 카페 테이블 확장

-- 10.2 러닝플레이스, 카페 테이블 확장

-- 1. 러닝 플레이스 테이블 (새로 추가) - PRIMARY KEY 중복 제거
CREATE TABLE public.running_places (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  place_type varchar(50) NOT NULL CHECK (place_type IN ('park', 'trail', 'track', 'riverside', 'mountain')),
  description text,
  difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  distance_km numeric,
  surface_type varchar(50), -- 'asphalt', 'dirt', 'track', 'mixed'
  facilities text[], -- ['parking', 'restroom', 'water_fountain', 'shower']
  image_urls text[],
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. 카페 테이블 확장 (기존 테이블에 컬럼 추가)
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS operating_hours jsonb;
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS facilities text[];
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS image_urls text[];
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS runner_friendly boolean DEFAULT false;

-- 3. 장소 리뷰 테이블 (카페 + 러닝플레이스 공통)
CREATE TABLE public.place_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_type varchar(20) NOT NULL CHECK (place_type IN ('cafe', 'running_place')),
  place_id integer NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  images text[],
  tags text[],
  likes_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT place_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- 4. 장소별 피드 연결 테이블
CREATE TABLE public.place_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_post_id uuid NOT NULL,
  place_type varchar(20) NOT NULL CHECK (place_type IN ('cafe', 'running_place')),
  place_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT place_feed_posts_feed_post_id_fkey FOREIGN KEY (feed_post_id) REFERENCES public.feed_posts(id)
);

-- 5. 즐겨찾기 테이블
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_type varchar(20) NOT NULL CHECK (place_type IN ('cafe', 'running_place')),
  place_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, place_type, place_id)
);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_running_places_location ON public.running_places (lat, lng);
CREATE INDEX IF NOT EXISTS idx_running_places_type ON public.running_places (place_type);
CREATE INDEX IF NOT EXISTS idx_place_reviews_place ON public.place_reviews (place_type, place_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_user ON public.place_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_place_feed_posts_place ON public.place_feed_posts (place_type, place_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites (user_id);

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE public.running_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 러닝 플레이스 읽기 정책 (모든 사용자)
CREATE POLICY "Anyone can view running places" ON public.running_places
  FOR SELECT USING (true);

-- 리뷰 읽기 정책 (모든 사용자)
CREATE POLICY "Anyone can view place reviews" ON public.place_reviews
  FOR SELECT USING (true);

-- 리뷰 작성/수정 정책 (본인만)
CREATE POLICY "Users can insert their own reviews" ON public.place_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.place_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- 즐겨찾기 정책 (본인만)
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- 피드 연결 정책 (모든 사용자 읽기)
CREATE POLICY "Anyone can view place feed posts" ON public.place_feed_posts
  FOR SELECT USING (true);

-- 8. 장소 등록 요청 테이블 (새로 추가)
CREATE TABLE public.place_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_type varchar(20) NOT NULL CHECK (place_type IN ('cafe', 'running_place')),
  place_name text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  description text,
  reason text NOT NULL,
  contact_info text,
  image_urls text[],
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT place_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT place_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);

-- 장소 등록 요청 인덱스
CREATE INDEX IF NOT EXISTS idx_place_requests_user ON public.place_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_place_requests_status ON public.place_requests (status);
CREATE INDEX IF NOT EXISTS idx_place_requests_type ON public.place_requests (place_type);
CREATE INDEX IF NOT EXISTS idx_place_requests_created ON public.place_requests (created_at);

-- 장소 등록 요청 RLS 정책
ALTER TABLE public.place_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 요청만 조회/수정 가능
CREATE POLICY "Users can view their own place requests" ON public.place_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own place requests" ON public.place_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON public.place_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 관리자는 모든 요청 조회/수정 가능 (향후 관리자 권한 시스템 구축 시 사용)
-- CREATE POLICY "Admins can manage all place requests" ON public.place_requests
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');