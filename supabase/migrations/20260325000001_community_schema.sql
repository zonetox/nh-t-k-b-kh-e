-- Migration: Cộng đồng & Hỏi đáp (Community)
-- Tạo bảng posts, comments và likes

-- 1. Bảng bài viết (Posts)
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng bình luận (Comments)
CREATE TABLE public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng lượt thích (Likes) - Tùy chọn để tăng tương tác
CREATE TABLE public.community_likes (
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Bật RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- Policies cho Posts
CREATE POLICY "Anyone can view posts" ON public.community_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Policies cho Comments
CREATE POLICY "Anyone can view comments" ON public.community_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policies cho Likes
CREATE POLICY "Anyone can view likes" ON public.community_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.community_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.community_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id);
