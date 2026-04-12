/**
 * Types for PVision Lead Routing Agent
 *
 * Qualifies inbound plumbing/HVAC service requests,
 * routes them to the right technician, and sends auto-replies.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export type RequestChannel = "phone" | "website" | "referral" | "google_ads" | "nextdoor" | "yelp" | "other";

export type ServiceUrgency = "emergency_now" | "urgent_today" | "this_week" | "flexible";

export type ServiceCategory = "plumbing" | "hvac" | "drain_cleaning" | "water_heater" | "ac_repair" | "furnace" | "general" | "other";

export interface LeadRoutingContext {
  /** Inbound request details */
  inboundRequest?: {
    channel?: RequestChannel;
    customerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
  };
  /** Service type requested */
  serviceType?: ServiceCategory;
  /** Urgency level */
  urgency?: ServiceUrgency;
  /** Customer location */
  location?: string;
  /** Available technicians with specializations */
  availableTechs?: Array<{
    name: string;
    specializations: string[];
    currentLoad: number;
    serviceArea: string;
  }>;
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface QualificationResult {
  qualificationScore: number; // 0-100
  urgencyLevel: ServiceUrgency;
  serviceCategory: ServiceCategory;
  estimatedJobValue: string;
  qualificationNotes: string;
}

export interface RoutingDecision {
  assignedTechnician: string;
  priority: number; // 1-5 (1 = highest)
  reason: string;
  estimatedResponseTime: string;
  backupTechnician: string;
}

export interface AutoReply {
  channel: string;
  subject: string;
  messageBody: string;
  includeEstimate: boolean;
  followUpTime: string;
}

export interface LeadRoutingOutput {
  requestId: string;
  qualification: QualificationResult;
  routing: RoutingDecision;
  autoReply: AutoReply;
  internalNotes: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface LeadRoutingResult {
  success: boolean;
  message: string;
  data?: LeadRoutingOutput;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    timestamp: string;
    latencyMs: number;
  };
  error?: {
    type: string;
    details: string;
    timestamp: string;
  };
}
