import type { RiskRule } from "./contracts";

export function detectRiskRule(message: string, rules: RiskRule[]): RiskRule | undefined {
  return rules.find((rule) => rule.keywords.some((keyword) => message.includes(keyword)));
}
