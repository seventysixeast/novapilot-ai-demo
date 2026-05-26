import { createClient } from "@/lib/supabase/server";
import { DemoTour } from "@/components/dashboard/demo-tour";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DevAIWidget } from "@/components/dashboard/dev-ai-widget";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { PaymentWall } from "@/components/dashboard/payment-wall";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/server/tenant";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();
  let hasActiveSubscription = false;

  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email;

  if (membership) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("organization_id", membership.organizationId)
      .maybeSingle();
    
    hasActiveSubscription = sub?.status === "active" || sub?.status === "trialing";

    if (membership.isInternalTester) {
      hasActiveSubscription = true;
    }
  }

  return (
    <MouseGlow>
      <div className="relative">
        <DemoTour />
        
        <DashboardShell 
          userEmail={userEmail} 
          role={membership?.role}
        >
          {children}
        </DashboardShell>

        <PaymentWall hasActiveSubscription={hasActiveSubscription} />
        <DevAIWidget isTester={!!membership?.isInternalTester} />
      </div>
    </MouseGlow>
  );
}
