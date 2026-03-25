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
      // 1. Smart multi-match search - Fetch more results for better JS ranking
      const { data, error } = await supabase
        .from('vaccine_knowledge')
        .select('*')
        .textSearch('keywords', userMsg.split(/\s+/).join(' | '), {
          type: 'websearch',
          config: 'simple'
        })
        .limit(10); // Fetch more results for ranking

      let results = data || [];
      
      // 2. Fallback to broad ILIKE if no textSearch results
      if (results.length === 0) {
        const searchTerms = userMsg.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        if (searchTerms.length > 0) {
          const orConditions = searchTerms.map(term => `keywords.ilike.%${term}%,question.ilike.%${term}%`).join(',');
          const { data: fallbackData } = await supabase
            .from('vaccine_knowledge')
            .select('*')
            .or(orConditions)
            .limit(10);
          results = fallbackData || [];
        }
      }

      // 3. Superior JS Ranking Algorithm
      if (results.length > 0) {
        const lowerMsg = userMsg.toLowerCase();
        const msgWords = lowerMsg.split(/\s+/).filter(w => w.length > 1);
        
        const scoredResults = results.map(item => {
          let score = 0;
          const lowerQuestion = item.question.toLowerCase();
          const lowerKeywords = item.keywords.toLowerCase();
          
          // Exact sub-phrase match (highest priority)
          if (lowerQuestion.includes(lowerMsg)) score += 50;
          if (lowerKeywords.includes(lowerMsg)) score += 30;
          
          // Keyword overlap count
          msgWords.forEach(word => {
            if (lowerQuestion.includes(word)) score += 10;
            if (lowerKeywords.includes(word)) score += 5;
          });
          
          return { item, score };
        });

        scoredResults.sort((a, b) => b.score - a.score);
        const bestMatch = scoredResults[0].item;

        if (scoredResults[0].score > 0) {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'bot', 
            content: bestMatch.answer,
            source: bestMatch.source
          }]);
          return;
        }
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: `Chào ba mẹ, mình hiện đang học hỏi kiến thức từ **Bộ Y Tế, VNVC và WHO**. Với câu hỏi "${userMsg}", mình chưa tìm thấy đoạn trích chính xác. Ba mẹ thử hỏi ngắn gọn như: "mấy mũi", "tiêm trễ", "sốt" nhé!` 
      }]);
    } catch (error) {
      console.error("Search error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: 'Đã có lỗi hệ thống khi kết nối đến Thư viện tri thức. Ba mẹ vui lòng thử lại sau.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Reverted to larger MessageCircle */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-2xl shadow-[#0088A9]/40 p-0 z-[999] flex items-center justify-center animate-bounce-slow bg-[#0088A9] hover:bg-[#00708a] border-2 border-white"
        >
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-[94vw] max-w-[420px] h-[620px] max-h-[85vh] bg-white border-0 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-[1000] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#0088A9] text-white flex justify-between items-center px-6 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/20">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight leading-tight">Trợ Lý Tiêm Chủng AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[11px] text-blue-50 font-medium">Tri thức từ Bộ Y Tế, VNVC, WHO</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* AI Banner Info */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 shrink-0 flex items-start gap-3.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              <strong className="text-amber-700 block mb-0.5 text-[12px]">⚠️ THÔNG TIN THAM KHẢO:</strong>
              Nội dung được tổng hợp từ các nguồn chính quy. Ứng dụng không thay thế bác sĩ chuyên khoa!
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
