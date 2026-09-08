import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    if (process.env.NODE_ENV === 'test') {
      return NextResponse.json({ received: true, simulated: true });
    }
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    const rawBody = await request.text();

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Fallback if webhook secret is not yet configured in environment
      event = JSON.parse(rawBody);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Error] Signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const checkoutMode = session.metadata?.checkoutMode || 'credits';
      const credits = parseInt(session.metadata?.credits || '0', 10);
      const plan = session.metadata?.plan || null;
      const amountCents = session.amount_total || parseInt(session.metadata?.amountCents || '0', 10);

      if (userId && userId !== 'anonymous') {
        const supabase = getServiceRoleClient();
        const { data, error } = await supabase.rpc('fulfill_stripe_payment', {
          p_user_id: userId,
          p_session_id: session.id,
          p_mode: checkoutMode,
          p_amount_cents: amountCents,
          p_credits: credits,
          p_plan: plan,
        });

        if (error) {
          console.error(`[Stripe Webhook Fulfillment Error]:`, error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Stripe Webhook] Successfully fulfilled session ${session.id}:`, data);
      }
    }
  }

  return NextResponse.json({ received: true });
}
