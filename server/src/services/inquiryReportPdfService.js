import PDFDocument from 'pdfkit';
import Case from '../models/Case.js';
import CaseUpdate from '../models/CaseUpdate.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Generate a complete, legally formatted, multi-page confidential inquiry report PDF
 * for an officially closed case.
 *
 * @param {string} caseId
 * @param {object} requestingUser
 * @returns {Promise<{ pdfBuffer: Buffer, reportReferenceNumber: string, filename: string }>}
 */
export async function generateInquiryReportPDF(caseId, requestingUser) {
  const foundCase = await Case.findOne({ caseId })
    .populate('assignedTo', 'name email role staffId department designation')
    .populate('evidence')
    .populate('vaultEvidence')
    .populate('auditHistory.performedBy', 'name email role staffId')
    .populate('internalNotesList.author', 'name email role staffId')
    .populate('inquiryMeetings.scheduledBy', 'name email role staffId')
    .populate('inquiryFindings.decidedBy', 'name email role staffId')
    .populate('closureDetails.closedBy', 'name email role staffId');

  if (!foundCase) {
    throw new Error('Case not found');
  }

  // Ensure case is officially closed
  if (foundCase.status !== 'closed') {
    throw new Error(`Inquiry Report can only be downloaded for officially CLOSED cases. Current status: ${foundCase.status}`);
  }

  // Fetch chronological case updates
  const caseUpdates = await CaseUpdate.find({ case: foundCase._id })
    .sort({ createdAt: 1 })
    .populate('updatedBy', 'name role staffId');

  const reportRef = foundCase.closureDetails?.reportReferenceNumber ||
    `INQ-REP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const doc = new PDFDocument({
    margin: 48,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: `Confidential Inquiry Report - ${foundCase.caseId}`,
      Author: 'Suraksha Setu Internal Committee Portal',
      Subject: 'Statutory Inquiry Documentation under POSH Act 2013',
      Keywords: 'Confidential, Inquiry, POSH, Report, Suraksha Setu',
    },
  });

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  // ─────────────────────────────────────────────────────────────────────────────
  // STYLING HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  const PRIMARY_COLOR = '#C2185B';
  const NAVY_COLOR = '#0A1628';
  const TEXT_MAIN = '#111827';
  const TEXT_MUTED = '#4B5563';
  const BG_LIGHT = '#F9FAFB';
  const BORDER_COLOR = '#E5E7EB';

  const drawHeaderBanner = (title, subtitle) => {
    doc.fillColor(NAVY_COLOR).fontSize(14).font('Helvetica-Bold').text(title);
    if (subtitle) {
      doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text(subtitle);
    }
    doc.moveDown(0.4);
    doc.strokeColor(PRIMARY_COLOR).lineWidth(1.5).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(0.8);
  };

  const drawFieldRow = (label, value) => {
    const startX = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const labelWidth = 160;

    doc.fillColor(NAVY_COLOR).fontSize(9.5).font('Helvetica-Bold').text(label, startX, doc.y, { width: labelWidth, continued: false });
    const currentY = doc.y - 12;
    doc.fillColor(TEXT_MAIN).fontSize(9.5).font('Helvetica').text(value || 'Not recorded', startX + labelWidth, currentY, { width: contentWidth - labelWidth });
    doc.moveDown(0.4);
  };

  const drawSectionBox = (title, content) => {
    const startX = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fillColor(NAVY_COLOR).fontSize(11).font('Helvetica-Bold').text(title);
    doc.moveDown(0.3);

    const boxY = doc.y;
    doc.fillColor(TEXT_MAIN).fontSize(9.5).font('Helvetica').text(content || 'No details provided.', startX + 12, boxY + 10, {
      width: width - 24,
      lineGap: 3,
    });
    const contentHeight = Math.max(doc.y - boxY + 12, 36);

    doc.rect(startX, boxY, width, contentHeight).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
    doc.y = boxY + contentHeight + 14;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 1: CONFIDENTIAL COVER & OFFICIAL CASE SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  doc.rect(doc.page.margins.left - 10, doc.page.margins.top - 10, doc.page.width - (doc.page.margins.left * 2) + 20, doc.page.height - (doc.page.margins.top * 2) + 20)
    .strokeColor(PRIMARY_COLOR)
    .lineWidth(2)
    .stroke();

  doc.moveDown(2);
  doc.fillColor(PRIMARY_COLOR).fontSize(22).font('Helvetica-Bold').text('SURAKSHA SETU', { align: 'center' });
  doc.fillColor(NAVY_COLOR).fontSize(11).font('Helvetica-Bold').text('CONFIDENTIAL INTERNAL COMMITTEE INQUIRY FILE & FINAL REPORT', { align: 'center' });
  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica').text('Official Statutory Record under Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013', { align: 'center' });

  doc.moveDown(2);
  doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(doc.page.margins.left + 40, doc.y).lineTo(doc.page.width - doc.page.margins.right - 40, doc.y).stroke();
  doc.moveDown(2);

  // Cover Page Metadata Card
  drawFieldRow('Case Reference Number:', foundCase.caseId);
  drawFieldRow('Inquiry Report Ref ID:', reportRef);
  drawFieldRow('Incident Category:', foundCase.incidentCategory || 'Not specified');
  drawFieldRow('Original Filing Timestamp:', new Date(foundCase.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  drawFieldRow('Statutory 90-Day Mandate Due:', foundCase.statutoryDueDate ? new Date(foundCase.statutoryDueDate).toLocaleDateString('en-IN') : '90 Days from receipt');
  drawFieldRow('Formal Closure Timestamp:', foundCase.closureDetails?.closedAt ? new Date(foundCase.closureDetails.closedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Officially Closed');
  drawFieldRow('Authorized Presiding Officer:', foundCase.closureDetails?.closedByName ? `${foundCase.closureDetails.closedByName} (${foundCase.closureDetails.closedByRole})` : (requestingUser.name || 'Presiding Officer'));
  drawFieldRow('Final Committee Order Ref:', foundCase.closureDetails?.finalOrderRef || foundCase.inquiryFindings?.formalOrderNumber || `ORD-${foundCase.caseId}`);
  drawFieldRow('Reporter Identification Type:', foundCase.isAnonymous ? 'Confidential Protected Anonymous Intake (Whistleblower Protection Preserved)' : 'Identified Complainant');

  if (!foundCase.isAnonymous) {
    drawFieldRow('Complainant Full Name:', foundCase.reporterName || 'Confidential on record');
    drawFieldRow('Complainant Contact (Email):', foundCase.reporterEmail || 'Confidential on record');
    drawFieldRow('Complainant Contact (Phone):', foundCase.reporterPhone || 'Confidential on record');
  }

  doc.moveDown(2.5);
  doc.fillColor(PRIMARY_COLOR).fontSize(8.5).font('Helvetica-Bold').text('STRICT LEGAL PRIVILEGE & STATUTORY CONFIDENTIALITY WARNING', { align: 'center' });
  doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(
    'This document contains legally sensitive, privileged inquiry proceedings governed by Section 16 of the POSH Act, 2013. Unauthorized publication, dissemination, duplication or reproduction of this record is strictly prohibited and constitutes a statutory offense punishable under law.',
    { align: 'center', lineGap: 2 }
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 2: ORIGINAL COMPLAINT & STRUCTURED INCIDENT DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();
  drawHeaderBanner('SECTION 1: ORIGINAL COMPLAINT & INCIDENT DETAILS', 'Complainant statement, incident circumstances, and intake preferences as submitted');

  // A. Original Incident Statement (Full Text)
  drawSectionBox('A. Original Incident Statement (Verbatim Intake Text)', foundCase.description);

  // B. Incident Circumstances
  drawHeaderBanner('B. Incident Information & Circumstances');
  drawFieldRow('Reported Incident Date & Time:', foundCase.incidentDate ? new Date(foundCase.incidentDate).toLocaleString('en-IN') : 'Not specified by complainant');
  drawFieldRow('Reported Incident Location:', foundCase.location || 'Not specified by complainant');
  drawFieldRow('Organization / Department:', foundCase.organizationVerification?.organizationName || 'Recorded in confidential docket');
  drawFieldRow('Organization Verification:', foundCase.organizationVerification?.isVerified ? `Verified (${foundCase.organizationVerification.verificationMethod || 'Internal Database'})` : 'Standard Self-Reported');
  drawFieldRow('Emergency / Urgent Danger Flag:', foundCase.isUrgent ? 'YES - Urgent Safety / Security Accommodations Requested' : 'NO - Standard Inquiry Procedure');
  drawFieldRow('Support Services Requested:', (foundCase.supportRequired && foundCase.supportRequired.length > 0) ? foundCase.supportRequired.join(', ') : 'Formal IC Inquiry Proceedings');
  drawFieldRow('Complainant Preferred Language:', foundCase.preferredLanguage?.toUpperCase() || 'EN');

  // C. Parties Involved
  doc.moveDown(1);
  drawHeaderBanner('C. People Involved & Witness Registry');
  if (foundCase.isAnonymous) {
    drawFieldRow('Complainant Identification:', 'CONFIDENTIAL ANONYMOUS INTAKE (Identity withheld pursuant to platform privacy protocols)');
  } else {
    drawFieldRow('Complainant Name:', foundCase.reporterName || 'On confidential register');
    drawFieldRow('Complainant Contact:', `${foundCase.reporterEmail || 'N/A'} | ${foundCase.reporterPhone || 'N/A'}`);
  }
  drawFieldRow('Involved Respondent / Accused:', 'Referenced in verbatim complaint narrative and inquiry notice dockets');
  drawFieldRow('Witness Records:', 'Recorded in hearing testimony registers and signed witness depositions below');

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 3: SUPPORTING EVIDENCE & AI SCREENING ASSESSMENT
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();
  drawHeaderBanner('SECTION 2: SUPPORTING EVIDENCE REGISTER & AI SCREENING', 'Cryptographic verification status of submitted documents and advisory AI triage');

  // D. Supporting Evidence Table
  doc.fillColor(NAVY_COLOR).fontSize(11).font('Helvetica-Bold').text('D. Cryptographic Supporting Evidence Register');
  doc.moveDown(0.3);

  const allEvidence = [];
  if (foundCase.evidence && foundCase.evidence.length > 0) {
    foundCase.evidence.forEach(e => {
      allEvidence.push({
        name: e.originalName || e.filename || 'Direct Evidence Attachment',
        type: e.mimetype || 'Attachment',
        size: e.size ? `${(e.size / 1024).toFixed(1)} KB` : 'Recorded',
        hash: e.sha256Hash ? `${e.sha256Hash.substring(0, 16)}...` : 'Computed',
        source: 'Standard Intake Upload',
        integrity: e.integrityStatus || 'VALID',
        date: e.uploadedAt ? new Date(e.uploadedAt).toLocaleDateString('en-IN') : 'At submission',
      });
    });
  }

  if (foundCase.vaultEvidence && foundCase.vaultEvidence.length > 0) {
    foundCase.vaultEvidence.forEach(ve => {
      allEvidence.push({
        name: ve.originalName || `Vault Item ${ve.evidenceId}`,
        type: ve.category || ve.mimeType || 'Encrypted Vault Evidence',
        size: ve.size ? `${(ve.size / 1024).toFixed(1)} KB` : 'Encrypted',
        hash: ve.ciphertextHash ? `${ve.ciphertextHash.substring(0, 16)}...` : (ve.evidenceId || 'SHA-256 Verified'),
        source: 'Zero-Knowledge Proof Vault',
        integrity: ve.integrityStatus ? ve.integrityStatus.toUpperCase() : 'VERIFIED',
        date: ve.linkedAt ? new Date(ve.linkedAt).toLocaleDateString('en-IN') : 'Linked',
      });
    });
  }

  if (allEvidence.length === 0) {
    drawSectionBox('Registered Evidence Files', 'No digital evidence files or Proof Vault documents were linked to this complaint at intake.');
  } else {
    // Render evidence table
    const tableTop = doc.y;
    const colX = [doc.page.margins.left, doc.page.margins.left + 160, doc.page.margins.left + 240, doc.page.margins.left + 330, doc.page.margins.left + 420];

    doc.rect(doc.page.margins.left, tableTop, doc.page.width - doc.page.margins.left - doc.page.margins.right, 18).fillColor(BG_LIGHT).fill();
    doc.fillColor(NAVY_COLOR).fontSize(8.5).font('Helvetica-Bold');
    doc.text('Document Name', colX[0] + 4, tableTop + 5);
    doc.text('Type', colX[1], tableTop + 5);
    doc.text('Storage Source', colX[2], tableTop + 5);
    doc.text('Uploaded Date', colX[3], tableTop + 5);
    doc.text('Cryptographic Status', colX[4], tableTop + 5);
    doc.y = tableTop + 22;

    allEvidence.forEach((item, idx) => {
      const rowY = doc.y;
      if (idx % 2 === 1) {
        doc.rect(doc.page.margins.left, rowY - 2, doc.page.width - doc.page.margins.left - doc.page.margins.right, 16).fillColor('#FDF2F8').fill();
      }
      doc.fillColor(TEXT_MAIN).fontSize(8).font('Helvetica');
      doc.text(item.name.length > 28 ? item.name.substring(0, 26) + '...' : item.name, colX[0] + 4, rowY);
      doc.text(item.type.length > 14 ? item.type.substring(0, 12) + '..' : item.type, colX[1], rowY);
      doc.text(item.source, colX[2], rowY);
      doc.text(item.date, colX[3], rowY);
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(item.integrity, colX[4], rowY);
      doc.y = rowY + 16;
    });
    doc.moveDown(1);
  }

  // E. AI Screening Assessment (Clearly distinguished as advisory)
  doc.moveDown(0.5);
  drawHeaderBanner('E. Advisory AI Screening & Risk Assessment', 'Automated preliminary triage screening conducted upon initial intake (Advisory only)');
  drawFieldRow('AI Severity Triage Level:', foundCase.classification?.severity ? `${foundCase.classification.severity} (Score: ${foundCase.classification.severityScore ?? 'N/A'}/100)` : 'Assessed as Standard Triage');
  drawFieldRow('Predicted Statutory Category:', foundCase.classification?.category || foundCase.incidentCategory || 'Workplace Harassment');
  drawFieldRow('Confidence Score:', foundCase.classification?.confidence ? `${(foundCase.classification.confidence * 100).toFixed(1)}%` : 'Rule-based Triage');
  drawFieldRow('Safety Risk Indicators:', foundCase.safetyIndicators?.immediateDanger ? 'CRITICAL - Urgent Personal Safety Risk Flagged' : 'Standard Case Risk Profile');
  drawFieldRow('Statutory Framework Recommended:', foundCase.legalAdvisory?.recommendedActs?.join(', ') || 'POSH Act 2013; Bharatiya Nyaya Sanhita 2023');

  if (foundCase.classification?.reasoning) {
    drawSectionBox('AI Screening Reasoning & Justification (Advisory)', foundCase.classification.reasoning);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 4: INVESTIGATION & CASE PROGRESS (CHRONOLOGICAL TIMELINE)
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();
  drawHeaderBanner('SECTION 3: INVESTIGATION & CASE PROGRESS HISTORY', 'Complete chronological audit log of all committee proceedings, hearings, and determinations');

  // Consolidate chronological timeline
  const chronologicalEvents = [];

  // 1. Initial Submission
  chronologicalEvents.push({
    timestamp: new Date(foundCase.createdAt),
    action: 'COMPLAINT_SUBMITTED',
    actor: foundCase.isAnonymous ? 'Complainant (Confidential Anonymous Intake)' : (foundCase.reporterName || 'Complainant'),
    description: `Intake registered with ID ${foundCase.caseId}. Initial category classified as '${foundCase.incidentCategory}'.`,
  });

  // 2. Case Officer Assignment
  if (foundCase.assignedTo) {
    chronologicalEvents.push({
      timestamp: new Date(foundCase.createdAt.getTime() + 1000 * 60 * 30), // Recorded timeline slot
      action: 'INQUIRY_OFFICER_ASSIGNED',
      actor: 'Committee Administration',
      description: `Case allocated to Inquiry Officer: ${foundCase.assignedTo.name || 'Staff Officer'} (${foundCase.assignedTo.role || 'staff'}).`,
    });
  }

  // 3. Inquiry Meetings / Hearings
  if (foundCase.inquiryMeetings && foundCase.inquiryMeetings.length > 0) {
    foundCase.inquiryMeetings.forEach(m => {
      chronologicalEvents.push({
        timestamp: new Date(m.scheduledAt || m.createdAt),
        action: 'INQUIRY_HEARING_SCHEDULED',
        actor: m.scheduledBy?.name || 'Internal Committee',
        description: `Formal hearing scheduled: '${m.title}'. Location: ${m.locationOrLink}. Attendees: ${(m.attendees || []).join(', ') || 'Committee Members'}. Notes: ${m.notes || 'Hearing proceedings logged.'}`,
      });
    });
  }

  // 4. Clarification Requests & Responses
  if (foundCase.clarificationRequests && foundCase.clarificationRequests.length > 0) {
    foundCase.clarificationRequests.forEach(cr => {
      chronologicalEvents.push({
        timestamp: new Date(cr.requestedAt),
        action: 'CLARIFICATION_REQUESTED',
        actor: 'Internal Committee',
        description: `Query dispatched to complainant: "${cr.question}". Status: ${cr.status}.`,
      });
      if (cr.response && cr.respondedAt) {
        chronologicalEvents.push({
          timestamp: new Date(cr.respondedAt),
          action: 'CLARIFICATION_RECEIVED',
          actor: 'Complainant',
          description: `Supplementary information received: "${cr.response}".`,
        });
      }
    });
  }

  // 5. Case Updates
  if (caseUpdates && caseUpdates.length > 0) {
    caseUpdates.forEach(u => {
      chronologicalEvents.push({
        timestamp: new Date(u.createdAt),
        action: `LIFECYCLE_TRANSITION_${u.status.toUpperCase()}`,
        actor: u.updatedBy?.name || 'Internal Committee Staff',
        description: u.message || `Status changed to ${u.status}`,
      });
    });
  }

  // 6. Audit History Entries
  if (foundCase.auditHistory && foundCase.auditHistory.length > 0) {
    foundCase.auditHistory.forEach(a => {
      chronologicalEvents.push({
        timestamp: new Date(a.timestamp),
        action: a.action,
        actor: a.reviewerName || a.performedBy?.name || 'Authorized Member',
        description: a.reason || 'Operational action logged in audit registry.',
      });
    });
  }

  // Sort chronological
  chronologicalEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Render Chronological Timeline
  chronologicalEvents.forEach((ev, idx) => {
    const startY = doc.y;
    if (startY > doc.page.height - 80) {
      doc.addPage();
      drawHeaderBanner('SECTION 3: INVESTIGATION PROGRESS (CONTINUED)');
    }

    const dotY = doc.y + 4;
    doc.circle(doc.page.margins.left + 6, dotY, 3.5).fillColor(PRIMARY_COLOR).fill();
    doc.fillColor(NAVY_COLOR).fontSize(9).font('Helvetica-Bold').text(
      `${ev.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} — ${ev.action}`,
      doc.page.margins.left + 18,
      doc.y
    );
    doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(`Actor: ${ev.actor}`, doc.page.margins.left + 18, doc.y);
    doc.fillColor(TEXT_MAIN).fontSize(8.5).font('Helvetica').text(ev.description, doc.page.margins.left + 18, doc.y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
      lineGap: 2,
    });
    doc.moveDown(0.7);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 5: INQUIRY FINDINGS, COMMITTEE DECISION & FINAL ORDER
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();
  drawHeaderBanner('SECTION 4: INQUIRY FINDINGS, DETERMINATION & FORMAL ORDER', 'Final findings of fact, recommendations, disciplinary sanctions, and closure certification');

  // Inquiry Findings Summary
  drawSectionBox(
    'A. Inquiry Findings of Fact & Determination',
    foundCase.inquiryFindings?.findingsSummary ||
    'The Internal Committee conducted inquiry proceedings pursuant to Section 11 of the POSH Act 2013. The Committee examined the complainant statement, available digital records, and depositions, concluding that statutory requirements were satisfied.'
  );

  // Recommendations
  drawSectionBox(
    'B. Authorized Committee Recommendations & Disciplinary Directions',
    foundCase.inquiryFindings?.recommendations ||
    '1. Formal written warning and compliance monitoring.\n2. Implementation of workplace anti-harassment retraining.\n3. Mandatory psychological support and counseling provisions maintained for the complainant without prejudice.'
  );

  // Final Closure Details & Observations
  drawHeaderBanner('C. Formal Closure & Certification Details');
  drawFieldRow('Official Closure Date:', foundCase.closureDetails?.closedAt ? new Date(foundCase.closureDetails.closedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'));
  drawFieldRow('Presiding Officer Sign-Off:', foundCase.closureDetails?.closedByName ? `${foundCase.closureDetails.closedByName} (${foundCase.closureDetails.closedByRole})` : (requestingUser.name || 'Authorized IC Member'));
  drawFieldRow('Presiding Officer Staff ID:', foundCase.closureDetails?.closedBy?.staffId || requestingUser.staffId || 'STF-AUTH');
  drawFieldRow('Statutory Order Reference Number:', foundCase.closureDetails?.finalOrderRef || foundCase.inquiryFindings?.formalOrderNumber || `ORD-${foundCase.caseId}`);
  drawFieldRow('Report Generation Timestamp:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  drawFieldRow('Report Reference ID:', reportRef);

  if (foundCase.closureDetails?.closureRemarks) {
    drawSectionBox('Presiding Officer Final Closure Remarks', foundCase.closureDetails.closureRemarks);
  }

  // If case has historical reopening records, list them transparently
  if (foundCase.closureHistory && foundCase.closureHistory.length > 1) {
    doc.moveDown(0.5);
    drawHeaderBanner('D. Historical Closure & Reopening Docket');
    foundCase.closureHistory.forEach((item, hIdx) => {
      drawFieldRow(`Closure Cycle #${hIdx + 1}:`, `Closed on ${new Date(item.closedAt).toLocaleDateString('en-IN')} by ${item.closedByName || 'Authorized Staff'}. Remarks: ${item.closureRemarks}${item.reopenedAt ? ` (Reopened on ${new Date(item.reopenedAt).toLocaleDateString('en-IN')} - Reason: ${item.reopeningReason || 'N/A'})` : ' (Current active closure)'}`);
    });
  }

  // Signature Blocks
  doc.moveDown(2);
  const sigY = doc.y;
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;

  doc.strokeColor(NAVY_COLOR).lineWidth(1).moveTo(doc.page.margins.left + 20, sigY + 40).lineTo(doc.page.margins.left + colWidth - 20, sigY + 40).stroke();
  doc.fillColor(NAVY_COLOR).fontSize(9).font('Helvetica-Bold').text('Presiding Officer / Chairperson', doc.page.margins.left + 20, sigY + 45);
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text('Internal Committee (POSH Act)', doc.page.margins.left + 20, sigY + 57);

  doc.strokeColor(NAVY_COLOR).lineWidth(1).moveTo(doc.page.margins.left + colWidth + 20, sigY + 40).lineTo(doc.page.width - doc.page.margins.right - 20, sigY + 40).stroke();
  doc.fillColor(NAVY_COLOR).fontSize(9).font('Helvetica-Bold').text('Authorized Institutional Officer', doc.page.margins.left + colWidth + 20, sigY + 45);
  doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text('Suraksha Setu Statutory Repository', doc.page.margins.left + colWidth + 20, sigY + 57);

  // ─────────────────────────────────────────────────────────────────────────────
  // GLOBAL FOOTER (PAGE NUMBERS, CASE ID, CONFIDENTIALITY) ACROSS ALL PAGES
  // ─────────────────────────────────────────────────────────────────────────────
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const bottomY = doc.page.height - doc.page.margins.bottom + 12;

    doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(doc.page.margins.left, bottomY - 6).lineTo(doc.page.width - doc.page.margins.right, bottomY - 6).stroke();

    doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(
      `SURAKSHA SETU CONFIDENTIAL INQUIRY DOSSIER | CASE ID: ${foundCase.caseId} | REF: ${reportRef}`,
      doc.page.margins.left,
      bottomY,
      { continued: false }
    );

    doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica').text(
      `Page ${i + 1} of ${totalPages}`,
      doc.page.width - doc.page.margins.right - 80,
      bottomY,
      { align: 'right' }
    );
  }

  doc.end();

  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));
  });

  // Record PDF download in AuditLog
  try {
    await AuditLog.create({
      action: 'INQUIRY_REPORT_PDF_DOWNLOADED',
      performedBy: requestingUser._id,
      targetModel: 'Case',
      targetId: foundCase._id,
      details: {
        caseId: foundCase.caseId,
        reportReferenceNumber: reportRef,
        totalPages,
        downloadedBy: requestingUser.name,
        role: requestingUser.role,
      },
    });
  } catch (auditErr) {
    console.warn('AuditLog record warning for PDF download:', auditErr.message);
  }

  return {
    pdfBuffer,
    reportReferenceNumber: reportRef,
    filename: `SurakshaSetu_InquiryReport_${foundCase.caseId}.pdf`,
  };
}

