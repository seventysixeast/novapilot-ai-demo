import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const plans = [
  {
    plan_code: "basic",
    name: "Starter",
    description: "Ideal for growing organizations requiring high-confidence intelligence summaries.",
    price_monthly: 3.00,
    price_annual: 28.00,
    is_active: true,
    features: [
      "Basic AI Intelligence access",
      "1 Strategic Workspace",
      "Baseline Signal Analytics",
      "Weekly Intelligence Summaries",
      "Standard Response Time"
    ]
  },
  {
    plan_code: "pro",
    name: "Growth",
    description: "Strategic anomaly detection and collaboration for data-driven leadership teams.",
    price_monthly: 6.00,
    price_annual: 58.00,
    is_active: true,
    features: [
      "Advanced Signal Processing",
      "Anomaly Detection Engine",
      "Multi-user Collaboration",
      "Real-time Alert Synthesis",
      "Advanced Intelligence Analytics",
      "Priority Signal Access"
    ]
  },
  {
    plan_code: "enterprise",
    name: "Pro",
    description: "Full enterprise governance and unlimited intelligence capacity for large-scale operations.",
    price_monthly: 9.00,
    price_annual: 88.00,
    is_active: true,
    features: [
      "Unlimited AI Intelligence",
      "Full Governance Protocol",
      "Premium Analytics Suite",
      "Strategic Data Exports",
      "Private LLM Nodes",
      "Enterprise Signal Connectors"
    ]
  }
];

async function syncPlans() {
  console.log("🚀 Syncing Pricing Plans...");
  
  for (const plan of plans) {
    const { error } = await supabase
      .from("pricing_plans")
      .upsert(plan, { onConflict: "plan_code" });
    
    if (error) {
      console.error(`❌ Error syncing ${plan.name}:`, error.message);
    } else {
      console.log(`✅ Synced ${plan.name}`);
    }
  }
  
  console.log("✨ All plans synchronized successfully.");
}

syncPlans();
