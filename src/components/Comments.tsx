"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/UserContext";

interface Comment {
  id: string;
  ad_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export function Comments({ adId }: { adId: string }) {
  const { user, t } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;
    
    async function loadComments() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
        // Fetch existing
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('ad_id', adId)
          .order('created_at', { ascending: true });
          
        if (data) setComments(data);
        
        // Subscribe to new
        channel = supabase
          .channel(`public:comments:${adId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `ad_id=eq.${adId}` }, (payload) => {
            setComments(prev => [...prev, payload.new as Comment]);
          })
          .subscribe();
      }
      setLoading(false);
    }
    
    loadComments();
    
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [adId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    const content = newComment.trim();
    setNewComment(""); // Optimistic clear
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // We rely on realtime to show the comment, or we could optimistically add it.
    // Realtime is fast enough locally.
    await supabase.from('comments').insert({
      ad_id: adId,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar,
      content: content
    });
  };

  return (
    <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--background)/0.5)', marginTop: '0.5rem' }}>
      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {loading ? (
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>{t('loading_comments')}</div>
        ) : comments.length === 0 ? (
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>{t('no_comments')}</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'hsl(var(--primary)/0.2)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>
                {comment.user_avatar}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
                  {comment.user_name}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={t('add_comment_placeholder')}
            style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '1rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--input))', color: 'hsl(var(--foreground))', outline: 'none' }}
          />
          <button type="submit" disabled={!newComment.trim()} style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none', borderRadius: '1rem', padding: '0 1rem', fontWeight: 500, cursor: newComment.trim() ? 'pointer' : 'not-allowed', opacity: newComment.trim() ? 1 : 0.5 }}>
            {t('post_comment')}
          </button>
        </form>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{t('login_to_comment')}</div>
      )}
    </div>
  );
}
