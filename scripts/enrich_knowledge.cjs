const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function enrichKnowledge() {
  console.log('Enriching Knowledge Base with more comprehensive content...');
  
  const newsRows = [
    {
      keywords: 'tổng cộng mấy mũi, bao nhiêu mũi, liệt kê, tất cả lịch tiêm, số lượng mũi tiêm',
      question: 'Bé cần tiêm tổng cộng bao nhiêu mũi vắc-xin trong những năm đầu đời?',
      answer: 'Theo lịch tiêm chủng mở rộng và dịch vụ, một đứa trẻ trong 2 năm đầu đời cần tiêm khoảng 15-20 mũi vắc-xin quan trọng để phòng hơn 10 loại bệnh cơ bản. Các mốc quan trọng bao gồm: Sơ sinh, 2-3-4 tháng (6in1, Phế cầu, Rota), 9 tháng (Sởi/Viêm não NB), 12 tháng (Thủy đậu, Sởi-Quai bị-Rubella), 18-24 tháng (Nhắc lại 6in1, Viêm não NB). Ba mẹ có thể xem chi tiết trong mục "Lịch tiêm" của ứng dụng nhé!',
      source: 'Lịch tiêm chủng Quốc gia & VNVC'
    },
    {
      keywords: 'đặt lịch, tiêm ở đâu, bệnh viện nào, cơ sở tiêm chủng, địa chỉ tiêm',
      question: 'Tôi có thể đưa bé đi tiêm ở đâu và đặt lịch như thế nào?',
      answer: 'Ba mẹ có thể đưa bé đến: 1. Trạm y tế phường/xã (Tiêm chủng mở rộng miễn phí). 2. Các trung tâm tiêm chủng dịch vụ như VNVC, Long Châu, hoặc khoa sản-nhi của các bệnh viện lớn. Ứng dụng này giúp ba mẹ ghi nhật ký và nhắc lịch, còn việc đặt lịch tiêm thực tế ba mẹ nên liên hệ trực tiếp số hotline hoặc website của các cơ sở tiêm chủng để đảm bảo còn thuốc nhé.',
      source: 'Cẩm nang quản lý tiêm chủng'
    }
  ];

  for (const row of newsRows) {
    const { error } = await supabase.from('vaccine_knowledge').insert(row);
    if (error) console.error(`Error adding ${row.question}:`, error);
    else console.log(`Successfully added: ${row.question}`);
  }
}

enrichKnowledge();
