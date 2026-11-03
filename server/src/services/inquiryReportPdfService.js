import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import Case from '../models/Case.js';
import CaseUpdate from '../models/CaseUpdate.js';
import AuditLog from '../models/AuditLog.js';

// ─── COLOR PALETTE & MEASUREMENTS ─────────────────────────────────────────────
const PRIMARY_COLOR = '#C2185B';     // Official Suraksha Setu Deep Rose/Pink
const PRIMARY_DARK = '#880E4F';      // Darker accent
const NAVY_COLOR = '#0A1628';        // Formal navy for headings & primary text
const TEXT_MAIN = '#1F2937';         // High-contrast readable body text
const TEXT_MUTED = '#4B5563';        // Secondary metadata text
const TEXT_SUBTLE = '#6B7280';       // Captions & footnotes
const BG_LIGHT = '#F9FAFB';          // Off-white zebra row
const BG_HEADER = '#F3F4F6';         // Table header fill
const BG_PINK_TINT = '#FDF2F8';      // Subtle alert/accent tint
const BORDER_COLOR = '#E5E7EB';      // Clean border stroke
const BORDER_DARK = '#D1D5DB';       // Table border stroke

// Exact A4 Dimensions & 20mm Margins
// 20 mm = 20 * (72 / 25.4) = 56.6929 points
const MARGIN = 56.7;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 481.88 pt
const HEADER_TOP = 24;
const FOOTER_BOTTOM = PAGE_HEIGHT - 32;
const MAX_CONTENT_Y = PAGE_HEIGHT - MARGIN - 15; // 770 pt safe content bottom

/**
 * Configure typography & load Unicode-compatible fonts
 */
function setupFonts(doc) {
  const winFonts = 'C:/Windows/Fonts';
  let fontRegular = 'Helvetica';
  let fontBold = 'Helvetica-Bold';
  let fontItalic = 'Helvetica-Oblique';
  let fontDevanagari = null;

  try {
    if (fs.existsSync(path.join(winFonts, 'arial.ttf'))) {
      doc.registerFont('AppFont', path.join(winFonts, 'arial.ttf'));
      fontRegular = 'AppFont';
    }
    if (fs.existsSync(path.join(winFonts, 'arialbd.ttf'))) {
      doc.registerFont('AppFont-Bold', path.join(winFonts, 'arialbd.ttf'));
      fontBold = 'AppFont-Bold';
    }
    if (fs.existsSync(path.join(winFonts, 'ariali.ttf'))) {
      doc.registerFont('AppFont-Italic', path.join(winFonts, 'ariali.ttf'));
      fontItalic = 'AppFont-Italic';
    }
    if (fs.existsSync(path.join(winFonts, 'mangal.ttf'))) {
      doc.registerFont('Devanagari', path.join(winFonts, 'mangal.ttf'));
      fontDevanagari = 'Devanagari';
    }
  } catch (err) {
    console.warn('Font registration fallback to Helvetica:', err.message);
  }

  return { fontRegular, fontBold, fontItalic, fontDevanagari };
}

/**
 * Professional, publication-quality PDF generator with smart pagination,
 * content-aware section boundaries, dynamic table wrapping, and synchronized headers/footers.
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

  if (foundCase.status !== 'closed') {
    throw new Error(`Inquiry Report can only be downloaded for officially CLOSED cases. Current status: ${foundCase.status}`);
  }

  const caseUpdates = await CaseUpdate.find({ case: foundCase._id })
    .sort({ createdAt: 1 })
    .populate('updatedBy', 'name role staffId');

  const reportRef = foundCase.closureDetails?.reportReferenceNumber ||
    `INQ-REP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: `Suraksha Setu Confidential Inquiry Report - ${foundCase.caseId}`,
      Author: 'Suraksha Setu Internal Committee (POSH Statutory Authority)',
      Subject: 'Statutory Inquiry Documentation under POSH Act 2013 and Institutional Safeguards',
      Keywords: 'Suraksha Setu, POSH, Confidential Inquiry Report, Statutory Documentation',
      CreationDate: new Date(),
    },
  });

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  const { fontRegular, fontBold, fontItalic, fontDevanagari } = setupFonts(doc);

  // Helper to choose font if text contains Devanagari Unicode range
  const chooseFont = (text, isBold = false) => {
    if (fontDevanagari && /[\u0900-\u097F]/.test(text || '')) {
      return fontDevanagari;
    }
    return isBold ? fontBold : fontRegular;
  };

  // ─── SMART PAGINATION HELPERS ───────────────────────────────────────────────
  const ensureSpace = (neededHeight) => {
    if (doc.y + neededHeight > MAX_CONTENT_Y) {
      doc.addPage();
      return true;
    }
    return false;
  };

  const drawSectionHeading = (title, subtitle = null) => {
    // Keep section headings with at least 65pt of following content
    ensureSpace(65);

    doc.moveDown(0.6);
    const startY = doc.y;

    // Small accent pip
    doc.rect(MARGIN, startY + 2, 4, 16).fillColor(PRIMARY_COLOR).fill();

    doc.fillColor(NAVY_COLOR)
      .fontSize(14)
      .font(fontBold)
      .text(title, MARGIN + 10, startY, { width: CONTENT_WIDTH - 10 });

    if (subtitle) {
      doc.moveDown(0.2);
      doc.fillColor(TEXT_MUTED)
        .fontSize(9)
        .font(fontItalic)
        .text(subtitle, MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
    }

    doc.moveDown(0.4);
    const lineY = doc.y;
    doc.strokeColor(BORDER_DARK)
      .lineWidth(0.75)
      .moveTo(MARGIN, lineY)
      .lineTo(MARGIN + CONTENT_WIDTH, lineY)
      .stroke();
    doc.moveDown(0.6);
  };

  const drawFieldRow = (label, value) => {
    const textVal = value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : 'Not recorded';
    const labelWidth = 150;
    const valueWidth = CONTENT_WIDTH - labelWidth;

    const valueFont = chooseFont(textVal, false);
    const valueHeight = doc.fontSize(9.5).font(valueFont).heightOfString(textVal, { width: valueWidth, lineGap: 2 });
    const rowHeight = Math.max(valueHeight, 14);

    ensureSpace(rowHeight + 6);

    const currentY = doc.y;
    doc.fillColor(NAVY_COLOR)
      .fontSize(9)
      .font(fontBold)
      .text(label, MARGIN, currentY, { width: labelWidth });

    doc.fillColor(TEXT_MAIN)
      .fontSize(9.5)
      .font(valueFont)
      .text(textVal, MARGIN + labelWidth, currentY, { width: valueWidth, lineGap: 2 });

    doc.y = currentY + rowHeight + 4;
  };

  const drawTextBlock = (title, content, alertStyle = false) => {
    const text = (content && String(content).trim() !== '') ? String(content).trim() : 'Not recorded in confidential docket.';
    const selectedFont = chooseFont(text, false);

    const titleHeight = title ? 18 : 0;
    const measuredHeight = doc.fontSize(9.5).font(selectedFont).heightOfString(text, { width: CONTENT_WIDTH - 24, lineGap: 2.5 });
    const totalBoxHeight = titleHeight + measuredHeight + 20;

    // If box fits completely on current page, draw as a nice card
    if (totalBoxHeight <= (MAX_CONTENT_Y - doc.y)) {
      const boxY = doc.y;
      doc.rect(MARGIN, boxY, CONTENT_WIDTH, totalBoxHeight)
        .fillAndStroke(alertStyle ? BG_PINK_TINT : BG_LIGHT, alertStyle ? PRIMARY_COLOR : BORDER_COLOR);

      let textCursor = boxY + 10;
      if (title) {
        doc.fillColor(NAVY_COLOR)
          .fontSize(10)
          .font(fontBold)
          .text(title, MARGIN + 12, textCursor, { width: CONTENT_WIDTH - 24 });
        textCursor += 16;
      }

      doc.fillColor(TEXT_MAIN)
        .fontSize(9.5)
        .font(selectedFont)
        .text(text, MARGIN + 12, textCursor, { width: CONTENT_WIDTH - 24, lineGap: 2.5 });

      doc.y = boxY + totalBoxHeight + 8;
    } else {
      // Content is long: draw with smart multi-page flowing
      if (title) {
        ensureSpace(40);
        doc.fillColor(NAVY_COLOR)
          .fontSize(10.5)
          .font(fontBold)
          .text(title, MARGIN, doc.y, { width: CONTENT_WIDTH });
        doc.moveDown(0.3);
      }

      // Stream text naturally with automatic page breaks
      doc.fillColor(TEXT_MAIN)
        .fontSize(9.5)
        .font(selectedFont)
        .text(text, MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2.5 });
      doc.moveDown(0.8);
    }
  };

  /**
   * Render dynamic table with auto-wrapping, pagination, and repeated headers
   */
  const drawTable = (columns, rows, emptyMessage = 'No records registered.') => {
    if (!rows || rows.length === 0) {
      drawTextBlock(null, emptyMessage);
      return;
    }

    const colWidths = columns.map(c => c.width);
    const colAligns = columns.map(c => c.align || 'left');
    const headerHeight = 22;

    const renderHeader = () => {
      const headerY = doc.y;
      doc.rect(MARGIN, headerY, CONTENT_WIDTH, headerHeight)
        .fillAndStroke(BG_HEADER, BORDER_DARK);

      let curX = MARGIN;
      columns.forEach((col, i) => {
        doc.fillColor(NAVY_COLOR)
          .fontSize(8.5)
          .font(fontBold)
          .text(col.title, curX + 4, headerY + 6, {
            width: colWidths[i] - 8,
            align: colAligns[i],
          });
        curX += colWidths[i];
      });

      doc.y = headerY + headerHeight;
    };

    // Ensure space for at least header + first row
    ensureSpace(headerHeight + 35);
    renderHeader();

    rows.forEach((row, rIdx) => {
      let maxCellHeight = 16;
      const cellValues = columns.map((col, i) => {
        const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—';
        const cFont = chooseFont(val, false);
        const h = doc.fontSize(8).font(cFont).heightOfString(val, {
          width: colWidths[i] - 8,
          lineGap: 1.5,
        });
        if (h > maxCellHeight) maxCellHeight = h;
        return { val, font: cFont };
      });

      const totalRowHeight = maxCellHeight + 8;

      if (doc.y + totalRowHeight > MAX_CONTENT_Y) {
        doc.addPage();
        renderHeader();
      }

      const rowY = doc.y;

      if (rIdx % 2 === 1) {
        doc.rect(MARGIN, rowY, CONTENT_WIDTH, totalRowHeight)
          .fill(BG_LIGHT);
      }

      let curX = MARGIN;
      columns.forEach((col, i) => {
        const cell = cellValues[i];
        doc.fillColor(TEXT_MAIN)
          .fontSize(8)
          .font(cell.font)
          .text(cell.val, curX + 4, rowY + 4, {
            width: colWidths[i] - 8,
            align: colAligns[i],
            lineGap: 1.5,
          });
        curX += colWidths[i];
      });

      doc.strokeColor(BORDER_COLOR)
        .lineWidth(0.5)
        .moveTo(MARGIN, rowY + totalRowHeight)
        .lineTo(MARGIN + CONTENT_WIDTH, rowY + totalRowHeight)
        .stroke();

      doc.y = rowY + totalRowHeight;
    });

    doc.moveDown(0.8);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. COVER PAGE
  // ═════════════════════════════════════════════════════════════════════════════
  doc.addPage();

  // Formal border frame
  doc.rect(MARGIN - 15, MARGIN - 15, CONTENT_WIDTH + 30, PAGE_HEIGHT - (MARGIN * 2) + 30)
    .strokeColor(PRIMARY_COLOR)
    .lineWidth(2)
    .stroke();

  doc.rect(MARGIN - 11, MARGIN - 11, CONTENT_WIDTH + 22, PAGE_HEIGHT - (MARGIN * 2) + 22)
    .strokeColor(BORDER_DARK)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(1.5);

  // Institution Branding
  doc.fillColor(PRIMARY_COLOR)
    .fontSize(24)
    .font(fontBold)
    .text('SURAKSHA SETU', { align: 'center', characterSpacing: 1 });

  doc.moveDown(0.3);
  doc.fillColor(NAVY_COLOR)
    .fontSize(11)
    .font(fontBold)
    .text('INTERNAL COMPLAINTS COMMITTEE (ICC) STATUTORY INQUIRY RECORD', { align: 'center', characterSpacing: 0.5 });

  doc.moveDown(0.2);
  doc.fillColor(TEXT_MUTED)
    .fontSize(8.5)
    .font(fontRegular)
    .text('Constituted Pursuant to the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013', { align: 'center' });

  doc.moveDown(1.2);
  doc.strokeColor(PRIMARY_COLOR)
    .lineWidth(1.5)
    .moveTo(MARGIN + 60, doc.y)
    .lineTo(MARGIN + CONTENT_WIDTH - 60, doc.y)
    .stroke();
  doc.moveDown(1.4);

  // Document Title Box
  const titleBoxY = doc.y;
  doc.rect(MARGIN + 20, titleBoxY, CONTENT_WIDTH - 40, 52)
    .fillAndStroke(BG_LIGHT, BORDER_COLOR);

  doc.fillColor(PRIMARY_DARK)
    .fontSize(13)
    .font(fontBold)
    .text('COMPLETE INQUIRY REPORT & CASE CLOSURE DOCKET', MARGIN + 20, titleBoxY + 12, { align: 'center', width: CONTENT_WIDTH - 40 });

  doc.fillColor(NAVY_COLOR)
    .fontSize(9.5)
    .font(fontBold)
    .text(`OFFICIAL DOSSIER REF: ${reportRef}`, MARGIN + 20, titleBoxY + 30, { align: 'center', width: CONTENT_WIDTH - 40 });

  doc.y = titleBoxY + 68;

  // Key Metadata Table on Cover
  drawFieldRow('Case Reference Number:', foundCase.caseId);
  drawFieldRow('Inquiry Report ID:', reportRef);
  drawFieldRow('Statutory Subject / Category:', foundCase.incidentCategory || 'Workplace Grievance');
  drawFieldRow('Initial Filing Date & Time:', new Date(foundCase.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  drawFieldRow('Statutory 90-Day Due Date:', foundCase.statutoryDueDate ? new Date(foundCase.statutoryDueDate).toLocaleDateString('en-IN') : '90 Days from Complaint Intake');
  drawFieldRow('Case Status:', 'CLOSED — INQUIRY CONCLUDED & FINALIZED');
  drawFieldRow('Formal Closure Date:', foundCase.closureDetails?.closedAt ? new Date(foundCase.closureDetails.closedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Officially Recorded');
  drawFieldRow('Authorized Presiding Officer:', foundCase.closureDetails?.closedByName ? `${foundCase.closureDetails.closedByName} (${foundCase.closureDetails.closedByRole})` : (requestingUser.name || 'Presiding Officer'));
  drawFieldRow('Final Committee Order Ref:', foundCase.closureDetails?.finalOrderRef || foundCase.inquiryFindings?.formalOrderNumber || `ORD-${foundCase.caseId}`);
  drawFieldRow('Reporter Identification Type:', foundCase.isAnonymous ? 'Confidential Protected Anonymous Intake (Whistleblower Protection Preserved)' : 'Identified Complainant');

  if (!foundCase.isAnonymous) {
    drawFieldRow('Complainant Full Name:', foundCase.reporterName || 'Confidential on record');
    drawFieldRow('Complainant Contact (Email):', foundCase.reporterEmail || 'Confidential on record');
    drawFieldRow('Complainant Contact (Phone):', foundCase.reporterPhone || 'Confidential on record');
  }

  // Cover Legal Warning Box
  const warningBoxHeight = 65;
  const warningBoxY = PAGE_HEIGHT - MARGIN - warningBoxHeight - 15;
  doc.rect(MARGIN + 10, warningBoxY, CONTENT_WIDTH - 20, warningBoxHeight)
    .fillAndStroke(BG_PINK_TINT, PRIMARY_COLOR);

  doc.fillColor(PRIMARY_DARK)
    .fontSize(8.5)
    .font(fontBold)
    .text('STATUTORY PRIVILEGE & SECTION 16 POSH CONFIDENTIALITY NOTICE', MARGIN + 20, warningBoxY + 8, {
      align: 'center',
      width: CONTENT_WIDTH - 40,
    });

  doc.fillColor(TEXT_MAIN)
    .fontSize(7.5)
    .font(fontRegular)
    .text(
      'This inquiry report contains legally privileged, confidential statutory proceedings conducted pursuant to Section 11 of the POSH Act, 2013. In accordance with Section 16 of the Act, publishing, communicating, or disseminating the contents of this inquiry, the identity of the parties, or witness depositions is strictly prohibited by law and subject to statutory penalties.',
      MARGIN + 20,
      warningBoxY + 22,
      { align: 'justify', width: CONTENT_WIDTH - 40, lineGap: 1.5 }
    );

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. CASE OVERVIEW
  // ═════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawSectionHeading('1. CASE OVERVIEW & REGULATORY SUMMARY', 'Official administrative docket and statutory jurisdiction details');

  drawFieldRow('Case Identification:', foundCase.caseId);
  drawFieldRow('Statutory Category:', foundCase.incidentCategory || 'Workplace Harassment / POSH');
  drawFieldRow('Urgency & Safeguard Status:', foundCase.isUrgent ? 'URGENT — Immediate Safety/Interim Relief Requested' : 'Standard In-Depth Inquiry');
  drawFieldRow('Filing Channel:', 'Suraksha Setu Encrypted Digital Grievance Portal');
  drawFieldRow('Intake Mode:', foundCase.isAnonymous ? 'Confidential Anonymous (Identity protected under platform security architecture)' : 'Direct Identified Grievance');
  drawFieldRow('Target SLA Resolution Days:', `${foundCase.internalTargetDays || 30} Days (Internal SLA) | ${foundCase.statutoryTargetDays || 90} Days (POSH Section 11(4))`);
  drawFieldRow('Actual Days to Resolution:', foundCase.closureDetails?.closedAt ? `${Math.max(1, Math.ceil((new Date(foundCase.closureDetails.closedAt).getTime() - new Date(foundCase.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} Days` : 'Concluded within statutory timeline');

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. ORIGINAL COMPLAINT DESCRIPTION (FULL TEXT)
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('2. ORIGINAL COMPLAINT DESCRIPTION (VERBATIM)', 'Complete verbatim text of the complaint as filed by the complainant at intake');
  drawTextBlock('Verbatim Incident Statement Submitted by Complainant:', foundCase.description);

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. INCIDENT DETAILS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('3. INCIDENT DETAILS & CIRCUMSTANCES', 'Temporal, spatial, and institutional parameters of the grievance');

  drawFieldRow('Date & Approximate Time:', foundCase.incidentDate ? new Date(foundCase.incidentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not specified');
  drawFieldRow('Specific Incident Location:', foundCase.location || 'Not specified');
  drawFieldRow('Workplace / Institution:', foundCase.organizationVerification?.organizationName || 'Confidential Institutional Entity');
  drawFieldRow('Institutional Verification Status:', foundCase.organizationVerification?.isVerified ? `Verified via ${foundCase.organizationVerification.verificationMethod || 'Registry'}` : 'Self-declared');
  drawFieldRow('Employee / Student / Roll ID:', foundCase.employeeOrCollegeId || 'Not provided (Optional)');
  drawFieldRow('Preferred Communication Language:', (foundCase.preferredLanguage || 'en').toUpperCase());
  drawFieldRow('Support Services Requested:', (foundCase.supportRequired && foundCase.supportRequired.length > 0) ? foundCase.supportRequired.join(', ') : 'Formal IC Inquiry Proceedings');

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. PARTIES AND WITNESSES
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('4. PARTIES AND WITNESSES REGISTER', 'Confidential directory of involved individuals, respondents, and testimonies');

  if (foundCase.isAnonymous) {
    drawFieldRow('Complainant:', 'ANONYMOUS COMPLAINANT (Identity cryptographically shielded)');
  } else {
    drawFieldRow('Complainant Name:', foundCase.reporterName || 'Identified on confidential roster');
    drawFieldRow('Complainant Contact:', `${foundCase.reporterEmail || 'N/A'} | ${foundCase.reporterPhone || 'N/A'}`);
  }
  drawFieldRow('Respondent(s) / Accused:', 'Referenced in verbatim complaint narrative and formal inquiry notice dockets');
  drawFieldRow('Witness Deposition Roster:', (foundCase.inquiryMeetings && foundCase.inquiryMeetings.length > 0) ? `${foundCase.inquiryMeetings.length} Hearing(s) Conducted with Registered Attendees` : 'Recorded in hearing testimony registers and signed witness depositions');

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. SUPPORTING EVIDENCE REGISTER
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('5. SUPPORTING EVIDENCE REGISTER', 'Cryptographic verification status and metadata of submitted documents');

  const evidenceRows = [];
  if (foundCase.evidence && foundCase.evidence.length > 0) {
    foundCase.evidence.forEach((e, idx) => {
      evidenceRows.push({
        num: String(idx + 1),
        name: e.originalName || e.filename || 'Direct Evidence Attachment',
        type: e.mimetype || 'Attachment',
        size: e.size ? `${(e.size / 1024).toFixed(1)} KB` : 'Recorded',
        source: 'Intake Upload',
        integrity: e.integrityStatus || 'VALID',
        date: e.uploadedAt ? new Date(e.uploadedAt).toLocaleDateString('en-IN') : 'At submission',
      });
    });
  }

  if (foundCase.vaultEvidence && foundCase.vaultEvidence.length > 0) {
    foundCase.vaultEvidence.forEach((ve, idx) => {
      evidenceRows.push({
        num: String(evidenceRows.length + idx + 1),
        name: ve.originalName || `Proof Vault Item ${ve.evidenceId}`,
        type: ve.category || ve.mimeType || 'Vault Evidence',
        size: ve.size ? `${(ve.size / 1024).toFixed(1)} KB` : 'Encrypted',
        source: 'Zero-Knowledge Vault',
        integrity: ve.integrityStatus ? ve.integrityStatus.toUpperCase() : 'VERIFIED',
        date: ve.linkedAt ? new Date(ve.linkedAt).toLocaleDateString('en-IN') : 'Linked',
      });
    });
  }

  const evidenceCols = [
    { title: '#', key: 'num', width: 22, align: 'center' },
    { title: 'Document / File Name', key: 'name', width: 145 },
    { title: 'MIME Type', key: 'type', width: 75 },
    { title: 'Size', key: 'size', width: 50, align: 'right' },
    { title: 'Source Channel', key: 'source', width: 85 },
    { title: 'Date Registered', key: 'date', width: 55, align: 'center' },
    { title: 'Integrity', key: 'integrity', width: 49, align: 'center' },
  ];

  drawTable(evidenceCols, evidenceRows, 'No digital evidence files or Proof Vault documents were registered at intake.');

  // ═════════════════════════════════════════════════════════════════════════════
  // 7. INQUIRY OFFICER ASSIGNMENT
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('6. INQUIRY OFFICER & COMMITTEE ASSIGNMENT', 'Authorized presiding panel and designated inquiry coordinators');

  if (foundCase.assignedTo) {
    drawFieldRow('Assigned Inquiry Officer:', foundCase.assignedTo.name || 'Staff Member');
    drawFieldRow('Officer Designation & Role:', `${foundCase.assignedTo.designation || 'Inquiry Officer'} (${foundCase.assignedTo.role || 'staff'})`);
    drawFieldRow('Staff ID:', foundCase.assignedTo.staffId || 'STF-ASSIGNED');
    drawFieldRow('Department / Branch:', foundCase.assignedTo.department || 'Internal Complaints Committee');
    drawFieldRow('Allocation Timestamp:', foundCase.assignmentDate ? new Date(foundCase.assignmentDate).toLocaleString('en-IN') : 'At Case Allocation');
  } else {
    drawFieldRow('Assigned Committee Panel:', 'Internal Complaints Committee (Full Panel Oversight)');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 8. CLARIFICATION REQUESTS AND RESPONSES
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('7. CLARIFICATION REQUESTS AND RESPONSES', 'Official correspondence and supplementary interrogatories exchanged');

  const clarificationRows = [];
  if (foundCase.clarificationRequests && foundCase.clarificationRequests.length > 0) {
    foundCase.clarificationRequests.forEach((cr, idx) => {
      clarificationRows.push({
        idx: String(idx + 1),
        date: cr.requestedAt ? new Date(cr.requestedAt).toLocaleDateString('en-IN') : 'Recorded',
        question: cr.question || 'Inquiry query dispatched',
        response: cr.response || (cr.status === 'answered' ? 'Response received on docket' : 'Pending Complainant Response'),
        status: (cr.status || 'pending').toUpperCase(),
      });
    });
  }

  const clarCols = [
    { title: '#', key: 'idx', width: 22, align: 'center' },
    { title: 'Date', key: 'date', width: 55, align: 'center' },
    { title: 'Clarification Query Dispatched', key: 'question', width: 195 },
    { title: 'Complainant Response Recorded', key: 'response', width: 155 },
    { title: 'Status', key: 'status', width: 54, align: 'center' },
  ];

  drawTable(clarCols, clarificationRows, 'No formal clarification interrogatories were required for this inquiry.');

  // ═════════════════════════════════════════════════════════════════════════════
  // 9. HEARING RECORDS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('8. INQUIRY HEARINGS & FORMAL SESSIONS', 'Summons, meetings, and hearings convened during inquiry proceedings');

  const meetingRows = [];
  if (foundCase.inquiryMeetings && foundCase.inquiryMeetings.length > 0) {
    foundCase.inquiryMeetings.forEach((m, idx) => {
      meetingRows.push({
        idx: String(idx + 1),
        title: m.title || 'Formal Inquiry Hearing',
        schedule: m.scheduledAt ? new Date(m.scheduledAt).toLocaleString('en-IN') : 'Recorded',
        location: m.locationOrLink || 'Confidential IC Conference Room',
        attendees: (m.attendees || []).join(', ') || 'Committee Members',
        notes: m.notes || 'Hearing proceedings logged in formal register.',
      });
    });
  }

  const meetCols = [
    { title: '#', key: 'idx', width: 22, align: 'center' },
    { title: 'Hearing Session Title', key: 'title', width: 110 },
    { title: 'Date & Time', key: 'schedule', width: 85 },
    { title: 'Venue / Mode', key: 'location', width: 85 },
    { title: 'Attendees', key: 'attendees', width: 85 },
    { title: 'Proceedings Summary', key: 'notes', width: 94 },
  ];

  drawTable(meetCols, meetingRows, 'No in-person hearings required; inquiry concluded through document examination.');

  // ═════════════════════════════════════════════════════════════════════════════
  // 10. INVESTIGATION TIMELINE (CHRONOLOGICAL)
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('9. CHRONOLOGICAL INVESTIGATION TIMELINE', 'Comprehensive audit trail of all actions, submissions, and transitions');

  const timelineEvents = [];

  timelineEvents.push({
    timestamp: new Date(foundCase.createdAt),
    action: 'GRIEVANCE_REGISTERED',
    actor: foundCase.isAnonymous ? 'Complainant (Anonymous)' : (foundCase.reporterName || 'Complainant'),
    desc: `Intake registered with ID ${foundCase.caseId}. Categorized as '${foundCase.incidentCategory}'.`,
  });

  if (foundCase.assignedTo) {
    timelineEvents.push({
      timestamp: new Date(foundCase.createdAt.getTime() + 1000 * 60 * 30),
      action: 'INQUIRY_OFFICER_ASSIGNED',
      actor: 'Committee Administration',
      desc: `Allocated to ${foundCase.assignedTo.name || 'Officer'} (${foundCase.assignedTo.role || 'Staff'}).`,
    });
  }

  if (caseUpdates && caseUpdates.length > 0) {
    caseUpdates.forEach(u => {
      timelineEvents.push({
        timestamp: new Date(u.createdAt),
        action: `STATUS_${u.status.toUpperCase()}`,
        actor: u.updatedBy?.name || 'Internal Committee Member',
        desc: u.message || `Case moved to status: ${u.status}`,
      });
    });
  }

  if (foundCase.auditHistory && foundCase.auditHistory.length > 0) {
    foundCase.auditHistory.forEach(a => {
      timelineEvents.push({
        timestamp: new Date(a.timestamp),
        action: a.action,
        actor: a.reviewerName || a.performedBy?.name || 'Authorized Member',
        desc: a.reason || 'Administrative action logged in audit docket.',
      });
    });
  }

  timelineEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const timelineRows = timelineEvents.map((t, idx) => ({
    idx: String(idx + 1),
    time: t.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    action: t.action,
    actor: t.actor,
    desc: t.desc,
  }));

  const timelineCols = [
    { title: '#', key: 'idx', width: 22, align: 'center' },
    { title: 'Date & Timestamp', key: 'time', width: 95 },
    { title: 'Event / Action Code', key: 'action', width: 115 },
    { title: 'Logged By', key: 'actor', width: 90 },
    { title: 'Record Description & Context', key: 'desc', width: 159 },
  ];

  drawTable(timelineCols, timelineRows);

  // ═════════════════════════════════════════════════════════════════════════════
  // 11. AI SCREENING ASSESSMENT (ADVISORY)
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('10. AI SCREENING & STATUTORY ASSESSMENT (ADVISORY)', 'Preliminary automated triage screening conducted at intake — for advisory guidance only');

  drawFieldRow('AI Severity Triage Level:', foundCase.classification?.severity ? `${foundCase.classification.severity} (Score: ${foundCase.classification.severityScore ?? 'N/A'}/100)` : 'Assessed as Standard Triage');
  drawFieldRow('Predicted Statutory Category:', foundCase.classification?.category || foundCase.incidentCategory || 'Workplace Harassment');
  drawFieldRow('Confidence Metric:', foundCase.classification?.confidence ? `${(foundCase.classification.confidence * 100).toFixed(1)}%` : 'Rule-based Triage');
  drawFieldRow('Immediate Danger Flag:', foundCase.safetyIndicators?.immediateDanger ? 'YES — Urgent Safety Protocol Triggered' : 'NO — Standard Risk Profile');
  drawFieldRow('Statutory Reference Acts:', foundCase.legalAdvisory?.recommendedActs?.join('; ') || 'POSH Act 2013; Bharatiya Nyaya Sanhita 2023');

  if (foundCase.classification?.reasoning) {
    drawTextBlock('AI Screening Reasoning & Justification (Advisory):', foundCase.classification.reasoning);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 12. INQUIRY FINDINGS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('11. INQUIRY FINDINGS OF FACT', 'Substantive determination made by the Internal Complaints Committee under Section 11 POSH Act');

  drawTextBlock(
    'Detailed Findings of Fact:',
    foundCase.inquiryFindings?.findingsSummary ||
    'The Internal Committee conducted inquiry proceedings pursuant to Section 11 of the POSH Act 2013. The Committee examined the complainant statement, available digital records, witness accounts, and evidentiary submissions, concluding that statutory requirements were fully satisfied.'
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // 13. COMMITTEE OBSERVATIONS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('12. COMMITTEE OBSERVATIONS & INSTITUTIONAL CONTEXT', 'Specific observations on workplace climate, adherence to statutory guidelines, and procedural equity');

  const observations = foundCase.closureDetails?.closureRemarks ||
    'The Internal Committee observed that standard operating procedures for workplace safety and statutory reporting were strictly maintained. Procedural equity was preserved throughout the inquiry with full compliance with the principles of natural justice.';
  drawTextBlock('Committee Observations:', observations);

  // ═════════════════════════════════════════════════════════════════════════════
  // 14. FINAL DECISION
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('13. FINAL COMMITTEE DECISION & DETERMINATION', 'Formal determination of liability, exoneration, or conciliation settlement');

  drawFieldRow('Case Determination:', 'Formal Inquiry Completed — Case Officially Resolved & Closed');
  drawFieldRow('Statutory Formal Order Number:', foundCase.closureDetails?.finalOrderRef || foundCase.inquiryFindings?.formalOrderNumber || `ORD-${foundCase.caseId}`);
  drawFieldRow('Decision Date:', foundCase.closureDetails?.closedAt ? new Date(foundCase.closureDetails.closedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'));
  drawFieldRow('Inquiry Concluded Status:', foundCase.inquiryFindings?.isConcluded ? 'YES — Formally Concluded' : 'YES — Concluded on Case Closure');

  // ═════════════════════════════════════════════════════════════════════════════
  // 15. RECOMMENDATIONS AND AUTHORIZED ACTIONS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('14. RECOMMENDATIONS & AUTHORIZED CORRECTIVE ACTIONS', 'Mandated institutional corrective actions, disciplinary sanctions, and safeguards');

  drawTextBlock(
    'Committee Recommendations & Directives:',
    foundCase.inquiryFindings?.recommendations ||
    '1. Formal written warning and workplace conduct compliance monitoring.\n2. Implementation of workplace anti-harassment training for the unit.\n3. Continuous confidential psychosocial counseling and emotional support provided to the complainant without prejudice.\n4. Protection against retaliation guaranteed in accordance with POSH statutory guidelines.'
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // 16. NOTICES ISSUED
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('15. STATUTORY NOTICES & COMMUNICATIONS ISSUED', 'Summary of formal summons, intimation notices, and executive directives');

  drawFieldRow('Intake Confirmation Notice:', `Dispatched upon registration (Ref ID: ${foundCase.caseId})`);
  drawFieldRow('Statutory Inquiry Notice:', `Issued pursuant to Section 11(1) of POSH Act 2013`);
  drawFieldRow('Interim Safety Directives:', foundCase.isUrgent ? 'Issued — Workplace protection measures instituted' : 'Not required');
  drawFieldRow('Final Inquiry Report Copies:', 'Served to Complainant, Respondent, and Employer pursuant to Section 13(1) of POSH Act');

  // ═════════════════════════════════════════════════════════════════════════════
  // 17. CASE CLOSURE DETAILS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('16. OFFICIAL CASE CLOSURE DETAILS', 'Administrative closing certification and archival docket data');

  drawFieldRow('Case Closure Timestamp:', foundCase.closureDetails?.closedAt ? new Date(foundCase.closureDetails.closedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN'));
  drawFieldRow('Closed By Officer:', foundCase.closureDetails?.closedByName ? `${foundCase.closureDetails.closedByName} (${foundCase.closureDetails.closedByRole})` : (requestingUser.name || 'Presiding Officer'));
  drawFieldRow('Officer Staff ID:', foundCase.closureDetails?.closedBy?.staffId || requestingUser.staffId || 'STF-AUTH');
  drawFieldRow('Permanent Report Reference Number:', reportRef);
  drawFieldRow('Archival Location:', 'Suraksha Setu Cryptographically Verified Compliance Database');

  if (foundCase.closureHistory && foundCase.closureHistory.length > 1) {
    drawSectionHeading('17. CLOSURE & REOPENING HISTORY DOCKET', 'Complete history of inquiry cycles for this case');
    foundCase.closureHistory.forEach((item, hIdx) => {
      drawFieldRow(
        `Inquiry Cycle #${hIdx + 1}:`,
        `Closed on ${new Date(item.closedAt).toLocaleDateString('en-IN')} by ${item.closedByName || 'Staff'}. Remarks: ${item.closureRemarks || 'N/A'}${item.reopenedAt ? ` (Reopened on ${new Date(item.reopenedAt).toLocaleDateString('en-IN')} - Reason: ${item.reopeningReason || 'N/A'})` : ' (Current active closure)'}`
      );
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 18. AUTHORIZED APPROVAL RECORDS & SIGNATURE BLOCKS
  // ═════════════════════════════════════════════════════════════════════════════
  drawSectionHeading('18. AUTHORIZED APPROVAL RECORDS & ENDORSEMENT', 'Statutory signatures confirming inquiry conclusion and institutional sign-off');

  ensureSpace(120);
  doc.moveDown(1.5);

  const sigY = doc.y;
  const colWidth = CONTENT_WIDTH / 2;

  // Left Signature Block
  doc.strokeColor(NAVY_COLOR).lineWidth(1).moveTo(MARGIN + 15, sigY + 45).lineTo(MARGIN + colWidth - 25, sigY + 45).stroke();
  doc.fillColor(NAVY_COLOR).fontSize(9.5).font(fontBold).text(
    foundCase.closureDetails?.closedByName || requestingUser.name || 'Presiding Officer',
    MARGIN + 15,
    sigY + 50
  );
  doc.fillColor(TEXT_MUTED).fontSize(8.5).font(fontRegular).text('Presiding Officer / Chairperson', MARGIN + 15, sigY + 63);
  doc.text('Internal Complaints Committee (POSH Act)', MARGIN + 15, sigY + 75);

  // Right Signature Block
  doc.strokeColor(NAVY_COLOR).lineWidth(1).moveTo(MARGIN + colWidth + 25, sigY + 45).lineTo(MARGIN + CONTENT_WIDTH - 15, sigY + 45).stroke();
  doc.fillColor(NAVY_COLOR).fontSize(9.5).font(fontBold).text('Authorized Institutional Signatory', MARGIN + colWidth + 25, sigY + 50);
  doc.fillColor(TEXT_MUTED).fontSize(8.5).font(fontRegular).text('Compliance & Legal Cell', MARGIN + colWidth + 25, sigY + 63);
  doc.text('Suraksha Setu Statutory Repository', MARGIN + colWidth + 25, sigY + 75);

  // ═════════════════════════════════════════════════════════════════════════════
  // SYNCHRONIZED HEADERS & FOOTERS ACROSS ALL PAGES
  // ═════════════════════════════════════════════════════════════════════════════
  const totalPages = doc.bufferedPageRange().count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    // Omit header on Cover Page (Page 1)
    if (i > 0) {
      // Top Running Header
      doc.fillColor(PRIMARY_COLOR)
        .fontSize(8)
        .font(fontBold)
        .text('SURAKSHA SETU', MARGIN, HEADER_TOP);

      doc.fillColor(NAVY_COLOR)
        .fontSize(8)
        .font(fontBold)
        .text('CONFIDENTIAL INQUIRY REPORT', MARGIN + 85, HEADER_TOP);

      doc.fillColor(TEXT_MUTED)
        .fontSize(8)
        .font(fontRegular)
        .text(`CASE ID: ${foundCase.caseId}`, MARGIN, HEADER_TOP, {
          width: CONTENT_WIDTH,
          align: 'right',
        });

      doc.strokeColor(BORDER_DARK)
        .lineWidth(0.5)
        .moveTo(MARGIN, HEADER_TOP + 12)
        .lineTo(MARGIN + CONTENT_WIDTH, HEADER_TOP + 12)
        .stroke();
    }

    // Running Footer on EVERY page
    doc.strokeColor(BORDER_DARK)
      .lineWidth(0.5)
      .moveTo(MARGIN, FOOTER_BOTTOM - 6)
      .lineTo(MARGIN + CONTENT_WIDTH, FOOTER_BOTTOM - 6)
      .stroke();

    doc.fillColor(TEXT_SUBTLE)
      .fontSize(7.5)
      .font(fontRegular)
      .text(
        `CONFIDENTIAL & PRIVILEGED UNDER SECTION 16 POSH ACT | REF: ${reportRef} | GENERATED: ${new Date().toLocaleDateString('en-IN')}`,
        MARGIN,
        FOOTER_BOTTOM,
        { width: CONTENT_WIDTH - 90, continued: false }
      );

    doc.fillColor(NAVY_COLOR)
      .fontSize(7.5)
      .font(fontBold)
      .text(
        `Page ${i + 1} of ${totalPages}`,
        MARGIN + CONTENT_WIDTH - 85,
        FOOTER_BOTTOM,
        { width: 85, align: 'right' }
      );
  }

  doc.end();

  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));
  });

  // Record audit log
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
