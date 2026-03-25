-- Migration: Vaccine Knowledge Base (Smart Search Bot)
-- Tạo bảng lưu trữ kiến thức tiêm chủng để phục vụ chatbot nội bộ

CREATE TABLE public.vaccine_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keywords TEXT NOT NULL, -- Dùng cho Full Text Search
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source TEXT NOT NULL, -- Nguồn trích dẫn (Bắt buộc)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.vaccine_knowledge ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng xem
CREATE POLICY "Anyone can view vaccine knowledge" ON public.vaccine_knowledge
    FOR SELECT USING (true);

-- Seed Data (Nguồn: Hệ thống tiêm chủng VNVC, Bệnh viện Nhi Đồng, Bộ Y Tế, WHO)
INSERT INTO public.vaccine_knowledge (keywords, question, answer, source) VALUES
(
  'sốt, nóng, nhiệt độ, sau tiêm, quấy khóc',
  'Trẻ bị sốt sau khi tiêm chủng phải làm sao?',
  'Sốt nhẹ (dưới 38.5 độ C), quấy khóc nhẹ là phản ứng bình thường của cơ thể khi đáp ứng với vắc-xin và thường tự khỏi sau 1-2 ngày. Cha mẹ cần: 
1. Cho trẻ mặc quần áo thoáng mát.
2. Cho bú nhiều hơn hoặc uống nhiều nước.
3. Có thể dùng thuốc hạ sốt thông thường (Paracetamol) với liều phù hợp cân nặng khi trẻ sốt > 38.5 độ C. 
Lưu ý: TUYỆT ĐỐI KHÔNG đắp lá non, chanh, khoai tây hay bôi dầu gió vào vị trí tiêm.',
  'Cẩm nang tiêm chủng VNVC & Bộ Y tế'
),
(
  'ho, sổ mũi, ốm, cảm, viêm họng, nghẹt mũi',
  'Trẻ đang bị ho, sổ mũi, cảm nhẹ thì có tiêm phòng được không?',
  'Theo Quyết định số 2470/QĐ-BYT, trẻ CÓ THỂ tiêm phòng bình thường nếu chỉ bị ho, sổ mũi nhẹ, không sốt (Nhiệt độ < 37.5 độ C), vẫn ăn ngủ và chơi ngoan. Trẻ chỉ hoãn tiêm khi đang mắc các bệnh cấp tính nặng, sốt cao, hoặc theo chỉ định riêng của bác sĩ khám sàng lọc.',
  'Quyết định 2470/QĐ-BYT - Bộ Y Tế'
),
(
  'chậm lịch, trễ lịch, quá hạn, qua ngày, muộn',
  'Trẻ bị chậm lịch tiêm (quá ngày hẹn) có phải tiêm lại từ đầu không?',
  'KHÔNG CẦN TIÊM LẠI TỪ ĐẦU. Vắc-xin khi được tiêm vào cơ thể đã tạo ra bộ nhớ miễn dịch. Khi tiêm trễ, cha mẹ chỉ cần đưa bé đi tiêm mũi tiếp theo càng sớm càng tốt để tiếp tục phác đồ, hoàn toàn không cần đếm lại từ mũi đầu tiên.',
  'Tổ chức Y tế Thế giới (WHO)'
),
(
  'sưng, đỏ, cục cứng, đau, vết tiêm',
  'Chỗ vết tiêm của bé bị sưng đỏ và có cục cứng, có nguy hiểm không?',
  'Sưng, đỏ, đau tại chỗ tiêm, hoặc sờ thấy cục cứng mờ mờ dưới da (đặc biệt với vắc-xin 5in1/6in1) là phản ứng tại chỗ thường gặp và rất an toàn. Mẹ có thể chườm mát (không chườm đá lạnh, KHÔNG chườm nóng) để giúp bé giảm đau. Cục cứng sẽ tự tự nhỏ dần và biến mất sau vài tuần. Tuy nhiên, nếu vết sưng lan rộng nhanh, nóng đỏ mạnh kèm mưng mủ, hãy đưa bé đến bệnh viện.',
  'Hướng dẫn an toàn tiêm chủng - Bệnh viện Nhi Đồng 1'
),
(
  'khoảng cách, mấy ngày, cách nhau, thời gian tối thiểu',
  'Khoảng cách tối thiểu giữa 2 mũi tiêm vắc-xin là bao lâu?',
  'Tùy loại vắc-xin:
1. Hai loại vắc-xin sống giảm độc lực (ví dụ: Sởi, Thủy đậu, Rubella, Viêm não Nhật Bản Jevax) phải tiêm CÁCH NHAU ÍT NHẤT 4 TUẦN (28 ngày) nếu không tiêm cùng 1 ngày.
2. Các vắc-xin bất hoạt (ví dụ: 6in1, Cúm, Phế cầu) không quy định khoảng cách bắt buộc với nhau, có thể tiêm bất cứ lúc nào.',
  'Viện Vệ sinh Dịch tễ Trung ương'
),
(
  'như thế nào là nguy hiểm, phản ứng nặng, đi viện, cấp cứu, sốc phản vệ',
  'Dấu hiệu nào sau tiêm chứng tỏ trẻ đang gặp nguy hiểm, cần đi cấp cứu ngay?',
  'Cha mẹ CẦN ĐƯA TRẺ ĐẾN BỆNH VIỆN NGAY lập tức nếu thấy các dấu hiệu phản ứng nặng (tuy rất hiếm gặp):
1. Sốt cao liên tục > 39 độ C dài ngày, dùng thuốc hạ sốt không đỡ.
2. Khóc thét dai dẳng, la hét liên tục trên 3 giờ đồng hồ.
3. Co giật, mệt lả, lừ đừ, gọi hỏi không phản ứng.
4. Tím tái, khó thở, thở rít, khò khè, phát ban toàn thân.
5. Bú kém, bỏ bú hoàn toàn.',
  'Hướng dẫn xử trí sốc phản vệ - VNVC'
),
(
  'uống phòng tả, tiêu chảy, rotavirus, nôn, trớ',
  'Trẻ uống vắc-xin ngừa tiêu chảy (Rotavirus) bị nôn trớ thì có cần uống lại không?',
  'Nếu trẻ chỉ nôn/trớ một ít sau khi uống vắc-xin Rotavirus, thường KHÔNG cần uống lại vì niêm mạc ruột đã hấp thu ngay lập tức một phần lớn vắc-xin. Tuy nhiên, nếu trẻ nôn ói ào ạt ngay lập tức toàn bộ ra ngoài, bác sĩ có thể đánh giá và quyết định có cần cho uống liều thay thế hay không.',
  'Trung tâm Kiểm soát Bệnh tật (CDC)'
),
(
  'cùng lúc, tiêm nhiều mũi, quá tải, ảnh hưởng',
  'Tiêm 2-3 loại vắc-xin cùng một ngày (cùng lúc) có làm bé bị quá tải miễn dịch hay sốt nặng hơn không?',
  'KHÔNG ảnh hưởng. Y học đã chứng minh hệ miễn dịch của trẻ em hoàn toàn có khả năng xử lý hàng ngàn kháng nguyên cùng lúc. Việc tiêm phối hợp nhiều vắc-xin trong một buổi tiêm KHÔNG làm tăng nguy cơ phản ứng phụ, KHÔNG làm giảm hiệu quả vắc-xin, mà ngược lại giúp trẻ sớm được bảo vệ và cha mẹ đỡ tốn thời gian, giảm số dư lần con phải chịu đau.',
  'Thông tin y tế VNVC & CDC Hoa Kỳ'
),
(
  '5in1, 6in1, khác nhau, chọn loại nào',
  'Vắc-xin 5in1 (Pentaxim/Quinvaxem) và 6in1 (Infanrix/Hexaxim) khác nhau như thế nào?',
  'Điểm khác biệt chính:
- Số lượng bệnh: 6in1 phòng 6 bệnh (Bạch hầu, Ho gà, Uốn ván, Bại liệt, Hib, VIÊM GAN B). 5in1 của Pháp phòng 5 bệnh (không có Viêm gan B), 5in1 mở rộng (ComBE Five/SII) phòng 5 bệnh (không có Bại Liệt).
- Thành phần Ho gà: 6in1 và 5in1 (Pháp) dùng thành phần ho gà vô bào, giúp bé ÍT SỐT, ít quấy khóc hơn nhiều so với 5in1 mở rộng (dùng ho gà toàn tế bào - tỷ lệ sốt cao hơn nhưng sinh miễn dịch mạnh).',
  'Hệ thống tiêm chủng VNVC'
),
(
  'chuẩn bị gì, đi tiêm mang gì, giấy tờ',
  'Bố mẹ cần chuẩn bị gì và mang theo giấy tờ gì khi đưa trẻ đi tiêm?',
  '1. Bắt buộc mang theo: Sổ tiêm chủng của bé (để bác sĩ theo dõi lịch sử mũi tiêm).
2. Mang theo sổ khám bệnh gần nhất, giấy khai sinh hoặc mã định danh của bé.
3. Cho bé mặc quần áo rộng rãi, thoáng mát, dễ cởi.
4. Thông báo đầy đủ cho bác sĩ nếu bé đang uống thuốc điều trị mạn tính, bé sinh non, hoặc bé có tiền sử dị ứng, phản ứng mạnh ở lần tiêm trước.',
  'Bệnh viện Nhi Đồng Tp.HCM'
),
(
  'an toàn, rủi ro, nguy hiểm, tự kỷ',
  'Tiêm vắc-xin có thực sự an toàn không? Có gây bệnh tự kỷ như lời đồn không?',
  'Vắc-xin là một trong những thành tựu y học vĩ đại và an toàn nhất của loài người. Lợi ích phòng bệnh của vắc-xin (cứu sống hàng triệu sinh mạng) vượt xa các tác dụng phụ nhẹ (sốt, đau tay). Đặc biệt, thông tin "vắc-xin Sởi-Quai Bị-Rubella gây bệnh tự kỷ" đã bị Tổ chức Y tế Thế giới (WHO) cùng hàng trăm nghiên cứu y khoa quốc tế BÁC BỎ HOÀN TOÀN vì đây là thông tin sai sự thật.',
  'Tổ chức Y tế Thế giới (WHO)'
),
(
  'thủy đậu, trái rạ, có cần tiêm',
  'Nhiều người nói thủy đậu (trái rạ) ai cũng phải mắc 1 lần, vậy có cần tiêm vắc-xin không?',
  'CHẮC CHẮN CẦN. Thủy đậu không phải là bệnh "ai cũng phải mắc". Tiêm vắc-xin thủy đậu mang lại khả năng bảo vệ lên tới 90-95%. Quan trọng hơn, tiêm vắc-xin giúp bảo vệ bé khỏi các biến chứng nguy hiểm của thủy đậu như: Viêm phổi do thủy đậu, Nhiễm trùng huyết, Viêm não, và ngăn chặn virus Zona ngủ đông gây bệnh Giời Leo (Zona thần kinh) sau này.',
  'Chuyên gia tiêm chủng VNVC'
),
(
  'sởi đơn, 3 trong 1, mmr, 9 tháng',
  'Bé đã tiêm sởi đơn lúc 9 tháng, vậy 1 tuổi có tiêm mũi 3 trong 1 (Sởi-Quai Bị-Rubella) được không?',
  'HOÀN TOÀN TIÊM ĐƯỢC VÀ RẤT CẦN THIẾT. Mũi 3in1 (MMR / Priorix) lúc 12 tháng tuổi không chỉ cung cấp kháng thể phòng thêm Quai bị và Rubella, mà còn đóng vai trò là "mũi nhắc lại" vô cùng quan trọng giúp củng cố, tăng cường miễn dịch phòng bệnh Sởi bền vững hơn. Cần lưu ý 2 mũi này cách nhau ít nhất 1 tháng.',
  'Bệnh viện Nhi Đồng 1'
),
(
  'chế độ ăn, kiêng cữ, sau tiêm ăn gì',
  'Sau khi tiêm chủng, trẻ có cần phải kiêng cữ ăn uống món gì không?',
  'KHÔNG CẦN KIÊNG CỮ. Sau khi tiêm chủng, trẻ cần được cung cấp chế độ dinh dưỡng phong phú, đầy đủ chất (thịt, cá, tôm, trứng, rau xanh) để cơ thể khỏe mạnh, sinh ra lượng kháng thể tốt nhất. Với trẻ bú mẹ, nên cho trẻ bú nhiều hơn bình thường để cung cấp nước và giúp dịu cơn sốt nếu có.',
  'Viện Dinh Dưỡng Quốc Gia'
),
(
  'theo dõi, sau tiêm, làm gì, ở lại',
  'Vì sao bắt buộc phải ở lại cơ sở y tế 30 phút sau khi tiêm?',
  '30 phút đầu sau tiêm là khoảng thời gian "vàng" cực kỳ quan trọng để theo dõi các phản ứng dị ứng nghiêm trọng nhất có thể xảy ra ngay lập tức (như sốc phản vệ). Việc ở lại giúp các y bác sĩ có mặt ngay lập tức để cấp cứu kịp thời và bảo vệ tính mạng cho trẻ.',
  'Bộ Y Tế Việt Nam'
);

-- Index Full Text Search với ngôn ngữ mặc định
CREATE INDEX idx_vaccine_knowledge_search ON public.vaccine_knowledge 
USING GIN (to_tsvector('simple', keywords || ' ' || question));
