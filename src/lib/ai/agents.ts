import { aiRouter } from "./router";
import { searchKnowledge } from "./vector";

export interface AgentResponse {
  summary: string;
  recommendations: string[];
  anomalies: string[];
}

export class GrowthAgent {
  constructor(private orgId: string) {}

  async analyzeGrowth(dataContext: string): Promise<AgentResponse> {
    const knowledge = await searchKnowledge("growth metrics and revenue trends", this.orgId);
    const knowledgeContext = knowledge.map(k => k.content).join('\n');

    const prompt = `
      You are the NovaPilot Strategic Growth Agent.
      
      Data Context:
      ${dataContext}
      
      Additional Knowledge Base Context:
      ${knowledgeContext}
      
      Tasks:
      1. Provide a high-level executive summary of current growth velocity.
      2. Identify any anomalies (spikes or drops) in MRR, Churn, or CAC.
      3. Recommend 3 concrete strategic actions to accelerate growth.
      
      Format your response as a valid JSON object:
      {
        "summary": "...",
        "anomalies": ["...", "..."],
        "recommendations": ["...", "..."]
      }
    `;

    const response = await aiRouter.generateCompletion(prompt, "PREMIUM");
    try {
      // Find the JSON block if the model returned markdown
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : response.text;
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("[AGENT] Parsing failed:", e);
      return {
        summary: response.text,
        anomalies: [],
        recommendations: []
      };
    }
  }

  async explainAnomaly(anomalyDescription: string): Promise<string> {
    const prompt = `
      Explain this growth anomaly in business terms: ${anomalyDescription}
      Identify potential causes (e.g., campaign performance, seasonal churn, or billing issues).
    `;
    const response = await aiRouter.generateCompletion(prompt, "LIGHTWEIGHT");
    return response.text;
  }
}
