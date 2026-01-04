import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import { InvoiceData, InvoiceTotals, LineItem, ShippingCost } from './types';

// Farben als RGB-Werte (0-1)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (/^\d{2}\.\d{2}\.\d{4}/.test(dateStr)) {
    return dateStr;
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDominantTaxRate(lineItems: LineItem[]): number {
  const grossByTaxRate = new Map<number, number>();

  for (const item of lineItems) {
    const lineGross = item.quantity * item.unitPrice;
    const currentGross = grossByTaxRate.get(item.taxRate) || 0;
    grossByTaxRate.set(item.taxRate, currentGross + lineGross);
  }

  let dominantRate = 19;
  let maxGross = 0;

  for (const [rate, gross] of grossByTaxRate) {
    if (gross > maxGross) {
      maxGross = gross;
      dominantRate = rate;
    }
  }

  return dominantRate;
}

function calculateTotals(lineItems: LineItem[], shipping?: ShippingCost): InvoiceTotals {
  let itemsGrossTotal = 0;
  const taxAmounts = new Map<number, number>();

  for (const item of lineItems) {
    const lineGross = item.quantity * item.unitPrice;
    itemsGrossTotal += lineGross;

    const lineNet = lineGross / (1 + item.taxRate / 100);
    const lineTax = lineGross - lineNet;
    const currentTax = taxAmounts.get(item.taxRate) || 0;
    taxAmounts.set(item.taxRate, currentTax + lineTax);
  }

  const shippingGross = shipping?.amount || 0;
  const shippingTaxRate = shippingGross > 0 ? getDominantTaxRate(lineItems) : 0;
  const shippingNet = shippingGross / (1 + shippingTaxRate / 100);
  const shippingTax = shippingGross - shippingNet;

  if (shippingGross > 0 && shippingTax > 0) {
    const currentTax = taxAmounts.get(shippingTaxRate) || 0;
    taxAmounts.set(shippingTaxRate, currentTax + shippingTax);
  }

  const grossTotal = itemsGrossTotal + shippingGross;

  let totalTax = 0;
  taxAmounts.forEach((amount) => {
    totalTax += amount;
  });

  return {
    itemsGrossTotal,
    netTotal: grossTotal - totalTax,
    taxAmounts,
    grossTotal,
    shipping: {
      gross: shippingGross,
      net: shippingNet,
      tax: shippingTax,
      taxRate: shippingTaxRate,
    },
  };
}

async function loadLogo(invoiceData: InvoiceData): Promise<Uint8Array | null> {
  if (!invoiceData.logo) {
    return null;
  }

  if (invoiceData.logo.logoBase64) {
    const base64Data = invoiceData.logo.logoBase64.replace(/^data:image\/\w+;base64,/, '');
    return Uint8Array.from(Buffer.from(base64Data, 'base64'));
  }

  if (invoiceData.logo.logoPath) {
    try {
      const logoPath = path.resolve(invoiceData.logo.logoPath);
      const logoBuffer = fs.readFileSync(logoPath);
      return new Uint8Array(logoBuffer);
    } catch (error) {
      console.warn(`Warning: Could not load logo from ${invoiceData.logo.logoPath}`);
      return null;
    }
  }

  return null;
}

function getLogoType(invoiceData: InvoiceData): 'png' | 'jpg' | null {
  if (!invoiceData.logo) return null;
  
  if (invoiceData.logo.logoBase64) {
    if (invoiceData.logo.logoBase64.includes('image/png')) return 'png';
    return 'jpg';
  }
  
  if (invoiceData.logo.logoPath) {
    const ext = path.extname(invoiceData.logo.logoPath).toLowerCase();
    if (ext === '.png') return 'png';
    return 'jpg';
  }
  
  return null;
}

// Hilfsfunktionen für Text-Rendering
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
): void {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

function drawRightAlignedText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
): void {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - textWidth,
    y,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

function drawLine(
  page: PDFPage,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thickness: number = 0.5,
  color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
): void {
  page.drawLine({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    thickness,
    color: rgb(color.r, color.g, color.b),
  });
}

function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(color.r, color.g, color.b),
  });
}

/**
 * Bricht Text in mehrere Zeilen um, wenn er breiter als maxWidth ist
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Validates invoice data for German compliance requirements.
 * @throws Error if validation fails
 */
function validateInvoiceData(invoiceData: InvoiceData): void {
  if (!invoiceData.taxIdentifiers.steuernummer && !invoiceData.taxIdentifiers.ustIdNr) {
    throw new Error('At least one tax identifier (Steuernummer or USt-IdNr.) is required for German compliance');
  }

  if (invoiceData.lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }
}

/**
 * Generates an invoice PDF and returns it as a Buffer.
 * Ideal for serverless environments (Vercel, AWS Lambda, etc.) where filesystem access is limited.
 * 
 * @param invoiceData - The invoice data to generate the PDF from
 * @returns Promise resolving to a Buffer containing the PDF data
 * @throws Error if invoice data validation fails
 * 
 * @example
 * // In a serverless API route (e.g., Vercel/Next.js)
 * const buffer = await generateInvoiceBuffer(invoiceData);
 * return new Response(buffer, {
 *   headers: {
 *     'Content-Type': 'application/pdf',
 *     'Content-Disposition': 'attachment; filename="invoice.pdf"'
 *   }
 * });
 */
export async function generateInvoiceBuffer(invoiceData: InvoiceData): Promise<Buffer> {
  validateInvoiceData(invoiceData);

  const currency = invoiceData.currency || 'EUR';
  const totals = calculateTotals(invoiceData.lineItems, invoiceData.shipping);

  // PDF Dokument erstellen
  const pdfDoc = await PDFDocument.create();
  
  // Standard-Fonts laden
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Farben definieren
  const grayText = hexToRgb('#6b7280');
  const blackText = { r: 0, g: 0, b: 0 };
  const lightGrayBg = hexToRgb('#f9fafb');
  const lineGray = hexToRgb('#e5e7eb');

  // A4 Seite erstellen (595.28 x 841.89 Punkte)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  let currentY = pageHeight - margin;

  // === LOGO ===
  const logoData = await loadLogo(invoiceData);
  const logoType = getLogoType(invoiceData);
  
  if (logoData && logoType) {
    try {
      const logoImage = logoType === 'png' 
        ? await pdfDoc.embedPng(logoData)
        : await pdfDoc.embedJpg(logoData);
      
      const maxWidth = invoiceData.logo?.maxWidth || 150;
      const maxHeight = invoiceData.logo?.maxHeight || 60;
      
      const scale = Math.min(maxWidth / logoImage.width, maxHeight / logoImage.height);
      const scaledWidth = logoImage.width * scale;
      const scaledHeight = logoImage.height * scale;
      
      page.drawImage(logoImage, {
        x: pageWidth - margin - scaledWidth,
        y: currentY - scaledHeight + 15, // Logo höher positionieren
        width: scaledWidth,
        height: scaledHeight,
      });
    } catch (error) {
      console.warn('Warning: Could not embed logo');
    }
  }

  // === HEADER: RECHNUNG ===
  drawText(page, 'RECHNUNG', margin, currentY - 20, helvetica, 28, blackText);
  currentY -= 80; // Mehr Abstand nach dem Logo

  // === ABSENDER-ZEILE (klein) ===
  const senderLine = `${invoiceData.sender.name} · ${invoiceData.sender.street} · ${invoiceData.sender.postalCode} ${invoiceData.sender.city}`;
  drawText(page, senderLine, margin, currentY, helvetica, 8, grayText);
  currentY -= 20;

  // === EMPFÄNGER ===
  drawText(page, invoiceData.recipient.name, margin, currentY, helveticaBold, 11, blackText);
  currentY -= 14;

  if (invoiceData.recipient.addressLine2) {
    drawText(page, invoiceData.recipient.addressLine2, margin, currentY, helvetica, 11, blackText);
    currentY -= 14;
  }

  drawText(page, invoiceData.recipient.street, margin, currentY, helvetica, 11, blackText);
  currentY -= 14;

  drawText(page, `${invoiceData.recipient.postalCode} ${invoiceData.recipient.city}`, margin, currentY, helvetica, 11, blackText);
  currentY -= 14;

  if (invoiceData.recipient.country) {
    drawText(page, invoiceData.recipient.country, margin, currentY, helvetica, 11, blackText);
    currentY -= 14;
  }

  // === META-DATEN (rechts ausgerichtet) ===
  const metaX = pageWidth - margin - 180;
  const metaLabelX = metaX;
  const metaValueX = pageWidth - margin;
  let metaY = pageHeight - margin - 60;

  // Rechnungsnummer
  drawText(page, 'Rechnungsnummer:', metaLabelX, metaY, helvetica, 9, grayText);
  drawRightAlignedText(page, invoiceData.invoiceNumber, metaValueX, metaY, helveticaBold, 9, blackText);
  metaY -= 14;

  // Bestellnummer (optional)
  if (invoiceData.orderNumber) {
    drawText(page, 'Bestellnummer:', metaLabelX, metaY, helvetica, 9, grayText);
    drawRightAlignedText(page, invoiceData.orderNumber, metaValueX, metaY, helveticaBold, 9, blackText);
    metaY -= 14;
  }

  // Rechnungsdatum
  drawText(page, 'Rechnungsdatum:', metaLabelX, metaY, helvetica, 9, grayText);
  drawRightAlignedText(page, formatDate(invoiceData.issueDate), metaValueX, metaY, helveticaBold, 9, blackText);
  metaY -= 14;

  // Lieferdatum
  drawText(page, 'Lieferdatum:', metaLabelX, metaY, helvetica, 9, grayText);
  drawRightAlignedText(page, invoiceData.deliveryDate, metaValueX, metaY, helveticaBold, 9, blackText);

  currentY -= 40;

  // === TABELLE ===
  // Spaltenbreiten definieren
  const colWidths = [30, 180, 40, 45, 70, 40, 80]; // Pos, Beschr, Menge, Einh, Einzelpr, USt, Gesamt
  const colX = [margin];
  for (let i = 1; i < colWidths.length; i++) {
    colX.push(colX[i - 1] + colWidths[i - 1]);
  }
  const tableRight = margin + colWidths.reduce((a, b) => a + b, 0);

  const rowHeight = 22;
  const headerHeight = 28;

  // Tabellen-Header Hintergrund
  drawRect(page, margin, currentY - headerHeight, contentWidth, headerHeight, lightGrayBg);

  // Header-Texte
  const headerY = currentY - 18;
  drawText(page, 'Pos.', colX[0] + 5, headerY, helveticaBold, 9, grayText);
  drawText(page, 'Beschreibung', colX[1] + 5, headerY, helveticaBold, 9, grayText);
  drawRightAlignedText(page, 'Menge', colX[2] + colWidths[2] - 5, headerY, helveticaBold, 9, grayText);
  drawText(page, 'Einheit', colX[3] + 5, headerY, helveticaBold, 9, grayText);
  drawRightAlignedText(page, 'Einzelpreis', colX[4] + colWidths[4] - 5, headerY, helveticaBold, 9, grayText);
  drawRightAlignedText(page, 'USt.', colX[5] + colWidths[5] - 5, headerY, helveticaBold, 9, grayText);
  drawRightAlignedText(page, 'Gesamt (brutto)', colX[6] + colWidths[6] - 5, headerY, helveticaBold, 9, grayText);

  currentY -= headerHeight;

  // Header-Linie unten
  drawLine(page, margin, currentY, tableRight, currentY, 1, blackText);

  // Zeilen
  const lineHeight = 11; // Zeilenhöhe für mehrzeiligen Text
  const descriptionMaxWidth = colWidths[1] - 10; // Maximale Breite für Beschreibung

  for (let i = 0; i < invoiceData.lineItems.length; i++) {
    const item = invoiceData.lineItems[i];
    const position = item.position || i + 1;
    const lineGross = item.quantity * item.unitPrice;

    // Beschreibung in Zeilen umbrechen
    const descriptionLines = wrapText(item.description, helvetica, 9, descriptionMaxWidth);
    const numLines = descriptionLines.length;
    const dynamicRowHeight = Math.max(rowHeight, numLines * lineHeight + 10);

    // Alternierende Hintergrundfarbe
    if (i % 2 === 1) {
      drawRect(page, margin, currentY - dynamicRowHeight, contentWidth, dynamicRowHeight, lightGrayBg);
    }

    const cellY = currentY - 15;

    drawText(page, position.toString(), colX[0] + 10, cellY, helvetica, 9, blackText);
    
    // Mehrzeilige Beschreibung zeichnen
    for (let lineIdx = 0; lineIdx < descriptionLines.length; lineIdx++) {
      drawText(page, descriptionLines[lineIdx], colX[1] + 5, cellY - (lineIdx * lineHeight), helvetica, 9, blackText);
    }
    
    drawRightAlignedText(page, item.quantity.toString(), colX[2] + colWidths[2] - 5, cellY, helvetica, 9, blackText);
    drawText(page, item.unit, colX[3] + 10, cellY, helvetica, 9, blackText);
    drawRightAlignedText(page, formatCurrency(item.unitPrice, currency), colX[4] + colWidths[4] - 5, cellY, helvetica, 9, blackText);
    drawRightAlignedText(page, `${item.taxRate}%`, colX[5] + colWidths[5] - 5, cellY, helvetica, 9, blackText);
    drawRightAlignedText(page, formatCurrency(lineGross, currency), colX[6] + colWidths[6] - 5, cellY, helvetica, 9, blackText);

    currentY -= dynamicRowHeight;

    // Hellgrauer Trennstrich zwischen Zeilen (nicht nach der letzten)
    if (i < invoiceData.lineItems.length - 1) {
      drawLine(page, margin, currentY, tableRight, currentY, 1, lineGray);
    }
  }

  // Tabelle abschließende Linie
  drawLine(page, margin, currentY, tableRight, currentY, 1, blackText);

  currentY -= 20;

  // === SUMMEN ===
  const sumLabelX = colX[5] + colWidths[5] - 5;
  const sumValueX = colX[6] + colWidths[6] - 5;

  // Versandkosten (falls vorhanden)
  if (totals.shipping.gross > 0) {
    const shippingDescription = invoiceData.shipping?.description || 'Versandkosten';
    drawRightAlignedText(page, `${shippingDescription}:`, sumLabelX, currentY, helvetica, 9, blackText);
    drawRightAlignedText(page, formatCurrency(totals.shipping.gross, currency), sumValueX, currentY, helvetica, 9, blackText);
    currentY -= 14;
  }

  // Gesamt Netto
  drawRightAlignedText(page, 'Gesamt Netto:', sumLabelX, currentY, helvetica, 9, blackText);
  drawRightAlignedText(page, formatCurrency(totals.netTotal, currency), sumValueX, currentY, helvetica, 9, blackText);
  currentY -= 14;

  // Umsatzsteuer-Zeilen
  const sortedTaxRates = Array.from(totals.taxAmounts.entries()).sort((a, b) => a[0] - b[0]);
  for (const [rate, amount] of sortedTaxRates) {
    drawRightAlignedText(page, `${rate}% Umsatzsteuer:`, sumLabelX, currentY, helvetica, 9, blackText);
    drawRightAlignedText(page, formatCurrency(amount, currency), sumValueX, currentY, helvetica, 9, blackText);
    currentY -= 14;
  }

  currentY -= 6;

  // Rechnungsbetrag mit Linie
  const rechnungsbetragLabel = 'Rechnungsbetrag:';
  const rechnungsbetragLabelWidth = helveticaBold.widthOfTextAtSize(rechnungsbetragLabel, 11);
  drawLine(page, sumLabelX - rechnungsbetragLabelWidth, currentY + 4, sumValueX, currentY + 4, 1, blackText);
  drawRightAlignedText(page, rechnungsbetragLabel, sumLabelX, currentY - 8, helveticaBold, 11, blackText);
  drawRightAlignedText(page, formatCurrency(totals.grossTotal, currency), sumValueX, currentY - 8, helveticaBold, 11, blackText);

  currentY -= 40;

  // === HINWEISE ===
  if (invoiceData.notes) {
    drawText(page, 'HINWEISE', margin, currentY, helveticaBold, 11, grayText);
    currentY -= 16;
    drawText(page, invoiceData.notes, margin, currentY, helvetica, 9, blackText);
    currentY -= 20;
  }

  // === FOOTER ===
  const footerY = 60;

  // Trennlinie
  drawLine(page, margin, footerY + 15, pageWidth - margin, footerY + 15, 0.5, lineGray);

  // Spalte 1: Adresse
  const footerCol1X = margin;
  let footerLineY = footerY;
  drawText(page, invoiceData.sender.name, footerCol1X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  drawText(page, invoiceData.sender.street, footerCol1X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  drawText(page, `${invoiceData.sender.postalCode} ${invoiceData.sender.city}`, footerCol1X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  if (invoiceData.sender.country) {
    drawText(page, invoiceData.sender.country, footerCol1X, footerLineY, helvetica, 8, grayText);
    footerLineY -= 10;
  }
  if (invoiceData.sender.email) {
    drawText(page, invoiceData.sender.email, footerCol1X, footerLineY, helvetica, 8, grayText);
  }

  // Spalte 2: Steuernummern
  const footerCol2X = margin + 180;
  footerLineY = footerY;
  if (invoiceData.taxIdentifiers.ustIdNr) {
    drawText(page, `USt.-IdNr.: ${invoiceData.taxIdentifiers.ustIdNr}`, footerCol2X, footerLineY, helvetica, 8, grayText);
    footerLineY -= 10;
  }
  if (invoiceData.taxIdentifiers.steuernummer) {
    drawText(page, `Steuernummer: ${invoiceData.taxIdentifiers.steuernummer}`, footerCol2X, footerLineY, helvetica, 8, grayText);
  }

  // Spalte 3: Bankverbindung
  const footerCol3X = margin + 360;
  footerLineY = footerY;
  drawText(page, invoiceData.bankDetails.bankName, footerCol3X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  drawText(page, `IBAN: ${invoiceData.bankDetails.iban}`, footerCol3X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  drawText(page, `BIC: ${invoiceData.bankDetails.bic}`, footerCol3X, footerLineY, helvetica, 8, grayText);
  footerLineY -= 10;
  if (invoiceData.bankDetails.accountHolder) {
    drawText(page, invoiceData.bankDetails.accountHolder, footerCol3X, footerLineY, helvetica, 8, grayText);
  }

  // PDF als Buffer zurückgeben
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates an invoice PDF and saves it to the filesystem.
 * For serverless environments, use `generateInvoiceBuffer()` instead.
 * 
 * @param invoiceData - The invoice data to generate the PDF from
 * @param outputPath - Optional custom output path. If not provided, generates filename from invoice number
 * @returns Promise resolving to the path where the PDF was saved
 * @throws Error if invoice data validation fails or file cannot be written
 */
export async function generateInvoice(invoiceData: InvoiceData, outputPath?: string): Promise<string> {
  const filename = outputPath || `Rechnung_${invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  
  const pdfBuffer = await generateInvoiceBuffer(invoiceData);
  fs.writeFileSync(filename, pdfBuffer);
  console.log(`✅ Invoice PDF generated successfully: ${filename}`);
  
  return filename;
}

export function loadInvoiceFromFile(filePath: string): InvoiceData {
  const absolutePath = path.resolve(filePath);
  const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(jsonContent) as InvoiceData;
}

export * from './types';
