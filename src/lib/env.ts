import { z } from "zod";

function parseCsvList(value: string | undefined, fallback: string) {
  return (value ?? fallback)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  
  // Default AI Routing
  DEFAULT_AI_PROVIDER: z.enum(["openai", "openrouter", "groq", "ollama"]).default("openrouter"),
  DEFAULT_LIGHTWEIGHT_MODEL: z.string().optional(),
  DEFAULT_PREMIUM_MODEL: z.string().optional(),
  AI_FALLBACK_ENABLED: z.string().optional().default("true").transform((v) => v === "true"),
  
  // Whitelists
  ADMIN_EMAILS: z.string().default("dineshsharma.developer@gmail.com").transform((value) => parseCsvList(value, "dineshsharma.developer@gmail.com")),
  TESTER_EMAILS: z.string().default("dineshsharma.developer@gmail.com").transform((value) => parseCsvList(value, "dineshsharma.developer@gmail.com")),

  // Billing providers
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_GROWTH: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_PLAN_STARTER_ID: z.string().optional(),
  PAYPAL_PLAN_GROWTH_ID: z.string().optional(),
  PAYPAL_PLAN_PRO_ID: z.string().optional(),
  PAYPAL_BRAND_NAME: z.string().default("NovaPilot AI"),
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER,
  DEFAULT_LIGHTWEIGHT_MODEL: process.env.DEFAULT_LIGHTWEIGHT_MODEL,
  DEFAULT_PREMIUM_MODEL: process.env.DEFAULT_PREMIUM_MODEL,
  AI_FALLBACK_ENABLED: process.env.AI_FALLBACK_ENABLED,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  TESTER_EMAILS: process.env.TESTER_EMAILS,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
  STRIPE_PRICE_GROWTH: process.env.STRIPE_PRICE_GROWTH,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
  PAYPAL_PLAN_STARTER_ID: process.env.PAYPAL_PLAN_STARTER_ID,
  PAYPAL_PLAN_GROWTH_ID: process.env.PAYPAL_PLAN_GROWTH_ID,
  PAYPAL_PLAN_PRO_ID: process.env.PAYPAL_PLAN_PRO_ID,
  PAYPAL_BRAND_NAME: process.env.PAYPAL_BRAND_NAME,
  PAYPAL_ENV: process.env.PAYPAL_ENV,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
});
