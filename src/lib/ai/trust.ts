type ConfidenceInput = {
  sourceCount: number;
  freshSourceCount: number;
  usedFallback: boolean;
  hadGenerationError: boolean;
};

export function calculateDeterministicConfidence(input: ConfidenceInput) {
  let score = 35;
  score += Math.min(input.sourceCount, 4) * 12;
  score += Math.min(input.freshSourceCount, 4) * 8;

  if (input.usedFallback) score -= 28;
  if (input.hadGenerationError) score -= 20;

  return clamp(score, 0, 100);
}

export function freshnessStatus(freshSourceCount: number, sourceCount: number) {
  if (!sourceCount) return "unknown" as const;
  if (freshSourceCount === sourceCount) return "fresh" as const;
  return "stale" as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
