#!/usr/bin/env node

import * as path from 'path';
import { generateInvoice, generateInvoiceBuffer, loadInvoiceFromFile } from './invoice-generator';

// Re-export for library usage
export { generateInvoice, generateInvoiceBuffer, loadInvoiceFromFile } from './invoice-generator';
export * from './types';

async function main(): Promise<void> {
  console.log('German Invoice PDF Generator');
  console.log('================================\n');

  const args = process.argv.slice(2);
  const inputFile = args[0] || 'invoice_input.json';
  const outputFile = args[1];

  try {
    const inputPath = path.resolve(inputFile);
    console.log(`Loading invoice data from: ${inputPath}`);

    const invoiceData = loadInvoiceFromFile(inputPath);
    console.log(`   Invoice Number: ${invoiceData.invoiceNumber}`);
    console.log(`   Recipient: ${invoiceData.recipient.name}`);
    console.log(`   Line Items: ${invoiceData.lineItems.length}`);

    console.log('\nGenerating PDF...');
    const generatedPath = await generateInvoice(invoiceData, outputFile);

    console.log(`\nDone! Invoice saved to: ${path.resolve(generatedPath)}`);
  } catch (error) {
    console.error('\nError generating invoice:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
