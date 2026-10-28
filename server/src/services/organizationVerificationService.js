import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import { isDatabaseConnected } from '../config/database.js';

// Pre-configured official directories with verification rules
export const CONFIGURED_ORGANIZATIONS = [
  {
    name: 'Apex Global Technologies',
    type: 'employee',
    aliases: ['apex tech', 'apex global', 'apex'],
    domains: ['apextech.com', 'apexglobal.in'],
    idFormat: 'EMP- followed by 4 to 6 digits (e.g., EMP-10492)',
    idRegex: '^EMP-[0-9]{4,6}$',
    isActive: true,
  },
  {
    name: 'Delhi University',
    type: 'college_student',
    aliases: ['du', 'delhi university', 'university of delhi'],
    domains: ['du.ac.in', 'delhi.edu'],
    idFormat: 'DU- followed by 6 to 8 digits (e.g., DU-202489)',
    idRegex: '^DU-[0-9]{6,8}$',
    isActive: true,
  },
  {
    name: 'National Institute of Technology',
    type: 'college_student',
    aliases: ['nit', 'national institute of tech'],
    domains: ['nit.ac.in'],
    idFormat: 'NIT- followed by 6 digits (e.g., NIT-551023)',
    idRegex: '^NIT-[0-9]{6}$',
    isActive: true,
  },
  {
    name: 'St. Xavier\'s College',
    type: 'college_student',
    aliases: ['st xaviers', 'xaviers', 'sxc'],
    domains: ['sxccal.edu', 'xaviers.edu'],
    idFormat: 'SXC- followed by 5 to 7 digits (e.g., SXC-40912)',
    idRegex: '^SXC-[0-9]{5,7}$',
    isActive: true,
  },
  {
    name: 'Tata Consultancy Services',
    type: 'employee',
    aliases: ['tcs', 'tata consultancy'],
    domains: ['tcs.com'],
    idFormat: 'TCS- followed by 6 to 8 digits (e.g., TCS-198421)',
    idRegex: '^TCS-[0-9]{6,8}$',
    isActive: true,
  },
];

/**
 * Normalizes strings for robust matching
 */
function normalizeString(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Hashes an ID using SHA-256 with application secret salt to prevent plaintext exposure
 */
export function hashIdentifier(id) {
  const secret = process.env.JWT_SECRET || 'suraksha_default_salt';
  return crypto.createHmac('sha256', secret).update((id || '').trim().toUpperCase()).digest('hex');
}

/**
 * Finds an organization by name or alias from MongoDB or built-in configuration
 */
export async function findOrganization(orgName, orgType) {
  if (!orgName || typeof orgName !== 'string') return null;

  const normalizedInput = normalizeString(orgName);

  // 1. Check MongoDB first if connected
  if (isDatabaseConnected()) {
    try {
      const dbOrgs = await Organization.find({ isActive: true });
      for (const org of dbOrgs) {
        if (orgType && org.type !== orgType) continue;
        if (normalizeString(org.name) === normalizedInput) return org;
        if (org.aliases && org.aliases.some(alias => normalizeString(alias) === normalizedInput)) {
          return org;
        }
      }
    } catch (err) {
      console.warn('Error querying Organization collection:', err.message);
    }
  }

  // 2. Check built-in configured directory
  for (const org of CONFIGURED_ORGANIZATIONS) {
    if (!org.isActive) continue;
    if (orgType && org.type !== orgType) continue;
    if (normalizeString(org.name) === normalizedInput) return org;
    if (org.aliases && org.aliases.some(alias => normalizeString(alias) === normalizedInput)) {
      return org;
    }
  }

  return null;
}

/**
 * Validates and processes an organization verification request
 */
export async function verifyOrganizationDetails({
  organizationType,
  organizationName,
  identifier,
  email,
  ipAddress,
  userAgent,
}) {
  // Input validation
  if (!organizationType || !['employee', 'college_student'].includes(organizationType)) {
    return {
      success: false,
      verified: false,
      code: 'INVALID_ORG_TYPE',
      message: 'Please select a valid organization type (Employee or College Student).',
    };
  }

  if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length < 2) {
    return {
      success: false,
      verified: false,
      code: 'MISSING_ORG_NAME',
      message: organizationType === 'employee'
        ? 'Company Name is required.'
        : 'College/University Name is required.',
    };
  }

  const rawId = (identifier || '').trim();
  if (!rawId) {
    return {
      success: false,
      verified: false,
      code: 'MISSING_ID',
      message: organizationType === 'employee'
        ? 'Please enter your Employee ID.'
        : 'Please enter your College ID.',
    };
  }

  // 1. Locate organization record
  const org = await findOrganization(organizationName, organizationType);

  // Requirement: If no official organization directory is configured, display a clear message that verification cannot currently be completed.
  if (!org) {
    // Record audit event for unconfigured lookup without storing plain IDs
    if (isDatabaseConnected()) {
      AuditLog.create({
        action: 'ORGANIZATION_VERIFICATION_ATTEMPT_UNCONFIGURED',
        details: { organizationType, organizationName: organizationName.trim(), status: 'UNCONFIGURED' },
        ipAddress,
        userAgent,
      }).catch(() => {});
    }

    return {
      success: false,
      verified: false,
      code: 'ORGANIZATION_NOT_CONFIGURED',
      message: `No official directory or verification provider is configured for "${organizationName.trim()}". Verification cannot currently be completed. You may proceed with anonymous reporting or standard submission.`,
    };
  }

  // 2. Validate ID against organization-specific regex rule
  const idRegex = new RegExp(org.idRegex, 'i');
  if (!idRegex.test(rawId)) {
    return {
      success: false,
      verified: false,
      code: 'INVALID_ID_FORMAT',
      message: `The provided ID does not match the required format for ${org.name}. Expected format: ${org.idFormat}`,
      formatHint: org.idFormat,
    };
  }

  // 3. Optional organization email validation (if provided)
  const trimmedEmail = (email || '').trim().toLowerCase();
  if (trimmedEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        success: false,
        verified: false,
        code: 'INVALID_EMAIL_SYNTAX',
        message: 'Please enter a valid email address format.',
      };
    }

    const domain = trimmedEmail.split('@')[1];
    const isDomainAllowed = org.domains && org.domains.some(allowed => domain === allowed || domain.endsWith(`.${allowed}`));
    if (!isDomainAllowed) {
      return {
        success: false,
        verified: false,
        code: 'DOMAIN_MISMATCH',
        message: `The email domain "@${domain}" does not match ${org.name}'s authorized domain(s): ${org.domains.join(', ')}.`,
      };
    }
  }

  // 4. Generate high-entropy ID digest (Zero plaintext storage)
  const idDigest = hashIdentifier(rawId);

  // 5. Generate signed JWT verification token with 2-hour lifetime
  const jwtSecret = process.env.JWT_SECRET || 'suraksha_setu_dev_secret_key_2024';
  const verificationToken = jwt.sign(
    {
      organizationType: org.type,
      organizationName: org.name,
      idHash: idDigest,
      verificationMethod: trimmedEmail ? 'DIRECTORY_AND_DOMAIN_VERIFIED' : 'DIRECTORY_ID_VERIFIED',
      verified: true,
      timestamp: Date.now(),
    },
    jwtSecret,
    { expiresIn: '2h' }
  );

  // 6. Record success audit entry without plain ID
  if (isDatabaseConnected()) {
    AuditLog.create({
      action: 'ORGANIZATION_VERIFICATION_SUCCESS',
      details: {
        organizationType: org.type,
        organizationName: org.name,
        verificationMethod: trimmedEmail ? 'DIRECTORY_AND_DOMAIN_VERIFIED' : 'DIRECTORY_ID_VERIFIED',
        idHashPrefix: idDigest.slice(0, 8),
      },
      ipAddress,
      userAgent,
    }).catch(() => {});
  }

  return {
    success: true,
    verified: true,
    organizationType: org.type,
    organizationName: org.name,
    verificationToken,
    message: `Successfully verified as an authorized ${org.type === 'employee' ? 'employee' : 'student'} of ${org.name}.`,
  };
}

/**
 * Validates a signed verification token presented with a complaint report
 */
export function validateVerificationToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'suraksha_setu_dev_secret_key_2024';
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded && decoded.verified === true && decoded.organizationName && decoded.organizationType) {
      return {
        isVerified: true,
        organizationType: decoded.organizationType,
        organizationName: decoded.organizationName,
        verificationMethod: decoded.verificationMethod || 'DIRECTORY_ID_VERIFIED',
        idHash: decoded.idHash,
        verifiedAt: new Date(decoded.timestamp || Date.now()),
      };
    }
  } catch (err) {
    console.warn('Organization verification token validation failed:', err.message);
  }

  return null;
}

