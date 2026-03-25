const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function refineKeywords() {
  console.log('Refining Chatbot keywords for better accuracy...');
  
  // Update "Tiêm trễ" row to be more specific
  const { error: error1 } = await supabase
    .from('vaccine_knowledge')
    .update({ keywords: 'tiêm trễ, chậm lịch, trễ lịch, quá hạn, qua ngày, muộn, tiêm muộn' })
    .ilike('question', '%chậm lịch%');

  if (error1) console.error('Error updating row 1:', error1);
  else console.log('Successfully refined "Tiêm trễ" keywords.');

  // Update "Sốt" row to avoid over-matching on general "tiêm"
  const { error: error2 } = await supabase
    .from('vaccine_knowledge')
    .update({ keywords: 'sốt sau tiêm, nóng, nhiệt độ cao, quấy khóc, xử lý sốt' })
    .ilike('question', '%sốt%');

  if (error2) console.error('Error updating row 2:', error2);
  else console.log('Successfully refined "Sốt" keywords.');
}

refineKeywords();
