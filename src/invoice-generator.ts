import * as fs from 'fs';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, Content, TableCell, StyleDictionary } from 'pdfmake/interfaces';
import { InvoiceData, InvoiceTotals, LineItem, ShippingCost } from './types';

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

function loadLogo(invoiceData: InvoiceData): string | null {
  if (!invoiceData.logo) {
    return null;
  }

  if (invoiceData.logo.logoBase64) {
    return invoiceData.logo.logoBase64;
  }

  if (invoiceData.logo.logoPath) {
    try {
      const logoPath = path.resolve(invoiceData.logo.logoPath);
      const logoBuffer = fs.readFileSync(logoPath);
      const extension = path.extname(logoPath).toLowerCase().replace('.', '');
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn(`Warning: Could not load logo from ${invoiceData.logo.logoPath}`);
      return null;
    }
  }

  return null;
}

function generateDocumentDefinition(invoiceData: InvoiceData): TDocumentDefinitions {
  const currency = invoiceData.currency || 'EUR';
  const accentColor = invoiceData.accentColor || '#374151';
  const totals = calculateTotals(invoiceData.lineItems, invoiceData.shipping);
  const logo = loadLogo(invoiceData);

  const styles: StyleDictionary = {
    header: {
      fontSize: 28,
      bold: false,
      color: '#111827',
      margin: [0, 0, 0, 10],
    },
    subheader: {
      fontSize: 11,
      bold: true,
      color: '#6b7280',
      characterSpacing: 1,
      margin: [0, 10, 0, 8],
    },
    invoiceNumber: {
      fontSize: 9,
      bold: true,
      color: '#111827',
    },
    tableHeader: {
      bold: true,
      fontSize: 9,
      color: '#6b7280',
      fillColor: '#f9fafb',
      margin: [5, 10, 5, 10],
    },
    tableCell: {
      fontSize: 9,
      color: '#000000',
      margin: [5, 8, 5, 8],
    },
    tableCellRight: {
      fontSize: 9,
      color: '#000000',
      alignment: 'right' as const,
      margin: [5, 8, 5, 8],
    },
    totalLabel: {
      fontSize: 9,
      color: '#000000',
      margin: [0, 1, 0, 1],
    },
    totalValue: {
      fontSize: 9,
      color: '#000000',
      alignment: 'right' as const,
      margin: [0, 1, 0, 1],
    },
    grossTotalLabel: {
      fontSize: 11,
      bold: true,
      color: '#000000',
    },
    grossTotal: {
      fontSize: 11,
      bold: true,
      color: '#000000',
    },
    footer: {
      fontSize: 8,
      color: '#6b7280',
    },
    senderSmall: {
      fontSize: 8,
      color: '#6b7280',
    },
    recipientName: {
      fontSize: 11,
      bold: true,
    },
    recipientAddress: {
      fontSize: 11,
    },
    metaLabel: {
      fontSize: 9,
      color: '#6b7280',
    },
    metaValue: {
      fontSize: 9,
      bold: true,
    },
  };

  const senderLine = `${invoiceData.sender.name} · ${invoiceData.sender.street} · ${invoiceData.sender.postalCode} ${invoiceData.sender.city}`;

  const recipientBlock: Content[] = [
    { text: senderLine, style: 'senderSmall', margin: [0, 0, 0, 5] },
    { text: invoiceData.recipient.name, style: 'recipientName' },
  ];
  if (invoiceData.recipient.addressLine2) {
    recipientBlock.push({ text: invoiceData.recipient.addressLine2, style: 'recipientAddress' });
  }
  recipientBlock.push({ text: invoiceData.recipient.street, style: 'recipientAddress' });
  recipientBlock.push({
    text: `${invoiceData.recipient.postalCode} ${invoiceData.recipient.city}`,
    style: 'recipientAddress',
  });
  if (invoiceData.recipient.country) {
    recipientBlock.push({ text: invoiceData.recipient.country, style: 'recipientAddress' });
  }

  const headerContent: Content[] = [];

  if (logo) {
    const maxWidth = invoiceData.logo?.maxWidth || 150;
    const maxHeight = invoiceData.logo?.maxHeight || 60;

    headerContent.push({
      columns: [
        {
          width: '*',
          stack: [{ text: 'RECHNUNG', style: 'header' }],
        },
        {
          width: 'auto',
          image: logo,
          fit: [maxWidth, maxHeight],
          alignment: 'right' as const,
        },
      ],
      margin: [0, 0, 0, 20],
    } as Content);
  } else {
    headerContent.push({
      text: 'RECHNUNG',
      style: 'header',
      margin: [0, 0, 0, 20],
    });
  }

  const metaRows: Content[] = [
    {
      columns: [
        { text: 'Rechnungsnummer:', style: 'metaLabel', width: 95 },
        { text: invoiceData.invoiceNumber, style: 'invoiceNumber', width: '*' },
      ],
      margin: [0, 0, 0, 3] as [number, number, number, number],
    },
  ];

  if (invoiceData.orderNumber) {
    metaRows.push({
      columns: [
        { text: 'Bestellnummer:', style: 'metaLabel', width: 95 },
        { text: invoiceData.orderNumber, style: 'metaValue', width: '*' },
      ],
      margin: [0, 0, 0, 3] as [number, number, number, number],
    });
  }

  metaRows.push(
    {
      columns: [
        { text: 'Rechnungsdatum:', style: 'metaLabel', width: 95 },
        { text: formatDate(invoiceData.issueDate), style: 'metaValue', width: '*' },
      ],
      margin: [0, 0, 0, 3] as [number, number, number, number],
    },
    {
      columns: [
        { text: 'Lieferdatum:', style: 'metaLabel', width: 95 },
        { text: invoiceData.deliveryDate, style: 'metaValue', width: '*' },
      ],
      margin: [0, 0, 0, 3] as [number, number, number, number],
    }
  );

  const metaData: Content = {
    columns: [
      {
        width: '*',
        stack: recipientBlock,
        margin: [0, 15, 0, 0],
      },
      {
        width: 180,
        stack: metaRows,
        alignment: 'right',
      },
    ],
    margin: [0, 0, 0, 30],
  };

  const tableBody: TableCell[][] = [
    [
      { text: 'Pos.', style: 'tableHeader', alignment: 'center' },
      { text: 'Beschreibung', style: 'tableHeader' },
      { text: 'Menge', style: 'tableHeader', alignment: 'right' },
      { text: 'Einheit', style: 'tableHeader', alignment: 'center' },
      { text: 'Einzelpreis', style: 'tableHeader', alignment: 'right' },
      { text: 'USt.', style: 'tableHeader', alignment: 'right' },
      { text: 'Gesamt (brutto)', style: 'tableHeader', alignment: 'right' },
    ],
  ];

  invoiceData.lineItems.forEach((item, index) => {
    const position = item.position || index + 1;
    const lineGross = item.quantity * item.unitPrice;
    const fillColor = index % 2 === 1 ? '#f9fafb' : undefined;

    tableBody.push([
      { text: position.toString(), style: 'tableCell', alignment: 'center', fillColor },
      { text: item.description, style: 'tableCell', fillColor },
      { text: item.quantity.toString(), style: 'tableCellRight', fillColor },
      { text: item.unit, style: 'tableCell', alignment: 'center', fillColor },
      { text: formatCurrency(item.unitPrice, currency), style: 'tableCellRight', fillColor },
      { text: `${item.taxRate}%`, style: 'tableCellRight', fillColor },
      { text: formatCurrency(lineGross, currency), style: 'tableCellRight', fillColor },
    ]);
  });

  const totalsBody: TableCell[][] = [];

  if (totals.shipping.gross > 0) {
    const shippingDescription = invoiceData.shipping?.description || 'Versandkosten';
    totalsBody.push([
      { text: `${shippingDescription}:`, style: 'totalLabel', colSpan: 6, alignment: 'right' },
      {}, {}, {}, {}, {},
      { text: formatCurrency(totals.shipping.gross, currency), style: 'totalValue' },
    ]);
  }

  totalsBody.push([
    { text: 'Gesamt Netto:', style: 'totalLabel', colSpan: 6, alignment: 'right' },
    {}, {}, {}, {}, {},
    { text: formatCurrency(totals.netTotal, currency), style: 'totalValue' },
  ]);

  const sortedTaxRates = Array.from(totals.taxAmounts.entries()).sort((a, b) => a[0] - b[0]);
  for (const [rate, amount] of sortedTaxRates) {
    totalsBody.push([
      { text: `${rate}% Umsatzsteuer:`, style: 'totalLabel', colSpan: 6, alignment: 'right' },
      {}, {}, {}, {}, {},
      { text: formatCurrency(amount, currency), style: 'totalValue' },
    ]);
  }

  const notesSection: Content[] = invoiceData.notes
    ? [
        { text: 'Hinweise', style: 'subheader', margin: [0, 10, 0, 5] },
        { text: invoiceData.notes, fontSize: 9, color: '#000000' },
      ]
    : [];

  const addressColumn = [
    invoiceData.sender.name,
    invoiceData.sender.street,
    `${invoiceData.sender.postalCode} ${invoiceData.sender.city}`,
  ];
  if (invoiceData.sender.country) {
    addressColumn.push(invoiceData.sender.country);
  }
  if (invoiceData.sender.email) {
    addressColumn.push(invoiceData.sender.email);
  }

  const taxColumn: string[] = [];
  if (invoiceData.taxIdentifiers.ustIdNr) {
    taxColumn.push(`USt.-IdNr.: ${invoiceData.taxIdentifiers.ustIdNr}`);
  }
  if (invoiceData.taxIdentifiers.steuernummer) {
    taxColumn.push(`Steuernummer: ${invoiceData.taxIdentifiers.steuernummer}`);
  }

  const bankColumn = [
    invoiceData.bankDetails.bankName,
    `IBAN: ${invoiceData.bankDetails.iban}`,
    `BIC: ${invoiceData.bankDetails.bic}`,
  ];
  if (invoiceData.bankDetails.accountHolder) {
    bankColumn.push(invoiceData.bankDetails.accountHolder);
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [50, 50, 50, 80],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.3,
    },
    styles,
    content: [
      ...headerContent,
      metaData,
      {
        table: {
          headerRows: 1,
          widths: [30, '*', 40, 45, 70, 40, 80],
          body: tableBody,
        },
        layout: {
          hLineWidth: (i: number, node: any) => {
            if (i === 0) return 0;
            if (i === 1) return 1;
            if (i === node.table.body.length) return 1;
            return 0;
          },
          vLineWidth: () => 0,
          hLineColor: () => '#000000',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
      {
        table: {
          widths: [30, '*', 40, 45, 70, 40, 80],
          body: totalsBody,
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 1,
          paddingBottom: () => 1,
        },
        margin: [0, 10, 0, 0],
      },
      {
        table: {
          widths: ['*', 'auto', 80],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { 
                text: 'Gesamtbetrag (brutto):', 
                style: 'grossTotalLabel', 
                border: [false, true, false, false],
                borderColor: ['#000000', '#000000', '#000000', '#000000'],
                alignment: 'right',
                margin: [0, 4, 0, 0],
                noWrap: true,
              },
              { 
                text: formatCurrency(totals.grossTotal, currency), 
                style: 'grossTotal', 
                border: [false, true, false, false],
                borderColor: ['#000000', '#000000', '#000000', '#000000'],
                alignment: 'right',
                margin: [0, 4, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 1 : 0),
          vLineWidth: () => 0,
          hLineColor: () => '#000000',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
        margin: [0, 6, 0, 25],
      },
      ...notesSection,
    ],
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 50,
              y1: 0,
              x2: 545,
              y2: 0,
              lineWidth: 0.5,
              lineColor: '#e5e7eb',
            },
          ],
        },
        {
          columns: [
            {
              width: '*',
              text: addressColumn.join('\n'),
              style: 'footer',
              margin: [50, 8, 0, 0],
            },
            {
              width: '*',
              text: taxColumn.join('\n'),
              style: 'footer',
              margin: [0, 8, 0, 0],
            },
            {
              width: '*',
              text: bankColumn.join('\n'),
              style: 'footer',
              margin: [0, 8, 50, 0],
            },
          ],
        },
      ],
    }),
  };

  return docDefinition;
}

export async function generateInvoice(invoiceData: InvoiceData, outputPath?: string): Promise<string> {
  if (!invoiceData.taxIdentifiers.steuernummer && !invoiceData.taxIdentifiers.ustIdNr) {
    throw new Error('At least one tax identifier (Steuernummer or USt-IdNr.) is required for German compliance');
  }

  if (invoiceData.lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }

  const filename = outputPath || `Rechnung_${invoiceData.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const printer = new PdfPrinter({
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  });

  const docDefinition = generateDocumentDefinition(invoiceData);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    pdfDoc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      fs.writeFileSync(filename, pdfBuffer);
      console.log(`✅ Invoice PDF generated successfully: ${filename}`);
      resolve(filename);
    });

    pdfDoc.on('error', (error: Error) => {
      reject(error);
    });

    pdfDoc.end();
  });
}

export function loadInvoiceFromFile(filePath: string): InvoiceData {
  const absolutePath = path.resolve(filePath);
  const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(jsonContent) as InvoiceData;
}

export * from './types';
