import { z } from "zod";

// Valid TLDs (subset of common ones for security)
const VALID_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'io', 'ai', 'app', 'dev', 'tech', 'info',
  'biz', 'name', 'pro', 'us', 'uk', 'ca', 'au',
  'de', 'fr', 'jp', 'br', 'in', 'cn', 'ru'
]);

// Domain validation errors
export class DomainValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}

// Normalize domain: lowercase, trim, remove protocols
export function normalizeDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    throw new DomainValidationError('Domain must be a non-empty string', 'INVALID_INPUT');
  }

  // Remove protocols and www prefix
  let normalized = domain.toLowerCase().trim();
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^www\./, '');
  normalized = normalized.replace(/\/$/, ''); // Remove trailing slash

  return normalized;
}

// Validate domain format
export function validateDomainFormat(domain: string): void {
  const normalizedDomain = normalizeDomain(domain);

  // Basic format validation
  if (!normalizedDomain) {
    throw new DomainValidationError('Domain cannot be empty', 'EMPTY_DOMAIN');
  }

  // Check for wildcards
  if (normalizedDomain.includes('*')) {
    throw new DomainValidationError('Wildcard domains are not allowed', 'WILDCARD_NOT_ALLOWED');
  }

  // Check for IP addresses (basic check)
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipRegex.test(normalizedDomain)) {
    throw new DomainValidationError('IP addresses are not allowed as domains', 'IP_NOT_ALLOWED');
  }

  // Basic domain format validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  if (!domainRegex.test(normalizedDomain)) {
    throw new DomainValidationError('Invalid domain format', 'INVALID_FORMAT');
  }

  // Check length limits
  if (normalizedDomain.length > 253) {
    throw new DomainValidationError('Domain name too long (max 253 characters)', 'TOO_LONG');
  }

  // Check for consecutive dots
  if (normalizedDomain.includes('..')) {
    throw new DomainValidationError('Domain cannot contain consecutive dots', 'CONSECUTIVE_DOTS');
  }

  // Check for leading/trailing dots or hyphens
  if (normalizedDomain.startsWith('.') || normalizedDomain.endsWith('.') ||
      normalizedDomain.startsWith('-') || normalizedDomain.endsWith('-')) {
    throw new DomainValidationError('Domain cannot start or end with dots or hyphens', 'INVALID_BOUNDARIES');
  }
}

// Validate TLD
export function validateTLD(domain: string): void {
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split('.');
  
  if (parts.length < 2) {
    throw new DomainValidationError('Domain must have at least one dot (e.g., example.com)', 'MISSING_TLD');
  }

  const tld = parts[parts.length - 1];
  
  if (!VALID_TLDS.has(tld)) {
    throw new DomainValidationError(`TLD '${tld}' is not supported`, 'UNSUPPORTED_TLD');
  }
}

// Comprehensive domain validation
export function validateDomain(domain: string): string {
  // Normalize first
  const normalizedDomain = normalizeDomain(domain);
  
  // Validate format
  validateDomainFormat(normalizedDomain);
  
  // Validate TLD
  validateTLD(normalizedDomain);
  
  return normalizedDomain;
}

// Zod schema for domain validation
export const domainValidationSchema = z.string().transform((domain, ctx) => {
  try {
    return validateDomain(domain);
  } catch (error) {
    if (error instanceof DomainValidationError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
        path: []
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Domain validation failed',
        path: []
      });
    }
    return z.NEVER;
  }
});

// Enhanced domain configuration schema with validation
export const enhancedDomainConfigurationSchema = z.object({
  domain: domainValidationSchema,
  domainType: z.enum(['ADMIN_PORTAL', 'CLIENT_WEBSITE']),
  subdomain: z.string().optional().transform((sub) => {
    if (!sub) return undefined;
    // Validate subdomain format
    const normalizedSub = sub.toLowerCase().trim();
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(normalizedSub)) {
      throw new Error('Invalid subdomain format');
    }
    return normalizedSub;
  }),
  verificationMethod: z.enum(['DNS_TXT', 'FILE_UPLOAD', 'CNAME']).default('DNS_TXT'),
  redirectToHttps: z.boolean().default(true),
  // customSettings: z.string().optional() // Temporarily disabled until database migration
});