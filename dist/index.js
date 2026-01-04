#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInvoiceFromFile = exports.generateInvoiceBuffer = exports.generateInvoice = void 0;
const path = __importStar(require("path"));
const invoice_generator_1 = require("./invoice-generator");
// Re-export for library usage
var invoice_generator_2 = require("./invoice-generator");
Object.defineProperty(exports, "generateInvoice", { enumerable: true, get: function () { return invoice_generator_2.generateInvoice; } });
Object.defineProperty(exports, "generateInvoiceBuffer", { enumerable: true, get: function () { return invoice_generator_2.generateInvoiceBuffer; } });
Object.defineProperty(exports, "loadInvoiceFromFile", { enumerable: true, get: function () { return invoice_generator_2.loadInvoiceFromFile; } });
__exportStar(require("./types"), exports);
async function main() {
    console.log('German Invoice PDF Generator');
    console.log('================================\n');
    const args = process.argv.slice(2);
    const inputFile = args[0] || 'invoice_input.json';
    const outputFile = args[1];
    try {
        const inputPath = path.resolve(inputFile);
        console.log(`Loading invoice data from: ${inputPath}`);
        const invoiceData = (0, invoice_generator_1.loadInvoiceFromFile)(inputPath);
        console.log(`   Invoice Number: ${invoiceData.invoiceNumber}`);
        console.log(`   Recipient: ${invoiceData.recipient.name}`);
        console.log(`   Line Items: ${invoiceData.lineItems.length}`);
        console.log('\nGenerating PDF...');
        const generatedPath = await (0, invoice_generator_1.generateInvoice)(invoiceData, outputFile);
        console.log(`\nDone! Invoice saved to: ${path.resolve(generatedPath)}`);
    }
    catch (error) {
        console.error('\nError generating invoice:');
        if (error instanceof Error) {
            console.error(`   ${error.message}`);
        }
        else {
            console.error(error);
        }
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map