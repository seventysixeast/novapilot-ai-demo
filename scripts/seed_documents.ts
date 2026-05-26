import dotenv from "dotenv";
import path from "path";

// Ensure environment variables are loaded FIRST
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000000";
const SUPERADMIN_ID = "11111111-1111-1111-1111-111111111111";

const DOCUMENTS = [
  {
    title: "Nova AI Return Policy",
    collectionName: "Policies",
    rawText: "Our global return policy allows customers to return any product within 30 days of purchase for a full refund. Returns after 30 days but before 60 days are eligible for store credit only. No returns are accepted after 60 days. Products must be in original packaging and unused."
  },
  {
    title: "Nova AI Shipping Rates",
    collectionName: "Policies",
    rawText: "Standard shipping is free for all orders over $50. For orders under $50, standard shipping costs $4.99. Express shipping is available for a flat rate of $14.99 and guarantees delivery within 2 business days. Overnight shipping is available for $24.99."
  },
  {
    title: "Nova AI Support Hours",
    collectionName: "Support",
    rawText: "Our customer support team is available 24/7 for Enterprise customers. For Pro customers, support is available Monday to Friday from 9 AM to 6 PM EST. For Free/Basic tier users, support is email-only and queries are typically resolved within 24 to 48 hours."
  }
];

async function main() {
  console.log("🚀 Starting seeding test documents...");
  
  // Dynamically import ingest function after env is loaded
  const { ingestKnowledgeDocument } = await import("../src/lib/documents/ingest");
  
  for (const doc of DOCUMENTS) {
    console.log(`Ingesting "${doc.title}"...`);
    try {
      const result = await ingestKnowledgeDocument({
        organizationId: DEMO_ORG_ID,
        userId: SUPERADMIN_ID,
        title: doc.title,
        sourceType: "paste",
        collectionName: doc.collectionName,
        rawText: doc.rawText,
        tags: ["test", doc.collectionName.toLowerCase()]
      });
      console.log(`✅ Ingested successfully: Document ID: ${result.documentId}, chunks: ${result.chunkCount}`);
    } catch (e) {
      console.error(`❌ Failed to ingest "${doc.title}":`, e);
    }
  }
  
  console.log("✨ Document seeding complete!");
}

main().catch(console.error);
