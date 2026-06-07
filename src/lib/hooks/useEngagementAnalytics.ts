import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";

export function useEngagementAnalytics(adId: string) {
    const ref = useRef<HTMLDivElement>(null);
    const { addReward, deductCredits, user, updateStreak } = useUser();
    const { addToast } = useToast();
    const hasViewedRef = useRef(false);
    const [isLiked, setIsLiked] = useState(false);

    const logAction = async (type: string, points: number, creditsToDeduct?: number, viewDurationSeconds?: number) => {
        let actionName = "Engaged with Ad";
        if (type === 'view' || type === 'view_reward') actionName = "Viewed Ad";
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

        if (points > 0) {
            addReward(finalPoints, actionName);
        }
        if (creditsToDeduct) {
            deductCredits(creditsToDeduct);
        }
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here' && user) {
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                
                // Only write to engagements if it's not a temporary UI view reward type
                if (type !== 'view_reward') {
                    const insertPayload: any = { 
                        user_id: user.id, 
                        ad_id: adId, 
                        engagement_type: type 
                    };
                    if (type === 'view' && typeof viewDurationSeconds === 'number') {
                        insertPayload.view_duration_seconds = viewDurationSeconds;
                    }
                    await supabase.from('engagements').insert(insertPayload);
                }
                
                if (type === 'like') {
                    await supabase.rpc('increment_ad_likes', { target_ad_id: adId });
                }
            } catch (e) {
                console.error("Supabase engagement logging failed", e);
            }
        }
    };

    useEffect(() => {
        const isIntersectingRef = { current: false };
        const startTimeRef = { current: null as number | null };

        const handleViewExit = () => {
            isIntersectingRef.current = false;
            if (startTimeRef.current !== null) {
                const durationMs = Date.now() - startTimeRef.current;
                const durationSec = parseFloat((durationMs / 1000).toFixed(1));
                startTimeRef.current = null;
                
                console.log(`[Analytics] Ad ${adId} viewed for ${durationSec} seconds on exit.`);
                
                // Only log if they viewed for at least 0.5s to avoid scroll noise
                if (durationSec >= 0.5) {
                    logAction('view', 0, undefined, durationSec);
                }
            }
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    isIntersectingRef.current = true;
                    startTimeRef.current = Date.now();
                    
                    // Trigger the 2-second points reward timeout if not already viewed in this session/device
                    const currentStart = startTimeRef.current;
                    setTimeout(() => {
                        if (
                            isIntersectingRef.current && 
                            startTimeRef.current === currentStart
                        ) {
                            const rewardKey = `adme_ad_view_rewarded_${adId}`;
                            const alreadyRewarded = typeof window !== 'undefined' && !!localStorage.getItem(rewardKey);
                            if (!alreadyRewarded) {
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem(rewardKey, 'true');
                                }
                                console.log(`[Analytics] Ad ${adId} viewed for 2+ continuous seconds. Awarding points.`);
                                logAction('view_reward', 1);
                            }
                        }
                    }, 2000);
                } else {
                    // Exiting viewport
                    handleViewExit();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            handleViewExit();
            observer.disconnect();
        };
    }, [adId, user]);

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
