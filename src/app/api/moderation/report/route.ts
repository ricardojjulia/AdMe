import { NextResponse } from "next/server";
import { arbitrateUserReport } from "@/lib/moderation/aiModerator";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adId, reason, reportId } = body;

    if (!adId || !reason) {
      return NextResponse.json({ error: "Missing adId or reason parameter" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Fetch ad content
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ error: "Ad not found in database" }, { status: 404 });
    }

    // Run AI arbitration
    const arbitration = await arbitrateUserReport(
      ad.headline || "",
      ad.content_text || "",
      reason
    );

    console.log(`[AI Report Arbitration] Result for ad ${adId}:`, arbitration);

    // If reportId is provided, record arbitration decision in DB
    if (reportId) {
      await supabase.rpc('arbitrate_ad_report', {
        p_report_id: reportId,
        p_should_takedown: arbitration.shouldTakedown,
        p_terminate_merchant: arbitration.terminateMerchant,
        p_decision: arbitration.decision
      });
    } else if (arbitration.shouldTakedown) {
      // Direct takedown if no prior report ID
      await supabase
        .from('ads')
        .update({ 
          status: 'takedown',
          takedown_at: new Date().toISOString(),
          takedown_reason: arbitration.decision
        })
        .eq('id', adId);
    }

    return NextResponse.json({
      success: true,
      takedownApplied: arbitration.shouldTakedown,
      merchantTerminated: arbitration.terminateMerchant,
      decision: arbitration.decision
    });

  } catch (error: any) {
    console.error("[Report Arbitration API Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
