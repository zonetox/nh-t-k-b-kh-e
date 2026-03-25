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
      // 1. Improved search logic using textSearch for better ranking
      // Postgres will rank results based on match count
      const { data, error } = await supabase
        .from('vaccine_knowledge')
        .select('*')
        .textSearch('keywords', userMsg.split(/\s+/).join(' | '), {
          type: 'websearch',
          config: 'simple'
        })
        .limit(1);

      let result = data?.[0];

      // 2. Fallback to broad ILIKE matching if textSearch is too strict
      if (!result) {
        const searchTerms = userMsg.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        if (searchTerms.length > 0) {
          // We look for terms in question or keywords
          const orConditions = searchTerms.map(term => `keywords.ilike.%${term}%,question.ilike.%${term}%`).join(',');
          const { data: fallbackData } = await supabase
            .from('vaccine_knowledge')
            .select('*')
            .or(orConditions)
            .limit(1);
          result = fallbackData?.[0];
        }
      }

      if (result) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'bot', 
          content: result.answer,
          source: result.source
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'bot', 
          content: 'Xin lỗi, mình chưa tìm thấy thông tin chính quy khớp với câu hỏi của bạn. Ba mẹ thử nhập từ khóa ngắn gọn hơn nhé (VD: "sốt", "trễ lịch", "6in1").' 
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
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-2xl shadow-primary/40 p-0 z-[999] flex items-center justify-center animate-bounce-slow"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-[92vw] max-w-[380px] h-[550px] max-h-[75vh] bg-white border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[1000] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#0088A9] text-white flex justify-between items-center px-4 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Tra Cứu Tiêm Chủng</h3>
                <p className="text-[10px] text-blue-50 font-medium">Hỗ trợ tự động 24/7</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Legal Disclaimer Improved Contrast */}
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 shrink-0 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              <strong className="text-amber-700">Miễn trừ trách nhiệm:</strong> Nội dung mang tính tham khảo y khoa chung từ Bộ Y Tế. Ba mẹ không nên tự ý điều trị, hãy tham vấn ý kiến bác sĩ trực tiếp!
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
