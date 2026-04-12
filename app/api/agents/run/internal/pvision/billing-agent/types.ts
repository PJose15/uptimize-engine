/**
 * Types for PVision Billing Agent
 *
 * Tracks job completion, generates invoices,
 * manages payment follow-ups, and escalates collections.
 */

// ========================================
// INPUT CONTEXT
// ========================================

export type PaymentStatus = "pending" | "sent" | "partial" | "paid" | "overdue" | "collections";

export type PaymentMethod = "credit_card" | "check" | "cash" | "financing" | "insurance";

export interface BillingContext {
  /** Completed job details */
  completedJob?: {
    jobId?: string;
    jobType?: string;
    completionDate?: string;
    technicianName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    address?: string;
  };
  /** Parts used */
  partsUsed?: Array<{
    partName: string;
    quantity: number;
    unitCost: number;
  }>;
  /** Labor details */
  labor?: {
    hours: number;
    rate: number;
    overtime?: number;
  };
  /** Client payment history */
  paymentHistory?: {
    totalInvoices?: number;
    paidOnTime?: number;
    averageDaysToPayment?: number;
    outstandingBalance?: number;
  };
  /** Additional notes */
  notes?: string;
}

// ========================================
// OUTPUT STRUCTURES
// ========================================

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDraft {
  invoiceNumber: string;
  customerName: string;
  jobReference: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  paymentTerms: string;
  notes: string;
}

export interface FollowUpAction {
  stepNumber: number;
  daysAfterInvoice: number;
  channel: string;
  action: string;
  messageTemplate: string;
}

export interface CollectionEscalation {
  triggerCondition: string;
  escalationLevel: "reminder" | "final_notice" | "collections_agency" | "legal";
  action: string;
  timeline: string;
}

export interface BillingOutput {
  jobId: string;
  invoice: InvoiceDraft;
  paymentFollowUpSequence: FollowUpAction[];
  collectionEscalation: CollectionEscalation[];
  customerRiskAssessment: string;
  summary: string;
}

// ========================================
// AGENT RESULT
// ========================================

export interface BillingResult {
  success: boolean;
  message: string;
  data?: BillingOutput;
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
