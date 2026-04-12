/**
 * Learning Library — Barrel Export
 */

export { validateNoClientPII, anonymizeLearningValue } from './anonymizer';
export { CONFIDENCE_THRESHOLDS, getConfidenceLevel, getSignificance } from './confidence';
export { getDistributionTargets, createDistributionNotices, processPendingNotices, LEARNING_DISTRIBUTION_MAP } from './distribution';
export { collectFromAgent3 } from './collectors/from-agent3';
export { collectFromAgent4 } from './collectors/from-agent4';
export { collectFromAgent5 } from './collectors/from-agent5';
export { collectFromAgent6 } from './collectors/from-agent6';
export { updateSignalWeight, updateMultiplier, clampMultiplier } from './updaters/signal-weights';
