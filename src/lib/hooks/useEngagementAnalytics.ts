import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";

export function useEngagementAnalytics(adId: string) {
    const ref = useRef<HTMLDivElement>(null);
    const { addReward, deductCredits, user, updateStreak } = useUser();
    const { addToast } = useToast();
    const hasViewedRef = useRef(false);
    const [isLiked, setIsLiked] = useState(false);

    const logAction = async (type: string, points: number, creditsToDeduct?: number) => {
        let actionName = "Engaged with Ad";
        if (type === 'view') actionName = "Viewed Ad";
        if (type === 'click') actionName = "Clicked Ad CTA";
        if (type === 'like') actionName = "Liked Ad";
        
        // Update streak logic
        updateStreak();
        
        // Apply multiplier
        let finalPoints = points;
        if (user && user.currentStreak >= 2) {
            finalPoints = points * 2;
            if (points > 0) {
              addToast(`🔥 Streak Bonus! ${finalPoints} Points Earned.`, 'success');
            }
        } else if (points > 0) {
            addToast(`Earned ${points} points for engagement!`, 'success');
        }

        addReward(finalPoints, actionName);
        if (creditsToDeduct) {
            deductCredits(creditsToDeduct);
        }
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here' && user) {
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.from('engagements').insert({ user_id: user.id, ad_id: adId, engagement_type: type });
                if (type === 'like') {
                    await supabase.rpc('increment_ad_likes', { target_ad_id: adId });
                }
            } catch (e) {
                console.error("Supabase engagement logging failed", e);
            }
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasViewedRef.current) {
                    setTimeout(() => {
                        if (ref.current && ref.current.getBoundingClientRect().top >= 0) {
                            console.log(`[Analytics] Ad ${adId} viewed for 2+ seconds.`);
                            hasViewedRef.current = true;
                            logAction('view', 1);
                        }
                    }, 2000);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [adId, addReward, user]);

    const logClick = () => {
        console.log(`[Analytics] CTA Clicked on Ad ${adId}`);
        logAction('click', 5);
    };

    const logLike = () => {
        if (!isLiked) {
            setIsLiked(true);
            console.log(`[Analytics] Ad ${adId} Liked`);
            logAction('like', 2);
        }
    };

    return { ref, logClick, logLike, isLiked };
}
