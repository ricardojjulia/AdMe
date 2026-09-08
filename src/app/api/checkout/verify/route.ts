import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    console.log(`[Stripe Checkout Verify] Verifying session: ${sessionId}`);

    // Handle test / simulated sessions
    if (sessionId.startsWith('cs_test_') || process.env.NODE_ENV === 'test') {
      return NextResponse.json({
        success: true,
        verified: true,
        isSimulated: true,
        sessionId,
        message: "Simulated checkout verified successfully."
      });
    }

    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // 1. Retrieve session from Stripe directly
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        verified: false,
        paymentStatus: session.payment_status,
        message: `Payment status is ${session.payment_status}, not paid.`
      }, { status: 400 });
    }

    // 2. Extract metadata
    const userId = session.metadata?.userId;
    const checkoutMode = session.metadata?.checkoutMode || 'credits';
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const plan = session.metadata?.plan || null;
    const amountCents = session.amount_total || parseInt(session.metadata?.amountCents || '0', 10);

    if (!userId || userId === 'anonymous') {
      console.warn(`[Stripe Checkout Verify] Anonymous user in session ${sessionId}, fulfillment skipped.`);
      return NextResponse.json({
        success: true,
        verified: true,
        anonymous: true,
        message: "Payment verified for guest user."
      });
    }

    // 3. Atomically fulfill in Supabase with strict idempotency
    const supabase = getServiceRoleClient();
    const { data: fulfillment, error: rpcError } = await supabase.rpc('fulfill_stripe_payment', {
      p_user_id: userId,
      p_session_id: session.id,
      p_mode: checkoutMode,
      p_amount_cents: amountCents,
      p_credits: credits,
      p_plan: plan,
    });

    if (rpcError) {
      console.error("[Stripe Checkout Verify RPC Error]:", rpcError);
      return NextResponse.json({
        error: "Failed to fulfill payment in database: " + rpcError.message
      }, { status: 500 });
    }

    console.log(`[Stripe Checkout Verify] Fulfillment result:`, fulfillment);

    return NextResponse.json({
      success: true,
      verified: true,
      sessionId: session.id,
      mode: checkoutMode,
      creditsAdded: fulfillment?.credits_added ?? credits,
      plan: fulfillment?.plan_tier ?? plan,
      alreadyFulfilled: fulfillment?.already_fulfilled ?? false,
      newBalance: fulfillment?.new_balance,
      message: fulfillment?.already_fulfilled 
        ? "Payment was previously fulfilled." 
        : "Payment verified and fulfilled successfully."
    });

  } catch (error: any) {
    console.error("[Stripe Verify Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
