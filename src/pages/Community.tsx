import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, ThumbsUp, Plus, Search, Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
  };
  community_comments: { count: number }[];
  community_likes: { count: number }[];
}

const categories = [
  { id: 'all', label: 'Tất cả' },
  { id: 'reaction', label: 'Phản ứng sau tiêm' },
  { id: 'experience', label: 'Kinh nghiệm' },
  { id: 'question', label: 'Hỏi đáp' },
  { id: 'tip', label: 'Mẹo vặt' },
];

const Community: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'reaction' });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles(display_name),
          community_comments(count),
          community_likes(count)
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_posts')
        .insert({
          ...newPost,
          user_id: user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setIsDialogOpen(false);
      setNewPost({ title: '', content: '', category: 'reaction' });
      toast({ title: 'Thành công', description: 'Bài viết của bạn đã được đăng.' });
    },
    onError: (error) => {
      toast({ 
        title: 'Lỗi', 
        description: 'Không thể đăng bài viết: ' + error.message,
        variant: 'destructive' 
      });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex shrink-0 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">Cộng đồng</h1>
              <p className="text-sm text-muted-foreground">Chia sẻ kiến thức & kinh nghiệm</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tạo bài viết mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="Tiêu đề bài viết..." 
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.slice(1).map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={newPost.category === cat.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setNewPost({...newPost, category: cat.id})}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Nội dung bài viết..." 
                    className="min-h-[150px]"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createPostMutation.mutate()}
                  disabled={createPostMutation.isPending || !newPost.title || !newPost.content}
                >
                  {createPostMutation.isPending ? 'Đang đăng...' : 'Đăng bài'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm bài viết..." 
              className="pl-9 h-11 rounded-xl bg-muted/50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-muted/50">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="rounded-full px-4 h-8"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
            ))
          ) : posts?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Chưa có bài viết nào trong mục này.</p>
            </div>
          ) : (
            posts?.map((post) => (
              <Dialog key={post.id}>
                <DialogTrigger asChild>
                  <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                          {categories.find(c => c.id === post.category)?.label || 'Chung'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(post.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-muted">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {post.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-xs font-medium">{post.profiles?.display_name || 'Người dùng'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-xs">{post.community_comments?.[0]?.count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="text-xs">{post.community_likes?.[0]?.count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {categories.find(c => c.id === post.category)?.label || 'Chung'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.created_at), 'PPP', { locale: vi })}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl">{post.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {post.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold">{post.profiles?.display_name || 'Người dùng'}</span>
                    </div>
                  </DialogHeader>
                  <ScrollArea className="flex-1 p-6 pt-2">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {post.content}
                    </p>
                    <div className="mt-10 pt-6 border-t border-muted">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Bình luận ({post.community_comments?.[0]?.count || 0})
                      </h3>
                      <div className="text-center py-6 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground italic">Tính năng bình luận đang được phát triển...</p>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-muted bg-muted/10 flex gap-2">
                    <Input placeholder="Viết bình luận..." className="flex-1" />
                    <Button size="sm">Gửi</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
