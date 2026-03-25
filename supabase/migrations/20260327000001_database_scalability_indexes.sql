-- Migration: Database Scalability & Performance Patch
-- Mục tiêu: Tối ưu hóa truy vấn cho hàng chục ngàn người dùng, tránh nghẽn CPU/RAM trên Supabase

-- Đảm bảo extension pg_trgm đã được cài đặt cho tìm kiếm văn bản tiếng Việt trước khi tạo index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Tối ưu bảng Thông báo (Bảng hay bị quét nhất khi User vào app)
-- Index này giúp PostgreSQL tìm ngay ra 20 thông báo mới nhất của 1 User mà không cần quét toàn bộ bảng (Fix lỗi RLS scan)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON public.notifications (user_id, created_at DESC);

-- 2. Tối ưu bảng Lịch sử tiêm chủng (Dùng cho Timeline và Chi tiết mũi tiêm)
-- Index khóa ngoại giúp việc JOIN bảng VaccineSchedules và VaccineHistory diễn ra tức thì
CREATE INDEX IF NOT EXISTS idx_vaccine_history_schedule_id 
ON public.vaccine_history (schedule_id);

-- 3. Tối ưu bảng Hình ảnh minh chứng
CREATE INDEX IF NOT EXISTS idx_vaccine_history_images_history_id 
ON public.vaccine_history_images (history_id);

-- 4. Tối ưu bảng Cộng đồng (Feed bài viết)
-- Index composite giúp bộ lọc Chuyên mục và Sắp xếp theo thời gian chạy cực nhanh
CREATE INDEX IF NOT EXISTS idx_community_posts_category_created_at 
ON public.community_posts (category, created_at DESC);

-- 5. Tối ưu phần Bình luận cộng đồng
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id_created_at 
ON public.community_comments (post_id, created_at ASC);

-- 6. Tối ưu bảng hồ sơ trẻ em (Dùng cho Baby Selector)
CREATE INDEX IF NOT EXISTS idx_babies_user_id_deleted_at 
ON public.babies (user_id) WHERE (deleted_at IS NULL);

-- 7. Tối ưu bảng Vaccine Schedules (Lịch tiêm)
-- Composite index hỗ trợ lọc theo bé và trạng thái (Pending/Upcoming/Done)
CREATE INDEX IF NOT EXISTS idx_schedules_baby_id_status 
ON public.vaccine_schedules (baby_id, status);

-- 8. Tăng tốc tìm kiếm Vắc xin (Tra cứu)
CREATE INDEX IF NOT EXISTS idx_vaccines_name_trgm ON public.vaccines USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vaccines_short_name_trgm ON public.vaccines USING gin (short_name gin_trgm_ops);

