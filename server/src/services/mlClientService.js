/**
 * Suraksha Setu — Python ML Service Integration Client (Layer 2 & 3)
 *
 * Calls the internal FastAPI ML microservice for probabilistic priority triage.
 * Uses native Node.js fetch with AbortSignal.timeout.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Never call the Python ML service directly from the browser.
 * 2. Privacy: Strip all personally identifiable information (reporterName, reporterEmail, reporterPhone).
 *    Only send narrative text, incident category, and structured safety indicators.
 * 3. Graceful degradation: If the ML service is unreachable, times out, or fails,
 *    return an explicit unavailable response without failing the case submission.
 * 4. A lower ML prediction can NEVER override a deterministic Layer 1 HIGH priority trigger.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS, 10) || 2500;

/**
 * Sends anonymized case features to internal Python ML service for priority classification.
 *
 * @param {Object} input - Incident data
 * @param {string} [input.caseId] - Case reference ID
 * @param {string} input.description - Complaint narrative
 * @param {string} [input.incidentCategory] - Incident category
 * @param {string} [input.preferredLanguage] - Language code
 * @param {Object} [input.safetyIndicators] - Structured indicators
 * @param {boolean} [input.isUrgent] - User urgent flag
 * @param {Array<string>} [input.supportRequired] - Selected support options
 * @returns {Promise<Object>} ML prediction result or safe unavailable status
 */
export async function requestMLClassification(input) {
  const {
    caseId,
    description,
    incidentCategory = 'other',
    preferredLanguage = 'en',
    safetyIndicators = {},
    isUrgent = false,
    supportRequired = [],
  } = input;

  const payload = {
    report_id: caseId || null,
    narrative: description || '',
    incident_category: incidentCategory,
    language: preferredLanguage,
    safety_indicators: {
      immediate_danger: !!(safetyIndicators.immediateDangerReported || isUrgent),
      physical_force: !!safetyIndicators.physicalForceReported,
      ongoing_threats: !!safetyIndicators.ongoingThreats,
      stalking_or_tracking: !!safetyIndicators.stalkingOrTracking,
      ongoing_harassment: !!safetyIndicators.ongoingHarassment,
      fear_of_retaliation: !!safetyIndicators.fearOfRetaliation,
      target_is_minor: !!safetyIndicators.targetIsMinor,
      urgent_support_requested: !!(supportRequired.includes('urgent_safety') || isUrgent),
    },
  };

  const mlBaseUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const response = await fetch(`${mlBaseUrl}/internal/v1/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SurakshaSetu-Backend/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`ML microservice HTTP error: ${response.status}`);
    }

    const data = await response.json();

    return {
      available: true,
      suggestedPriority: data.suggested_priority,
      confidenceScore: data.confidence_score,
      classProbabilities: data.class_probabilities || {},
      classificationMethod: data.classification_method || 'ml_triage',
      modelVersion: data.model_version,
      isDemoModel: data.is_demo_model !== false,
      priorityReasons: data.priority_reasons || [],
      warning: data.warning || null,
    };
  } catch (err) {
    // Log failure without exposing sensitive complaint narrative
    const reason = err.name === 'TimeoutError'
      ? `Timed out after ${ML_TIMEOUT_MS}ms`
      : err.message;

    return {
      available: false,
      error: `ML service unavailable: ${reason}`,
      suggestedPriority: null,
      confidenceScore: null,
      classProbabilities: {},
      classificationMethod: 'ml_unavailable_fallback',
      modelVersion: null,
      isDemoModel: true,
      priorityReasons: ['ML classification unavailable at submission time; deterministic safety rules applied'],
    };
  }
}
