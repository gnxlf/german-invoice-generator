import { InvoiceData } from './types';
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
export declare function generateInvoiceBuffer(invoiceData: InvoiceData): Promise<Buffer>;
/**
 * Generates an invoice PDF and saves it to the filesystem.
 * For serverless environments, use `generateInvoiceBuffer()` instead.
 *
 * @param invoiceData - The invoice data to generate the PDF from
 * @param outputPath - Optional custom output path. If not provided, generates filename from invoice number
 * @returns Promise resolving to the path where the PDF was saved
 * @throws Error if invoice data validation fails or file cannot be written
 */
export declare function generateInvoice(invoiceData: InvoiceData, outputPath?: string): Promise<string>;
export declare function loadInvoiceFromFile(filePath: string): InvoiceData;
export * from './types';
//# sourceMappingURL=invoice-generator.d.ts.map