import { NextResponse } from "next/server";
import { evaluateAdCreative } from "@/lib/moderation/aiModerator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { headline, contentText, mediaUrl, ctaUrl, category } = body;

    if (!headline) {
      return NextResponse.json({ error: "Missing headline parameter" }, { status: 400 });
    }

    const result = await evaluateAdCreative({
      headline,
      contentText,
      mediaUrl,
      ctaUrl,
      category
    });

    return NextResponse.json({
      success: true,
      moderation: result
    });

  } catch (error: any) {
    console.error("[Moderation API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
