/**
 * Portfolio Management — exports
 *
 * Pure analysis (health, capacity, patterns) plus the repository that feeds it
 * from ClientPortfolio rows.
 */

export {
    WEEKLY_CAPACITY_HOURS,
    STAGE_WEEKLY_HOURS,
    calculateWeeklyLoad,
    calculatePortfolioHealthScore,
    type LifecycleStage,
    type PortfolioClientView,
    type CapacityLoad,
    type PortfolioHealth,
} from './portfolio-health';

export {
    detectPortfolioPatterns,
    type DetectedPattern,
    type PortfolioPatternType,
    type PatternSeverity,
    type PortfolioPatternInputs,
} from './portfolio-patterns';

export { loadPortfolioClients, persistPatterns } from './repository';
