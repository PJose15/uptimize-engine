/**
 * Types for SmartGym Lead Capture Agent
 *
 * Captures gym leads from multiple channels, qualifies them,
 * and books consultations with follow-up sequences.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export type LeadSource = "instagram_dm" | "walk_in" | "referral" | "website" | "facebook" | "google_ads" | "tiktok" | "other";

export type ServiceOffered = "personal_training" | "group_classes" | "membership" | "nutrition_coaching" | "recovery" | "kids_program" | "other";

export interface LeadCaptureContext {
  /** Source channel of the lead */
  leadSource?: LeadSource;
  /** Gym location identifier */
  gymLocation?: string;
  /** Services the gym offers */
  servicesOffered?: ServiceOffered[];
  /** Raw message or inquiry from the lead */
  rawInquiry?: string;
  /** Lead contact info if available */
  leadContact?: {
    name?: string;
    phone?: string;
    email?: string;
    socialHandle?: string;
  };
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface QualifiedLead {
  leadId: string;
  name: string;
  contactMethod: string;
  source: LeadSource;
  interestLevel: "hot" | "warm" | "cold";
  servicesInterested: ServiceOffered[];
  qualificationScore: number; // 0-100
  qualificationNotes: string;
}

export interface ConsultationBooking {
  suggestedDate: string;
  suggestedTime: string;
  consultationType: "in_person" | "phone" | "video";
  assignedTo: string;
  preparationNotes: string;
}

export interface FollowUpStep {
  stepNumber: number;
  channel: string;
  timing: string;
  messageTemplate: string;
}

export interface LeadCaptureOutput {
  qualifiedLead: QualifiedLead;
  consultationBooking: ConsultationBooking;
  followUpSequence: FollowUpStep[];
  responseToLead: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface LeadCaptureResult {
  success: boolean;
  message: string;
  data?: LeadCaptureOutput;
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
