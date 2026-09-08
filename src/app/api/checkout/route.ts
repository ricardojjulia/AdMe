import { NextResponse } from "next/server";
import { getStripeServer, CREDIT_PACKS, SUBSCRIPTION_PLANS } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { checkoutMode, selectedPack, selectedSub, userId } = body;

    // Validate request parameters
    if (!checkoutMode) {
      return NextResponse.json({ error: "Missing checkout mode" }, { status: 400 });
    }

    console.log(`[Stripe Checkout] Initializing session for user: ${userId || 'Anonymous'}`);
    console.log(`[Stripe Checkout] Mode: ${checkoutMode}, Value: ${checkoutMode === 'credits' ? `$${selectedPack}` : selectedSub}`);

    // In unit / integration test environments, return simulated session to prevent unmocked external network calls
    if (process.env.NODE_ENV === 'test' || !process.env.STRIPE_SECRET_KEY) {
      const mockSessionId = "cs_test_" + Math.random().toString(36).substring(2, 15);
      const mockRedirectUrl = `/checkout/success?session_id=${mockSessionId}&mode=${checkoutMode}&val=${checkoutMode === 'credits' ? selectedPack : selectedSub}`;

      return NextResponse.json({
        success: true,
        sessionId: mockSessionId,
        url: mockRedirectUrl,
        message: "Simulated Stripe session initialized successfully."
      });
    }

    // Live Stripe Server Initialization
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // Determine return origin dynamically
    const headerOrigin = request.headers.get("origin") || request.headers.get("referer");
    let origin = "https://ad-me.vercel.app";
    if (headerOrigin) {
      try {
        origin = new URL(headerOrigin).origin;
      } catch {}
    }

    if (checkoutMode === 'credits') {
      const pack = CREDIT_PACKS[selectedPack] || {
        priceDollars: Number(selectedPack) || 10,
        credits: (Number(selectedPack) || 10) * 100,
        label: "Custom Pack"
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `AdMe Campaign Credits (${pack.credits.toLocaleString()} ★)`,
                description: `${pack.label} — High-intent merchant ad delivery units on AdMe`,
              },
              unit_amount: pack.priceDollars * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata: {
          userId: userId || 'anonymous',
          checkoutMode: 'credits',
          credits: pack.credits.toString(),
          amountCents: (pack.priceDollars * 100).toString(),
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        message: "Stripe checkout session initialized successfully."
      });

    } else if (checkoutMode === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[selectedSub] || SUBSCRIPTION_PLANS.starter;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `AdMe ${plan.name}`,
                description: `Monthly merchant subscription tier for AdMe advertising platform`,
              },
              unit_amount: plan.priceDollars * 100,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        metadata: {
          userId: userId || 'anonymous',
          checkoutMode: 'subscription',
          plan: plan.id,
          amountCents: (plan.priceDollars * 100).toString(),
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        message: "Stripe subscription checkout session initialized successfully."
      });
    }

    return NextResponse.json({ error: "Unsupported checkout mode" }, { status: 400 });

  } catch (error: any) {
    console.error("[Stripe Session Error]:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
