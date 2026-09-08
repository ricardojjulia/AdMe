"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./Comments.module.css";

export interface CommentItem {
  id: string;
  ad_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
  isOptimistic?: boolean;
}

const DEFAULT_SEED_COMMENTS: Record<string, CommentItem[]> = {
  default: [
    {
      id: "seed-1",
      ad_id: "default",
      user_id: "u-seed-1",
      user_name: "Elena M.",
      user_avatar: "E",
      content: "Love seeing authentic local brands here! Definitely bookmarking this.",
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    },
    {
      id: "seed-2",
      ad_id: "default",
      user_id: "u-seed-2",
      user_name: "Marcus V.",
      user_avatar: "M",
      content: "Great value exchange concept. Much better than typical invasive ads.",
      created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
    }
  ]
};

function formatRelativeTime(dateStr: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return "Recently";
  }
}

export function Comments({ adId }: { adId: string }) {
  const { user, addReward, t } = useUser();
  const { addToast } = useToast();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(true);

  const storageKey = `adme_comments_${adId}`;

  // 1. Initial load from local storage & Supabase
  useEffect(() => {
    let isMounted = true;
    let channel: any;

    async function initializeComments() {
      let initialComments: CommentItem[] = [];

      // A. Check localStorage first
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            initialComments = JSON.parse(cached);
          }
        } catch (e) {
          console.error("Failed to parse cached comments:", e);
        }
      }

      // If no cached comments, seed with realistic starter comments
      if (initialComments.length === 0) {
        initialComments = DEFAULT_SEED_COMMENTS.default.map((c, i) => ({
          ...c,
          id: `seed-${adId}-${i}`,
          ad_id: adId
        }));
      }

      if (isMounted) {
        setComments(initialComments);
        setLoading(false);
      }

      // B. Try Supabase cloud/local fetch
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url_here"
      ) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();

          const { data, error } = await supabase
            .from("comments")
            .select("*")
            .eq("ad_id", adId)
            .order("created_at", { ascending: true });

          if (data && !error && data.length > 0 && isMounted) {
            setComments((prev) => {
              // Merge remote with local un-persisted comments
              const existingIds = new Set(data.map((c: any) => c.id));
              const localOnly = prev.filter((c) => !existingIds.has(c.id));
              const combined = [...data, ...localOnly];
              if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, JSON.stringify(combined));
              }
              return combined;
            });
          }

          // C. Realtime subscription
          channel = supabase
            .channel(`public:comments:${adId}:${Math.random().toString(36).substring(2, 7)}`)
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "comments", filter: `ad_id=eq.${adId}` },
              (payload) => {
                if (payload.new && isMounted) {
                  setComments((prev) => {
                    if (prev.some((c) => c.id === payload.new.id)) return prev;
                    const updated = [...prev, payload.new as CommentItem];
                    if (typeof window !== "undefined") {
                      localStorage.setItem(storageKey, JSON.stringify(updated));
                    }
                    return updated;
                  });
                }
              }
            )
            .subscribe();
        } catch (err) {
          console.warn("Supabase comments subscription non-fatal notice:", err);
        }
      }
    }

    initializeComments();

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, [adId, storageKey]);

  // 2. Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;

    const authorName = user?.name || guestName.trim() || "Community Member";
    const authorAvatar = user?.avatar || (guestName.trim() ? guestName.trim().charAt(0).toUpperCase() : "👤");
    const authorId = user?.id || `guest-${Date.now()}`;

    const newCommentObj: CommentItem = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ad_id: adId,
      user_id: authorId,
      user_name: authorName,
      user_avatar: authorAvatar,
      content,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    // A. Optimistic UI update (immediate!)
    setComments((prev) => {
      const updated = [...prev, newCommentObj];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (err) {
          console.warn("LocalStorage save error:", err);
        }
      }
      return updated;
    });

    setNewComment("");

    // B. Value-exchange rewards (+2 points for contributing!)
    addReward(2, "Community Comment");
    addToast(t("comment_posted_toast") || "Comment posted! +2 points earned", "success");

    // C. Background sync to Supabase
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url_here"
    ) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("comments").insert({
          ad_id: adId,
          user_id: authorId,
          user_name: authorName,
          user_avatar: authorAvatar,
          content
        });
      } catch (err) {
        console.warn("Supabase comment sync error (preserved locally):", err);
      }
    }
  };

  return (
    <div className={styles.commentsContainer}>
      <div className={styles.headerRow}>
        <div className={styles.commentCountBadge}>
          <span>💬</span>
          <span>
            {comments.length} {comments.length === 1 ? t("comment") : `${t("comment")}s`}
          </span>
        </div>
        <div className={styles.rewardHint}>
          ✨ +2 pts per comment
        </div>
      </div>

      <div className={styles.commentsList}>
        {loading ? (
          <div className={styles.emptyState}>{t("loading_comments") || "Loading comments..."}</div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyState}>{t("no_comments") || "No comments yet. Be the first!"}</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.avatar}>
                {comment.user_avatar}
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.userName}>{comment.user_name}</span>
                  {!user && comment.user_id.startsWith("guest") && (
                    <span className={styles.guestBadge}>{t("guest_badge") || "Guest"}</span>
                  )}
                  <span className={styles.timestamp}>{formatRelativeTime(comment.created_at)}</span>
                </div>
                <div className={styles.content}>{comment.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("add_comment_placeholder") || "Add a comment..."}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className={styles.submitBtn}
          >
            {t("post_comment") || "Post"}
          </button>
        </div>

        {!user && (
          <div className={styles.guestRow}>
            <span>Commenting as:</span>
            <input
              type="text"
              placeholder={t("guest_name_placeholder") || "Your name (Guest)"}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={styles.guestNameInput}
            />
          </div>
        )}
      </form>
    </div>
  );
}
