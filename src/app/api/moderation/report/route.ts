import { NextResponse } from "next/server";
import { arbitrateUserReport } from "@/lib/moderation/aiModerator";
import { getServiceRoleClient } from "@/lib/supabase/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adId, reason, reportId, headline, contentText, notes } = body;

    if (!adId || !reason) {
      return NextResponse.json(
        { error: "Missing adId or reason parameter" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const isUuid = UUID_REGEX.test(adId);

    let ad: any = null;

    // Only query database if adId is a valid UUID
    if (isUuid) {
      const { data: dbAd } = await supabase
        .from("ads")
        .select("*")
        .eq("id", adId)
        .maybeSingle();

      ad = dbAd;
    }

    // Determine content to arbitrate
    const arbitrateHeadline = headline || ad?.headline || "Reported Item";
    const arbitrateContent =
      contentText || ad?.content_text || "User-submitted report";
    const arbitrateReason = notes
      ? `${reason} - Details: ${notes}`
      : reason;

    // Run automated AI safety arbitration (COUNCIL-2026-005)
    const arbitration = await arbitrateUserReport(
      arbitrateHeadline,
      arbitrateContent,
      arbitrateReason
    );

    console.log(
      `[AI Report Arbitration] Result for item ${adId} (DB Ad: ${Boolean(ad)}):`,
      arbitration
    );

    // If reportId is provided and item is a database ad, record arbitration in DB
    if (ad && reportId) {
      try {
        await supabase.rpc("arbitrate_ad_report", {
          p_report_id: reportId,
          p_should_takedown: arbitration.shouldTakedown,
          p_terminate_merchant: arbitration.terminateMerchant,
          p_decision: arbitration.decision,
        });
      } catch (rpcErr) {
        console.warn("RPC arbitrate_ad_report warning:", rpcErr);
      }
    } else if (ad && arbitration.shouldTakedown) {
      // Direct takedown if no prior report ID
      await supabase
        .from("ads")
        .update({
          status: "takedown",
          takedown_at: new Date().toISOString(),
          takedown_reason: arbitration.decision,
        })
        .eq("id", adId);
    }

    return NextResponse.json({
      success: true,
      takedownApplied: arbitration.shouldTakedown,
      merchantTerminated: arbitration.terminateMerchant,
      decision: arbitration.decision,
      isDatabaseAd: Boolean(ad),
    });
  } catch (error: any) {
    console.error("[Report Arbitration API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
