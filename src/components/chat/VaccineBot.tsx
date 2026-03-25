import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'bot' | 'user';
  content: string;
  source?: string;
};

const VaccineBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Chào ba/mẹ! Mình là trợ lý tra cứu thông tin tiêm chủng tự động. Ba mẹ cần tìm hiểu thông tin gì ạ? (VD: bé bị sốt, chậm lịch tiêm, vắc xin 5in1...)'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Create a search query: replace spaces with | for basic OR text search
      // Example: "sốt tiêm" -> "sốt | tiêm"
      const searchTerms = userMsg.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      
      let answer = '';
      let source = '';

      if (searchTerms.length > 0) {
        // Build ilike query for broader matching since Postgres Vietnamese textSearch can be finicky without custom dicts
        const orConditions = searchTerms.map(term => `keywords.ilike.%${term}%,question.ilike.%${term}%`).join(',');
        
        const { data, error } = await supabase
          .from('vaccine_knowledge')
          .select('*')
          .or(orConditions)
          .limit(1);

        if (data && data.length > 0) {
          answer = data[0].answer;
          source = data[0].source;
        }
      }

      if (answer) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'bot', 
          content: answer,
          source: source
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'bot', 
          content: 'Xin lỗi, mình chưa tìm thấy thông tin chính quy khớp với câu hỏi của bạn trong cẩm nang. Bạn thử đổi từ khóa ngắn gọn hơn xem sao nhé (VD: "sốt", "tiêm trễ").' 
        }]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: 'Đã có lỗi xảy ra khi tra cứu, vui lòng thử lại sau.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-xl shadow-primary/30 p-0 z-50 flex items-center justify-center animate-bounce-slow"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-[90vw] max-w-[360px] h-[500px] max-h-[70vh] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground flex justify-between items-center px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h3 className="font-bold text-sm">Tra Cứu Tiêm Chủng</h3>
                <p className="text-[10px] opacity-80">Trả lời tự động từ Thư Viện</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/50" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Legal Disclaimer Always Visible at Top */}
          <div className="bg-warning/10 border-b border-warning/20 px-3 py-2 shrink-0 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[10px] text-warning-foreground leading-tight">
              <strong>Miễn trừ trách nhiệm:</strong> Mọi thông tin tra cứu chỉ mang tính chất tham khảo chung từ Bộ Y Tế/VNVC. Ứng dụng không thay thế chẩn đoán y khoa. Vui lòng hỏi ý kiến bác sĩ chuyên khoa!
            </p>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scroll-smooth"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "p-3 rounded-2xl text-sm whitespace-pre-wrap",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-white dark:bg-slate-800 border shadow-sm rounded-tl-sm text-foreground"
                )}>
                  {msg.content}
                </div>
                {msg.source && (
                  <p className="text-[10px] text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" /> Nguồn: {msg.source}
                  </p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mr-auto items-start max-w-[85%] flex">
                <div className="bg-white dark:bg-slate-800 border shadow-sm rounded-2xl rounded-tl-sm p-3 flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-background border-t flex gap-2 shrink-0 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập từ khóa (VD: sốt, trễ lịch...)"
              className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-full shrink-0">
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default VaccineBot;
