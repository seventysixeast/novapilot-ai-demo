import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function apply() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Applying system organization...");

  const { error } = await supabase.from("organizations").upsert({
    id: "00000000-0000-0000-0000-000000000000",
    name: "NovaPilot Global System",
    slug: "system-workspace"
  }, { onConflict: "id" });

  if (error) console.error("Error seeding system org:", error);
  else console.log("System organization established.");
}

apply();
