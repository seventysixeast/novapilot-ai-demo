import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { requireRazorpay } from "@/lib/razorpay";
import { PRICING_PLANS } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const planCode = body.planCode || "basic";
    const interval = body.interval || "monthly";
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = PRICING_PLANS[planCode as keyof typeof PRICING_PLANS] || PRICING_PLANS.basic;
    const razorpay = requireRazorpay();

    console.log("[RAZORPAY DEBUG] Using Key ID:", (process.env.RAZORPAY_KEY_ID || "not found").slice(0, 8) + "...");
    
    const basePrice = interval === "annual" ? (plan.price || 6) * 0.8 * 12 : (plan.price || 6);
    const amount = Math.round(basePrice * 100 * 84); // Default to $6 if plan price missing, convert to Paise (INR)
    
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-10)}`, // Shorter receipt ID
      notes: {
        organizationId: membership.organizationId,
        userId: membership.userId,
        planCode: planCode,
      },
    };

    console.log("[RAZORPAY DEBUG] Creating order with options:", JSON.stringify(options, null, 2));

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_SpdMhg4UDo3oOv",
    });
  } catch (error: any) {
    console.error("[RAZORPAY ERROR]:", error);
    return NextResponse.json({ 
      error: error.message || "Order creation failed",
      details: typeof error === "object" ? JSON.stringify(error) : String(error)
    }, { status: 500 });
  }
}
