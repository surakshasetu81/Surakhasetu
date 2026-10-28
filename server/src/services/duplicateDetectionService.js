/**
 * Suraksha Setu — Duplicate & Submission Consistency Verification (Module D)
 *
 * Compares incoming complaint narrative against existing database records
 * to detect potential duplicate submissions or repeated evidence files.
 *
 * CRITICAL SAFEGUARDS:
 * 1. A duplicate flag NEVER auto-rejects a complaint. Two people may legitimately
 *    report the same incident.
 * 2. A duplicate flag NEVER reduces or downgrades an urgent (HIGH) safety priority.
 * 3. Does not expose another complainant's identity or private information.
 */

import Case from '../models/Case.js';
import { isDatabaseConnected } from '../config/database.js';

/**
 * Tokenizes and normalizes text for transparent similarity comparison.
 *
 * @param {string} text - Raw input string
 * @returns {Set<string>} Set of normalized tokens and char 3-grams
 */
function extractFeatureSet(text) {
  if (!text) return new Set();
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length > 2);
  const ngrams = [];

  // Character 3-grams for transliterated variations
  for (let i = 0; i <= cleaned.length - 3; i++) {
    ngrams.push(cleaned.slice(i, i + 3));
  }

  return new Set([...words, ...ngrams]);
}

/**
 * Computes Jaccard similarity coefficient between two feature sets.
 *
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number} Value between 0.0 and 1.0
 */
function computeJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0.0 : intersection / union;
}

/**
 * Checks incoming complaint for potential duplicate submissions against existing cases.
 *
 * @param {string} incomingDescription - Description of new case
 * @param {string} [currentCaseId] - Exclude current case if updating
 * @param {number} [threshold=0.82] - Similarity cutoff for duplicate flagging
 * @returns {Promise<{ isPossibleDuplicate: boolean, maxSimilarity: number, matchedCaseId: string|null, flags: Array<Object> }>}
 */
export async function checkDuplicateSubmission(incomingDescription, currentCaseId = null, threshold = 0.82) {
  const flags = [];
  if (!incomingDescription || incomingDescription.length < 25) {
    return { isPossibleDuplicate: false, maxSimilarity: 0, matchedCaseId: null, flags };
  }

  try {
    const incomingFeatures = extractFeatureSet(incomingDescription);

    // Fetch recent cases (past 180 days) to compare if database is connected
    let recentCases = [];
    if (isDatabaseConnected()) {
      const query = currentCaseId ? { caseId: { $ne: currentCaseId } } : {};
      recentCases = await Case.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .select('caseId description createdAt');
    }

    let maxSimilarity = 0.0;
    let matchedCaseId = null;

    for (const pastCase of recentCases) {
      if (!pastCase.description) continue;
      const pastFeatures = extractFeatureSet(pastCase.description);
      const similarity = computeJaccard(incomingFeatures, pastFeatures);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedCaseId = pastCase.caseId;
      }
    }

    const isPossibleDuplicate = maxSimilarity >= threshold;

    if (isPossibleDuplicate) {
      flags.push({
        code: 'POSSIBLE_DUPLICATE_NARRATIVE',
        message: `Narrative exhibits high lexical similarity (${(maxSimilarity * 100).toFixed(1)}%) with prior recorded submission (${matchedCaseId}).`,
        severity: 'WARNING',
        detectedAt: new Date(),
        resolved: false,
      });
    }

    return {
      isPossibleDuplicate,
      maxSimilarity: parseFloat(maxSimilarity.toFixed(3)),
      matchedCaseId: isPossibleDuplicate ? matchedCaseId : null,
      flags,
    };
  } catch (err) {
    console.error('Error during duplicate detection:', err);
    return { isPossibleDuplicate: false, maxSimilarity: 0, matchedCaseId: null, flags };
  }
}
