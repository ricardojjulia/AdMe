"use client";

import { Ad } from "@/types/ad";
import Image from "next/image";

interface AdCardProps {
    ad: Ad;
}

export function SocialAdCard({ ad }: AdCardProps) {
    return (
        <article className="card flex flex-col w-full max-w-[470px] mx-auto animate-fade-in mb-8 overflow-hidden bg-background border border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                    <Image
                        src={ad.advertiser.avatar}
                        alt={ad.advertiser.name}
                        width={36}
                        height={36}
                        className="rounded-full bg-muted border border-border"
                    />
                    <div className="flex flex-col leading-tight">
                        <span className="font-bold text-sm text-foreground">{ad.advertiser.name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Sponsored</span>
                    </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground text-xl leading-none">
                    &bull;&bull;&bull;
                </button>
            </div>

            {/* Content Text - Social Feed Style */}
            <div className="px-3.5 pb-2">
                <h3 className="font-bold text-base leading-snug mb-1">{ad.content.headline}</h3>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{ad.content.text}</p>
            </div>

            {/* Media - Clean, no overlays */}
            <div className="relative w-full aspect-square bg-muted border-t border-b border-border/50">
                <Image
                    src={ad.content.mediaUrl}
                    alt="Ad Media"
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>

            {/* Action Bar */}
            <div className="p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xl">
                        <button className="hover:text-primary transition-colors">♡</button>
                        <button className="hover:text-primary transition-colors">💬</button>
                        <button className="hover:text-primary transition-colors">↗</button>
                    </div>
                    <button className="hover:text-primary transition-colors">🔖</button>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">{ad.metrics.likes.toLocaleString()} likes</span>
                </div>

                <a
                    href={ad.cta.url}
                    className="block w-full py-2.5 text-center bg-primary/10 text-primary font-semibold text-sm rounded-lg hover:bg-primary/20 transition-colors mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: ad.content.primaryColor, backgroundColor: `${ad.content.primaryColor}20` }}
                >
                    {ad.cta.label}
                </a>
            </div>
        </article>
    );
}
