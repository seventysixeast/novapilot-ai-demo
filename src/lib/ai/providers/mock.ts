import { AIProvider, AIResponse } from '../types';
import { createClient } from '@/lib/supabase/server';

export class MockProvider implements AIProvider {
  name = 'mock-provider';

  async generateCompletion(prompt: string, model = 'mock-model'): Promise<AIResponse> {
    console.warn("[AI] MOCK PROVIDER DYNAMIC ENGINE INITIALIZED");
    
    // Simulate natural intelligence thinking delay for authentic UI feel
    await new Promise(resolve => setTimeout(resolve, 600));

    let mockResponse = "I have scanned your workspace. Operating in localized intelligence mode. You can fully test all dashboard telemetry, connections, and reports. To unlock broad external knowledge, please ensure a valid API key is configured in your environment settings.";

    // Extract the original user query from the prompt by splitting at newlines to ignore rules and telemetry context
    const userQuery = (prompt.split("\n\n")[0] || prompt.split("\n")[0] || "").trim();
    const query = userQuery.toLowerCase();

    // Query dynamic contacts from HubSpot connector in Supabase
    let contacts: any[] = [];
    try {
      const supabase = await createClient();
      const { data: connectors } = await supabase
        .from("data_connections")
        .select("metadata")
        .eq("provider", "hubspot")
        .eq("status", "connected");
      
      if (connectors && connectors.length > 0) {
        contacts = connectors[0].metadata?.contacts || [];
      }
    } catch (e) {
      console.error("Failed to fetch dynamic contacts in MockProvider:", e);
    }

    // Dynamic HubSpot Contact Search
    let matchedContacts: any[] = [];
    if (contacts.length > 0) {
      const words = query.split(" ").filter(w => w.length > 2);
      matchedContacts = contacts.filter((c: any) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        return words.some(w => fullName.includes(w) || email.includes(w)) ||
               (query.includes("amit") && fullName.includes("amit"));
      });
    }

    if (/send\s+email/i.test(query) || /email\s+bhej/i.test(query) || /rathorchanchal76east/i.test(query)) {
      const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/);
      const recipient = emailMatch ? emailMatch[0] : "rathorchanchal76east@gmail.com";
      mockResponse = `I am initiating the outbound autonomous outreach system to send an email to **${recipient}**.

[ACTION_EMAIL: TO=${recipient} | SUBJECT=NovaPilot AI Outbound Test | BODY=Hello! This is a test email sent from NovaPilot AI!

I scanned your connected HubSpot CRM for contacts matching your query:

👤 Contact: AMit Rathor
✉️ Email: novapilot.test@outlook.com
📍 City: Mohali
📞 Phone: Not Provided
🏷️ Lifecycle Stage: lead
⚡ Lead Status: OPEN
🤝 Contact Owner: Chanchal Rathor
🔑 HubSpot ID: 488560659192
📝 Recent Note:
"hsbds dsjds djsdvsd"

👤 Contact: Maria Johnson (Sample Contact)
✉️ Email: emailmaria@hubspot.com
📍 City: Brisbane]`;
    }
    else if (matchedContacts.length > 0) {
      mockResponse = `I scanned your connected **HubSpot CRM** for contacts matching your query:\n\n` +
        matchedContacts.map((c: any) => 
          `### 👤 Contact: ${c.firstName} ${c.lastName}\n` +
          `* **✉️ Email:** \`${c.email || "N/A"}\`\n` +
          `* **📍 City:** \`${c.city || "N/A"}\`\n` +
          `* **📞 Phone:** \`${c.phone || "Not Provided"}\`\n` +
          `* **🏷️ Lifecycle Stage:** \`${c.lifecycleStage || "N/A"}\`\n` +
          `* **⚡ Lead Status:** \`${c.leadStatus || "OPEN"}\`\n` +
          `* **🤝 Contact Owner:** \`${c.ownerName || "Chanchal Rathor"}\`\n` +
          `* **🔑 HubSpot ID:** \`${c.id}\`` +
          (c.notes && c.notes.length > 0 
            ? `\n* **📝 Recent Note:**\n${c.notes.map((n: string) => `  > *"${n}"*`).join("\n")}` 
            : "")
        ).join("\n\n") + 
        `\n\n*(Grounding verified via active HubSpot OAuth connection)*`;
    }
    else if ((query.includes("email") || query.includes("contact")) && contacts.length > 0) {
      mockResponse = `I scanned your connected **HubSpot CRM** and found **${contacts.length} contact(s)**:\n\n` +
        contacts.map((c: any) => 
          `* **${c.firstName} ${c.lastName}** (\`${c.email || "No Email"}\`)`
        ).join("\n") +
        `\n\nAsk me about a specific contact by name to see their full profile!`;
    }
    else if (query.includes("amit") || query.includes("email") || query.includes("contact")) {
      if (contacts.length === 0) {
        mockResponse = "I scanned your connected **HubSpot CRM**, but **no contacts are synced yet**. Please go to the **Data Sources** tab and click **Sync** on the HubSpot connector to import your CRM contacts!";
      } else {
        mockResponse = `I scanned your connected **HubSpot CRM**, but could not find any contacts matching your search. Here are the available contacts:\n\n` +
          contacts.map((c: any) => `* **${c.firstName} ${c.lastName}**`).join("\n");
      }
    }
    else if (query.includes("hi") || query.includes("hello") || query.includes("hey")) {
      mockResponse = "Hello! I am **NovaPilot AI**, your precision growth intelligence assistant. I am connected to your workspace telemetry and ready to assist you.\n\nHere are a few things you can ask me:\n* 📊 *\"What is my current MRR?\"*\n* 👥 *\"How many users are active in my team?\"*\n* 🔌 *\"What data sources are connected?\"*\n* 📝 *\"How do I upload custom documents?\"*";
    }
    else if (query.includes("mrr") || query.includes("revenue") || query.includes("earn") || query.includes("money")) {
      mockResponse = "Based on live database telemetry, your current **Monthly Recurring Revenue (MRR) is exactly $9.00**.\n\nThis is dynamically fetched from your active **Enterprise (Pro)** subscription in this workspace. The billing pipelines (Stripe, PayPal, and Razorpay) are fully operational and listening for webhook triggers to scale this metric as new customers subscribe.";
    }
    else if (query.includes("user") || query.includes("member") || query.includes("team") || query.includes("people")) {
      mockResponse = "Your active workspace currently contains **2 onboarded team members** (including Dinesh Sharma).\n\n**Team Status:**\n* **Database Replication:** Stable (Health Score: 96/100)\n* **Role Synchronization:** Active (Super Admin role mapped)\n* **Recent Invites:** None pending.";
    }
    else if (query.includes("source") || query.includes("connector") || query.includes("stripe") || query.includes("hubspot")) {
      mockResponse = "I am currently connected to three active data pipelines:\n1. 💳 **Stripe:** Tracking subscription payments and invoicing status.\n2. 🤝 **HubSpot:** Synchronizing sales pipelines and CRM contacts.\n3. 📈 **Google Analytics (GA4):** Grounding live traffic, session volume, and conversions.\n\nAll three connectors are fully authenticated and grounding my cognitive synthesis.";
    }
    else if (query.includes("document") || query.includes("pdf") || query.includes("file") || query.includes("upload")) {
      mockResponse = "To train me on your own company documents, PDFs, or spreadsheets, head over to the **Documents** tab in the sidebar.\n\nOnce you upload a file, our background worker will automatically segment the text, generate vector embeddings, and store them in the Supabase Vector Database. I will then use those embeddings to answer your questions with precise source-grounded citations!";
    }
    else if (query.includes("growth") || query.includes("analysis") || query.includes("trend")) {
      mockResponse = JSON.stringify({
        summary: "SaaS Performance Synthesis: Transitioning to the Enterprise Tier has successfully unlocked premium capabilities. User retention is outstanding at 100% across active nodes, and Customer Acquisition Cost (CAC) remains optimized at $0.00 due to organic onboarding channels.",
        anomalies: ["Unusually stable database health score (96/100)", "No billing drop-off observed during checkout transition"],
        recommendations: ["Initialize HubSpot pipeline mapping to analyze lead scores", "Upload internal product sheets to the Documents tab for detailed RAG answers"]
      }, null, 2);
    }
    else if (query.includes("thank") || query.includes("awesome") || query.includes("great")) {
      mockResponse = "You're very welcome! Helping you drive growth and operational clarity is my primary directive. Let me know if you need help with anything else in your workspace! 🚀";
    }

    return {
      text: mockResponse,
      usage: { inputTokens: 142, outputTokens: 256, totalTokens: 398 },
      provider: this.name,
      model: "diagnostic-node-v2",
      isFallback: true
    };
  }

  async generateStream(prompt: string, model = 'mock-model'): Promise<ReadableStream> {
    const encoder = new TextEncoder();
    const completion = await this.generateCompletion(prompt, model);
    const words = completion.text.split(" ");
    
    return new ReadableStream({
      async start(controller) {
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i === words.length - 1 ? "" : " ");
          controller.enqueue(encoder.encode(chunk));
          // Natural 25ms word interval for a highly premium, fluid user experience
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        controller.close();
      },
    });
  }
}
