/**
 * Learning Confidence System — three-tier classification
 */

export const CONFIDENCE_THRESHOLDS = {
  flag_only: 0.50,
  emerging: 0.65,
  tentative: 0.80,
  validated: 0.90,
  contradicted: 0.40,
} as const;

export type ConfidenceLabel = 'single_observation' | 'emerging' | 'validated' | 'contradicted';

export function getConfidenceLevel(dataPoints: number, hasContradiction: boolean): {
  confidence: number;
  label: ConfidenceLabel;
} {
  if (hasContradiction) return { confidence: CONFIDENCE_THRESHOLDS.contradicted, label: 'contradicted' };
  if (dataPoints >= 3) return { confidence: CONFIDENCE_THRESHOLDS.validated, label: 'validated' };
  if (dataPoints >= 2) return { confidence: CONFIDENCE_THRESHOLDS.emerging, label: 'emerging' };
  return { confidence: CONFIDENCE_THRESHOLDS.flag_only, label: 'single_observation' };
}

export function getSignificance(dataPoints: number, hasContradiction: boolean): string {
  if (hasContradiction) return 'contradicted';
  if (dataPoints >= 3) return 'validated';
  if (dataPoints >= 2) return 'tentative';
  return 'flag_only';
}
