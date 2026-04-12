/**
 * Learning Anonymizer — blocks PII before storing learnings
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const DOLLAR_AMOUNT_REGEX = /\$[\d,]+(\.\d{2})?/g;

const BLOCKED_PATTERNS = [EMAIL_REGEX, PHONE_REGEX, SSN_REGEX];

export function validateNoClientPII(value: string): { clean: boolean; issues: string[] } {
  const issues: string[] = [];
  if (EMAIL_REGEX.test(value)) issues.push('Contains email address');
  if (PHONE_REGEX.test(value)) issues.push('Contains phone number');
  if (SSN_REGEX.test(value)) issues.push('Contains SSN-like pattern');
  return { clean: issues.length === 0, issues };
}

export function anonymizeLearningValue(value: string): string {
  let result = value;
  for (const pattern of BLOCKED_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  result = result.replace(DOLLAR_AMOUNT_REGEX, '$[AMOUNT]');
  return result;
}
